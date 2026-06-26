import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { KMonogramLogo } from './KMonogramLogo';
import { 
  LayoutDashboard, 
  MessageSquareCode, 
  TrendingUp, 
  ShieldAlert, 
  Share2, 
  Compass, 
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  CheckSquare,
  Calendar,
  Lock
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (m: boolean) => void;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/assistant', label: 'AI Assistant', icon: MessageSquareCode },
  { path: '/skill-gap', label: 'Skill Gap', icon: TrendingUp },
  { path: '/interview', label: 'Interview Prep', icon: ShieldAlert },
  { path: '/graph', label: 'Knowledge Graph', icon: Share2 },
  { path: '/roadmap', label: 'Roadmap', icon: Compass },
  { path: '/notes', label: 'Notes', icon: FileText },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  setCollapsed, 
  mobileOpen, 
  setMobileOpen 
}) => {
  const { logout } = useAuth();
  const { profile } = useProfile();
  const { theme } = useTheme();
  const { addNotification } = useNotifications();
  const isLight = theme === 'light';

  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'JS';

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 bottom-0 left-0 z-50 h-screen border-r border-white/5
        flex flex-col justify-between py-6 px-4 bg-[#0B0B0F]/90 backdrop-blur-xl transition-all duration-300
        ${collapsed ? 'md:w-20' : 'md:w-64'}
        ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col gap-8">
          {/* Brand/Logo */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-tr from-brand-dark-wine via-brand-rose to-brand-pink flex items-center justify-center shadow-lg shadow-brand-wine/30 p-1">
                <KMonogramLogo className="w-full h-full text-text-primary" />
              </div>
              {!collapsed && (
                <div className="flex flex-col animate-fadeIn">
                  <span className="font-display font-bold text-lg tracking-wider text-text-primary">KAIRON</span>
                  <div className="text-[10px] text-brand-pink/80 font-mono leading-none tracking-widest mt-0.5">CAR-TWIN AI</div>
                </div>
              )}
            </div>

            {/* Collapse button for desktop */}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-lg border border-white/5 text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const requiresResume = ['/assistant', '/skill-gap', '/interview', '/graph', '/roadmap'].includes(item.path);
              const isLocked = requiresResume && !profile.resumeName;
              return (
                <NavLink
                  key={item.path}
                  to={isLocked ? '#' : item.path}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                      addNotification('Twin Access Locked', 'Upload your resume to unlock AI analysis', 'warning');
                    } else {
                      setMobileOpen(false);
                    }
                  }}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium group relative
                    ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isActive && !isLocked
                      ? (isLight 
                          ? 'bg-gradient-to-r from-[#720033] to-[#A12C5F] text-white shadow-md shadow-brand-wine/15 border-none' 
                          : 'bg-gradient-to-r from-brand-wine/30 to-brand-rose/10 text-brand-pink border-l-2 border-brand-rose shadow-inner shadow-brand-wine/10') 
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/3 hover:translate-x-1'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-display text-sm tracking-wide animate-fadeIn flex-1 flex items-center justify-between">
                      {item.label}
                      {isLocked && <Lock className="w-3.5 h-3.5 text-text-secondary/40" />}
                    </span>
                  )}

                  {/* Collapsed Tooltip helper */}
                  {collapsed && (
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-surface-dark border border-white/5 text-xs text-text-primary pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-[999]">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Session Profile Snippet */}
        <div className="flex flex-col gap-3">
          <div className={`p-3 bg-white/3 rounded-2xl border border-white/5 flex items-center justify-between overflow-hidden ${collapsed ? 'justify-center p-2' : ''}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              {profile.profilePicUrl ? (
                <img 
                  src={profile.profilePicUrl} 
                  alt="avatar" 
                  className="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0" 
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-wine to-brand-pink flex items-center justify-center font-display font-bold text-text-primary shadow flex-shrink-0">
                  {initials}
                </div>
              )}

              {!collapsed && (
                <div className="overflow-hidden animate-fadeIn">
                  <h4 className="text-xs font-semibold text-text-primary truncate">{profile.name}</h4>
                  <p className="text-[10px] text-text-secondary truncate font-mono">{profile.email}</p>
                </div>
              )}
            </div>

            {/* Direct Logout action button */}
            {!collapsed && (
              <button 
                onClick={logout}
                className="p-1.5 text-text-secondary hover:text-brand-pink hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
