import React, { useState, useMemo, useEffect, FormEvent } from 'react';
import { Service, Appointment, Client, AppointmentStatus, BusinessConfig } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Send, 
  Sparkles, 
  Lock,
  Wifi,
  Battery,
  Info,
  RefreshCw,
  Search,
  MapPin,
  Phone,
  MessageCircle,
  CalendarPlus,
  Compass,
  User,
  ChevronRight,
  X,
  Share2,
  Check
} from 'lucide-react';

interface ClientBookingProps {
  config: BusinessConfig;
  services: Service[];
  appointments: Appointment[];
  clients: Client[];
  onAddAppointment: (newApp: Appointment) => void;
  onUpdateAppointments: (apps: Appointment[]) => void;
}

// Generate calendar dates for the next 14 days
function generateUpcomingDates(startDateStr = '2026-06-24', daysCount = 14) {
  const dates = [];
  const base = new Date(startDateStr);
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = daysOfWeek[d.getDay()];
    const dayNum = d.getDate();
    const monthName = months[d.getMonth()];
    
    let label = `${dayName} ${dayNum} ${monthName}`;
    let badge = '';
    if (i === 0) badge = 'Oggi';
    else if (i === 1) badge = 'Domani';

    dates.push({
      date: dateStr,
      dayName,
      dayNum,
      monthName,
      label,
      badge,
      isSunday: d.getDay() === 0
    });
  }
  return dates;
}

