import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  FolderGit, 
  Terminal, 
  Users, 
  CheckCircle,
  HelpCircle,
  Lock

} from 'lucide-react';
import { apiService } from '../services/api';
import { useProfile } from '../context/ProfileContext';

interface QuestionItem {
  id: number;
  question: string;
  category: string;
  preparationNotes: string;
}

export const Interview: React.FC = () => {
  const { profile } = useProfile();
  const [questions, setQuestions] = useState<QuestionItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
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


  const handleGenerate = async () => {
    setLoading(true);
    setQuestions(null);
    setError(null);
    try {
      const profileSummary = apiService.getProfileSummary(profile);
      console.log("[Interview UI] Requesting getInterviewQuestions with profileSummary:", profileSummary);
      const data = await apiService.getInterviewQuestions(profileSummary);
      console.log("[Interview UI] Received getInterviewQuestions response:", data);

      // Backend returns HTTP 400/500 as JSONResponse — axios throws on non-2xx,
      // so reaching here means status was 2xx. Check for an error field anyway.
      if (data?.error) {
        throw new Error(data.error);
      }

      const qArray: any[] = data?.questions ?? [];

      if (!Array.isArray(qArray)) {
        throw new Error("Unexpected response format from interview API.");
      }

      if (qArray.length === 0) {
        // Show the empty-state message without throwing.
        setQuestions([]);
        return;
      }

      let parsedList: QuestionItem[] = [];
      let idCounter = 1;

      qArray.forEach((q: any) => {
        parsedList.push({
          id: idCounter++,
          question: q.question,
          category: q.category,
          preparationNotes: q.guidance || q.preparation_notes || q.preparationNotes || ''
        });
      });

      console.log("[Interview UI] Mapped questions list:", parsedList);
      setQuestions(parsedList);
    } catch (e: any) {
      console.error("[Interview UI] Failed to generate questions:", e);
      // Axios wraps HTTP 400/500 bodies — extract server error message if available
      const serverMsg = e?.response?.data?.error;
      setError(serverMsg || e.message || "Unable to generate interview questions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };


  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-text-primary mb-2">Interview Intelligence</h1>
          <p className="text-sm text-text-secondary">AI-generated interview questions and answers matching your career twin.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-tr from-brand-wine via-brand-rose to-brand-pink hover:from-brand-rose hover:to-brand-pink text-text-primary text-sm font-semibold rounded-xl transition-all duration-300 shadow flex items-center gap-2 disabled:opacity-40"
        >
          <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Synthesizing Questions...' : 'Generate Mock Prep Bank'}
        </button>
      </div>

      {error && (
        <div className="p-6 rounded-2xl glass-panel border border-brand-rose/25 bg-brand-wine/10 text-brand-pink text-sm text-center flex items-center justify-center gap-2 mb-8">
          <HelpCircle className="w-5 h-5 flex-shrink-0 text-brand-pink" />
          <span>{error}</span>
        </div>
      )}

      {!questions && !loading && (
        <div className="h-96 rounded-2xl glass-panel border-dashed border-white/10 flex flex-col items-center justify-center text-center p-8 gap-4">
          <HelpCircle className="w-12 h-12 text-text-secondary/40 animate-bounce" />
          <h3 className="font-display font-bold text-text-primary text-lg">Interview preparation not started</h3>
          <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
            Click the generate button to review a set of custom, project-backed behavioral, technical, and architectural questions.
          </p>
        </div>
      )}

      {questions !== null && questions.length === 0 && !loading && (
        <div className="h-96 rounded-2xl glass-panel border-dashed border-white/10 flex flex-col items-center justify-center text-center p-8 gap-4">
          <HelpCircle className="w-12 h-12 text-text-secondary/40" />
          <h3 className="font-display font-bold text-text-primary text-lg">No questions generated</h3>
          <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
            No interview questions could be generated from the current resume.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl bg-white/3 border border-white/5 animate-pulse" />
          ))}
        </div>
      )}

      <AnimatePresence>
        {questions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {/* Project, Tech, HR, and Deep Dive columns */}
            {[
              { type: 'Project Based', label: 'Project-Based', icon: FolderGit, color: 'from-violet-500/10 to-transparent border-violet-500/20 text-violet-400' },
              { type: 'Technical', label: 'Technical Core', icon: Terminal, color: 'from-brand-rose/10 to-transparent border-brand-rose/20 text-brand-pink' },
              { type: 'Behavioral', label: 'Behavioral & HR', icon: Users, color: 'from-amber-500/10 to-transparent border-amber-500/20 text-amber-400' },
              { type: 'Resume Deep Dive', label: 'Resume Deep Dive', icon: HelpCircle, color: 'from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400' }
            ].map((col) => {
              const colQuestions = (() => {
                if (!questions) return [];
                if (!Array.isArray(questions)) return [];
                return questions.filter(q => q.category === col.type);
              })();
              return (
                <div key={col.type} className="flex flex-col gap-4">
                  {/* Category Header */}
                  <div className={`p-4 rounded-xl border bg-gradient-to-br ${col.color} flex items-center gap-2.5`}>
                    <col.icon className="w-5 h-5" />
                    <span className="font-display font-bold text-sm tracking-wide">{col.label}</span>
                  </div>

                  {/* Question cards list */}
                  <div className="flex flex-col gap-3">
                    {colQuestions.map((q) => {
                      const isExpanded = expandedId === q.id;
                      return (
                        <div 
                          key={q.id}
                          className={`rounded-xl border transition-all duration-300 font-sans ${
                            isExpanded 
                              ? 'bg-surface-dark border-brand-rose/30 shadow' 
                              : 'bg-white/3 border-white/5 hover:bg-white/5'
                          }`}
                        >
                          {/* Question header click trigger */}
                          <button
                            onClick={() => toggleExpand(q.id)}
                            className="w-full text-left p-4 flex items-start justify-between gap-3 text-xs font-semibold text-text-primary leading-relaxed"
                          >
                            <span>{q.question}</span>
                            <span className="text-text-secondary/70 mt-0.5">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </span>
                          </button>

                          {/* Expanded notes content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-white/5"
                              >
                                <div className="p-4 bg-white/1 flex flex-col gap-2.5 text-xs text-text-secondary leading-relaxed">
                                  <div className="flex items-center gap-1.5 text-brand-pink font-semibold uppercase text-[10px] tracking-wider font-mono">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    PREPARATION GUIDANCE
                                  </div>
                                  <div className="font-sans markdown-content">
                                    <ReactMarkdown>{q.preparationNotes}</ReactMarkdown>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
