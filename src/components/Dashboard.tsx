import { useMemo, useState } from 'react';
import { Appointment, Client, AppointmentStatus } from '../types';
import { buildWhatsAppUrl, formatPhoneDisplay } from '../lib/phoneUtils';
import { 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Euro, 
  Calendar, 
  Users, 
  Percent, 
  HelpCircle, 
  BarChart2, 
  Sparkles, 
  Send, 
  Share2,
  Clock,
  CheckCircle2,
  Search,
  ChevronRight,
  Filter,
  Phone,
  UserCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

interface DashboardProps {
  appointments: Appointment[];
  clients: Client[];
  onNavigateToSection: (section: string) => void;
  onOpenInviteClient?: (client?: Client) => void;
}

export default function Dashboard({ appointments, clients, onNavigateToSection, onOpenInviteClient }: DashboardProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Compute metrics based on mock appointments
  const metrics = useMemo(() => {
    const completed = appointments.filter(a => a.status === AppointmentStatus.COMPLETED);
    const noShows = appointments.filter(a => a.status === AppointmentStatus.NO_SHOW);
    const cancelled = appointments.filter(a => a.status === AppointmentStatus.CANCELLED);
    const confirmed = appointments.filter(a => a.status === AppointmentStatus.CONFIRMED);
    const pending = appointments.filter(a => a.status === AppointmentStatus.PENDING);

    const totalPastClosed = completed.length + noShows.length;
    const noShowRate = totalPastClosed > 0 ? Math.round((noShows.length / totalPastClosed) * 100) : 0;
    
    // Revenue calculations
    const totalLostRevenue = noShows.reduce((sum, a) => sum + a.price, 0);
    const totalRecoveredRevenue = noShows.reduce((sum, a) => sum + (a.depositPaid || 0), 0);
    
    // Today's appointments (default 2026-06-24 or nearest date with apps)
    const todayStr = appointments.length > 0 ? appointments[0].date : '2026-06-24';
    const todayApps = appointments.filter(a => a.date === todayStr);
    const estimatedTodayRevenue = todayApps
      .filter(a => a.status !== AppointmentStatus.CANCELLED && a.status !== AppointmentStatus.NO_SHOW)
      .reduce((sum, a) => sum + a.price, 0);

    return {
      noShowRate,
      totalLostRevenue,
      totalRecoveredRevenue,
      todayCount: todayApps.length,
      estimatedTodayRevenue,
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      completedCount: completed.length,
      noShowCount: noShows.length,
      todayApps
    };
  }, [appointments]);

  // Filter clients for modern table
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients.slice(0, 5);
    const q = clientSearchQuery.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [clients, clientSearchQuery]);

  // Chart mock weekly data
  const revenueChartData = [
    { day: 'Lun', incasso: 320, protetto: 280 },
    { day: 'Mar', incasso: 450, protetto: 410 },
    { day: 'Mer', incasso: 390, protetto: 350 },
    { day: 'Gio', incasso: 520, protetto: 490 },
    { day: 'Ven', incasso: 680, protetto: 620 },
    { day: 'Sab', incasso: 850, protetto: 800 },
    { day: 'Dom', incasso: 210, protetto: 200 },
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-container">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold py-3 px-4 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Salone Attivo & Protetto</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Dashboard Principale
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Panoramica in tempo reale delle prenotazioni, protezione No-Show e performance del salone.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenInviteClient && (
            <button
              type="button"
              onClick={onOpenInviteClient}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-indigo-600/20 transition active:scale-95 flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-indigo-200" />
              <span>Invita Cliente</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigateToSection('appointments')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Apri Agenda</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. SHADCN ADMIN KPI CARDS GRID                                */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Appuntamenti di Oggi */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Appuntamenti Oggi</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{metrics.todayCount}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="text-emerald-600 flex items-center gap-1 font-bold">
              <TrendingUp className="w-3.5 h-3.5" /> 100% confermati
            </span>
            <span>Slot odierni</span>
          </div>
        </div>

        {/* KPI 2: No-Show Evitati / Fatturato Protetto */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Fatturato Protetto</p>
              <h3 className="text-3xl font-black text-emerald-600 mt-1">€{metrics.totalRecoveredRevenue}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="text-emerald-700 font-bold">Caparre incassate</span>
            <span>Zero perdite</span>
          </div>
        </div>

        {/* KPI 3: Incasso Stimato */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Incasso Stimato Oggi</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">€{metrics.estimatedTodayRevenue}</h3>
            </div>
            <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition">
              <Euro className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Media per slot</span>
            <strong className="text-slate-900">€45 - €70</strong>
          </div>
        </div>

        {/* KPI 4: Clienti Attivi */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-amber-300 transition group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Clienti Registrati</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{clients.length}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="text-indigo-600 font-bold">Database PWA</span>
            <span>Attivi</span>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. AREA CENTRALE: GRAFICO INCASSI & AGENDA ODIERNA             */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grafico Trend Settimanale (2 colonne) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Andamento Incassi & Protezione</h3>
              <p className="text-xs text-slate-500">Confronto tra fatturato totale e importi protetti da caparra.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span>Ultimi 7 Giorni</span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="incasso" fill="#6366f1" radius={[6, 6, 0, 0]} name="Incasso Totale (€)" />
                <Bar dataKey="protetto" fill="#10b981" radius={[6, 6, 0, 0]} name="Protetto (€)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agenda Odierna / Prossimi Slot (1 colonna) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Agenda Odierna</span>
            </h3>
            <button
              onClick={() => onNavigateToSection('appointments')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              Vedi tutti <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-72">
            {metrics.todayApps.length > 0 ? (
              metrics.todayApps.map(app => (
                <div key={app.id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                        {app.time}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        app.status === AppointmentStatus.CONFIRMED ? 'bg-emerald-100 text-emerald-800' :
                        app.status === AppointmentStatus.COMPLETED ? 'bg-slate-200 text-slate-700' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="font-extrabold text-slate-900 pt-1">{app.clientName}</p>
                    <p className="text-[11px] text-indigo-600 font-bold">{app.serviceName}</p>
                  </div>

                  <a
                    href={buildWhatsAppUrl(app.clientPhone, `Ciao ${app.clientName}! Ti ricordiamo il tuo appuntamento oggi alle ${app.time}.`, 'CH')}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition"
                    title="WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                Nessun appuntamento per oggi.
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateToSection('appointments')}
            className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-1.5"
          >
            <span>Gestisci Nuova Prenotazione</span>
          </button>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. TABELLA MODERNA GESTIONE CLIENTI & AZIONI RAPIDE           */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900">Anagrafica Clienti Recenti</h3>
            <p className="text-xs text-slate-500">Gestisci i recapiti, verifica l'affidabilità e contatta i clienti.</p>
          </div>

          {/* Ricerca Rapida */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca cliente o telefono..."
              value={clientSearchQuery}
              onChange={e => setClientSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Cliente</th>
                <th className="pb-3 px-3">Recapito Telefonico</th>
                <th className="pb-3 px-3">Affidabilità</th>
                <th className="pb-3 px-3">No-Show Registrati</th>
                <th className="pb-3 px-3 text-right">Azioni Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-3 font-extrabold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <span>{client.name}</span>
                      {client.riskLevel === 'HIGH' && (
                        <span className="block text-[9px] text-rose-600 font-bold">A Rischio No-Show</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-600">
                    {formatPhoneDisplay(client.phone)}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      client.reliabilityScore >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      client.reliabilityScore >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {client.reliabilityScore}% Affidabile
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-700">
                    {client.noShowCount}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <a
                        href={buildWhatsAppUrl(client.phone, `Ciao ${client.name}! Ti contattiamo dal salone per aggiornamenti sui tuoi appuntamenti.`, 'CH')}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl flex items-center gap-1 transition"
                      >
                        <Send className="w-3 h-3 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToSection('clients');
                          triggerToast(`Selezionato ${client.name}`);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                        title="Vedi storico"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => onNavigateToSection('clients')}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Visualizza l'anagrafica completa dei clienti →
          </button>
        </div>
      </div>

    </div>
  );
}
