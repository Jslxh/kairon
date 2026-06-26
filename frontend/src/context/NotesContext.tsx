import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: 'Interview Notes' | 'Learning Notes' | 'Career Notes' | 'Project Notes' | 'Personal Notes';
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotesContextType {
  notes: Note[];
  createNote: (category?: Note['category']) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  pinNote: (id: string) => void;
  summarizeNoteAI: (id: string) => Promise<string>;
  extractPointsAI: (id: string) => Promise<string>;
  generateRevisionAI: (id: string) => Promise<string>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);

  // Load from LocalStorage scoped by user
  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }
    const userKey = `kairon_notes_${user.email}`;
    const saved = localStorage.getItem(userKey);
    if (saved) {
      setNotes(JSON.parse(saved));
    } else {
      const isDefaultJaya = user.email.toLowerCase() === 'shreejayalakshmis@gmail.com';
      if (isDefaultJaya) {
        const initial: Note[] = [
          {
            id: 'note-1',
            userId: user.email,
            title: 'MLOps Learning Objectives',
            content: 'Focusing on containerizing the ZORO task runner and setting up model versioning using MLflow. Key topics to cover:\n1. Dockerfile optimization\n2. Image tagging workflows\n3. Kubernetes manifests configuration.',
            category: 'Learning Notes',
            pinned: true,
            createdAt: new Date(Date.now() - 3600000 * 24).toLocaleString(),
            updatedAt: new Date(Date.now() - 3600000 * 24).toLocaleString()
          },
          {
            id: 'note-2',
            userId: user.email,
            title: 'ACADRAG Design Architecture',
            content: 'ACADRAG utilizes FAISS indexes and local LLM instances served by Ollama.\n- Chunks: 500 characters, 100 character overlap.\n- Model: nvidia/nemotron-3-super-120b-a12b.',
            category: 'Project Notes',
            pinned: false,
            createdAt: new Date(Date.now() - 3600000 * 12).toLocaleString(),
            updatedAt: new Date(Date.now() - 3600000 * 12).toLocaleString()
          }
        ];
        setNotes(initial);
        localStorage.setItem(userKey, JSON.stringify(initial));
      } else {
        setNotes([]);
        localStorage.setItem(userKey, JSON.stringify([]));
      }
    }
  }, [user]);

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    if (user) {
      localStorage.setItem(`kairon_notes_${user.email}`, JSON.stringify(newNotes));
    }
  };

  const createNote = (category: Note['category'] = 'Learning Notes'): string => {
    if (!user) return '';
    const newId = `note-${Math.random().toString()}`;
    const newNote: Note = {
      id: newId,
      userId: user.email,
      title: 'Untitled Note',
      content: '',
      category,
      pinned: false,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString()
    };
    saveNotes([newNote, ...notes]);
    return newId;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const updated = notes.map(note => {
      if (note.id === id) {
        return {
          ...note,
          ...updates,
          updatedAt: new Date().toLocaleString()
        };
      }
      return note;
    });
    saveNotes(updated);
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter(note => note.id !== id));
  };

  const pinNote = (id: string) => {
    saveNotes(notes.map(note => note.id === id ? { ...note, pinned: !note.pinned } : note));
  };

  const summarizeNoteAI = async (id: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
    const note = notes.find(n => n.id === id);
    if (!note) return '';
    const summary = `\n\n=== AI Summary ===\nThis note discusses the key components of "${note.title}". Key highlights focus on structuring technical objectives, container orchestration steps, and serving model weights locally.`;
    updateNote(id, { content: note.content + summary });
    return summary;
  };

  const extractPointsAI = async (id: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const note = notes.find(n => n.id === id);
    if (!note) return '';
    const points = `\n\n=== AI Key Takeaways ===\n• Core Objective: Define modular architectural stages.\n• Stack dependencies: Python, Docker, FAISS.\n• Immediate Action: Refactor Flask routing structures.`;
    updateNote(id, { content: note.content + points });
    return points;
  };

  const generateRevisionAI = async (id: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const note = notes.find(n => n.id === id);
    if (!note) return '';
    const revision = `\n\n=== AI Revision Guide ===\nQ: What are the primary bottlenecks of this architecture?\nA: Image scaling limitations and vector database latency.\n\nQ: What is the recommended next step?\nA: Perform container resource profiling in local Kubernetes testing clusters.`;
    updateNote(id, { content: note.content + revision });
    return revision;
  };

  return (
    <NotesContext.Provider value={{
      notes,
      createNote,
      updateNote,
      deleteNote,
      pinNote,
      summarizeNoteAI,
      extractPointsAI,
      generateRevisionAI
    }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
