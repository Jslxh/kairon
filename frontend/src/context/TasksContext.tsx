import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'In Progress' | 'Completed';
  createdAt: string;
}

interface TasksContextType {
  tasks: Task[];
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, newStatus: Task['status']) => void;
  bulkAddTasks: (newTasks: Omit<Task, 'id' | 'createdAt' | 'userId'>[]) => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load from LocalStorage scoped by user
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }
    const userKey = `kairon_tasks_${user.email}`;
    const saved = localStorage.getItem(userKey);
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      // Default tasks for Jaya Shree Lakshmi's account, empty for others
      const isDefaultJaya = user.email.toLowerCase() === 'shreejayalakshmis@gmail.com';
      if (isDefaultJaya) {
        const initial: Task[] = [
          {
            id: 'task-1',
            userId: user.email,
            title: 'Dockerize ZORO task orchestration script',
            description: 'Create Dockerfile, configure build steps, and test container builds locally using docker-compose.',
            dueDate: new Date(Date.now() + 3600000 * 24 * 3).toISOString().split('T')[0],
            priority: 'High',
            status: 'Todo',
            createdAt: new Date().toISOString()
          },
          {
            id: 'task-2',
            userId: user.email,
            title: 'Read AWS EKS cluster deployment models',
            description: 'Compare Fargate serverless pods against managed node groups for vector similarity search engines.',
            dueDate: new Date(Date.now() + 3600000 * 24 * 6).toISOString().split('T')[0],
            priority: 'Medium',
            status: 'In Progress',
            createdAt: new Date().toISOString()
          },
          {
            id: 'task-3',
            userId: user.email,
            title: 'Solve Leetcode DP exercises',
            description: 'Complete 5 dynamic programming algorithms to prepare for upcoming AI Engineer coding reviews.',
            dueDate: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0],
            priority: 'Low',
            status: 'Completed',
            createdAt: new Date().toISOString()
          }
        ];
        setTasks(initial);
        localStorage.setItem(userKey, JSON.stringify(initial));
      } else {
        setTasks([]);
        localStorage.setItem(userKey, JSON.stringify([]));
      }
    }
  }, [user]);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    if (user) {
      localStorage.setItem(`kairon_tasks_${user.email}`, JSON.stringify(newTasks));
    }
  };

  const createTask = (task: Omit<Task, 'id' | 'createdAt' | 'userId'>): string => {
    if (!user) return '';
    const newId = `task-${Math.random().toString()}`;
    const newTask: Task = {
      ...task,
      userId: user.email,
      id: newId,
      createdAt: new Date().toISOString()
    };
    saveTasks([newTask, ...tasks]);
    return newId;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    saveTasks(tasks.map(task => task.id === id ? { ...task, ...updates } : task));
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter(task => task.id !== id));
  };

  const moveTask = (id: string, newStatus: Task['status']) => {
    saveTasks(tasks.map(task => task.id === id ? { ...task, status: newStatus } : task));
  };

  const bulkAddTasks = (newTasks: Omit<Task, 'id' | 'createdAt' | 'userId'>[]) => {
    if (!user) return;
    const formatted: Task[] = newTasks.map(t => ({
      ...t,
      userId: user.email,
      id: `task-${Math.random().toString()}-${Date.now()}`,
      createdAt: new Date().toISOString()
    }));
    saveTasks([...formatted, ...tasks]);
  };

  return (
    <TasksContext.Provider value={{
      tasks,
      createTask,
      updateTask,
      deleteTask,
      moveTask,
      bulkAddTasks
    }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};
