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
  ExternalLink
} from 'lucide-react';
import { TenantSalon, BusinessConfig, ClientAuthUser } from '../types';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'super_admin' | 'owner' | 'client';
  onSelectMode: (mode: 'super_admin' | 'owner' | 'client') => void;
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
  onQuickNewAppointment
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
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white leading-tight">NoShow Reducer</h3>
              <p className="text-[10px] text-indigo-400 font-semibold">Menu Mobile & Navigazione</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="Chiudi menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-5 flex-1">

          {/* Quick Action Button */}
          {mode === 'owner' && (
            <button
              onClick={() => {
                onClose();
                onQuickNewAppointment();
              }}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nuovo Appuntamento Rapido
            </button>
          )}

          {/* Role Switcher Section */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
              Ruolo & Modalità Visualizzazione
            </span>
            <div className="grid grid-cols-1 gap-1.5 bg-slate-800/60 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  onSelectMode('owner');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition ${
                  mode === 'owner'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Store className={`w-4 h-4 ${mode === 'owner' ? 'text-white' : 'text-indigo-400'}`} />
                  <div className="text-left">
                    <p className="leading-tight">Titolare Salone</p>
                    <p className="text-[10px] text-slate-300 font-normal">Gestionale & WhatsApp</p>
                  </div>
                </div>
                {mode === 'owner' && <CheckCircle2 className="w-4 h-4 text-white" />}
              </button>

              <button
                onClick={() => {
                  onSelectMode('client');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition ${
                  mode === 'client'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className={`w-4 h-4 ${mode === 'client' ? 'text-white' : 'text-indigo-400'}`} />
                  <div className="text-left">
                    <p className="leading-tight">Portale Cliente (PWA)</p>
                    <p className="text-[10px] text-slate-300 font-normal">Booking & Notifiche</p>
                  </div>
                </div>
                {mode === 'client' && <CheckCircle2 className="w-4 h-4 text-white" />}
              </button>

              <button
                onClick={() => {
                  onSelectMode('super_admin');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition ${
                  mode === 'super_admin'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className={`w-4 h-4 ${mode === 'super_admin' ? 'text-white' : 'text-purple-400'}`} />
                  <div className="text-left">
                    <p className="leading-tight">Super Admin SaaS</p>
                    <p className="text-[10px] text-slate-300 font-normal">Multi-Salone & MRR</p>
                  </div>
                </div>
                {mode === 'super_admin' && <CheckCircle2 className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>

          {/* Active Tenant Selector (Multi-Tenant) */}
          <div className="space-y-2 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Salone Attivo</span>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                {currentTenant?.plan || 'PRO'}
              </span>
            </div>
            <select
              value={currentTenantId}
              onChange={(e) => onSelectTenant(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 font-medium"
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>

          {/* Owner Navigation Links */}
          {mode === 'owner' && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                Sezioni Salone
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
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-white text-indigo-700' : 'bg-slate-800 text-indigo-300 border border-indigo-500/30'
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
          )}

          {/* Client Portal Info when in client mode */}
          {mode === 'client' && (
            <div className="space-y-3 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Account Cliente</span>
                {loggedClientUser ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Connesso
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-bold">Ospite</span>
                )}
              </div>

              {loggedClientUser ? (
                <div className="space-y-2">
                  <div className="text-xs text-white font-bold flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    {loggedClientUser.name}
                  </div>
                  <p className="text-[11px] text-slate-400">{loggedClientUser.email}</p>
                  <button
                    onClick={() => {
                      onLogoutClient();
                      onClose();
                    }}
                    className="w-full text-center py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg text-xs font-semibold transition"
                  >
                    Disconnetti Account
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuthModal();
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Accedi o Registrati
                </button>
              )}
            </div>
          )}

          {/* System Status Indicators */}
          <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
              Stato Connessioni Cloud
            </span>
            <div className="space-y-1.5 text-slate-400">
              <div className="flex items-center justify-between px-2 py-1 bg-slate-800/30 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Supabase Auth & Database
                </span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1 bg-slate-800/30 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Meta WhatsApp Cloud API
                </span>
                <span className="text-emerald-400 font-bold">Pronto</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1 bg-slate-800/30 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3 text-indigo-400" />
                  PWA Mobile Installabile
                </span>
                <span className="text-indigo-400 font-bold">Attiva</span>
              </div>
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 text-center text-[10px] text-slate-500 bg-slate-950/60">
          <p>NoShow Reducer SaaS v2.4 • Vercel Ready</p>
        </div>

      </div>
    </div>
  );
}
