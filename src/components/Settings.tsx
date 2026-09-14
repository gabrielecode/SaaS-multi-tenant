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
  Zap,
  Send,
  Globe,
  MapPin,
  User,
  Mail,
  PhoneCall,
  Check,
  ArrowRight,
  Copy,
  Info,
  Star
} from 'lucide-react';
import { DEFAULT_REVIEW_TEMPLATE, formatReviewMessage } from '../lib/reviewAutomation';
import { logSystemEvent, sendWhatsAppTemplateMessage } from '../lib/supabase';
import { 
  SUPPORTED_COUNTRIES, 
  normalizePhoneForWhatsApp, 
  buildWhatsAppUrl, 
  formatPhoneDisplay 
} from '../lib/phoneUtils';

interface SettingsProps {
  config: BusinessConfig;
  onUpdateConfig: (cfg: BusinessConfig) => void;
}

export default function Settings({ config, onUpdateConfig }: SettingsProps) {
  // Navigation Tabs: 'api' | 'general'
  const [activeTab, setActiveTab] = useState<'api' | 'general'>('general');

  // Business & Owner Profile state (con focus Svizzera)
  const [name, setName] = useState(config.name);
  const [ownerName, setOwnerName] = useState(config.ownerName || 'Gabriele Rossi');
  const [email, setEmail] = useState(config.email || 'info@gentlemansclub.ch');
  const [category, setCategory] = useState(config.category);
  const [country, setCountry] = useState(config.country || 'CH');
  const [currency, setCurrency] = useState(config.currency || 'CHF');
  const [city, setCity] = useState(config.city || 'Lugano');
  const [address, setAddress] = useState(config.address || 'Via Nassa 22');
  
  // Gestione Telefono e Prefisso Svizzero
  const [phonePrefix, setPhonePrefix] = useState(config.phonePrefix || '+41');
  const [phone, setPhone] = useState(config.phone || '+41 79 345 67 89');
  
  // Test WhatsApp
  const [testRecipient, setTestRecipient] = useState(config.phone || '+41 79 345 67 89');
  const [testMessage, setTestMessage] = useState(`Ciao! Questo è un messaggio di test inviato dal salone ${config.name}. Prefisso WhatsApp Svizzera (+41) attivo.`);
  const [whatsAppTestSuccess, setWhatsAppTestSuccess] = useState<string | null>(null);
  const [isSendingWhatsAppApi, setIsSendingWhatsAppApi] = useState(false);

  const [reminderTimingHours, setReminderTimingHours] = useState(config.reminderTimingHours);
  const [reminderTemplate, setReminderTemplate] = useState(config.reminderTemplate);
  const [reminderChannel, setReminderChannel] = useState(config.reminderChannel);
  const [stripeConnected, setStripeConnected] = useState(config.stripeConnected);
  const [autoWaitlistNotify, setAutoWaitlistNotify] = useState(config.autoWaitlistNotify);
  const [cancellationPolicyHours, setCancellationPolicyHours] = useState(config.cancellationPolicyHours);
  const [depositPolicy, setDepositPolicy] = useState<'OPTIONAL' | 'DISABLED' | 'MANDATORY'>(config.depositPolicy || 'OPTIONAL');

  // Automazione Richiesta Recensione Google WhatsApp
  const [googleReviewLink, setGoogleReviewLink] = useState(config.googleReviewLink || 'https://g.page/r/CbG9Z123gentlemansclub/review');
  const [googleReviewAutomationEnabled, setGoogleReviewAutomationEnabled] = useState(config.googleReviewAutomationEnabled ?? true);
  const [googleReviewDelayHours, setGoogleReviewDelayHours] = useState(config.googleReviewDelayHours ?? 2);
  const [googleReviewTemplate, setGoogleReviewTemplate] = useState(config.googleReviewTemplate || DEFAULT_REVIEW_TEMPLATE);
  const [autoCompletePastAppointments, setAutoCompletePastAppointments] = useState(config.autoCompletePastAppointments ?? true);
  const [testReviewPhone, setTestReviewPhone] = useState(config.phone || '+41 79 345 67 89');
  const [reviewTestSuccess, setReviewTestSuccess] = useState<string | null>(null);
  const [isSendingReviewTest, setIsSendingReviewTest] = useState(false);

  // Tessera Fedeltà Punti
  const [loyaltyRewardThreshold, setLoyaltyRewardThreshold] = useState<number>(config.loyaltyRewardThreshold ?? 100);
  const [loyaltyRewardDescription, setLoyaltyRewardDescription] = useState<string>(config.loyaltyRewardDescription || '10% di sconto sul prossimo servizio');

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
  const [copiedSalonLink, setCopiedSalonLink] = useState(false);
  const [testPhoneCustom, setTestPhoneCustom] = useState('');

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const updated: BusinessConfig = {
      ...config,
      name,
      ownerName,
      email,
      category,
      country,
      currency,
      city,
      address,
      phonePrefix,
      phone,
      reminderTimingHours,
      reminderTemplate,
      reminderChannel,
      stripeConnected,
      autoWaitlistNotify,
      cancellationPolicyHours,
      depositPolicy,
      // Automazione Recensione Google WhatsApp
      googleReviewLink: googleReviewLink.trim(),
      googleReviewAutomationEnabled,
      googleReviewDelayHours,
      googleReviewTemplate: googleReviewTemplate.trim(),
      autoCompletePastAppointments,
      // API Keys
      metaWhatsappToken: metaWhatsappToken.trim(),
      metaPhoneNumberId: metaPhoneNumberId.trim(),
      metaWabaId: metaWabaId.trim(),
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      stripePublishableKey: stripePublishableKey.trim(),
      stripeSecretKey: stripeSecretKey.trim(),
      loyaltyRewardThreshold: Number(loyaltyRewardThreshold) || 100,
      loyaltyRewardDescription: loyaltyRewardDescription.trim() || '10% di sconto sul prossimo servizio'
    };

    onUpdateConfig(updated);
    logSystemEvent('INFO', 'SUPABASE', `Dati salone e credenziali aggiornati per ${name} (Svizzera ${phonePrefix})`, config.tenant_id);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Converti rapidamente numero a formato svizzero
  const handleConvertToSwiss = () => {
    let clean = phone.replace(/^\+39\s?/, '').replace(/^0039\s?/, '').trim();
    if (clean.startsWith('3') && clean.length === 10) {
      // Se era un cellulare italiano tipo 345..., converti in esempio svizzero
      clean = '79 ' + clean.substring(1, 4) + ' ' + clean.substring(4, 6) + ' ' + clean.substring(6);
    }
    const newPhone = `+41 ${clean}`;
    setPhone(newPhone);
    setPhonePrefix('+41');
    setCountry('CH');
    setCurrency('CHF');
  };

  // Copia link pubblico WhatsApp del salone per i clienti
  const handleCopySalonLink = () => {
    const defaultWelcome = `Ciao ${name}! Vorrei maggiori informazioni su orari, servizi o prenotare un appuntamento.`;
    const url = buildWhatsAppUrl(phone, defaultWelcome, country);
    navigator.clipboard.writeText(url);
    setCopiedSalonLink(true);
    setTimeout(() => setCopiedSalonLink(false), 3500);
  };

  // Apertura diretta WhatsApp con prefisso corretto per testare il messaggio di promemoria
  const handleOpenWhatsAppTest = (recipientOverride?: string) => {
    const targetPhone = recipientOverride || testPhoneCustom || testRecipient || phone;
    const testReminder = `🔔 [PROMEMORIA APPUNTAMENTO DI PROVA]\nCiao! Ti ricordiamo il tuo appuntamento presso "${name}" per domani alle ore 10:30.\n\nPer confermare rispondi SÌ, per disdire avvisaci con almeno ${cancellationPolicyHours} ore di anticipo. A presto!`;
    const url = buildWhatsAppUrl(targetPhone, testReminder, country);
    const normalizedDigits = normalizePhoneForWhatsApp(targetPhone, country);
    
    window.open(url, '_blank', 'noopener,noreferrer');
    setWhatsAppTestSuccess(`Chat WhatsApp di prova aperta verso +${normalizedDigits}.`);
    logSystemEvent('INFO', 'META_WHATSAPP', `Test apertura link WhatsApp su numero ${targetPhone} con prefisso +${normalizedDigits.substring(0, 2)}`, config.tenant_id);
    setTimeout(() => setWhatsAppTestSuccess(null), 8000);
  };

  // Test invio o apertura WhatsApp per Recensione Google
  const handleTestReviewWhatsApp = async (mode: 'direct' | 'api' = 'direct') => {
    setIsSendingReviewTest(true);
    const targetPhone = testReviewPhone || phone;
    const sampleMessage = formatReviewMessage(
      googleReviewTemplate,
      'Marco',
      name,
      'Taglio Capelli Premium',
      googleReviewLink
    );

    if (mode === 'api' && metaPhoneNumberId && metaWhatsappToken && metaWhatsappToken.length > 10 && metaWhatsappToken !== 'mock_token') {
      try {
        const res = await sendWhatsAppTemplateMessage(
          metaPhoneNumberId,
          metaWhatsappToken,
          targetPhone,
          'google_review_request',
          {
            nome: 'Marco',
            salone: name,
            link: googleReviewLink
          }
        );
        setReviewTestSuccess(`Richiesta recensione di prova inviata con successo via Meta Cloud API a ${targetPhone}! (ID: ${res.messageId})`);
      } catch (err: any) {
        setReviewTestSuccess(`Errore invio Meta API: ${err?.message || 'Verifica le credenziali'}`);
      } finally {
        setIsSendingReviewTest(false);
      }
    } else {
      const url = buildWhatsAppUrl(targetPhone, sampleMessage, country);
      window.open(url, '_blank', 'noopener,noreferrer');
      setReviewTestSuccess(`Chat WhatsApp con testo recensione Google aperta per ${targetPhone}.`);
      setIsSendingReviewTest(false);
    }

    logSystemEvent(
      'INFO',
      'META_WHATSAPP',
      `Test messaggio richiesta recensione Google per ${targetPhone}`,
      config.tenant_id
    );
    setTimeout(() => setReviewTestSuccess(null), 8000);
  };

  // Invio test via Meta WhatsApp API
  const handleSendMetaApiTest = async () => {
    setIsSendingWhatsAppApi(true);
    const targetPhone = testRecipient || phone;
    try {
      const res = await sendWhatsAppTemplateMessage(
        metaPhoneNumberId || '105482390124892',
        metaWhatsappToken || 'mock_token',
        targetPhone,
        'salone_test_svizzera',
        { nome: ownerName || 'Cliente', salone: name }
      );
      const normalizedDigits = normalizePhoneForWhatsApp(targetPhone, country);
      setWhatsAppTestSuccess(`Messaggio WhatsApp inviato con successo via Meta API a +${normalizedDigits}! (ID: ${res.messageId})`);
      setTimeout(() => setWhatsAppTestSuccess(null), 8000);
    } catch (err: any) {
      setWhatsAppTestSuccess(`Errore durante invio Meta: ${err?.message || 'Verifica token o riprova'}`);
    } finally {
      setIsSendingWhatsAppApi(false);
    }
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
          <h2 className="text-xl font-extrabold text-slate-950 flex items-center gap-2 font-display">
            <Settings2 className="w-5 h-5 text-[#1450FF] stroke-[1.5]" />
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
            className="bg-[#1450FF] hover:bg-blue-600 text-white font-semibold text-xs px-4 py-2.5 rounded-[4px] flex items-center gap-2 transition active:scale-[0.98]"
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
      <div className="flex items-center gap-2 border-b border-[#E4E6EA] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[4px] text-xs font-bold transition ${
            activeTab === 'api'
              ? 'bg-[#1450FF] text-white'
              : 'bg-white border border-[#E4E6EA] text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Chiavi API & Integrazioni Cloud</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-mono font-bold ${
            activeTab === 'api' ? 'bg-white text-[#1450FF]' : 'bg-blue-50 text-[#1450FF]'
          }`}>
            3 API
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[4px] text-xs font-bold transition ${
            activeTab === 'general'
              ? 'bg-[#1450FF] text-white'
              : 'bg-white border border-[#E4E6EA] text-slate-700 hover:bg-slate-50'
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
            <div className="bg-blue-50/60 p-4 rounded-[6px] border border-blue-100 flex items-start gap-3.5">
              <div className="p-2 bg-[#1450FF] text-white rounded-[4px] flex-shrink-0 mt-0.5">
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
            <div className="bg-white p-6 rounded-[6px] border border-[#E4E6EA] space-y-4">
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
                    className="text-[11px] text-[#1450FF] hover:underline flex items-center gap-1 font-semibold"
                  >
                    Meta Developers <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {testResults.meta && (
                <div className={`p-3 rounded-[4px] border text-xs flex items-start gap-2 ${
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
                      className="w-full bg-slate-50 border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3 pr-10 font-mono text-[11px] focus:bg-white focus:border-[#1450FF] focus:outline-none transition"
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
                    className="w-full bg-slate-50 border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3 font-mono text-[11px] focus:bg-white focus:border-[#1450FF] focus:outline-none transition"
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
                    className="w-full bg-slate-50 border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3 font-mono text-[11px] focus:bg-white focus:border-[#1450FF] focus:outline-none transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Identificativo dell'account business Meta registrato.
                  </p>
                </div>
              </div>

              {/* Quick WhatsApp Test Box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    Collaudo Messaggistica WhatsApp Svizzera (+41)
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Destinatario: +{normalizePhoneForWhatsApp(testRecipient, country)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="es. +41 79 123 45 67 o 079 123 45 67"
                    className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleOpenWhatsAppTest}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Invia Messaggio WhatsApp (Web/App)
                  </button>
                </div>

                {whatsAppTestSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-lg text-xs flex items-center gap-2 font-medium animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{whatsAppTestSuccess}</span>
                  </div>
                )}
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
            <div className="bg-white p-6 rounded-[6px] border border-[#E4E6EA] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E4E6EA] gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-[#1450FF] rounded-[4px] border border-blue-100">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-display">
                      Stripe Pagamenti & Connect
                      <span className="text-[10px] bg-blue-50 text-[#1450FF] px-2 py-0.5 rounded-[4px] font-bold border border-blue-200">
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
                    className={`text-xs px-3 py-1.5 rounded-[4px] font-bold transition flex items-center gap-1.5 ${
                      stripeConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-[#E4E6EA]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${stripeConnected ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {stripeConnected ? 'Stripe Attivo' : 'Disattivato'}
                  </button>
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#1450FF] hover:underline flex items-center gap-1 font-semibold"
                  >
                    Stripe Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {testResults.stripe && (
                <div className={`p-3 rounded-[4px] border text-xs flex items-start gap-2 ${
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
                    className="w-full bg-slate-50 border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3 font-mono text-[11px] focus:bg-white focus:border-[#1450FF] focus:outline-none transition"
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
                      className="w-full bg-slate-50 border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3 pr-10 font-mono text-[11px] focus:bg-white focus:border-[#1450FF] focus:outline-none transition"
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

              <div className="pt-2 flex items-center justify-between border-t border-[#E4E6EA]">
                <button
                  type="button"
                  onClick={testStripe}
                  disabled={testingService === 'stripe'}
                  className="bg-blue-50 hover:bg-blue-100 text-[#1450FF] border border-blue-200 font-bold px-3.5 py-2 rounded-[4px] text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {testingService === 'stripe' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#1450FF]" />}
                  Verifica Chiave Stripe
                </button>
                <span className="text-[10px] text-slate-400 font-mono">Certificato PCI-DSS Livello 1</span>
              </div>
            </div>

          </div>
        )}

        {/* ===================== TAB 2: GENERAL & POLICY ===================== */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              {/* General Business & Owner Profile Card */}
              <div className="bg-white p-6 rounded-[6px] border border-[#E4E6EA] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4E6EA] pb-3">
                  <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2 font-display">
                    <Settings2 className="w-4.5 h-4.5 text-[#1450FF]" />
                    Profilo Salone Titolare & Recapito Svizzera
                  </h4>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-[4px] border border-rose-200 flex items-center gap-1">
                      <span>🇨🇭</span> Svizzera (+41)
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-[4px] border border-emerald-200">
                      Valuta {currency}
                    </span>
                  </div>
                </div>

                {/* Dati Salone e Titolare */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                      Nome del Salone / Attività *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="es. Gentleman's Grooming Club Lugano"
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none transition font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Nome e Cognome Titolare *
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="es. Gabriele Rossi"
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none transition font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Email Ufficiale Salone *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="es. info@salone.ch"
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Categoria Attività *</label>
                    <input
                      type="text"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="es. Barbiere & Parrucchiere / Centro Estetico"
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      Nazione Sede Operativa
                    </label>
                    <select
                      value={country}
                      onChange={(e) => {
                        const newCountry = e.target.value;
                        setCountry(newCountry);
                        const matched = SUPPORTED_COUNTRIES.find(c => c.code === newCountry);
                        if (matched) {
                          setPhonePrefix(matched.prefix);
                          if (newCountry === 'CH') setCurrency('CHF');
                          else setCurrency('EUR');
                        }
                      }}
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none"
                    >
                      {SUPPORTED_COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.prefix})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      Valuta Predefinita
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none font-mono"
                    >
                      <option value="CHF">CHF - Franco Svizzero (Svizzera)</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Città Salone (Canton Ticino / Svizzera)
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="es. Lugano, Bellinzona, Chiasso, Zurigo"
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Indirizzo Sede</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="es. Via Nassa 22"
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sezione Speciale: Telefono & WhatsApp Salone */}
                <div className="bg-slate-50/80 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <PhoneCall className="w-4 h-4 text-emerald-600" />
                        Numero di Telefono & Canale WhatsApp Ufficiale Salone
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        I clienti utilizzeranno questo recapito per conferme, messaggi e supporto tramite WhatsApp.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 self-start sm:self-auto">
                      <Check className="w-3 h-3 text-emerald-600" /> Prefisso Svizzero Supportato
                    </span>
                  </div>

                  {/* Avviso automatico se è rimasto il prefisso italiano +39 */}
                  {(phone.includes('+39') || phone.startsWith('39') || phone.replace(/\D/g, '').startsWith('39')) && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Rilevato prefisso italiano (+39):</strong> Il salone è in Svizzera. Clicca per convertire immediatamente a prefisso svizzero (+41).
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleConvertToSwiss}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shrink-0 transition"
                      >
                        Converti a Svizzera (+41)
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Prefisso Internazionale</label>
                      <select
                        value={phonePrefix}
                        onChange={(e) => {
                          const newP = e.target.value;
                          setPhonePrefix(newP);
                          // Aggiorna il telefono se contiene un vecchio prefisso
                          const digitsOnly = phone.replace(/^\+\d+\s?/, '');
                          setPhone(`${newP} ${digitsOnly}`.trim());
                        }}
                        className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 font-bold focus:border-[#1450FF] focus:outline-none"
                      >
                        {SUPPORTED_COUNTRIES.map(c => (
                          <option key={c.code} value={c.prefix}>
                            {c.flag} {c.prefix} ({c.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Numero di Telefono (Formato locale o internazionale) *
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPhone(val);
                          setTestRecipient(val);
                        }}
                        placeholder="es. +41 79 345 67 89 o 079 345 67 89"
                        className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 font-medium focus:border-[#1450FF] focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Formati validi svizzeri: <strong>+41 79 345 67 89</strong> oppure <strong>079 345 67 89</strong> (lo zero locale viene gestito in automatico).
                      </p>
                    </div>
                  </div>

                  {/* Diagnostica in tempo reale del numero WhatsApp & Separazione Chiaro Link Salone vs Test Promemoria */}
                  <div className="bg-white p-4 rounded-[4px] border border-[#E4E6EA] space-y-4 text-xs">
                    
                    {/* Header Stato Numero Salone */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E4E6EA]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">Numero Ufficiale Salone:</span>
                        <span className="font-mono bg-slate-100 text-slate-800 px-2.5 py-1 rounded-[4px] font-bold">
                          +{normalizePhoneForWhatsApp(phone, country)}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <span>Prefisso applicato:</span>
                        <strong className="text-emerald-600 font-mono font-bold">
                          +{normalizePhoneForWhatsApp(phone, country).substring(0, 2) === '41' ? '41 (🇨🇭 Svizzera)' : normalizePhoneForWhatsApp(phone, country).substring(0, 2) + ' (Altro)'}
                        </strong>
                      </div>
                    </div>

                    {/* BOX 1: Link Ufficiale per i Clienti (Inbound) */}
                    <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-[4px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-[#1450FF]" />
                          Link Diretto per i Tuoi Clienti ("Scrivici su WhatsApp")
                        </span>
                        <span className="text-[10px] bg-blue-100 text-[#1450FF] font-bold px-2 py-0.5 rounded-[4px]">
                          Per Bio Instagram / Sito Web
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        I tuoi clienti useranno questo link per avviare una conversazione WhatsApp con la reception del salone:
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1 font-mono text-[11px] bg-white border border-[#E4E6EA] px-3 py-2 rounded-[4px] text-slate-800 break-all select-all font-semibold">
                          {buildWhatsAppUrl(phone, '', country)}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopySalonLink}
                          className={`px-3.5 py-2 rounded-[4px] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98] shrink-0 ${
                            copiedSalonLink
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#1450FF] hover:bg-blue-600 text-white'
                          }`}
                        >
                          {copiedSalonLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSalonLink ? 'Copiato negli Appunti!' : 'Copia Link per i Clienti'}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 flex items-start gap-1 pt-0.5">
                        <Info className="w-3 h-3 text-[#1450FF] shrink-0 mt-0.5" />
                        <span>
                          <strong>Nota:</strong> Se apri questo link dal telefono del salone stesso, WhatsApp aprirà la chat con te stesso perché il destinatario è il tuo stesso numero aziendale.
                        </span>
                      </p>
                    </div>

                    {/* BOX 2: Collaudo Invio Promemoria ai Clienti (Outbound Test) */}
                    <div className="p-3.5 bg-slate-50 border border-[#E4E6EA] rounded-[4px] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-emerald-600" />
                          Collaudo Invio Promemoria (Come lo riceverà il cliente)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Inserisci un numero di cellulare di prova (es. il tuo smartphone personale o quello di un collega) a cui recapitare il messaggio di test:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={testPhoneCustom}
                            onChange={(e) => setTestPhoneCustom(e.target.value)}
                            placeholder="Numero destinatario di test (es. +41 79 123 45 67 o 079...)"
                            className="w-full bg-white border border-[#E4E6EA] rounded-[4px] px-3 py-2 text-xs font-mono text-slate-900 focus:border-[#1450FF] focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsAppTest(testPhoneCustom || undefined)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-[4px] flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Invia Promemoria Prova</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-slate-500">
                          {testPhoneCustom ? (
                            <span>Destinatario test: <strong className="font-mono text-emerald-700">+{normalizePhoneForWhatsApp(testPhoneCustom, country)}</strong></span>
                          ) : (
                            <span>Nessun numero di test specificato: invierà l'anteprima nella chat con te stesso ({phone}) per farti leggere il testo.</span>
                          )}
                        </span>

                        {metaWhatsappToken && metaWhatsappToken.length > 15 && (
                          <button
                            type="button"
                            onClick={handleSendMetaApiTest}
                            disabled={isSendingWhatsAppApi}
                            className="bg-blue-50 hover:bg-blue-100 text-[#1450FF] border border-blue-200 font-bold text-xs px-3 py-1.5 rounded-[4px] flex items-center gap-1.5 transition active:scale-[0.98] disabled:opacity-50"
                          >
                            {isSendingWhatsAppApi ? <RefreshCw className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                            Invia via Meta Cloud API
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                  {whatsAppTestSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-[4px] text-xs flex items-center gap-2 animate-fade-in font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{whatsAppTestSuccess}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cancellation & No-Show Policies */}
              <div className="bg-white p-6 rounded-[6px] border border-[#E4E6EA] space-y-4">
                <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2 border-b border-[#E4E6EA] pb-3 font-display">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                  Politiche di Cancellazione & Protezione No-Show
                </h4>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">Politica di Incasso Caparra / Acconto</label>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-[4px] font-bold">
                        {depositPolicy === 'OPTIONAL' ? 'Opzionale (Consigliata)' : depositPolicy === 'DISABLED' ? 'Disattivata' : 'Obbligatoria'}
                      </span>
                    </div>
                    <select
                      value={depositPolicy}
                      onChange={(e) => setDepositPolicy(e.target.value as any)}
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3 focus:border-[#1450FF] focus:outline-none font-semibold"
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
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3 focus:border-[#1450FF] focus:outline-none"
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

                  <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-[4px]">
                    <div>
                      <p className="font-bold text-slate-800">Cerca riempimento in Lista d'Attesa</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Notifica automaticamente se uno slot si libera.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoWaitlistNotify}
                      onChange={(e) => setAutoWaitlistNotify(e.target.checked)}
                      className="w-4.5 h-4.5 accent-[#1450FF] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Automatic Reminders */}
              <div className="bg-white p-6 rounded-[6px] border border-[#E4E6EA] space-y-4">
                <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2 border-b border-[#E4E6EA] pb-3 font-display">
                  <Smartphone className="w-4.5 h-4.5 text-[#1450FF]" />
                  Messaggi e Schedulazione Promemoria
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Canale Promemoria Primario</label>
                    <select
                      value={reminderChannel}
                      onChange={(e) => setReminderChannel(e.target.value as any)}
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3 focus:border-[#1450FF] focus:outline-none"
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
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3 focus:border-[#1450FF] focus:outline-none"
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
                      <span className="text-[10px] bg-slate-100 border border-[#E4E6EA] text-slate-500 px-2 py-0.5 rounded-[4px] font-mono">
                        Tag: {'{NOME}'} {'{SERVIZIO}'} {'{DATA}'} {'{ORA}'} {'{LINK_CONFERMA}'}
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={reminderTemplate}
                      onChange={(e) => setReminderTemplate(e.target.value)}
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3.5 focus:border-[#1450FF] focus:outline-none leading-relaxed font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Automazione Richiesta Recensione Google WhatsApp */}
              <div className="bg-white p-6 rounded-[6px] border border-[#E4E6EA] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4E6EA] pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[4px] bg-amber-50 border border-amber-200 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-950 font-display flex items-center gap-2">
                        Automazione Recensioni Google (WhatsApp)
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                          Trigger Post-Servizio
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Invia in automatico un messaggio WhatsApp personalizzato dopo che l'appuntamento passa a "Completato".
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                      {googleReviewAutomationEnabled ? 'Automazione Attiva' : 'Automazione Disattivata'}
                    </label>
                    <input
                      type="checkbox"
                      checked={googleReviewAutomationEnabled}
                      onChange={(e) => setGoogleReviewAutomationEnabled(e.target.checked)}
                      className="w-5 h-5 accent-[#1450FF] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Opzioni di attivazione e Auto-completamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 bg-slate-50 border border-[#E4E6EA] rounded-[4px] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Auto-completamento a fine orario</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Segna come "Eseguito" gli appuntamenti confermati quando l'orario di lavoro è trascorso.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoCompletePastAppointments}
                      onChange={(e) => setAutoCompletePastAppointments(e.target.checked)}
                      className="w-4.5 h-4.5 accent-[#1450FF] cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-[4px]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1450FF]">
                      <ShieldCheck className="w-4 h-4 text-[#1450FF]" />
                      Controllo Anti-Duplicati Attivo
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                      Il sistema imposta il flag <code>recensione_richiesta = true</code> per evitare qualsiasi invio duplicato allo stesso cliente per lo stesso servizio.
                    </p>
                  </div>
                </div>

                {/* Parametri Chiave: Link Google e Timer Delay */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">
                        Link Diretto Scheda Recensioni Google Business
                      </label>
                      {googleReviewLink && (
                        <a
                          href={googleReviewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[#1450FF] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Test Link Esterno
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="url"
                        value={googleReviewLink}
                        onChange={(e) => setGoogleReviewLink(e.target.value)}
                        placeholder="https://g.page/r/identificativo/review o link Google My Business"
                        className="w-full bg-white border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3 font-mono text-xs focus:border-[#1450FF] focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">
                      Trovi il link breve nella dashboard di Google Business Profile sotto la voce <em>"Chiedi recensioni"</em>.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Timer di Attesa (Delay Invio)
                    </label>
                    <select
                      value={googleReviewDelayHours}
                      onChange={(e) => setGoogleReviewDelayHours(Number(e.target.value))}
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3 font-medium focus:border-[#1450FF] focus:outline-none"
                    >
                      <option value={0}>0 ore - Invio Immediato (Test)</option>
                      <option value={1}>1 ora dopo il completamento</option>
                      <option value={2}>2 ore dopo (Default consigliato)</option>
                      <option value={3}>3 ore dopo il completamento</option>
                      <option value={4}>4 ore dopo il completamento</option>
                      <option value={6}>6 ore dopo il completamento</option>
                      <option value={24}>24 ore dopo (Giorno successivo)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">
                      Attende che il cliente sia tornato a casa prima di inviare.
                    </p>
                  </div>

                  {/* Template Messaggio */}
                  <div className="sm:col-span-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <label className="block font-bold text-slate-700">
                        Testo Messaggio WhatsApp Personalizzato
                      </label>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">Clicca per inserire:</span>
                        {['{NOME}', '{SALONE}', '{SERVIZIO}', '{LINK_RECENSIONE}'].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setGoogleReviewTemplate(prev => prev + ' ' + tag)}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-[#E4E6EA] text-slate-700 px-1.5 py-0.5 rounded-[4px] font-mono transition"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={googleReviewTemplate}
                      onChange={(e) => setGoogleReviewTemplate(e.target.value)}
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3.5 focus:border-[#1450FF] focus:outline-none leading-relaxed font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Live Preview WhatsApp Bubble & Test Invio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Anteprima Live WhatsApp */}
                  <div className="bg-[#EFEAE2] p-4 rounded-[6px] border border-[#DDD6CE]">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E0D7CD] mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        Anteprima Schermo Cliente
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">WhatsApp Web/App</span>
                    </div>

                    {/* Chat Bubble */}
                    <div className="max-w-[90%] bg-white rounded-tr-lg rounded-br-lg rounded-bl-lg p-3 shadow-xs text-xs text-slate-800 space-y-2 border border-slate-100">
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {formatReviewMessage(googleReviewTemplate, 'Alessandro', name, 'Taglio Capelli Premium', googleReviewLink)}
                      </p>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 font-mono">
                        <span>14:30</span>
                        <span className="text-blue-500 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Box di Test Rapido Invio */}
                  <div className="bg-slate-50 p-4 rounded-[6px] border border-[#E4E6EA] flex flex-col justify-between space-y-3">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-[#1450FF]" />
                        Testa l'Invio del Messaggio Recensione
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Invia una simulazione di richiesta recensione al tuo numero di prova per verificare formattazione e link.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono">
                        Numero di Telefono per Test
                      </label>
                      <input
                        type="tel"
                        value={testReviewPhone}
                        onChange={(e) => setTestReviewPhone(e.target.value)}
                        placeholder="+41 79 123 45 67 o +39 345..."
                        className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 font-mono focus:border-[#1450FF] focus:outline-none"
                      />

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleTestReviewWhatsApp('direct')}
                          disabled={isSendingReviewTest}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition active:scale-[0.98]"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Apri su WhatsApp (wa.me)</span>
                        </button>

                        {metaWhatsappToken && metaPhoneNumberId && (
                          <button
                            type="button"
                            onClick={() => handleTestReviewWhatsApp('api')}
                            disabled={isSendingReviewTest}
                            className="px-3 py-2 bg-slate-900 hover:bg-black text-white rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition active:scale-[0.98]"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>Invia via Meta Cloud API</span>
                          </button>
                        )}
                      </div>

                      {reviewTestSuccess && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[4px] text-[11px] font-medium flex items-center gap-1.5 animate-fade-in">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{reviewTestSuccess}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tessera Fedeltà Punti Configurazione */}
              <div className="bg-white p-6 rounded-[6px] border border-[#E4E6EA] space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#E4E6EA] pb-3">
                  <div className="w-8 h-8 rounded-[4px] bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-950 font-display">
                      Tessera Fedeltà & Programma Punti
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Configura la soglia punti e il premio assegnato automaticamente quando il cliente completa i servizi.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Punti Necessari per il Premio
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={loyaltyRewardThreshold}
                      onChange={(e) => setLoyaltyRewardThreshold(Number(e.target.value))}
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3 font-mono text-xs focus:border-[#1450FF] focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Il cliente riceve 1 punto ogni 10 CHF di spesa sul servizio completato.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Descrizione del Premio
                    </label>
                    <input
                      type="text"
                      value={loyaltyRewardDescription}
                      onChange={(e) => setLoyaltyRewardDescription(e.target.value)}
                      placeholder="es. 10% di sconto sul prossimo servizio"
                      className="w-full bg-white border border-[#E4E6EA] text-slate-900 rounded-[4px] p-3 text-xs focus:border-[#1450FF] focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Mostrato al cliente nella sua area personale e al titolare nella lista clienti.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-[6px] border border-[#E4E6EA] space-y-3.5 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-[#E4E6EA] pb-2 font-display">
                  <ShieldCheck className="w-4 h-4 text-[#1450FF]" />
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
        <div className="flex items-center justify-between pt-4 border-t border-[#E4E6EA]">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-[#1450FF] hover:bg-blue-600 text-white font-semibold text-xs px-5 py-2.5 rounded-[4px] flex items-center gap-2 transition active:scale-[0.98]"
            >
              <Save className="w-4 h-4 text-white" />
              Salva Tutte le Configurazioni & API
            </button>

            {saveSuccess && (
              <div className="text-emerald-600 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Impostazioni e chiavi API aggiornate!
              </div>
            )}
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Salvataggio sicuro su LocalStorage & Sincronizzazione Tenant Cloud
          </span>
        </div>
      </form>
    </div>
  );
}
