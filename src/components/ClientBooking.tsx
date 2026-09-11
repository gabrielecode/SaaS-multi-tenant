import { useState, useMemo, FormEvent } from 'react';
import { Service, Appointment, Client, AppointmentStatus, BusinessConfig } from '../types';
import { 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Send, 
  Sparkles, 
  AlertOctagon,
  Lock,
  Wifi,
  Battery,
  Smartphone,
  Info
} from 'lucide-react';

interface ClientBookingProps {
  config: BusinessConfig;
  services: Service[];
  appointments: Appointment[];
  clients: Client[];
  onAddAppointment: (newApp: Appointment) => void;
  onUpdateAppointments: (apps: Appointment[]) => void;
}

export default function ClientBooking({
  config,
  services,
  appointments,
  clients,
  onAddAppointment,
  onUpdateAppointments
}: ClientBookingProps) {
  // Navigation states: 'landing' | 'service' | 'datetime' | 'details' | 'payment' | 'success'
  const [step, setStep] = useState<'landing' | 'service' | 'datetime' | 'details' | 'payment' | 'success'>('landing');

  // Custom Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Booking details chosen by client
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-24');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // Stripe card state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);

  // Active created booking ID
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Sandbox notifications log
  const [smsLog, setSmsLog] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: "NoShow Reducer",
      text: "Benvenuto nel portale clienti. Questo pannello simula i messaggi SMS inviati in tempo reale.",
      time: "Adesso"
    }
  ]);

  const addSms = (text: string) => {
    setSmsLog(prev => [{ sender: "NoShow Reducer", text, time: "Adesso" }, ...prev]);
  };

  // Generate date slots for next 3 days
  const dateOptions = [
    { date: '2026-06-24', label: 'Oggi' },
    { date: '2026-06-25', label: 'Domani' },
    { date: '2026-06-26', label: 'Dopodomani' }
  ];

  // List of standard slots and availability calculation
  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  // Identify which slots are occupied
  const occupiedSlots = useMemo(() => {
    return appointments
      .filter(a => a.date === selectedDate && a.status !== AppointmentStatus.CANCELLED)
      .map(a => a.time);
  }, [appointments, selectedDate]);

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setStep('datetime');
  };

  const handleSelectDateTime = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep('details');
  };

  const handleDetailsSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;

    // Check if service needs payment
    if (selectedService?.depositRequired) {
      setStep('payment');
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
      
      // Calculate deposit
      let deposit = 0;
      if (selectedService.depositRequired) {
        if (selectedService.depositType === 'FIXED') {
          deposit = selectedService.depositValue;
        } else {
          deposit = Math.round((selectedService.price * selectedService.depositValue) / 100);
        }
      }

      const newApp: Appointment = {
        id: appKey,
        clientId: 'c_client_' + Date.now(),
        clientName,
        clientPhone,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: selectedDate,
        time: selectedTime,
        price: selectedService.price,
        depositPaid: deposit,
        status: AppointmentStatus.PENDING, // client bookings are pending confirmation
        notes: clientNotes,
        reminderSent: true,
        isConfirmedByClient: false,
        stripePaymentId: paidWithStripe ? 'ch_' + Math.random().toString(36).substr(2, 9) : undefined
      };

      onAddAppointment(newApp);
      setCreatedBookingId(appKey);
      setIsProcessingStripe(false);
      setStep('success');

      // Trigger automatic simulated SMS
      const formattedDate = new Date(selectedDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
      const confirmationLink = `https://noshow.reducer/confirm/${appKey}`;
      
      const smsText = config.reminderTemplate
        .replace('{NOME}', clientName)
        .replace('{SERVIZIO}', selectedService.name)
        .replace('{DATA}', formattedDate)
        .replace('{ORA}', selectedTime)
        .replace('{LINK_CONFERMA}', confirmationLink);

      addSms(smsText);
    }, paidWithStripe ? 1500 : 300);
  };

  // Client triggers simulated One-tap confirm
  const handleClientOneTapConfirm = () => {
    if (!createdBookingId) return;
    const updated = appointments.map(app => {
      if (app.id === createdBookingId) {
        return { ...app, status: AppointmentStatus.CONFIRMED, isConfirmedByClient: true };
      }
      return app;
    });
    onUpdateAppointments(updated);
    addSms(`Notifica NoShow Reducer: Presenza confermata per ${selectedService?.name} in data ${selectedDate} alle ${selectedTime}! Il salone è stato informato.`);
    showToast("Presenza confermata con successo! Il titolare ha ricevuto la conferma sulla sua dashboard.");
  };

  // Client triggers simulated Cancellation
  const handleClientCancel = () => {
    if (!createdBookingId) return;
    
    // Check cancellation policy
    // Our target date is selectedDate, today is 2026-06-24. Let's assume it's cancellation within policy
    const updated = appointments.map(app => {
      if (app.id === createdBookingId) {
        return { ...app, status: AppointmentStatus.CANCELLED };
      }
      return app;
    });
    onUpdateAppointments(updated);

    if (selectedService?.depositRequired) {
      addSms(`Notifica NoShow Reducer: Il tuo appuntamento è stato annullato. La caparra di ${selectedService.depositType === 'FIXED' ? `${selectedService.depositValue}€` : `${Math.round((selectedService.price * selectedService.depositValue) / 100)}€`} è stata rimborsata sulla tua carta.`);
      showToast("Appuntamento annullato. La caparra è stata rimborsata in conformità con la policy.");
    } else {
      addSms("Notifica NoShow Reducer: Il tuo appuntamento è stato annullato.");
      showToast("Appuntamento annullato.");
    }
    setStep('landing');
  };

  // Back actions
  const goBack = () => {
    if (step === 'datetime') setStep('service');
    else if (step === 'details') setStep('datetime');
    else if (step === 'payment') setStep('details');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative" id="client-booking-flow">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-600 border border-indigo-500 text-white font-bold text-xs py-3.5 px-5 rounded-2xl shadow-2xl animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 fill-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Booking Wizard Panel */}
      <div className="lg:col-span-2 glass-card rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        
        {/* Step Header */}
        {step !== 'landing' && step !== 'success' && (
          <div className="flex items-center gap-3">
            <button 
              onClick={goBack} 
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Torna allo step precedente
            </span>
          </div>
        )}

        {/* --- LANDING / START BOOKING --- */}
        {step === 'landing' && (
          <div className="space-y-6 text-center py-6 animate-fade-in">
            <div className="space-y-2">
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                {config.category}
              </span>
              <h3 className="text-2xl font-bold text-slate-950">{config.name}</h3>
              <p className="text-slate-500 text-xs md:text-sm max-w-md mx-auto font-medium">
                Seleziona uno dei nostri trattamenti esclusivi per prenotare il tuo slot. È richiesta una caparra online per determinati servizi.
              </p>
            </div>

            <div className="border border-slate-200 divide-y divide-slate-200 rounded-2xl overflow-hidden max-w-md mx-auto bg-white">
              {services.filter(s => s.isActive).map(service => (
                <div key={service.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition text-left">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-950">{service.name}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 font-semibold">
                      <span className="flex items-center gap-0.5"><Clock className="w-3 h-3 text-slate-400" /> {service.duration} min</span>
                      <span className="font-bold text-slate-900">{service.price} €</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectService(service)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-md hover:shadow-lg"
                  >
                    Scegli →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SELECT DATE & TIME --- */}
        {step === 'datetime' && selectedService && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h4 className="text-lg font-bold text-slate-950">Seleziona Data & Orario</h4>
              <p className="text-xs text-slate-500 mt-0.5">Trattamento: <span className="font-bold text-slate-800">{selectedService.name}</span></p>
            </div>

            {/* Date Selector */}
            <div className="grid grid-cols-3 gap-2">
              {dateOptions.map(opt => (
                <button
                  key={opt.date}
                  onClick={() => setSelectedDate(opt.date)}
                  className={`p-3 rounded-lg border text-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                    selectedDate === opt.date
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{opt.label}</p>
                  <p className="text-xs font-semibold mt-1">
                    {new Date(opt.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </p>
                </button>
              ))}
            </div>

            {/* Time Slot Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">Orari Disponibili</label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(time => {
                  const isTaken = occupiedSlots.includes(time);
                  return (
                    <button
                      key={time}
                      disabled={isTaken}
                      onClick={() => handleSelectDateTime(selectedDate, time)}
                      className={`p-2.5 rounded-lg text-xs font-semibold text-center border transition-all duration-200 ${
                        isTaken
                          ? 'bg-slate-50 border-slate-150 text-slate-300 cursor-not-allowed'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 hover:-translate-y-0.5 active:scale-95'
                      }`}
                    >
                      {time}
                      {isTaken && <p className="text-[8px] font-bold opacity-60 text-slate-300">Occupato</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- CLIENT DETAILS --- */}
        {step === 'details' && selectedService && (
          <form onSubmit={handleDetailsSubmit} className="space-y-4 animate-fade-in text-slate-800">
            <div>
              <h4 className="text-lg font-bold text-slate-950">I tuoi Dati di Contatto</h4>
              <p className="text-xs text-slate-500 mt-0.5">Ti invieremo un promemoria SMS di conferma 24 ore prima dell'inizio.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome e Cognome *</label>
                <input
                  type="text"
                  required
                  placeholder="Inserisci il tuo nome..."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-955 text-xs rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cellulare *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+39 340..."
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-955 text-xs rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email (Opzionale)</label>
                  <input
                    type="email"
                    placeholder="tua@email.it"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-955 text-xs rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note o richieste particolari (Opzionale)</label>
                <textarea
                  rows={2}
                  placeholder="Scrivi qui eventuali note..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-955 text-xs rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] shadow-md hover:shadow-lg"
            >
              {selectedService.depositRequired ? 'Procedi al Deposito Protetto →' : 'Conferma Appuntamento Gratis'}
            </button>
          </form>
        )}

        {/* --- STRIPE DEPOSIT PAYMENT SHEET --- */}
        {step === 'payment' && selectedService && (
          <div className="space-y-5 animate-fade-in text-slate-800">
            <div>
              <h4 className="text-lg font-bold text-slate-950 flex items-center gap-1.5">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Deposito Protetto Stripe Connect
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">La caparra viene versata per proteggere la prenotazione del professionista.</p>
            </div>

            {/* Price review summary */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Servizio: {selectedService.name}</span>
                <span className="font-bold text-slate-950">{selectedService.price} €</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-slate-950 font-bold">
                <span>Totale Caparra da pagare subito:</span>
                <span className="text-emerald-700 text-sm font-extrabold">
                  {selectedService.depositType === 'PERCENTAGE' 
                    ? `${Math.round((selectedService.price * selectedService.depositValue) / 100)} €`
                    : `${selectedService.depositValue} €`}
                </span>
              </div>
            </div>

            {/* Policy warning */}
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-rose-950">
                <p className="font-bold">Policy di Cancellazione No-Show</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Puoi cancellare l'appuntamento gratuitamente fino a {config.cancellationPolicyHours} ore prima dell'inizio. Oltre questo termine, l'acconto versato verrà trattenuto a titolo di penale per risarcire il professionista.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                Pagamento Sicuro via Stripe Connect
              </h4>
              <p className="text-[11px] text-slate-500">
                La caparra confirmatoria garantisce il tuo appuntamento ed è interamente rimborsabile secondo le policy del salone.
              </p>
            </div>

            {/* Price review summary */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Trattamento selezionato:</span>
                <span className="font-semibold text-slate-950">{selectedService.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Costo totale servizio:</span>
                <span className="font-semibold text-slate-950">{selectedService.price} €</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-slate-950 font-bold">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  Caparra da versare subito:
                </span>
                <span className="text-emerald-700 text-sm font-extrabold">
                  {selectedService.depositType === 'PERCENTAGE' 
                    ? `${Math.round((selectedService.price * selectedService.depositValue) / 100)} €`
                    : `${selectedService.depositValue} €`}
                </span>
              </div>
            </div>

            {/* Policy warning */}
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-rose-950">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-800">Termini di Cancellazione</p>
                <p className="text-[10px] text-rose-700 mt-0.5 leading-relaxed">
                  Disdetta gratuita fino a {config.cancellationPolicyHours} ore prima dell'inizio. Successivamente, l'acconto verrà trattenuto come compensazione.
                </p>
              </div>
            </div>

            {/* Simulated credit card fields - Stripe Elements Style */}
            <div className="border border-slate-200 p-5 rounded-2xl bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Stripe Sandbox Mode
                </span>
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-mono">
                  Crittografia AES-256
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Numero Carta</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-950 text-xs rounded-lg p-3 pl-11 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 font-mono"
                  />
                  <CreditCard className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <div className="absolute right-3.5 top-3 flex gap-1">
                    <span className="text-[9px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">VISA</span>
                    <span className="text-[9px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">MC</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Scadenza</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-950 text-xs rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 font-mono"
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">CVC / CVV</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-950 text-xs rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 font-mono"
                    placeholder="123"
                  />
                </div>
              </div>

              <p className="text-[9px] text-slate-400 text-center flex items-center justify-center gap-1 pt-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                I dettagli della carta vengono elaborati in modo sicuro da Stripe.
              </p>
            </div>

            <button
              onClick={() => processBooking(true)}
              disabled={isProcessingStripe}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isProcessingStripe ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Elaborazione transazione Stripe...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-white stroke-[2.5]" />
                  Paga Caparra e Conferma Appuntamento
                </>
              )}
            </button>
          </div>
        )}

        {/* --- BOOKING SUCCESS SCREEN --- */}
        {step === 'success' && selectedService && (
          <div className="space-y-6 text-center py-8 animate-fade-in">
            <div className="space-y-3">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-950">Richiesta Inviata!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed font-medium">
                La tua prenotazione per il <span className="font-bold text-slate-900">{selectedService.name}</span> in data <span className="font-bold text-slate-900">{new Date(selectedDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span> alle <span className="font-bold text-slate-900">{selectedTime}</span> è stata registrata.
              </p>
            </div>

            {/* Sandbox triggers to simulate customer side */}
            <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl text-left max-w-md mx-auto space-y-4">
              <div className="border-b border-slate-200 pb-2.5">
                <p className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 fill-indigo-600/10" />
                  Simulatore Interazione Cliente
                </p>
                <p className="text-[10px] text-indigo-700 mt-1 font-semibold">
                  Usa questi pulsanti per simulare il comportamento del cliente quando clicca sul link presente nell'SMS ricevuto.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={handleClientOneTapConfirm}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] shadow-md hover:shadow-lg"
                >
                  Conferma Presenza (OK)
                </button>
                <button
                  onClick={handleClientCancel}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] border border-rose-200"
                >
                  Annulla Appuntamento
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedService(null);
                setStep('landing');
              }}
              className="text-xs text-indigo-600 font-bold hover:text-indigo-700 transition-colors inline-flex items-center gap-1.5"
            >
              ← Effettua un'altra prenotazione
            </button>
          </div>
        )}

      </div>

      {/* High-Fidelity iOS/Android Smartphone Simulator Box */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-[320px] bg-slate-900 border-[6px] border-slate-800 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col h-[520px] ring-1 ring-white/10">
          
          {/* Smartphone Camera Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-28 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
            <span className="w-2.5 h-2.5 bg-slate-900 rounded-full"></span>
          </div>

          {/* Smartphone Top Status Bar */}
          <div className="bg-slate-950/80 px-5 pt-6 pb-2 flex items-center justify-between text-[9px] font-semibold text-white/80 select-none z-30">
            <span>09:41</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[7px] font-bold tracking-widest">5G</span>
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Smartphone Messenger Header */}
          <div className="bg-slate-950/60 border-b border-white/5 py-2.5 px-4 flex items-center gap-2.5 z-20">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300">
              NR
            </div>
            <div>
              <p className="text-[10px] font-bold text-white">NoShow Reducer</p>
              <p className="text-[8px] text-emerald-400 flex items-center gap-1">
                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
                Invia messaggi automatici
              </p>
            </div>
          </div>

          {/* Phone Screen Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col-reverse justify-start scrollbar-thin">
            {smsLog.map((sms, idx) => {
              const isInfo = idx === smsLog.length - 1 && sms.text.includes("Benvenuto");
              return (
                <div key={idx} className="animate-fade-in space-y-1">
                  {isInfo ? (
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-[9px] text-white/40 leading-relaxed flex gap-2">
                      <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>{sms.text}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start max-w-[85%]">
                      {/* Bubble in style iMessage/WhatsApp */}
                      <div className="bg-white/10 border border-white/10 text-white rounded-2xl rounded-tl-none p-3 shadow-md relative">
                        <p className="text-[10.5px] leading-relaxed break-words font-sans">
                          {sms.text}
                        </p>
                      </div>
                      <span className="text-[7px] font-mono text-white/30 mt-1 pl-1">
                        Ora • SMS Consegnato
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mock Input Area */}
          <div className="bg-slate-950/90 p-3 border-t border-white/5 flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Rispondi all'SMS..." 
              disabled 
              className="flex-1 bg-white/5 border border-white/5 text-[10px] rounded-full px-3 py-1.5 text-white/40 cursor-not-allowed"
            />
            <button disabled className="p-1.5 bg-indigo-600/30 text-indigo-400/40 rounded-full">
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-white/40 mt-3 text-center italic max-w-[220px]">
          Simulazione fedele del cellulare del cliente. Vedrai comparire l'SMS qui al momento della prenotazione.
        </p>
      </div>

    </div>
  );
}
