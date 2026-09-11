import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  MessageSquare, 
  Menu, 
  Plus, 
  Building2, 
  Globe, 
  Sparkles,
  UserCheck,
  Lock,
  ListOrdered
} from 'lucide-react';
import { ClientAuthUser } from '../types';

interface MobileBottomBarProps {
  mode: 'super_admin' | 'owner' | 'client' | 'staff_gateway';
  ownerSection: string;
  onSelectOwnerSection: (section: string) => void;
  onOpenDrawer: () => void;
  onOpenQuickAction: () => void;
  todayAppointmentsCount: number;
  loggedClientUser: ClientAuthUser | null;
  onOpenAuthModal: () => void;
  onSelectMode: (mode: 'super_admin' | 'owner' | 'client' | 'staff_gateway') => void;
  isOwnerAuthenticated?: boolean;
}

export default function MobileBottomBar({
  mode,
  ownerSection,
  onSelectOwnerSection,
  onOpenDrawer,
  onOpenQuickAction,
  todayAppointmentsCount,
  loggedClientUser,
  onOpenAuthModal,
  onSelectMode,
  isOwnerAuthenticated
}: MobileBottomBarProps) {
  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1 pb-safe"
      id="mobile-bottom-navigation"
      aria-label="Navigazione mobile rapida"
    >
      {mode === 'staff_gateway' ? (
        /* Staff Gateway Mode Navigation */
        <div className="grid grid-cols-3 items-center justify-around text-center">
          <button
            onClick={() => onSelectMode('staff_gateway')}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-amber-600 font-bold active:scale-90 transition"
          >
            <Lock className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] mt-1 font-extrabold">Accessi Staff</span>
          </button>

          <button
            onClick={() => onSelectMode('client')}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-500 hover:text-slate-900 font-medium active:scale-90 transition"
          >
            <Globe className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] mt-1">Prenotazioni</span>
          </button>

          <button
            onClick={onOpenDrawer}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-500 hover:text-slate-900 font-medium active:scale-90 transition"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-1">Menu</span>
          </button>
        </div>
      ) : mode === 'owner' ? (
        /* Owner Mode Navigation */
        <div className="grid grid-cols-5 items-center justify-around text-center">
          
          {/* Dashboard */}
          <button
            onClick={() => onSelectOwnerSection('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 ${
              ownerSection === 'dashboard' 
                ? 'text-indigo-600 font-bold' 
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <LayoutDashboard className={`w-5 h-5 ${ownerSection === 'dashboard' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {ownerSection === 'dashboard' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[56px]">Dashboard</span>
          </button>

          {/* Agenda */}
          <button
            onClick={() => onSelectOwnerSection('appointments')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 ${
              ownerSection === 'appointments' 
                ? 'text-indigo-600 font-bold' 
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <Calendar className={`w-5 h-5 ${ownerSection === 'appointments' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {todayAppointmentsCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {todayAppointmentsCount}
                </span>
              )}
              {ownerSection === 'appointments' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[56px]">Agenda</span>
          </button>

          {/* Center Elevated Action Button (FAB Scorciatoie Rapide) */}
          <div className="flex items-center justify-center">
            <button
              onClick={onOpenQuickAction}
              className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-90 border-2 border-white -mt-3"
              aria-label="Scorciatoie Rapide"
              title="Aggiungi o azione rapida"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Clienti */}
          <button
            onClick={() => onSelectOwnerSection('clients')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 ${
              ownerSection === 'clients' 
                ? 'text-indigo-600 font-bold' 
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <Users className={`w-5 h-5 ${ownerSection === 'clients' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {ownerSection === 'clients' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[56px]">Clienti</span>
          </button>

          {/* Marketing or More */}
          <button
            onClick={() => onSelectOwnerSection('marketing')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 ${
              ownerSection === 'marketing' 
                ? 'text-indigo-600 font-bold' 
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <MessageSquare className={`w-5 h-5 ${ownerSection === 'marketing' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white"></span>
              {ownerSection === 'marketing' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[56px]">WhatsApp</span>
          </button>

        </div>
      ) : mode === 'client' ? (
        /* Client Mode Navigation */
        <div className="grid grid-cols-4 items-center justify-around text-center">
          
          {/* Prenota */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-indigo-600 font-bold active:scale-90 transition"
          >
            <Calendar className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] mt-1">Prenota</span>
          </button>

          {/* Account / Login */}
          <button
            onClick={onOpenAuthModal}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-500 hover:text-slate-900 font-medium active:scale-90 transition"
          >
            {loggedClientUser ? (
              <UserCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
            <span className="text-[10px] mt-1 truncate max-w-[64px]">
              {loggedClientUser ? 'Profilo' : 'Accedi'}
            </span>
          </button>

          {/* Torna al Salone o Accesso Staff */}
          <button
            onClick={() => onSelectMode('owner')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl font-medium active:scale-90 transition ${
              isOwnerAuthenticated 
                ? 'text-indigo-600 font-bold' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {isOwnerAuthenticated ? (
              <Sparkles className="w-5 h-5 text-indigo-600" />
            ) : (
              <Lock className="w-5 h-5 text-amber-500" />
            )}
            <span className="text-[10px] mt-1">
              {isOwnerAuthenticated ? 'Titolare' : 'Staff PIN'}
            </span>
          </button>

          {/* Menu Drawer */}
          <button
            onClick={onOpenDrawer}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-500 hover:text-slate-900 font-medium active:scale-90 transition"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-1">Menu</span>
          </button>

        </div>
      ) : (
        /* Super Admin Mode Navigation */
        <div className="grid grid-cols-3 items-center justify-around text-center">
          
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-purple-600 font-bold active:scale-90 transition"
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] mt-1">Saloni</span>
          </button>

          <button
            onClick={() => onSelectMode('owner')}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-500 hover:text-slate-900 font-medium active:scale-90 transition"
          >
            <LayoutDashboard className="w-5 h-5 text-indigo-500" />
            <span className="text-[10px] mt-1">Vai al Salone</span>
          </button>

          <button
            onClick={onOpenDrawer}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-500 hover:text-slate-900 font-medium active:scale-90 transition"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-1">Menu</span>
          </button>

        </div>
      )}
    </nav>
  );
}
