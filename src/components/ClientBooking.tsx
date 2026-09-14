import React, { useState, useMemo, FormEvent } from 'react';
import { Service, Appointment, Client, AppointmentStatus, BusinessConfig, Promotion, WhatsAppCampaign } from '../types';
import { buildWhatsAppUrl } from '../lib/phoneUtils';
import { DateWheelPicker } from '@/components/ui/date-wheel-picker';
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
  Globe,
  Scissors,
  Star,
  User,
  LogOut
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
  // Navigation: 'home' | 'book' | 'promos' | 'my_appointments'
  const [activeTab, setActiveTab] = useState<'home' | 'book' | 'promos' | 'my_appointments'>('home');

  const currency = config.currency || 'CHF';

  // Step: 1 (Servizio) -> 2 (Data & Ora) -> 3 (Dati) -> 4 (Confermato)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // User selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-24');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Date conversion for DateWheelPicker
  const selectedDateObj = useMemo(() => {
    if (!selectedDate) return new Date();
    const parts = selectedDate.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  }, [selectedDate]);

  const handleDateWheelChange = (newDate: Date) => {
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
    setSelectedTime('');
  };
  
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

  // Search in "my appointments"
  const [lookupPhone, setLookupPhone] = useState(() => loggedClientUser?.phone || '');
  const [lookedUpAppointments, setLookedUpAppointments] = useState<Appointment[] | null>(null);

  // Current client record with live loyalty points from clients prop
  const currentClientRecord = useMemo(() => {
    if (!loggedClientUser) return null;
    return clients.find(c => c.id === loggedClientUser.id || c.phone.replace(/\D/g, '') === loggedClientUser.phone.replace(/\D/g, '')) || loggedClientUser;
  }, [loggedClientUser, clients]);

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
      notes: `${notes.trim()}${appliedPromo ? ` [Promo: ${appliedPromo.code} - Sconto ${currency} ${discountAmount}]` : ''}`.trim(),
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
    <div className="max-w-3xl mx-auto min-h-screen bg-[#FAFAFA] text-[#14161A] font-sans pb-32">

      {/* ------------------------------------------------------------- */}
      {/* HEADER CLIENTE (Design System)                                */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E4E6EA] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] bg-[#1450FF] text-white font-bold flex items-center justify-center text-sm font-display">
            {config.name ? config.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[#14161A] leading-tight line-clamp-1 font-display">
              {config.name || 'Salone'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#1450FF]" /> {config.category || 'Salone & Beauty'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loggedClientUser ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-[#E4E6EA] px-3 py-1.5 rounded-[4px] text-xs font-bold text-[#14161A]">
              <User className="w-3.5 h-3.5 text-[#1450FF]" />
              <span>{loggedClientUser.name.split(' ')[0]}</span>
            </div>
          ) : onOpenAuth ? (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 bg-[#1450FF] hover:bg-blue-600 text-white font-bold text-xs rounded-[4px] transition"
            >
              Accedi
            </button>
          ) : null}
        </div>
      </header>

      {/* ============================================================= */}
      {/* VIEW: HOME (CASCA DASHBOARD STYLE)                            */}
      {/* ============================================================= */}
      {activeTab === 'home' && (
        <div className="px-5 pt-5 space-y-6 animate-fade-in">
          
          {/* Greeting & Search */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 font-medium">Buongiorno,</p>
                <h2 className="text-xl font-black text-white tracking-tight">{name || 'Gentile Cliente'} ✨</h2>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#1a1a1e] border border-white/10 flex items-center justify-center text-amber-400 font-bold">
                <Scissors className="w-5 h-5" />
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca trattamento (es. Taglio, Barba)..."
                className="w-full bg-[#1a1a1e] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                onClick={() => setActiveTab('book')}
                readOnly
              />
            </div>
          </div>

          {/* Tessera Fedeltà Cliente Autenticato */}
          {currentClientRecord && (
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-[#1a1a1e] border border-amber-500/30 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black font-black flex items-center justify-center shrink-0 shadow-lg">
                  <Star className="w-6 h-6 fill-black text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-white tracking-tight">Tessera Fedeltà Punti</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-black">
                      {currentClientRecord.loyaltyPoints || 0} Punti
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1">
                    {(currentClientRecord.loyaltyPoints || 0) >= (config.loyaltyRewardThreshold ?? 100) ? (
                      <span className="font-bold text-emerald-400">🎉 Hai raggiunto il premio: {config.loyaltyRewardDescription || '10% di sconto'}! Mostralo in salone.</span>
                    ) : (
                      <span>Mancano <strong className="text-white">{(config.loyaltyRewardThreshold ?? 100) - (currentClientRecord.loyaltyPoints || 0)} punti</strong> al premio: <em className="text-amber-300">{config.loyaltyRewardDescription || '10% di sconto sul prossimo servizio'}</em></span>
                    )}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-40 space-y-1.5">
                <div className="flex justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  <span>Progresso</span>
                  <span>{Math.min(100, Math.round(((currentClientRecord.loyaltyPoints || 0) / (config.loyaltyRewardThreshold ?? 100)) * 100))}%</span>
                </div>
                <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.round(((currentClientRecord.loyaltyPoints || 0) / (config.loyaltyRewardThreshold ?? 100)) * 100))}%` }} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Today's Special Banner (Casca Style 30% Off) */}
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-black shadow-xl relative overflow-hidden">
            <div className="absolute right-[-10px] bottom-[-20px] opacity-15 pointer-events-none">
              <Scissors className="w-36 h-36 text-black" />
            </div>
            <div className="relative z-10 space-y-2">
              <span className="bg-black/20 text-black text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider inline-block">
                Offerta Speciale
              </span>
              <h3 className="text-2xl font-black tracking-tight">Today's Special 30%</h3>
              <p className="text-xs font-semibold text-black/80 max-w-[220px] leading-relaxed">
                Prenota oggi il tuo trattamento preferito e ricevi uno sconto esclusivo immediato.
              </p>
              <button
                onClick={() => {
                  applyPromoCode('BENVENUTO20');
                  setActiveTab('book');
                }}
                className="mt-2 px-5 py-2.5 bg-black text-amber-400 font-extrabold text-xs rounded-2xl shadow-lg hover:bg-neutral-900 transition active:scale-95 inline-flex items-center gap-1.5"
              >
                <span>Riscatta Subito</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Categories Grid (Casca Style) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Categorie Trattamenti</h3>
              <button onClick={() => setActiveTab('book')} className="text-xs font-bold text-amber-400 hover:underline">
                Vedi Tutti
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Haircut', icon: Scissors, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: 'Shave', icon: Sparkles, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { label: 'Make up', icon: Star, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                { label: 'Massage', icon: UserCheck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              ].map((cat, idx) => {
                const IconComp = cat.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveTab('book')}
                    className="bg-[#1a1a1e] border border-white/10 hover:border-amber-500/50 p-3.5 rounded-3xl flex flex-col items-center justify-center gap-2 transition group"
                  >
                    <div className={`w-11 h-11 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center group-hover:scale-110 transition`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-neutral-300">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Featured Services List (Casca UI Nearby Salons / Top Rated) */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Trattamenti in Evidenza</h3>
            <div className="space-y-3">
              {services.slice(0, 3).map(service => (
                <div
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setActiveTab('book');
                    setStep(2);
                  }}
                  className="bg-[#1a1a1e] border border-white/10 hover:border-amber-500/50 p-4 rounded-3xl flex items-center justify-between gap-4 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 font-black flex items-center justify-center text-xs group-hover:bg-amber-500 group-hover:text-black transition px-1 text-center font-mono">
                      {currency} {service.price}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{service.name}</h4>
                      <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-500" /> {service.duration} minuti • Top Rated
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-amber-400 transition">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ============================================================= */}
      {/* VIEW: PROMOS                                                  */}
      {/* ============================================================= */}
      {activeTab === 'promos' && (
        <div className="px-5 pt-5 space-y-4 animate-fade-in">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-black shadow-lg space-y-2">
            <span className="bg-black/20 text-black text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider inline-block">
              Coupon & Sconti Casca
            </span>
            <h2 className="text-xl font-black">Promozioni Attive</h2>
            <p className="text-xs text-black/80">Risparmia sui tuoi trattamenti preferiti applicando i codici sconto.</p>
          </div>

          <div className="space-y-3">
            {allPromos.map(promo => {
              const isApplied = appliedPromo?.code === promo.code;
              return (
                <div
                  key={promo.id}
                  className={`bg-[#1a1a1e] rounded-3xl p-5 border transition space-y-3 ${
                    isApplied ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-amber-500/20">
                      {promo.badge || 'Offerta'}
                    </span>
                    <span className="text-[11px] text-neutral-400">{promo.validUntil}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-white">{promo.title}</h3>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{promo.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-amber-400">
                      {promo.code}
                    </div>
                    <button
                      onClick={() => handleUsePromoAndBook(promo)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-2xl shadow-md transition active:scale-95 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Usa Promo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* VIEW: MY APPOINTMENTS                                         */}
      {/* ============================================================= */}
      {activeTab === 'my_appointments' && (
        <div className="px-5 pt-5 space-y-4 animate-fade-in">
          <div className="bg-[#1a1a1e] p-6 rounded-3xl border border-white/10 shadow-lg space-y-4">
            <div>
              <h2 className="text-lg font-black text-white">I Miei Appuntamenti</h2>
              <p className="text-xs text-neutral-400">Inserisci il tuo numero per verificare o disdire le prenotazioni.</p>
            </div>

            <form onSubmit={handleLookup} className="flex gap-2">
              <input
                type="tel"
                placeholder="es. 333 1234567"
                value={lookupPhone}
                onChange={e => setLookupPhone(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-medium"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-2xl transition shadow-md"
              >
                Cerca
              </button>
            </form>

            {lookedUpAppointments && (
              <div className="space-y-3 pt-2">
                {lookedUpAppointments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-500 bg-black/20 rounded-2xl border border-dashed border-white/10">
                    Nessun appuntamento trovato.
                  </div>
                ) : (
                  lookedUpAppointments.map(app => (
                    <div key={app.id} className="p-4 rounded-2xl border border-white/10 bg-black/30 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-extrabold text-white text-sm">{app.serviceName}</p>
                        <p className="text-neutral-400 text-[11px] mt-0.5">{app.date} • {app.time} ({currency} {app.price})</p>
                      </div>
                      {app.status !== AppointmentStatus.CANCELLED && (
                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(app.id)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-bold text-[11px]"
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
      {/* VIEW: BOOKING FLOW (CASCA UI BOOKING)                         */}
      {/* ============================================================= */}
      {activeTab === 'book' && (
        <div className="px-5 pt-5 space-y-5 animate-fade-in">

          {/* STEP PROGRESS BAR */}
          {step < 4 && (
            <div className="flex items-center justify-between bg-[#1a1a1e] px-5 py-3 rounded-3xl border border-white/10 text-xs font-bold shadow-lg">
              <button 
                onClick={() => setStep(1)}
                className={`flex items-center gap-1.5 ${step === 1 ? 'text-amber-400 font-black' : 'text-neutral-400'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-amber-500 text-black font-black' : 'bg-white/10 text-neutral-400'}`}>1</span>
                <span>Servizio</span>
              </button>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
              <button 
                disabled={!selectedService}
                onClick={() => selectedService && setStep(2)}
                className={`flex items-center gap-1.5 ${step === 2 ? 'text-amber-400 font-black' : selectedService ? 'text-neutral-200' : 'text-neutral-600'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-amber-500 text-black font-black' : 'bg-white/10 text-neutral-400'}`}>2</span>
                <span>Data & Ora</span>
              </button>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
              <button 
                disabled={!selectedTime}
                onClick={() => selectedTime && setStep(3)}
                className={`flex items-center gap-1.5 ${step === 3 ? 'text-amber-400 font-black' : selectedTime ? 'text-neutral-200' : 'text-neutral-600'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-amber-500 text-black font-black' : 'bg-white/10 text-neutral-400'}`}>3</span>
                <span>Conferma</span>
              </button>
            </div>
          )}

          {/* STEP 1: SELECT SERVICE */}
          {step === 1 && (
            <div className="space-y-4">
              {appliedPromo && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 flex items-center justify-between gap-3 text-xs text-amber-300">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Promo attiva: <strong>{appliedPromo.title}</strong></span>
                  </div>
                  <button onClick={() => setAppliedPromo(null)} className="text-amber-400 hover:underline font-bold">
                    Rimuovi
                  </button>
                </div>
              )}

              <div className="bg-[#1a1a1e] p-6 rounded-3xl border border-white/10 shadow-lg space-y-4">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Seleziona Servizio</h2>
                
                <div className="space-y-3">
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
                        className={`p-4 rounded-3xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected 
                            ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/30' 
                            : 'bg-black/30 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-white text-sm">{service.name}</h3>
                          <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" /> {service.duration} min
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            {appliedPromo && displayDiscount > 0 ? (
                              <div>
                                <span className="text-[11px] text-neutral-500 line-through">{currency} {service.price}</span>
                                <span className="block text-sm font-black text-emerald-400">{currency} {discountedServicePrice}</span>
                              </div>
                            ) : (
                              <span className="text-sm font-black text-amber-400">{currency} {service.price}</span>
                            )}
                          </div>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isSelected ? 'bg-amber-500 text-black' : 'bg-white/5 text-neutral-400'}`}>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT DATE & TIME */}
          {step === 2 && selectedService && (
            <div className="bg-[#1a1a1e] p-6 rounded-3xl border border-white/10 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">Data e Orario</h2>
                  <p className="text-xs text-amber-400 font-bold">{selectedService.name} ({currency} {finalPrice})</p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-neutral-400 font-bold hover:text-white flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Indietro
                </button>
              </div>

              {/* Date Wheel Picker */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                    Seleziona Data:
                  </label>
                  <span className="text-xs font-bold text-amber-400 capitalize">
                    {selectedDateObj.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div 
                  className="bg-black/40 border border-white/10 rounded-2xl py-3 px-4 flex justify-center overflow-hidden"
                  style={{ '--wheel-bg': '#141417', '--background': '#141417' } as React.CSSProperties}
                >
                  <DateWheelPicker
                    value={selectedDateObj}
                    onChange={handleDateWheelChange}
                    locale="it-IT"
                    minYear={2026}
                    maxYear={2028}
                    size="md"
                    className="text-white"
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-neutral-300 mb-2">☀️ Mattina</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {morningTimes.map(t => {
                      const isOccupied = occupiedTimes.includes(t);
                      const isSelected = selectedTime === t;
                      return (
                        <button
                          key={t}
                          disabled={isOccupied}
                          onClick={() => handleSelectTime(t)}
                          className={`py-3 rounded-2xl text-xs font-bold border transition ${
                            isOccupied
                              ? 'bg-black/20 text-neutral-600 border-white/5 line-through cursor-not-allowed'
                              : isSelected
                              ? 'bg-amber-500 text-black border-amber-500 shadow-md font-black'
                              : 'bg-black/40 hover:border-amber-500/50 text-neutral-200 border-white/10'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-neutral-300 mb-2">🌤️ Pomeriggio</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {afternoonTimes.map(t => {
                      const isOccupied = occupiedTimes.includes(t);
                      const isSelected = selectedTime === t;
                      return (
                        <button
                          key={t}
                          disabled={isOccupied}
                          onClick={() => handleSelectTime(t)}
                          className={`py-3 rounded-2xl text-xs font-bold border transition ${
                            isOccupied
                              ? 'bg-black/20 text-neutral-600 border-white/5 line-through cursor-not-allowed'
                              : isSelected
                              ? 'bg-amber-500 text-black border-amber-500 shadow-md font-black'
                              : 'bg-black/40 hover:border-amber-500/50 text-neutral-200 border-white/10'
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

          {/* STEP 3: CLIENT DETAILS & CONFIRM */}
          {step === 3 && selectedService && selectedTime && (
            <form onSubmit={handleConfirmBooking} className="bg-[#1a1a1e] p-6 rounded-3xl border border-white/10 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">I tuoi Dati</h2>
                  <p className="text-xs text-neutral-400">{selectedDate} alle {selectedTime}</p>
                </div>
                <button type="button" onClick={() => setStep(2)} className="text-xs text-neutral-400 font-bold hover:text-white flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Modifica
                </button>
              </div>

              {/* Summary card */}
              <div className="bg-black/40 rounded-2xl p-4 text-xs flex items-center justify-between border border-white/10">
                <div>
                  <p className="font-extrabold text-white text-sm">{selectedService.name}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{selectedService.duration} min • Pagamento in salone</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-400">{currency} {finalPrice}</span>
                </div>
              </div>

              {/* Promo input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Codice Promo (es. BENVENUTO20)"
                  value={promoInput}
                  onChange={e => {
                    setPromoInput(e.target.value.toUpperCase());
                    setPromoError(null);
                  }}
                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs uppercase font-mono font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => applyPromoCode(promoInput)}
                  className="px-4 py-3 bg-neutral-800 text-amber-400 font-extrabold text-xs rounded-2xl border border-white/10"
                >
                  Applica
                </button>
              </div>
              {promoError && <p className="text-[11px] text-rose-400 font-medium">{promoError}</p>}
              {appliedPromo && <p className="text-[11px] text-emerald-400 font-bold">✓ Coupon {appliedPromo.code} applicato (-{currency} {discountAmount})</p>}

              {/* Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">Nome e Cognome *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Marco Rossi"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">Cellulare (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="es. 079 123 45 67"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">Note (Opzionale)</label>
                  <input
                    type="text"
                    placeholder="es. richiesta particolare..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2 tracking-wide uppercase"
              >
                <Check className="w-4 h-4" />
                Conferma Prenotazione ({currency} {finalPrice})
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 4 && selectedService && (
            <div className="bg-[#1a1a1e] p-7 rounded-3xl border border-white/10 shadow-xl space-y-6 text-center animate-fade-in">
              <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl font-black text-white">Prenotazione Confermata!</h2>
                <p className="text-xs text-neutral-400">Ti aspettiamo in salone. Riceverai un promemoria WhatsApp.</p>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 text-left text-xs space-y-2.5">
                <div className="flex justify-between"><span className="text-neutral-400">Trattamento</span><strong className="text-white">{selectedService.name}</strong></div>
                <div className="flex justify-between"><span className="text-neutral-400">Data e Ora</span><strong className="text-amber-400">{selectedDate} - {selectedTime}</strong></div>
                <div className="flex justify-between pt-2 border-t border-white/10"><span className="text-neutral-400">Totale in Salone</span><strong className="text-white font-black">{currency} {finalPrice}</strong></div>
              </div>

              <div className="space-y-2.5">
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition"
                >
                  <CalendarPlus className="w-4 h-4 text-amber-400" />
                  Salva su Google Calendar
                </a>

                <a
                  href={buildWhatsAppUrl(config.phone, `Ciao! Ho prenotato ${selectedService.name} per il ${selectedDate} alle ${selectedTime}.`, config.country || 'CH')}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  Scrivi al Salone su WhatsApp
                </a>
              </div>

              <button
                onClick={() => {
                  setSelectedService(null);
                  setSelectedTime('');
                  setAppliedPromo(null);
                  setStep(1);
                  setActiveTab('home');
                }}
                className="text-xs text-amber-400 font-bold hover:underline pt-2"
              >
                ← Torna alla Home
              </button>
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. CASCA BOTTOM NAVIGATION BAR (FIXED BOTTOM)                 */}
      {/* ------------------------------------------------------------- */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#161618]/95 backdrop-blur-md border-t border-white/10 px-6 py-3 max-w-md mx-auto flex items-center justify-between">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'home' ? 'text-amber-400' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <Scissors className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('book')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'book' ? 'text-amber-400' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase">Prenota</span>
        </button>

        <button
          onClick={() => setActiveTab('promos')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'promos' ? 'text-amber-400' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase">Offerte</span>
        </button>

        <button
          onClick={() => setActiveTab('my_appointments')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'my_appointments' ? 'text-amber-400' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase">I Miei</span>
        </button>
      </nav>

    </div>
  );
}
