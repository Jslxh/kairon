import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCalendar, type CalendarEvent } from '../context/CalendarContext';
import { useNotifications } from '../context/NotificationContext';
import { Plus, Trash2, Clock, FileText } from 'lucide-react';

const EVENT_TYPES: CalendarEvent['type'][] = [
  'Interview',
  'Learning Session',
  'Exam',
  'Project Deadline',
  'Certification',
  'Meeting'
];

export const Calendar: React.FC = () => {
  const { events, createEvent, deleteEvent, getEventColor } = useCalendar();
  const { addNotification } = useNotifications();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [type, setType] = useState<CalendarEvent['type']>('Learning Session');
  const [allDay, setAllDay] = useState(false);

  const handleDateClick = (arg: any) => {
    setStart(arg.dateStr + 'T09:00:00');
    setEnd(arg.dateStr + 'T10:00:00');
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleEventClick = (arg: any) => {
    const clickedId = arg.event.id;
    const ev = events.find(e => e.id === clickedId);
    if (ev) {
      setSelectedEvent(ev);
      setModalOpen(true);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !start) return;

    createEvent({
      title,
      description,
      start,
      end: end || start,
      type,
      allDay
    });

    addNotification('Event Created', `"${title}" added to calendar schedule.`, 'success');
    setModalOpen(false);

    // Clear fields
    setTitle('');
    setDescription('');
    setStart('');
    setEnd('');
    setType('Learning Session');
    setAllDay(false);
  };

  const handleDelete = () => {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id);
      addNotification('Event Removed', `"${selectedEvent.title}" deleted.`, 'info');
      setModalOpen(false);
      setSelectedEvent(null);
    }
  };

  // Convert context events into FullCalendar structure
  const formattedEvents = events.map(ev => ({
    id: ev.id,
    title: ev.title,
    start: ev.start,
    end: ev.end,
    allDay: ev.allDay,
    backgroundColor: getEventColor(ev.type),
    borderColor: 'transparent',
    textColor: '#F5F5F7',
    extendedProps: {
      description: ev.description,
      type: ev.type
    }
  }));

  return (
    <div className="p-8 font-sans">
      
      {/* CSS overrides for FullCalendar to look absolutely stunning in KAIRON theme */}
      <style>{`
        .fc {
          --fc-border-color: rgba(255, 255, 255, 0.05);
          --fc-daygrid-event-dot-width: 8px;
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: transparent;
          --fc-today-bg-color: rgba(193, 79, 125, 0.06);
          background: transparent;
          color: #F5F5F7;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .fc .fc-button-primary {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #A8A8B3;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
          transition: all 0.2s;
        }
        .fc .fc-button-primary:hover {
          background-color: rgba(255, 255, 255, 0.08);
          color: #F5F5F7;
        }
        .fc .fc-button-primary:disabled {
          opacity: 0.3;
        }
        .fc .fc-button-active {
          background-color: rgba(193, 79, 125, 0.25) !important;
          border-color: rgba(193, 79, 125, 0.4) !important;
          color: #C14F7D !important;
        }
        .fc-toolbar-title {
          font-size: 15px !important;
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
          color: #F5F5F7;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .fc-col-header-cell-cmn {
          padding: 8px 0 !important;
          background: rgba(20, 20, 27, 0.4);
          font-size: 10px;
          font-weight: 700;
          color: #A8A8B3;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .fc-day {
          cursor: pointer;
        }
        .fc-day:hover {
          background-color: rgba(255, 255, 255, 0.01);
        }
        .fc-event {
          border-radius: 6px;
          padding: 2px 4px;
          font-size: 9.5px;
          font-weight: 700;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          margin-bottom: 2px;
        }
        .fc-daygrid-day-number {
          font-size: 10px;
          font-weight: 600;
          color: #A8A8B3;
          padding: 6px !important;
        }
        .fc-scrollgrid {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-text-primary mb-2">Workspace Calendar</h1>
          <p className="text-sm text-text-secondary">Schedule exams, meetings, learning sprints, and interview rounds.</p>
        </div>
        <button
          onClick={() => {
            setSelectedEvent(null);
            setTitle('');
            setDescription('');
            setStart(new Date().toISOString().substring(0, 16));
            setEnd(new Date().toISOString().substring(0, 16));
            setModalOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-tr from-brand-wine to-brand-rose hover:from-brand-rose hover:to-brand-pink text-xs font-semibold text-text-primary rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-brand-wine/10"
        >
          <Plus className="w-4 h-4" /> Add Calendar Event
        </button>
      </div>

      {/* Calendar Card container */}
      <div className="p-6 rounded-2xl glass-panel border border-white/5 shadow-2xl bg-[#14141B]/20">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={formattedEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={false}
          selectable={true}
          height="auto"
        />
      </div>

      {/* Detail / Create Event Modal */}
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
              className="relative w-full max-w-md p-6 rounded-2xl glass-panel border border-white/10 flex flex-col gap-4 shadow-2xl z-10 text-left"
            >
              <h3 className="text-sm font-bold text-text-primary font-display border-b border-white/5 pb-3">
                {selectedEvent ? 'Event Details' : 'Create Calendar Event'}
              </h3>

              {selectedEvent ? (
                /* Detail mode */
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getEventColor(selectedEvent.type) }}
                    />
                    <div className="flex flex-col">
                      <h4 className="text-sm font-bold text-text-primary font-display">{selectedEvent.title}</h4>
                      <span className="text-[9px] font-mono font-bold text-brand-pink mt-0.5">{selectedEvent.type.toUpperCase()}</span>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <div className="p-3 bg-white/2 rounded-xl border border-white/5 flex gap-2">
                      <FileText className="w-4.5 h-4.5 text-text-secondary/40 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-text-secondary leading-relaxed font-sans">{selectedEvent.description}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Clock className="w-4 h-4 text-brand-pink" />
                      <span className="font-mono">
                        {new Date(selectedEvent.start).toLocaleString()} to {new Date(selectedEvent.end).toLocaleString()}
                      </span>
                    </div>
                    {selectedEvent.allDay && (
                      <span className="text-[9px] font-mono font-bold text-emerald-400">All-Day Blocked</span>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 border border-white/5 hover:bg-white/5 text-xs font-semibold text-text-primary rounded-xl transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 bg-brand-wine/20 hover:bg-brand-wine/40 text-brand-pink border border-brand-rose/25 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Event
                    </button>
                  </div>
                </div>
              ) : (
                /* Create Form mode */
                <form onSubmit={handleSave} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-text-secondary/70 font-mono font-bold uppercase">Event Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. FastAPI Core Review"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/25 text-xs text-text-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-text-secondary/70 font-mono font-bold uppercase">Description</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Agenda details..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/25 text-xs text-text-primary focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-text-secondary/70 font-mono font-bold uppercase">Start Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/25 text-xs text-text-primary focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-text-secondary/70 font-mono font-bold uppercase">End Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/25 text-xs text-text-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-center mt-1">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-text-secondary/70 font-mono font-bold uppercase">Category Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as CalendarEvent['type'])}
                        className="w-full px-3.5 py-2 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/25 text-xs text-text-primary focus:outline-none"
                      >
                        {EVENT_TYPES.map(t => (
                          <option key={t} value={t} className="bg-surface-dark">{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 mt-5">
                      <input
                        type="checkbox"
                        id="allDayCheckbox"
                        checked={allDay}
                        onChange={(e) => setAllDay(e.target.checked)}
                        className="w-4 h-4 rounded border-white/10 bg-white/3 text-brand-pink focus:ring-brand-rose/30 cursor-pointer"
                      />
                      <label htmlFor="allDayCheckbox" className="text-xs text-text-secondary select-none cursor-pointer">All Day Event</label>
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
                      Save Event
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
