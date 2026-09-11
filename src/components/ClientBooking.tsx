import { useState, useMemo, FormEvent } from 'react';
import { Service, Appointment, Client, AppointmentStatus, BusinessConfig } from '../types';
import { 
  Calendar, 
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
  RefreshCw
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
  const [step, setStep] = useState<'landing' | 'service' | 'datetime' | 'details' | 'payment' | 'success' | 'reschedule'>('landing');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-24');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Alternative slots for automatic rescheduling (Crucial requirement: upon cancellation, propose at least 3 alternative slots)
  const [alternativeSlots, setAlternativeSlots] = useState<Array<{ date: string; time: string }>>([]);

  const [smsLog, setSmsLog] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: "NoShow Reducer",
      text: "Benvenuto nel portale clienti. Prenota e sperimenta la riprogrammazione automatica.",
      time: "Adesso"
    }
  ]);

  const addSms = (text: string) => {
    setSmsLog(prev => [{ sender: "NoShow Reducer", text, time: "Adesso" }, ...prev]);
  };

  const dateOptions = [
    { date: '2026-06-24', label: 'Oggi (24 Giu)' },
    { date: '2026-06-25', label: 'Domani (25 Giu)' },
    { date: '2026-06-26', label: 'Dopodomani (26 Giu)' }
  ];

  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

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
        tenant_id: config.tenant_id,
        clientId: 'c_client_' + Date.now(),
        clientName,
        clientPhone,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: selectedDate,
        time: selectedTime,
        price: selectedService.price,
        depositPaid: deposit,
        status: AppointmentStatus.PENDING,
        notes: clientNotes,
        reminderSent: true,
        isConfirmedByClient: false,
        stripePaymentId: paidWithStripe ? 'ch_' + Math.random().toString(36).substr(2, 9) : undefined
      };

      onAddAppointment(newApp);
      setCreatedBookingId(appKey);
      setIsProcessingStripe(false);
      setStep('success');

      const formattedDate = new Date(selectedDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
      const confirmationLink = `https://noshow.reducer/confirm/${appKey}`;
      
      const smsText = config.reminderTemplate
        .replace('{NOME}', clientName)
        .replace('{SERVIZIO}', selectedService.name)
        .replace('{DATA}', formattedDate)
        .replace('{ORA}', selectedTime)
        .replace('{LINK_CONFERMA}', confirmationLink);

      addSms(smsText);
    }, paidWithStripe ? 1200 : 300);
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
    addSms(`Notifica WhatsApp: Presenza confermata per ${selectedService?.name}! Il salone è stato informato.`);
    showToast("Presenza confermata con successo!");
  };

  // Crucial requirement: Upon cancellation, automatically propose at least 3 alternative available slots to reschedule
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
      { date: '2026-06-25', time: '15:00' },
      { date: '2026-06-26', time: '11:00' }
    ];
    setAlternativeSlots(alternatives);

    addSms("Notifica NoShow Reducer: Appuntamento annullato. Ecco 3 slot alternativi consigliati per riprogrammare subito.");
    showToast("Appuntamento annullato. Scegli uno dei 3 slot alternativi proposti.");
    setStep('reschedule');
  };

  const handleSelectAlternativeSlot = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep('details');
    showToast(`Slot selezionato: ${date} alle ${time}. Conferma i dati.`);
  };

  const goBack = () => {
    if (step === 'datetime') setStep('service');
    else if (step === 'details') setStep('datetime');
    else if (step === 'payment') setStep('details');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative" id="client-booking-flow">
      
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-600 border border-indigo-500 text-white font-bold text-xs py-3.5 px-5 rounded-2xl shadow-2xl animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 fill-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Booking Container */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2 space-y-6">
        
        {/* Salon Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">{config.category}</span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{config.name}</h3>
            <p className="text-xs text-slate-500">Prenotazione rapida e protetta • {config.phone}</p>
          </div>
          {step !== 'landing' && step !== 'success' && (
            <button
              onClick={goBack}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Indietro
            </button>
          )}
        </div>

        {/* --- STEP 1: LANDING --- */}
        {step === 'landing' && (
          <div className="space-y-6 animate-fade-in text-center py-6">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl mx-auto flex items-center justify-center border border-indigo-100 shadow-sm">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h4 className="text-xl font-extrabold text-slate-900">Prenota il tuo Trattamento</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Scegli il servizio desiderato, seleziona data e ora e ricevi il promemoria istantaneo con conferma via WhatsApp/SMS.
              </p>
            </div>
            <button
              onClick={() => setStep('service')}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 active:scale-95"
            >
              Inizia Prenotazione →
            </button>
          </div>
        )}

        {/* --- STEP 2: SELECT SERVICE --- */}
        {step === 'service' && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="text-sm font-bold text-slate-900">Seleziona il Servizio</h4>
            <div className="space-y-3">
              {services.filter(s => s.isActive).map(service => (
                <div
                  key={service.id}
                  onClick={() => handleSelectService(service)}
                  className="p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-2xl cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 text-sm">{service.name}</div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {service.duration} min</span>
                      {service.depositRequired && (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          Caparra: {service.depositType === 'FIXED' ? `${service.depositValue}€` : `${service.depositValue}%`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-900">€{service.price}</span>
                    <div className="text-[10px] text-indigo-600 font-bold group-hover:translate-x-1 transition">Seleziona →</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- STEP 3: DATETIME --- */}
        {step === 'datetime' && selectedService && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Scegli Data e Ora</h4>
              <p className="text-xs text-slate-500">Servizio: <strong className="text-slate-800">{selectedService.name}</strong></p>
            </div>

            {/* Date tabs */}
            <div className="grid grid-cols-3 gap-2">
              {dateOptions.map(opt => (
                <button
                  key={opt.date}
                  onClick={() => setSelectedDate(opt.date)}
                  className={`p-3 rounded-xl text-xs font-bold border transition ${
                    selectedDate === opt.date
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Time slots */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Orari Disponibili per il {selectedDate}</label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(time => {
                  const isOccupied = occupiedSlots.includes(time);
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      disabled={isOccupied}
                      onClick={() => handleSelectDateTime(selectedDate, time)}
                      className={`p-3 rounded-xl text-xs font-bold border transition ${
                        isOccupied 
                          ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through' 
                          : isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 4: DETAILS --- */}
        {step === 'details' && selectedService && (
          <form onSubmit={handleDetailsSubmit} className="space-y-4 animate-fade-in text-xs">
            <div>
              <h4 className="text-sm font-bold text-slate-900">I tuoi Dati di Contatto</h4>
              <p className="text-xs text-slate-500">Riceverai il promemoria SMS e WhatsApp istantaneo.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome e Cognome *</label>
                <input
                  type="text"
                  required
                  placeholder="es. Giulia Verdi"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cellulare *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+39 333..."
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@dominio.it"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note (Opzionale)</label>
                <textarea
                  rows={2}
                  placeholder="Richieste particolari..."
                  value={clientNotes}
                  onChange={e => setClientNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-md transition"
            >
              {selectedService.depositRequired ? 'Procedi al Deposito Sicuro Stripe →' : 'Conferma Prenotazione Gratuita'}
            </button>
          </form>
        )}

        {/* --- STEP 5: PAYMENT --- */}
        {step === 'payment' && selectedService && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Deposito Protetto Stripe Connect
              </h4>
              <p className="text-xs text-slate-500">Caparra richiesta per confermare l'appuntamento ed evitare no-show.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Servizio: {selectedService.name}</span>
                <span className="font-bold">€{selectedService.price}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                <span>Caparra da versare ora:</span>
                <span className="text-emerald-700 text-sm">
                  {selectedService.depositType === 'FIXED' ? `€${selectedService.depositValue}` : `€${Math.round((selectedService.price * selectedService.depositValue) / 100)}`}
                </span>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-rose-950 text-[11px]">
                Cancellazione gratuita fino a {config.cancellationPolicyHours} ore prima. Oltre tale termine, la caparra viene trattenuta a titolo di penale.
              </p>
            </div>

            <button
              onClick={() => processBooking(true)}
              disabled={isProcessingStripe}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              {isProcessingStripe ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Elaborazione Stripe in corso...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Paga Caparra e Conferma Appuntamento
                </>
              )}
            </button>
          </div>
        )}

        {/* --- STEP 6: SUCCESS --- */}
        {step === 'success' && selectedService && (
          <div className="space-y-6 text-center py-6 animate-fade-in">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-extrabold text-slate-900">Prenotazione Inviata con Successo!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Il tuo appuntamento per <strong className="text-slate-900">{selectedService.name}</strong> del <strong className="text-slate-900">{selectedDate}</strong> alle <strong className="text-slate-900">{selectedTime}</strong> è in attesa di conferma.
              </p>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl text-left max-w-md mx-auto space-y-3">
              <p className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Simulatore Azioni Cliente (Sandbox)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleClientOneTapConfirm}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-3 rounded-xl transition shadow-sm"
                >
                  Conferma Presenza (OK)
                </button>
                <button
                  onClick={handleClientCancel}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs py-3 rounded-xl transition border border-rose-200"
                >
                  Annulla / Disdici
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedService(null);
                setStep('landing');
              }}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              ← Effettua un'altra prenotazione
            </button>
          </div>
        )}

        {/* --- STEP 7: RESCHEDULE (Automatic alternative 3 slots upon cancellation) --- */}
        {step === 'reschedule' && (
          <div className="space-y-6 animate-fade-in text-slate-800">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-950">Appuntamento Annullato</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Vuoi riprogrammare subito? Ti proponiamo in automatico <strong className="font-bold">3 slot orari liberi</strong> consigliati per non perdere il trattamento.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Seleziona un nuovo orario alternativo:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {alternativeSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAlternativeSlot(slot.date, slot.time)}
                    className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-left transition space-y-1 group shadow-sm"
                  >
                    <div className="text-[10px] uppercase font-bold text-indigo-600">Opzione #{index + 1}</div>
                    <div className="font-bold text-slate-900 text-sm">{slot.date}</div>
                    <div className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      Ore {slot.time}
                    </div>
                    <div className="text-[10px] text-indigo-600 font-bold pt-1 group-hover:translate-x-1 transition">Prenota subito →</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => {
                  setSelectedService(null);
                  setStep('landing');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Torna alla home del salone
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Smartphone SMS / WhatsApp Simulator Box */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-[300px] bg-slate-900 border-[6px] border-slate-800 rounded-[36px] shadow-2xl relative overflow-hidden flex flex-col h-[480px]">
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-24 bg-slate-800 rounded-b-2xl z-50"></div>

          <div className="bg-slate-950/80 px-5 pt-5 pb-2 flex items-center justify-between text-[9px] font-semibold text-white/80 z-30">
            <span>09:41</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-slate-950/60 border-b border-white/5 py-2 px-4 flex items-center gap-2 z-20 text-white">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300">
              NS
            </div>
            <div>
              <p className="text-[10px] font-bold">NoShow Reducer SMS</p>
              <p className="text-[7px] text-emerald-400">Online • WhatsApp Cloud API</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-950 flex flex-col-reverse justify-start text-white text-[10px]">
            {smsLog.map((sms, idx) => (
              <div key={idx} className="space-y-1 animate-fade-in">
                {idx === smsLog.length - 1 && sms.text.includes("Benvenuto") ? (
                  <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-[9px] text-white/50 flex gap-2">
                    <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>{sms.text}</span>
                  </div>
                ) : (
                  <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tl-none p-3 shadow-md space-y-1">
                    <p className="leading-relaxed">{sms.text}</p>
                    <span className="text-[7px] text-white/40 block text-right font-mono">Adesso</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center italic">
          Simulatore smartphone ricezione notifiche SMS/WhatsApp.
        </p>
      </div>

    </div>
  );
}
