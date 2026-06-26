import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProfileProvider } from './context/ProfileContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotesProvider } from './context/NotesContext';
import { TasksProvider } from './context/TasksContext';
import { CalendarProvider } from './context/CalendarContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { Assistant } from './pages/Assistant';
import { SkillGap } from './pages/SkillGap';
import { Interview } from './pages/Interview';
import { Graph } from './pages/Graph';
import { Roadmap } from './pages/Roadmap';
import { Settings } from './pages/Settings';
import { Notes } from './pages/Notes';
import { Tasks } from './pages/Tasks';
import { Calendar } from './pages/Calendar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { CursorEffect } from './components/CursorEffect';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark text-text-secondary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-brand-rose animate-spin" />
          <p className="font-mono text-sm tracking-wider">Syncing Career Twin Identity...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex bg-bg-dark h-screen text-text-primary overflow-hidden font-sans relative">
      {/* Navigation Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopBar 
          setMobileOpen={setMobileSidebarOpen}
          setCollapsed={setSidebarCollapsed}
          collapsed={sidebarCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto flex flex-col justify-between relative">
          <div className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/skill-gap" element={<SkillGap />} />
              <Route path="/interview" element={<Interview />} />
              <Route path="/graph" element={<Graph />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ProfileProvider>
          <NotificationProvider>
            <NotesProvider>
              <TasksProvider>
                <CalendarProvider>
                  <Router>
                    <AppContent />
                    <CursorEffect />
                  </Router>
                </CalendarProvider>
              </TasksProvider>
            </NotesProvider>
          </NotificationProvider>
        </ProfileProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

