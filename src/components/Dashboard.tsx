import { useMemo, useState } from 'react';
import { Appointment, Client, AppointmentStatus } from '../types';
import { buildWhatsAppUrl } from '../lib/phoneUtils';
import { TrendingUp, AlertTriangle, ShieldCheck, Euro, Calendar, Users, Percent, HelpCircle, BarChart2, Sparkles, Send } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  CartesianGrid
} from 'recharts';

interface DashboardProps {
  appointments: Appointment[];
  clients: Client[];
  onNavigateToSection: (section: string) => void;
}

export default function Dashboard({ appointments, clients, onNavigateToSection }: DashboardProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Compute metrics based on all mock appointments
  const metrics = useMemo(() => {
    const completed = appointments.filter(a => a.status === AppointmentStatus.COMPLETED);
    const noShows = appointments.filter(a => a.status === AppointmentStatus.NO_SHOW);
    const cancelled = appointments.filter(a => a.status === AppointmentStatus.CANCELLED);
    const confirmed = appointments.filter(a => a.status === AppointmentStatus.CONFIRMED);
    const pending = appointments.filter(a => a.status === AppointmentStatus.PENDING);

    const totalPastClosed = completed.length + noShows.length;
    const noShowRate = totalPastClosed > 0 ? Math.round((noShows.length / totalPastClosed) * 100) : 0;
    const cancellationRate = appointments.length > 0 ? Math.round((cancelled.length / appointments.length) * 100) : 0;

    // Revenue calculations
    const totalLostRevenue = noShows.reduce((sum, a) => sum + a.price, 0);
    const totalRecoveredRevenue = noShows.reduce((sum, a) => sum + a.depositPaid, 0);
    const netLoss = totalLostRevenue - totalRecoveredRevenue;

    // Today's occupancy rate simulation
    const todayStr = '2026-06-24';
    const todayApps = appointments.filter(a => a.date === todayStr);
    const completedOrConfirmedToday = todayApps.filter(a => 
      a.status === AppointmentStatus.COMPLETED || 
      a.status === AppointmentStatus.CONFIRMED ||
      a.status === AppointmentStatus.PENDING
    ).length;
    // Assuming 8 total slots available in a working day
    const occupancyRate = Math.round((completedOrConfirmedToday / 8) * 100);

    return {
      noShowRate,
      cancellationRate,
      totalLostRevenue,
      totalRecoveredRevenue,
      netLoss,
      occupancyRate,
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      completedCount: completed.length,
      noShowCount: noShows.length
    };
  }, [appointments]);

  // Clients with high risk of no-show
  const highRiskClients = useMemo(() => {
    return clients.filter(c => c.riskLevel === 'HIGH' || c.noShowCount > 1);
  }, [clients]);

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Welcome & Intro */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white text-slate-800 rounded-2xl shadow-sm border border-slate-200/80 animate-fade-in">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Benvenuto nel tuo NoShow Reducer!</h2>
          <p className="text-slate-500 mt-1 text-xs md:text-sm">
            Ecco l'impatto reale sul tuo fatturato. Grazie ai depositi richiesti, stai recuperando gran parte delle perdite.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl border border-emerald-200 self-start md:self-auto shadow-sm">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <div className="text-xs">
            <p className="font-bold uppercase tracking-wider text-[9px] text-emerald-800">Stato Protezione</p>
            <p className="text-xs font-bold text-emerald-900">Attiva & Monitorata</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasso No-Show */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between" id="kpi-noshow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasso No-Show storico</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{metrics.noShowRate}%</h3>
            </div>
            <div className={`p-2.5 rounded-xl border shadow-sm ${metrics.noShowRate > 15 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
            <span className={metrics.noShowRate > 15 ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
              {metrics.noShowCount} mancati arrivi
            </span>
            <span>su {metrics.completedCount + metrics.noShowCount} appuntamenti</span>
          </div>
        </div>

        {/* Fatturato Recuperato */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between" id="kpi-recovered">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fatturato Recuperato</p>
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">{metrics.totalRecoveredRevenue} €</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl shadow-sm">
              <Euro className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Risolto {Math.round((metrics.totalRecoveredRevenue / (metrics.totalLostRevenue || 1)) * 100)}%
            </span>
            <span>delle potenziali perdite</span>
          </div>
        </div>

        {/* Perdita Netta */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between" id="kpi-loss">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perdita Effettiva</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{metrics.netLoss} €</h3>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
            <span>Senza caparra avresti perso</span>
            <span className="font-semibold text-rose-600">{metrics.totalLostRevenue} €</span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between" id="kpi-occupancy">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saturazione Agenda (Oggi)</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{metrics.occupancyRate}%</h3>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl shadow-sm">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-indigo-600 font-semibold">4 / 8 slot riempiti</span>
            <span>per la giornata odierna</span>
          </div>
        </div>
      </div>

      {/* Recharts Summary Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200/80 shadow-md bg-gradient-to-br from-white via-slate-50 to-indigo-50/30" id="recharts-summary-card">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Text and stats metrics description */}
          <div className="lg:col-span-5 space-y-4">
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Riepilogo Prestazioni & Impatto
            </span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                Impatto delle Caparre & Successo Agenda
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Analisi dell'efficacia delle caparre confirmatorie nel preservare il fatturato rispetto agli appuntamenti portati a termine con successo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-1 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Caparre Trattenute</span>
                <span className="text-xl font-extrabold text-emerald-600 block">{metrics.totalRecoveredRevenue} €</span>
                <span className="text-[9px] text-slate-500 leading-tight block font-medium">Fatturato protetto da No-Show</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-1 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Successi in Agenda</span>
                <span className="text-xl font-extrabold text-indigo-600 block">{metrics.completedCount}</span>
                <span className="text-[9px] text-slate-500 leading-tight block font-medium">Appuntamenti conclusi</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 bg-slate-100/50 p-3.5 rounded-xl border border-slate-200/40 leading-relaxed font-medium">
              Grazie alla barriera all'ingresso della caparra, <strong className="text-emerald-700 font-bold">{metrics.totalRecoveredRevenue} €</strong> sono stati recuperati da disdette tardive. Contemporaneamente, sono stati completati con successo <strong className="text-indigo-700 font-bold">{metrics.completedCount}</strong> appuntamenti.
            </div>
          </div>

          {/* Recharts Bar Chart Visualizer */}
          <div className="lg:col-span-7 h-64 bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visualizzazione Grafica Recharts</span>
              <span className="text-[9px] font-mono text-slate-400">Valori Integrati</span>
            </div>
            
            <div className="flex-1 w-full mt-3" style={{ minHeight: '170px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Caparre Trattenute (€)', valore: metrics.totalRecoveredRevenue, color: '#10b981' },
                    { name: 'Appuntamenti Completati (N°)', valore: metrics.completedCount, color: '#6366f1' }
                  ]}
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(15, 23, 42, 0.5)" 
                    fontSize={10}
                    tickLine={false}
                    tick={{ fill: '#475569', fontWeight: 500 }}
                  />
                  <YAxis 
                    stroke="rgba(15, 23, 42, 0.5)" 
                    fontSize={10} 
                    tickLine={false}
                    tick={{ fill: '#475569', fontWeight: 500 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.03)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{data.name}</p>
                            <p className="text-sm font-extrabold mt-1" style={{ color: data.color }}>
                              {data.valore} {data.name.includes('€') ? '€' : 'Appuntamenti'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="valore" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    <Cell fill="#10b981" />
                    <Cell fill="#6366f1" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* Main Analytics Charts & Risk analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graph Card */}
        <div className="glass-card p-6 rounded-2xl space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold text-slate-900">Analisi Finanziaria No-Show</h4>
              <p className="text-xs text-slate-500 mt-0.5">Confronto tra perdita potenziale e perdite recuperate grazie alle caparre Stripe</p>
            </div>
          </div>

          {/* Recharts Financial Chart replacing custom divs */}
          <div className="h-68 w-full pt-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Perdita Potenziale', importo: metrics.totalLostRevenue, colore: '#ef4444', desc: 'Mancato incasso lordo No-Show' },
                    { name: 'Caparre Trattenute', importo: metrics.totalRecoveredRevenue, colore: '#10b981', desc: 'Acconti trattenuti' },
                    { name: 'Perdita Effettiva', importo: metrics.netLoss, colore: '#64748b', desc: 'Perdita netta finale' }
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(15, 23, 42, 0.4)" 
                    fontSize={10}
                    tickLine={false}
                    tick={{ fill: '#475569', fontWeight: 600 }}
                  />
                  <YAxis 
                    stroke="rgba(15, 23, 42, 0.4)" 
                    fontSize={10} 
                    tickLine={false}
                    unit=" €"
                    tick={{ fill: '#475569', fontWeight: 600 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.03)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs">
                            <p className="font-bold text-slate-800">{data.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{data.desc}</p>
                            <p className="text-sm font-extrabold mt-1" style={{ color: data.colore }}>
                              {data.importo} €
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="importo" radius={[8, 8, 0, 0]} maxBarSize={50}>
                    <Cell fill="#ef4444" />
                    <Cell fill="#10b981" />
                    <Cell fill="#64748b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex items-center justify-between mt-4">
              <span className="text-xs text-slate-600 font-medium">Stima del fatturato salvato questo mese:</span>
              <span className="text-sm font-extrabold text-emerald-600">+{metrics.totalRecoveredRevenue} €</span>
            </div>
          </div>
        </div>

        {/* Client Risk Alerts */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-900">Allarmi Rischio Clienti</h4>
              <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase shadow-sm">
                {highRiskClients.length} Critici
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Clienti con comportamenti passati inclini a no-show</p>

            <div className="mt-4 space-y-3">
              {highRiskClients.length > 0 ? (
                highRiskClients.map(client => (
                  <div key={client.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800">{client.name}</p>
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                        {client.noShowCount} No-Show
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {client.notes || "Nessuna nota impostata."}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-semibold text-slate-400">Affidabilità: {client.reliabilityScore}%</span>
                      <button 
                        onClick={() => onNavigateToSection('clients')}
                        className="text-[10px] text-indigo-600 font-bold hover:text-indigo-800 transition"
                      >
                        Imposta caparra 100% →
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500 stroke-1 mb-2 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-500">Nessun cliente ad alto rischio registrato!</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <div className="flex items-start gap-2.5 text-xs text-slate-500 font-medium">
              <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Consiglio:</strong> Puoi escludere determinati clienti dai no-show futuri rendendo l'acconto obbligatorio solo per chi ha affidabilità inferiore all'80%.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Suggested Actions Row */}
      <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/30 border border-indigo-100 rounded-2xl p-6 shadow-sm">
        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Azione Consigliata di Oggi
        </h4>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed font-medium">
          Hai un appuntamento in sospeso (<strong>Davide Neri</strong> alle <strong>10:30</strong>) che non ha ancora risposto al promemoria.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button 
            onClick={() => onNavigateToSection('appointments')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-3 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
          >
            Gestisci Agenda
          </button>
          <button 
            onClick={() => {
              const davideApp = appointments.find(a => a.clientName.toLowerCase().includes('davide')) || appointments[0];
              const phone = davideApp?.clientPhone || '+41 79 987 65 43';
              const text = `Ciao Davide! Ti ricordiamo la conferma del tuo appuntamento per oggi alle 10:30. Rispondi con un tap a questo messaggio per confermare.`;
              const url = buildWhatsAppUrl(phone, text, 'CH');
              window.open(url, '_blank', 'noopener,noreferrer');
              triggerToast(`Sollecito WhatsApp aperto con successo con prefisso Svizzera (+41) per ${davideApp?.clientName || 'Davide Neri'}!`);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-3 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Invia Sollecito WhatsApp
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-600 border border-indigo-500 text-white font-bold text-xs py-3.5 px-5 rounded-2xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 fill-white" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
