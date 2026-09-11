import { useState, useEffect } from 'react';
import { 
  Appointment, 
  Client, 
  Service, 
  WaitlistEntry, 
  BusinessConfig,
  AppointmentStatus 
} from './types';
import { 
  INITIAL_BUSINESS_CONFIG, 
  INITIAL_SERVICES, 
  INITIAL_CLIENTS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_WAITLIST 
} from './data/mockData';

// Component Imports
import Dashboard from './components/Dashboard';
import Appointments from './components/Appointments';
import ClientsList from './components/ClientsList';
import ServicesList from './components/ServicesList';
import Settings from './components/Settings';
import ClientBooking from './components/ClientBooking';
import Instructions from './components/Instructions';

// Icons
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  NotebookTabs, 
  Settings2, 
  Globe, 
  Store,
  ChevronRight,
  Menu,
  X,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // Global States (loaded from localStorage if present, otherwise initial mock data)
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [config, setConfig] = useState<BusinessConfig | null>(null);

  // UI Flow navigation states
  // 'owner' vs 'client'
  const [mode, setMode] = useState<'owner' | 'client'>('owner');
  // Sub-sections under owner mode: 'dashboard' | 'appointments' | 'clients' | 'services' | 'settings'
  const [ownerSection, setOwnerSection] = useState<string>('dashboard');
  
  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize and load persistent local data on mount
  useEffect(() => {
    const savedApps = localStorage.getItem('ns_appointments');
    const savedClients = localStorage.getItem('ns_clients');
    const savedServices = localStorage.getItem('ns_services');
    const savedWaitlist = localStorage.getItem('ns_waitlist');
    const savedConfig = localStorage.getItem('ns_config');

    if (savedApps) setAppointments(JSON.parse(savedApps));
    else setAppointments(INITIAL_APPOINTMENTS);

    if (savedClients) setClients(JSON.parse(savedClients));
    else setClients(INITIAL_CLIENTS);

    if (savedServices) setServices(JSON.parse(savedServices));
    else setServices(INITIAL_SERVICES);

    if (savedWaitlist) setWaitlist(JSON.parse(savedWaitlist));
    else setWaitlist(INITIAL_WAITLIST);

    if (savedConfig) setConfig(JSON.parse(savedConfig));
    else setConfig(INITIAL_BUSINESS_CONFIG);
  }, []);

  // Save states to localStorage on change
  useEffect(() => {
    if (appointments.length > 0) {
      localStorage.setItem('ns_appointments', JSON.stringify(appointments));
    }
  }, [appointments]);

  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem('ns_clients', JSON.stringify(clients));
    }
  }, [clients]);

  useEffect(() => {
    if (services.length > 0) {
      localStorage.setItem('ns_services', JSON.stringify(services));
    }
  }, [services]);

  useEffect(() => {
    if (waitlist.length > 0) {
      localStorage.setItem('ns_waitlist', JSON.stringify(waitlist));
    }
  }, [waitlist]);

  useEffect(() => {
    if (config) {
      localStorage.setItem('ns_config', JSON.stringify(config));
    }
  }, [config]);

  // Client triggers adding an appointment from public link
  const handleAddAppointment = (newApp: Appointment) => {
    setAppointments(prev => [newApp, ...prev]);
  };

  // Safe configurations guard
  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-800">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500">Inizializzazione NoShow Reducer in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen glass-bg flex flex-col font-sans text-slate-800" id="app-root">
      
      {/* Dynamic Sandbox Selector Mode Switcher Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/80 shadow-sm" id="global-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">NoShow Reducer</h1>
              <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase">Fase 1 MVP</span>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 backdrop-blur-lg">
            <button
              onClick={() => {
                setMode('owner');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 ${
                mode === 'owner' 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Pannello Titolare</span>
              <span className="sm:hidden">Titolare</span>
            </button>
            <button
              onClick={() => {
                setMode('client');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 ${
                mode === 'client' 
                  ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Globe className={`w-4 h-4 ${mode === 'client' ? 'text-white' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Link Pubblico Cliente</span>
              <span className="sm:hidden">Cliente</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main body depending on mode */}
      {mode === 'owner' ? (
        /* ================== OWNER DASHBOARD LAYOUT ================== */
        <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-6 p-4 sm:p-6 lg:p-8" id="owner-workspace">
          
          {/* Sidebar Left Navigation (Desktop) */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <nav className="space-y-1.5 bg-[#1e293b] p-4 rounded-2xl border border-slate-800 shadow-md sticky top-24">
              <h3 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-4 px-2">Menu Navigazione</h3>
              {[
                { id: 'dashboard', label: 'Dashboard Finanziaria', icon: LayoutDashboard },
                { id: 'appointments', label: 'Calendario Agenda', icon: Calendar },
                { id: 'clients', label: 'Anagrafica Clienti', icon: Users },
                { id: 'services', label: 'Listino Servizi', icon: NotebookTabs },
                { id: 'settings', label: 'Impostazioni & Policy', icon: Settings2 },
                { id: 'instructions', label: 'Guida & Istruzioni', icon: HelpCircle }
              ].map(item => {
                const Icon = item.icon;
                const isActive = ownerSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setOwnerSection(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold text-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] relative ${
                      isActive 
                        ? 'bg-indigo-600 text-white border border-indigo-500/30 shadow-[0_4px_12px_rgba(99,102,241,0.25)]' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/3 bottom-1/3 w-1 bg-white rounded-r-full"></span>
                    )}
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-all duration-300 ${isActive ? 'rotate-90 text-white' : 'opacity-30 group-hover:opacity-100 text-slate-500'}`} />
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Navigation Dropdown/Drawer trigger */}
          <div className="md:hidden bg-[#1e293b] p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-sm text-white">
            <span className="text-xs font-bold text-slate-200">
              Sezione: {
                ownerSection === 'dashboard' ? 'Dashboard Finanziaria' :
                ownerSection === 'appointments' ? 'Calendario Agenda' :
                ownerSection === 'clients' ? 'Anagrafica Clienti' :
                ownerSection === 'services' ? 'Listino Servizi' :
                ownerSection === 'instructions' ? 'Guida & Istruzioni' : 'Impostazioni'
              }
            </span>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>

          {/* Mobile Menu Panel */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-[#1e293b] border border-slate-800 rounded-2xl p-4 space-y-1.5 shadow-lg text-slate-200 animate-fade-in">
              {[
                { id: 'dashboard', label: 'Dashboard Finanziaria', icon: LayoutDashboard },
                { id: 'appointments', label: 'Calendario Agenda', icon: Calendar },
                { id: 'clients', label: 'Anagrafica Clienti', icon: Users },
                { id: 'services', label: 'Listino Servizi', icon: NotebookTabs },
                { id: 'settings', label: 'Impostazioni & Policy', icon: Settings2 },
                { id: 'instructions', label: 'Guida & Istruzioni', icon: HelpCircle }
              ].map(item => {
                const Icon = item.icon;
                const isActive = ownerSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setOwnerSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:bg-slate-800 active:scale-[0.98] ${
                      isActive ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Owner Main Workspace */}
          <main className="flex-1 min-w-0">
            {ownerSection === 'dashboard' && (
              <Dashboard 
                appointments={appointments} 
                clients={clients} 
                onNavigateToSection={(sec) => setOwnerSection(sec)} 
              />
            )}
            {ownerSection === 'appointments' && (
              <Appointments 
                appointments={appointments}
                clients={clients}
                services={services}
                waitlist={waitlist}
                onUpdateAppointments={setAppointments}
                onUpdateWaitlist={setWaitlist}
                onUpdateClients={setClients}
              />
            )}
            {ownerSection === 'clients' && (
              <ClientsList 
                clients={clients}
                onUpdateClients={setClients}
              />
            )}
            {ownerSection === 'services' && (
              <ServicesList 
                services={services}
                onUpdateServices={setServices}
              />
            )}
            {ownerSection === 'settings' && (
              <Settings 
                config={config}
                onUpdateConfig={setConfig}
              />
            )}
            {ownerSection === 'instructions' && (
              <Instructions />
            )}
          </main>

        </div>
      ) : (
        /* ================== PUBLIC CUSTOMER BOOKING LAYOUT ================== */
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8" id="client-workspace">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl mb-6 flex items-start gap-3 shadow-sm animate-fade-in">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl mt-0.5 border border-indigo-200">
              <Globe className="w-4.5 h-4.5" />
            </div>
            <div className="text-xs text-slate-700">
              <p className="font-bold text-slate-950">Anteprima Link di Prenotazione Cliente</p>
              <p className="mt-0.5 text-slate-500 leading-relaxed">
                Stai visualizzando l'app come se fossi un tuo cliente finale. Prova a prenotare un trattamento: se richiede caparra, potrai completare una finta transazione Stripe ed inviare un promemoria SMS di test.
              </p>
            </div>
          </div>

          <ClientBooking 
            config={config}
            services={services}
            appointments={appointments}
            clients={clients}
            onAddAppointment={handleAddAppointment}
            onUpdateAppointments={setAppointments}
          />
        </div>
      )}

      {/* Simple Professional Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-center text-[11px] text-slate-400">
        <p>© 2026 NoShow Reducer. Sviluppato e ottimizzato per un'esperienza ad alto impatto.</p>
      </footer>


    </div>
  );
}
