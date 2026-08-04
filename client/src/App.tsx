import { useState, useEffect, useMemo, useRef } from 'react';

// Interfaces
interface Task { id: number; title: string; status: string; priority: string; dueDate: string; createdAt: string; }
interface Note { id: number; content: string; isPinned: boolean; createdAt: string; }
interface Meeting { id: number; title: string; date: string; createdAt: string; }

// Helper
const getLocalDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  
  const [newNote, setNewNote] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState('');

  // Calendar specific
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());

  // Edit states
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Top bar states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Profile states
  const [profileName, setProfileName] = useState(() => localStorage.getItem('profileName') || 'Alex');
  const [profileEmail, setProfileEmail] = useState(() => localStorage.getItem('profileEmail') || 'alex@focusflow.app');

  const handleSaveProfile = () => {
    localStorage.setItem('profileName', profileName);
    localStorage.setItem('profileEmail', profileEmail);
    setShowProfile(false);
  };
  
  // Close dropdowns when clicking outside
  const headerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
        setShowSettings(false);
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, notesRes, meetingsRes] = await Promise.all([
        fetch('http://localhost:8000/api/tasks'),
        fetch('http://localhost:8000/api/notes'),
        fetch('http://localhost:8000/api/meetings')
      ]);
      setTasks(await tasksRes.json());
      setNotes(await notesRes.json());
      setMeetings(await meetingsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Tasks ---
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTask, status: 'pending', priority: newTaskPriority, dueDate: newTaskDueDate })
      });
      const task = await res.json();
      setTasks(prev => [task, ...prev]);
      setNewTask('');
      setNewTaskDueDate('');
    } catch (error) { console.error('Error:', error); }
  };

  const handleUpdateTask = async (task: Task, updates: Partial<Task>) => {
    try {
      const res = await fetch(`http://localhost:8000/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updated } : t));
      setEditingTask(null);
    } catch (error) { console.error('Error:', error); }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) { console.error('Error:', error); }
  };

  const toggleTaskStatus = (task: Task) => {
    handleUpdateTask(task, { status: task.status === 'done' ? 'pending' : 'done' });
  };

  // --- Notes ---
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote, isPinned: false })
      });
      const note = await res.json();
      setNotes(prev => [...prev, note]);
      setNewNote('');
    } catch (error) { console.error('Error:', error); }
  };

  const handleUpdateNote = async (note: Note, updates: Partial<Note>) => {
    try {
      const res = await fetch(`http://localhost:8000/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, ...updated } : n));
      setEditingNote(null);
    } catch (error) { console.error('Error:', error); }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/api/notes/${id}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (error) { console.error('Error:', error); }
  };

  const togglePinNote = (note: Note) => {
    handleUpdateNote(note, { isPinned: !note.isPinned });
  };

  // --- Meetings ---
  const handleAddMeeting = async () => {
    if (!newMeetingTitle.trim() || !newMeetingDate.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newMeetingTitle, date: newMeetingDate })
      });
      const meeting = await res.json();
      setMeetings(prev => [...prev, meeting].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setNewMeetingTitle('');
      setNewMeetingDate('');
    } catch (error) { console.error('Error:', error); }
  };

  const handleUpdateMeeting = async (meeting: Meeting, updates: Partial<Meeting>) => {
    try {
      const res = await fetch(`http://localhost:8000/api/meetings/${meeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, ...updated } : m).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setEditingMeeting(null);
    } catch (error) { console.error('Error:', error); }
  };

  const handleDeleteMeeting = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/api/meetings/${id}`, { method: 'DELETE' });
      setMeetings(prev => prev.filter(m => m.id !== id));
    } catch (error) { console.error('Error:', error); }
  };

  // --- Global Search ---
  const searchResults = useMemo(() => {
    if (!searchQuery) return { tasks: [], notes: [], meetings: [] };
    const q = searchQuery.toLowerCase();
    return {
      tasks: tasks.filter(t => t.title.toLowerCase().includes(q)),
      notes: notes.filter(n => n.content.toLowerCase().includes(q)),
      meetings: meetings.filter(m => m.title.toLowerCase().includes(q))
    };
  }, [searchQuery, tasks, notes, meetings]);

  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'notes', icon: 'description', label: 'Notes' },
    { id: 'tasks', icon: 'check_circle', label: 'Tasks' },
    { id: 'calendar', icon: 'calendar_month', label: 'Calendar' }
  ];

  return (
    <div className="flex w-full min-h-screen bg-surface relative">
      {/* SideNavBar */}
      <nav className="hidden md:flex bg-surface-container-low h-screen w-64 fixed left-0 top-0 border-r border-outline-variant flex-col py-6 px-4 z-50">
        <div className="mb-8 px-2">
          <h1 className="font-headline-sm text-[20px] font-bold text-primary flex items-center">
            <span className="material-symbols-outlined mr-2">token</span>
            FocusFlow
          </h1>
          <p className="font-label-md text-[12px] text-on-surface-variant mt-1">Productivity Workspace</p>
        </div>
        <div className="flex-1 space-y-2">
          {navItems.map(item => (
            <a 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item flex items-center px-3 py-3 rounded-lg cursor-pointer transition-all ${
                activeTab === item.id 
                  ? 'active bg-primary/10 text-primary font-bold shadow-sm' 
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined mr-4">{item.icon}</span>
              <span className="font-body-sm text-[14px]">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ml-64 w-full md:w-[calc(100%-16rem)] min-h-screen">
        {/* TopNavBar */}
        <header className="header bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center h-16 px-6 sticky top-0 z-40">
          <div className="flex-1 max-w-lg relative group hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-transparent rounded-full font-body-sm text-[14px] text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-surface transition-all outline-none shadow-sm" 
              placeholder="Global Search..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            {/* Search Dropdown */}
            {isSearchFocused && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg max-h-96 overflow-y-auto z-50">
                <div className="p-2">
                  {searchResults.tasks.length > 0 && (
                    <div className="mb-2">
                      <h4 className="font-label-sm text-on-surface-variant px-2 py-1 uppercase tracking-wider">Tasks</h4>
                      {searchResults.tasks.map(t => (
                        <div key={t.id} className="px-3 py-2 hover:bg-surface-container-low rounded-lg cursor-pointer flex items-center" onClick={() => setActiveTab('tasks')}>
                          <span className="material-symbols-outlined text-[16px] mr-2 text-primary">task_alt</span>
                          <span className="font-body-sm truncate">{t.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.notes.length > 0 && (
                    <div className="mb-2">
                      <h4 className="font-label-sm text-on-surface-variant px-2 py-1 uppercase tracking-wider">Notes</h4>
                      {searchResults.notes.map(n => (
                        <div key={n.id} className="px-3 py-2 hover:bg-surface-container-low rounded-lg cursor-pointer flex items-center" onClick={() => setActiveTab('notes')}>
                          <span className="material-symbols-outlined text-[16px] mr-2 text-primary">description</span>
                          <span className="font-body-sm truncate">{n.content.substring(0, 40)}...</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.meetings.length > 0 && (
                    <div className="mb-2">
                      <h4 className="font-label-sm text-on-surface-variant px-2 py-1 uppercase tracking-wider">Meetings</h4>
                      {searchResults.meetings.map(m => (
                        <div key={m.id} className="px-3 py-2 hover:bg-surface-container-low rounded-lg cursor-pointer flex items-center" onClick={() => setActiveTab('calendar')}>
                          <span className="material-symbols-outlined text-[16px] mr-2 text-primary">event</span>
                          <span className="font-body-sm truncate">{m.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.tasks.length === 0 && searchResults.notes.length === 0 && searchResults.meetings.length === 0 && (
                     <div className="p-4 text-center font-body-sm text-on-surface-variant">No results found</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4 ml-auto" ref={headerRef}>
            <div className="relative">
              <button onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); setShowProfile(false); }} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 p-4">
                  <h4 className="font-headline-sm text-[16px] font-bold text-on-surface mb-2">Notifications</h4>
                  <div className="p-3 bg-surface-container-low rounded-lg text-center text-on-surface-variant font-body-sm">
                    No new notifications
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); setShowProfile(false); }} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors">
                <span className="material-symbols-outlined">settings</span>
              </button>
              {showSettings && (
                <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 p-4">
                  <h4 className="font-headline-sm text-[16px] font-bold text-on-surface mb-3">Preferences</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4" defaultChecked />
                      <span className="font-body-sm text-on-surface">Enable Dark Mode</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4" defaultChecked />
                      <span className="font-body-sm text-on-surface">Email Summaries</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <div onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowSettings(false); }} className="w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center font-bold font-body-sm shadow-sm cursor-pointer ml-2 hover:opacity-90 transition-opacity">
                {profileName.charAt(0).toUpperCase()}
              </div>
              {showProfile && (
                <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 p-4">
                  <h4 className="font-headline-sm text-[16px] font-bold text-on-surface mb-3">Profile Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block font-label-md text-on-surface-variant mb-1">Name</label>
                      <input 
                        type="text"
                        className="w-full bg-surface-container-low border border-transparent rounded-lg px-3 py-2 text-on-surface font-body-sm focus:ring-2 focus:ring-primary outline-none"
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-on-surface-variant mb-1">Email</label>
                      <input 
                        type="email"
                        className="w-full bg-surface-container-low border border-transparent rounded-lg px-3 py-2 text-on-surface font-body-sm focus:ring-2 focus:ring-primary outline-none"
                        value={profileEmail}
                        onChange={e => setProfileEmail(e.target.value)}
                      />
                    </div>
                    <button onClick={handleSaveProfile} className="w-full bg-primary hover:bg-primary/90 text-on-primary py-2 rounded-lg font-bold transition-all shadow-sm">
                      Save Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
          {activeTab === 'dashboard' && (
            <>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="font-headline-lg text-[24px] md:text-[32px] font-bold text-on-surface">Good Morning, {profileName}</h2>
                  <p className="text-on-surface-variant font-body-md mt-1">Here is what's happening today.</p>
                </div>
                <div className="flex space-x-3">
                   <button onClick={() => setActiveTab('tasks')} className="bg-primary hover:bg-primary/90 text-on-primary px-4 py-2 rounded-lg font-bold transition-all shadow-sm flex items-center font-body-sm">
                      <span className="material-symbols-outlined mr-2 text-[18px]">add_task</span> Add Task
                   </button>
                   <button onClick={() => setActiveTab('notes')} className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg font-bold transition-all shadow-sm flex items-center border border-outline-variant font-body-sm">
                      <span className="material-symbols-outlined mr-2 text-[18px]">note_add</span> New Note
                   </button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-headline-sm text-[20px] font-bold flex items-center text-on-surface">
                      <span className="material-symbols-outlined mr-2 text-primary">task_alt</span>
                      Pending Tasks
                    </h3>
                    <button onClick={() => setActiveTab('tasks')} className="text-primary font-body-sm font-semibold hover:underline">View All</button>
                  </div>
                  <div className="flex-1 space-y-2">
                    {tasks.filter(t => t.status !== 'done').slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center p-3 rounded-lg border border-transparent hover:border-outline-variant hover:bg-surface-container-low transition-all">
                        <input type="checkbox" checked={task.status === 'done'} onChange={() => toggleTaskStatus(task)} className="mr-4 rounded border-outline-variant text-primary h-5 w-5 cursor-pointer focus:ring-primary transition-all flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-body-md text-[15px] font-medium truncate text-on-surface">{task.title}</p>
                          <div className="flex items-center mt-1 space-x-2">
                            {task.priority === 'high' && <span className="text-[10px] uppercase font-bold text-error bg-error-container px-2 py-0.5 rounded-full">High</span>}
                            {task.priority === 'medium' && <span className="text-[10px] uppercase font-bold text-tertiary bg-tertiary-container px-2 py-0.5 rounded-full">Med</span>}
                            {task.priority === 'low' && <span className="text-[10px] uppercase font-bold text-secondary bg-secondary-container px-2 py-0.5 rounded-full">Low</span>}
                            {task.dueDate && <span className="text-[12px] text-on-surface-variant flex items-center"><span className="material-symbols-outlined text-[12px] mr-1">schedule</span>{task.dueDate}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {tasks.filter(t => t.status !== 'done').length === 0 && <p className="text-on-surface-variant font-body-sm py-4 text-center">All caught up!</p>}
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-headline-sm text-[20px] font-bold flex items-center text-on-surface">
                      <span className="material-symbols-outlined mr-2 text-primary">calendar_month</span>
                      Upcoming Meetings
                    </h3>
                    <button onClick={() => setActiveTab('calendar')} className="text-primary font-body-sm font-semibold hover:underline">View Calendar</button>
                  </div>
                  <div className="flex-1 space-y-3">
                    {meetings.slice(0, 5).map(meeting => (
                      <div key={meeting.id} className="flex items-center p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-transparent hover:border-outline-variant transition-all">
                        <div className="bg-primary/10 text-primary p-2 rounded-lg mr-4 flex-shrink-0">
                          <span className="material-symbols-outlined">event</span>
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-body-sm text-[14px] font-semibold text-on-surface truncate">{meeting.title}</p>
                          <p className="font-label-sm text-[12px] text-on-surface-variant mt-0.5">{new Date(meeting.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        </div>
                      </div>
                    ))}
                    {meetings.length === 0 && <p className="text-on-surface-variant font-body-sm py-4 text-center">No upcoming meetings.</p>}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-headline-sm text-[20px] font-bold flex items-center text-on-surface mb-4">
                  <span className="material-symbols-outlined mr-2 text-on-surface-variant">push_pin</span>
                  Pinned Notes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {notes.filter(n => n.isPinned).map(note => (
                    <div key={note.id} className="bg-surface-bright p-5 rounded-xl shadow-sm border border-outline-variant hover:shadow-md transition-shadow flex flex-col group relative">
                      <button onClick={() => togglePinNote(note)} className="absolute top-2 right-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="material-symbols-outlined text-[18px]">push_pin</span>
                      </button>
                      <p className="font-body-sm text-[14px] text-on-surface-variant whitespace-pre-wrap flex-1">{note.content}</p>
                    </div>
                  ))}
                  {notes.filter(n => n.isPinned).length === 0 && <p className="text-on-surface-variant font-body-sm col-span-full py-4">No pinned notes. Go to Notes to pin some!</p>}
                </div>
              </div>
            </>
          )}

          {activeTab === 'notes' && (
            <div className="flex flex-col h-[calc(100vh-12rem)] space-y-4">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {notes.map(note => (
                  <div key={note.id} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant hover:shadow-md transition-all group relative">
                    {editingNote?.id === note.id ? (
                      <div className="flex flex-col space-y-2">
                        <textarea 
                          className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary text-on-surface font-body-sm min-h-[100px]"
                          value={editingNote.content}
                          onChange={e => setEditingNote({ ...editingNote, content: e.target.value })}
                        />
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => setEditingNote(null)} className="px-3 py-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg font-body-sm font-semibold transition-colors">Cancel</button>
                          <button onClick={() => handleUpdateNote(note, { content: editingNote.content })} className="px-3 py-1.5 bg-primary text-on-primary rounded-lg font-body-sm font-bold shadow-sm transition-colors hover:bg-primary/90">Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => togglePinNote(note)} className={`p-1.5 rounded-lg hover:bg-surface-container-high transition-colors ${note.isPinned ? 'text-primary' : 'text-on-surface-variant'}`} title="Pin Note">
                             <span className="material-symbols-outlined text-[18px]">push_pin</span>
                          </button>
                          <button onClick={() => setEditingNote(note)} className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors" title="Edit">
                             <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => handleDeleteNote(note.id)} className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-colors" title="Delete">
                             <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                        <p className="font-body-md text-on-surface whitespace-pre-wrap pr-16">{note.content}</p>
                        <p className="font-label-sm text-[11px] text-on-surface-variant mt-4">{new Date(note.createdAt).toLocaleString()}</p>
                      </>
                    )}
                  </div>
                ))}
                {notes.length === 0 && <p className="text-on-surface-variant font-body-sm text-center py-10">No notes found.</p>}
              </div>
              <div className="flex space-x-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm flex-shrink-0">
                <input 
                  type="text" 
                  placeholder="Type a new note..." 
                  className="flex-1 bg-surface-container-low border border-transparent rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-on-surface font-body-sm"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                />
                <button onClick={handleAddNote} className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-3 rounded-lg font-bold transition-all shadow-sm whitespace-nowrap flex items-center">
                   <span className="material-symbols-outlined mr-2">send</span> Add Note
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="flex flex-col h-[calc(100vh-12rem)] space-y-6 w-full max-w-4xl mx-auto">
              <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm flex-shrink-0 flex flex-col md:flex-row gap-4 items-center">
                <input 
                  type="text" 
                  placeholder="What needs to be done?" 
                  className="flex-1 w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-on-surface font-body-sm"
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                />
                <div className="flex items-center w-full md:w-auto gap-3">
                  <select 
                     className="bg-surface-container-low border border-transparent rounded-lg px-3 py-2.5 text-on-surface font-body-sm focus:ring-2 focus:ring-primary outline-none"
                     value={newTaskPriority}
                     onChange={e => setNewTaskPriority(e.target.value)}
                  >
                     <option value="low">Low Priority</option>
                     <option value="medium">Medium Priority</option>
                     <option value="high">High Priority</option>
                  </select>
                  <input 
                     type="date"
                     className="bg-surface-container-low border border-transparent rounded-lg px-3 py-2.5 text-on-surface font-body-sm focus:ring-2 focus:ring-primary outline-none"
                     value={newTaskDueDate}
                     onChange={e => setNewTaskDueDate(e.target.value)}
                  />
                  <button onClick={handleAddTask} className="bg-primary hover:bg-primary/90 text-on-primary px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm flex items-center whitespace-nowrap ml-auto">
                    <span className="material-symbols-outlined mr-2">add</span> Add Task
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm overflow-hidden flex flex-col min-h-0">
                 <h3 className="font-headline-sm text-[18px] font-bold text-on-surface mb-4 flex-shrink-0">All Tasks</h3>
                 <div className="overflow-y-auto pr-2 space-y-2 flex-1">
                    {tasks.map(task => (
                      <div key={task.id} className={`flex items-center p-3 rounded-lg border-l-4 transition-all group ${task.status === 'done' ? 'border-secondary opacity-60 bg-surface-container-low/50' : 'border-transparent bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/30'}`}>
                        {editingTask?.id === task.id ? (
                           <div className="flex-1 flex flex-col sm:flex-row gap-3 py-1">
                              <input 
                                className="flex-1 bg-surface-container-high border-none rounded px-3 py-1.5 text-on-surface font-body-sm focus:ring-2 focus:ring-primary"
                                value={editingTask.title}
                                onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                              />
                              <select 
                                 className="bg-surface-container-high border-none rounded px-2 py-1.5 text-on-surface font-body-sm focus:ring-2 focus:ring-primary"
                                 value={editingTask.priority}
                                 onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })}
                              >
                                 <option value="low">Low</option>
                                 <option value="medium">Medium</option>
                                 <option value="high">High</option>
                              </select>
                              <input 
                                 type="date"
                                 className="bg-surface-container-high border-none rounded px-2 py-1.5 text-on-surface font-body-sm focus:ring-2 focus:ring-primary"
                                 value={editingTask.dueDate}
                                 onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                              />
                              <div className="flex space-x-1">
                                 <button onClick={() => handleUpdateTask(task, { title: editingTask.title, priority: editingTask.priority, dueDate: editingTask.dueDate })} className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"><span className="material-symbols-outlined">check</span></button>
                                 <button onClick={() => setEditingTask(null)} className="p-1.5 text-on-surface-variant hover:bg-surface-container-highest rounded transition-colors"><span className="material-symbols-outlined">close</span></button>
                              </div>
                           </div>
                        ) : (
                           <>
                              <input type="checkbox" checked={task.status === 'done'} onChange={() => toggleTaskStatus(task)} className="mr-4 rounded border-outline-variant text-primary h-5 w-5 cursor-pointer focus:ring-primary transition-all flex-shrink-0" />
                              <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center">
                                <p className={`font-body-md text-[15px] font-medium truncate flex-1 ${task.status === 'done' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{task.title}</p>
                                <div className="flex items-center space-x-3 mt-1 md:mt-0 md:ml-4">
                                  {task.dueDate && <span className="text-[12px] text-on-surface-variant flex items-center whitespace-nowrap"><span className="material-symbols-outlined text-[14px] mr-1">event</span>{task.dueDate}</span>}
                                  {task.priority === 'high' && <span className="text-[11px] uppercase font-bold text-error bg-error-container px-2.5 py-0.5 rounded-full">High</span>}
                                  {task.priority === 'medium' && <span className="text-[11px] uppercase font-bold text-tertiary bg-tertiary-container px-2.5 py-0.5 rounded-full">Med</span>}
                                  {task.priority === 'low' && <span className="text-[11px] uppercase font-bold text-secondary bg-secondary-container px-2.5 py-0.5 rounded-full">Low</span>}
                                </div>
                              </div>
                              <div className="ml-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingTask(task)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                                <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                              </div>
                           </>
                        )}
                      </div>
                    ))}
                    {tasks.length === 0 && (
                       <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                          <span className="material-symbols-outlined text-4xl mb-3 opacity-50">task</span>
                          <p className="font-body-md">No tasks found. Get started by adding one above!</p>
                       </div>
                    )}
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] w-full">
              <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
                 <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                    <h3 className="font-headline-sm text-[18px] font-bold text-on-surface mb-4 flex items-center">
                       <span className="material-symbols-outlined mr-2">today</span>
                       Select Date
                    </h3>
                    <input 
                       type="date"
                       className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:ring-2 focus:ring-primary outline-none transition-all"
                       value={selectedDate}
                       onChange={e => setSelectedDate(e.target.value)}
                    />
                 </div>

                 <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex-1">
                    <h3 className="font-headline-sm text-[18px] font-bold text-on-surface mb-4">Schedule Meeting</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block font-label-md text-on-surface-variant mb-1">Title</label>
                        <input 
                          type="text" 
                          placeholder="Meeting title" 
                          className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-on-surface font-body-sm"
                          value={newMeetingTitle}
                          onChange={e => setNewMeetingTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block font-label-md text-on-surface-variant mb-1">Date & Time</label>
                        <input 
                          type="datetime-local" 
                          className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-on-surface font-body-sm"
                          value={newMeetingDate}
                          onChange={e => setNewMeetingDate(e.target.value)}
                        />
                      </div>
                      <button onClick={handleAddMeeting} className="w-full bg-primary hover:bg-primary/90 text-on-primary py-2.5 rounded-lg font-bold transition-all shadow-sm flex justify-center items-center mt-2">
                        <span className="material-symbols-outlined mr-2">add</span> Add Meeting
                      </button>
                    </div>
                 </div>
              </div>

              <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm overflow-hidden flex flex-col min-h-0 relative">
                 <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <h3 className="font-headline-sm text-[20px] font-bold text-on-surface flex items-center">
                       <span className="material-symbols-outlined mr-2 text-primary">calendar_view_day</span>
                       Agenda for {new Date(selectedDate).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h3>
                    <button onClick={() => setSelectedDate(getLocalDateString())} className="text-primary font-body-sm font-semibold hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                       Today
                    </button>
                 </div>
                 
                 <div className="overflow-y-auto pr-2 space-y-6 flex-1">
                    {/* Meetings Section */}
                    <div>
                       <h4 className="font-label-md uppercase tracking-wider text-on-surface-variant mb-3 border-b border-outline-variant/30 pb-2">Meetings & Events</h4>
                       <div className="space-y-3">
                          {meetings.filter(m => m.date.startsWith(selectedDate)).length === 0 && (
                             <p className="text-on-surface-variant font-body-sm italic">No meetings scheduled for this date.</p>
                          )}
                          {meetings.filter(m => m.date.startsWith(selectedDate)).map(meeting => (
                            <div key={meeting.id} className="flex items-center p-4 rounded-xl bg-surface-container-low border border-transparent hover:border-outline-variant transition-all group">
                              {editingMeeting?.id === meeting.id ? (
                                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                                   <input 
                                     className="flex-1 bg-surface-container-high border-none rounded px-3 py-2 text-on-surface font-body-sm focus:ring-2 focus:ring-primary"
                                     value={editingMeeting.title}
                                     onChange={e => setEditingMeeting({ ...editingMeeting, title: e.target.value })}
                                   />
                                   <input 
                                      type="datetime-local"
                                      className="bg-surface-container-high border-none rounded px-3 py-2 text-on-surface font-body-sm focus:ring-2 focus:ring-primary"
                                      value={editingMeeting.date}
                                      onChange={e => setEditingMeeting({ ...editingMeeting, date: e.target.value })}
                                   />
                                   <div className="flex space-x-2">
                                      <button onClick={() => handleUpdateMeeting(meeting, { title: editingMeeting.title, date: editingMeeting.date })} className="bg-primary text-on-primary px-3 py-2 rounded font-bold text-sm">Save</button>
                                      <button onClick={() => setEditingMeeting(null)} className="bg-surface-container-highest text-on-surface px-3 py-2 rounded font-bold text-sm">Cancel</button>
                                   </div>
                                </div>
                              ) : (
                                <>
                                  <div className="bg-primary/10 text-primary p-3 rounded-xl mr-5 flex-shrink-0">
                                    <span className="material-symbols-outlined text-2xl">event</span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-body-lg text-[16px] font-semibold text-on-surface truncate">{meeting.title}</p>
                                    <p className="font-body-sm text-[14px] text-on-surface-variant mt-1 flex items-center">
                                       <span className="material-symbols-outlined text-[14px] mr-1">schedule</span>
                                       {new Date(meeting.date).toLocaleTimeString([], { timeStyle: 'short' })}
                                    </p>
                                  </div>
                                  <div className="ml-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingMeeting(meeting)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors"><span className="material-symbols-outlined">edit</span></button>
                                    <button onClick={() => handleDeleteMeeting(meeting.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"><span className="material-symbols-outlined">delete</span></button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Tasks Section */}
                    <div>
                       <h4 className="font-label-md uppercase tracking-wider text-on-surface-variant mb-3 border-b border-outline-variant/30 pb-2">Due Tasks</h4>
                       <div className="space-y-2">
                          {tasks.filter(t => t.dueDate === selectedDate).length === 0 && (
                             <p className="text-on-surface-variant font-body-sm italic">No tasks due on this date.</p>
                          )}
                          {tasks.filter(t => t.dueDate === selectedDate).map(task => (
                            <div key={task.id} className="flex items-center p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 hover:bg-surface-container-low transition-all">
                              <input type="checkbox" checked={task.status === 'done'} onChange={() => toggleTaskStatus(task)} className="mr-4 rounded border-outline-variant text-primary h-5 w-5 cursor-pointer focus:ring-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <p className={`font-body-md text-[15px] font-medium truncate ${task.status === 'done' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{task.title}</p>
                                {task.priority === 'high' && <span className="text-[11px] uppercase font-bold text-error bg-error-container px-2 py-0.5 rounded-full ml-2">High</span>}
                              </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
