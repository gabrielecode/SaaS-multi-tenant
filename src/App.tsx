import { useState, useEffect } from 'react';
import { 
  Appointment, 
  Client, 
  Service, 
  WaitlistEntry, 
  BusinessConfig,
  TenantSalon,
  WhatsAppCampaign,
  ClientAuthUser
} from './types';
import { 
  INITIAL_BUSINESS_CONFIG, 
  INITIAL_SERVICES, 
  INITIAL_CLIENTS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_WAITLIST,
  INITIAL_TENANTS,
  INITIAL_CAMPAIGNS
} from './data/mockData';

// Component Imports
import Dashboard from './components/Dashboard';
import Appointments from './components/Appointments';
import ClientsList from './components/ClientsList';
import ServicesList from './components/ServicesList';
import Settings from './components/Settings';
import ClientBooking from './components/ClientBooking';
import Instructions from './components/Instructions';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import MarketingWhatsApp from './components/MarketingWhatsApp';
import ClientAuthModal from './components/ClientAuthModal';

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
  HelpCircle,
  Building2,
  MessageSquare,
  Lock,
  UserCheck
} from 'lucide-react';

export default function App() {
  // Multi-tenant and SaaS global states
  const [tenants, setTenants] = useState<TenantSalon[]>(() => {
    const saved = localStorage.getItem('ns_tenants');
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });

  const [currentTenantId, setCurrentTenantId] = useState<string>('salon_default_1');

  // Salon-specific data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [config, setConfig] = useState<BusinessConfig | null>(null);

  // SaaS Navigation Modes: 'super_admin' | 'owner' | 'client'
  const [mode, setMode] = useState<'super_admin' | 'owner' | 'client'>('owner');
  const [ownerSection, setOwnerSection] = useState<string>('dashboard');
  
  // Client auth modal & logged client
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loggedClientUser, setLoggedClientUser] = useState<ClientAuthUser | null>(null);

  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize tenant-specific data on mount or tenant switch
  useEffect(() => {
    const savedApps = localStorage.getItem(`ns_appointments_${currentTenantId}`);
    const savedClients = localStorage.getItem(`ns_clients_${currentTenantId}`);
    const savedServices = localStorage.getItem(`ns_services_${currentTenantId}`);
    const savedWaitlist = localStorage.getItem(`ns_waitlist_${currentTenantId}`);
    const savedCampaigns = localStorage.getItem(`ns_campaigns_${currentTenantId}`);
    const savedConfig = localStorage.getItem(`ns_config_${currentTenantId}`);

    if (savedApps) setAppointments(JSON.parse(savedApps));
    else setAppointments(INITIAL_APPOINTMENTS.filter(a => !a.tenant_id || a.tenant_id === currentTenantId));

    if (savedClients) setClients(JSON.parse(savedClients));
    else setClients(INITIAL_CLIENTS.filter(c => !c.tenant_id || c.tenant_id === currentTenantId));

    if (savedServices) setServices(JSON.parse(savedServices));
    else setServices(INITIAL_SERVICES.filter(s => !s.tenant_id || s.tenant_id === currentTenantId));

    if (savedWaitlist) setWaitlist(JSON.parse(savedWaitlist));
    else setWaitlist(INITIAL_WAITLIST.filter(w => !w.tenant_id || w.tenant_id === currentTenantId));

    if (savedCampaigns) setCampaigns(JSON.parse(savedCampaigns));
    else setCampaigns(INITIAL_CAMPAIGNS.filter(c => !c.tenant_id || c.tenant_id === currentTenantId));

    if (savedConfig) setConfig(JSON.parse(savedConfig));
    else {
      const tenant = tenants.find(t => t.id === currentTenantId);
      setConfig({
        ...INITIAL_BUSINESS_CONFIG,
        tenant_id: currentTenantId,
        name: tenant ? tenant.name : INITIAL_BUSINESS_CONFIG.name,
        category: tenant ? tenant.category : INITIAL_BUSINESS_CONFIG.category,
        phone: tenant ? tenant.phone : INITIAL_BUSINESS_CONFIG.phone
      });
    }
  }, [currentTenantId]);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('ns_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    if (appointments.length > 0) localStorage.setItem(`ns_appointments_${currentTenantId}`, JSON.stringify(appointments));
  }, [appointments, currentTenantId]);

  useEffect(() => {
    if (clients.length > 0) localStorage.setItem(`ns_clients_${currentTenantId}`, JSON.stringify(clients));
  }, [clients, currentTenantId]);

  useEffect(() => {
    if (services.length > 0) localStorage.setItem(`ns_services_${currentTenantId}`, JSON.stringify(services));
  }, [services, currentTenantId]);

  useEffect(() => {
    if (waitlist.length > 0) localStorage.setItem(`ns_waitlist_${currentTenantId}`, JSON.stringify(waitlist));
  }, [waitlist, currentTenantId]);

  useEffect(() => {
    if (campaigns.length > 0) localStorage.setItem(`ns_campaigns_${currentTenantId}`, JSON.stringify(campaigns));
  }, [campaigns, currentTenantId]);

  useEffect(() => {
    if (config) localStorage.setItem(`ns_config_${currentTenantId}`, JSON.stringify(config));
  }, [config, currentTenantId]);

  const handleAddAppointment = (newApp: Appointment) => {
    setAppointments(prev => [newApp, ...prev]);
  };

  const handleSelectTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    setMode('owner');
    setOwnerSection('dashboard');
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] text-slate-800">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500">Inizializzazione piattaforma SaaS Multi-Tenant...</p>
        </div>
      </div>
    );
  }

  const currentTenantInfo = tenants.find(t => t.id === currentTenantId);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800" id="app-root">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 border-b border-slate-200/80 shadow-sm" id="global-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">NoShow Reducer</h1>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200 uppercase">SaaS v2</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Salone: <strong className="text-slate-800">{currentTenantInfo?.name || config.name}</strong></p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => {
                setMode('super_admin');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'super_admin' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Super Admin</span>
              <span className="sm:hidden">Admin</span>
            </button>

            <button
              onClick={() => {
                setMode('owner');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'owner' 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Titolare Salone</span>
              <span className="sm:hidden">Titolare</span>
            </button>

            <button
              onClick={() => {
                setMode('client');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'client' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Portale Cliente (PWA)</span>
              <span className="sm:hidden">Cliente</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      {mode === 'super_admin' ? (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <SuperAdminDashboard 
            tenants={tenants} 
            onSelectTenant={handleSelectTenant} 
            currentTenantId={currentTenantId} 
          />
        </div>
      ) : mode === 'owner' ? (
        <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-6 p-4 sm:p-6 lg:p-8" id="owner-workspace">
          
          {/* Sidebar Left Navigation (#1e293b dark gray requested) */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <nav className="space-y-1.5 bg-[#1e293b] p-4 rounded-2xl border border-slate-800 shadow-md sticky top-24">
              <h3 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-4 px-2">Gestione Salone</h3>
              {[
                { id: 'dashboard', label: 'Dashboard Finanziaria', icon: LayoutDashboard },
                { id: 'appointments', label: 'Calendario Agenda', icon: Calendar },
                { id: 'clients', label: 'Anagrafica Clienti', icon: Users },
                { id: 'services', label: 'Listino Servizi', icon: NotebookTabs },
                { id: 'marketing', label: 'Marketing & WhatsApp', icon: MessageSquare },
                { id: 'settings', label: 'Impostazioni & API', icon: Settings2 },
                { id: 'instructions', label: 'Guida & Istruzioni', icon: HelpCircle }
              ].map(item => {
                const Icon = item.icon;
                const isActive = ownerSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setOwnerSection(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-xs transition-all duration-200 relative ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'rotate-90 text-white' : 'opacity-30 text-slate-500'}`} />
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden bg-[#1e293b] p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-white shadow-sm">
            <span className="text-xs font-bold text-slate-200">
              Sezione: {ownerSection.toUpperCase()}
            </span>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-[#1e293b] border border-slate-800 rounded-2xl p-4 space-y-1.5 shadow-lg text-slate-200">
              {[
                { id: 'dashboard', label: 'Dashboard Finanziaria', icon: LayoutDashboard },
                { id: 'appointments', label: 'Calendario Agenda', icon: Calendar },
                { id: 'clients', label: 'Anagrafica Clienti', icon: Users },
                { id: 'services', label: 'Listino Servizi', icon: NotebookTabs },
                { id: 'marketing', label: 'Marketing & WhatsApp', icon: MessageSquare },
                { id: 'settings', label: 'Impostazioni & API', icon: Settings2 },
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
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Owner Workspace Main Area */}
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
            {ownerSection === 'marketing' && (
              <MarketingWhatsApp 
                config={config}
                clients={clients}
                campaigns={campaigns}
                onUpdateCampaigns={setCampaigns}
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
        /* ================== CLIENT PWA PORTAL ================== */
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6" id="client-portal">
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 font-bold">
                PWA
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Portale Cliente & Installazione PWA</p>
                <p className="text-[11px] text-slate-500">Gestisci i tuoi appuntamenti, notifiche push e riprogrammazioni autonome.</p>
              </div>
            </div>

            <div>
              {loggedClientUser ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    {loggedClientUser.name}
                  </span>
                  <button
                    onClick={() => setLoggedClientUser(null)}
                    className="text-[11px] font-semibold text-rose-600 hover:underline"
                  >
                    Esci
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Accedi / Registrati
                </button>
              )}
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

          {showAuthModal && (
            <ClientAuthModal
              onLogin={(user) => {
                setLoggedClientUser(user);
                setShowAuthModal(false);
              }}
              onClose={() => setShowAuthModal(false)}
            />
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-center text-[11px] text-slate-400">
        <p>© 2026 NoShow Reducer SaaS • Supabase Multi-Tenant & Meta WhatsApp Cloud API Ready.</p>
      </footer>

    </div>
  );
}
