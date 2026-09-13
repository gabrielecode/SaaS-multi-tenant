import React, { useState, useMemo, FormEvent } from 'react';
import { Service, Appointment, Client, AppointmentStatus, BusinessConfig, Promotion, WhatsAppCampaign } from '../types';
import { buildWhatsAppUrl } from '../lib/phoneUtils';
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
  Copy,
  X,
  UserCheck,
  Search,
  Globe
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
    title: 'Offerta Benvenuto 1° Visita',
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
    description: '10 CHF/EUR di sconto immediato al check-out sui trattamenti completi.',
    discountFixed: 10,
    code: 'DELUXE10',
    validUntil: 'Fino a esaurimento slot',
    badge: 'Risparmio 10'
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
  
  // Client info
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

    localStorage.setItem('client_name', name.trim());
    localStorage.setItem('client_phone', phone.trim());

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
    <div className="max-w-md mx-auto min-h-screen bg-slate-50/50 pb-28 text-slate-900 font-sans antialiased">

      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER SOTTILE CON LOGO & LINGUA/ACCESSO                   */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-sm shadow-indigo-600/30">
            {config.name ? config.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 leading-tight line-clamp-1">
              {config.name || 'Salone Partner'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" /> {config.category || 'Beauty & Wellness'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            <Globe className="w-3 h-3 text-slate-500" />
            <span>IT</span>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. NAVIGATION TABS (PRENOTA | PROMO | APPUNTAMENTI)           */}
      {/* ------------------------------------------------------------- */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 p-1 rounded-2xl text-xs font-bold shadow-inner">
          <button
            onClick={() => { setActiveTab('book'); }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'book'
                ? 'bg-white text-indigo-600 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Prenota</span>
          </button>

          <button
            onClick={() => { setActiveTab('promos'); }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1 relative ${
              activeTab === 'promos'
                ? 'bg-white text-amber-600 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Offerte</span>
            <span className="ml-0.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
              {allPromos.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('my_appointments'); }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'my_appointments'
                ? 'bg-white text-indigo-600 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>I Miei</span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* TAB: PROMOZIONI                                               */}
      {/* ============================================================= */}
      {activeTab === 'promos' && (
        <div className="px-4 pt-4 space-y-4 animate-fade-in">
          {/* Banner Riportato */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-5 text-white shadow-sm space-y-1.5">
            <span className="inline-flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              <Flame className="w-3 h-3 text-amber-200" /> Coupon & Sconti Esclusivi
            </span>
            <h2 className="text-lg font-black leading-tight">Risparmia sul Tuo Trattamento</h2>
            <p className="text-xs text-amber-100">
              Scegli una promozione attiva e applicala istantaneamente al carrello di prenotazione.
            </p>
          </div>

          <div className="space-y-3">
            {allPromos.map(promo => {
              const isApplied = appliedPromo?.code === promo.code;
              return (
                <div
                  key={promo.id}
                  className={`bg-white rounded-2xl p-4 border transition shadow-sm space-y-3 ${
                    isApplied 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/5' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      {promo.badge || 'Offerta'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {promo.validUntil}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      {promo.title}
                      {promo.discountPercentage && (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black px-1.5 py-0.5 rounded">
                          -{promo.discountPercentage}%
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {promo.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl font-mono text-xs font-bold text-slate-800">
                      <Tag className="w-3 h-3 text-slate-500" />
                      <span>{promo.code}</span>
                    </div>

                    {isApplied ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Attiva
                      </span>
                    ) : (
                      <button
                        onClick={() => handleUsePromoAndBook(promo)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Usa Promo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB: I MIEI APPUNTAMENTI                                      */}
      {/* ============================================================= */}
      {activeTab === 'my_appointments' && (
        <div className="px-4 pt-4 space-y-4 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Le Tue Prenotazioni</h2>
              <p className="text-xs text-slate-500">
                Inserisci il tuo cellulare per verificare gli appuntamenti o disdirli.
              </p>
            </div>

            <form onSubmit={handleLookup} className="flex gap-2">
              <input
                type="tel"
                placeholder="es. 333 1234567"
                value={lookupPhone}
                onChange={e => setLookupPhone(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Cerca
              </button>
            </form>

            {lookedUpAppointments && (
              <div className="space-y-2.5 pt-1">
                {lookedUpAppointments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nessun appuntamento trovato.
                  </div>
                ) : (
                  lookedUpAppointments.map(app => (
                    <div key={app.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{app.serviceName}</p>
                        <p className="text-slate-500 text-[11px]">{app.date} • {app.time} (€{app.price})</p>
                      </div>
                      {app.status !== AppointmentStatus.CANCELLED && (
                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(app.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px]"
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
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB: PRENOTA (FLUSSO PRINCIPALE)                              */}
      {/* ============================================================= */}
      {activeTab === 'book' && (
        <div className="px-4 pt-4 space-y-4 animate-fade-in">

          {/* STEP PROGRESS BAR */}
          {step < 4 && (
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold">
              <button 
                onClick={() => setStep(1)}
                className={`flex items-center gap-1 ${step === 1 ? 'text-indigo-600 font-black' : 'text-slate-500'}`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>1</span>
                <span>Servizio</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <button 
                disabled={!selectedService}
                onClick={() => selectedService && setStep(2)}
                className={`flex items-center gap-1 ${step === 2 ? 'text-indigo-600 font-black' : selectedService ? 'text-slate-700' : 'text-slate-300'}`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>2</span>
                <span>Orario</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <button 
                disabled={!selectedTime}
                onClick={() => selectedTime && setStep(3)}
                className={`flex items-center gap-1 ${step === 3 ? 'text-indigo-600 font-black' : selectedTime ? 'text-slate-700' : 'text-slate-300'}`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${step === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>3</span>
                <span>Conferma</span>
              </button>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 1: SCEGLI IL SERVIZIO                                    */}
          {/* ------------------------------------------------------------- */}
          {step === 1 && (
            <div className="space-y-3">
              {/* Banner Promo Attiva o Avviso Benvenuto */}
              {appliedPromo ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Promo attiva: <strong>{appliedPromo.title}</strong></span>
                  </div>
                  <button onClick={() => setAppliedPromo(null)} className="text-emerald-700 hover:underline font-bold text-[11px]">
                    Rimuovi
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => applyPromoCode('BENVENUTO20')}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs cursor-pointer hover:border-amber-300 transition"
                >
                  <div className="flex items-center gap-2 text-amber-900">
                    <Flame className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Sconto Benvenuto 20%</p>
                      <p className="text-[11px] text-amber-700">Tocca per applicare il codice BENVENUTO20</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-600 text-white font-bold text-[10px] rounded-xl">Applica</span>
                </div>
              )}

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Seleziona Trattamento</h2>
                
                <div className="space-y-2.5">
                  {services.filter(s => s.isActive).map(service => {
                    let displayDiscount = 0;
                    if (appliedPromo) {
                      if (appliedPromo.discountPercentage) {
                        displayDiscount = Math.round((service.price * appliedPromo.discountPercentage) / 100);
                      } else if (appliedPromo.discountFixed) {
                        displayDiscount = Math.min(service.price, appliedPromo.discountFixed);
                      }
                    }
                    const discountedServicePrice = Math.max(0, service.price - displayDiscount);
                    const isSelected = selectedService?.id === service.id;

                    return (
                      <div
                        key={service.id}
                        onClick={() => handleSelectService(service)}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected 
                            ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500/20' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-900 text-sm">{service.name}</h3>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> {service.duration} min
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2.5">
                          <div>
                            {appliedPromo && displayDiscount > 0 ? (
                              <div>
                                <span className="text-[11px] text-slate-400 line-through">€{service.price}</span>
                                <span className="block text-sm font-black text-emerald-600">€{discountedServicePrice}</span>
                              </div>
                            ) : (
                              <span className="text-sm font-black text-slate-900">€{service.price}</span>
                            )}
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 2: SCEGLI DATA & ORA                                     */}
          {/* ------------------------------------------------------------- */}
          {step === 2 && selectedService && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Data e Orario</h2>
                  <p className="text-xs text-indigo-600 font-bold">{selectedService.name} (€{finalPrice})</p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-slate-500 font-bold hover:text-slate-800 flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Indietro
                </button>
              </div>

              {/* Selettore Giorni Touch-friendly (Pillole orizzontali) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Seleziona Giorno:</label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
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
                        className={`flex-shrink-0 w-16 p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                          d.isClosed 
                            ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                            : isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-black'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 font-medium'
                        }`}
                      >
                        {d.tag && (
                          <span className={`text-[8px] font-black uppercase px-1 rounded ${isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-800'}`}>
                            {d.tag}
                          </span>
                        )}
                        <span className="text-[10px]">{d.shortDay}</span>
                        <span className="text-base font-black">{d.dayNumber}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Orari Mattina & Pomeriggio */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">☀️ Mattina</p>
                  <div className="grid grid-cols-3 gap-2">
                    {morningTimes.map(t => {
                      const isOccupied = occupiedTimes.includes(t);
                      const isSelected = selectedTime === t;
                      return (
                        <button
                          key={t}
                          disabled={isOccupied}
                          onClick={() => handleSelectTime(t)}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                            isOccupied
                              ? 'bg-slate-100 text-slate-300 border-slate-200 line-through cursor-not-allowed'
                              : isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 hover:border-indigo-300 text-slate-800 border-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">🌤️ Pomeriggio</p>
                  <div className="grid grid-cols-3 gap-2">
                    {afternoonTimes.map(t => {
                      const isOccupied = occupiedTimes.includes(t);
                      const isSelected = selectedTime === t;
                      return (
                        <button
                          key={t}
                          disabled={isOccupied}
                          onClick={() => handleSelectTime(t)}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                            isOccupied
                              ? 'bg-slate-100 text-slate-300 border-slate-200 line-through cursor-not-allowed'
                              : isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 hover:border-indigo-300 text-slate-800 border-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 3: DATI & CONFERMA                                       */}
          {/* ------------------------------------------------------------- */}
          {step === 3 && selectedService && selectedTime && (
            <form onSubmit={handleConfirmBooking} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">I tuoi Dati</h2>
                  <p className="text-xs text-slate-500">{selectedDate} alle {selectedTime}</p>
                </div>
                <button type="button" onClick={() => setStep(2)} className="text-xs text-slate-500 font-bold hover:text-slate-800 flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Modifica
                </button>
              </div>

              {/* Riepilogo Costo */}
              <div className="bg-slate-50 rounded-xl p-3 text-xs flex items-center justify-between border border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">{selectedService.name}</p>
                  <p className="text-[11px] text-slate-500">{selectedService.duration} min • Paghi in salone</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-indigo-600">€{finalPrice}</span>
                </div>
              </div>

              {/* Codice Promo input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Codice Promo (es. BENVENUTO20)"
                  value={promoInput}
                  onChange={e => {
                    setPromoInput(e.target.value.toUpperCase());
                    setPromoError(null);
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => applyPromoCode(promoInput)}
                  className="px-3 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
                >
                  Applica
                </button>
              </div>
              {promoError && <p className="text-[11px] text-rose-600 font-medium">{promoError}</p>}
              {appliedPromo && <p className="text-[11px] text-emerald-600 font-bold">✓ Coupon {appliedPromo.code} applicato (-€{discountAmount})</p>}

              {/* Anagrafica */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Nome e Cognome *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Laura Rossi"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Cellulare (per WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="es. 079 123 45 67"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Note (Opzionale)</label>
                  <input
                    type="text"
                    placeholder="es. prima volta in salone..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Conferma Prenotazione (€{finalPrice})
              </button>
            </form>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 4: SUCCESSO                                              */}
          {/* ------------------------------------------------------------- */}
          {step === 4 && selectedService && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-center animate-fade-in">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">Prenotazione Confermata!</h2>
                <p className="text-xs text-slate-500">Ti aspettiamo in salone. Riceverai promemoria WhatsApp.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between"><span className="text-slate-500">Trattamento</span><strong className="text-slate-900">{selectedService.name}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Data e Ora</span><strong className="text-indigo-600">{selectedDate} - {selectedTime}</strong></div>
                <div className="flex justify-between pt-2 border-t border-slate-200"><span className="text-slate-500">Totale in Salone</span><strong className="text-slate-900 font-black">€{finalPrice}</strong></div>
              </div>

              <div className="space-y-2">
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  <CalendarPlus className="w-4 h-4 text-indigo-600" />
                  Salva su Google Calendar
                </a>

                <a
                  href={buildWhatsAppUrl(config.phone, `Ciao! Ho prenotato ${selectedService.name} per il ${selectedDate} alle ${selectedTime}.`, config.country || 'CH')}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Scrivi al Salone su WhatsApp
                </a>
              </div>

              <button
                onClick={() => {
                  setSelectedService(null);
                  setSelectedTime('');
                  setAppliedPromo(null);
                  setStep(1);
                }}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                ← Nuova Prenotazione
              </button>
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. STICKY BOTTOM BAR FISSO IN BASSO (RETTILINEO E MODERNO)    */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'book' && step < 4 && selectedService && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-xl max-w-md mx-auto flex items-center justify-between gap-4 animate-slide-up">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trattamento Selezionato</p>
            <p className="text-xs font-black text-slate-900 truncate max-w-[160px]">{selectedService.name}</p>
            <p className="text-sm font-black text-indigo-600">€{finalPrice}</p>
          </div>

          <div>
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Scegli Ora</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                disabled={!selectedTime}
                onClick={() => setStep(3)}
                className={`px-6 py-3 font-black text-xs rounded-2xl shadow-md transition flex items-center gap-1.5 ${
                  selectedTime 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Procedi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={(e) => {
                  // Trigger form submit
                  const form = document.querySelector('form');
                  if (form) form.requestSubmit();
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Prenota Ora</span>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
