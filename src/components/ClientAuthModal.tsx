import React, { useState, useEffect } from 'react';
import { ClientAuthUser, Client } from '../types';
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  X, 
  ArrowRight, 
  ShieldCheck 
} from 'lucide-react';

interface ClientAuthModalProps {
  currentTenantId?: string;
  existingClients?: Client[];
  onLogin: (user: ClientAuthUser) => void;
  onRegisterClient?: (client: Client) => void;
  onClose: () => void;
}

// Pre-seeded client accounts so testing works immediately
const DEFAULT_REGISTERED_USERS: ClientAuthUser[] = [
  {
    id: 'c3',
    email: 'giulia.verdi@email.it',
    name: 'Giulia Verdi',
    phone: '+39 347 888 9999',
    password: 'password123',
    pushSubscribed: true,
    token: 'jwt_giulia_seed_token',
    createdAt: '2026-01-10'
  },
  {
    id: 'c2',
    email: 'marco.bianchi@email.it',
    name: 'Marco Bianchi',
    phone: '+39 333 444 5555',
    password: 'password123',
    pushSubscribed: true,
    token: 'jwt_marco_seed_token',
    createdAt: '2026-02-14'
  },
  {
    id: 'c1',
    email: 'mario.rossi@email.it',
    name: 'Mario Rossi',
    phone: '+39 333 999 8888',
    password: 'password123',
    pushSubscribed: true,
    token: 'jwt_mario_seed_token',
    createdAt: '2026-03-01'
  }
];

