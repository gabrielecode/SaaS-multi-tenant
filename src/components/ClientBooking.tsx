import React, { useState, useMemo, FormEvent } from 'react';
import { Service, Appointment, Client, AppointmentStatus, BusinessConfig, Promotion, WhatsAppCampaign } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  MapPin, 
  Phone, 
  MessageCircle, 
  CalendarPlus, 
  Check, 
  ChevronRight,
  Sparkles,
  Tag,
  Flame,
  Gift,
  Copy,
  Percent,
  X,
  UserCheck,
  Search
} from 'lucide-react';

interface ClientBookingProps {
  config: BusinessConfig;
  services: Service[];
  appointments: Appointment[];
  clients: Client[];
  campaigns?: WhatsAppCampaign[];
  loggedClientUser?: any;
  onOpenAuth?: () => void;
  onLogoutClient?: () => void;
  onAddAppointment: (newApp: Appointment) => void;
  onUpdateAppointments: (apps: Appointment[]) => void;
}

// Default salon promotions
const SALON_PROMOTIONS: Promotion[] = [
  {
    id: 'promo_welcome',
    title: 'Offerta Benvenuto 1ª Visita',
    description: 'Sconto immediato del 20% sul tuo primo appuntamento in salone per qualsiasi trattamento.',
    discountPercentage: 20,
    code: 'BENVENUTO20',
    validUntil: 'Attiva questo mese',
    badge: 'Più Amata',
    highlight: true
  },
  {
    id: 'promo_happyhour',
    title: 'Happy Hour Metà Settimana',
    description: 'Prenditi cura del tuo stile il mercoledì o giovedì: sconto del 15% su tagli e pieghe.',
    discountPercentage: 15,
    code: 'HAPPY15',
    validUntil: 'Mercoledì e Giovedì',
    badge: 'Metà Settimana'
  },
  {
    id: 'promo_combo',
    title: 'Speciale Combo Deluxe',
    description: '10€ di sconto immediato al check-out sui trattamenti completi (es. Colore + Piega o Combo Barba & Capelli).',
    discountFixed: 10,
    code: 'DELUXE10',
    validUntil: 'Fino a esaurimento slot',
    badge: 'Risparmio 10€'
  }
];

// Generate simple next 7 days for fast picking
function getNextDays(startDateStr = '2026-06-24') {
  const days = [];
  const base = new Date(startDateStr);
  const daysOfWeek = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const shortDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const isTomorrow = i === 1;

    days.push({
      dateStr,
      dayNumber: d.getDate(),
      dayName: daysOfWeek[d.getDay()],
      shortDay: shortDays[d.getDay()],
      monthName: months[d.getMonth()],
      tag: isToday ? 'Oggi' : isTomorrow ? 'Domani' : null,
      isClosed: d.getDay() === 0 // Domenica chiuso
    });
  }
  return days;
}

