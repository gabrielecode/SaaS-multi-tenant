import { useState, FormEvent } from 'react';
import { BusinessConfig } from '../types';
import { Save, Settings2, BellRing, Smartphone, ShieldCheck, CheckCircle, CreditCard, Sparkles } from 'lucide-react';

interface SettingsProps {
  config: BusinessConfig;
  onUpdateConfig: (cfg: BusinessConfig) => void;
}

export default function Settings({ config, onUpdateConfig }: SettingsProps) {
  const [name, setName] = useState(config.name);
  const [category, setCategory] = useState(config.category);
  const [phone, setPhone] = useState(config.phone);
  const [reminderTimingHours, setReminderTimingHours] = useState(config.reminderTimingHours);
  const [reminderTemplate, setReminderTemplate] = useState(config.reminderTemplate);
  const [reminderChannel, setReminderChannel] = useState(config.reminderChannel);
  const [stripeConnected, setStripeConnected] = useState(config.stripeConnected);
  const [autoWaitlistNotify, setAutoWaitlistNotify] = useState(config.autoWaitlistNotify);
  const [cancellationPolicyHours, setCancellationPolicyHours] = useState(config.cancellationPolicyHours);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      name,
      category,
      phone,
      reminderTimingHours,
      reminderTemplate,
      reminderChannel,
      stripeConnected,
      autoWaitlistNotify,
      cancellationPolicyHours
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-600 stroke-[1.5]" />
          Impostazioni & Policy
        </h2>
        <p className="text-xs text-slate-500 mt-1">Gestisci le informazioni del tuo business, i testi dei promemoria e collega i canali di pagamento.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* General & Policy settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Business Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings2 className="w-4.5 h-4.5 text-slate-400" />
              Profilo Business
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome del Salone / Attività</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefono per Assistenza Clienti</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Cancellation & No-Show Policies */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
              Politiche di Cancellazione & Protezione No-Show
            </h4>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Termine di Cancellazione Gratuita (Ore)</label>
                <select
                  value={cancellationPolicyHours}
                  onChange={(e) => setCancellationPolicyHours(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                >
                  <option value={12}>12 ore prima dell'appuntamento</option>
                  <option value={24}>24 ore prima dell'appuntamento (Consigliato)</option>
                  <option value={48}>48 ore prima dell'appuntamento</option>
                  <option value={72}>72 ore prima dell'appuntamento</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  Oltre questo limite, se il cliente disdice o fa no-show, le caparre pagate online verranno trattenute automaticamente come penale.
                </p>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-150 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">Cerca riempimento in Lista d'Attesa</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Notifica automaticamente se uno slot si libera.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoWaitlistNotify}
                  onChange={(e) => setAutoWaitlistNotify(e.target.checked)}
                  className="w-4.5 h-4.5 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Automatic Reminders */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Smartphone className="w-4.5 h-4.5 text-indigo-600" />
              Messaggi e Schedulazione Promemoria
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Canale Promemoria Primario</label>
                <select
                  value={reminderChannel}
                  onChange={(e) => setReminderChannel(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                >
                  <option value="SMS">SMS automatico ad alta priorità</option>
                  <option value="WHATSAPP">WhatsApp Business</option>
                  <option value="EMAIL">Email Professionale</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Preavviso Promemoria (Ore)</label>
                <select
                  value={reminderTimingHours}
                  onChange={(e) => setReminderTimingHours(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                >
                  <option value={12}>12 ore prima</option>
                  <option value={24}>24 ore prima (Ottimale)</option>
                  <option value={36}>36 ore prima</option>
                  <option value={48}>48 ore prima</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Template Promemoria</label>
                  <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-mono">
                    Usa tag: {'{NOME}'} {'{SERVIZIO}'} {'{DATA}'} {'{ORA}'} {'{LINK_CONFERMA}'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={reminderTemplate}
                  onChange={(e) => setReminderTemplate(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg p-3.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 leading-relaxed font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-3 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] flex items-center gap-2 transition-all duration-200"
            >
              <Save className="w-4 h-4 text-white" />
              Salva Configurazione
            </button>

            {saveSuccess && (
              <div className="text-emerald-600 font-bold text-xs flex items-center gap-1.5 animate-bounce">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Impostazioni aggiornate!
              </div>
            )}
          </div>

        </div>        {/* Payment Integrations Sidebar */}
        <div className="space-y-6">
          <div className="glass-card text-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4.5 h-4.5 text-emerald-600" />
              Connessione Stripe Connect
            </h4>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              NoShow Reducer si collega a Stripe per incassare in modo sicuro i depositi dai clienti al momento della prenotazione. I fondi vengono depositati direttamente sul tuo conto corrente.
            </p>

            {stripeConnected ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Stripe Connesso</p>
                    <p className="text-[10px] text-slate-500 font-semibold">ID account: acct_18m9gLd2...</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStripeConnected(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-3 rounded-lg border border-slate-200 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  Disconnetti Account Stripe
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-700">
                  <Smartphone className="w-5 h-5 flex-shrink-0 animate-pulse" />
                  <div>
                    <p className="font-bold">Pagamenti Disattivati</p>
                    <p className="text-[10px] text-slate-500 font-semibold">Connetti Stripe per iniziare ad esigene acconti online.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStripeConnected(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  Connetti Stripe Connect
                </button>
              </div>
            )}
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 text-xs text-slate-500 leading-relaxed">
            <h5 className="font-bold text-slate-800">Conformità GDPR e Sicurezza</h5>
            <p>
              Tutti i dati sensibili delle carte di credito vengono inseriti direttamente sulle schermate protette di Stripe. NoShow Reducer non memorizza, legge o trasferisce mai le credenziali finanziarie degli utenti.
            </p>
            <p>
              Assicurati di inserire il testo informativo corretto nelle note del servizio o nei termini e condizioni del tuo sito per spiegare le trattenute in caso di no-show.
            </p>
          </div>
        </div>

      </form>
    </div>
  );
}
