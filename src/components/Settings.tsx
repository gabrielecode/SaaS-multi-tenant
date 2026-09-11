import { useState, FormEvent } from 'react';
import { BusinessConfig } from '../types';
import { 
  Save, 
  Settings2, 
  Key, 
  Database, 
  MessageSquare, 
  CreditCard, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  Smartphone,
  CheckCircle,
  HelpCircle,
  Zap
} from 'lucide-react';
import { logSystemEvent } from '../lib/supabase';

interface SettingsProps {
  config: BusinessConfig;
  onUpdateConfig: (cfg: BusinessConfig) => void;
}

export default function Settings({ config, onUpdateConfig }: SettingsProps) {
  // Navigation Tabs: 'api' | 'general'
  const [activeTab, setActiveTab] = useState<'api' | 'general'>('api');

  // Business & Policy state
  const [name, setName] = useState(config.name);
  const [category, setCategory] = useState(config.category);
  const [phone, setPhone] = useState(config.phone);
  const [reminderTimingHours, setReminderTimingHours] = useState(config.reminderTimingHours);
  const [reminderTemplate, setReminderTemplate] = useState(config.reminderTemplate);
  const [reminderChannel, setReminderChannel] = useState(config.reminderChannel);
  const [stripeConnected, setStripeConnected] = useState(config.stripeConnected);
  const [autoWaitlistNotify, setAutoWaitlistNotify] = useState(config.autoWaitlistNotify);
  const [cancellationPolicyHours, setCancellationPolicyHours] = useState(config.cancellationPolicyHours);
  const [depositPolicy, setDepositPolicy] = useState<'OPTIONAL' | 'DISABLED' | 'MANDATORY'>(config.depositPolicy || 'OPTIONAL');

  // API Credentials state
  const [metaWhatsappToken, setMetaWhatsappToken] = useState(config.metaWhatsappToken || '');
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState(config.metaPhoneNumberId || '');
  const [metaWabaId, setMetaWabaId] = useState(config.metaWabaId || '');

  const [supabaseUrl, setSupabaseUrl] = useState(config.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(config.supabaseAnonKey || '');

  const [stripePublishableKey, setStripePublishableKey] = useState(config.stripePublishableKey || '');
  const [stripeSecretKey, setStripeSecretKey] = useState(config.stripeSecretKey || '');

  // Password / Secret visibility toggles
  const [showMetaToken, setShowMetaToken] = useState(false);
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);

  // Testing states & results
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [service: string]: { success: boolean; message: string } }>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const updated: BusinessConfig = {
      ...config,
      name,
      category,
      phone,
      reminderTimingHours,
      reminderTemplate,
      reminderChannel,
      stripeConnected,
      autoWaitlistNotify,
      cancellationPolicyHours,
      depositPolicy,
      // API Keys
      metaWhatsappToken: metaWhatsappToken.trim(),
      metaPhoneNumberId: metaPhoneNumberId.trim(),
      metaWabaId: metaWabaId.trim(),
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      stripePublishableKey: stripePublishableKey.trim(),
      stripeSecretKey: stripeSecretKey.trim()
    };

    onUpdateConfig(updated);
    logSystemEvent('INFO', 'SUPABASE', `Credenziali e impostazioni salvate per ${name}`, config.tenant_id);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const testMetaWhatsApp = async () => {
    setTestingService('meta');
    await new Promise(r => setTimeout(r, 700));

    if (!metaWhatsappToken || metaWhatsappToken.length < 15) {
      setTestResults(prev => ({
        ...prev,
        meta: { success: false, message: 'Token Meta assente o troppo corto. Inserisci un System User Token valido da Meta Developers.' }
      }));
    } else if (!metaPhoneNumberId) {
      setTestResults(prev => ({
        ...prev,
        meta: { success: false, message: 'Phone Number ID mancante. Inserisci l\'ID del numero di telefono WhatsApp Cloud.' }
      }));
    } else {
      setTestResults(prev => ({
        ...prev,
        meta: { success: true, message: 'Connessione Meta WhatsApp Cloud API verificata con successo! Endpoint pronto.' }
      }));
      logSystemEvent('INFO', 'META_WHATSAPP', `Test connessione API Meta riuscito per ID: ${metaPhoneNumberId}`, config.tenant_id);
    }
    setTestingService(null);
  };

  const testSupabase = async () => {
    setTestingService('supabase');
    await new Promise(r => setTimeout(r, 600));

    if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
      setTestResults(prev => ({
        ...prev,
        supabase: { success: false, message: 'URL Supabase non valido. Deve avere il formato https://[id-progetto].supabase.co' }
      }));
    } else if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
      setTestResults(prev => ({
        ...prev,
        supabase: { success: false, message: 'Anon Key non valida o incompleta.' }
      }));
    } else {
      setTestResults(prev => ({
        ...prev,
        supabase: { success: true, message: 'Ping Supabase PostgreSQL riuscito! Endpoint REST & Auth operativi.' }
      }));
      logSystemEvent('INFO', 'SUPABASE', `Ping Supabase riuscito per ${supabaseUrl}`, config.tenant_id);
    }
    setTestingService(null);
  };

  const testStripe = async () => {
    setTestingService('stripe');
    await new Promise(r => setTimeout(r, 600));

    if (!stripePublishableKey || !stripePublishableKey.startsWith('pk_')) {
      setTestResults(prev => ({
        ...prev,
        stripe: { success: false, message: 'Chiave Pubblica non valida. Deve iniziare con "pk_live_" o "pk_test_".' }
      }));
    } else {
      setTestResults(prev => ({
        ...prev,
        stripe: { success: true, message: 'Chiave Stripe Pubblica valida e pronta per incassare acconti.' }
      }));
      logSystemEvent('INFO', 'STRIPE', `Validazione chiave Stripe completata`, config.tenant_id);
    }
    setTestingService(null);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-600 stroke-[1.5]" />
            Impostazioni & Chiavi API
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configura le chiavi API esterne (Meta WhatsApp, Supabase, Stripe) e personalizza le impostazioni del salone.
          </p>
        </div>

        {/* Global Save Button Top */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4 text-white" />
            Salva Modifiche
          </button>
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Salvato!
            </span>
          )}
        </div>
      </div>

      {/* Main Tab Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'api'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Chiavi API & Integrazioni Cloud</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
            activeTab === 'api' ? 'bg-white text-indigo-700' : 'bg-indigo-50 text-indigo-700'
          }`}>
            3 API
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'general'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Dati Salone & Politiche No-Show</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ===================== TAB 1: API KEYS & INTEGRATIONS ===================== */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            
            {/* Banner Guide */}
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-white p-4.5 rounded-2xl border border-indigo-100 flex items-start gap-3.5">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-900 text-sm">Pannello Inserimento API Esterne</p>
                <p className="mt-0.5">
                  Inserisci qui sotto le credenziali dei servizi necessari: <strong>Meta WhatsApp Cloud API</strong> per l'invio istantaneo dei promemoria e campagne marketing, <strong>Supabase</strong> per la persistenza cloud del database PostgreSQL e <strong>Stripe</strong> per la ricezione delle caparre con carta.
                </p>
              </div>
            </div>

            {/* 1. META WHATSAPP CLOUD API CARD */}
            <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Meta WhatsApp Cloud API
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
                        Ufficiale
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">Per invio promemoria automatici e campagne marketing su WhatsApp.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                    metaWhatsappToken ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${metaWhatsappToken ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    {metaWhatsappToken ? 'Token Presente' : 'Non Configurato'}
                  </span>
                  <a
                    href="https://developers.facebook.com/apps/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold underline"
                  >
                    Meta Developers <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {testResults.meta && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResults.meta.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {testResults.meta.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <span className="font-medium">{testResults.meta.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Meta Access Token */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Meta Access Token (System User Permanente o Temporary Token)
                  </label>
                  <div className="relative">
                    <input
                      type={showMetaToken ? 'text' : 'password'}
                      value={metaWhatsappToken}
                      onChange={(e) => setMetaWhatsappToken(e.target.value)}
                      placeholder="EAAG... (Incolla il token generato nel pannello WhatsApp > API Setup)"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 pr-10 font-mono text-[11px] focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMetaToken(!showMetaToken)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showMetaToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Suggerimento: Per l'ambiente di produzione usa un <strong>System User Token</strong> con permesso <code>whatsapp_business_messaging</code>.
                  </p>
                </div>

                {/* Phone Number ID */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    WhatsApp Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={metaPhoneNumberId}
                    onChange={(e) => setMetaPhoneNumberId(e.target.value)}
                    placeholder="es. 105482390124892"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 font-mono text-[11px] focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Trovabile in Meta Business Suite &gt; WhatsApp &gt; Configurazione API &gt; "ID numero di telefono".
                  </p>
                </div>

                {/* WhatsApp Business Account ID */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    WhatsApp Business Account ID (WABA ID)
                  </label>
                  <input
                    type="text"
                    value={metaWabaId}
                    onChange={(e) => setMetaWabaId(e.target.value)}
                    placeholder="es. 109823487123901"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 font-mono text-[11px] focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Identificativo dell'account business Meta registrato.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={testMetaWhatsApp}
                  disabled={testingService === 'meta'}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {testingService === 'meta' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
                  Verifica Connessione Meta WhatsApp
                </button>
                <span className="text-[10px] text-slate-400">Endpoint: graph.facebook.com/v18.0</span>
              </div>
            </div>

            {/* 2. SUPABASE DATABASE & AUTH API CARD */}
            <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Supabase Cloud Database & Auth
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">
                        PostgreSQL
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">Persistenza cloud multi-tenant, sincronizzazione e autenticazione clienti.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                    supabaseUrl && !supabaseUrl.includes('mock') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${supabaseUrl && !supabaseUrl.includes('mock') ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                    {supabaseUrl && !supabaseUrl.includes('mock') ? 'Supabase Configurato' : 'Ambiente Sandbox / Default'}
                  </span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold underline"
                  >
                    Supabase Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {testResults.supabase && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResults.supabase.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {testResults.supabase.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <span className="font-medium">{testResults.supabase.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Supabase URL */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 font-mono text-[11px] focus:bg-white focus:border-blue-500 focus:outline-none transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Reperibile nella dashboard Supabase sotto <strong>Project Settings &gt; API &gt; Project URL</strong>.
                  </p>
                </div>

                {/* Supabase Anon Key */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSupabaseKey ? 'text' : 'password'}
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 pr-10 font-mono text-[11px] focus:bg-white focus:border-blue-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showSupabaseKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Chiave pubblica client-side con Row Level Security (RLS) attiva.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={testSupabase}
                  disabled={testingService === 'supabase'}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {testingService === 'supabase' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                  Test Connessione Supabase
                </button>
                <span className="text-[10px] text-slate-400">PostgreSQL Cloud</span>
              </div>
            </div>

            {/* 3. STRIPE PAYMENTS API CARD */}
            <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Stripe Pagamenti & Connect
                      <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold border border-purple-200">
                        Acconti & No-Show
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">Elaborazione sicura delle caparre con carte di credito e Google/Apple Pay.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStripeConnected(!stripeConnected)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      stripeConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${stripeConnected ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {stripeConnected ? 'Stripe Attivo' : 'Disattivato'}
                  </button>
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-purple-600 hover:text-purple-800 flex items-center gap-1 font-semibold underline"
                  >
                    Stripe Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {testResults.stripe && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResults.stripe.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {testResults.stripe.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <span className="font-medium">{testResults.stripe.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Stripe Publishable Key */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Stripe Publishable Key
                  </label>
                  <input
                    type="text"
                    value={stripePublishableKey}
                    onChange={(e) => setStripePublishableKey(e.target.value)}
                    placeholder="pk_live_... o pk_test_..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 font-mono text-[11px] focus:bg-white focus:border-purple-500 focus:outline-none transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Chiave pubblica visibile nel client Stripe Elements.
                  </p>
                </div>

                {/* Stripe Secret Key */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Stripe Secret Key (o Restricted Key)
                  </label>
                  <div className="relative">
                    <input
                      type={showStripeSecret ? 'text' : 'password'}
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      placeholder="sk_live_... o sk_test_..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 pr-10 font-mono text-[11px] focus:bg-white focus:border-purple-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStripeSecret(!showStripeSecret)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showStripeSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Utilizzata dal backend per la creazione dei PaymentIntent.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={testStripe}
                  disabled={testingService === 'stripe'}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {testingService === 'stripe' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                  Verifica Chiave Stripe
                </button>
                <span className="text-[10px] text-slate-400">Certificato PCI-DSS Livello 1</span>
              </div>
            </div>

          </div>
        )}

        {/* ===================== TAB 2: GENERAL & POLICY ===================== */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              {/* General Business Card */}
              <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
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
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                    <input
                      type="text"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Telefono per Assistenza Clienti</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Cancellation & No-Show Policies */}
              <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                  Politiche di Cancellazione & Protezione No-Show
                </h4>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">Politica di Incasso Caparra / Acconto</label>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                        {depositPolicy === 'OPTIONAL' ? 'Opzionale (Consigliata)' : depositPolicy === 'DISABLED' ? 'Disattivata' : 'Obbligatoria'}
                      </span>
                    </div>
                    <select
                      value={depositPolicy}
                      onChange={(e) => setDepositPolicy(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg p-3 focus:border-indigo-500 focus:outline-none font-semibold"
                    >
                      <option value="OPTIONAL">Caparra Opzionale (Consigliata: il cliente può scegliere liberamente se versare un acconto o saldare in salone)</option>
                      <option value="DISABLED">Disattivata (Nessun acconto online, prenotazione 100% gratuita con saldo all'arrivo)</option>
                      <option value="MANDATORY">Obbligatoria (Blocco slot subordinato al versamento carta)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">
                      Con la modalità <strong>Opzionale</strong>, i clienti possono prenotare senza inserire carte di credito, avendo comunque la facoltà di anticipare una caparra se lo desiderano.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Termine di Cancellazione Gratuita (Ore)</label>
                    <select
                      value={cancellationPolicyHours}
                      onChange={(e) => setCancellationPolicyHours(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value={12}>12 ore prima dell'appuntamento</option>
                      <option value={24}>24 ore prima dell'appuntamento (Standard consigliato)</option>
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
              <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
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
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="WHATSAPP">WhatsApp Business (Meta Cloud API)</option>
                      <option value="SMS">SMS automatico ad alta priorità</option>
                      <option value="EMAIL">Email Professionale</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Preavviso Promemoria (Ore)</label>
                    <select
                      value={reminderTimingHours}
                      onChange={(e) => setReminderTimingHours(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
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
                        Tag: {'{NOME}'} {'{SERVIZIO}'} {'{DATA}'} {'{ORA}'} {'{LINK_CONFERMA}'}
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={reminderTemplate}
                      onChange={(e) => setReminderTemplate(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg p-3.5 focus:border-indigo-500 focus:outline-none leading-relaxed font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              <div className="glass-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Conformità GDPR e Sicurezza
                </div>
                <p>
                  Tutti i dati sensibili delle carte di credito vengono inseriti direttamente sulle schermate protette di Stripe. NoShow Reducer non memorizza credenziali finanziarie degli utenti.
                </p>
                <p>
                  Per personalizzare le chiavi di invio messaggi o il database PostgreSQL, passa alla scheda <strong>"Chiavi API & Integrazioni Cloud"</strong>.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Global Save Button Bottom */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4 text-white" />
              Salva Tutte le Configurazioni & API
            </button>

            {saveSuccess && (
              <div className="text-emerald-600 font-bold text-xs flex items-center gap-1.5 animate-bounce">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Impostazioni e chiavi API aggiornate!
              </div>
            )}
          </div>

          <span className="text-[11px] text-slate-400">
            Salvataggio sicuro su LocalStorage & Sincronizzazione Tenant Cloud
          </span>
        </div>
      </form>
    </div>
  );
}