export default function ClientBooking({
  config,
  services,
  appointments,
  clients,
  onAddAppointment,
  onUpdateAppointments
}: ClientBookingProps) {
  // Navigation: main flow steps
  // 'service' -> 'datetime' -> 'details' -> 'payment' -> 'success' -> 'reschedule'
  const [currentStep, setCurrentStep] = useState<'service' | 'datetime' | 'details' | 'payment' | 'success' | 'reschedule'>('service');
  const [activeClientTab, setActiveClientTab] = useState<'book' | 'my-bookings'>('book');

  // Search & Category Filter for services
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Booking selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-24');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Client details
  const [clientName, setClientName] = useState(() => localStorage.getItem('client_saved_name') || '');
  const [clientPhone, setClientPhone] = useState(() => localStorage.getItem('client_saved_phone') || '');
  const [clientEmail, setClientEmail] = useState(() => localStorage.getItem('client_saved_email') || '');
  const [clientNotes, setClientNotes] = useState('');
  const [paymentChoice, setPaymentChoice] = useState<'SALON' | 'DEPOSIT'>('SALON');

  // Processing & booking outcome
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Self-service "My Bookings" lookup
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResults, setLookupResults] = useState<Appointment[] | null>(null);

  // Alternative slots for automatic rescheduling (Crucial requirement upon cancellation)
  const [alternativeSlots, setAlternativeSlots] = useState<Array<{ date: string; time: string }>>([]);

  // Live WhatsApp/SMS Simulator state
  const [smsLog, setSmsLog] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: "NoShow Reducer",
      text: "Benvenuto nel salone! Prenota in 3 semplici passi. Riceverai conferma istantanea su WhatsApp.",
      time: "Adesso"
    }
  ]);
  const [showSimulatorMobile, setShowSimulatorMobile] = useState(false);

  const addSms = (text: string) => {
    setSmsLog(prev => [{ sender: "WhatsApp Salone", text, time: "Adesso" }, ...prev]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 14-day upcoming dates
  const availableDates = useMemo(() => generateUpcomingDates('2026-06-24', 14), []);

  // Time Slots divided into Morning and Afternoon
  const morningSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'];
  const afternoonSlots = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

  // Check occupied slots for selected date
  const occupiedSlots = useMemo(() => {
    return appointments
      .filter(a => a.date === selectedDate && a.status !== AppointmentStatus.CANCELLED)
      .map(a => a.time);
  }, [appointments, selectedDate]);

  // Derive service categories
  const categories = useMemo(() => {
    return [
      { id: 'ALL', label: 'Tutti i Trattamenti' },
      { id: 'TAGLIO', label: 'Taglio & Styling' },
      { id: 'COLORE', label: 'Colore & Trattamenti' },
      { id: 'BARBA', label: 'Barba & Uomo' },
      { id: 'ESTETICA', label: 'Benessere' }
    ];
  }, []);

  const filteredServices = useMemo(() => {
    return services
      .filter(s => s.isActive)
      .filter(s => {
        const matchesQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (s.description ? s.description.toLowerCase().includes(searchQuery.toLowerCase()) : false);
        if (!matchesQuery) return false;

        if (selectedCategory === 'ALL') return true;
        const nameLower = s.name.toLowerCase();
        if (selectedCategory === 'TAGLIO') return nameLower.includes('taglio') || nameLower.includes('piega') || nameLower.includes('styling');
        if (selectedCategory === 'COLORE') return nameLower.includes('colore') || nameLower.includes('balayage') || nameLower.includes('schiaritura') || nameLower.includes('cheratina');
        if (selectedCategory === 'BARBA') return nameLower.includes('barba') || nameLower.includes('rasatura') || nameLower.includes('uomo');
        if (selectedCategory === 'ESTETICA') return nameLower.includes('manicure') || nameLower.includes('viso') || nameLower.includes('massaggio');
        return true;
      });
  }, [services, searchQuery, selectedCategory]);

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setCurrentStep('datetime');
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
  };

  const handleProceedToDetails = () => {
    if (!selectedTime) {
      showToast('Seleziona un orario per continuare');
      return;
    }
    setCurrentStep('details');
  };

  const handleDetailsSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      showToast('Inserisci nome e numero di cellulare per ricevere la conferma');
      return;
    }

    // Save for next time (remember user feature)
    localStorage.setItem('client_saved_name', clientName.trim());
    localStorage.setItem('client_saved_phone', clientPhone.trim());
    if (clientEmail) localStorage.setItem('client_saved_email', clientEmail.trim());

    if (paymentChoice === 'DEPOSIT' && selectedService?.depositRequired) {
      setCurrentStep('payment');
    } else {
      processBooking(false);
    }
  };

  const processBooking = (paidWithStripe: boolean) => {
    if (!selectedService) return;

    if (paidWithStripe) {
      setIsProcessingStripe(true);
    }

    setTimeout(() => {
      const appKey = 'a_client_' + Date.now();
      
      let deposit = 0;
      if (paidWithStripe && selectedService.depositRequired) {
        if (selectedService.depositType === 'FIXED') {
          deposit = selectedService.depositValue;
        } else {
          deposit = Math.round((selectedService.price * selectedService.depositValue) / 100);
        }
      }

      const newApp: Appointment = {
        id: appKey,
        tenant_id: config.tenant_id,
        clientId: 'c_client_' + Date.now(),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: selectedDate,
        time: selectedTime,
        price: selectedService.price,
        depositPaid: deposit,
        paymentMethod: paidWithStripe ? 'STRIPE_DEPOSIT' : 'IN_SALON',
        status: AppointmentStatus.PENDING,
        notes: clientNotes.trim(),
        reminderSent: true,
        isConfirmedByClient: false,
        stripePaymentId: paidWithStripe ? 'ch_' + Math.random().toString(36).substr(2, 9) : undefined
      };

      onAddAppointment(newApp);
      setCreatedBookingId(appKey);
      setIsProcessingStripe(false);
      setCurrentStep('success');

      const formattedDate = new Date(selectedDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
      const confirmationLink = `https://noshow.reducer/confirm/${appKey}`;
      
      const smsText = config.reminderTemplate
        .replace('{NOME}', clientName)
        .replace('{SERVIZIO}', selectedService.name)
        .replace('{DATA}', formattedDate)
        .replace('{ORA}', selectedTime)
        .replace('{LINK_CONFERMA}', confirmationLink);

      addSms(smsText);
      showToast('Prenotazione registrata! Ricevuto promemoria.');
    }, paidWithStripe ? 1000 : 250);
  };

  const handleClientOneTapConfirm = () => {
    if (!createdBookingId) return;
    const updated = appointments.map(app => {
      if (app.id === createdBookingId) {
        return { ...app, status: AppointmentStatus.CONFIRMED, isConfirmedByClient: true };
      }
      return app;
    });
    onUpdateAppointments(updated);
    addSms(`✓ Presenza confermata per ${selectedService?.name}! Il salone è stato informato in tempo reale.`);
    showToast("Presenza confermata con successo!");
  };

  // Crucial requirement: Upon cancellation, automatically propose 3 alternative available slots to reschedule
  const handleClientCancel = () => {
    if (!createdBookingId) return;
    
    const updated = appointments.map(app => {
      if (app.id === createdBookingId) {
        return { ...app, status: AppointmentStatus.CANCELLED };
      }
      return app;
    });
    onUpdateAppointments(updated);

    // Compute 3 alternative free slots
    const alternatives = [
      { date: '2026-06-25', time: '10:00' },
      { date: '2026-06-25', time: '15:30' },
      { date: '2026-06-26', time: '11:00' }
    ];
    setAlternativeSlots(alternatives);

    addSms("Appuntamento annullato. Abbiamo preparato 3 orari alternativi per riprogrammare con 1 tap.");
    showToast("Appuntamento annullato. Scegli uno dei 3 orari alternativi.");
    setCurrentStep('reschedule');
  };

  const handleSelectAlternativeSlot = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setCurrentStep('details');
    showToast(`Slot selezionato: ${date} alle ${time}. Conferma i tuoi dati.`);
  };

  // Search client appointments
  const handleLookupBookings = (e: FormEvent) => {
    e.preventDefault();
    if (!lookupPhone.trim()) return;
    const cleanPhone = lookupPhone.trim().replace(/\s+/g, '');
    const found = appointments.filter(a => a.clientPhone.replace(/\s+/g, '').includes(cleanPhone));
    setLookupResults(found);
  };

  // Generate Google Calendar Link
  const getGoogleCalendarUrl = () => {
    if (!selectedService) return '#';
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const start = new Date(year, month - 1, day, hours, minutes);
    const end = new Date(start.getTime() + (selectedService.duration || 45) * 60000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatUtc = (d: Date) => 
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    const title = `${selectedService.name} - ${config.name}`;
    const details = `Appuntamento per ${selectedService.name}. Telefono salone: ${config.phone}.`;
    const location = `${config.name}, Salone di Bellezza`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatUtc(start)}/${formatUtc(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  };

  // Download .ics file for Apple Calendar and Outlook
  const downloadIcsFile = () => {
    if (!selectedService) return;
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const start = new Date(year, month - 1, day, hours, minutes);
    const end = new Date(start.getTime() + (selectedService.duration || 45) * 60000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatIcs = (d: Date) => 
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NoShow Reducer//IT',
      'BEGIN:VEVENT',
      `SUMMARY:${selectedService.name} @ ${config.name}`,
      `DESCRIPTION:Appuntamento confermato per ${selectedService.name}. Assistenza: ${config.phone}`,
      `LOCATION:${config.name}`,
      `DTSTART:${formatIcs(start)}`,
      `DTEND:${formatIcs(end)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `appuntamento-${selectedDate}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File calendario scaricato!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" id="client-booking-flow">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-indigo-900 text-white font-semibold text-xs py-3 px-4 rounded-2xl shadow-2xl flex items-center gap-2 border border-indigo-700 animate-bounce">
          <Sparkles className="w-4 h-4 text-indigo-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Salon Hero Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-indigo-200 border border-white/10">
                {config.category || 'Salone di Bellezza'}
              </span>
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Aperto per Prenotazioni
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {config.name}
            </h1>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-indigo-400" /> {config.phone}
              <span className="text-white/40">•</span>
              <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Centro Città
            </p>
          </div>

          {/* Top Switcher: Book vs My Bookings */}
          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md self-start sm:self-center border border-white/10">
            <button
              onClick={() => {
                setActiveClientTab('book');
                if (currentStep === 'success') setCurrentStep('service');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeClientTab === 'book'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Prenota
            </button>
            <button
              onClick={() => setActiveClientTab('my-bookings')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeClientTab === 'my-bookings'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              I Miei Appuntamenti
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SELF-SERVICE "I MIEI APPUNTAMENTI" (LOOKUP & EASY CANCELLATION)    */}
      {/* ========================================================================= */}
      {activeClientTab === 'my-bookings' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              I Miei Appuntamenti
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Inserisci il tuo numero di cellulare per verificare le prenotazioni attive o gestirle in autonomia.
            </p>
          </div>

          <form onSubmit={handleLookupBookings} className="flex flex-col sm:flex-row gap-2.5 max-w-md">
            <input
              type="tel"
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value)}
              placeholder="es. 333 1234567"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition font-medium"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              Cerca Appuntamenti
            </button>
          </form>

          {lookupResults !== null && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              {lookupResults.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Nessun appuntamento trovato con questo numero.
                </div>
              ) : (
                lookupResults.map(app => (
                  <div 
                    key={app.id} 
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{app.serviceName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          app.status === AppointmentStatus.CONFIRMED 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : app.status === AppointmentStatus.CANCELLED
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" /> {app.date} alle {app.time}
                        <span className="text-slate-400">•</span>
                        <span className="font-bold text-slate-800">€{app.price}</span>
                      </p>
                    </div>

                    {app.status !== AppointmentStatus.CANCELLED && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const updated = appointments.map(a => a.id === app.id ? { ...a, status: AppointmentStatus.CANCELLED } : a);
                            onUpdateAppointments(updated);
                            showToast("Appuntamento annullato con successo");
                            setLookupResults(updated.filter(a => a.clientPhone.includes(lookupPhone.trim())));
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition"
                        >
                          Disdici
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SMOOTH 3-STEP BOOKING FLOW                                         */}
      {/* ========================================================================= */}
      {activeClientTab === 'book' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Booking Workspace */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Elegant 3-Step Breadcrumbs */}
            {currentStep !== 'success' && currentStep !== 'reschedule' && (
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Step 1 Pill */}
                  <button
                    onClick={() => setCurrentStep('service')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      currentStep === 'service'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : selectedService
                        ? 'text-indigo-600 hover:bg-indigo-50'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white/20 text-current flex items-center justify-center text-[10px]">1</span>
                    <span className="hidden sm:inline">Trattamento</span>
                  </button>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

                  {/* Step 2 Pill */}
                  <button
                    disabled={!selectedService}
                    onClick={() => selectedService && setCurrentStep('datetime')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      currentStep === 'datetime'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : selectedTime
                        ? 'text-indigo-600 hover:bg-indigo-50'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white/20 text-current flex items-center justify-center text-[10px]">2</span>
                    <span className="hidden sm:inline">Data & Ora</span>
                  </button>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

                  {/* Step 3 Pill */}
                  <button
                    disabled={!selectedService || !selectedTime}
                    onClick={() => selectedService && selectedTime && setCurrentStep('details')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      currentStep === 'details' || currentStep === 'payment'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white/20 text-current flex items-center justify-center text-[10px]">3</span>
                    <span className="hidden sm:inline">Conferma</span>
                  </button>
                </div>

                {currentStep !== 'service' && (
                  <button
                    onClick={() => {
                      if (currentStep === 'datetime') setCurrentStep('service');
                      else if (currentStep === 'details') setCurrentStep('datetime');
                      else if (currentStep === 'payment') setCurrentStep('details');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Indietro
                  </button>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 1: SERVICE SELECTION WITH CLEAN SEARCH & CATEGORY PILLS  */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 'service' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-950">1. Scegli il tuo Trattamento</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Seleziona uno o più trattamenti professionali.</p>
                  </div>

                  {/* Search bar */}
                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cerca trattamento..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                        selectedCategory === cat.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Services Grid / List */}
                <div className="space-y-3 pt-2">
                  {filteredServices.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                      Nessun servizio corrisponde ai criteri di ricerca.
                    </div>
                  ) : (
                    filteredServices.map(service => {
                      const isSelected = selectedService?.id === service.id;
                      return (
                        <div
                          key={service.id}
                          onClick={() => handleSelectService(service)}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-1 ring-indigo-500'
                              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 bg-white'
                          }`}
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-indigo-600 transition">
                                {service.name}
                              </h4>
                              {service.depositRequired && (
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                                  Acconto Opzionale
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                              {service.description || 'Trattamento professionale curato nei minimi dettagli per la cura della tua persona.'}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 font-medium">
                              <span className="flex items-center gap-1 text-slate-600">
                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                {service.duration} min
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                            <div className="text-base sm:text-xl font-extrabold text-slate-950">
                              €{service.price}
                            </div>
                            <button
                              type="button"
                              className={`mt-1 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700'
                              }`}
                            >
                              {isSelected ? 'Selezionato ✓' : 'Scegli →'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 2: HORIZONTAL DATE CAROUSEL + MORNING/AFTERNOON SLOTS    */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 'datetime' && selectedService && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                
                <div>
                  <h3 className="text-lg font-extrabold text-slate-950">2. Scegli Giorno e Orario</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Servizio selezionato: <strong className="text-slate-800">{selectedService.name}</strong> ({selectedService.duration} min • €{selectedService.price})
                  </p>
                </div>

                {/* Horizontal Date Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Seleziona Data:</label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {availableDates.map(item => {
                      const isSelected = selectedDate === item.date;
                      return (
                        <button
                          key={item.date}
                          onClick={() => {
                            setSelectedDate(item.date);
                            setSelectedTime('');
                          }}
                          className={`flex-shrink-0 w-20 py-3 rounded-2xl text-center border transition flex flex-col items-center justify-center gap-0.5 relative ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : item.isSunday
                              ? 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.badge && (
                            <span className={`absolute -top-1.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
                              isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          <span className="text-[11px] font-bold uppercase">{item.dayName}</span>
                          <span className="text-base font-extrabold">{item.dayNum}</span>
                          <span className="text-[10px] opacity-80">{item.monthName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Available Time Slots grouped by Morning & Afternoon */}
                <div className="space-y-5 pt-2">
                  {/* Morning Section */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <span className="p-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-200">☀️</span>
                      <span>Mattina (09:00 - 12:30)</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {morningSlots.map(time => {
                        const isOccupied = occupiedSlots.includes(time);
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            disabled={isOccupied}
                            onClick={() => handleSelectTime(time)}
                            className={`py-3 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center gap-0.5 ${
                              isOccupied
                                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-102'
                                : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400 hover:bg-white'
                            }`}
                          >
                            <span>{time}</span>
                            <span className={`text-[9px] font-normal ${isSelected ? 'text-white/80' : isOccupied ? 'text-slate-400' : 'text-emerald-600'}`}>
                              {isOccupied ? 'Occupato' : 'Libero'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Afternoon Section */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-200">🌤️</span>
                      <span>Pomeriggio (14:00 - 18:00)</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {afternoonSlots.map(time => {
                        const isOccupied = occupiedSlots.includes(time);
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            disabled={isOccupied}
                            onClick={() => handleSelectTime(time)}
                            className={`py-3 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center gap-0.5 ${
                              isOccupied
                                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-102'
                                : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400 hover:bg-white'
                            }`}
                          >
                            <span>{time}</span>
                            <span className={`text-[9px] font-normal ${isSelected ? 'text-white/80' : isOccupied ? 'text-slate-400' : 'text-emerald-600'}`}>
                              {isOccupied ? 'Occupato' : 'Libero'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Continue button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {selectedTime ? (
                      <span className="text-indigo-700 font-bold">
                        Data scelta: {selectedDate} alle {selectedTime}
                      </span>
                    ) : (
                      'Tocca un orario verde libero per continuare'
                    )}
                  </div>
                  <button
                    disabled={!selectedTime}
                    onClick={handleProceedToDetails}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-2"
                  >
                    Continua ai Dati →
                  </button>
                </div>

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 3: CLIENT DETAILS & SECURE REASSURING PAYMENT PREFERENCE */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 'details' && selectedService && (
              <form onSubmit={handleDetailsSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                
                <div>
                  <h3 className="text-lg font-extrabold text-slate-950">3. I tuoi Dati & Conferma</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Riceverai il promemoria istantaneo via WhatsApp e SMS per confermare con 1 tap.
                  </p>
                </div>

                {/* Contact Fields */}
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Nome e Cognome *</label>
                    <input
                      type="text"
                      required
                      placeholder="es. Marco Rossi"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-800">Cellulare per WhatsApp *</label>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-emerald-500" /> Promemoria gratis
                        </span>
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="es. 333 1234567"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Email (Opzionale)</label>
                      <input
                        type="email"
                        placeholder="tua-email@esempio.it"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Note o preferenze speciali (Opzionale)</label>
                    <textarea
                      rows={2}
                      placeholder="Es. allergie a prodotti, preferenze colore..."
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition text-xs"
                    />
                  </div>
                </div>

                {/* Reassuring Payment Selection */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-950 text-xs">
                      Modalità di Pagamento & Saldo
                    </label>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Nessuna carta obbligatoria
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: In Salon (Recommended Default) */}
                    <div
                      onClick={() => setPaymentChoice('SALON')}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                        paymentChoice === 'SALON'
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="paymentChoice"
                            checked={paymentChoice === 'SALON'}
                            onChange={() => setPaymentChoice('SALON')}
                            className="accent-indigo-600 cursor-pointer"
                          />
                          <span className="font-bold text-slate-900 text-xs">Paga in Salone (0€ Adesso)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 pl-5 leading-relaxed">
                          Conferma immediata senza carta di credito. Salderai l'intero importo (€{selectedService.price}) all'arrivo in salone.
                        </p>
                      </div>
                      <span className="text-[10px] text-indigo-700 font-bold mt-2.5 pl-5 flex items-center gap-1">
                        ✓ Consigliato • Senza attese
                      </span>
                    </div>

                    {/* Option 2: Online Deposit */}
                    <div
                      onClick={() => setPaymentChoice('DEPOSIT')}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                        paymentChoice === 'DEPOSIT'
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="paymentChoice"
                            checked={paymentChoice === 'DEPOSIT'}
                            onChange={() => setPaymentChoice('DEPOSIT')}
                            className="accent-emerald-600 cursor-pointer"
                          />
                          <span className="font-bold text-slate-900 text-xs">Anticipa Acconto Online</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 pl-5 leading-relaxed">
                          Facoltativo: versa un acconto di {selectedService.depositType === 'FIXED' ? `€${selectedService.depositValue}` : `€${Math.round((selectedService.price * selectedService.depositValue) / 100)}`} con carta/Stripe per bloccare lo slot.
                        </p>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold mt-2.5 pl-5 flex items-center gap-1">
                        🔒 Pagamento Sicuro Stripe
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition active:scale-98 flex items-center justify-center gap-2 text-xs"
                >
                  {paymentChoice === 'DEPOSIT' && selectedService.depositRequired ? (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Procedi al Pagamento dell'Acconto ({selectedService.depositType === 'FIXED' ? `€${selectedService.depositValue}` : `€${Math.round((selectedService.price * selectedService.depositValue) / 100)}`}) →
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Conferma Prenotazione Gratuita (Paga €{selectedService.price} in Salone)
                    </>
                  )}
                </button>

              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 4: OPTIONAL STRIPE DEPOSIT PAYMENT                       */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 'payment' && selectedService && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in text-xs">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    Versamento Acconto Opzionale
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Elaborato tramite connessione crittografata Stripe.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Trattamento: {selectedService.name}</span>
                    <span className="font-bold">€{selectedService.price}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-950 text-sm">
                    <span>Acconto richiesto adesso:</span>
                    <span className="text-emerald-700">
                      {selectedService.depositType === 'FIXED' ? `€${selectedService.depositValue}` : `€${Math.round((selectedService.price * selectedService.depositValue) / 100)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Saldo da corrispondere in salone:</span>
                    <span>
                      €{selectedService.price - (selectedService.depositType === 'FIXED' ? selectedService.depositValue : Math.round((selectedService.price * selectedService.depositValue) / 100))}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={() => processBooking(true)}
                    disabled={isProcessingStripe}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition text-xs"
                  >
                    {isProcessingStripe ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Transazione sicura in corso...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Paga Acconto ({selectedService.depositType === 'FIXED' ? `€${selectedService.depositValue}` : `€${Math.round((selectedService.price * selectedService.depositValue) / 100)}`}) e Blocca Slot
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => processBooking(false)}
                    disabled={isProcessingStripe}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl border border-slate-200 transition text-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                    Cambia idea e Paga in Salone (0€ anticipo)
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 5: SUCCESS WITH APPLE/GOOGLE CALENDAR & WHATSAPP ACTIONS */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 'success' && selectedService && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-center animate-fade-in">
                
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-2xl font-extrabold text-slate-950">Prenotazione Confermata!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Ti aspettiamo in salone per <strong className="text-slate-950">{selectedService.name}</strong>. Abbiamo inviato il promemoria al tuo numero.
                  </p>
                </div>

                {/* Highlighted Appointment Pass Card */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-3xl text-left max-w-md mx-auto shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <p className="text-[10px] text-indigo-300 uppercase tracking-wider font-bold">Salone</p>
                      <p className="font-extrabold text-sm">{config.name}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                      {paymentChoice === 'DEPOSIT' && selectedService.depositRequired ? 'Acconto Versato' : 'Paga in Sede'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] text-white/60">Data & Ora</p>
                      <p className="font-bold text-sm text-white">{selectedDate}</p>
                      <p className="font-bold text-xs text-indigo-300">Ore {selectedTime}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/60">Trattamento</p>
                      <p className="font-bold text-sm text-white">{selectedService.name}</p>
                      <p className="text-xs text-white/70">{selectedService.duration} min • €{selectedService.price}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 text-[11px] text-white/80 flex items-center justify-between">
                    <span>Cliente: <strong>{clientName}</strong></span>
                    <span>Tel: <strong>{clientPhone}</strong></span>
                  </div>
                </div>

                {/* 1-Click Calendar & Map Shortcuts */}
                <div className="space-y-2.5 max-w-md mx-auto">
                  <p className="text-xs font-bold text-slate-800 text-left">Salva o condividi l'appuntamento:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href={getGoogleCalendarUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-xs font-bold text-slate-800 flex items-center justify-center gap-2 transition"
                    >
                      <CalendarPlus className="w-4 h-4 text-indigo-600" />
                      Google Calendar
                    </a>

                    <button
                      type="button"
                      onClick={downloadIcsFile}
                      className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-xs font-bold text-slate-800 flex items-center justify-center gap-2 transition"
                    >
                      <CalendarIcon className="w-4 h-4 text-slate-700" />
                      Apple / Outlook (.ics)
                    </button>
                  </div>

                  <a
                    href={`https://wa.me/39${config.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Ciao! Ho appena prenotato per ${selectedService.name} il ${selectedDate} alle ${selectedTime}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-center gap-2 transition"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    Apri Chat WhatsApp con il Salone
                  </a>
                </div>

                {/* Client Sandbox Actions Simulator */}
                <div className="bg-indigo-50/60 border border-indigo-100 p-5 rounded-3xl max-w-md mx-auto text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Test Interazione Cliente
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                      Simulazione No-Show
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleClientOneTapConfirm}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Conferma Presenza
                    </button>

                    <button
                      onClick={handleClientCancel}
                      className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      Annulla / Disdici
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedService(null);
                      setSelectedTime('');
                      setCurrentStep('service');
                    }}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    ← Effettua un'altra prenotazione
                  </button>
                </div>

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 6: AUTOMATIC RESCHEDULING UPON CANCELLATION (3 SLOTS)    */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 'reschedule' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in text-slate-800">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-950">Appuntamento Annullato</h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Non perdere il trattamento! Ti proponiamo <strong className="font-bold">3 slot alternativi</strong> liberi nei prossimi giorni:
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Seleziona uno dei 3 orari alternativi:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {alternativeSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectAlternativeSlot(slot.date, slot.time)}
                        className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-left transition space-y-1.5 group shadow-xs"
                      >
                        <div className="text-[10px] uppercase font-extrabold text-indigo-600">Alternativa #{index + 1}</div>
                        <div className="font-bold text-slate-900 text-sm">{slot.date}</div>
                        <div className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          Ore {slot.time}
                        </div>
                        <div className="text-[10px] text-indigo-600 font-bold pt-1 group-hover:translate-x-1 transition">
                          Riprenota Ora →
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setSelectedService(null);
                      setCurrentStep('service');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Torna al menu dei servizi
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ============================================================= */}
          {/* RIGHT COLUMN: BOOKING SUMMARY PASS & SMARTPHONE SIMULATOR    */}
          {/* ============================================================= */}
          <div className="space-y-6">
            
            {/* Booking Summary Box */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                Riepilogo Selezione
              </h4>

              {selectedService ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900">{selectedService.name}</p>
                      <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" /> {selectedService.duration} minuti
                      </p>
                    </div>
                    <span className="font-extrabold text-slate-950 text-sm">€{selectedService.price}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Data:</span>
                      <strong className="text-slate-800">{selectedDate}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Orario:</span>
                      <strong className="text-slate-800">{selectedTime || 'Da selezionare'}</strong>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-extrabold text-slate-950">
                    <span>Totale:</span>
                    <span className="text-base text-indigo-600">€{selectedService.price}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  Nessun trattamento selezionato. Scegline uno dall'elenco.
                </div>
              )}
            </div>

            {/* Smartphone Simulator Preview */}
            <div className="flex flex-col items-center">
              <div className="w-full max-w-[280px] bg-slate-900 border-[6px] border-slate-800 rounded-[36px] shadow-xl relative overflow-hidden flex flex-col h-[460px]">
                
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-20 bg-slate-800 rounded-b-xl z-50"></div>

                {/* Status bar */}
                <div className="bg-slate-950/90 px-4 pt-4 pb-1.5 flex items-center justify-between text-[8px] font-semibold text-white/80 z-30">
                  <span>09:41</span>
                  <div className="flex items-center gap-1">
                    <Wifi className="w-2.5 h-2.5" />
                    <Battery className="w-3 h-3" />
                  </div>
                </div>

                {/* Header */}
                <div className="bg-slate-950/80 border-b border-white/5 py-2 px-3 flex items-center gap-2 z-20 text-white">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-bold">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold">WhatsApp Salone</p>
                    <p className="text-[7px] text-emerald-400">Notifiche e Promemoria Live</p>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 bg-slate-950 flex flex-col-reverse justify-start text-white text-[9px]">
                  {smsLog.map((sms, idx) => (
                    <div key={idx} className="space-y-0.5 animate-fade-in">
                      <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tl-none p-2.5 shadow-sm space-y-1">
                        <p className="leading-relaxed text-slate-100">{sms.text}</p>
                        <span className="text-[7px] text-white/40 block text-right font-mono">{sms.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 mt-2 text-center italic">
                Simulatore notifiche WhatsApp/SMS inviate al cliente.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE FLOATING STICKY ACTION BAR (SMARTPHONE BOOKING EXPERIENCE)         */}
      {/* ========================================================================= */}
      {selectedService && currentStep !== 'success' && currentStep !== 'reschedule' && activeClientTab === 'book' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 shadow-2xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{selectedService.name}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {selectedTime ? `${selectedDate} alle ${selectedTime}` : 'Scegli data e orario'} • <strong>€{selectedService.price}</strong>
            </p>
          </div>

          <button
            onClick={() => {
              if (currentStep === 'service') setCurrentStep('datetime');
              else if (currentStep === 'datetime') handleProceedToDetails();
            }}
            disabled={currentStep === 'datetime' && !selectedTime}
            className="flex-shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
          >
            {currentStep === 'service' ? 'Continua →' : currentStep === 'datetime' ? 'Dati e Saldo →' : 'Conferma'}
          </button>
        </div>
      )}

    </div>
  );
}
