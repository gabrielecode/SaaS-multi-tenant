import React, { useState, useMemo } from 'react';
import { Appointment, Client, AppointmentStatus } from '../types';
import { buildWhatsAppUrl, formatPhoneDisplay } from '../lib/phoneUtils';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Plus, 
  Search, 
  MessageSquare, 
  ListTodo, 
  Clock, 
  BarChart2, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Send, 
  ShieldCheck, 
  Users, 
  Sparkles,
  MoreHorizontal
} from 'lucide-react';

interface DashboardProps {
  appointments: Appointment[];
  clients: Client[];
  onNavigateToSection: (section: string) => void;
  onOpenInviteClient?: (client?: Client) => void;
}

export default function Dashboard({ appointments, clients, onNavigateToSection, onOpenInviteClient }: DashboardProps) {
  const [activeTopTab, setActiveTopTab] = useState<'calendar' | 'chat' | 'taskboard' | 'timeline' | 'reports'>('calendar');
  const [calendarViewMode, setCalendarViewMode] = useState<'MONTH' | 'WEEK' | 'DAY'>('MONTH');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Salon milestones / checklist for left sidebar
  const [milestones, setMilestones] = useState([
    { id: 1, label: 'Configurazione WhatsApp Webhook', completed: true },
    { id: 2, label: 'Invio Promemoria Automatici', completed: true },
    { id: 3, label: 'Verifica Caparre & No-Show', completed: true },
    { id: 4, label: 'Sincronizzazione Cloud Postgres', completed: true },
    { id: 5, label: 'Report Finanziario Mensile', completed: false },
  ]);

  const toggleMilestone = (id: number) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
    triggerToast('Stato attività aggiornato');
  };

  // Days of the month grid (Nov 19th style)
  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 1; i <= 30; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      const dateKey = `2026-06-${dayStr}`;
      const dayApps = appointments.filter(a => a.date === dateKey);
      days.push({
        dayNumber: dayStr,
        dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(i - 1) % 7],
        appointments: dayApps
      });
    }
    return days;
  }, [appointments]);

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans antialiased text-slate-900 overflow-x-hidden" id="dashboard-glendale-container">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold py-3 px-4 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. LEFT SIDEBAR (DARK BLUE GLENDALE STYLE)                    */}
      {/* ------------------------------------------------------------- */}
      <aside className="w-72 bg-[#1b43c6] text-white flex flex-col shrink-0 border-r border-blue-600/30 hidden lg:flex">
        
        {/* Profile / Team Header */}
        <div className="p-5 border-b border-blue-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-400 to-amber-300 text-slate-900 font-black flex items-center justify-center text-sm shadow-md">
              GS
            </div>
            <div>
              <h2 className="text-xs font-black tracking-tight text-white flex items-center gap-1">
                Salone Manager Team <span className="text-[10px] bg-blue-500/50 px-1.5 py-0.2 rounded">Pro</span>
              </h2>
              <p className="text-[11px] text-blue-200 truncate max-w-[140px]">gestsocial@salone.it</p>
            </div>
          </div>
        </div>

        {/* Date Navigator Box */}
        <div className="p-4 mx-4 my-3 bg-blue-700/50 rounded-2xl border border-blue-500/30 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-blue-100">TODAY</span>
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-blue-600 rounded-lg transition text-blue-200">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-blue-600 rounded-lg transition text-blue-200">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sidebar Sections & Checklists */}
        <div className="flex-1 px-5 py-2 space-y-6 overflow-y-auto">
          
          {/* Section 1: VISUAL EXPLORATIONS / AUTOMAZIONI */}
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-300">
              5 Automazioni Attive
            </h3>
            <div className="space-y-2">
              {milestones.slice(0, 4).map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleMilestone(item.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                    item.completed ? 'bg-blue-600/50 text-white border border-blue-400/30' : 'bg-blue-800/30 text-blue-300 hover:bg-blue-700/40'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${item.completed ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-blue-400'}`}>
                    {item.completed && <Check className="w-3 h-3" />}
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: DESIGN PRESENTATION / SECURITY AUDIT */}
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-300">
              Compliance & Sicurezza
            </h3>
            <div className="space-y-2">
              {milestones.slice(4).map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleMilestone(item.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                    item.completed ? 'bg-blue-600/50 text-white border border-blue-400/30' : 'bg-blue-800/30 text-blue-300 hover:bg-blue-700/40'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${item.completed ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-blue-400'}`}>
                    {item.completed && <Check className="w-3 h-3" />}
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar Footer / Quick Client Invite */}
        <div className="p-4 border-t border-blue-500/30">
          {onOpenInviteClient && (
            <button
              onClick={() => onOpenInviteClient()}
              className="w-full py-3 bg-white text-blue-700 hover:bg-blue-50 font-black text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Invita Nuovo Cliente</span>
            </button>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN CONTENT AREA (GLENDALE CALENDAR UI)                   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search for people, conversation, files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>

          {/* Navigation Tabs (Curved Pills style) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
            <button
              onClick={() => setActiveTopTab('chat')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTopTab === 'chat' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveTopTab('taskboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTopTab === 'taskboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Task Board</span>
            </button>

            <button
              onClick={() => setActiveTopTab('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTopTab === 'timeline' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => setActiveTopTab('calendar')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${activeTopTab === 'calendar' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setActiveTopTab('reports')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTopTab === 'reports' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>
          </div>

          {/* Glendale Branding Right */}
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 tracking-tight text-lg">glendale</span>
          </div>
        </header>

        {/* ------------------------------------------------------------- */}
        {/* CALENDAR MAIN WORKSPACE                                       */}
        {/* ------------------------------------------------------------- */}
        {activeTopTab === 'calendar' && (
          <main className="flex-1 p-6 space-y-6 overflow-y-auto">
            
            {/* Calendar Title & View Mode Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Saturday, Jun 24th
                </h1>
                <p className="text-xs text-slate-500">Panoramica completa degli appuntamenti in agenda con gestione slot.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl text-xs font-bold shadow-xs">
                  {(['DAY', 'WEEK', 'MONTH'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setCalendarViewMode(mode)}
                      className={`px-3 py-1.5 rounded-lg transition ${calendarViewMode === mode ? 'bg-blue-600 text-white font-black' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => onNavigateToSection('appointments')}
                  className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 shadow-xs"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid Container (Glendale Style) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              
              {/* Days Header */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-extrabold text-slate-500 uppercase tracking-wider py-3">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Grid Cells (30 days) */}
              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[500px]">
                {calendarDays.map((d, index) => {
                  const hasApps = d.appointments.length > 0;
                  return (
                    <div 
                      key={index} 
                      className="p-3 min-h-[100px] sm:min-h-[120px] flex flex-col justify-between hover:bg-slate-50/80 transition group relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${d.dayNumber === '24' ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm' : 'text-slate-400'}`}>
                          {d.dayNumber}
                        </span>
                        {hasApps && (
                          <span className="text-[9px] bg-blue-100 text-blue-700 font-black px-1.5 py-0.5 rounded-full">
                            {d.appointments.length}
                          </span>
                        )}
                      </div>

                      {/* Event Cards inside cell (Glendale blue pill style) */}
                      <div className="space-y-1.5 mt-2">
                        {d.appointments.slice(0, 2).map(app => (
                          <div 
                            key={app.id} 
                            onClick={() => onNavigateToSection('appointments')}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold p-2 rounded-xl shadow-xs cursor-pointer transition truncate flex items-center justify-between gap-1 group-hover:scale-[1.02]"
                            title={`${app.time} - ${app.clientName} (${app.serviceName})`}
                          >
                            <span className="truncate">{app.clientName}</span>
                            <span className="text-[10px] text-blue-200 shrink-0">{app.time}</span>
                          </div>
                        ))}
                        {d.appointments.length > 2 && (
                          <div className="text-[10px] text-slate-500 font-bold text-center">
                            +{d.appointments.length - 2} altri
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </main>
        )}

        {/* ------------------------------------------------------------- */}
        {/* OTHER TABS FALLBACK (CHAT / TASKBOARD / TIMELINE / REPORTS)     */}
        {/* ------------------------------------------------------------- */}
        {activeTopTab !== 'calendar' && (
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Sezione {activeTopTab.toUpperCase()}</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Questa vista è integrata direttamente nel flusso di gestione del salone. Clicca su Calendar per tornare alla pianificazione principale.
              </p>
              <button
                onClick={() => setActiveTopTab('calendar')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition"
              >
                Torna al Calendario
              </button>
            </div>
          </main>
        )}

        {/* Floating Action Button (FAB) Glendale Style */}
        <div className="fixed bottom-8 right-8 z-40">
          <button
            onClick={() => onNavigateToSection('appointments')}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-600/40 transition active:scale-95 group"
            title="Nuovo Appuntamento"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition transform duration-200" />
          </button>
        </div>

      </div>

    </div>
  );
}
