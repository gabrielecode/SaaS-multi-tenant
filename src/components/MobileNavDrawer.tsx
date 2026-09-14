import React from 'react';
import { 
  X, 
  Store, 
  Building2, 
  Globe, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  NotebookTabs, 
  MessageSquare, 
  Settings2, 
  HelpCircle, 
  Plus, 
  Smartphone, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Lock,
  UserCheck,
  ExternalLink,
  Home,
  Clock,
  MapPin,
  Phone,
  Info
} from 'lucide-react';
import { TenantSalon, BusinessConfig, ClientAuthUser } from '../types';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'super_admin' | 'owner' | 'client' | 'staff_gateway' | 'landing';
  onSelectMode: (mode: 'super_admin' | 'owner' | 'client' | 'staff_gateway' | 'landing') => void;
  ownerSection: string;
  onSelectOwnerSection: (section: string) => void;
  tenants: TenantSalon[];
  currentTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  config: BusinessConfig;
  todayAppointmentsCount: number;
  totalClientsCount: number;
  loggedClientUser: ClientAuthUser | null;
  onOpenAuthModal: () => void;
  onLogoutClient: () => void;
  onQuickNewAppointment: () => void;
  isOwnerAuthenticated?: boolean;
  isSuperAdminAuthenticated?: boolean;
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  mode,
  onSelectMode,
  ownerSection,
  onSelectOwnerSection,
  tenants,
  currentTenantId,
  onSelectTenant,
  config,
  todayAppointmentsCount,
  totalClientsCount,
  loggedClientUser,
  onOpenAuthModal,
  onLogoutClient,
  onQuickNewAppointment,
  isOwnerAuthenticated = false,
  isSuperAdminAuthenticated = false
}: MobileNavDrawerProps) {
  if (!isOpen) return null;

  const currentTenant = tenants.find(t => t.id === currentTenantId) || tenants[0];

  const ownerNavItems = [
    { id: 'dashboard', label: 'Dashboard Finanziaria', icon: LayoutDashboard, badge: null },
    { id: 'appointments', label: 'Calendario Agenda', icon: Calendar, badge: todayAppointmentsCount > 0 ? `${todayAppointmentsCount} oggi` : null },
    { id: 'clients', label: 'Anagrafica Clienti', icon: Users, badge: `${totalClientsCount}` },
    { id: 'services', label: 'Listino Servizi', icon: NotebookTabs, badge: null },
    { id: 'marketing', label: 'Marketing WhatsApp', icon: MessageSquare, badge: 'Meta API' },
    { id: 'settings', label: 'Impostazioni & API', icon: Settings2, badge: null },
    { id: 'instructions', label: 'Guida & Istruzioni', icon: HelpCircle, badge: null },
  ];

  return (
    <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-slate-900 text-slate-100 h-full shadow-2xl flex flex-col border-l border-slate-800 z-10 overflow-y-auto">
        
        {/* ========================================================================= */}
        {/* DRAWER HEADER                                                             */}
        {/* ========================================================================= */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-20">
          <div className="flex items-center gap-2.5">
            {mode === 'client' ? (
              <>
                <div className="w-8 h-8 rounded-[4px] bg-[#1450FF] flex items-center justify-center text-white font-bold">
                  <Store className="w-4 h-4" />
                </div>
                <div className="truncate max-w-[190px]">
                  <h3 className="font-extrabold text-sm tracking-tight text-white leading-tight font-display truncate">
                    {config.name || currentTenant?.name || 'Salone'}
                  </h3>
                  <p className="text-[10px] text-blue-400 font-semibold truncate">
                    {currentTenant?.category || 'Prenotazioni Online'}
                  </p>
                </div>
              </>
            ) : mode === 'owner' ? (
              <>
                <div className="w-8 h-8 rounded-[4px] bg-[#1450FF] flex items-center justify-center text-white font-bold">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-white leading-tight font-display">Area Titolare</h3>
                  <p className="text-[10px] text-blue-400 font-semibold truncate max-w-[170px]">{config.name}</p>
                </div>
              </>
            ) : mode === 'super_admin' ? (
              <>
                <div className="w-8 h-8 rounded-[4px] bg-slate-800 flex items-center justify-center text-[#1450FF] font-bold border border-slate-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-white leading-tight font-display">Super Admin</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Console SaaS Multi-Salone</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-[4px] bg-[#1450FF] flex items-center justify-center text-white font-bold">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-white leading-tight font-display">NoShow Reducer</h3>
                  <p className="text-[10px] text-blue-400 font-semibold">Menu & Navigazione</p>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[4px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="Chiudi menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* DRAWER CONTENT BODY                                                       */}
        {/* ========================================================================= */}
        <div className="p-4 space-y-5 flex-1">

          {/* ======================================================================= */}
          {/* CASO 1: MODALITÀ CLIENTE (PURA ESPERIENZA CLIENTE)                     */}
          {/* ======================================================================= */}
          {mode === 'client' && (
            <div className="space-y-4">
              
              {/* Box Account Cliente */}
              <div className="bg-slate-800/60 p-3.5 rounded-[6px] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Il Tuo Account</span>
                  {loggedClientUser ? (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> Connesso
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-bold">Ospite</span>
                  )}
                </div>

                {loggedClientUser ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1450FF]/20 text-[#1450FF] flex items-center justify-center font-bold text-xs border border-[#1450FF]/30">
                        {loggedClientUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white leading-tight truncate">{loggedClientUser.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{loggedClientUser.phone || loggedClientUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onLogoutClient();
                        onClose();
                      }}
                      className="w-full text-center py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-[4px] text-xs font-semibold transition"
                    >
                      Disconnetti Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Accedi o registrati per gestire le tue prenotazioni e consultare lo storico dei tuoi trattamenti.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuthModal();
                      }}
                      className="w-full py-2.5 bg-[#1450FF] hover:bg-blue-600 text-white rounded-[4px] text-xs font-bold flex items-center justify-center gap-2 transition active:scale-[0.98]"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Accedi o Registrati
                    </button>
                  </div>
                )}
              </div>

              {/* Azioni di Navigazione Cliente */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                  Navigazione Salone
                </span>

                <button
                  onClick={() => {
                    onClose();
                    const el = document.getElementById('client-booking-form') || document.getElementById('booking-calendar');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-[4px] text-xs font-semibold bg-[#1450FF] text-white transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4" />
                    <span>Prenota un Trattamento</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    const el = document.getElementById('services-list') || document.getElementById('services-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-[4px] text-xs font-semibold text-slate-200 bg-slate-800/60 hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <NotebookTabs className="w-4 h-4 text-blue-400" />
                    <span>Listino Servizi & Prezzi</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Info & Contatti Salone */}
              <div className="bg-slate-800/40 p-3.5 rounded-[6px] border border-slate-800 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>Informazioni Salone</span>
                </div>
                
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Via Nassa / Centro, Lugano (CH)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Lun – Sab: 09:00 – 19:00</span>
                  </div>
                  {config.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <a href={`tel:${config.phone}`} className="text-blue-400 hover:underline font-mono">
                        {config.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Politica di Prenotazione Garantita */}
              <div className="bg-slate-800/30 p-3 rounded-[6px] border border-slate-800/80 text-[11px] space-y-1 text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Politica No-Show Trasparente</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  La caparra online tutela il tuo orario esclusivo in salone. Cancellazione o spostamento gratuito fino a 24 ore prima dell'appuntamento.
                </p>
              </div>

              {/* Footer Discreto */}
              <div className="pt-6 border-t border-slate-800 text-center space-y-2">
                {isOwnerAuthenticated ? (
                  <button
                    onClick={() => {
                      onClose();
                      onSelectMode('owner');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-[4px] text-xs font-semibold bg-[#1450FF] text-white transition active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Store className="w-4 h-4" />
                      <span>Torna a Gestione Salone</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  </button>
                ) : isSuperAdminAuthenticated ? (
                  <button
                    onClick={() => {
                      onClose();
                      onSelectMode('super_admin');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-[4px] text-xs font-semibold bg-slate-800 text-white border border-slate-700 transition active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-[#1450FF]" />
                      <span>Torna a Super Admin</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ) : null}
                <p className="text-[10px] text-slate-600">
                  {config.name} • Prenotazioni online sicure
                </p>
              </div>

            </div>
          )}

          {/* ======================================================================= */}
          {/* CASO 2: MODALITÀ TITOLARE SALONE (GESTIONALE STAFF)                     */}
          {/* ======================================================================= */}
          {mode === 'owner' && (
            <div className="space-y-4">
              
              {/* Quick Action Button */}
              <button
                onClick={() => {
                  onClose();
                  onQuickNewAppointment();
                }}
                className="w-full bg-[#1450FF] hover:bg-blue-600 text-white font-bold text-xs py-3 px-4 rounded-[4px] flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Nuovo Appuntamento Rapido
              </button>

              {/* Selettore Salone Attivo (se ci sono saloni) */}
              {tenants.length > 1 && (
                <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-[6px] border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Salone Attivo</span>
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-[4px] font-bold uppercase font-mono">
                      {currentTenant?.plan || 'PRO'}
                    </span>
                  </div>
                  <select
                    value={currentTenantId}
                    onChange={(e) => onSelectTenant(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-[4px] p-2.5 focus:outline-none focus:border-[#1450FF] font-medium"
                  >
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sezioni Gestionale Titolare */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                  Sezioni Gestionale
                </span>
                <div className="space-y-1">
                  {ownerNavItems.map(item => {
                    const Icon = item.icon;
                    const isActive = ownerSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectOwnerSection(item.id);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[4px] text-xs font-semibold transition ${
                          isActive
                            ? 'bg-[#1450FF] text-white'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded-[4px] font-bold font-mono ${
                            isActive ? 'bg-white text-[#1450FF]' : 'bg-slate-800 text-blue-300 border border-blue-500/30'
                          }`}>
                            {item.badge}
                          </span>
                        ) : (
                          <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Strumenti Rapidi & Anteprime per il Titolare */}
              <div className="space-y-1.5 pt-3 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                  Accessi & Anteprime
                </span>
                
                <button
                  onClick={() => {
                    onSelectMode('client');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-[4px] text-xs font-semibold text-slate-300 hover:bg-slate-800 bg-slate-800/40 border border-slate-800 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Anteprima Booking Clienti</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => {
                    onSelectMode('staff_gateway');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-[4px] text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Blocca / Esci da Sessione Staff</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>

              {/* Stato Connessioni Cloud */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                  Stato Connessioni Cloud
                </span>
                <div className="space-y-1.5 text-slate-400">
                  <div className="flex items-center justify-between px-2 py-1 bg-slate-800/30 rounded-[4px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Supabase Database
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">Online</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 bg-slate-800/30 rounded-[4px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Meta WhatsApp API
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">Pronto</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================================= */}
          {/* CASO 3: MODALITÀ SUPER ADMIN                                            */}
          {/* ======================================================================= */}
          {mode === 'super_admin' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                  Console Globale
                </span>
                
                <button
                  onClick={() => {
                    onSelectMode('owner');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-[4px] text-xs font-semibold bg-[#1450FF] text-white transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4 h-4" />
                    <span>Gestisci Salone Attivo</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                </button>

                <button
                  onClick={() => {
                    onSelectMode('client');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-[4px] text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>Visualizza Portale Clienti</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => {
                    onSelectMode('staff_gateway');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-[4px] text-xs font-semibold text-rose-400 hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4" />
                    <span>Esci da Super Admin</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* CASO 4: MODALITÀ STAFF GATEWAY O LANDING                                */}
          {/* ======================================================================= */}
          {(mode === 'staff_gateway' || mode === 'landing') && (
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                Navigazione Rapida
              </span>

              <button
                onClick={() => {
                  onSelectMode('landing');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-[4px] text-xs font-semibold transition ${
                  mode === 'landing' ? 'bg-[#1450FF] text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-blue-400" />
                  <span>Presentazione NoShow Reducer</span>
                </div>
                {mode === 'landing' && <CheckCircle2 className="w-4 h-4 text-white" />}
              </button>

              <button
                onClick={() => {
                  onSelectMode('client');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-[4px] text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Prenotazione Cliente (Demo)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  onSelectMode('staff_gateway');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-[4px] text-xs font-semibold transition ${
                  mode === 'staff_gateway' ? 'bg-[#1450FF] text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Accesso Staff Salone (PIN)</span>
                </div>
                {mode === 'staff_gateway' && <CheckCircle2 className="w-4 h-4 text-white" />}
              </button>
            </div>
          )}

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 text-center text-[10px] text-slate-500 bg-slate-950/60">
          <p>NoShow Reducer SaaS • Protezione No-Show e Caparra</p>
        </div>

      </div>
    </div>
  );
}
