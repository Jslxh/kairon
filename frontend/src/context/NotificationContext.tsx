import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Default initial alerts
  useEffect(() => {
    setNotifications([
      {
        id: '1',
        title: 'Career Digital Twin Initialized',
        message: 'Your profile metrics have successfully synced with mock vector repositories.',
        type: 'success',
        timestamp: '10 min ago',
        read: false
      },
      {
        id: '2',
        title: 'Skill Gap Completed',
        message: 'Analysis report for "AI Engineer" is ready for review.',
        type: 'info',
        timestamp: '30 min ago',
        read: false
      }
    ]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (title: string, message: string, type: 'success' | 'warning' | 'info') => {
    const newNotif: NotificationItem = {
      id: Math.random().toString(),
      title,
      message,
      type,
      timestamp: 'Just now',
      read: false
    };

    const newToast: ToastItem = {
      id: Math.random().toString(),
      title,
      message,
      type
    };

    setNotifications(prev => [newNotif, ...prev]);
    setToasts(prev => [...prev, newToast]);

    // Auto dismiss toast after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll
    }}>
      {children}

      {/* Floating Toast Alert Portal Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className="pointer-events-auto w-full p-4 rounded-xl border border-white/10 glass-panel shadow-2xl flex gap-3 relative overflow-hidden group"
            >
              {/* Type Accent Left Border indicator */}
              <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                toast.type === 'success' ? 'bg-emerald-500' :
                toast.type === 'warning' ? 'bg-amber-500' : 'bg-brand-pink'
              }`} />

              {/* Type Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-brand-pink" />}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-4">
                <h4 className="text-xs font-bold text-text-primary leading-tight font-display">{toast.title}</h4>
                <p className="text-[11px] text-text-secondary leading-normal mt-1 font-sans">{toast.message}</p>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => removeToast(toast.id)}
                className="absolute top-2 right-2 p-1 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
