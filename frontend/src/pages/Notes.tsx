import React, { useState, useRef, useEffect } from 'react';
import { useNotes } from '../context/NotesContext';
import type { Note } from '../context/NotesContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Sparkles, 
  Heading1, 
  Bold, 
  Italic, 
  List, 
  Code,
  FileText
} from 'lucide-react';

const CATEGORIES: Note['category'][] = [
  'Learning Notes',
  'Interview Notes',
  'Career Notes',
  'Project Notes',
  'Personal Notes'
];

export const Notes: React.FC = () => {
  const { 
    notes, 
    createNote, 
    updateNote, 
    deleteNote, 
    pinNote, 
    summarizeNoteAI, 
    extractPointsAI, 
    generateRevisionAI 
  } = useNotes();
  
  const { addNotification } = useNotifications();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI processing feedback states
  const [aiWorking, setAiWorking] = useState<'summarize' | 'extract' | 'revision' | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  // Set first note active on mount
  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  // Sync editor content with activeNote
  useEffect(() => {
    if (editorRef.current && activeNote) {
      if (editorRef.current.innerHTML !== activeNote.content) {
        editorRef.current.innerHTML = activeNote.content || '<p><br></p>';
      }
    }
  }, [activeNoteId]);

  const handleEditorInput = () => {
    if (editorRef.current && activeNote) {
      updateNote(activeNote.id, { content: editorRef.current.innerHTML });
    }
  };

  // Editor styling helpers
  const formatText = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const handleAiAction = async (action: 'summarize' | 'extract' | 'revision') => {
    if (!activeNote) return;
    setAiWorking(action);
    try {
      if (action === 'summarize') {
        await summarizeNoteAI(activeNote.id);
        addNotification('Note Summarized', 'AI summary appended to the bottom.', 'success');
      } else if (action === 'extract') {
        await extractPointsAI(activeNote.id);
        addNotification('Key Takeaways Extracted', 'AI bullet points appended.', 'success');
      } else if (action === 'revision') {
        await generateRevisionAI(activeNote.id);
        addNotification('Revision Guide Generated', 'Study questions appended.', 'success');
      }
      
      // Update local editor DOM if active
      if (editorRef.current) {
        const freshNote = notes.find(n => n.id === activeNote.id);
        if (freshNote) {
          editorRef.current.innerHTML = freshNote.content;
        }
      }
    } catch (err) {
      addNotification('AI Service Timeout', 'Failed to contact OpenRouter API.', 'warning');
    } finally {
      setAiWorking(null);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesCat = selectedCategory === 'All' || note.category === selectedCategory;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Split pinned and unpinned
  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#0B0B0F] h-[calc(100vh-4rem)] overflow-hidden font-sans">
      
      {/* Left sidebar: Notes lists */}
      <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/5 bg-[#14141B]/20 flex flex-col flex-shrink-0 h-56 md:h-auto overflow-y-auto">
        <div className="p-4 flex flex-col gap-3 border-b border-white/5 bg-white/1">
          <button
            onClick={() => {
              const newId = createNote(selectedCategory !== 'All' ? selectedCategory as Note['category'] : 'Learning Notes');
              setActiveNoteId(newId);
              addNotification('Note Created', 'Draft initialized.', 'info');
            }}
            className="w-full py-2 bg-gradient-to-tr from-brand-wine to-brand-rose hover:from-brand-rose hover:to-brand-pink text-xs font-semibold text-text-primary rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-brand-wine/20"
          >
            <Plus className="w-4 h-4" /> New Smart Note
          </button>

          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/50">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input 
              type="text"
              placeholder="Search note contents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white/3 border border-white/5 focus:border-brand-rose/25 rounded-xl text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Category list filters */}
        <div className="p-3 border-b border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          <button 
            onClick={() => setSelectedCategory('All')}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'All' 
                ? 'bg-brand-wine/30 border-brand-rose/40 text-brand-pink' 
                : 'bg-white/3 border-white/5 text-text-secondary hover:text-text-primary'
            }`}
          >
            All Notes
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-brand-wine/30 border-brand-rose/40 text-brand-pink' 
                  : 'bg-white/3 border-white/5 text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat.replace(' Notes', '')}
            </button>
          ))}
        </div>

        {/* Note list details */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-xs text-text-secondary/40 font-mono">
              No notes matched filters.
            </div>
          ) : (
            <>
              {/* Pinned section */}
              {pinnedNotes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-brand-pink font-mono font-bold tracking-widest uppercase px-1">PINNED</span>
                  {pinnedNotes.map(note => renderNoteItem(note))}
                </div>
              )}

              {/* Regular section */}
              {otherNotes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {pinnedNotes.length > 0 && <span className="text-[9px] text-text-secondary/40 font-mono font-bold tracking-widest uppercase px-1 mt-2">NOTES</span>}
                  {otherNotes.map(note => renderNoteItem(note))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right editor panel */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeNote ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Editor TopBar / Meta controls */}
            <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#14141B]/30">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={activeNote.category}
                  onChange={(e) => updateNote(activeNote.id, { category: e.target.value as Note['category'] })}
                  className="bg-white/3 border border-white/5 text-[10px] text-brand-pink font-semibold px-2 py-1 rounded-lg focus:outline-none focus:border-brand-rose/30"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-surface-dark text-text-primary">{cat}</option>
                  ))}
                </select>
                <span className="text-[10px] text-text-secondary/50 font-mono">{activeNote.updatedAt}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => pinNote(activeNote.id)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    activeNote.pinned 
                      ? 'bg-brand-pink/15 border-brand-rose/30 text-brand-pink' 
                      : 'border-white/5 text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                  title="Pin Note"
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    deleteNote(activeNote.id);
                    setActiveNoteId(notes.find(n => n.id !== activeNote.id)?.id || null);
                    addNotification('Note Deleted', 'Draft removed.', 'info');
                  }}
                  className="p-1.5 border border-white/5 hover:border-brand-rose/20 text-text-secondary hover:text-brand-pink hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Rich Editor Toolbar */}
            <div className="px-4 py-2 border-b border-white/5 bg-white/1 flex gap-1.5 flex-wrap items-center">
              <button onClick={() => formatText('bold')} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-all cursor-pointer"><Bold className="w-3.5 h-3.5" /></button>
              <button onClick={() => formatText('italic')} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-all cursor-pointer"><Italic className="w-3.5 h-3.5" /></button>
              <button onClick={() => formatText('insertUnorderedList')} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-all cursor-pointer"><List className="w-3.5 h-3.5" /></button>
              <button onClick={() => formatText('formatBlock', '<pre>')} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-all cursor-pointer"><Code className="w-3.5 h-3.5" /></button>
              <button onClick={() => formatText('formatBlock', '<h1>')} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-all cursor-pointer"><Heading1 className="w-3.5 h-3.5" /></button>
              
              <div className="w-px h-4 bg-white/10 mx-1.5" />

              {/* AI helper options */}
              <div className="flex gap-1.5 items-center">
                <span className="text-[9px] text-text-secondary/50 font-mono font-bold tracking-wider">AI ASSIST:</span>
                {[
                  { id: 'summarize', label: 'Summarize', loadingLabel: 'Summarizing...' },
                  { id: 'extract', label: 'Extract Points', loadingLabel: 'Extracting...' },
                  { id: 'revision', label: 'Revision Guide', loadingLabel: 'Compiling...' },
                ].map(action => (
                  <button
                    key={action.id}
                    disabled={aiWorking !== null}
                    onClick={() => handleAiAction(action.id as any)}
                    className="px-2.5 py-1 bg-brand-wine/10 hover:bg-brand-wine/20 text-brand-pink hover:text-brand-pink/90 disabled:opacity-40 border border-brand-rose/20 text-[9.5px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    {aiWorking === action.id ? action.loadingLabel : action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Content Workspace */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                className="w-full text-2xl font-display font-bold text-text-primary bg-transparent border-none focus:outline-none placeholder-text-secondary/35"
                placeholder="Title your note..."
              />
              
              {/* WYSIWYG Editor area */}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                className="flex-1 text-xs text-text-primary focus:outline-none font-sans leading-relaxed whitespace-pre-wrap min-h-[200px]"
                data-placeholder="Start writing notes here..."
                style={{
                  caretColor: '#C14F7D'
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 text-center">
            <FileText className="w-12 h-12 text-text-secondary/30" />
            <span className="text-xs text-text-secondary/50">Select or create a smart note to begin writing</span>
          </div>
        )}
      </div>
    </div>
  );

  function renderNoteItem(note: Note) {
    const isActive = note.id === activeNoteId;
    const bodyText = note.content 
      ? note.content.replace(/<[^>]*>/g, '').substring(0, 50) + '...' 
      : 'Empty note content...';

    return (
      <div
        key={note.id}
        onClick={() => setActiveNoteId(note.id)}
        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
          isActive 
            ? 'bg-brand-wine/10 border-brand-rose/25 text-brand-pink shadow-md' 
            : 'bg-white/2 border-white/5 hover:bg-white/4 text-text-secondary hover:text-text-primary'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <h4 className="text-[11px] font-bold truncate flex-1 font-display">{note.title}</h4>
          {note.pinned && <Pin className="w-3 h-3 text-brand-pink flex-shrink-0" />}
        </div>
        <p className="text-[10px] leading-normal opacity-70 truncate font-sans">{bodyText}</p>
        <div className="flex justify-between items-center mt-2.5 text-[8.5px] font-mono opacity-50">
          <span>{note.category.replace(' Notes', '')}</span>
          <span>{note.createdAt.split(',')[0]}</span>
        </div>
      </div>
    );
  }
};
