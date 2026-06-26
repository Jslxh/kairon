import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useNotifications } from '../context/NotificationContext';
import { 
  Trophy, 
  Briefcase, 
  Award, 
  Activity, 
  Lightbulb, 
  ArrowUpRight,
  Code,
  CheckSquare,
  CalendarDays,
  BadgeCheck,
  Upload
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { apiService } from '../services/api';
import { useProfile } from '../context/ProfileContext';
import { useTasks } from '../context/TasksContext';
import { useCalendar } from '../context/CalendarContext';
import { useTheme } from '../context/ThemeContext';

export const DashboardPage: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [data, setData] = useState<any>({
    resume_uploaded: true,
    readiness_score: 0,
    skills_indexed: 0,
    projects_linked: 0,
    certifications: 0,
    total_skills: 0,
    total_projects: 0,
    total_certifications: 0,
    skills: [],
    projects: [],
    projects_details: [],
    insights: "",
    progress: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, completionPercentage, uploadResume } = useProfile();
  const { addNotification } = useNotifications();
  const { tasks } = useTasks();
  const { events } = useCalendar();
  const [lastLogin, setLastLogin] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeLoading(true);
      try {
        await uploadResume(file);
        addNotification('Resume Synchronized', `${file.name} successfully parsed and indexed into vector layers.`, 'success');
        await fetchDashboard();
      } catch (err) {
        addNotification('Sync Failed', 'Could not index resume vectors.', 'warning');
      } finally {
        setResumeLoading(false);
      }
    }
  };

  const fetchDashboard = async () => {
    try {
      const result = await apiService.getDashboard();
      if (!result) {
        throw new Error('API returned an empty or invalid response.');
      }
      setData({
        resume_uploaded: result.resume_uploaded ?? true,
        readiness_score: result.readiness_score ?? 0,
        skills_indexed: result.total_skills ?? result.skills_indexed ?? 0,
        projects_linked: result.total_projects ?? result.projects_linked ?? 0,
        certifications: result.total_certifications ?? result.certifications ?? 0,
        total_skills: result.total_skills ?? 0,
        total_projects: result.total_projects ?? 0,
        total_certifications: result.total_certifications ?? 0,
        skills: result.skills ?? [],
        projects: result.projects ?? [],
        projects_details: result.projects_details ?? [],
        insights: result.insights ?? "Upload your resume to generate digital twin insights.",
        progress: result.progress ?? []
      });
      setError(null);
    } catch (err: any) {
      console.error('Failed to load dashboard metrics:', err);
      setError(err.message || 'FastAPI backend connection failure.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!profile.resumeName) {
      setLoading(false);
      return;
    }
    fetchDashboard();

    // Generate recent last login timestamp
    const date = new Date();
    date.setMinutes(date.getMinutes() - 42);
    setLastLogin(date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }));
  }, [profile.resumeName]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-dark text-text-secondary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-brand-rose animate-spin" />
          <p className="font-mono text-sm tracking-wider">Syncing Twin Metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-dark text-text-secondary p-8">
        <div className="w-full max-w-md p-6 rounded-2xl glass-panel text-center flex flex-col items-center gap-4 border border-brand-rose/25 bg-brand-wine/10">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-pink">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-display font-bold text-text-primary text-lg">Backend Connection Failed</h3>
          <p className="text-xs text-text-secondary leading-relaxed">{error}</p>
          <button 
            onClick={() => { setError(null); setLoading(true); fetchDashboard(); }}
            className="px-4 py-2 bg-gradient-to-tr from-brand-wine via-brand-rose to-brand-pink hover:from-brand-rose hover:to-brand-pink text-text-primary text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer shadow-lg shadow-brand-wine/10"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-dark text-text-secondary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-brand-rose animate-spin" />
          <p className="font-mono text-sm tracking-wider">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Circular gauge calculations
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const readinessScore = data?.readiness_score ?? 0;
  const strokeDashoffset = circumference - (readinessScore / 100) * circumference;

  const firstName = profile.name ? profile.name.split(' ')[0] : 'Candidate';

  if (!profile.resumeName || (!loading && data.resume_uploaded === false)) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="p-8 min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center font-sans"
      >
        <div className="w-full max-w-xl p-8 rounded-2xl glass-panel text-center flex flex-col items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-wine via-brand-rose to-brand-pink" />
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-wine via-brand-rose to-brand-pink flex items-center justify-center text-text-primary shadow-xl shadow-brand-wine/20 animate-float-slow">
            <Upload className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-display font-extrabold text-text-primary">
              Upload your resume to build your Career Twin.
            </h1>
            <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
              KAIRON indexes your skills, projects, and credentials into a secure vector storage and visual knowledge graph to unlock your personalized AI twin insights.
            </p>
          </div>

          {/* Upload Box */}
          <input 
            type="file" 
            ref={resumeInputRef} 
            onChange={handleResumeChange} 
            accept=".pdf" 
            className="hidden" 
          />
          <div 
            onClick={() => resumeInputRef.current?.click()}
            className="w-full h-48 rounded-xl border border-dashed border-white/10 hover:border-brand-rose/35 bg-white/1 flex flex-col items-center justify-center p-6 hover:bg-white/2 transition-all duration-300 cursor-pointer"
          >
            {resumeLoading ? (
              <div className="w-10 h-10 border-3 border-t-transparent border-brand-pink rounded-full animate-spin mb-4" />
            ) : (
              <Upload className="w-10 h-10 text-text-secondary/40 mb-4" />
            )}
            <span className="text-xs font-semibold text-text-primary">
              {resumeLoading ? 'Analyzing & indexing resume vectors...' : 'Select or drop resume PDF here'}
            </span>
            <span className="text-[10px] text-text-secondary mt-1.5">Accepts PDF files up to 10MB</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Log dashboard data before render
  console.log("Dashboard Data:", data);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="p-8"
    >
      {/* Welcome / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-text-primary mb-1">Welcome back, {firstName}</h1>
          <div className="flex items-center gap-1.5 text-xs text-brand-pink font-semibold mb-2 font-mono tracking-wide">
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>Career Twin Active</span>
          </div>
          <p className="text-xs text-text-secondary flex flex-wrap gap-x-2 gap-y-1 items-center">
            <span>Last Login: {lastLogin}</span>
            <span className="text-[#4B5563]">|</span>
            <span>Resume: </span>
            <span className={`font-mono text-[10px] font-bold ${profile.resumeName ? 'text-emerald-400' : 'text-brand-pink'}`}>
              {profile.resumeName ? `Synced (${profile.resumeName})` : 'Not Uploaded'}
            </span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Profile completion linear index */}
          <div className="flex items-center gap-3 bg-white/3 border border-white/5 px-4 py-2.5 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[9px] text-text-secondary/70 font-mono font-bold tracking-wider uppercase leading-none mb-1.5">PROFILE COMPLETION</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-wine via-brand-rose to-brand-pink rounded-full transition-all duration-500" 
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-brand-pink leading-none">{completionPercentage}%</span>
              </div>
            </div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-xs font-mono text-brand-pink flex items-center justify-center gap-2">
            <Activity className="w-3.5 h-3.5" />
            Last Updated: Real-time sync
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Readiness Score', value: `${data?.readiness_score ?? 0}%`, icon: Trophy, color: 'from-brand-wine to-brand-rose' },
          { title: 'Skills Indexed', value: data?.total_skills ?? data?.skills_indexed ?? 0, icon: Code, color: 'from-brand-rose to-brand-pink' },
          { title: 'Projects Linked', value: data?.total_projects ?? data?.projects_linked ?? 0, icon: Briefcase, color: 'from-violet-900 to-indigo-900' },
          { title: 'Certifications', value: data?.total_certifications ?? data?.certifications ?? 0, icon: Award, color: 'from-amber-800 to-orange-800' }
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl glass-panel-interactive flex items-center justify-between"
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">{card.title}</span>
              <span className="text-3xl font-display font-bold text-text-primary">{card.value}</span>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-text-primary shadow`}>
              <card.icon className="w-6 h-6" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Readiness Circular Gauge */}
        <div className="p-6 rounded-2xl glass-panel flex flex-col justify-between items-center text-center">
          <h3 className="text-sm font-semibold text-text-secondary self-start">Career Readiness Gauge</h3>
          <div className="relative my-6 flex items-center justify-center">
            {/* SVG circle stroke */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-white/5"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-brand-pink"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-display font-bold text-text-primary">{data?.readiness_score ?? 0}</span>
              <span className="text-[10px] text-text-secondary tracking-widest uppercase font-mono">READY</span>
            </div>
          </div>
          <div className="text-xs text-text-secondary font-sans leading-relaxed">
            {(data?.readiness_score ?? 0) > 70 
              ? <>Your readiness score is high! Continue linking projects and learning new skills to expand your digital twin capabilities.</>
              : <>Optimize your readiness by analyzing skill gaps and working on missing competencies.</>
            }
          </div>
        </div>

        {/* Skill growth line chart */}
        <div className="p-6 rounded-2xl glass-panel lg:col-span-2 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-secondary">Readiness Score Over Time</h3>
            <span className="text-xs text-emerald-400 font-mono">+27% Growth</span>
          </div>
          <div className="h-44 w-full">
            {isMounted && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.progress ?? []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isLight ? '#C14F7D' : '#A12C5F'} stopOpacity={isLight ? 0.6 : 0.4}/>
                    <stop offset="50%" stopColor={isLight ? '#A12C5F' : '#720033'} stopOpacity={isLight ? 0.3 : 0.2}/>
                    <stop offset="95%" stopColor={isLight ? '#720033' : '#720033'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke={isLight ? '#6F5A64' : 'rgba(255,255,255,0.3)'} fontSize={10} tickLine={false} />
                <YAxis stroke={isLight ? '#6F5A64' : 'rgba(255,255,255,0.3)'} fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: isLight ? '#FBF7F9' : '#14141B', 
                    borderColor: isLight ? '#E3D6DD' : 'rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    color: isLight ? '#231019' : '#F5F5F7'
                  }}
                  labelStyle={{ color: isLight ? '#231019' : '#F5F5F7', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="score" stroke={isLight ? '#720033' : '#C14F7D'} strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights & Project Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* AI Insights Banner */}
        <div className="p-6 rounded-2xl glass-panel bg-gradient-to-br from-brand-wine/10 to-transparent border border-brand-rose/20 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-brand-pink font-display font-semibold text-sm">
            <Lightbulb className="w-4.5 h-4.5 text-brand-pink" />
            KAIRON CO-PILOT INSIGHTS
          </div>
          <div className="text-sm text-text-primary leading-relaxed markdown-content">
            <ReactMarkdown>{data?.insights ?? ""}</ReactMarkdown>
          </div>
          <div className="mt-auto">
            <button className="text-xs font-semibold text-brand-pink hover:text-brand-pink/80 flex items-center gap-1 transition-all duration-300">
              Launch Skill Gap Analysis
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Project Impact Cards */}
        <div className="p-6 rounded-2xl glass-panel lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-text-secondary">Project Showcase & Skills Linked</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(data?.projects_details && Array.isArray(data.projects_details) && data.projects_details.length > 0) ? (
              data.projects_details.map((p: any) => (
                <div key={p.name} className="p-4 rounded-xl bg-white/3 border border-white/5 flex flex-col gap-2 hover:bg-white/5 transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-text-primary">{p.name}</h4>
                    <span className="text-[10px] bg-brand-wine/30 text-brand-pink px-2 py-0.5 rounded-full border border-brand-rose/20">{(p.skills_count ?? 0)} Skills</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{p.description}</p>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center text-xs text-text-secondary/40 py-8 font-mono">
                No projects found. Add projects to your resume to populate.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Operating System Workspace Summary widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Tasks widget */}
        <div className="p-6 rounded-2xl glass-panel flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
              <CheckSquare className="w-4.5 h-4.5 text-brand-pink" />
              Upcoming Core Tasks
            </h3>
            <span className="text-[10px] font-mono text-text-secondary">
              {tasks.filter(t => t.status !== 'Completed').length} Pending
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {tasks.filter(t => t.status !== 'Completed').slice(0, 3).map(task => (
              <div key={task.id} className="p-3 bg-white/2 rounded-xl border border-white/5 flex items-center justify-between hover:bg-white/4 transition-colors">
                <div className="overflow-hidden">
                  <h4 className="text-xs font-semibold text-text-primary truncate">{task.title}</h4>
                  <p className="text-[10px] text-text-secondary mt-0.5 font-mono">{task.dueDate} &bull; {task.priority} Priority</p>
                </div>
                <span className="text-[9px] px-2.5 py-1 rounded bg-brand-wine/25 border border-brand-rose/25 text-brand-pink font-mono leading-none">{task.status}</span>
              </div>
            ))}
            {tasks.filter(t => t.status !== 'Completed').length === 0 && (
              <span className="text-xs text-text-secondary/40 py-6 font-mono text-center">No upcoming tasks pending</span>
            )}
          </div>
        </div>

        {/* Upcoming Schedule Events widget */}
        <div className="p-6 rounded-2xl glass-panel flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
              <CalendarDays className="w-4.5 h-4.5 text-indigo-400" />
              Upcoming Calendar Events
            </h3>
            <span className="text-[10px] font-mono text-text-secondary">
              {events.length} Scheduled
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {events.slice(0, 3).map(event => {
              const eventDateStr = event.start.includes('T')
                ? new Date(event.start).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : new Date(event.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' (All Day)';
              
              return (
                <div key={event.id} className="p-3 bg-white/2 rounded-xl border border-white/5 flex items-center justify-between hover:bg-white/4 transition-colors">
                  <div className="overflow-hidden pr-2">
                    <h4 className="text-xs font-semibold text-text-primary truncate">{event.title}</h4>
                    <p className="text-[10px] text-text-secondary mt-0.5 font-mono">{eventDateStr}</p>
                  </div>
                  <span className="text-[9px] px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 font-mono leading-none whitespace-nowrap">{event.type}</span>
                </div>
              );
            })}
            {events.length === 0 && (
              <span className="text-xs text-text-secondary/40 py-6 font-mono text-center">No events on your calendar schedule</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Dashboard ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-bg-dark text-text-secondary p-8">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel text-center flex flex-col items-center gap-4 border border-brand-rose/25 bg-brand-wine/10">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-pink">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="font-display font-bold text-text-primary text-lg">Application Error</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred while rendering the dashboard."}
            </p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-gradient-to-tr from-brand-wine via-brand-rose to-brand-pink hover:from-brand-rose hover:to-brand-pink text-text-primary text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer shadow-lg shadow-brand-wine/10"
            >
              Reset Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const Dashboard: React.FC = () => (
  <ErrorBoundary>
    <DashboardPage />
  </ErrorBoundary>
);
