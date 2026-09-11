import { useState, FormEvent } from 'react';
import { ShieldCheck, Lock, Building2, Store, X, ArrowRight, AlertCircle, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';

interface DedicatedRoleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: 'super_admin' | 'owner';
  onAuthenticated: (role: 'super_admin' | 'owner') => void;
}

export default function DedicatedRoleAuthModal({
  isOpen,
  onClose,
  targetRole,
  onAuthenticated
}: DedicatedRoleAuthModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSuperAdmin = targetRole === 'super_admin';
  const expectedPin = isSuperAdmin ? '9988' : '1234';
  const roleTitle = isSuperAdmin ? 'Super Admin SaaS' : 'Titolare Salone';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin.trim() === expectedPin) {
      onAuthenticated(targetRole);
      setPin('');
      onClose();
    } else {
      setError(`PIN non corretto per ${roleTitle}. Utilizza il PIN di sicurezza predefinito (${expectedPin}).`);
    }
  };

  const handleQuickDemoPin = () => {
    setPin(expectedPin);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 z-10 overflow-hidden">
        
        {/* Top Gradient Header */}
        <div className={`p-6 text-white ${
          isSuperAdmin 
            ? 'bg-gradient-to-br from-purple-950 via-slate-900 to-purple-900' 
            : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              {isSuperAdmin ? (
                <Building2 className="w-6 h-6 text-purple-300" />
              ) : (
                <Store className="w-6 h-6 text-indigo-300" />
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition active:scale-95"
              aria-label="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 border border-white/10 text-white/90">
              <Lock className="w-3 h-3 text-amber-300" />
              Accesso Riservato e Protetto
            </div>
            <h3 className="text-xl font-extrabold text-white mt-1">
              Area {roleTitle}
            </h3>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">
              {isSuperAdmin 
                ? 'Inserisci il codice di sicurezza centrale per monitorare la piattaforma SaaS e visionare l\'app con dati sensibili protetti.' 
                : 'Inserisci il PIN del titolare per accedere all\'agenda, alla gestione clienti e all\'invio inviti.'}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Codice PIN / Password di Accesso
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Inserisci PIN (es. 1234 o 9988)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-sm font-mono tracking-widest focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 font-semibold animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick demo helper button for fast testing */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="text-slate-600">
              <span className="font-bold text-slate-800">PIN Predefinito:</span>{' '}
              <code className="bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded font-mono font-bold">
                {expectedPin}
              </code>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoPin}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Compila rapido
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition active:scale-95"
            >
              Annulla
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 ${
                isSuperAdmin 
                  ? 'bg-purple-600 hover:bg-purple-500' 
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sblocca ed Entra</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
