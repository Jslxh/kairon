import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../context/TasksContext';
import type { Task } from '../context/TasksContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  FolderKanban,
  List as ListIcon,
  Clock
} from 'lucide-react';

export const Tasks: React.FC = () => {
  const { tasks, createTask, deleteTask, moveTask } = useTasks();
  const { addNotification } = useNotifications();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  
  // Create Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('Medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      title,
      description,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      priority,
      status: 'Todo'
    });

    addNotification('Task Added', `"${title}" has been appended to Todo list.`, 'success');
    setModalOpen(false);
    
    // Clear fields
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('Medium');
  };

  const filteredTasks = tasks.filter(task => {
    return filterPriority === 'All' || task.priority === filterPriority;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'Todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'In Progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed');

  const getPriorityColor = (p: Task['priority']) => {
    if (p === 'High') return 'bg-brand-rose/10 border-brand-rose/30 text-brand-pink';
    if (p === 'Medium') return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
  };

  return (
    <div className="p-8 font-sans">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-text-primary mb-2">Workspace Tasks</h1>
          <p className="text-sm text-text-secondary">Organize, schedule, and track tasks for your AI career milestones.</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-white/3 border border-white/5 text-xs text-text-primary rounded-xl focus:outline-none focus:border-brand-rose/30"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          {/* Toggle View mode */}
          <div className="flex bg-white/3 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-all ${
                viewMode === 'kanban' 
                  ? 'bg-brand-wine/40 text-brand-pink border border-brand-rose/25' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-all ${
                viewMode === 'list' 
                  ? 'bg-brand-wine/40 text-brand-pink border border-brand-rose/25' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" /> List
            </button>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-tr from-brand-wine to-brand-rose hover:from-brand-rose hover:to-brand-pink text-xs font-semibold text-text-primary rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-brand-wine/10"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>
      </div>

      {/* Main Board view */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {[
            { id: 'Todo', title: 'Todo Board', tasks: todoTasks, border: 'border-t-brand-rose/40' },
            { id: 'In Progress', title: 'In Progress', tasks: inProgressTasks, border: 'border-t-amber-500/40' },
            { id: 'Completed', title: 'Completed', tasks: completedTasks, border: 'border-t-emerald-500/40' }
          ].map((col) => (
            <div key={col.id} className={`p-5 rounded-2xl glass-panel border-t-2 ${col.border} flex flex-col gap-4 min-h-[400px]`}>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-display font-bold text-xs text-text-primary flex items-center gap-2">
                  {col.title}
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-text-secondary">{col.tasks.length}</span>
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {col.tasks.map(task => renderTaskCard(task))}
                </AnimatePresence>
                {col.tasks.length === 0 && (
                  <div className="text-center py-12 text-[10px] text-text-secondary/30 font-mono">
                    Column empty
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="rounded-2xl glass-panel border border-white/5 overflow-hidden p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-mono tracking-wider text-text-secondary/70 uppercase">
                  <th className="py-3 px-4">Task Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task.id} className="border-b border-white/3 hover:bg-white/1 transition-all">
                    <td className="py-4 px-4 font-semibold text-text-primary font-display">{task.title}</td>
                    <td className="py-4 px-4 text-text-secondary/80 max-w-xs truncate">{task.description}</td>
                    <td className="py-4 px-4 font-mono font-bold text-text-secondary flex items-center gap-1.5 mt-2">
                      <Clock className="w-3.5 h-3.5 text-brand-pink" />
                      {task.dueDate}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-0.5 border text-[9px] rounded-full font-mono font-bold ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={task.status}
                        onChange={(e) => moveTask(task.id, e.target.value as Task['status'])}
                        className="bg-white/3 border border-white/5 text-[10px] rounded-lg px-2 py-0.5 text-text-primary focus:outline-none"
                      >
                        <option value="Todo" className="bg-surface-dark">Todo</option>
                        <option value="In Progress" className="bg-surface-dark">In Progress</option>
                        <option value="Completed" className="bg-surface-dark">Completed</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          deleteTask(task.id);
                          addNotification('Task Deleted', 'Workspace item removed.', 'info');
                        }}
                        className="p-1 text-text-secondary hover:text-brand-pink hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[11px] text-text-secondary/40 font-mono">
                      No active tasks found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal Dialog */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md p-6 rounded-2xl glass-panel border border-white/10 flex flex-col gap-5 shadow-2xl z-10"
            >
              <h3 className="text-sm font-bold text-text-primary font-display border-b border-white/5 pb-3">Create Workspace Task</h3>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-text-secondary/70 font-mono font-bold uppercase">Task Name / Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Implement Docker manifests"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/25 text-xs text-text-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-text-secondary/70 font-mono font-bold uppercase">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide context..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/25 text-xs text-text-primary focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-text-secondary/70 font-mono font-bold uppercase">Due Date</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/25 text-xs text-text-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-text-secondary/70 font-mono font-bold uppercase">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Task['priority'])}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/25 text-xs text-text-primary focus:outline-none"
                    >
                      <option value="High" className="bg-surface-dark">High</option>
                      <option value="Medium" className="bg-surface-dark">Medium</option>
                      <option value="Low" className="bg-surface-dark">Low</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-white/5 hover:bg-white/5 text-xs font-semibold text-text-primary rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-tr from-brand-wine to-brand-rose hover:from-brand-rose hover:to-brand-pink text-xs font-semibold text-text-primary rounded-xl transition-colors cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  function renderTaskCard(task: Task) {
    return (
      <motion.div
        key={task.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="p-4 rounded-xl bg-white/2 border border-white/5 flex flex-col gap-3 group hover:bg-white/3 hover:border-brand-rose/20 transition-all duration-300 relative"
      >
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-[11px] font-bold text-text-primary leading-snug font-display pr-4">{task.title}</h4>
          <button
            onClick={() => {
              deleteTask(task.id);
              addNotification('Task Deleted', 'Workspace item removed.', 'info');
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-text-secondary hover:text-brand-pink rounded-lg transition-opacity cursor-pointer absolute top-3 right-3"
            title="Delete Task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {task.description && (
          <p className="text-[10px] text-text-secondary/75 leading-relaxed font-sans">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-2 items-center justify-between mt-1 border-t border-white/3 pt-2">
          {/* Due date */}
          <span className="text-[9px] text-text-secondary/60 font-mono flex items-center gap-1 leading-none">
            <Calendar className="w-3 h-3 text-brand-pink" />
            {task.dueDate}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Priority pill */}
            <span className={`px-2 py-0.5 border text-[8px] rounded-full font-mono font-bold leading-none ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>

            {/* Shift cards buttons */}
            <div className="flex gap-0.5">
              {task.status !== 'Todo' && (
                <button
                  onClick={() => moveTask(task.id, task.status === 'Completed' ? 'In Progress' : 'Todo')}
                  className="p-0.5 hover:bg-white/5 rounded text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
              )}
              {task.status !== 'Completed' && (
                <button
                  onClick={() => moveTask(task.id, task.status === 'Todo' ? 'In Progress' : 'Completed')}
                  className="p-0.5 hover:bg-white/5 rounded text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
};
