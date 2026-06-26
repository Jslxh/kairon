import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  Target, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Lock

} from 'lucide-react';
import { apiService } from '../services/api';
import { useProfile } from '../context/ProfileContext';

interface GapAnalysis {
  matching: string[];
  missing: string[];
  score: number;
  roadmap: { month: string; focus: string; tasks: string[] }[];
}

export const SkillGap: React.FC = () => {
  const { profile } = useProfile();
  const [role, setRole] = useState(profile.resumeName ? (profile.targetRole || '') : '');
  const [analysis, setAnalysis] = useState<GapAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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


  const handleAnalyze = async () => {
    if (!role.trim()) {
      setError('Please enter a target role before analyzing.');
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setError(null);

    try {
      const profileSummary = apiService.getProfileSummary(profile);

      // Diagnostic: log exact payload going to backend
      console.log('[SkillGap UI] === PAYLOAD TRACE ===');
      console.log('[SkillGap UI] profile.resumeName:', profile.resumeName);
      console.log('[SkillGap UI] profile.targetRole:', profile.targetRole);
      console.log('[SkillGap UI] profile.skills:', profile.skills);
      console.log('[SkillGap UI] profile.bio:', profile.bio);
      console.log('[SkillGap UI] profileSummary sent:', profileSummary);
      console.log('[SkillGap UI] target_role sent:', role);

      const data = await apiService.analyzeSkillGap(profileSummary, role);
      console.log('[SkillGap UI] API response:', data);

      // Surface backend 400/error message directly
      if (data && data.error) {
        throw new Error(data.error);
      }

      if (!data || (!data.matching_skills && !data.missing_skills)) {
        throw new Error('No data returned from skill gap analysis API.');
      }

      const matching = Array.isArray(data.matching_skills) ? data.matching_skills : [];
      const missing = Array.isArray(data.missing_skills) ? data.missing_skills : [];

      if (matching.length === 0 && missing.length === 0) {
        throw new Error('Skill gap analysis returned empty results. Ensure your resume is fully indexed.');
      }

      if (typeof data.readiness_score !== 'number') {
        throw new Error('Invalid readiness score returned from API.');
      }
      const score = data.readiness_score;

      const roadmap = Array.isArray(data.roadmap) ? data.roadmap.map((step: any) => ({
        month: step.month || 'Month',
        focus: step.focus || 'Focus Area',
        tasks: Array.isArray(step.tasks) ? step.tasks : []
      })) : [];

      console.log('[SkillGap UI] Rendered data — matching:', matching, 'missing:', missing, 'score:', score, 'roadmap:', roadmap);
      setAnalysis({ matching, missing, score, roadmap });
    } catch (e: any) {
      const msg = e?.response?.data?.error || e.message || 'Unable to perform skill gap analysis.';
      console.error('[SkillGap UI] Analysis failed:', msg, e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-text-primary mb-2">Skill Gap Analyzer</h1>
        <p className="text-sm text-text-secondary">Compare your Career Digital Twin against any target industry position.</p>
      </div>

      {error && (
        <div className="p-6 rounded-2xl glass-panel border border-brand-rose/25 bg-brand-wine/10 text-brand-pink text-sm text-center flex items-center justify-center gap-2 mb-8">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Target Role Selector input card */}
      <div className="p-6 rounded-2xl glass-panel flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-brand-wine/30 border border-brand-rose/20 flex items-center justify-center text-brand-pink">
            <Target className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-brand-pink font-mono tracking-widest font-extrabold">TARGET POSITION</span>
            <input 
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="text-text-primary font-display font-bold bg-transparent border-none focus:outline-none placeholder-text-secondary/50 w-full"
              placeholder={profile.resumeName ? "Inferred Target Role" : "Upload Resume First"}
              disabled={!profile.resumeName}
            />

          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-tr from-brand-wine via-brand-rose to-brand-pink hover:from-brand-rose hover:to-brand-pink text-text-primary text-sm font-semibold rounded-xl transition-all duration-300 shadow flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <>
              <BrainCircuit className="w-4 h-4 animate-spin" />
              Running Neural Gap Analysis...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Analyze Skills Gap
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-8"
          >
            {/* Score and Skill layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Readiness Score Card */}
              <div className="p-6 rounded-2xl glass-panel flex flex-col justify-between items-center text-center">
                <h3 className="text-xs font-mono font-extrabold tracking-widest text-brand-pink uppercase mb-4">ROLE READY INDEX</h3>
                
                {/* Visual Progress ring */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="w-32 h-32 rounded-full border-4 border-white/5 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-display font-black text-text-primary">{analysis.score}</span>
                      <span className="text-[9px] font-mono text-text-secondary tracking-widest uppercase">SCORE</span>
                    </div>
                  </div>
                  {/* Glowing halo */}
                  <div className="absolute inset-0 rounded-full border-2 border-brand-rose/20 animate-ping pointer-events-none" />
                </div>

                <div className="text-xs text-text-secondary mt-4">
                  Your profile matches <span className="text-brand-pink font-semibold">{analysis.matching.length}</span> key criteria. Address the missing components below.
                </div>
              </div>

              {/* Matching & Missing Skills */}
              <div className="p-6 rounded-2xl glass-panel lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matching */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-display font-bold text-sm">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    MATCHING COMPETENCIES ({analysis.matching.length})
                  </div>
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-48 pr-2">
                    {analysis.matching.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-300 font-sans markdown-content">
                        <ReactMarkdown>{item}</ReactMarkdown>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-brand-pink font-display font-bold text-sm">
                    <AlertCircle className="w-4.5 h-4.5" />
                    MISSING SKILLS & GAPS ({analysis.missing.length})
                  </div>
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-48 pr-2">
                    {analysis.missing.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-brand-wine/10 border border-brand-rose/25 text-xs text-brand-pink font-medium font-sans markdown-content">
                        <ReactMarkdown>{item}</ReactMarkdown>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 90-Day Learning Plan Roadmap */}
            <div className="p-6 rounded-2xl glass-panel flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary font-display">90-Day Accelerated Career Roadmap</h3>
                <span className="text-xs text-brand-pink font-mono flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Target: Readiness &ge; 85%
                </span>
              </div>

              {/* Timeline steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {analysis.roadmap.map((step, idx) => (
                  <div key={idx} className="p-5 rounded-xl bg-white/3 border border-white/5 flex flex-col gap-3 relative hover:bg-white/5 transition-all duration-300">
                    <div className="flex items-center gap-2 text-brand-pink font-display font-bold text-xs uppercase">
                      <Calendar className="w-4 h-4 text-brand-pink" />
                      {step.month}
                    </div>
                    <h4 className="text-sm font-bold text-text-primary leading-snug">{step.focus}</h4>
                    <div className="w-full h-px bg-white/5 my-1" />
                    <ul className="flex flex-col gap-2">
                      {step.tasks.map((task, tid) => (
                        <li key={tid} className="text-xs text-text-secondary flex items-start gap-1.5 leading-relaxed font-sans markdown-content">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-rose mt-1.5 flex-shrink-0" />
                          <ReactMarkdown>{task}</ReactMarkdown>
                        </li>
                      ))}
                    </ul>

                    {/* Arrow between columns on desktop */}
                    {idx < 2 && (
                      <div className="hidden md:flex absolute top-1/2 -right-3.5 transform -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-surface-dark border border-white/5 items-center justify-center text-brand-pink shadow">
                        <ArrowRight className="w-4.5 h-4.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
