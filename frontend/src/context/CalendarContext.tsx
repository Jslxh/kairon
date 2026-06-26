import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  start: string;
  end: string;
  type: 'Interview' | 'Learning Session' | 'Exam' | 'Project Deadline' | 'Certification' | 'Meeting';
  allDay: boolean;
}

interface CalendarContextType {
  events: CalendarEvent[];
  createEvent: (event: Omit<CalendarEvent, 'id' | 'userId'>) => string;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  bulkAddEvents: (newEvents: Omit<CalendarEvent, 'id' | 'userId'>[]) => void;
  getEventColor: (type: CalendarEvent['type']) => string;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

const EVENT_COLORS = {
  'Interview': '#C14F7D',
  'Learning Session': '#6366F1',
  'Exam': '#8B5CF6',
  'Project Deadline': '#F97316',
  'Certification': '#10B981',
  'Meeting': '#06B6D4',
};

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }
    const userKey = `kairon_events_${user.email}`;
    const saved = localStorage.getItem(userKey);
    if (saved) {
      setEvents(JSON.parse(saved));
    } else {
      const isDefaultJaya = user.email.toLowerCase() === 'shreejayalakshmis@gmail.com';
      if (isDefaultJaya) {
        const today = new Date().toISOString().split('T')[0];
        const initial: CalendarEvent[] = [
          {
            id: 'event-1',
            userId: user.email,
            title: 'FastAPI Code Review with Mentor',
            description: 'Go over async endpoint validations and query profiles optimizations.',
            start: `${today}T14:00:00`,
            end: `${today}T15:00:00`,
            type: 'Meeting',
            allDay: false
          },
          {
            id: 'event-2',
            userId: user.email,
            title: 'Docker Associate Exam Practice',
            description: 'Revision of container network and storage commands.',
            start: new Date(Date.now() + 3600000 * 24 * 2).toISOString().split('T')[0],
            end: new Date(Date.now() + 3600000 * 24 * 2).toISOString().split('T')[0],
            type: 'Exam',
            allDay: true
          },
          {
            id: 'event-3',
            userId: user.email,
            title: 'MLOps Pipeline Deployment Deadline',
            description: 'Push final Docker tags to registry and configure GitHub workflows.',
            start: new Date(Date.now() + 3600000 * 24 * 5).toISOString().split('T')[0],
            end: new Date(Date.now() + 3600000 * 24 * 5).toISOString().split('T')[0],
            type: 'Project Deadline',
            allDay: true
          }
        ];
        setEvents(initial);
        localStorage.setItem(userKey, JSON.stringify(initial));
      } else {
        setEvents([]);
        localStorage.setItem(userKey, JSON.stringify([]));
      }
    }
  }, [user]);

  const saveEvents = (newEvents: CalendarEvent[]) => {
    setEvents(newEvents);
    if (user) {
      localStorage.setItem(`kairon_events_${user.email}`, JSON.stringify(newEvents));
    }
  };

  const createEvent = (event: Omit<CalendarEvent, 'id' | 'userId'>): string => {
    if (!user) return '';
    const newId = `event-${Math.random().toString()}`;
    const newEv: CalendarEvent = {
      ...event,
      userId: user.email,
      id: newId
    };
    saveEvents([...events, newEv]);
    return newId;
  };

  const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    saveEvents(events.map(ev => ev.id === id ? { ...ev, ...updates } : ev));
  };

  const deleteEvent = (id: string) => {
    saveEvents(events.filter(ev => ev.id !== id));
  };

  const bulkAddEvents = (newEvents: Omit<CalendarEvent, 'id' | 'userId'>[]) => {
    if (!user) return;
    const formatted: CalendarEvent[] = newEvents.map(e => ({
      ...e,
      userId: user.email,
      id: `event-${Math.random().toString()}-${Date.now()}`
    }));
    saveEvents([...events, ...formatted]);
  };

  const getEventColor = (type: CalendarEvent['type']): string => {
    return EVENT_COLORS[type] || '#A8A8B3';
  };

  return (
    <CalendarContext.Provider value={{
      events,
      createEvent,
      updateEvent,
      deleteEvent,
      bulkAddEvents,
      getEventColor
    }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