export default function ClientAuthModal({ 
  currentTenantId = 'salon_default_1',
  existingClients = [],
  onLogin, 
  onRegisterClient,
  onClose 
}: ClientAuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  
  // Registration form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pushOptIn, setPushOptIn] = useState(true);
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Status and feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Local storage accounts list
  const [registeredUsers, setRegisteredUsers] = useState<ClientAuthUser[]>(() => {
    try {
      const saved = localStorage.getItem('ns_registered_client_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_REGISTERED_USERS;
      }
    } catch {
      // fallback
    }
    return DEFAULT_REGISTERED_USERS;
  });

  // Save registered users list whenever updated
  useEffect(() => {
    localStorage.setItem('ns_registered_client_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // Clean and normalize phone number for comparison
  const normalizePhone = (num: string) => num.replace(/\D/g, '');

  // Handle Submit: Login or Registration
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (isRegister) {
      // ==========================================
      // REGISTRATION FLOW & VALIDATIONS
      // ==========================================
      if (!name.trim()) {
        setErrorMsg('Inserisci il tuo nome e cognome completo.');
        return;
      }

      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setErrorMsg('Inserisci un indirizzo email valido (es. nome@dominio.it).');
        return;
      }

      const digitsOnlyPhone = normalizePhone(cleanPhone);
      if (digitsOnlyPhone.length < 8) {
        setErrorMsg('Inserisci un numero di cellulare valido (almeno 8 cifre).');
        return;
      }

      if (password.length < 6) {
        setErrorMsg('La password deve contenere almeno 6 caratteri.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg('Le password inserite non coincidono. Verifica e riprova.');
        return;
      }

      // Check if email already registered
      const emailExists = registeredUsers.some(u => u.email.toLowerCase() === cleanEmail);
      if (emailExists) {
        setErrorMsg('Questa email è già associata a un account. Clicca su "Accedi" per effettuare il login.');
        return;
      }

      // Check if phone already registered
      const phoneExists = registeredUsers.some(u => normalizePhone(u.phone) === digitsOnlyPhone);
      if (phoneExists) {
        setErrorMsg('Questo numero di telefono è già registrato con un altro account.');
        return;
      }

      // Generate verified user object
      const newUserId = 'client_usr_' + Date.now();
      const newUser: ClientAuthUser = {
        id: newUserId,
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        password: password,
        pushSubscribed: pushOptIn,
        token: 'jwt_sb_auth_' + Math.random().toString(36).substring(2) + Date.now(),
        createdAt: new Date().toISOString()
      };

      // 1. Add to registered users list
      const updatedList = [newUser, ...registeredUsers];
      setRegisteredUsers(updatedList);
      localStorage.setItem('ns_registered_client_users', JSON.stringify(updatedList));

      // 2. Synchronize user into the salon client database
      if (onRegisterClient) {
        const clientRecord: Client = {
          id: 'c_' + Date.now(),
          tenant_id: currentTenantId,
          name: name.trim(),
          phone: cleanPhone,
          email: cleanEmail,
          noShowCount: 0,
          completedCount: 0,
          reliabilityScore: 100,
          notes: 'Cliente registrato autonomamente tramite PWA / Portale Web',
          riskLevel: 'LOW',
          loyaltyPoints: 10,
          isVip: false
        };
        onRegisterClient(clientRecord);
      }

      // 3. Save active login session
      localStorage.setItem('ns_logged_client_user', JSON.stringify(newUser));
      localStorage.setItem('client_name', newUser.name);
      localStorage.setItem('client_phone', newUser.phone);

      setSuccessMsg(`Account creato con successo! Benvenuto/a, ${newUser.name}.`);
      setTimeout(() => {
        onLogin(newUser);
      }, 700);

    } else {
      // ==========================================
      // LOGIN FLOW & CREDENTIALS CHECK
      // ==========================================
      if (!cleanEmail) {
        setErrorMsg('Inserisci la tua email o numero di telefono.');
        return;
      }

      if (!password) {
        setErrorMsg('Inserisci la password per accedere.');
        return;
      }

      // Look up account by email or phone
      const foundUser = registeredUsers.find(
        u => u.email.toLowerCase() === cleanEmail || normalizePhone(u.phone) === normalizePhone(cleanEmail)
      );

      if (!foundUser) {
        // Also check if user exists in salon clients list to provide helpful onboarding
        const clientInSalon = existingClients.find(
          c => c.email.toLowerCase() === cleanEmail || normalizePhone(c.phone) === normalizePhone(cleanEmail)
        );

        if (clientInSalon) {
          setErrorMsg(`Trovata anagrafica per ${clientInSalon.name}, ma non hai ancora impostato una password. Clicca su "Registrati" per completare la creazione dell'account!`);
        } else {
          setErrorMsg('Nessun account registrato trovato con questa email. Clicca su "Registrati" qui sotto per creare un profilo.');
        }
        return;
      }

      // Verify password (supports default password123 or registered password)
      if (foundUser.password && foundUser.password !== password && password !== 'password123') {
        setErrorMsg('Password errata. Riprova o seleziona un account demo per testare.');
        return;
      }

      // Successful login
      const sessionUser = {
        ...foundUser,
        token: foundUser.token || 'jwt_sb_auth_' + Math.random().toString(36).substring(2)
      };

      localStorage.setItem('ns_logged_client_user', JSON.stringify(sessionUser));
      localStorage.setItem('client_name', sessionUser.name);
      localStorage.setItem('client_phone', sessionUser.phone);

      setSuccessMsg(`Accesso effettuato! Bentornato/a, ${sessionUser.name}.`);
      setTimeout(() => {
        onLogin(sessionUser);
      }, 500);
    }
  };

  // Quick Demo Login Helper
  const handleQuickDemoLogin = (demoAccount: ClientAuthUser) => {
    setErrorMsg(null);
    localStorage.setItem('ns_logged_client_user', JSON.stringify(demoAccount));
    localStorage.setItem('client_name', demoAccount.name);
    localStorage.setItem('client_phone', demoAccount.phone);
    setSuccessMsg(`Accesso demo come ${demoAccount.name}...`);
    setTimeout(() => {
      onLogin(demoAccount);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-fade-in space-y-5 text-slate-800 my-auto">
        
        {/* Header with Close */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isRegister ? 'Registrazione Cliente' : 'Accesso Area Riservata'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isRegister ? 'Crea il tuo profilo per gestire appuntamenti e promo.' : 'Inserisci le tue credenziali per accedere.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-xl transition ${
              !isRegister ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-xl transition ${
              isRegister ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Crea Nuovo Account
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Nome e Cognome (Solo in registrazione) */}
          {isRegister && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome e Cognome *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="es. Laura Rossi"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isRegister ? 'Indirizzo Email *' : 'Email o Numero di Cellulare *'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={isRegister ? 'email' : 'text'}
                required
                placeholder={isRegister ? 'es. laura@email.it' : 'laura@email.it o 3478889999'}
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Cellulare (Solo in registrazione) */}
          {isRegister && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">Numero Cellulare *</label>
                <span className="text-[10px] text-emerald-600 font-bold">Per conferme WhatsApp</span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  placeholder="es. +39 347 1234567"
                  value={phone}
                  onChange={e => {
                    setPhone(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">Password *</label>
              {!isRegister && (
                <span className="text-[10px] text-slate-400 font-medium">Demo: password123</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={isRegister ? 'Minimo 6 caratteri' : '••••••••'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Conferma Password (Solo in registrazione) */}
          {isRegister && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Conferma Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ripeti la password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {/* Opt-in Notifiche Push PWA */}
          {isRegister && (
            <label className="flex items-start gap-2.5 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 cursor-pointer">
              <input
                type="checkbox"
                checked={pushOptIn}
                onChange={e => setPushOptIn(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-700 leading-tight">
                <strong>Attiva Notifiche Push & Promemoria:</strong> ricevi avvisi automatici 24 ore prima dell'appuntamento ed esclusive offerte last-minute.
              </span>
            </label>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black py-3.5 rounded-2xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
          >
            <span>{isRegister ? 'Registrati e Crea Account' : 'Accedi al Profilo'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Logins Section */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Account Demo Rapidi
            </span>
            <span className="text-[10px] text-slate-400 lowercase font-normal">1-tap login</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {DEFAULT_REGISTERED_USERS.slice(0, 2).map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickDemoLogin(u)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 text-left transition"
              >
                <p className="font-bold text-slate-800 text-[11px] truncate">{u.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Switcher */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-indigo-600 font-bold hover:underline text-xs"
          >
            {isRegister 
              ? 'Hai già un account registrato? Accedi qui' 
              : 'Non hai ancora un account? Registrati gratuitamente'}
          </button>
        </div>

      </div>
    </div>
  );
}
