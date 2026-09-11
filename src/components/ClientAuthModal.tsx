import React, { useState } from 'react';
import { ClientAuthUser } from '../types';
import { Lock, Mail, User, Phone } from 'lucide-react';

interface ClientAuthModalProps {
  onLogin: (user: ClientAuthUser) => void;
  onClose: () => void;
}

export default function ClientAuthModal({ onLogin, onClose }: ClientAuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pushOptIn, setPushOptIn] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mockUser: ClientAuthUser = {
      id: 'client_auth_' + Date.now(),
      name: name || 'Mario Rossi',
      email: email || 'mario.rossi@email.it',
      phone: phone || '+39 333 999 8888',
      pushSubscribed: pushOptIn,
      token: 'sb_jwt_token_' + Math.random().toString(36).substring(7)
    };
    onLogin(mockUser);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fade-in space-y-6 text-slate-800">
        
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-indigo-100">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">
            {isRegister ? 'Registrazione Cliente PWA' : 'Accesso Area Clienti Supabase'}
          </h3>
          <p className="text-xs text-slate-500">
            {isRegister ? 'Crea il tuo account per gestire prenotazioni e ricevere notifiche push.' : 'Accedi per confermare appuntamenti e visualizzare lo storico.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome e Cognome *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="es. Mario Rossi"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Indirizzo Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                placeholder="nome@email.it"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Numero Cellulare (per WhatsApp / SMS) *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="tel"
                  required
                  placeholder="+39 333 1234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {isRegister && (
            <label className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={pushOptIn}
                onChange={e => setPushOptIn(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-600 leading-tight">
                Abilita Notifiche Push PWA per promemoria appuntamenti e offerte last-minute.
              </span>
            </label>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-md transition"
          >
            {isRegister ? 'Registrati con Supabase Auth →' : 'Accedi al Portale →'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-indigo-600 font-semibold hover:underline text-xs"
          >
            {isRegister ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs font-medium"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
}
