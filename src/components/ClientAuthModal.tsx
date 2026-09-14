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
      <div className="bg-white rounded-[6px] max-w-md w-full p-6 border border-[#E4E6EA] animate-fade-in space-y-5 text-slate-800 my-auto">
        
        {/* Header with Close */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-[#1450FF] rounded-[4px] flex items-center justify-center border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                {isRegister ? 'Registrazione Cliente' : 'Accesso Area Riservata'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isRegister ? 'Crea il tuo profilo per gestire appuntamenti e promo.' : 'Inserisci le tue credenziali per accedere.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-[4px] hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-[4px] border border-[#E4E6EA] text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-[4px] transition ${
              !isRegister ? 'bg-white text-[#1450FF] border border-[#E4E6EA]' : 'text-slate-600 hover:text-slate-900'
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
            className={`py-2 rounded-[4px] transition ${
              isRegister ? 'bg-white text-[#1450FF] border border-[#E4E6EA]' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Crea Nuovo Account
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[4px] flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-[4px] flex items-center gap-2.5">
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
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="es. Laura Rossi"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-white border border-[#E4E6EA] rounded-[4px] py-2.5 pl-10 pr-3.5 text-slate-900 font-medium focus:outline-none focus:border-[#1450FF] transition"
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
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={isRegister ? 'email' : 'text'}
                required
                placeholder={isRegister ? 'es. laura@email.it' : 'laura@email.it o 3478889999'}
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-white border border-[#E4E6EA] rounded-[4px] py-2.5 pl-10 pr-3.5 text-slate-900 font-medium focus:outline-none focus:border-[#1450FF] transition"
              />
            </div>
          </div>

          {/* Cellulare (Solo in registrazione) */}
          {isRegister && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">Numero Cellulare *</label>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">Per conferme WhatsApp</span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="es. +41 79 123 45 67"
                  value={phone}
                  onChange={e => {
                    setPhone(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-white border border-[#E4E6EA] rounded-[4px] py-2.5 pl-10 pr-3.5 text-slate-900 font-medium focus:outline-none focus:border-[#1450FF] font-mono transition"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">Password *</label>
              {!isRegister && (
                <span className="text-[10px] text-slate-400 font-mono">Demo: password123</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={isRegister ? 'Minimo 6 caratteri' : '••••••••'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-white border border-[#E4E6EA] rounded-[4px] py-2.5 pl-10 pr-10 text-slate-900 font-medium focus:outline-none focus:border-[#1450FF] font-mono transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
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
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ripeti la password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-white border border-[#E4E6EA] rounded-[4px] py-2.5 pl-10 pr-3.5 text-slate-900 font-medium focus:outline-none focus:border-[#1450FF] font-mono transition"
                />
              </div>
            </div>
          )}

          {/* Opt-in Notifiche Push PWA */}
          {isRegister && (
            <label className="flex items-start gap-2.5 p-3 bg-blue-50/60 rounded-[4px] border border-blue-150 cursor-pointer">
              <input
                type="checkbox"
                checked={pushOptIn}
                onChange={e => setPushOptIn(e.target.checked)}
                className="mt-0.5 rounded-[3px] text-[#1450FF] focus:ring-[#1450FF]"
              />
              <span className="text-[11px] text-slate-700 leading-tight">
                <strong>Attiva Notifiche Push & Promemoria:</strong> ricevi avvisi automatici 24 ore prima dell'appuntamento ed esclusive offerte last-minute.
              </span>
            </label>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#1450FF] hover:bg-blue-600 active:scale-[0.98] text-white font-bold py-3 rounded-[4px] transition flex items-center justify-center gap-2"
          >
            <span>{isRegister ? 'Registrati e Crea Account' : 'Accedi al Profilo'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Logins Section */}
        <div className="pt-3 border-t border-[#E4E6EA] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider font-mono">
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
                className="p-2 rounded-[4px] bg-white hover:bg-blue-50/60 border border-[#E4E6EA] text-left transition"
              >
                <p className="font-bold text-slate-800 text-[11px] truncate">{u.name}</p>
                <p className="text-[10px] text-slate-400 truncate font-mono">{u.email}</p>
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
            className="text-[#1450FF] font-bold hover:underline text-xs"
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
