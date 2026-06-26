import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  resume: string;
  createdAt: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial default user details for demonstration
const DEFAULT_USER: UserProfile & { password?: string } = {
  id: 'user-default-jaya',
  name: 'Jaya Shree Lakshmi S',
  email: 'shreejayalakshmis@gmail.com',
  password: 'password123',
  avatar: '',
  resume: 'j_resume.pdf',
  createdAt: new Date().toISOString()
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Seed default user if registry is empty
    const registeredRaw = localStorage.getItem('kairon_registered_users');
    if (!registeredRaw) {
      localStorage.setItem('kairon_registered_users', JSON.stringify([DEFAULT_USER]));
    }

    const savedToken = localStorage.getItem('kairon_token') || sessionStorage.getItem('kairon_token');
    const savedUser = localStorage.getItem('kairon_user') || sessionStorage.getItem('kairon_user');

    if (savedToken && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const registeredRaw = localStorage.getItem('kairon_registered_users');
    const registeredUsers = registeredRaw ? JSON.parse(registeredRaw) : [DEFAULT_USER];

    const matchedUser = registeredUsers.find(
      (u: any) => u.email.toLowerCase() === email.toLowerCase()
    );

    // Mock validation: accept if matches registered password OR (if password is at least 6 characters for demo ease)
    if (matchedUser) {
      if (password.length >= 6 && (matchedUser.password ? matchedUser.password === password : true)) {
        // Remove password from context state for security
        const { password: _, ...userNoPassword } = matchedUser;
        
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('kairon_token', 'mock-jwt-token-kairon-2026');
        storage.setItem('kairon_user', JSON.stringify(userNoPassword));

        setIsAuthenticated(true);
        setUser(userNoPassword);
        setLoading(false);
        return true;
      }
    } else {
      // For developer convenience: if logging in with new credentials directly without registration, register them automatically!
      if (email.trim() && password.length >= 6) {
        const newUser: UserProfile = {
          id: `user-${Math.random().toString(36).substring(2, 11)}`,
          name: email.split('@')[0].toUpperCase(),
          email: email.toLowerCase(),
          avatar: '',
          resume: '',
          createdAt: new Date().toISOString()
        };
        const updatedUsers = [...registeredUsers, { ...newUser, password }];
        localStorage.setItem('kairon_registered_users', JSON.stringify(updatedUsers));

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('kairon_token', 'mock-jwt-token-kairon-2026');
        storage.setItem('kairon_user', JSON.stringify(newUser));

        setIsAuthenticated(true);
        setUser(newUser);
        setLoading(false);
        return true;
      }
    }

    setLoading(false);
    throw new Error('Invalid email or password. Password must be at least 6 characters.');
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (name && email && password.length >= 6) {
      const registeredRaw = localStorage.getItem('kairon_registered_users');
      const registeredUsers = registeredRaw ? JSON.parse(registeredRaw) : [DEFAULT_USER];

      if (registeredUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
        setLoading(false);
        throw new Error('User email already registered.');
      }

      const newUser: UserProfile = {
        id: `user-${Math.random().toString(36).substring(2, 11)}`,
        name,
        email: email.toLowerCase(),
        avatar: '',
        resume: '',
        createdAt: new Date().toISOString()
      };

      const updatedUsers = [...registeredUsers, { ...newUser, password }];
      localStorage.setItem('kairon_registered_users', JSON.stringify(updatedUsers));

      sessionStorage.setItem('kairon_token', 'mock-jwt-token-kairon-2026');
      sessionStorage.setItem('kairon_user', JSON.stringify(newUser));

      setIsAuthenticated(true);
      setUser(newUser);
      setLoading(false);
      return true;
    }
    
    setLoading(false);
    throw new Error('Registration failed. Ensure all fields are valid and password >= 6 chars.');
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLoading(false);
    if (email.includes('@')) {
      return true;
    }
    throw new Error('Please enter a valid email address.');
  };

  const logout = () => {
    localStorage.removeItem('kairon_token');
    localStorage.removeItem('kairon_user');
    sessionStorage.removeItem('kairon_token');
    sessionStorage.removeItem('kairon_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };

      const storage = localStorage.getItem('kairon_token') ? localStorage : sessionStorage;
      storage.setItem('kairon_user', JSON.stringify(updated));

      const registeredRaw = localStorage.getItem('kairon_registered_users');
      if (registeredRaw) {
        const registeredUsers = JSON.parse(registeredRaw);
        const updatedUsers = registeredUsers.map((u: any) =>
          u.email.toLowerCase() === prev.email.toLowerCase() ? { ...u, ...updates } : u
        );
        localStorage.setItem('kairon_registered_users', JSON.stringify(updatedUsers));
      }

      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, register, forgotPassword, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
