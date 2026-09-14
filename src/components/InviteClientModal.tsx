import { useState, useMemo, useEffect } from 'react';
import { Client, BusinessConfig } from '../types';
import { 
  X, 
  Send, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  User, 
  Phone, 
  QrCode, 
  Globe, 
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Users
} from 'lucide-react';
import { 
  SUPPORTED_COUNTRIES, 
  normalizePhoneForWhatsApp, 
  buildWhatsAppUrl, 
  buildSmsUrl, 
  buildMailtoUrl, 
  formatPhoneDisplay 
} from '../lib/phoneUtils';
import { logSystemEvent } from '../lib/supabase';

interface InviteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  config: BusinessConfig | null;
  preselectedClient?: Client | null;
  onSuccessToast?: (msg: string) => void;
}

export default function InviteClientModal({
  isOpen,
  onClose,
  clients,
  config,
  preselectedClient,
  onSuccessToast
}: InviteClientModalProps) {
  // Canale selezionato: 'whatsapp' | 'email' | 'sms' | 'link'
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'email' | 'sms' | 'link'>('whatsapp');

  // Modalità destinatario: 'existing' | 'new'
  const [recipientType, setRecipientType] = useState<'existing' | 'new'>(preselectedClient ? 'existing' : 'new');
  const [selectedClientId, setSelectedClientId] = useState<string>(preselectedClient?.id || '');

  // Campi destinatario
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phonePrefix, setPhonePrefix] = useState(config?.phonePrefix || '+41');
  const [country, setCountry] = useState(config?.country || 'CH');
  const [email, setEmail] = useState('');

  // Personalizzazione testo messaggio
  const [customWaText, setCustomWaText] = useState('');
  const [customSmsText, setCustomSmsText] = useState('');
  const [customEmailSubject, setCustomEmailSubject] = useState('');
  const [customEmailBody, setCustomEmailBody] = useState('');

  // Stati feedback copia
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const salonName = config?.name || "Il Nostro Salone";

  // Calcolo URL base dell'app per invito
  const appBaseUrl = useMemo(() => {
    try {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      return `${origin}${pathname}?role=client&ref=invite`;
    } catch {
      return 'https://app-salone.ch?role=client&ref=invite';
    }
  }, []);

  // Aggiorna campi se cambia il cliente preselezionato o selezionato
  useEffect(() => {
    if (preselectedClient) {
      setRecipientType('existing');
      setSelectedClientId(preselectedClient.id);
      setName(preselectedClient.name);
      setPhone(preselectedClient.phone);
      setEmail(preselectedClient.email || '');
    } else if (recipientType === 'existing' && selectedClientId) {
      const found = clients.find(c => c.id === selectedClientId);
      if (found) {
        setName(found.name);
        setPhone(found.phone);
        setEmail(found.email || '');
      }
    }
  }, [preselectedClient, selectedClientId, recipientType, clients]);

  // Generazione dei testi predefiniti
  const clientFirstName = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return 'Gentile Cliente';
    return trimmed.split(' ')[0];
  }, [name]);

  const defaultWaMessage = useMemo(() => {
    return `Ciao ${clientFirstName}! 👋\n\nTi invitiamo a provare la nuova Web App ufficiale di *${salonName}*!\n\n✨ Da oggi puoi:\n• Prenotare i tuoi trattamenti 24/7 in 30 secondi\n• Ricevere promemoria e conferme istantanee\n• Accedere a promozioni esclusive dedicate a te\n\n👉 Clicca qui per registrarti o accedere subito:\n${appBaseUrl}\n\nA presto in salone! 💈✂️`;
  }, [clientFirstName, salonName, appBaseUrl]);

  const defaultSmsMessage = useMemo(() => {
    return `Ciao ${clientFirstName}! Da oggi prenota online 24/7 e scopri le promozioni su ${salonName}. Registrati subito con un tap: ${appBaseUrl}`;
  }, [clientFirstName, salonName, appBaseUrl]);

  const defaultEmailSubject = useMemo(() => {
    return `Invito speciale da ${salonName}: Registrati alla nostra nuova Web App`;
  }, [salonName]);

  const defaultEmailBody = useMemo(() => {
    return `Gentile ${name || 'Cliente'},\n\nSiamo felici di presentarti la nuova Web App ufficiale di ${salonName}!\n\nAbbiamo creato questo portale per offrirti un'esperienza ancora più comoda e veloce:\n- Prenotazioni online aperte 24 ore su 24, 7 giorni su 7\n- Scelta orari e collaboratore preferito in tempo reale\n- Promemoria intelligenti via WhatsApp ed Email\n- Vantaggi e promozioni dedicate ai clienti registrati\n\nPuoi registrarti e prenotare subito dal tuo smartphone o computer cliccando sul seguente link:\n${appBaseUrl}\n\nCordiali saluti,\nLo staff di ${salonName}`;
  }, [name, salonName, appBaseUrl]);

  // Sincronizza i testi se non sono stati modificati manualmente
  useEffect(() => {
    if (!customWaText) setCustomWaText(defaultWaMessage);
  }, [defaultWaMessage]);

  useEffect(() => {
    if (!customSmsText) setCustomSmsText(defaultSmsMessage);
  }, [defaultSmsMessage]);

  useEffect(() => {
    if (!customEmailSubject) setCustomEmailSubject(defaultEmailSubject);
  }, [defaultEmailSubject]);

  useEffect(() => {
    if (!customEmailBody) setCustomEmailBody(defaultEmailBody);
  }, [defaultEmailBody]);

  if (!isOpen) return null;

  // Handler Invio WhatsApp
  const handleSendWhatsApp = () => {
    const targetPhone = phone.trim();
    if (!targetPhone) {
      alert('Inserisci o seleziona un numero di cellulare per inviare l\'invito WhatsApp.');
      return;
    }
    const messageToSend = customWaText.trim() || defaultWaMessage;
    const url = buildWhatsAppUrl(targetPhone, messageToSend, country);
    const normalized = normalizePhoneForWhatsApp(targetPhone, country);

    window.open(url, '_blank', 'noopener,noreferrer');
    
    logSystemEvent(
      'INFO', 
      'META_WHATSAPP', 
      `Invito Web App inviato via WhatsApp a ${name || targetPhone} (+${normalized})`, 
      config?.tenant_id
    );

    const success = `WhatsApp aperto con il messaggio di invito per ${name || targetPhone}!`;
    setActionSuccessMessage(success);
    if (onSuccessToast) onSuccessToast(success);
    setTimeout(() => setActionSuccessMessage(null), 6000);
  };

  // Handler Invio SMS
  const handleSendSms = () => {
    const targetPhone = phone.trim();
    if (!targetPhone) {
      alert('Inserisci o seleziona un numero di cellulare per inviare l\'SMS di invito.');
      return;
    }
    const messageToSend = customSmsText.trim() || defaultSmsMessage;
    const url = buildSmsUrl(targetPhone, messageToSend, country);
    const normalized = normalizePhoneForWhatsApp(targetPhone, country);

    window.location.href = url;

    logSystemEvent(
      'INFO', 
      'SMS_GATEWAY', 
      `Invito Web App inviato via SMS a ${name || targetPhone} (+${normalized})`, 
      config?.tenant_id
    );

    const success = `App SMS avviata con messaggio di invito per ${name || targetPhone}!`;
    setActionSuccessMessage(success);
    if (onSuccessToast) onSuccessToast(success);
    setTimeout(() => setActionSuccessMessage(null), 6000);
  };

  // Handler Invio Email
  const handleSendEmail = () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      alert('Inserisci o seleziona un indirizzo email per inviare l\'invito.');
      return;
    }
    const subject = customEmailSubject.trim() || defaultEmailSubject;
    const body = customEmailBody.trim() || defaultEmailBody;
    const url = buildMailtoUrl(targetEmail, subject, body);

    window.location.href = url;

    logSystemEvent(
      'INFO', 
      'EMAIL_SERVICE', 
      `Invito Web App inviato via Email a ${name || targetEmail} (${targetEmail})`, 
      config?.tenant_id
    );

    const success = `Client email avviato per ${targetEmail}!`;
    setActionSuccessMessage(success);
    if (onSuccessToast) onSuccessToast(success);
    setTimeout(() => setActionSuccessMessage(null), 6000);
  };

  // Handler Copia Link Diretto
  const handleCopyLink = () => {
    navigator.clipboard.writeText(appBaseUrl);
    setCopiedLink(true);
    const success = 'Link di invito copiato negli appunti!';
    setActionSuccessMessage(success);
    if (onSuccessToast) onSuccessToast(success);
    setTimeout(() => setCopiedLink(false), 2500);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  // Handler Copia Testo Corrente
  const handleCopyCurrentText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // QR Code URL (usando servizio SVG veloce e affidabile per stampare o inquadrare a banco)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(appBaseUrl)}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-[6px] border border-[#E4E6EA] z-10 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#14161A] text-white flex items-center justify-between border-b border-[#E4E6EA]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[4px] bg-blue-950/70 border border-blue-800 flex items-center justify-center text-[#1450FF]">
              <Share2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-950 text-blue-300 px-2 py-0.5 rounded-[4px] border border-blue-800 font-mono">
                  Pannello Titolare Salone
                </span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                  <span>🇨🇭</span> Svizzera (+41)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 font-display">
                Invia Link di Invito per Iscriversi all'App
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-[0.98]"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
          
          {/* Step 1: Destinatario */}
          <div className="bg-slate-50 p-4 rounded-[6px] border border-[#E4E6EA] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-display">
                <User className="w-3.5 h-3.5 text-[#1450FF]" />
                1. Scegli Destinatario
              </span>
              <div className="flex items-center bg-white p-0.5 rounded-[4px] border border-[#E4E6EA] text-xs">
                <button
                  type="button"
                  onClick={() => setRecipientType('new')}
                  className={`px-3 py-1 rounded-[4px] font-semibold transition ${
                    recipientType === 'new' ? 'bg-[#1450FF] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Nuovo Contatto
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('existing')}
                  className={`px-3 py-1 rounded-[4px] font-semibold transition ${
                    recipientType === 'existing' ? 'bg-[#1450FF] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dall'Anagrafica ({clients.length})
                </button>
              </div>
            </div>

            {recipientType === 'existing' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seleziona Cliente Registrato
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedClientId(id);
                    const found = clients.find(c => c.id === id);
                    if (found) {
                      setName(found.name);
                      setPhone(found.phone);
                      setEmail(found.email || '');
                    }
                  }}
                  className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 font-medium focus:border-[#1450FF] focus:outline-none"
                >
                  <option value="">-- Seleziona un cliente dalla rubrica --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} • {c.phone} {c.email ? `(${c.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Input Dati Destinatario */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome e Cognome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="es. Mario Rossi"
                  className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cellulare (WhatsApp / SMS) *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="es. +41 79 123 45 67 o 079..."
                  className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email (per Invito Mail)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="es. cliente@email.com"
                  className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none font-medium"
                />
              </div>
            </div>

            {phone && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 bg-white px-3 py-1.5 rounded-[4px] border border-[#E4E6EA]">
                <span>Numero normalizzato per Svizzera/Estero:</span>
                <span className="font-mono font-bold text-emerald-600">
                  +{normalizePhoneForWhatsApp(phone, country)}
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Canale di Invio */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-display">
              <Send className="w-3.5 h-3.5 text-[#1450FF]" />
              2. Scegli Canale di Invio
            </span>

            {/* Channels Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveChannel('whatsapp')}
                className={`p-3 rounded-[4px] border text-left transition flex flex-col justify-between gap-2 active:scale-[0.98] ${
                  activeChannel === 'whatsapp'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-white border-[#E4E6EA] text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[4px] bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  {activeChannel === 'whatsapp' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                </div>
                <div>
                  <h4 className="text-xs font-bold">WhatsApp</h4>
                  <p className="text-[10px] text-slate-500">Apertura chat con testo</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveChannel('email')}
                className={`p-3 rounded-[4px] border text-left transition flex flex-col justify-between gap-2 active:scale-[0.98] ${
                  activeChannel === 'email'
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-white border-[#E4E6EA] text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[4px] bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  {activeChannel === 'email' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                </div>
                <div>
                  <h4 className="text-xs font-bold">Email Ufficiale</h4>
                  <p className="text-[10px] text-slate-500">Invio formattato mailto</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveChannel('sms')}
                className={`p-3 rounded-[4px] border text-left transition flex flex-col justify-between gap-2 active:scale-[0.98] ${
                  activeChannel === 'sms'
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-white border-[#E4E6EA] text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[4px] bg-blue-100 text-[#1450FF] flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  {activeChannel === 'sms' && <span className="w-2 h-2 rounded-full bg-[#1450FF]"></span>}
                </div>
                <div>
                  <h4 className="text-xs font-bold">SMS Nativo</h4>
                  <p className="text-[10px] text-slate-500">Messaggi smartphone</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveChannel('link')}
                className={`p-3 rounded-[4px] border text-left transition flex flex-col justify-between gap-2 active:scale-[0.98] ${
                  activeChannel === 'link'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-white border-[#E4E6EA] text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[4px] bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Copy className="w-4 h-4" />
                  </div>
                  {activeChannel === 'link' && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                </div>
                <div>
                  <h4 className="text-xs font-bold">Link & QR Code</h4>
                  <p className="text-[10px] text-slate-500">Copia rapida & scan</p>
                </div>
              </button>
            </div>
          </div>

          {/* Dettagli Canale Attivo & Editor Messaggio */}
          <div className="border border-[#E4E6EA] rounded-[6px] p-4 bg-slate-50/50 space-y-3">
            
            {/* WHATSAPP CONTENT */}
            {activeChannel === 'whatsapp' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-display">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Messaggio WhatsApp per {name || 'il Cliente'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCurrentText(customWaText || defaultWaMessage)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText ? 'Copiato!' : 'Copia Testo'}
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={customWaText}
                  onChange={(e) => setCustomWaText(e.target.value)}
                  className="w-full bg-white border border-[#E4E6EA] text-slate-800 text-xs rounded-[4px] p-3 focus:border-emerald-500 focus:outline-none font-mono leading-relaxed"
                  placeholder="Scrivi il messaggio WhatsApp..."
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Apre la chat con <strong>+{normalizePhoneForWhatsApp(phone, country) || 'destinatario'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-[4px] flex items-center justify-center gap-2 transition active:scale-[0.98]"
                  >
                    <Send className="w-4 h-4" />
                    Invia Invito su WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* EMAIL CONTENT */}
            {activeChannel === 'email' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-display">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Invito via Email
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCurrentText(`${customEmailSubject}\n\n${customEmailBody}`)}
                    className="text-[11px] text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText ? 'Copiato!' : 'Copia Testo Email'}
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Oggetto Email</label>
                  <input
                    type="text"
                    value={customEmailSubject}
                    onChange={(e) => setCustomEmailSubject(e.target.value)}
                    className="w-full bg-white border border-[#E4E6EA] text-slate-800 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Corpo dell'Email</label>
                  <textarea
                    rows={6}
                    value={customEmailBody}
                    onChange={(e) => setCustomEmailBody(e.target.value)}
                    className="w-full bg-white border border-[#E4E6EA] text-slate-800 text-xs rounded-[4px] p-3 focus:border-[#1450FF] focus:outline-none leading-relaxed font-sans"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Destinatario: <strong>{email || 'Nessuna email indicata'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={!email}
                    className="w-full sm:w-auto bg-[#1450FF] hover:bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-[4px] flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Mail className="w-4 h-4" />
                    Invia tramite Client Email (mailto)
                  </button>
                </div>
              </div>
            )}

            {/* SMS CONTENT */}
            {activeChannel === 'sms' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-display">
                    <Smartphone className="w-4 h-4 text-[#1450FF]" />
                    Messaggio SMS Tradizionale
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCurrentText(customSmsText || defaultSmsMessage)}
                    className="text-[11px] text-[#1450FF] hover:underline font-bold flex items-center gap-1"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText ? 'Copiato!' : 'Copia Testo SMS'}
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={customSmsText}
                  onChange={(e) => setCustomSmsText(e.target.value)}
                  className="w-full bg-white border border-[#E4E6EA] text-slate-800 text-xs rounded-[4px] p-3 focus:border-[#1450FF] focus:outline-none font-mono"
                  placeholder="Scrivi il testo dell'SMS..."
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Caratteri: <strong>{customSmsText.length}</strong> (circa {Math.ceil(customSmsText.length / 160)} SMS)
                  </span>
                  <button
                    type="button"
                    onClick={handleSendSms}
                    className="w-full sm:w-auto bg-[#1450FF] hover:bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-[4px] flex items-center justify-center gap-2 transition active:scale-[0.98]"
                  >
                    <Smartphone className="w-4 h-4" />
                    Invia SMS su Smartphone
                  </button>
                </div>
              </div>
            )}

            {/* LINK & QR CODE CONTENT */}
            {activeChannel === 'link' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-display">
                    <Globe className="w-4 h-4 text-amber-600" />
                    Link Diretto e QR Code Invito
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="text-[11px] font-bold text-[#1450FF] hover:underline flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    {showQrCode ? 'Nascondi QR Code' : 'Mostra QR Code'}
                  </button>
                </div>

                {/* Link Box with Copy button */}
                <div className="bg-white p-3 rounded-[4px] border border-[#E4E6EA] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="text-xs font-mono text-[#1450FF] break-all select-all flex-1 font-semibold">
                    {appBaseUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="bg-[#1450FF] hover:bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-[4px] flex items-center justify-center gap-1.5 transition active:scale-[0.98] shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copiato!' : 'Copia Link'}</span>
                  </button>
                </div>

                {/* QR Code Viewer */}
                {showQrCode && (
                  <div className="bg-white p-5 rounded-[4px] border border-[#E4E6EA] text-center space-y-3 animate-fade-in">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code Invito App Salone" 
                      className="w-40 h-40 mx-auto rounded-[4px] border border-[#E4E6EA]"
                    />
                    <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium">
                      Fai inquadrare questo QR Code al cliente dal suo smartphone alla cassa o in sala d'attesa per fargli scaricare l'app all'istante.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Feedback Success Box */}
          {actionSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-[4px] text-xs flex items-center gap-2.5 font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {/* Tips Box per il Titolare */}
          <div className="bg-blue-50/60 border border-blue-150 rounded-[4px] p-3.5 flex items-start gap-3 text-xs text-slate-800">
            <Sparkles className="w-4 h-4 text-[#1450FF] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 font-display">Perché invitare i clienti alla Web App?</p>
              <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed font-medium">
                I clienti registrati possono prenotare autonomamente 24/7, ricevono promemoria automatici e riducono i mancati arrivi (no-show) fino all'80%. L'app non necessita di installazione dagli store: si apre subito nel browser e si aggiunge alla schermata home come una PWA.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-[#E4E6EA] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#E4E6EA] hover:bg-slate-100 text-slate-700 font-bold rounded-[4px] transition active:scale-[0.98]"
          >
            Chiudi
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-bold rounded-[4px] flex items-center gap-1.5 transition active:scale-[0.98]"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Link Copiato!' : 'Copia Link'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeChannel === 'whatsapp') handleSendWhatsApp();
                else if (activeChannel === 'email') handleSendEmail();
                else if (activeChannel === 'sms') handleSendSms();
                else handleCopyLink();
              }}
              className="px-5 py-2 bg-[#1450FF] hover:bg-blue-600 text-white font-bold rounded-[4px] flex items-center gap-1.5 transition active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Procedi con Invio</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
