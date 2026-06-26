import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, BarChart3, Lock } from 'lucide-react';
import { apiService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';


interface Node {
  id: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Link {
  source: string;
  target: string;
  type: string;
}

export const Graph: React.FC = () => {
  const { profile } = useProfile();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getCategoryColor = (type: string, isLight: boolean, isHighlighted: boolean) => {
    const t = type.toLowerCase();
    if (t === 'project') {
      return {
        fill: isLight ? '#FCE7F3' : '#50072B',
        stroke: isLight ? (isHighlighted ? '#DB2777' : '#EC4899') : (isHighlighted ? '#F472B6' : '#EC4899'),
        shadow: 'rgba(236, 72, 153, 0.45)'
      };
    } else if (t === 'skill') {
      return {
        fill: isLight ? '#DBEAFE' : '#1E3A8A',
        stroke: isLight ? (isHighlighted ? '#1D4ED8' : '#2563EB') : (isHighlighted ? '#60A5FA' : '#3B82F6'),
        shadow: 'rgba(59, 130, 246, 0.45)'
      };
    } else if (t === 'certification') {
      return {
        fill: isLight ? '#D1FAE5' : '#064E3B',
        stroke: isLight ? (isHighlighted ? '#047857' : '#059669') : (isHighlighted ? '#34D399' : '#10B981'),
        shadow: 'rgba(16, 185, 129, 0.45)'
      };
    } else if (t === 'role') {
      return {
        fill: isLight ? '#FFEDD5' : '#7C2D12',
        stroke: isLight ? (isHighlighted ? '#C2410C' : '#EA580C') : (isHighlighted ? '#FB923C' : '#F97316'),
        shadow: 'rgba(249, 115, 22, 0.45)'
      };
    }
    return {
      fill: isLight ? '#F3F4F6' : '#1F2937',
      stroke: isLight ? '#9CA3AF' : '#6B7280',
      shadow: 'rgba(156, 163, 175, 0.2)'
    };
  };

  const getNodeRadius = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'project') return 15;
    if (t === 'role') return 12;
    return 11;
  };

  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Drag, Pan, Zoom states
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  
  // Hover & Tooltip states
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const fetchGraph = async () => {
    try {
      const result = await apiService.getGraph();
      
      // Initialize node coordinates centered in the 800x500 area
      const initializedNodes = result.nodes.map((n: any, idx: number) => ({
        ...n,
        x: 400 + Math.cos(idx) * 160 + (Math.random() - 0.5) * 20,
        y: 250 + Math.sin(idx) * 160 + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0
      }));

      setNodes(initializedNodes);
      setLinks(result.links);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load graph cluster:', err);
      setError(err.message || 'FastAPI backend connection failure.');
    } finally {
      setLoading(false);
    }
  };

  // Load graph data from backend
  useEffect(() => {
    if (profile.resumeName) {
      fetchGraph();
    } else {
      setLoading(false);
    }
  }, [profile.resumeName]);

  // Non-passive wheel event listener registration to allow preventDefault safely
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      const zoomFactor = 0.08;
      if (e.deltaY < 0) {
        setZoom(prev => Math.min(prev + zoomFactor, 2.5));
      } else {
        setZoom(prev => Math.max(prev - zoomFactor, 0.5));
      }
    };

    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleNativeWheel);
    };
  }, [loading, error, nodes]);

  // Force simulation loop
  useEffect(() => {
    if (!profile.resumeName || loading || nodes.length === 0) return;

    let animationId: number;

    const runSimulation = () => {
      const nodeMap = new Map(nodes.map(n => [n.id, n]));

      // Physics variables
      const repulsion = 2400;
      const springLength = 160;
      const springK = 0.035;
      const damping = 0.85;
      const centerGravity = 0.003;

      // Update velocities
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        if (n1 === draggedNode) continue;

        // Force towards coordinates center (400, 250)
        n1.vx += (400 - n1.x) * centerGravity;
        n1.vy += (250 - n1.y) * centerGravity;

        // Node repulsion
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const distSq = dx * dx + dy * dy + 0.1;
          const dist = Math.sqrt(distSq);
          if (dist < 380) {
            const force = repulsion / distSq;
            n1.vx += (dx / dist) * force;
            n1.vy += (dy / dist) * force;
          }
        }
      }

      // Spring connection forces
      links.forEach(link => {
        const n1 = nodeMap.get(link.source);
        const n2 = nodeMap.get(link.target);
        if (!n1 || !n2) return;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        const force = (dist - springLength) * springK;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (n1 !== draggedNode) {
          n1.vx += fx;
          n1.vy += fy;
        }
        if (n2 !== draggedNode) {
          n2.vx -= fx;
          n2.vy -= fy;
        }
      });

      // Update coordinates
      nodes.forEach(n => {
        if (n === draggedNode) return;
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= damping;
        n.vy *= damping;

        // Boundary safety
        n.x = Math.max(30, Math.min(770, n.x));
        n.y = Math.max(30, Math.min(470, n.y));
      });

      // Render Canvas frame
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 800, 500);

          ctx.save();
          // Apply active Pan and Zoom transforms
          ctx.translate(pan.x, pan.y);
          ctx.scale(zoom, zoom);

          // Render link lines
          links.forEach(link => {
            const n1 = nodeMap.get(link.source);
            const n2 = nodeMap.get(link.target);
            if (!n1 || !n2) return;

            // Highlight connections of hovered node
            let isHighlighted = true;
            if (hoveredNode) {
              isHighlighted = (n1.id === hoveredNode.id || n2.id === hoveredNode.id);
            }

            ctx.globalAlpha = hoveredNode ? (isHighlighted ? 0.8 : 0.12) : 0.5;
            ctx.lineWidth = isHighlighted ? 1.5 : 1;
            
            // Connection line adaptation
            ctx.strokeStyle = isHighlighted 
              ? (isLight ? '#A12C5F' : 'rgba(193, 79, 125, 0.75)') 
              : (isLight ? 'rgba(161, 44, 95, 0.15)' : 'rgba(255, 255, 255, 0.06)');
            
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();

            // Midpoint relationship labels
            if (!hoveredNode || isHighlighted) {
              const midX = (n1.x + n2.x) / 2;
              const midY = (n1.y + n2.y) / 2;
              
              ctx.save();
              ctx.fillStyle = isLight ? '#6F5A64' : 'rgba(168, 168, 179, 0.25)';
              ctx.font = 'normal 6px monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Align text along link angle
              const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
              ctx.translate(midX, midY);
              ctx.rotate(angle);
              
              // Draw small text backing
              ctx.fillStyle = isLight ? '#FBF7F9' : '#14141B';
              ctx.fillRect(-14, -4, 28, 8);
              ctx.fillStyle = isLight ? '#720033' : 'rgba(193, 79, 125, 0.6)';
              ctx.fillText(link.type, 0, 0);
              ctx.restore();
            }

            // Floating connector particle
            const time = Date.now() * 0.0018;
            const t = (time + n1.x + n1.y) % 1.0;
            const px = n1.x + (n2.x - n1.x) * t;
            const py = n1.y + (n2.y - n1.y) * t;
            ctx.fillStyle = isLight ? '#A12C5F' : 'rgba(193, 79, 125, 0.6)';
            ctx.beginPath();
            ctx.arc(px, py, isHighlighted ? 2.5 : 1.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Render nodes
          nodes.forEach(n => {
            // Highlight checking
            let isHighlighted = true;
            if (hoveredNode) {
              isHighlighted = (n.id === hoveredNode.id || 
                links.some(l => 
                  (l.source === hoveredNode.id && l.target === n.id) || 
                  (l.target === hoveredNode.id && l.source === n.id)
                )
              );
            }

            ctx.globalAlpha = hoveredNode ? (isHighlighted ? 1.0 : 0.15) : 1.0;
            
            const colors = getCategoryColor(n.type, isLight, isHighlighted);
            const radius = getNodeRadius(n.type);

            // Shadow Blur Adaptation
            ctx.shadowBlur = isHighlighted ? 15 : 0;
            ctx.shadowColor = colors.shadow;

            // Node Colors
            ctx.fillStyle = colors.fill;
            ctx.strokeStyle = colors.stroke;
            ctx.lineWidth = isHighlighted ? 2.5 : 1.5;

            ctx.beginPath();
            ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0; // reset shadows

            // Node label text
            ctx.fillStyle = isHighlighted 
              ? (isLight ? '#231019' : '#F5F5F7') 
              : (isLight ? '#6F5A64' : '#A8A8B3');
            ctx.font = isHighlighted ? 'bold 9px sans-serif' : 'normal 8.5px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(n.id, n.x, n.y + radius + 11);
          });

          ctx.restore();
          ctx.globalAlpha = 1.0;
        }
      }

      animationId = requestAnimationFrame(runSimulation);
    };

    animationId = requestAnimationFrame(runSimulation);
    return () => cancelAnimationFrame(animationId);
  }, [nodes, links, draggedNode, loading, zoom, pan, hoveredNode]);

  if (!profile.resumeName) {
    return (
      <div className="p-8 min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center font-sans">
        <div className="w-full max-w-md p-8 rounded-2xl glass-panel text-center flex flex-col items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-wine via-brand-rose to-brand-pink" />
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary">
            <Lock className="w-8 h-8 text-brand-pink" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-display font-extrabold text-text-primary">Upload your resume to unlock AI analysis</h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              KAIRON maps project-skill clusters dynamically from your active digital twin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-dark text-text-secondary min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-brand-rose animate-spin" />
          <p className="font-mono text-sm tracking-wider">Loading Graph Cluster...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-dark text-text-secondary p-8 min-h-[500px]">
        <div className="w-full max-w-md p-6 rounded-2xl glass-panel text-center flex flex-col items-center gap-4 border border-brand-rose/25 bg-brand-wine/10">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-pink">
            <BarChart3 className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-display font-bold text-text-primary text-lg">Backend Connection Failed</h3>
          <p className="text-xs text-text-secondary leading-relaxed">{error}</p>
          <button 
            onClick={() => { setError(null); setLoading(true); fetchGraph(); }}
            className="px-4 py-2 bg-gradient-to-tr from-brand-wine via-brand-rose to-brand-pink hover:from-brand-rose hover:to-brand-pink text-text-primary text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer shadow-lg shadow-brand-wine/10"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Translate mouse event to Simulation space coordinates
  const getSimCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, mx: 0, my: 0 };
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    return {
      x: (mx - pan.x) / zoom,
      y: (my - pan.y) / zoom,
      mx,
      my
    };
  };

  // Drag and Pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y, mx, my } = getSimCoordinates(e.clientX, e.clientY);

    // Find node clicked
    const clickedNode = nodes.find(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      return dx * dx + dy * dy < 250; // check inside node bounds
    });

    if (clickedNode) {
      setDraggedNode(clickedNode);
    } else {
      setIsPanning(true);
      panStart.current = { x: mx - pan.x, y: my - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y, mx, my } = getSimCoordinates(e.clientX, e.clientY);

    if (draggedNode) {
      draggedNode.x = Math.max(30, Math.min(770, x));
      draggedNode.y = Math.max(30, Math.min(470, y));
    } else if (isPanning) {
      setPan({
        x: mx - panStart.current.x,
        y: my - panStart.current.y
      });
    } else {
      // Find hovered node to toggle tooltips
      const hovered = nodes.find(n => {
        const dx = n.x - x;
        const dy = n.y - y;
        return dx * dx + dy * dy < 250;
      });
      
      if (hovered) {
        setHoveredNode(hovered);
        setTooltipPos({ x: mx + 15, y: my + 15 });
      } else {
        setHoveredNode(null);
      }
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    setIsPanning(false);
  };

  // Zoom manipulation button handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.5));
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setHoveredNode(null);
  };



  // Graph Statistics
  const totalProjects = nodes.filter(n => n.type === 'Project').length;
  const totalSkills = nodes.filter(n => n.type === 'Skill').length;
  const totalCertifications = nodes.filter(n => n.type === 'Certification').length;
  const totalRoles = nodes.filter(n => n.type === 'Role').length;
  const totalRelationships = links.length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 relative"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-text-primary mb-2">Knowledge Graph</h1>
          <p className="text-sm text-text-secondary">Explore project-centric connections mapped inside your Career Twin.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-secondary font-mono mr-2 bg-white/2 border border-white/5 px-3 py-1.5 rounded-lg">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isLight ? '#2563EB' : '#3B82F6' }} /> 
              Skill
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isLight ? '#DB2777' : '#EC4899' }} /> 
              Project
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isLight ? '#059669' : '#10B981' }} /> 
              Certification
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isLight ? '#EA580C' : '#F97316' }} /> 
              Role
            </span>
          </div>
        </div>
      </div>

      {/* Statistics & Canvas wrapper Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Canvas Physics Card */}
        <div className="xl:col-span-3 p-6 rounded-2xl glass-panel relative border border-white/5 shadow-2xl overflow-hidden flex flex-col items-center">
          
          {/* Zoom & Pan Overlay Toolbar */}
          <div className="absolute top-8 right-8 flex gap-1 bg-[#14141B]/80 backdrop-blur-md p-1.5 rounded-xl border border-white/5 z-10">
            <button 
              onClick={handleZoomIn} 
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={handleZoomOut} 
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button 
              onClick={handleReset} 
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="graph-canvas bg-bg-dark/20 rounded-xl max-w-full cursor-grab active:cursor-grabbing border border-white/3"
          />

          {/* Canvas Floating Tooltips (HTML overlay) */}
          <AnimatePresence>
            {hoveredNode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                style={{ top: tooltipPos.y, left: tooltipPos.x }}
                className="absolute pointer-events-none p-3.5 rounded-xl border border-brand-rose/25 bg-[#14141B]/95 backdrop-blur-md shadow-2xl flex flex-col gap-1 z-30 min-w-[140px] text-left font-sans"
              >
                <span className="text-[9px] font-mono tracking-widest text-brand-pink font-extrabold uppercase leading-none mb-1">
                  {hoveredNode.type} Node
                </span>
                <span className="text-xs text-text-primary font-bold font-display leading-tight">{hoveredNode.id}</span>
                <span className="text-[10px] text-text-secondary leading-normal mt-1 block">
                  {hoveredNode.type === 'Skill' 
                    ? 'Part of Career Twin index.' 
                    : 'Interactive workspace project.'
                  }
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Statistics Card */}
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-2xl glass-panel flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2 border-b border-white/5 pb-3">
              <BarChart3 className="w-4.5 h-4.5 text-brand-pink" />
              Graph Statistics
            </h3>
            
            <div className="flex flex-col gap-3">
              {[
                { title: 'Total Projects', val: totalProjects, color: 'text-indigo-400' },
                { title: 'Total Skills', val: totalSkills, color: 'text-brand-pink' },
                { title: 'Total Certifications', val: totalCertifications, color: 'text-emerald-400' },
                { title: 'Total Roles', val: totalRoles, color: 'text-amber-400' },
                { title: 'Total Relationships', val: totalRelationships, color: 'text-text-primary' }
              ].map((stat, sidx) => (
                <div key={sidx} className="p-3 bg-white/2 rounded-xl border border-white/5 flex items-center justify-between">
                  <span className="text-xs text-text-secondary">{stat.title}</span>
                  <span className={`text-base font-bold font-mono ${stat.color || 'text-text-primary'}`}>
                    {stat.val}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-brand-wine/10 border border-brand-rose/15 rounded-xl text-[11px] text-text-secondary leading-relaxed font-sans mt-1">
              Drag nodes to customize the spring simulation. Scroll the canvas to scale vector fields or click/drag background space to pan coordinates.
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
