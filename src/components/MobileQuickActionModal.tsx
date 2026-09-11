import React from 'react';
import { 
  X, 
  Calendar, 
  MessageSquare, 
  UserPlus, 
  Clock, 
  Store, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Share2
} from 'lucide-react';
import { TenantSalon } from '../types';

interface MobileQuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionSelect: (action: string) => void;
  tenants: TenantSalon[];
  currentTenantId: string;
  onSelectTenant: (tenantId: string) => void;
}

export default function MobileQuickActionModal({
  isOpen,
  onClose,
  onActionSelect,
  tenants,
  currentTenantId,
  onSelectTenant
}: MobileQuickActionModalProps) {
  if (!isOpen) return null;

  const currentTenant = tenants.find(t => t.id === currentTenantId) || tenants[0];

  const actions = [
    {
      id: 'invite_client',
      title: 'Invia Invito Web App',
      desc: 'Invita clienti via WhatsApp (🇨🇭 +41), Email o SMS',
      icon: Share2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'new_appointment',
      title: 'Nuovo Appuntamento in Agenda',
      desc: 'Inserisci prenotazione con acconto e orario dedicato',
      icon: Calendar,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    {
      id: 'send_whatsapp',
      title: 'Campagna WhatsApp Promozionale',
      desc: 'Invia promo VIP o riattiva clienti inattivi tramite Meta API',
      icon: MessageSquare,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      id: 'add_client',
      title: 'Nuovo Cliente in Anagrafica',
      desc: 'Registra recapiti, note storiche e livello di affidabilità',
      icon: UserPlus,
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      id: 'open_waitlist',
      title: 'Gestione Lista d\'Attesa',
      desc: 'Visualizza e chiama i clienti per coprire slot cancellati',
      icon: Clock,
      color: 'bg-amber-50 text-amber-600 border-amber-200'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Bottom Sheet on mobile, Dialog on tablet/desktop */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Handle for mobile pull down visual cue */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden mb-2"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200 uppercase">
                Scorciatoie Rapide
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">Cosa vuoi fare adesso?</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition active:scale-95"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions List */}
        <div className="space-y-2">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onActionSelect(act.id);
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 text-left transition group active:scale-[0.98]"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${act.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition truncate">
                    {act.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {act.desc}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
              </button>
            );
          })}
        </div>

        {/* Quick Tenant Switch in Sheet */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Salone: <strong className="text-slate-800">{currentTenant.name}</strong></span>
          <select
            value={currentTenantId}
            onChange={(e) => onSelectTenant(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
          >
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
}
