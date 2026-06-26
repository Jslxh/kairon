import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useNotifications } from '../context/NotificationContext';
import { 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  Share2, 
  BookOpen,
  MessageSquare,
  Bookmark,
  Plus,
  Trash2,
  Cpu,
  Lock
} from 'lucide-react';
import { apiService } from '../services/api';
import { useProfile } from '../context/ProfileContext';


interface Message {
  sender: 'user' | 'bot';
  text: string;
  source?: 'neo4j' | 'qdrant' | 'hybrid' | 'rag';
  answerNodes?: string[];
}

interface SavedSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: string;
}

const suggestedPrompts = [
  'What are my key skills?',
  'Tell me about my projects.',
  'Generate interview questions based on my resume.'
];

export const Assistant: React.FC = () => {
  const { profile } = useProfile();
  const { addNotification } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([
    { 
      sender: 'bot', 
      text: "Hello, I am Kairon AI, your Career Digital Twin Assistant. Ask me anything about your skills, project linkages, or career roadmaps." 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!profile.resumeName) {
    return (
      <div className="p-8 min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center font-sans">
        <div className="w-full max-w-md p-8 rounded-2xl glass-panel text-center flex flex-col items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-wine via-brand-rose to-brand-pink" />
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary">
            <Lock className="w-8 h-8 text-brand-pink" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-display font-extrabold text-text-primary">I can help once your resume is uploaded.</h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Upload your resume to build your Career Twin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  
  // Chat Session states
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load saved sessions on mount
  useEffect(() => {
    const saved = localStorage.getItem('kairon_chat_sessions');
    if (saved) {
      setSavedSessions(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    // Add User Message
    const userMsg: Message = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Fetch response from assistant api service
      const result = await apiService.askAssistant(textToSend);
      
      // Determine precise source
      let sourceTag: 'neo4j' | 'qdrant' | 'hybrid' = 'qdrant';
      if (result.source === 'neo4j') {
        sourceTag = 'neo4j';
      } else if (textToSend.toLowerCase().includes('ready') || textToSend.toLowerCase().includes('engineer')) {
        sourceTag = 'hybrid';
      }

      const botMsg: Message = {
        sender: 'bot',
        text: typeof result.answer === 'string' ? result.answer : `I queried the Knowledge Graph and found these matching nodes:`,
        source: sourceTag,
        answerNodes: Array.isArray(result.answer) ? result.answer : undefined
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered an issue retrieving that. Please check your connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([
      { 
        sender: 'bot', 
        text: "Hello, I am Kairon AI, your Career Digital Twin Assistant. Ask me anything about your skills, project linkages, or career roadmaps." 
      }
    ]);
    setActiveSessionId(null);
  };

  const handleSaveSession = () => {
    if (messages.length <= 1) return;
    
    // Auto title based on first user query
    const firstUserMsg = messages.find(m => m.sender === 'user');
    const title = firstUserMsg 
      ? (firstUserMsg.text.length > 25 ? firstUserMsg.text.substring(0, 25) + '...' : firstUserMsg.text)
      : 'Saved Session';

    const newSession: SavedSession = {
      id: activeSessionId || Math.random().toString(),
      title,
      messages,
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    setSavedSessions(prev => {
      const filtered = prev.filter(s => s.id !== newSession.id);
      const updated = [newSession, ...filtered];
      localStorage.setItem('kairon_chat_sessions', JSON.stringify(updated));
      return updated;
    });

    setActiveSessionId(newSession.id);
    addNotification('Conversation Bookmarked', 'Saved to your chat history logs.', 'success');
  };

  const handleLoadSession = (session: SavedSession) => {
    setMessages(session.messages);
    setActiveSessionId(session.id);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('kairon_chat_sessions', JSON.stringify(updated));
      return updated;
    });
    if (activeSessionId === id) {
      handleNewChat();
    }
    addNotification('Session Cleared', 'Chat log removed.', 'info');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#0B0B0F] h-[calc(100vh-4rem)] overflow-hidden">
      
      {/* Left History Sidebar */}
      <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-white/5 bg-[#14141B]/20 flex flex-col p-4 gap-4 flex-shrink-0 h-44 md:h-auto overflow-y-auto">
        <button
          onClick={handleNewChat}
          className="w-full py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold text-text-primary border border-white/5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-brand-pink" /> New Session
        </button>

        <div className="flex flex-col gap-2 flex-1">
          <span className="text-[9px] text-text-secondary/50 font-mono font-bold tracking-wider uppercase mb-1">Saved Twin Chats</span>
          
          {savedSessions.length === 0 ? (
            <div className="text-[10px] text-text-secondary/40 font-sans text-center py-6">
              No bookmarked sessions
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {savedSessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => handleLoadSession(session)}
                  className={`group flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                    activeSessionId === session.id
                      ? 'bg-brand-wine/10 border-brand-rose/25 text-brand-pink'
                      : 'bg-white/1 border-white/3 text-text-secondary hover:bg-white/3 hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-text-secondary hover:text-brand-pink rounded-lg transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {messages.length > 1 && (
          <button
            onClick={handleSaveSession}
            className="w-full py-2 bg-brand-wine/15 hover:bg-brand-wine/30 text-xs font-semibold text-brand-pink border border-brand-rose/20 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer mt-auto"
          >
            <Bookmark className="w-3.5 h-3.5" /> Bookmark Session
          </button>
        )}
      </div>

      {/* Right Primary Chat Body */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
        {/* Suggested Prompts Header */}
        <div className="flex items-center gap-3 p-4 bg-white/2 border-b border-white/5 overflow-x-auto no-scrollbar">
          <HelpCircle className="w-4 h-4 text-text-secondary flex-shrink-0" />
          <span className="text-[10px] text-text-secondary font-mono font-bold tracking-wider uppercase flex-shrink-0">Suggestions:</span>
          <div className="flex gap-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="text-[10px] px-3 py-1 bg-white/5 border border-white/5 rounded-full text-text-primary hover:bg-brand-rose/20 hover:border-brand-rose/40 hover:text-brand-pink transition-all duration-300 font-sans whitespace-nowrap cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Message Stream lists */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-4 max-w-3xl ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
            >
              {/* Avatar indicator */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                msg.sender === 'user' 
                  ? 'bg-white/5 border-white/10 text-text-primary' 
                  : 'bg-gradient-to-tr from-brand-wine to-brand-rose border-brand-rose/30 text-text-primary'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 animate-pulse" />}
              </div>

              {/* Chat Speech Bubble */}
              <div className="flex flex-col gap-2">
                <div className={`p-4 rounded-2xl leading-relaxed text-xs shadow-xl ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-brand-wine/25 to-brand-rose/10 text-text-primary border border-brand-rose/25 rounded-tr-none chat-bubble-user'
                    : 'bg-[#14141B] border border-white/5 text-text-primary rounded-tl-none chat-bubble-assistant'
                }`}>
                  {/* Source indicator tag badge */}
                  {msg.source && (
                    <div className="flex items-center gap-1.5 mb-2 self-start select-none">
                      <span className={`text-[8px] font-mono font-extrabold tracking-widest px-2 py-0.5 rounded border ${
                        msg.source === 'neo4j' 
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                          : msg.source === 'hybrid'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-brand-pink/10 border-brand-rose/30 text-brand-pink'
                      }`}>
                        {msg.source === 'neo4j' ? (
                          <span className="flex items-center gap-1"><Share2 className="w-2.5 h-2.5" /> NEO4J KNOWLEDGE GRAPH</span>
                        ) : msg.source === 'hybrid' ? (
                          <span className="flex items-center gap-1"><Cpu className="w-2.5 h-2.5" /> HYBRID CO-PILOT INTELLIGENCE</span>
                        ) : (
                          <span className="flex items-center gap-1"><BookOpen className="w-2.5 h-2.5" /> QDRANT VECTOR DB</span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Message body text */}
                  <div className="markdown-content">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>

                  {/* Answer node lists if available */}
                  {msg.answerNodes && (
                    <div className="flex flex-col gap-2 mt-4">
                      {msg.answerNodes.map((node, idx) => (
                        <div 
                          key={idx} 
                          className="px-4 py-2 bg-white/3 border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-400" />
                            <span className="font-semibold font-display text-[10px] text-text-primary">{node}</span>
                          </div>
                          <span className="text-[9px] font-mono text-indigo-400">Node (Project)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* typing loader */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-4 max-w-lg self-start"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-wine to-brand-rose border-brand-rose/30 flex items-center justify-center text-text-primary">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 bg-[#14141B] border border-white/5 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-xl chat-bubble-assistant">
                  {/* Pulsing Dots Typing Indicator */}
                  <span className="w-1.5 h-1.5 bg-brand-pink rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-brand-pink rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-brand-pink rounded-full animate-bounce" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        {/* Form bottom input controls */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-6 bg-[#14141B]/40 border-t border-white/5 backdrop-blur-xl"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Kairon (e.g. 'Am I ready for an AI Engineer role?')"
              className="w-full pl-6 pr-16 py-4 bg-white/3 border border-white/5 focus:border-brand-rose/30 focus:bg-white/5 focus:outline-none rounded-2xl text-xs text-text-primary placeholder-text-secondary/50 font-sans transition-all duration-300"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-3.5 p-2 bg-gradient-to-tr from-brand-wine to-brand-rose hover:from-brand-rose hover:to-brand-pink text-text-primary rounded-xl disabled:opacity-40 transition-all duration-300 shadow shadow-brand-wine/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
