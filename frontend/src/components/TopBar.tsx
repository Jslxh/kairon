import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useNotifications } from '../context/NotificationContext';
import { useNotes } from '../context/NotesContext';
import { useTasks } from '../context/TasksContext';
import { useCalendar } from '../context/CalendarContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  Menu, 
  User, 
  LogOut, 
  Settings as SettingsIcon, 
  FileText, 
  LayoutDashboard,
  CheckSquare,
  Sun,
  Moon
} from 'lucide-react';

interface TopBarProps {
  setMobileOpen: (open: boolean) => void;
  setCollapsed: (collapsed: boolean) => void;
  collapsed: boolean;
}

interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: 'Project' | 'Skill' | 'Note' | 'Task' | 'Event' | 'Certification' | 'Graph Node';
  link: string;
}

export const TopBar: React.FC<TopBarProps> = ({ setMobileOpen }) => {
  const { logout } = useAuth();
  const { profile } = useProfile();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const { notes } = useNotes();
  const { tasks } = useTasks();
  const { events } = useCalendar();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Dynamically build static search items from candidate profile!
  const staticSearchItems: SearchItem[] = [
    ...profile.skills.map((skill, idx) => ({
      id: `s-${idx}`,
      title: skill,
      description: `Core proficiency in ${skill} linked to your digital twin.`,
      category: 'Skill' as const,
      link: '/skill-gap'
    })),
    ...(profile.targetRole ? [{
      id: 'target-role',
      title: `${profile.targetRole} Transition Path`,
      description: `Structured progression plan to lock your transition to ${profile.targetRole}.`,
      category: 'Project' as const,
      link: '/roadmap'
    }] : [])
  ];


  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'JS';

  // Construct search items list dynamically
  const dynamicNotes: SearchItem[] = notes.map(n => ({
    id: `note-${n.id}`,
    title: n.title,
    description: n.content ? n.content.replace(/<[^>]*>/g, '').substring(0, 80) : 'Note draft',
    category: 'Note',
    link: '/notes'
  }));

  const dynamicTasks: SearchItem[] = tasks.map(t => ({
    id: `task-${t.id}`,
    title: t.title,
    description: `Status: ${t.status} | Priority: ${t.priority} | Due: ${t.dueDate}`,
    category: 'Task',
    link: '/tasks'
  }));

  const dynamicEvents: SearchItem[] = events.map(e => ({
    id: `event-${e.id}`,
    title: e.title,
    description: `Date: ${e.start.split('T')[0]}`,
    category: 'Event',
    link: '/calendar'
  }));

  const allSearchItems = [
    ...staticSearchItems,
    ...dynamicNotes,
    ...dynamicTasks,
    ...dynamicEvents
  ];

  const filteredResults = searchQuery.trim() === ''
    ? []
    : allSearchItems.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      });

  const getCategoryBadgeStyles = (category: string) => {
    switch (category) {
      case 'Project':
        return 'bg-brand-wine/20 text-brand-pink border border-brand-rose/25';
      case 'Skill':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Note':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Task':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Event':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Certification':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'Graph Node':
        return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
      default:
        return 'bg-white/5 text-text-secondary border border-white/10';
    }
  };

  return (
    <header className="h-16 px-6 md:px-8 border-b border-white/5 flex items-center justify-between bg-bg-dark/10 backdrop-blur-md sticky top-0 z-40 font-sans">
      
      {/* Left section: Hamburger for Mobile + Search */}
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Input Bar with dropdown */}
        <div className="relative w-80 md:w-96 max-w-full hidden sm:block" ref={searchContainerRef}>
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary/70">
            <Search className="w-4 h-4" />
          </span>
          <input 
            ref={searchInputRef}
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search skills, projects, notes..."
            className="w-full pl-10 pr-16 py-1.5 bg-white/3 hover:bg-white/5 focus:bg-white/8 text-sm text-text-primary placeholder-text-secondary/50 rounded-full border border-white/5 focus:border-brand-rose/30 focus:outline-none transition-all duration-300 font-sans"
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[9px] text-text-secondary/45 font-mono font-bold">
            Ctrl + K
          </div>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {searchFocused && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-2 w-[450px] rounded-2xl border border-white/5 bg-[#14141B]/95 backdrop-blur-xl shadow-2xl p-3.5 flex flex-col gap-2.5 z-50 max-h-[360px] overflow-y-auto font-sans text-left"
              >
                {searchQuery.trim() === '' ? (
                  <div className="flex flex-col gap-2.5 p-1">
                    <span className="text-[9.5px] text-text-secondary/40 font-mono font-bold tracking-wider uppercase">Search Suggestions</span>
                    <div className="flex flex-wrap gap-2">
                      {(profile.skills && profile.skills.length > 0 ? profile.skills.slice(0, 5) : ['Resume', 'Skills', 'Projects', 'Tasks', 'Notes']).map(term => (
                        <button
                          key={term}
                          onClick={() => setSearchQuery(term)}
                          className="px-2.5 py-1 rounded-lg bg-white/3 hover:bg-white/5 text-[10.5px] text-brand-pink border border-white/5 hover:border-brand-rose/20 transition-all font-semibold cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}

                    </div>
                    <div className="text-[9.5px] text-text-secondary/50 font-mono mt-1.5 pt-2 border-t border-white/5">
                      Tip: Search skills, projects, notes, tasks, events, and graph nodes dynamically.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center px-1 pb-1.5 border-b border-white/5 text-[9.5px] text-text-secondary/40 font-mono font-bold tracking-wider uppercase">
                      <span>Search Results ({filteredResults.length})</span>
                    </div>
                    {filteredResults.length === 0 ? (
                      <div className="text-center py-6 text-xs text-text-secondary/60">
                        No results found for "{searchQuery}"
                      </div>
                    ) : (
                      filteredResults.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate(item.link);
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/1 hover:bg-white/4 text-left transition-all duration-200 cursor-pointer group"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11.5px] font-bold text-text-primary group-hover:text-brand-pink transition-colors font-display truncate">
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-text-secondary/80 truncate mt-0.5 font-sans leading-none">
                              {item.description}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 border text-[9px] font-mono font-bold rounded-full flex-shrink-0 ${getCategoryBadgeStyles(item.category)}`}>
                            {item.category}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right section: Actions and User Menu */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Systems active status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          SYSTEMS ACTIVE
        </div>

        {/* Notification center */}
        <div className="relative" ref={notifRef}>
          <motion.button 
            onClick={() => {
              setNotifDropdownOpen(!notifDropdownOpen);
              setProfileDropdownOpen(false);
            }}
            whileHover={{ scale: 1.05 }}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all duration-300 relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute w-4 h-4 text-[9px] font-bold bg-brand-rose text-text-primary flex items-center justify-center rounded-full top-1 right-1 border border-bg-dark animate-pulse">
                {unreadCount}
              </span>
            )}
          </motion.button>

          {/* Notifications Dropdown list */}
          <AnimatePresence>
            {notifDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/5 bg-[#14141B]/95 backdrop-blur-xl shadow-2xl p-4 flex flex-col gap-3 z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-text-primary font-display flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-brand-pink" />
                    Recent Alerts ({notifications.length})
                  </span>
                  <div className="flex gap-2 text-[10px]">
                    <button 
                      onClick={markAllAsRead}
                      className="text-brand-pink hover:underline font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <CheckSquare className="w-3 h-3" /> Read all
                    </button>
                    <button 
                      onClick={clearAll}
                      className="text-text-secondary hover:text-text-primary hover:underline font-mono cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-text-secondary/60 font-sans">
                      No notifications to display
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          n.read 
                            ? 'bg-white/1 border-white/3 opacity-60' 
                            : 'bg-brand-wine/5 border-brand-rose/10 hover:bg-brand-wine/10'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="text-[11px] font-bold text-text-primary leading-tight font-display pr-3">{n.title}</h5>
                          {!n.read && <span className="w-1.5 h-1.5 bg-brand-pink rounded-full flex-shrink-0 mt-1" />}
                        </div>
                        <p className="text-[10px] text-text-secondary leading-normal mt-1 font-sans">{n.message}</p>
                        <span className="text-[9px] text-text-secondary/40 font-mono mt-1.5 block">{n.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle Button */}
        <motion.button 
          onClick={toggleTheme}
          whileHover={{ scale: 1.05, boxShadow: '0 0 12px rgba(193, 79, 125, 0.4)' }}
          className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all duration-300 cursor-pointer relative"
          title="Switch Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-brand-pink" /> : <Moon className="w-5 h-5 text-brand-pink" />}
        </motion.button>

        <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

        {/* User Profile Avatar dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => {
              setProfileDropdownOpen(!profileDropdownOpen);
              setNotifDropdownOpen(false);
            }}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-all duration-300 border border-white/5 hover:border-white/15 p-1 rounded-full bg-white/1 cursor-pointer"
          >
            {profile.profilePicUrl ? (
              <img 
                src={profile.profilePicUrl} 
                alt="avatar" 
                className="w-8 h-8 rounded-full object-cover border border-white/10" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-wine to-brand-pink flex items-center justify-center font-display font-bold text-xs text-text-primary shadow">
                {initials}
              </div>
            )}
          </button>

          {/* User Profile Dropdown content */}
          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-56 rounded-2xl border border-white/5 bg-[#14141B]/95 backdrop-blur-xl shadow-2xl p-2.5 flex flex-col gap-0.5 z-50 font-display"
              >
                <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                  <h4 className="text-xs font-bold text-text-primary truncate">{profile.name}</h4>
                  <p className="text-[10px] text-text-secondary truncate mt-0.5 font-mono">{profile.email}</p>
                </div>

                {[
                  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
                  { to: '/settings?tab=profile', label: 'My Profile', icon: User },
                  { to: '/settings?tab=resume', label: 'Sync Resume', icon: FileText },
                  { to: '/settings', label: 'System Settings', icon: SettingsIcon },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/3 rounded-xl transition-all font-medium"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}

                <div className="w-full h-px bg-white/5 my-1.5" />

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-brand-pink hover:text-brand-pink/85 hover:bg-brand-wine/10 rounded-xl transition-all font-semibold text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout Twin Session
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
