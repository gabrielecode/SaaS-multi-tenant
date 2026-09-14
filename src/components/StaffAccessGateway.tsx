import { useState, FormEvent } from 'react';
import { 
  Building2, 
  Store, 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  Calendar, 
  Users, 
  BarChart3, 
  Smartphone,
  Eye,
  EyeOff,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface StaffAccessGatewayProps {
  onAuthenticated: (role: 'super_admin' | 'owner') => void;
  onNavigateToClient: () => void;
  currentSalonName: string;
  isOwnerLoggedIn?: boolean;
  isSuperAdminLoggedIn?: boolean;
  initialRoleTab?: 'owner' | 'super_admin';
  lockRoleTab?: boolean;
}

export default function StaffAccessGateway({
  onAuthenticated,
  onNavigateToClient,
  currentSalonName,
  isOwnerLoggedIn = false,
  isSuperAdminLoggedIn = false,
  initialRoleTab = 'owner',
  lockRoleTab = false
}: StaffAccessGatewayProps) {
  // Active Tab: 'owner' | 'super_admin'
  const [activeTab, setActiveTab] = useState<'owner' | 'super_admin'>(initialRoleTab);
  
  // PIN states for Owner
  const [ownerPin, setOwnerPin] = useState('');
  const [ownerError, setOwnerError] = useState<string | null>(null);

  // PIN states for Super Admin
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  // Visibility toggle
  const [showPin, setShowPin] = useState(false);

  // Submit Owner PIN
  const handleOwnerSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    setOwnerError(null);

    if (ownerPin.trim() === '1234') {
      onAuthenticated('owner');
    } else {
      setOwnerError('PIN Titolare errato. Inserisci il PIN autorizzato (predefinito: 1234).');
    }
  };

  // Submit Super Admin PIN
  const handleAdminSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    setAdminError(null);

    if (adminPin.trim() === '9988') {
      onAuthenticated('super_admin');
    } else {
      setAdminError('PIN Super Admin errato. Inserisci il PIN autorizzato (predefinito: 9988).');
    }
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in bg-[#FAFAFA] text-[#14161A] font-sans" id="staff-access-gateway">
      
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
          <Lock className="w-3.5 h-3.5 text-amber-700" />
          <span>Portale Accessi Riservati con Gatekeeper</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#14161A] tracking-tight font-display">
          {lockRoleTab ? (initialRoleTab === 'owner' ? 'Accesso Titolare Salone' : 'Accesso Super Admin') : 'Home Page Accessi Dedicati'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {lockRoleTab 
            ? (initialRoleTab === 'owner' 
                ? `Inserisci il PIN autorizzato per gestire il salone "${currentSalonName}".` 
                : 'Inserisci il PIN Super Admin per accedere alla console globale della piattaforma.')
            : 'Area riservata a Titolare Salone e Super Admin SaaS. Sblocca la tua console inserendo il PIN autorizzato.'}
        </p>
      </div>

      {/* Role Switcher Cards (Dual Lane - hidden if lockRoleTab is true) */}
      {!lockRoleTab && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          
          {/* ======================================================== */}
          {/* CARD 1: TITOLARE SALONE                                  */}
          {/* ======================================================== */}
          <div 
            onClick={() => setActiveTab('owner')}
            className={`cursor-pointer rounded-[6px] p-5 transition-all duration-200 relative border bg-white ${
              activeTab === 'owner'
                ? 'border-[#1450FF] ring-2 ring-[#1450FF]/20 shadow-xs'
                : 'border-[#E4E6EA] hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="w-10 h-10 rounded-[4px] bg-[#1450FF] text-white flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] bg-blue-50 text-[#1450FF] border border-blue-200">
                PIN: 1234
              </span>
            </div>

            <h3 className="text-base font-bold text-[#14161A] mb-1 flex items-center gap-2 font-display">
              <span>Titolare Salone</span>
              {isOwnerLoggedIn && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-[4px] font-bold">
                  Attiva
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Gestione per il salone <strong>"{currentSalonName}"</strong>. Agenda, clienti, campagne WhatsApp e listino.
            </p>

            <div className="space-y-1.5 border-t border-[#E4E6EA] pt-3 text-xs text-slate-600 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#1450FF]" />
                <span>Agenda con calendario interattivo</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#1450FF]" />
                <span>Anagrafica clienti e storico affidabilità</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-[#1450FF]" />
                <span>Integrazione WhatsApp e invio inviti</span>
              </div>
            </div>

            {activeTab === 'owner' ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1450FF]">
                <span>Selezionato: inserisci il PIN sotto</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            ) : (
              <button 
                type="button"
                className="text-xs font-bold text-slate-700 hover:text-[#1450FF] flex items-center gap-1"
              >
                <span>Seleziona Accesso Titolare</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* CARD 2: SUPER ADMIN SAAS                                 */}
          {/* ======================================================== */}
          <div 
            onClick={() => setActiveTab('super_admin')}
            className={`cursor-pointer rounded-[6px] p-5 transition-all duration-200 relative border bg-white ${
              activeTab === 'super_admin'
                ? 'border-purple-600 ring-2 ring-purple-600/20 shadow-xs'
                : 'border-[#E4E6EA] hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="w-10 h-10 rounded-[4px] bg-purple-700 text-white flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] bg-purple-50 text-purple-700 border border-purple-200">
                PIN: 9988
              </span>
            </div>

            <h3 className="text-base font-bold text-[#14161A] mb-1 flex items-center gap-2 font-display">
              <span>Super Admin SaaS</span>
              {isSuperAdminLoggedIn && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-[4px] font-bold">
                  Attiva
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Console multi-tenant globale. Gestione saloni affiliati, metriche di fatturato, canoni e audit LPD/GDPR.
            </p>

            <div className="space-y-1.5 border-t border-[#E4E6EA] pt-3 text-xs text-slate-600 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-purple-700" />
                <span>Gestione multi-salone & onboarding</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-purple-700" />
                <span>Modalità Ispezione Audit LPD / GDPR</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-purple-700" />
                <span>Metriche globali MRR e log di sistema</span>
              </div>
            </div>

            {activeTab === 'super_admin' ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
                <span>Selezionato: inserisci il PIN sotto</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            ) : (
              <button 
                type="button"
                className="text-xs font-bold text-slate-700 hover:text-purple-700 flex items-center gap-1"
              >
                <span>Seleziona Accesso Super Admin</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* ACTIVE PIN INPUT (SOLO CAMPO COMPILABILE)                */}
      {/* ======================================================== */}
      <form 
        onSubmit={activeTab === 'owner' ? handleOwnerSubmit : handleAdminSubmit}
        className={`rounded-[6px] border p-6 sm:p-8 max-w-xl mx-auto transition-all ${
          activeTab === 'owner' 
            ? 'bg-[#14161A] text-white border-slate-800' 
            : 'bg-[#14161A] text-white border-slate-800'
        }`}
      >
        <div className="text-center space-y-1.5 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider bg-white/10 border border-white/10 text-white font-mono">
            <KeyRound className="w-3.5 h-3.5 text-amber-300" />
            <span>Gatekeeper con PIN di Sicurezza</span>
          </div>
          <h3 className="text-lg font-bold text-white font-display">
            Accesso {activeTab === 'owner' ? 'Titolare Salone' : 'Super Admin Piattaforma'}
          </h3>
          <p className="text-xs text-slate-400">
            {activeTab === 'owner'
              ? 'Inserisci il PIN Titolare autorizzato per sbloccare la gestione'
              : 'Inserisci il PIN Super Admin autorizzato per accedere alla console'}
          </p>
        </div>

        {/* Solo Campo Compilabile */}
        <div className="max-w-md mx-auto mb-4 space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center font-mono">
            Codice PIN di Accesso
          </label>
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={8}
              autoFocus
              value={activeTab === 'owner' ? ownerPin : adminPin}
              onChange={(e) => {
                const val = e.target.value;
                if (activeTab === 'owner') {
                  setOwnerPin(val);
                  setOwnerError(null);
                } else {
                  setAdminPin(val);
                  setAdminError(null);
                }
              }}
              placeholder={`Digita PIN (${activeTab === 'owner' ? 'es. 1234' : 'es. 9988'})`}
              className="w-full px-4 py-3 pr-12 bg-slate-900 focus:bg-white text-white focus:text-[#14161A] border border-slate-700 focus:border-[#1450FF] rounded-[4px] text-center text-xl font-mono tracking-widest outline-none transition-all placeholder:text-slate-500 placeholder:text-xs placeholder:font-sans placeholder:tracking-normal"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-[4px] text-slate-400 hover:text-white transition"
              title={showPin ? 'Nascondi PIN' : 'Mostra PIN'}
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Error message */}
        {(activeTab === 'owner' ? ownerError : adminError) && (
          <div className="p-3 bg-rose-950 border border-rose-800 rounded-[4px] text-rose-300 text-xs font-bold flex items-center gap-2 mb-4 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{activeTab === 'owner' ? ownerError : adminError}</span>
          </div>
        )}

        {/* Quick Helper Button: Compila PIN Demo & Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'owner') {
                setOwnerPin('1234');
                setOwnerError(null);
              } else {
                setAdminPin('9988');
                setAdminError(null);
              }
            }}
            className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition underline decoration-dotted py-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Compila PIN ({activeTab === 'owner' ? '1234' : '9988'})</span>
          </button>

          <button
            type="submit"
            className={`w-full sm:w-auto px-5 py-2.5 rounded-[4px] text-white font-bold text-xs flex items-center justify-center gap-2 transition ${
              activeTab === 'owner'
                ? 'bg-[#1450FF] hover:bg-blue-600'
                : 'bg-purple-700 hover:bg-purple-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sblocca ed Entra</span>
          </button>
        </div>

      </form>

      {/* Switch to Client Booking Portal */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onNavigateToClient}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-white hover:bg-slate-50 border border-[#E4E6EA] text-slate-700 text-xs font-bold transition"
        >
          <Globe className="w-4 h-4 text-[#1450FF]" />
          <span>Area Prenotazioni Online Clienti</span>
        </button>
      </div>

    </div>
  );
}
