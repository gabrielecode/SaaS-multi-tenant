import { useState, useEffect, useMemo } from 'react';
import { 
  Appointment, 
  Client, 
  Service, 
  WaitlistEntry, 
  BusinessConfig,
  TenantSalon,
  WhatsAppCampaign,
  ClientAuthUser,
  AppointmentStatus
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
import PwaInstallBanner from './components/PwaInstallBanner';
import MobileNavDrawer from './components/MobileNavDrawer';
import MobileBottomBar from './components/MobileBottomBar';
import MobileQuickActionModal from './components/MobileQuickActionModal';

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
  ChevronDown,
  Menu,
  HelpCircle,
  Building2,
  MessageSquare,
  Lock,
  UserCheck,
  Plus,
  Smartphone,
  CheckCircle2,
  Sparkles
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
  const [loggedClientUser, setLoggedClientUser] = useState<ClientAuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('ns_logged_client_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Persist client auth user session
  useEffect(() => {
    if (loggedClientUser) {
      localStorage.setItem('ns_logged_client_user', JSON.stringify(loggedClientUser));
    } else {
      localStorage.removeItem('ns_logged_client_user');
    }
  }, [loggedClientUser]);

  // Mobile drawer & quick action modal states
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  // Fast action triggers for appointments
  const [autoOpenAddApp, setAutoOpenAddApp] = useState(false);
  const [initialAppointmentsTab, setInitialAppointmentsTab] = useState<'agenda' | 'waitlist'>('agenda');

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

  // Compute today's active appointments count
  const todayAppointmentsCount = useMemo(() => {
    return appointments.filter(a => a.date === '2026-06-24' && a.status !== AppointmentStatus.CANCELLED).length;
  }, [appointments]);

  // Synchronize or register client when a new appointment is booked
  const handleAddAppointment = (newApp: Appointment) => {
    setAppointments(prev => [newApp, ...prev]);

    // Check if client is already registered in clients list
    const normalizedAppPhone = newApp.clientPhone.replace(/\D/g, '');
    const clientExists = clients.some(c => 
      c.id === newApp.clientId || 
      (c.phone && c.phone.replace(/\D/g, '') === normalizedAppPhone)
    );

    if (!clientExists && newApp.clientName && newApp.clientPhone) {
      const autoRegisteredClient: Client = {
        id: newApp.clientId || ('c_' + Date.now()),
        tenant_id: currentTenantId,
        name: newApp.clientName,
        phone: newApp.clientPhone,
        email: loggedClientUser?.email || '',
        noShowCount: 0,
        completedCount: 0,
        reliabilityScore: 100,
        notes: 'Cliente registrato automaticamente dalla prenotazione online',
        riskLevel: 'LOW',
        loyaltyPoints: 10
      };
      setClients(prev => [...prev, autoRegisteredClient]);
    }
  };

  // Direct client registration handler (from auth modal or signup)
  const handleRegisterClient = (newClient: Client) => {
    setClients(prev => {
      const normalizedNewPhone = newClient.phone.replace(/\D/g, '');
      const exists = prev.some(c => 
        (newClient.email && c.email.toLowerCase() === newClient.email.toLowerCase()) ||
        (newClient.phone && c.phone.replace(/\D/g, '') === normalizedNewPhone)
      );
      if (exists) {
        // Update existing record if needed
        return prev.map(c => {
          if (c.phone.replace(/\D/g, '') === normalizedNewPhone) {
            return { ...c, name: newClient.name, email: newClient.email || c.email };
          }
          return c;
        });
      }
      return [...prev, newClient];
    });
  };

  const handleSelectTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    setMode('owner');
    setOwnerSection('dashboard');
  };

  // Quick Action handler
  const handleQuickAction = (actionId: string) => {
    if (actionId === 'new_appointment') {
      setMode('owner');
      setOwnerSection('appointments');
      setInitialAppointmentsTab('agenda');
      setAutoOpenAddApp(true);
    } else if (actionId === 'send_whatsapp') {
      setMode('owner');
      setOwnerSection('marketing');
    } else if (actionId === 'add_client') {
      setMode('owner');
      setOwnerSection('clients');
    } else if (actionId === 'open_waitlist') {
      setMode('owner');
      setOwnerSection('appointments');
      setInitialAppointmentsTab('waitlist');
    }
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

  const ownerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Agenda', icon: Calendar, badge: todayAppointmentsCount > 0 ? `${todayAppointmentsCount}` : null },
    { id: 'clients', label: 'Clienti', icon: Users, badge: `${clients.length}` },
    { id: 'services', label: 'Servizi', icon: NotebookTabs },
    { id: 'marketing', label: 'WhatsApp', icon: MessageSquare, badge: 'Meta' },
    { id: 'settings', label: 'Impostazioni', icon: Settings2 },
    { id: 'instructions', label: 'Guida', icon: HelpCircle }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800 overflow-x-hidden" id="app-root">
      
      {/* PWA Install Banner */}
      <PwaInstallBanner />

      {/* ========================================================================= */}
      {/* HYPER-OPTIMIZED RESPONSIVE HEADER                                         */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/95 border-b border-slate-200/80 shadow-sm" id="global-header">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Left: Brand Icon & App Title & Mobile Tenant Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <ShieldAlert className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-base font-extrabold tracking-tight text-slate-900 leading-none truncate">
                  NoShow Reducer
                </h1>
                <span className="hidden sm:inline-block text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200 uppercase">
                  SaaS v2.4
                </span>
              </div>
              
              {/* Salon Switcher Trigger (Compact on mobile) */}
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 font-medium mt-0.5 truncate text-left transition group"
                title="Cambia Salone o Apri Menu"
              >
                <span className="truncate max-w-[130px] sm:max-w-[200px]">
                  Salone: <strong className="text-slate-800 group-hover:text-indigo-600">{currentTenantInfo?.name || config.name}</strong>
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation / Mode Switcher */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setMode('super_admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  mode === 'super_admin' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Super Admin</span>
              </button>

              <button
                onClick={() => setMode('owner')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  mode === 'owner' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-4 h-4 text-indigo-500" />
                <span>Titolare Salone</span>
              </button>

              <button
                onClick={() => setMode('client')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  mode === 'client' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Portale Cliente (PWA)</span>
              </button>
            </div>

            {/* Quick Action Button on Desktop */}
            {mode === 'owner' && (
              <button
                onClick={() => {
                  setOwnerSection('appointments');
                  setInitialAppointmentsTab('agenda');
                  setAutoOpenAddApp(true);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nuovo Appuntamento</span>
              </button>
            )}
          </div>

          {/* Mobile Right Controls: Role Badge + Dedicated Hamburger Menu Button */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* Quick Mode Toggle Pill */}
            <button
              onClick={() => {
                setMode(prev => prev === 'owner' ? 'client' : 'owner');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 shadow-sm active:scale-95 ${
                mode === 'owner'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : mode === 'client'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}
              title="Clicca per cambiare ruolo rapido"
            >
              {mode === 'owner' && <Store className="w-3.5 h-3.5 text-indigo-600" />}
              {mode === 'client' && <Globe className="w-3.5 h-3.5 text-emerald-600" />}
              {mode === 'super_admin' && <Building2 className="w-3.5 h-3.5 text-purple-600" />}
              <span className="truncate max-w-[62px]">
                {mode === 'owner' ? 'Titolare' : mode === 'client' ? 'Cliente' : 'Admin'}
              </span>
            </button>

            {/* Accessible Hamburger Menu Button (Touch Target >= 44px) */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-800 transition active:scale-95 relative"
              aria-label="Apri Menu di Navigazione"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
              {todayAppointmentsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT ROUTER                                                       */}
      {/* ========================================================================= */}
      {mode === 'super_admin' ? (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <SuperAdminDashboard 
            tenants={tenants} 
            onSelectTenant={handleSelectTenant} 
            currentTenantId={currentTenantId} 
          />
        </div>
      ) : mode === 'owner' ? (
        <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-6 p-3 sm:p-6 lg:p-8" id="owner-workspace">
          
          {/* Desktop Sidebar Navigation (#1e293b dark gray with smooth shadow) */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <nav className="space-y-1.5 bg-[#1e293b] p-4 rounded-2xl border border-slate-800 shadow-md sticky top-24">
              <h3 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-4 px-2">Gestione Salone</h3>
              {[
                { id: 'dashboard', label: 'Dashboard Finanziaria', icon: LayoutDashboard },
                { id: 'appointments', label: 'Calendario Agenda', icon: Calendar, badge: todayAppointmentsCount > 0 ? `${todayAppointmentsCount}` : null },
                { id: 'clients', label: 'Anagrafica Clienti', icon: Users, badge: `${clients.length}` },
                { id: 'services', label: 'Listino Servizi', icon: NotebookTabs },
                { id: 'marketing', label: 'Marketing & WhatsApp', icon: MessageSquare, badge: 'API' },
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
                    {item.badge ? (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white text-indigo-700' : 'bg-slate-800 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'rotate-90 text-white' : 'opacity-30 text-slate-500'}`} />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Horizontal Quick Tab Bar (Swipeable & 1-Thumb Reachable) */}
          <div className="md:hidden -mx-3 px-3 overflow-x-auto pb-1 flex items-center gap-2 no-scrollbar" id="mobile-quick-pills">
            {ownerNavItems.map(item => {
              const Icon = item.icon;
              const isActive = ownerSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setOwnerSection(item.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                      : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-indigo-600'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white text-indigo-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Owner Workspace Main Content Area */}
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
                autoOpenAdd={autoOpenAddApp}
                onResetAutoOpen={() => setAutoOpenAddApp(false)}
                initialTab={initialAppointmentsTab}
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
                onNavigateToSettings={() => setOwnerSection('settings')}
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
        <div className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-6" id="client-portal">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Prenotazioni Online Aperte 24/7</span>
            </div>

            <div>
              {loggedClientUser ? (
                <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    {loggedClientUser.name}
                  </span>
                  <button
                    onClick={() => setLoggedClientUser(null)}
                    className="text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    Esci
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 font-bold text-xs rounded-full border border-slate-200 shadow-xs flex items-center gap-1.5 transition active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  Area Personale Cliente
                </button>
              )}
            </div>
          </div>

          <ClientBooking 
            config={config}
            services={services}
            appointments={appointments}
            clients={clients}
            campaigns={campaigns}
            loggedClientUser={loggedClientUser}
            onOpenAuth={() => setShowAuthModal(true)}
            onLogoutClient={() => setLoggedClientUser(null)}
            onAddAppointment={handleAddAppointment}
            onUpdateAppointments={setAppointments}
          />

          {showAuthModal && (
            <ClientAuthModal
              currentTenantId={currentTenantId}
              existingClients={clients}
              onLogin={(user) => {
                setLoggedClientUser(user);
                setShowAuthModal(false);
              }}
              onRegisterClient={handleRegisterClient}
              onClose={() => setShowAuthModal(false)}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE-OPTIMIZED RESPONSIVE FOOTER                                        */}
      {/* ========================================================================= */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 pb-28 md:pb-8 text-xs text-slate-500" id="global-footer">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-100 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-sm">NoShow Reducer • SaaS Multi-Tenant</p>
                <p className="text-[11px] text-slate-400">Protezione fatturato e integrazione Meta WhatsApp Cloud API per saloni di bellezza.</p>
              </div>
            </div>

            {/* Cloud & API Connectivity Status Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-[11px] font-semibold shadow-xs">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Supabase DB Online
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-[11px] font-semibold shadow-xs">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Meta WhatsApp API Ready
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 text-[11px] font-semibold shadow-xs">
                <Smartphone className="w-3 h-3 text-indigo-600" />
                PWA Installabile
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 text-center sm:text-left">
            <p>© 2026 NoShow Reducer SaaS • Deploy Vercel Production Ready.</p>
            <div className="flex items-center gap-4 font-medium text-slate-500">
              <button onClick={() => { setMode('owner'); setOwnerSection('instructions'); }} className="hover:text-indigo-600 transition">Guida & Istruzioni</button>
              <span>•</span>
              <button onClick={() => { setMode('client'); }} className="hover:text-indigo-600 transition">Area Clienti PWA</button>
              <span>•</span>
              <button onClick={() => { setMode('super_admin'); }} className="hover:text-indigo-600 transition">Super Admin</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MOBILE FULL NAVIGATION DRAWER (HAMBURGER MENU)                            */}
      {/* ========================================================================= */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        mode={mode}
        onSelectMode={setMode}
        ownerSection={ownerSection}
        onSelectOwnerSection={setOwnerSection}
        tenants={tenants}
        currentTenantId={currentTenantId}
        onSelectTenant={handleSelectTenant}
        config={config}
        todayAppointmentsCount={todayAppointmentsCount}
        totalClientsCount={clients.length}
        loggedClientUser={loggedClientUser}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogoutClient={() => setLoggedClientUser(null)}
        onQuickNewAppointment={() => {
          setMode('owner');
          setOwnerSection('appointments');
          setInitialAppointmentsTab('agenda');
          setAutoOpenAddApp(true);
        }}
      />

      {/* ========================================================================= */}
      {/* MOBILE QUICK ACTION MODAL (SCORCIATOIE RAPIDE SHEET)                      */}
      {/* ========================================================================= */}
      <MobileQuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onActionSelect={handleQuickAction}
        tenants={tenants}
        currentTenantId={currentTenantId}
        onSelectTenant={handleSelectTenant}
      />

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION DOCK (THUMB-FRIENDLY NATIVE APP BAR)            */}
      {/* ========================================================================= */}
      <MobileBottomBar
        mode={mode}
        ownerSection={ownerSection}
        onSelectOwnerSection={setOwnerSection}
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        todayAppointmentsCount={todayAppointmentsCount}
        loggedClientUser={loggedClientUser}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onSelectMode={setMode}
      />

    </div>
  );
}
