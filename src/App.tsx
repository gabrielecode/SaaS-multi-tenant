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
import InviteClientModal from './components/InviteClientModal';
import DedicatedRoleAuthModal from './components/DedicatedRoleAuthModal';
import StaffAccessGateway from './components/StaffAccessGateway';
import { anonymizeClientForSuperAdmin, anonymizeAppointmentForSuperAdmin } from './lib/privacyUtils';

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
  Sparkles,
  Share2,
  LogOut,
  Eye,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  // Multi-tenant and SaaS global states
  const [tenants, setTenants] = useState<TenantSalon[]>(() => {
    const saved = localStorage.getItem('ns_tenants');
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });

  const [currentTenantId, setCurrentTenantId] = useState<string>('salon_default_1');

  // Salon-specific data states with synchronous initializers
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(`ns_appointments_${currentTenantId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_APPOINTMENTS.filter(a => !a.tenant_id || a.tenant_id === currentTenantId);
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(`ns_clients_${currentTenantId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CLIENTS.filter(c => !c.tenant_id || c.tenant_id === currentTenantId);
  });

  const [services, setServices] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem(`ns_services_${currentTenantId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SERVICES.filter(s => !s.tenant_id || s.tenant_id === currentTenantId);
  });

  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`ns_waitlist_${currentTenantId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_WAITLIST.filter(w => !w.tenant_id || w.tenant_id === currentTenantId);
  });

  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>(() => {
    try {
      const saved = localStorage.getItem(`ns_campaigns_${currentTenantId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CAMPAIGNS.filter(c => !c.tenant_id || c.tenant_id === currentTenantId);
  });

  const [config, setConfig] = useState<BusinessConfig>(() => {
    try {
      const saved = localStorage.getItem(`ns_config_${currentTenantId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.country) parsed.country = 'CH';
        if (!parsed.currency) parsed.currency = 'CHF';
        if (!parsed.phonePrefix) parsed.phonePrefix = '+41';
        return parsed;
      }
    } catch {}
    return {
      ...INITIAL_BUSINESS_CONFIG,
      tenant_id: currentTenantId,
      country: 'CH',
      currency: 'CHF',
      phonePrefix: '+41'
    };
  });

  // SaaS Navigation Modes: 'super_admin' | 'owner' | 'client' | 'staff_gateway'
  const [mode, setMode] = useState<'super_admin' | 'owner' | 'client' | 'staff_gateway'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const pathname = window.location.pathname.toLowerCase();

      if (view === 'client' || pathname.includes('/prenota') || pathname === '/prenota') {
        return 'client';
      }
      if (view === 'owner' || pathname.includes('/gestione') || pathname === '/gestione') {
        const isOwnerAuth = sessionStorage.getItem('ns_auth_owner') === 'true';
        if (isOwnerAuth) return 'owner';
        return 'staff_gateway';
      }
      if (view === 'admin' || pathname.includes('/admin') || pathname === '/admin') {
        const isAdminAuth = sessionStorage.getItem('ns_auth_super_admin') === 'true';
        if (isAdminAuth) return 'super_admin';
        return 'staff_gateway';
      }
    } catch {}
    return 'staff_gateway';
  });

  const gatewayConfig = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const pathname = window.location.pathname.toLowerCase();

      if (view === 'owner' || pathname.includes('/gestione') || pathname === '/gestione') {
        return { initialRoleTab: 'owner' as const, lockRoleTab: true };
      }
      if (view === 'admin' || pathname.includes('/admin') || pathname === '/admin') {
        return { initialRoleTab: 'super_admin' as const, lockRoleTab: true };
      }
    } catch {}
    return { initialRoleTab: 'owner' as const, lockRoleTab: false };
  }, []);
  const [ownerSection, setOwnerSection] = useState<string>('dashboard');
  
  // Dedicated Role Authentication states
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('ns_auth_owner') === 'true';
  });
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('ns_auth_super_admin') === 'true';
  });
  const [showRoleAuthModal, setShowRoleAuthModal] = useState(false);
  const [roleAuthTarget, setRoleAuthTarget] = useState<'super_admin' | 'owner'>('owner');

  // Super Admin App Audit Mode (Browsing salon app with GDPR/LPD masked sensitive data)
  const [isSuperAdminAuditActive, setIsSuperAdminAuditActive] = useState(false);

  // Invite Client Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [invitePreselectedClient, setInvitePreselectedClient] = useState<Client | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (!parsed.country) parsed.country = 'CH';
      if (!parsed.currency) parsed.currency = 'CHF';
      if (!parsed.phonePrefix) parsed.phonePrefix = '+41';
      // Se era rimasto il vecchio numero italiano di default, converti al salone svizzero
      if (parsed.phone && (parsed.phone.includes('+39 345 678 9012') || parsed.phone.includes('+39'))) {
        parsed.phone = '+41 79 345 67 89';
        if (parsed.name === "Gentleman's Grooming Club") {
          parsed.name = "Gentleman's Grooming Club Lugano";
        }
      }
      setConfig(parsed);
    } else {
      const tenant = tenants.find(t => t.id === currentTenantId);
      setConfig({
        ...INITIAL_BUSINESS_CONFIG,
        tenant_id: currentTenantId,
        name: tenant ? tenant.name : INITIAL_BUSINESS_CONFIG.name,
        category: tenant ? tenant.category : INITIAL_BUSINESS_CONFIG.category,
        phone: tenant ? tenant.phone : INITIAL_BUSINESS_CONFIG.phone,
        ownerName: tenant ? tenant.ownerName : INITIAL_BUSINESS_CONFIG.ownerName,
        email: tenant ? tenant.email : INITIAL_BUSINESS_CONFIG.email
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
    if (config) {
      localStorage.setItem(`ns_config_${currentTenantId}`, JSON.stringify(config));
      // Mantieni sincronizzato il tenant attivo
      setTenants(prev => prev.map(t => {
        if (t.id === currentTenantId) {
          return {
            ...t,
            name: config.name,
            phone: config.phone,
            category: config.category,
            ownerName: config.ownerName || t.ownerName,
            email: config.email || t.email
          };
        }
        return t;
      }));
    }
  }, [config, currentTenantId]);

  // Compute today's active appointments count
  const todayAppointmentsCount = useMemo(() => {
    return appointments.filter(a => a.date === '2026-06-24' && a.status !== AppointmentStatus.CANCELLED).length;
  }, [appointments]);

  // Computed data projection: when Super Admin audits the app, personal sensitive data is masked
  const isSuperAdminAuditing = mode === 'super_admin' && isSuperAdminAuditActive;
  const activeClients = useMemo(() => {
    if (isSuperAdminAuditing) {
      return clients.map(anonymizeClientForSuperAdmin);
    }
    return clients;
  }, [isSuperAdminAuditing, clients]);

  const activeAppointments = useMemo(() => {
    if (isSuperAdminAuditing) {
      return appointments.map(anonymizeAppointmentForSuperAdmin);
    }
    return appointments;
  }, [isSuperAdminAuditing, appointments]);

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

  // Dedicated role switch request (Protected RBAC)
  const handleRequestRoleSwitch = (targetRole: 'super_admin' | 'owner' | 'client' | 'staff_gateway') => {
    if (targetRole === 'staff_gateway') {
      setMode('staff_gateway');
      setIsSuperAdminAuditActive(false);
      return;
    }

    if (targetRole === 'client') {
      setMode('client');
      setIsSuperAdminAuditActive(false);
      return;
    }

    if (targetRole === 'owner') {
      if (isOwnerAuthenticated) {
        setMode('owner');
        setIsSuperAdminAuditActive(false);
      } else {
        setRoleAuthTarget('owner');
        setMode('staff_gateway');
      }
      return;
    }

    if (targetRole === 'super_admin') {
      if (isSuperAdminAuthenticated) {
        setMode('super_admin');
        setIsSuperAdminAuditActive(false);
      } else {
        setRoleAuthTarget('super_admin');
        setMode('staff_gateway');
      }
      return;
    }
  };

  const handleRoleAuthenticated = (role: 'super_admin' | 'owner') => {
    if (role === 'owner') {
      setIsOwnerAuthenticated(true);
      sessionStorage.setItem('ns_auth_owner', 'true');
      setMode('owner');
      setIsSuperAdminAuditActive(false);
    } else {
      setIsSuperAdminAuthenticated(true);
      sessionStorage.setItem('ns_auth_super_admin', 'true');
      setMode('super_admin');
      setIsSuperAdminAuditActive(false);
    }
  };

  const handleLogoutOwner = () => {
    setIsOwnerAuthenticated(false);
    sessionStorage.removeItem('ns_auth_owner');
    setMode('staff_gateway');
  };

  const handleLogoutAdmin = () => {
    setIsSuperAdminAuthenticated(false);
    sessionStorage.removeItem('ns_auth_super_admin');
    setIsSuperAdminAuditActive(false);
    setMode('staff_gateway');
  };

  // Super Admin inspecting the whole app with sensitive data masked
  const handleInspectSalonApp = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    setIsSuperAdminAuditActive(true);
    setOwnerSection('dashboard');
  };

  const handleSelectTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    if (mode === 'owner') {
      setOwnerSection('dashboard');
    }
  };

  // Quick Action handler
  const handleQuickAction = (actionId: string) => {
    if (!isOwnerAuthenticated) {
      setMode('staff_gateway');
      return;
    }
    setMode('owner');
    if (actionId === 'invite_client') {
      setInvitePreselectedClient(null);
      setIsInviteModalOpen(true);
    } else if (actionId === 'new_appointment') {
      setOwnerSection('appointments');
      setInitialAppointmentsTab('agenda');
      setAutoOpenAddApp(true);
    } else if (actionId === 'send_whatsapp') {
      setOwnerSection('marketing');
    } else if (actionId === 'add_client') {
      setOwnerSection('clients');
    } else if (actionId === 'open_waitlist') {
      setOwnerSection('appointments');
      setInitialAppointmentsTab('waitlist');
    }
  };

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
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-[#14161A] overflow-x-hidden" id="app-root">
      
      {/* PWA Install Banner */}
      <PwaInstallBanner />

      {/* ========================================================================= */}
      {/* HYPER-OPTIMIZED RESPONSIVE HEADER                                         */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/95 border-b border-[#E4E6EA]" id="global-header">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Left: Brand Icon & App Title & Mobile Tenant Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#1450FF] rounded-[6px] flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-base font-bold tracking-tight text-[#14161A] leading-none truncate font-display">
                  NoShow Reducer
                </h1>
                <span className="hidden sm:inline-block text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-[4px] border border-[#E4E6EA] uppercase font-mono">
                  SaaS v2.4
                </span>
              </div>
              
              {/* Salon Switcher Trigger (Compact on mobile) */}
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#1450FF] font-medium mt-0.5 truncate text-left transition group"
                title="Cambia Salone o Apri Menu"
              >
                <span className="truncate max-w-[130px] sm:max-w-[200px]">
                  Salone: <strong className="text-slate-800 group-hover:text-[#1450FF]">{currentTenantInfo?.name || config.name}</strong>
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-[#1450FF] flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* Desktop Controls depending on Role */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* 1. Staff Gateway View Header */}
            {mode === 'staff_gateway' && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 rounded-[4px] border border-amber-200 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Gatekeeper Accessi Riservati</span>
                </div>

                <button
                  onClick={() => setMode('client')}
                  className="px-3.5 py-1.5 rounded-[4px] font-bold text-xs text-slate-600 hover:text-[#1450FF] bg-slate-100 hover:bg-slate-200 border border-[#E4E6EA] transition flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5 text-[#1450FF]" />
                  <span>Area Prenotazioni Clienti</span>
                </button>
              </div>
            )}

            {/* 2. Client View Header */}
            {mode === 'client' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-[4px] border border-emerald-200 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="hidden lg:inline">Prenotazioni Online 24/7 Aperte</span>
                  <span className="lg:hidden">Online 24/7</span>
                </div>

                {loggedClientUser ? (
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-[4px] border border-[#E4E6EA] text-xs font-bold text-slate-800">
                    <UserCheck className="w-4 h-4 text-[#1450FF]" />
                    <span>{loggedClientUser.name}</span>
                    <button
                      onClick={() => setLoggedClientUser(null)}
                      className="ml-1 text-[11px] text-rose-600 hover:underline"
                    >
                      Esci
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 bg-[#1450FF] hover:bg-blue-600 text-white rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Accedi / Registrati</span>
                  </button>
                )}

                {/* Quick Staff Jump Back or Staff Login */}
                {isOwnerAuthenticated ? (
                  <button
                    onClick={() => setMode('owner')}
                    className="px-3.5 py-1.5 bg-[#1450FF] hover:bg-blue-600 text-white rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition"
                    title="Rientra nella sessione Titolare già attiva"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Torna a Gestione Salone</span>
                  </button>
                ) : isSuperAdminAuthenticated ? (
                  <button
                    onClick={() => setMode('super_admin')}
                    className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition"
                    title="Rientra nella sessione Super Admin già attiva"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Torna a Super Admin</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setMode('staff_gateway')}
                    className="px-3 py-1.5 bg-[#14161A] hover:bg-slate-800 text-white rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition border border-[#2A2D32]"
                    title="Accesso riservato per Titolare del salone e Super Admin con PIN"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Area Staff & Admin</span>
                  </button>
                )}
              </div>
            )}

            {/* 3. Salon Owner View Header */}
            {mode === 'owner' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 rounded-[4px] border border-[#E4E6EA] text-xs font-bold">
                  <Store className="w-4 h-4 text-[#1450FF]" />
                  <span>Titolare Salone</span>
                </div>

                {/* Primary Button: Invia Invito Web App (WhatsApp, Email, SMS) */}
                <button
                  type="button"
                  onClick={() => {
                    setInvitePreselectedClient(null);
                    setIsInviteModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition"
                  title="Invia link invito Web App via WhatsApp, Email o SMS"
                >
                  <Share2 className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Invita alla App</span>
                </button>

                {/* Quick Action Button: Nuovo Appuntamento */}
                <button
                  onClick={() => {
                    setOwnerSection('appointments');
                    setInitialAppointmentsTab('agenda');
                    setAutoOpenAddApp(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#1450FF] hover:bg-blue-600 text-white rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Nuovo Appuntamento</span>
                </button>

                {/* View as Client Preview */}
                <button
                  onClick={() => setMode('client')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition border border-[#E4E6EA]"
                  title="Visualizza come appare il portale di prenotazione ai clienti"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden xl:inline">Anteprima</span> Clienti
                </button>

                {/* Logout Owner */}
                <button
                  onClick={handleLogoutOwner}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition border border-rose-200"
                  title="Disconnetti dalla sessione Titolare"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Esci</span>
                </button>
              </div>
            )}

            {/* 4. Super Admin View Header */}
            {mode === 'super_admin' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-800 rounded-[4px] border border-purple-200 text-xs font-bold">
                  <Building2 className="w-4 h-4 text-purple-700" />
                  <span>Super Admin SaaS</span>
                  <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded-[4px] font-mono">LPD Privacy</span>
                </div>

                {isSuperAdminAuditActive ? (
                  <button
                    onClick={() => setIsSuperAdminAuditActive(false)}
                    className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Torna a Console Admin</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setMode('client')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition border border-[#E4E6EA]"
                    title="Visualizza l'app dal punto di vista cliente"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>Vista Clienti</span>
                  </button>
                )}

                <button
                  onClick={handleLogoutAdmin}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition border border-rose-200"
                  title="Disconnetti Super Admin"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Disconnetti Admin</span>
                </button>
              </div>
            )}

          </div>

          {/* Mobile Right Controls: Context-aware with immediate access */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* Mobile Context-Aware Role Switcher Button */}
            {mode === 'client' ? (
              isOwnerAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setMode('owner')}
                  className="px-2.5 py-1.5 bg-[#1450FF] text-white text-[11px] font-bold rounded-[4px] flex items-center gap-1 transition"
                >
                  <Store className="w-3 h-3" />
                  <span>Titolare</span>
                </button>
              ) : isSuperAdminAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setMode('super_admin')}
                  className="px-2.5 py-1.5 bg-purple-700 text-white text-[11px] font-bold rounded-[4px] flex items-center gap-1 transition"
                >
                  <Building2 className="w-3 h-3" />
                  <span>Admin</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode('staff_gateway')}
                  className="px-2.5 py-1.5 bg-[#14161A] text-white text-[11px] font-bold rounded-[4px] flex items-center gap-1 transition"
                  title="Accesso Staff & Super Admin"
                >
                  <Lock className="w-3 h-3 text-amber-300" />
                  <span>Staff PIN</span>
                </button>
              )
            ) : mode === 'staff_gateway' ? (
              <button
                type="button"
                onClick={() => setMode('client')}
                className="px-2.5 py-1.5 bg-emerald-600 text-white text-[11px] font-bold rounded-[4px] flex items-center gap-1 transition"
                title="Vai all'area clienti"
              >
                <Globe className="w-3 h-3" />
                <span>Clienti</span>
              </button>
            ) : mode === 'super_admin' && isSuperAdminAuditActive ? (
              <button
                type="button"
                onClick={() => setIsSuperAdminAuditActive(false)}
                className="px-2.5 py-1.5 bg-purple-700 text-white text-[11px] font-bold rounded-[4px] flex items-center gap-1 transition"
              >
                <Building2 className="w-3 h-3" />
                <span>Console</span>
              </button>
            ) : null}

            {mode === 'owner' && (
              <button
                type="button"
                onClick={() => {
                  setInvitePreselectedClient(null);
                  setIsInviteModalOpen(true);
                }}
                className="p-2 rounded-[4px] bg-emerald-600 text-white flex items-center justify-center transition"
                title="Invia link invito Web App"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Hamburger Menu Button (Touch Target >= 44px) */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="w-10 h-10 rounded-[4px] bg-slate-100 hover:bg-slate-200 border border-[#E4E6EA] flex items-center justify-center text-slate-800 transition relative"
              aria-label="Apri Menu di Navigazione"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
              {todayAppointmentsCount > 0 && mode === 'owner' && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#1450FF] rounded-full border-2 border-white" />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT ROUTER                                                       */}
      {/* ========================================================================= */}
      {mode === 'staff_gateway' || 
       (mode === 'owner' && !isOwnerAuthenticated) || 
       (mode === 'super_admin' && !isSuperAdminAuthenticated && !isSuperAdminAuditActive) ? (
        <StaffAccessGateway
          onAuthenticated={handleRoleAuthenticated}
          onNavigateToClient={() => setMode('client')}
          currentSalonName={currentTenantInfo?.name || config.name}
          isOwnerLoggedIn={isOwnerAuthenticated}
          isSuperAdminLoggedIn={isSuperAdminAuthenticated}
          initialRoleTab={gatewayConfig.initialRoleTab}
          lockRoleTab={gatewayConfig.lockRoleTab}
        />
      ) : mode === 'super_admin' && !isSuperAdminAuditActive ? (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <SuperAdminDashboard 
            tenants={tenants} 
            onSelectTenant={handleSelectTenant} 
            currentTenantId={currentTenantId} 
            onInspectApp={handleInspectSalonApp}
            onLogoutAdmin={handleLogoutAdmin}
          />
        </div>
      ) : mode === 'owner' || (mode === 'super_admin' && isSuperAdminAuditActive) ? (
        <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-6 p-3 sm:p-6 lg:p-8" id="owner-workspace">
          
          {/* Desktop Narrow Vertical Rail Navigation (#14161A graphite background) */}
          <aside className="hidden md:block w-20 flex-shrink-0">
            <nav className="flex flex-col items-center space-y-3 bg-[#14161A] p-3 rounded-[6px] border border-[#2A2D32] sticky top-24">
              <div className="w-10 h-10 rounded-[6px] bg-[#1450FF] text-white flex items-center justify-center font-bold mb-2 text-xs font-display">
                NS
              </div>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'appointments', label: 'Calendario', icon: Calendar, badge: todayAppointmentsCount > 0 ? `${todayAppointmentsCount}` : null },
                { id: 'clients', label: 'Clienti', icon: Users, badge: `${activeClients.length}` },
                { id: 'services', label: 'Servizi', icon: NotebookTabs },
                { id: 'marketing', label: 'Marketing', icon: MessageSquare },
                { id: 'settings', label: 'Impostazioni', icon: Settings2 },
                { id: 'instructions', label: 'Guida', icon: HelpCircle }
              ].map(item => {
                const Icon = item.icon;
                const isActive = ownerSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setOwnerSection(item.id)}
                    title={item.label}
                    className={`w-12 h-12 rounded-[6px] flex flex-col items-center justify-center transition-all duration-200 relative group ${
                      isActive 
                        ? 'bg-[#1450FF] text-white shadow-none' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 text-[9px] w-4 h-4 rounded-[4px] bg-[#1450FF] text-white flex items-center justify-center font-mono font-bold border border-[#14161A]">
                        {item.badge}
                      </span>
                    )}
                    {/* Tooltip on hover */}
                    <span className="absolute left-16 bg-[#14161A] text-white text-[11px] font-medium px-2 py-1 rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-[#2A2D32] shadow-md">
                      {item.label}
                    </span>
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
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#1450FF] text-white'
                      : 'bg-white border border-[#E4E6EA] text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#1450FF]'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-[4px] font-bold font-mono ${
                      isActive ? 'bg-white text-[#1450FF]' : 'bg-blue-50 text-[#1450FF]'
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
            {/* Super Admin Audit Banner */}
            {isSuperAdminAuditing && (
              <div className="w-full bg-[#14161A] text-white p-3.5 rounded-[6px] mb-5 border border-[#2A2D32] flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="p-2 bg-slate-900 rounded-[4px] text-purple-300 flex-shrink-0 border border-slate-800">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white flex items-center gap-1.5 text-sm font-display">
                      <span>Audit Super Admin Attivo</span>
                      <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-[4px] font-mono uppercase font-bold border border-purple-700/50">LPD / GDPR</span>
                    </p>
                    <p className="text-slate-300 text-xs">
                      Visione globale dell'app per <strong>{currentTenantInfo?.name || config.name}</strong>. Numeri di telefono, email private e note personali sono mascherati a tutela della privacy.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSuperAdminAuditActive(false)}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-[4px] text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Torna a Console Admin</span>
                </button>
              </div>
            )}

            {ownerSection === 'dashboard' && (
              <Dashboard 
                appointments={activeAppointments} 
                clients={activeClients} 
                onNavigateToSection={(sec) => setOwnerSection(sec)} 
                onOpenInviteClient={(client) => {
                  setInvitePreselectedClient(client || null);
                  setIsInviteModalOpen(true);
                }}
              />
            )}
            {ownerSection === 'appointments' && (
              <Appointments 
                appointments={activeAppointments}
                clients={activeClients}
                services={services}
                waitlist={waitlist}
                onUpdateAppointments={isSuperAdminAuditing ? () => {} : setAppointments}
                onUpdateWaitlist={isSuperAdminAuditing ? () => {} : setWaitlist}
                onUpdateClients={isSuperAdminAuditing ? () => {} : setClients}
                autoOpenAdd={isSuperAdminAuditing ? false : autoOpenAddApp}
                onResetAutoOpen={() => setAutoOpenAddApp(false)}
                initialTab={initialAppointmentsTab}
              />
            )}
            {ownerSection === 'clients' && (
              <ClientsList 
                clients={activeClients} 
                onUpdateClients={isSuperAdminAuditing ? () => {} : setClients} 
                onOpenInviteClient={(client) => {
                  setInvitePreselectedClient(client || null);
                  setIsInviteModalOpen(true);
                }}
              />
            )}
            {ownerSection === 'services' && (
              <ServicesList 
                services={services} 
                onUpdateServices={isSuperAdminAuditing ? () => {} : setServices} 
              />
            )}
            {ownerSection === 'marketing' && (
              <MarketingWhatsApp 
                config={config}
                clients={activeClients}
                campaigns={campaigns}
                onUpdateCampaigns={isSuperAdminAuditing ? () => {} : setCampaigns}
                onNavigateToSettings={() => setOwnerSection('settings')}
              />
            )}
            {ownerSection === 'settings' && (
              <Settings 
                config={config} 
                onUpdateConfig={isSuperAdminAuditing ? () => {} : setConfig} 
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
            <p>© 2026 NoShow Reducer SaaS • Protezione No-Show & Booking PWA.</p>
            
            {mode === 'client' ? (
              <div className="flex items-center gap-3 font-medium text-slate-400">
                <span>Accesso Pubblico Clienti</span>
                <span>•</span>
                <button 
                  onClick={() => handleRequestRoleSwitch('owner')} 
                  className="hover:text-indigo-600 transition flex items-center gap-1 font-semibold text-slate-500 hover:underline"
                >
                  <Lock className="w-3 h-3" />
                  <span>Accesso Riservato Personale (PIN)</span>
                </button>
              </div>
            ) : mode === 'owner' ? (
              <div className="flex items-center gap-4 font-medium text-slate-500">
                <button onClick={() => { setOwnerSection('instructions'); }} className="hover:text-indigo-600 transition">Guida Salone</button>
                <span>•</span>
                <button onClick={() => { setMode('client'); }} className="hover:text-indigo-600 transition">Anteprima Booking Clienti</button>
                <span>•</span>
                <button onClick={handleLogoutOwner} className="hover:text-rose-600 transition text-rose-600 font-semibold">Disconnetti Titolare</button>
              </div>
            ) : (
              <div className="flex items-center gap-4 font-medium text-slate-500">
                <button onClick={() => setIsSuperAdminAuditActive(false)} className="hover:text-purple-600 transition">Console Super Admin</button>
                <span>•</span>
                <button onClick={handleLogoutAdmin} className="hover:text-rose-600 transition text-rose-600 font-semibold">Disconnetti Super Admin</button>
              </div>
            )}
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
        onSelectMode={handleRequestRoleSwitch}
        ownerSection={ownerSection}
        onSelectOwnerSection={setOwnerSection}
        tenants={tenants}
        currentTenantId={currentTenantId}
        onSelectTenant={handleSelectTenant}
        config={config}
        todayAppointmentsCount={todayAppointmentsCount}
        totalClientsCount={activeClients.length}
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
        onSelectMode={handleRequestRoleSwitch}
        isOwnerAuthenticated={isOwnerAuthenticated}
      />

      {/* ========================================================================= */}
      {/* INVITE CLIENT MODAL (WHATSAPP +41, EMAIL, SMS)                            */}
      {/* ========================================================================= */}
      <InviteClientModal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInvitePreselectedClient(null);
        }}
        config={config}
        clients={clients}
        preselectedClient={invitePreselectedClient}
        onSuccessToast={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 4500);
        }}
      />

      {/* ========================================================================= */}
      {/* DEDICATED ROLE AUTH MODAL (PROTECTED RBAC GATEKEEPER)                     */}
      {/* ========================================================================= */}
      <DedicatedRoleAuthModal
        isOpen={showRoleAuthModal}
        targetRole={roleAuthTarget}
        onAuthenticated={handleRoleAuthenticated}
        onClose={() => setShowRoleAuthModal(false)}
      />

      {/* ========================================================================= */}
      {/* FLOATING TOAST NOTIFICATION                                               */}
      {/* ========================================================================= */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 right-4 sm:right-8 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
