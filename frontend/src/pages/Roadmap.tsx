import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TasksContext';
import { useCalendar } from '../context/CalendarContext';
import { useNotifications } from '../context/NotificationContext';
import { useProfile } from '../context/ProfileContext';
import { apiService } from '../services/api';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  ListTodo, 
  Save, 
  BookOpen, 
  Compass, 
  ChevronRight, 
  CheckCircle,
  Lock
} from 'lucide-react';


interface LearningPhase {
  phase: string;
  title: string;
  role: string;
  desc: string;
  status: 'completed' | 'active' | 'upcoming';
  items: string[];
}

export const Roadmap: React.FC = () => {
  const { user } = useAuth();
  const { bulkAddTasks } = useTasks();
  const { bulkAddEvents } = useCalendar();
  const { addNotification } = useNotifications();
  const { profile, updateProfile } = useProfile();

  const [rolePrompt, setRolePrompt] = useState(profile.resumeName ? (profile.targetRole || '') : '');
  const [daysPrompt, setDaysPrompt] = useState('90');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if context changes externally
  useEffect(() => {
    if (profile.resumeName && profile.targetRole && !rolePrompt) {
      setRolePrompt(profile.targetRole);
    }
  }, [profile]);

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

  
  const [generatedRoadmap, setGeneratedRoadmap] = useState<{
    role: string;
    duration: string;
    phases: LearningPhase[];
    tasks: { title: string; description: string; dueDate: string; priority: 'Low' | 'Medium' | 'High' }[];
    events: { title: string; description: string; start: string; end: string; type: any; allDay: boolean }[];
    resources: { title: string; provider: string; level: string }[];
  } | null>(null);

  // Load saved planner roadmap on mount
  useEffect(() => {
    if (!user) {
      setGeneratedRoadmap(null);
      return;
    }
    const saved = localStorage.getItem(`kairon_career_plan_${user.email}`);
    if (saved) {
      setGeneratedRoadmap(JSON.parse(saved));
    } else {
      setGeneratedRoadmap(null);
    }
  }, [user]);

  const handleGeneratePlan = async () => {
    if (!rolePrompt.trim()) return;
    setLoading(true);
    setGeneratedRoadmap(null);
    setError(null);

    const targetDays = parseInt(daysPrompt) || 90;

    try {
      console.log("[Roadmap UI] Requesting generateRoadmap rolePrompt:", rolePrompt, "targetDays:", targetDays);
      const roadmapData = await apiService.generateRoadmap(rolePrompt, targetDays);
      console.log("[Roadmap UI] Received generateRoadmap response:", roadmapData);
      
      if (!roadmapData || !roadmapData.phase_1 || !roadmapData.phase_2 || !roadmapData.phase_3) {
        throw new Error("API response does not contain required learning phases.");
      }

      const p1 = roadmapData.phase_1;
      const p2 = roadmapData.phase_2;
      const p3 = roadmapData.phase_3;

      const phasesSource = [
        { key: 'phase_1', name: 'Phase 1', data: p1, dayRange: `1-${Math.floor(targetDays/3)}`, dayOffset: 7 },
        { key: 'phase_2', name: 'Phase 2', data: p2, dayRange: `${Math.floor(targetDays/3) + 1}-${Math.floor(targetDays*2/3)}`, dayOffset: 14 },
        { key: 'phase_3', name: 'Phase 3', data: p3, dayRange: `${Math.floor(targetDays*2/3) + 1}-${targetDays}`, dayOffset: 28 },
      ];

      const generatedTasks = phasesSource.flatMap((pSrc, index) => {
        const priorityVal = index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low';
        const deliverables = Array.isArray(pSrc.data.deliverables) ? pSrc.data.deliverables : [];
        return deliverables.map((item: string) => ({
          title: `Master: ${item} for ${roadmapData.role || rolePrompt}`,
          description: `Deliverable: ${item}. Part of phase: ${pSrc.data.title}.`,
          dueDate: new Date(Date.now() + 3600000 * 24 * pSrc.dayOffset).toISOString().split('T')[0],
          priority: priorityVal as 'Low' | 'Medium' | 'High'
        }));
      });

      const generatedEvents = phasesSource.map((pSrc, index) => {
        const startDay = index === 0 ? 10 : index === 1 ? 20 : 30;
        const deliverables = Array.isArray(pSrc.data.deliverables) ? pSrc.data.deliverables : [];
        return {
          title: `${roadmapData.role || rolePrompt} - ${pSrc.name} Assessment`,
          description: `Verify phase deliverables: ${deliverables.join(', ')}`,
          start: new Date(Date.now() + 3600000 * 24 * startDay).toISOString().split('T')[0] + 'T11:00:00',
          end: new Date(Date.now() + 3600000 * 24 * startDay).toISOString().split('T')[0] + 'T12:30:00',
          type: 'Project Deadline' as const,
          allDay: false
        };
      });

      const formattedPlan = {
        role: roadmapData.role || rolePrompt,
        duration: roadmapData.duration || `${targetDays} Days`,
        phases: phasesSource.map((pSrc, index) => {
          const deliverables = Array.isArray(pSrc.data.deliverables) ? pSrc.data.deliverables : [];
          return {
            phase: `${pSrc.name} (Days ${pSrc.dayRange})`,
            title: pSrc.data.title || 'Phase Focus',
            role: deliverables.slice(0, 3).join(', '),
            desc: `Focus on deliverables: ${deliverables.join(', ')}. Complete scheduled tasks and study resources to build career readiness.`,
            status: index === 0 ? ('active' as const) : ('upcoming' as const),
            items: deliverables
          };
        }),
        tasks: generatedTasks,
        events: generatedEvents,
        resources: Array.isArray(roadmapData.resources) ? roadmapData.resources : []
      };

      console.log("[Roadmap UI] Formatted Rendered Plan:", formattedPlan);
      setGeneratedRoadmap(formattedPlan);
      if (user) {
        localStorage.setItem(`kairon_career_plan_${user.email}`, JSON.stringify(formattedPlan));
      }
      addNotification('Roadmap Compiled', `AI generated a ${targetDays}-day path for ${rolePrompt}.`, 'success');
    } catch (err) {
      console.error("[Roadmap UI] Generation failed:", err);
      setError("Unable to generate roadmap.");
      addNotification('Compilation Failed', 'Could not compile dynamic career plan.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTasksToBoard = () => {
    if (!generatedRoadmap) return;
    const formatted = generatedRoadmap.tasks.map(t => ({
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
      priority: t.priority,
      status: 'Todo' as const
    }));
    bulkAddTasks(formatted);
    addNotification('Tasks Merged', 'AI roadmap tasks integrated into Kanban board.', 'success');
  };

  const handleAddEventsToCalendar = () => {
    if (!generatedRoadmap) return;
    const formatted = generatedRoadmap.events.map(e => ({
      title: e.title,
      description: e.description,
      start: e.start,
      end: e.end,
      type: e.type,
      allDay: e.allDay
    }));
    bulkAddEvents(formatted);
    addNotification('Events Scheduled', 'AI planner milestones added to calendar.', 'success');
  };

  const handleSaveRoadmap = async () => {
    if (!generatedRoadmap) return;
    // Save target role to candidate profile
    await updateProfile({ targetRole: generatedRoadmap.role });
    addNotification('Roadmap Settings Saved', `Target role locked as "${generatedRoadmap.role}".`, 'success');
  };

  return (
    <div className="p-8 font-sans">
      
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-text-primary mb-2">AI Career Planner</h1>
        <p className="text-sm text-text-secondary">Synthesize detailed career milestones and learning tasks mapped to target profiles.</p>
      </div>

      {/* Compiler input prompts card */}
      <div className="p-6 rounded-2xl glass-panel flex flex-col md:flex-row gap-5 items-center justify-between mb-8">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[9px] text-text-secondary/60 font-mono font-bold tracking-wider uppercase">I Want to Become a...</label>
            <input 
              type="text" 
              value={rolePrompt}
              onChange={(e) => setRolePrompt(e.target.value)}
              placeholder={profile.resumeName ? "Inferred Target Role" : "Upload Resume First"}
              disabled={!profile.resumeName}
              className="px-4 py-2.5 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/25 text-xs text-text-primary focus:outline-none"
            />
          </div>


          <div className="flex flex-col gap-1.5 w-full sm:w-32">
            <label className="text-[9px] text-text-secondary/60 font-mono font-bold tracking-wider uppercase">In how many days?</label>
            <input 
              type="number" 
              value={daysPrompt}
              onChange={(e) => setDaysPrompt(e.target.value)}
              placeholder="90"
              className="px-4 py-2.5 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/25 text-xs text-text-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={loading}
          className="w-full md:w-auto px-6 py-3 bg-gradient-to-tr from-brand-wine via-brand-rose to-brand-pink hover:from-brand-rose hover:to-brand-pink text-text-primary text-xs font-semibold rounded-xl transition-all duration-300 shadow flex items-center justify-center gap-2 disabled:opacity-40 mt-5 md:mt-0 cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Compiling AI Vectors...' : 'Synthesize Career Plan'}
        </button>
      </div>

      {error && (
        <div className="p-6 rounded-2xl glass-panel border border-brand-rose/25 bg-brand-wine/10 text-brand-pink text-sm text-center flex items-center justify-center gap-2 mb-8">
          <Compass className="w-5 h-5 flex-shrink-0 text-brand-pink" />
          <span>{error}</span>
        </div>
      )}

      {/* Planner Output Grid */}
      <AnimatePresence mode="wait">
        {generatedRoadmap ? (
          <motion.div
            key="roadmap-content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Timeline phase block */}
            <div className="lg:col-span-2 flex flex-col gap-6 relative pl-6 border-l border-white/5">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-bold text-text-primary font-display flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-brand-pink animate-spin-slow" />
                  Roadmap: {generatedRoadmap.role} ({generatedRoadmap.duration})
                </span>
                <button
                  onClick={handleSaveRoadmap}
                  className="px-3 py-1.5 bg-white/3 hover:bg-white/5 border border-white/5 rounded-xl text-[10px] text-text-primary font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Save className="w-3 h-3 text-brand-pink" /> Lock Role
                </button>
              </div>

              {(generatedRoadmap.phases || []).map((item, idx) => (
                <div key={idx} className="relative flex flex-col gap-3">
                  {/* Circle indicator */}
                  <div className={`absolute -left-[31px] w-4.5 h-4.5 rounded-full border-4 flex items-center justify-center ${
                    item.status === 'completed' 
                      ? 'bg-emerald-500 border-emerald-500/20' 
                      : item.status === 'active' 
                        ? 'bg-brand-rose border-brand-rose/20 animate-pulse' 
                        : 'bg-surface-dark border-white/10'
                  }`} />

                  <span className={`text-[9px] font-mono font-bold tracking-widest uppercase ${
                    item.status === 'completed' ? 'text-emerald-400' : 'text-brand-pink'
                  }`}>
                    {item.phase}
                  </span>

                  <div className="p-5 rounded-2xl glass-panel flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display font-bold text-text-primary text-sm leading-snug">{item.title}</h3>
                        <span className="text-[10px] text-brand-pink font-mono">{item.role}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-text-secondary leading-relaxed font-sans markdown-content">
                      <ReactMarkdown>{item.desc}</ReactMarkdown>
                    </div>
                    <div className="w-full h-px bg-white/5 my-1" />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-text-secondary/50 font-mono tracking-wider font-bold">KEY MILESTONES</span>
                      {item.items.map((sub, sidx) => (
                        <div key={sidx} className="flex items-center gap-2 text-xs text-text-primary font-sans markdown-content">
                          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                          <ReactMarkdown>{sub}</ReactMarkdown>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Integrations Controls Card */}
            <div className="flex flex-col gap-6">
              <div className="p-6 rounded-2xl glass-panel flex flex-col gap-5 border border-white/5 shadow-2xl">
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2 border-b border-white/5 pb-3">
                  <Sparkles className="w-4.5 h-4.5 text-brand-pink" />
                  Planner Action Hub
                </h3>

                <p className="text-[11px] text-text-secondary leading-relaxed font-sans">
                  Kairon generated specific workspace actions to hit your {generatedRoadmap.duration} objectives. Merge them into your dashboard:
                </p>

                {/* Add tasks button */}
                <div className="flex flex-col gap-3">
                  <div className="p-4 bg-white/2 rounded-xl border border-white/5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-primary font-display flex items-center gap-1.5">
                        <ListTodo className="w-4.5 h-4.5 text-brand-pink" />
                        Kanban Tasks ({(generatedRoadmap.tasks || []).length})
                      </span>
                    </div>
                    <button
                      onClick={handleAddTasksToBoard}
                      className="w-full py-2 bg-brand-wine/10 hover:bg-brand-wine/25 text-brand-pink border border-brand-rose/25 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                    >
                      Merge into Kanban board
                    </button>
                  </div>

                  {/* Add events button */}
                  <div className="p-4 bg-white/2 rounded-xl border border-white/5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-primary font-display flex items-center gap-1.5">
                        <CalendarIcon className="w-4.5 h-4.5 text-indigo-400" />
                        Calendar Events ({(generatedRoadmap.events || []).length})
                      </span>
                    </div>
                    <button
                      onClick={handleAddEventsToCalendar}
                      className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/25 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                    >
                      Schedule on Calendar
                    </button>
                  </div>
                </div>
              </div>

              {/* Recommended certs */}
              <div className="p-6 rounded-2xl glass-panel flex flex-col gap-4">
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2 border-b border-white/5 pb-3">
                  <BookOpen className="w-4.5 h-4.5 text-brand-pink" />
                  Required Study Materials
                </h3>
                <div className="flex flex-col gap-3">
                  {(generatedRoadmap.resources || []).map((course, i) => (
                    <div key={i} className="p-3 bg-white/2 rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/4 transition-colors">
                      <div className="overflow-hidden pr-2">
                        <h4 className="text-[11px] font-bold text-text-primary truncate">{course.title}</h4>
                        <p className="text-[9px] text-text-secondary truncate mt-0.5">{course.provider} &bull; {course.level}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-secondary" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Blank state */
          <div className="h-96 rounded-2xl glass-panel border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-8 gap-4">
            <Compass className="w-12 h-12 text-text-secondary/35 animate-bounce" />
            <h3 className="font-display font-bold text-text-primary text-base">Plan Your AI Transition</h3>
            <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
              Compile dynamic, phase-based roadmaps, schedules, and developer tasks by submitting a role prompt.
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
