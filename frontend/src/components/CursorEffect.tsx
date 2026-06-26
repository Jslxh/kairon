import React, { useEffect, useRef } from 'react';

export const CursorEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isHovering = useRef(false);
  const hoverScale = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.targetX = e.clientX;
      mouse.current.targetY = e.clientY;
      
      // Initialize start coordinates on first move
      if (mouse.current.x === 0 && mouse.current.y === 0) {
        mouse.current.x = e.clientX;
        mouse.current.y = e.clientY;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Track hover interactions
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInteractive = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') !== null ||
        target.closest('a') !== null ||
        target.classList.contains('glass-panel-interactive') ||
        target.classList.contains('cursor-pointer') ||
        target.tagName === 'CANVAS';

      if (isInteractive) {
        isHovering.current = true;
      }
    };

    const handleMouseOut = () => {
      isHovering.current = false;
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    // Particles array
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      size: number;
      color: string;
    }
    const particles: Particle[] = [];

    // Animation Loop
    let animationId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth lerp for mouse coordinates
      mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.12;
      mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.12;

      // Handle hover scaling interpolation
      const targetScale = isHovering.current ? 2.2 : 1.0;
      hoverScale.current += (targetScale - hoverScale.current) * 0.15;

      // Only draw if mouse has moved at least once
      if (mouse.current.x !== 0 && mouse.current.y !== 0) {
        // Draw soft cursor glow behind elements
        const glowRadius = 32 * hoverScale.current;
        const gradient = ctx.createRadialGradient(
          mouse.current.x,
          mouse.current.y,
          0,
          mouse.current.x,
          mouse.current.y,
          glowRadius
        );

        // Apple Vision Pro style soft wine-pink glow
        const glowColor = isHovering.current ? 'rgba(193, 79, 125, 0.18)' : 'rgba(161, 44, 95, 0.08)';
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(0.5, 'rgba(114, 0, 51, 0.02)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.current.x, mouse.current.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Emit subtle micro-particles when mouse moves
        const dx = Math.abs(mouse.current.targetX - mouse.current.x);
        const dy = Math.abs(mouse.current.targetY - mouse.current.y);
        
        if ((dx > 1 || dy > 1) && Math.random() < 0.25) {
          particles.push({
            x: mouse.current.x,
            y: mouse.current.y,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            alpha: 0.6,
            size: Math.random() * 1.5 + 0.5,
            color: Math.random() > 0.4 ? '#C14F7D' : '#A12C5F'
          });
        }
      }

      // Draw and decay trailing particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.015;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 4;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw active cursor dot (very small, premium)
      if (mouse.current.x !== 0 && mouse.current.y !== 0) {
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#C14F7D';
        ctx.fillStyle = isHovering.current ? '#C14F7D' : 'rgba(245, 245, 247, 0.7)';
        ctx.beginPath();
        ctx.arc(mouse.current.x, mouse.current.y, isHovering.current ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999] mix-blend-screen"
      style={{ backfaceVisibility: 'hidden' }}
    />
  );
};