export default function ClientBooking({
  config,
  services,
  appointments,
  clients,
  campaigns = [],
  loggedClientUser = null,
  onOpenAuth,
  onLogoutClient,
  onAddAppointment,
  onUpdateAppointments
}: ClientBookingProps) {
  // Navigation: 'book' (prenota) | 'promos' (offerte) | 'my_appointments' (storico)
  const [activeTab, setActiveTab] = useState<'book' | 'promos' | 'my_appointments'>('book');

  // Step: 1 (Servizio) -> 2 (Data & Ora) -> 3 (Dati) -> 4 (Confermato)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // User selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-24');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Client info (remember from local storage if previously entered or from logged in user)
  const [name, setName] = useState(() => loggedClientUser?.name || localStorage.getItem('client_name') || '');
  const [phone, setPhone] = useState(() => loggedClientUser?.phone || localStorage.getItem('client_phone') || '');
  const [notes, setNotes] = useState('');

  // Sync state if loggedClientUser changes
  React.useEffect(() => {
    if (loggedClientUser) {
      if (loggedClientUser.name) setName(loggedClientUser.name);
      if (loggedClientUser.phone) setPhone(loggedClientUser.phone);
      if (loggedClientUser.phone) setLookupPhone(loggedClientUser.phone);
    }
  }, [loggedClientUser]);
  
  // Promotion handling
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Search in "my appointments"
  const [lookupPhone, setLookupPhone] = useState(() => loggedClientUser?.phone || '');
  const [lookedUpAppointments, setLookedUpAppointments] = useState<Appointment[] | null>(null);

  // Auto look up appointments when tab changes to my_appointments if user is logged in
  React.useEffect(() => {
    if (activeTab === 'my_appointments') {
      const activeNum = (loggedClientUser?.phone || lookupPhone || phone).replace(/\D/g, '');
      if (activeNum) {
        const found = appointments.filter(a => a.clientPhone.replace(/\D/g, '').includes(activeNum));
        setLookedUpAppointments(found);
      }
    }
  }, [activeTab, loggedClientUser, lookupPhone, phone, appointments]);

  // Available dates
  const days = useMemo(() => getNextDays('2026-06-24'), []);

  // Simple, realistic time slots
  const morningTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'];
  const afternoonTimes = ['14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

  // Check which times are already booked
  const occupiedTimes = useMemo(() => {
    return appointments
      .filter(a => a.date === selectedDate && a.status !== AppointmentStatus.CANCELLED)
      .map(a => a.time);
  }, [appointments, selectedDate]);

  // Combined promotions list
  const allPromos = useMemo(() => {
    return SALON_PROMOTIONS;
  }, []);

  // Calculate prices
  const originalPrice = selectedService?.price || 0;
  const discountAmount = useMemo(() => {
    if (!appliedPromo || !originalPrice) return 0;
    if (appliedPromo.discountPercentage) {
      return Math.round((originalPrice * appliedPromo.discountPercentage) / 100);
    }
    if (appliedPromo.discountFixed) {
      return Math.min(originalPrice, appliedPromo.discountFixed);
    }
    return 0;
  }, [appliedPromo, originalPrice]);

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  // Apply promo code function
  const applyPromoCode = (codeToApply: string) => {
    const cleanCode = codeToApply.trim().toUpperCase();
    if (!cleanCode) return;
    const found = allPromos.find(p => p.code.toUpperCase() === cleanCode);
    if (found) {
      setAppliedPromo(found);
      setPromoError(null);
      setPromoInput(found.code);
    } else {
      setPromoError('Codice non valido o scaduto');
    }
  };

  // Quick activate from promo card
  const handleUsePromoAndBook = (promo: Promotion) => {
    setAppliedPromo(promo);
    setPromoInput(promo.code);
    setActiveTab('book');
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Copy code to clipboard helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Handle service selection
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle time selection
  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final confirmation
  const handleConfirmBooking = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) return;
    if (!name.trim() || !phone.trim()) return;

    // Save info locally for next time
    localStorage.setItem('client_name', name.trim());
    localStorage.setItem('client_phone', phone.trim());

    // Resolve client ID against existing clients or logged user
    const digitsOnlyPhone = phone.trim().replace(/\D/g, '');
    const matchedClient = clients.find(c => c.phone.replace(/\D/g, '') === digitsOnlyPhone);
    const resolvedClientId = loggedClientUser?.id || matchedClient?.id || ('c_' + Date.now());

    const newId = 'app_' + Date.now();
    const newAppointment: Appointment = {
      id: newId,
      tenant_id: config.tenant_id,
      clientId: resolvedClientId,
      clientName: name.trim(),
      clientPhone: phone.trim(),
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date: selectedDate,
      time: selectedTime,
      price: finalPrice,
      depositPaid: 0,
      paymentMethod: 'IN_SALON',
      status: AppointmentStatus.PENDING,
      notes: `${notes.trim()}${appliedPromo ? ` [Promo: ${appliedPromo.code} - Sconto €${discountAmount}]` : ''}`.trim(),
      reminderSent: true,
      isConfirmedByClient: false
    };

    onAddAppointment(newAppointment);
    setStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Lookup client appointments
  const handleLookup = (e: FormEvent) => {
    e.preventDefault();
    const clean = lookupPhone.replace(/\D/g, '');
    if (!clean) return;
    const found = appointments.filter(a => a.clientPhone.replace(/\D/g, '').includes(clean));
    setLookedUpAppointments(found);
  };

  // Cancel appointment from client lookup
  const handleCancelAppointment = (appId: string) => {
    const updated = appointments.map(a => a.id === appId ? { ...a, status: AppointmentStatus.CANCELLED } : a);
    onUpdateAppointments(updated);
    if (lookedUpAppointments) {
      setLookedUpAppointments(lookedUpAppointments.map(a => a.id === appId ? { ...a, status: AppointmentStatus.CANCELLED } : a));
    }
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    if (!selectedService) return '#';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const [h, min] = selectedTime.split(':').map(Number);
    const start = new Date(y, m - 1, d, h, min);
    const end = new Date(start.getTime() + (selectedService.duration || 45) * 60000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const format = (dt: Date) => 
      `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;

    const title = `${selectedService.name} @ ${config.name}`;
    const desc = `Appuntamento per ${selectedService.name} presso ${config.name}. Tel: ${config.phone}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${format(start)}/${format(end)}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(config.name)}`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8 space-y-5">

      {/* ------------------------------------------------------------- */}
      {/* SALON HEADER CARD                                             */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {config.category || 'Salone di Bellezza'}
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {config.name}
          </h1>
          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-3">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {config.phone}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Centro Città
            </span>
          </p>
        </div>

        {/* Badge Prenotazione Immediata */}
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Prenotazione Online 24/7
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* NAVIGATION TABS: PRENOTA | PROMOZIONI | I MIEI APPUNTAMENTI   */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
        <button
          onClick={() => { setActiveTab('book'); }}
          className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'book'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Prenota</span>
        </button>

        <button
          onClick={() => { setActiveTab('promos'); }}
          className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 relative ${
            activeTab === 'promos'
              ? 'bg-white text-amber-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>Promozioni</span>
          <span className="ml-0.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
            {allPromos.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('my_appointments'); }}
          className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'my_appointments'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>I Miei Appuntamenti</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 2: PROMOZIONI IN CORSO                                    */}
      {/* ============================================================= */}
      {activeTab === 'promos' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-xs">
                <Flame className="w-3.5 h-3.5 text-amber-200" /> Offerte Esclusive Salone
              </span>
              <h2 className="text-xl font-black">Promozioni & Sconti in Corso</h2>
              <p className="text-xs text-amber-100 max-w-md">
                Approfitta dei coupon attivi questa settimana. Tocca "Usa Promo" per applicare subito lo sconto al tuo trattamento!
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-center">
              <span className="block text-2xl font-black">{allPromos.length}</span>
              <span className="text-[10px] font-bold text-amber-100 uppercase">Offerte Attive</span>
            </div>
          </div>

          {/* Cards delle promozioni */}
          <div className="space-y-3">
            {allPromos.map(promo => {
              const isApplied = appliedPromo?.code === promo.code;
              return (
                <div
                  key={promo.id}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden ${
                    isApplied 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10' 
                      : promo.highlight 
                      ? 'border-amber-300 bg-amber-50/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                        {promo.badge || 'Offerta'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Validità: {promo.validUntil}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      {promo.title}
                      {promo.discountPercentage && (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 text-xs font-black px-2 py-0.5 rounded-lg">
                          -{promo.discountPercentage}%
                        </span>
                      )}
                      {promo.discountFixed && (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 text-xs font-black px-2 py-0.5 rounded-lg">
                          -{promo.discountFixed}€
                        </span>
                      )}
                    </h3>

                    <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                      {promo.description}
                    </p>

                    {/* Codice Promo con Copy */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-slate-800">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        <span>{promo.code}</span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(promo.code)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition px-2 py-1"
                      >
                        {copiedCode === promo.code ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Copiato!
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Copia codice
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Pulsante Azione */}
                  <div className="sm:text-right flex-shrink-0">
                    {isApplied ? (
                      <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-300">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Promo Attiva
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUsePromoAndBook(promo)}
                        className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-sm hover:shadow transition active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        Usa Promo & Prenota
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Campagne WhatsApp aggiuntive del salone se presenti */}
          {campaigns.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                Comunicazioni e Promozioni WhatsApp Recenti
              </h4>
              <div className="divide-y divide-slate-100">
                {campaigns.map(c => (
                  <div key={c.id} className="py-2.5 text-xs text-slate-600 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-800">{c.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{c.messageBody}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                      Inviata ai Clienti
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: I MIEI APPUNTAMENTI (LOOKUP)                           */}
      {/* ============================================================= */}
      {activeTab === 'my_appointments' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-black text-slate-900">I Miei Appuntamenti</h2>
            <p className="text-xs text-slate-500">
              Inserisci il tuo numero di cellulare per verificare le tue prenotazioni o disdire in autonomia.
            </p>
          </div>

          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="tel"
              placeholder="es. 333 1234567"
              value={lookupPhone}
              onChange={e => setLookupPhone(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition font-medium"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              Cerca
            </button>
          </form>

          {lookedUpAppointments && (
            <div className="space-y-3 pt-2">
              {lookedUpAppointments.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Nessun appuntamento trovato per questo numero.
                </div>
              ) : (
                lookedUpAppointments.map(app => (
                  <div key={app.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 text-sm">{app.serviceName}</p>
                      <p className="text-xs text-slate-500">
                        {app.date} alle {app.time} • Totale: €{app.price}
                      </p>
                      <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        app.status === AppointmentStatus.CANCELLED
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {app.status === AppointmentStatus.CANCELLED ? 'Annullato' : 'Confermato'}
                      </span>
                    </div>

                    {app.status !== AppointmentStatus.CANCELLED && (
                      <button
                        onClick={() => handleCancelAppointment(app.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                      >
                        Disdici
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 1: PRENOTAZIONE CLASSICA SEMPLIFICATA                     */}
      {/* ============================================================= */}
      {activeTab === 'book' && (
        <div className="space-y-5">

          {/* STEP PROGRESS BAR (CHIARA A 3 PASSAGGI) */}
          {step < 4 && (
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold">
              <button 
                onClick={() => setStep(1)}
                className={`flex items-center gap-1.5 ${step === 1 ? 'text-indigo-600' : 'text-slate-700 hover:text-indigo-600'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>1</span>
                <span>Servizio</span>
              </button>

              <ChevronRight className="w-4 h-4 text-slate-300" />

              <button 
                disabled={!selectedService}
                onClick={() => selectedService && setStep(2)}
                className={`flex items-center gap-1.5 ${step === 2 ? 'text-indigo-600' : selectedService ? 'text-slate-700' : 'text-slate-300'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>2</span>
                <span>Data & Ora</span>
              </button>

              <ChevronRight className="w-4 h-4 text-slate-300" />

              <button 
                disabled={!selectedTime}
                onClick={() => selectedTime && setStep(3)}
                className={`flex items-center gap-1.5 ${step === 3 ? 'text-indigo-600' : selectedTime ? 'text-slate-700' : 'text-slate-300'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>3</span>
                <span>I tuoi Dati</span>
              </button>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 1: SCEGLI IL SERVIZIO                                    */}
          {/* ------------------------------------------------------------- */}
          {step === 1 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              
              {/* Banner Promozione Attiva in Evidenza */}
              {appliedPromo ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      Promo attiva: <strong>{appliedPromo.title}</strong> ({appliedPromo.code})
                    </span>
                  </div>
                  <button
                    onClick={() => setAppliedPromo(null)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <X className="w-3.5 h-3.5" /> Rimuovi
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Flame className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      Offerta Benvenuto: <strong>-20% sul 1° Trattamento</strong> con codice <strong className="font-mono bg-white/80 px-1.5 py-0.5 rounded border border-amber-200">BENVENUTO20</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => applyPromoCode('BENVENUTO20')}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition"
                    >
                      Attiva Sconto
                    </button>
                    <button
                      onClick={() => setActiveTab('promos')}
                      className="text-amber-800 hover:underline font-bold text-[11px]"
                    >
                      Tutte le offerte ({allPromos.length}) →
                    </button>
                  </div>
                </div>
              )}

              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-extrabold text-slate-900">1. Scegli il Trattamento</h2>
                <p className="text-xs text-slate-500">Tocca il servizio desiderato per procedere alla scelta dell'orario.</p>
              </div>

              <div className="space-y-3 pt-1">
                {services.filter(s => s.isActive).map(service => {
                  // If promo applied, preview discounted price
                  let displayDiscount = 0;
                  if (appliedPromo) {
                    if (appliedPromo.discountPercentage) {
                      displayDiscount = Math.round((service.price * appliedPromo.discountPercentage) / 100);
                    } else if (appliedPromo.discountFixed) {
                      displayDiscount = Math.min(service.price, appliedPromo.discountFixed);
                    }
                  }
                  const discountedServicePrice = Math.max(0, service.price - displayDiscount);

                  return (
                    <div
                      key={service.id}
                      onClick={() => handleSelectService(service)}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 cursor-pointer transition flex items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition">
                            {service.name}
                          </h3>
                          {appliedPromo && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                              Sconto Attivo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{service.duration} minuti</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          {appliedPromo && displayDiscount > 0 ? (
                            <div>
                              <span className="text-xs text-slate-400 line-through mr-1">€{service.price}</span>
                              <span className="text-lg font-black text-emerald-600">€{discountedServicePrice}</span>
                            </div>
                          ) : (
                            <span className="text-lg font-black text-slate-900">€{service.price}</span>
                          )}
                        </div>
                        <span className="px-4 py-2 bg-indigo-600 group-hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition">
                          Scegli
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 2: SCEGLI DATA E ORA                                     */}
          {/* ------------------------------------------------------------- */}
          {step === 2 && selectedService && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">2. Scegli Data e Ora</h2>
                  <p className="text-xs text-slate-500">
                    Per: <strong className="text-indigo-600 font-bold">{selectedService.name}</strong> 
                    {appliedPromo && discountAmount > 0 ? (
                      <span className="ml-1 text-emerald-600 font-bold">(€{finalPrice} con promo)</span>
                    ) : (
                      <span className="ml-1">(€{selectedService.price})</span>
                    )}
                  </p>
                </div>
                <button 
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Cambia
                </button>
              </div>

              {/* Selettore Giorno Semplificato */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Scegli il Giorno:</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {days.map(d => {
                    const isSelected = selectedDate === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        disabled={d.isClosed}
                        onClick={() => {
                          setSelectedDate(d.dateStr);
                          setSelectedTime('');
                        }}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-0.5 relative ${
                          d.isClosed 
                            ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                            : isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {d.tag && (
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 rounded-full ${
                            isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {d.tag}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold">{d.shortDay}</span>
                        <span className="text-lg font-black">{d.dayNumber}</span>
                        <span className="text-[9px] opacity-80">{d.monthName.slice(0, 3)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Orari Mattina */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>☀️</span> Mattina
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {morningTimes.map(t => {
                    const isOccupied = occupiedTimes.includes(t);
                    const isSelected = selectedTime === t;
                    return (
                      <button
                        key={t}
                        disabled={isOccupied}
                        onClick={() => handleSelectTime(t)}
                        className={`py-3 rounded-xl text-xs font-bold border transition ${
                          isOccupied
                            ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-800 border-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Orari Pomeriggio */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>🌤️</span> Pomeriggio
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {afternoonTimes.map(t => {
                    const isOccupied = occupiedTimes.includes(t);
                    const isSelected = selectedTime === t;
                    return (
                      <button
                        key={t}
                        disabled={isOccupied}
                        onClick={() => handleSelectTime(t)}
                        className={`py-3 rounded-xl text-xs font-bold border transition ${
                          isOccupied
                            ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-800 border-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 3: I TUOI DATI, PROMO CODE E CONFERMA                    */}
          {/* ------------------------------------------------------------- */}
          {step === 3 && selectedService && selectedTime && (
            <form onSubmit={handleConfirmBooking} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">3. I tuoi Dati e Conferma</h2>
                  <p className="text-xs text-slate-500">
                    Appuntamento: <strong>{selectedDate}</strong> alle <strong>{selectedTime}</strong>
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Modifica data
                </button>
              </div>

              {/* Riepilogo Dettagliato con Sconto Promo */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">{selectedService.name}</p>
                    <p className="text-slate-500">{selectedService.duration} min • Ore {selectedTime}</p>
                  </div>
                  <span className="font-bold text-slate-700">€{selectedService.price}</span>
                </div>

                {appliedPromo && discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 pt-1 border-t border-slate-200/60 font-semibold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Sconto {appliedPromo.code}
                    </span>
                    <span>-€{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-sm font-black text-slate-900">Totale al salone:</span>
                    <p className="text-[10px] text-emerald-600 font-bold">Nessun anticipo • Paghi all'uscita</p>
                  </div>
                  <span className="text-xl font-black text-indigo-600">€{finalPrice}</span>
                </div>
              </div>

              {/* Inserimento o Gestione Codice Promo */}
              <div className="bg-slate-50/70 border border-dashed border-slate-300 rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Hai un codice promo o coupon sconto?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="es. BENVENUTO20"
                    value={promoInput}
                    onChange={e => {
                      setPromoInput(e.target.value.toUpperCase());
                      setPromoError(null);
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs uppercase font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => applyPromoCode(promoInput)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                  >
                    Applica
                  </button>
                  {appliedPromo && (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoInput('');
                      }}
                      className="px-3 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition"
                    >
                      Rimuovi
                    </button>
                  )}
                </div>
                {promoError && (
                  <p className="text-[11px] text-rose-600 font-medium">{promoError}</p>
                )}
                {appliedPromo && (
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Promo "{appliedPromo.title}" attiva (-€{discountAmount})
                  </p>
                )}
              </div>

              {/* Stato Autenticazione & Registrazione Utente */}
              {loggedClientUser ? (
                <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Prenoti con il tuo profilo: <span className="text-indigo-600">{loggedClientUser.name}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {loggedClientUser.phone} • {loggedClientUser.email}
                      </p>
                    </div>
                  </div>
                  {onLogoutClient && (
                    <button
                      type="button"
                      onClick={onLogoutClient}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-white px-2.5 py-1 rounded-xl border border-rose-200 transition"
                    >
                      Cambia
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Hai già un account o vuoi registrarti?
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Registrati in 30 secondi per accumulare punti fedeltà e gestire i tuoi appuntamenti.
                    </p>
                  </div>
                  {onOpenAuth && (
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition flex-shrink-0 self-start sm:self-auto"
                    >
                      Accedi o Registrati
                    </button>
                  )}
                </div>
              )}

              {/* Campi Anagrafica essenziali */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Il tuo Nome e Cognome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Laura Bianchi"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Numero di Cellulare (per WhatsApp) *
                    </label>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> Riceverai la conferma qui
                    </span>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="es. 333 1234567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Note per il salone (Opzionale)
                  </label>
                  <input
                    type="text"
                    placeholder="es. preferenza orario, prima volta..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Rassicurazione Pagamento */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p>
                  <strong>Nessun anticipo richiesto.</strong> Salderai l'importo scontato (€{finalPrice}) direttamente in salone al termine del servizio.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/20 transition active:scale-98 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Conferma Prenotazione ({finalPrice}€ in Salone)
              </button>
            </form>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 4: PRENOTAZIONE CONFERMATA CON SUCCESSO                 */}
          {/* ------------------------------------------------------------- */}
          {step === 4 && selectedService && (
            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-center animate-fade-in">
              
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">Prenotazione Confermata!</h2>
                <p className="text-xs text-slate-500">
                  Ti aspettiamo in salone. Abbiamo registrato il tuo appuntamento.
                </p>
              </div>

              {/* Scheda Riepilogo Pulita */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                  <span className="text-xs text-slate-500">Salone</span>
                  <strong className="text-slate-900 text-xs">{config.name}</strong>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                  <span className="text-xs text-slate-500">Trattamento</span>
                  <strong className="text-slate-900 text-xs">{selectedService.name}</strong>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                  <span className="text-xs text-slate-500">Giorno e Ora</span>
                  <strong className="text-indigo-600 text-xs">{selectedDate} alle {selectedTime}</strong>
                </div>

                {appliedPromo && discountAmount > 0 && (
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2.5 text-emerald-600">
                    <span className="text-xs">Sconto Promo ({appliedPromo.code})</span>
                    <strong className="text-xs">-€{discountAmount}</strong>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-slate-500">Totale da pagare in salone</span>
                  <strong className="text-base font-black text-slate-900">€{finalPrice}</strong>
                </div>
              </div>

              {/* Azioni Rapide per il Cliente */}
              <div className="space-y-2.5 max-w-md mx-auto pt-2">
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <CalendarPlus className="w-4 h-4 text-indigo-600" />
                  Salva su Google Calendar
                </a>

                <a
                  href={`https://wa.me/39${config.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Ciao! Ho appena prenotato per ${selectedService.name} il ${selectedDate} alle ${selectedTime}.${appliedPromo ? ` Ho applicato il codice sconto ${appliedPromo.code}.` : ''}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Scrivi su WhatsApp al Salone
                </a>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setSelectedService(null);
                    setSelectedTime('');
                    setAppliedPromo(null);
                    setStep(1);
                  }}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  ← Effettua un'altra prenotazione
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
