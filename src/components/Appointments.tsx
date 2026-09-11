import { useState, useMemo, useEffect, FormEvent } from 'react';
import { Appointment, AppointmentStatus, Client, Service, WaitlistEntry } from '../types';
import { buildWhatsAppUrl, formatPhoneDisplay } from '../lib/phoneUtils';
import { 
  Plus, 
  Check, 
  X, 
  AlertTriangle, 
  RefreshCw, 
  Calendar, 
  Clock, 
  Send, 
  Bell, 
  CreditCard, 
  User, 
  Phone, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  UserPlus, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

interface AppointmentsProps {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  waitlist: WaitlistEntry[];
  onUpdateAppointments: (apps: Appointment[]) => void;
  onUpdateWaitlist: (wl: WaitlistEntry[]) => void;
  onUpdateClients: (cls: Client[]) => void;
  autoOpenAdd?: boolean;
  onResetAutoOpen?: () => void;
  initialTab?: 'agenda' | 'waitlist';
}

export default function Appointments({
  appointments,
  clients,
  services,
  waitlist,
  onUpdateAppointments,
  onUpdateWaitlist,
  onUpdateClients,
  autoOpenAdd,
  onResetAutoOpen,
  initialTab
}: AppointmentsProps) {
  // Determinazione data iniziale intelligente (usa la data del primo appuntamento o oggi)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (appointments.length > 0) {
      return appointments[0].date;
    }
    return new Date().toISOString().split('T')[0];
  });

  const [activeTab, setActiveTab] = useState<'agenda' | 'waitlist'>(initialTab || 'agenda');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddWaitlistForm, setShowAddWaitlistForm] = useState(false);

  // Apertura automatica da pulsanti esterni
  useEffect(() => {
    if (autoOpenAdd) {
      setShowAddForm(true);
      if (onResetAutoOpen) onResetAutoOpen();
    }
  }, [autoOpenAdd, onResetAutoOpen]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Form states per Nuovo Appuntamento
  const [newAppClientId, setNewAppClientId] = useState('');
  const [newAppClientName, setNewAppClientName] = useState('');
  const [newAppClientPhone, setNewAppClientPhone] = useState('');
  const [newAppServiceId, setNewAppServiceId] = useState('');
  const [newAppDate, setNewAppDate] = useState(selectedDate);
  const [newAppTime, setNewAppTime] = useState('10:00');
  const [newAppNotes, setNewAppNotes] = useState('');
  const [newAppHasDeposit, setNewAppHasDeposit] = useState(false);
  const [newAppDepositPaid, setNewAppDepositPaid] = useState<number>(0);

  // Aggiorna newAppDate quando cambia selectedDate se il form non è aperto
  useEffect(() => {
    if (!showAddForm) {
      setNewAppDate(selectedDate);
    }
  }, [selectedDate, showAddForm]);

  // Form states per Waitlist entry
  const [waitlistClientName, setWaitlistClientName] = useState('');
  const [waitlistClientPhone, setWaitlistClientPhone] = useState('');
  const [waitlistServiceId, setWaitlistServiceId] = useState('');
  const [waitlistTimePref, setWaitlistTimePref] = useState<'MORNING' | 'AFTERNOON' | 'ANYTIME'>('ANYTIME');

  // Match waitlist alert message
  const [matchedNotification, setMatchedNotification] = useState<string | null>(null);

  // Navigazione data (+1 giorno, -1 giorno, oggi)
  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Appuntamenti filtrati per data selezionata
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(a => a.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate]);

  // Waitlist filtrata o globale
  const filteredWaitlist = useMemo(() => {
    return waitlist.filter(w => !w.date || w.date === selectedDate);
  }, [waitlist, selectedDate]);

  // Statistiche rapide giornaliere
  const dayStats = useMemo(() => {
    const total = filteredAppointments.length;
    const confirmed = filteredAppointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length;
    const pending = filteredAppointments.filter(a => a.status === AppointmentStatus.PENDING).length;
    const completed = filteredAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const noShows = filteredAppointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
    const totalRevenue = filteredAppointments.reduce((sum, a) => sum + (a.price || 0), 0);
    const depositsCollected = filteredAppointments.reduce((sum, a) => sum + (a.depositPaid || 0), 0);

    return { total, confirmed, pending, completed, noShows, totalRevenue, depositsCollected };
  }, [filteredAppointments]);

  // Gestione cambio stato appuntamento
  const handleStatusChange = (id: string, newStatus: AppointmentStatus) => {
    const updated = appointments.map(app => {
      if (app.id === id) {
        // Se lo stato diventa NO_SHOW o COMPLETED, aggiorna metriche del cliente
        if (newStatus === AppointmentStatus.NO_SHOW || newStatus === AppointmentStatus.COMPLETED) {
          const clientIndex = clients.findIndex(c => c.id === app.clientId);
          if (clientIndex !== -1) {
            const updatedClients = [...clients];
            const client = { ...updatedClients[clientIndex] };

            if (newStatus === AppointmentStatus.NO_SHOW) {
              client.noShowCount += 1;
              client.riskLevel = 'HIGH';
            } else if (newStatus === AppointmentStatus.COMPLETED) {
              client.completedCount += 1;
            }

            // Ricalcolo affidabilità
            const total = client.completedCount + client.noShowCount;
            client.reliabilityScore = total > 0 ? Math.round((client.completedCount / total) * 100) : 100;
            if (client.reliabilityScore >= 80) client.riskLevel = 'LOW';
            else if (client.reliabilityScore >= 60) client.riskLevel = 'MEDIUM';
            else client.riskLevel = 'HIGH';

            updatedClients[clientIndex] = client;
            onUpdateClients(updatedClients);
          }
        }
        return { ...app, status: newStatus };
      }
      return app;
    });

    onUpdateAppointments(updated);

    const labels: Record<AppointmentStatus, string> = {
      [AppointmentStatus.CONFIRMED]: 'Appuntamento confermato',
      [AppointmentStatus.COMPLETED]: 'Appuntamento segnato come completato',
      [AppointmentStatus.NO_SHOW]: 'Registrato No-Show del cliente',
      [AppointmentStatus.CANCELLED]: 'Appuntamento annullato',
      [AppointmentStatus.PENDING]: 'Impostato in attesa'
    };
    showToast(labels[newStatus] || 'Stato aggiornato');
  };

  // Submit creazione appuntamento manuale
  const handleAddAppointmentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newAppServiceId) return;

    let finalClientId = newAppClientId;
    let finalClientName = newAppClientName;
    let finalClientPhone = newAppClientPhone;

    // Se è stato scelto un cliente esistente
    if (newAppClientId) {
      const exist = clients.find(c => c.id === newAppClientId);
      if (exist) {
        finalClientName = exist.name;
        finalClientPhone = exist.phone;
      }
    } else {
      // Verifica se il numero corrisponde già a un cliente
      if (!newAppClientName || !newAppClientPhone) return;
      const cleanInputPhone = newAppClientPhone.replace(/\D/g, '');
      const existingClientByPhone = clients.find(c => c.phone.replace(/\D/g, '') === cleanInputPhone);

      if (existingClientByPhone) {
        finalClientId = existingClientByPhone.id;
        finalClientName = existingClientByPhone.name;
        finalClientPhone = existingClientByPhone.phone;
      } else {
        finalClientId = 'c_' + Date.now();
        const newClient: Client = {
          id: finalClientId,
          name: newAppClientName.trim(),
          phone: newAppClientPhone.trim(),
          email: '',
          noShowCount: 0,
          completedCount: 0,
          reliabilityScore: 100,
          notes: 'Nuovo cliente creato da Agenda',
          riskLevel: 'LOW'
        };
        onUpdateClients([...clients, newClient]);
      }
    }

    const selectedService = services.find(s => s.id === newAppServiceId);
    if (!selectedService) return;

    const deposit = newAppHasDeposit ? Number(newAppDepositPaid) : 0;

    const newApp: Appointment = {
      id: 'a_' + Date.now(),
      clientId: finalClientId,
      clientName: finalClientName,
      clientPhone: finalClientPhone,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date: newAppDate || selectedDate,
      time: newAppTime,
      price: selectedService.price,
      depositPaid: deposit,
      paymentMethod: deposit > 0 ? 'STRIPE_DEPOSIT' : 'IN_SALON',
      status: AppointmentStatus.CONFIRMED,
      notes: newAppNotes,
      reminderSent: false,
      isConfirmedByClient: true
    };

    onUpdateAppointments([...appointments, newApp]);
    setSelectedDate(newApp.date);

    // Reset Form
    setNewAppClientId('');
    setNewAppClientName('');
    setNewAppClientPhone('');
    setNewAppServiceId('');
    setNewAppTime('10:00');
    setNewAppNotes('');
    setNewAppHasDeposit(false);
    setNewAppDepositPaid(0);
    setShowAddForm(false);
    showToast(`Appuntamento per ${finalClientName} creato con successo!`);
  };

  // Submit creazione Waitlist entry
  const handleAddWaitlistSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!waitlistClientName || !waitlistClientPhone || !waitlistServiceId) return;

    const newWl: WaitlistEntry = {
      id: 'w_' + Date.now(),
      clientId: 'c_' + Date.now(),
      clientName: waitlistClientName.trim(),
      clientPhone: waitlistClientPhone.trim(),
      serviceId: waitlistServiceId,
      date: selectedDate,
      timePreference: waitlistTimePref,
      createdAt: new Date().toISOString()
    };

    onUpdateWaitlist([...waitlist, newWl]);
    setWaitlistClientName('');
    setWaitlistClientPhone('');
    setWaitlistServiceId('');
    setShowAddWaitlistForm(false);
    showToast(`${newWl.clientName} inserito in lista d'attesa!`);
  };

  // Trigger notifica automatica lista d'attesa su disdetta o no-show
  const handleNotifyWaitlist = (serviceId: string, time: string) => {
    const matching = waitlist.filter(w => (!w.date || w.date === selectedDate) && w.serviceId === serviceId);

    if (matching.length > 0) {
      const recipient = matching[0];
      setMatchedNotification(
        `Notifica WhatsApp/SMS inviata a ${recipient.clientName} (${recipient.clientPhone}): "Ciao! Si è liberato uno slot oggi alle ${time}. Rispondi OK per bloccarlo all'istante!"`
      );
      // Rimuove la voce notificata dalla waitlist
      onUpdateWaitlist(waitlist.filter(w => w.id !== recipient.id));
    } else {
      setMatchedNotification(
        `Nessun cliente in lista d'attesa per questo servizio in data ${selectedDate}.`
      );
    }

    setTimeout(() => {
      setMatchedNotification(null);
    }, 8000);
  };

  return (
    <div className="space-y-6 relative" id="appointments-component">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-600 border border-indigo-500 text-white font-bold text-xs py-3.5 px-5 rounded-2xl shadow-2xl animate-bounce flex items-center gap-2">
          <Check className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Titolo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <Calendar className="w-6 h-6 text-indigo-600 stroke-[2]" />
            <span>Gestione Agenda & Lista d'Attesa</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualizza gli slot, conferma le prenotazioni, gestisci i No-Show e recupera fatturato con la lista d'attesa.
          </p>
        </div>

        {/* Pulsanti Azione Principali */}
        <div className="flex items-center gap-2">
          {activeTab === 'agenda' ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Appuntamento</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddWaitlistForm(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Inserisci in Lista d'Attesa</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher (Agenda vs Waitlist) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'agenda'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Agenda Giornaliera</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'agenda' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {filteredAppointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('waitlist')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'waitlist'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Lista d'Attesa</span>
            {waitlist.length > 0 && (
              <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs">
                {waitlist.length}
              </span>
            )}
          </button>
        </div>

        {/* Statistiche Pills compatti */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500">Confermati:</span>
            <strong className="text-slate-900">{dayStats.confirmed}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-slate-500">In attesa:</span>
            <strong className="text-slate-900">{dayStats.pending}</strong>
          </div>
          {dayStats.noShows > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-1.5 shadow-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>No-Show:</span>
              <strong>{dayStats.noShows}</strong>
            </div>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1.5 shadow-xs font-semibold">
            <span>Fatturato stimato:</span>
            <strong className="text-indigo-900">{dayStats.totalRevenue} €</strong>
          </div>
        </div>
      </div>

      {/* Avviso Match Intelligente Lista d'Attesa */}
      {matchedNotification && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-900 flex items-start gap-3 shadow-sm animate-fade-in">
          <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-extrabold text-emerald-800">Recupero Slot Automatico</p>
            <p className="mt-0.5 text-emerald-700 leading-relaxed">{matchedNotification}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 1: AGENDA GIORNALIERA                                              */}
      {/* ========================================================================= */}
      {activeTab === 'agenda' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Barra Laterale Filtro Data */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Seleziona Data</span>
                </h4>
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Oggi
                </button>
              </div>

              {/* Selettore Native Date con Frecce */}
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleShiftDate(-1)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition"
                    title="Giorno precedente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleShiftDate(1)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition"
                    title="Giorno successivo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pulsanti Rapidi Date con appuntamenti */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date rapide con slot</p>
                {Array.from(new Set(appointments.map(a => a.date))).slice(0, 5).map(dateStr => {
                  const count = appointments.filter(a => a.date === dateStr).length;
                  const isSelected = selectedDate === dateStr;
                  const dateObj = new Date(dateStr);
                  const formatted = isNaN(dateObj.getTime())
                    ? dateStr
                    : dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="capitalize">{formatted}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isSelected ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {count} slot
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Griglia Appuntamenti del Giorno */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-700">
                  Agenda del{' '}
                  <strong className="text-slate-900 capitalize">
                    {new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </strong>
                </span>
              </div>
              <span className="text-slate-500 font-medium">
                {filteredAppointments.length} {filteredAppointments.length === 1 ? 'prenotazione registrata' : 'prenotazioni registrate'}
              </span>
            </div>

            {filteredAppointments.length > 0 ? (
              <div className="space-y-3">
                {filteredAppointments.map(app => {
                  const isNoShow = app.status === AppointmentStatus.NO_SHOW;
                  const isConfirmed = app.status === AppointmentStatus.CONFIRMED;
                  const isCompleted = app.status === AppointmentStatus.COMPLETED;
                  const isCancelled = app.status === AppointmentStatus.CANCELLED;

                  return (
                    <div
                      key={app.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isNoShow
                          ? 'border-rose-300 bg-rose-50/50'
                          : isCompleted
                          ? 'border-slate-200 bg-slate-50/60 opacity-80'
                          : isCancelled
                          ? 'border-slate-200 bg-slate-100/50 opacity-60'
                          : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        
                        {/* Info Principali */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Orario */}
                            <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              {app.time}
                            </span>

                            {/* Badge Stato */}
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                              isConfirmed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              app.status === AppointmentStatus.PENDING ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              isCompleted ? 'bg-slate-100 text-slate-700 border-slate-300' :
                              isNoShow ? 'bg-rose-100 text-rose-800 border-rose-200' :
                              'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {isConfirmed ? 'Confermato' :
                               app.status === AppointmentStatus.PENDING ? 'In attesa' :
                               isCompleted ? 'Completato' :
                               isNoShow ? 'No-Show' : 'Annullato'}
                            </span>

                            {/* Conferma Cliente */}
                            {app.isConfirmedByClient && !isNoShow && !isCancelled && (
                              <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 uppercase">
                                <Check className="w-2.5 h-2.5" /> Confermato da cliente
                              </span>
                            )}
                          </div>

                          {/* Nome Cliente & Servizio */}
                          <div className="pt-1">
                            <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                              <span>{app.clientName}</span>
                              <span className="text-xs font-normal text-slate-500 font-mono">
                                ({formatPhoneDisplay(app.clientPhone)})
                              </span>
                            </h4>
                            <p className="text-xs font-bold text-indigo-700 mt-0.5">
                              {app.serviceName} • {app.price} €
                            </p>
                          </div>

                          {/* Note */}
                          {app.notes && (
                            <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 max-w-xl">
                              "{app.notes}"
                            </p>
                          )}
                        </div>

                        {/* Lato Destro: Pagamenti & Azioni */}
                        <div className="flex flex-col items-start sm:items-end gap-2.5">
                          {/* Stato Caparra / Pagamento */}
                          <div className="text-xs text-slate-600">
                            {app.depositPaid > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                Caparra: {app.depositPaid} €
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                Saldo completo in salone
                              </span>
                            )}
                          </div>

                          {/* Pulsantiera Azioni */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* WhatsApp Direct Link */}
                            <a
                              href={buildWhatsAppUrl(
                                app.clientPhone,
                                `Ciao ${app.clientName}! Ti contattiamo dal salone per il tuo appuntamento per ${app.serviceName} in data ${app.date} alle ore ${app.time}. A presto!`,
                                'CH'
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95"
                              title="Scrivi su WhatsApp al cliente"
                            >
                              <Send className="w-3 h-3 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>

                            {/* Se in attesa: Conferma o Annulla */}
                            {app.status === AppointmentStatus.PENDING && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(app.id, AppointmentStatus.CONFIRMED)}
                                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Conferma</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(app.id, AppointmentStatus.CANCELLED)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Annulla</span>
                                </button>
                              </>
                            )}

                            {/* Se confermato: Eseguito o No-Show */}
                            {app.status === AppointmentStatus.CONFIRMED && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(app.id, AppointmentStatus.COMPLETED)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition active:scale-95"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Eseguito</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(app.id, AppointmentStatus.NO_SHOW)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95"
                                  title="Segna mancata presentazione"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>No-Show</span>
                                </button>
                              </>
                            )}

                            {/* Se No-Show o Cancellato: Chiama Lista Attesa */}
                            {(isNoShow || isCancelled) && (
                              <button
                                type="button"
                                onClick={() => handleNotifyWaitlist(app.serviceId, app.time)}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                                <span>Chiama Waitlist</span>
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm space-y-3">
                <Calendar className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
                <h4 className="text-base font-extrabold text-slate-900">Nessun appuntamento per questa data</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Non ci sono appuntamenti registrati per il giorno selezionato. Clicca su "Nuovo Appuntamento" per inserire una prenotazione.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aggiungi Appuntamento</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: LISTA D'ATTESA (WAITLIST)                                        */}
      {/* ========================================================================= */}
      {activeTab === 'waitlist' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Clienti in Lista d'Attesa ({waitlist.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddWaitlistForm(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi cliente</span>
              </button>
            </div>

            {waitlist.length > 0 ? (
              <div className="space-y-3">
                {waitlist.map(w => {
                  const matchingService = services.find(s => s.id === w.serviceId);
                  const prefLabel = w.timePreference === 'MORNING' ? 'Mattina' : w.timePreference === 'AFTERNOON' ? 'Pomeriggio' : 'Qualsiasi orario';

                  return (
                    <div
                      key={w.id}
                      className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-extrabold text-slate-900">{w.clientName}</h5>
                          <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                            {prefLabel}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-700 font-bold">
                          Servizio richiesto: {matchingService?.name || 'Servizio Generico'}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          Recapito: {formatPhoneDisplay(w.clientPhone)}
                        </p>
                      </div>

                      {/* Azioni Waitlist */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Assegna e prenota all'istante
                            const newApp: Appointment = {
                              id: 'a_' + Date.now(),
                              clientId: w.clientId,
                              clientName: w.clientName,
                              clientPhone: w.clientPhone,
                              serviceId: w.serviceId,
                              serviceName: matchingService?.name || 'Servizio Generico',
                              date: selectedDate,
                              time: w.timePreference === 'MORNING' ? '10:00' : '15:00',
                              price: matchingService?.price || 40,
                              depositPaid: 0,
                              status: AppointmentStatus.CONFIRMED,
                              reminderSent: false,
                              isConfirmedByClient: true
                            };
                            onUpdateAppointments([...appointments, newApp]);
                            onUpdateWaitlist(waitlist.filter(item => item.id !== w.id));
                            showToast(`Prenotazione confermata per ${w.clientName}!`);
                            setActiveTab('agenda');
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Assegna Slot Ora</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onUpdateWaitlist(waitlist.filter(item => item.id !== w.id));
                            showToast('Cliente rimosso dalla lista d\'attesa');
                          }}
                          className="p-2 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 rounded-xl text-slate-400 hover:text-rose-600 transition"
                          title="Rimuovi dalla lista"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm space-y-3">
                <Bell className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
                <h4 className="text-base font-extrabold text-slate-900">Lista d'attesa vuota</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Nessun cliente in attesa di slot. Inserisci i clienti che non trovano posto per riempire automaticamente le cancellazioni improvvise.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddWaitlistForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aggiungi Cliente in Attesa</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Scheda Spiegazione Lista d'Attesa */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Come Funziona il Recupero No-Show
              </h4>
              <ul className="text-xs text-slate-600 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">1</span>
                  <span>Quando un appuntamento viene cancellato o segnato come No-Show, il sistema individua i clienti in lista d'attesa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">2</span>
                  <span>Un avviso rapido su WhatsApp/SMS notifica la disponibilità dello slot liberato in tempo reale.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">3</span>
                  <span>Con un click assegni la prenotazione, salvando il fatturato del salone.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: NUOVO APPUNTAMENTO MANUALE                                        */}
      {/* ========================================================================= */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>Nuovo Appuntamento</span>
              </h4>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAppointmentSubmit} className="space-y-3.5 text-xs">
              
              {/* Selezione Cliente o Creazione Rapida */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cliente</label>
                <select
                  value={newAppClientId}
                  onChange={(e) => {
                    setNewAppClientId(e.target.value);
                    if (e.target.value) {
                      setNewAppClientName('');
                      setNewAppClientPhone('');
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                >
                  <option value="">-- Nuovo Cliente (inserisci dati sotto) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatPhoneDisplay(c.phone)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dati se nuovo cliente */}
              {!newAppClientId && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome e Cognome</label>
                    <input
                      type="text"
                      required={!newAppClientId}
                      placeholder="es. Laura Bianchi"
                      value={newAppClientName}
                      onChange={(e) => setNewAppClientName(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cellulare</label>
                    <input
                      type="tel"
                      required={!newAppClientId}
                      placeholder="+41 79..."
                      value={newAppClientPhone}
                      onChange={(e) => setNewAppClientPhone(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Selezione Servizio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Servizio Richiesto</label>
                <select
                  required
                  value={newAppServiceId}
                  onChange={(e) => setNewAppServiceId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                >
                  <option value="">Seleziona un Servizio...</option>
                  {services.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.price} € ({s.duration} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* Data e Orario */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={newAppDate}
                    onChange={(e) => setNewAppDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Orario</label>
                  <input
                    type="time"
                    required
                    value={newAppTime}
                    onChange={(e) => setNewAppTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Opzione Acconto / Caparra */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="toggle-deposit-check" className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Registra Caparra / Acconto</span>
                  </label>
                  <input
                    id="toggle-deposit-check"
                    type="checkbox"
                    checked={newAppHasDeposit}
                    onChange={(e) => {
                      setNewAppHasDeposit(e.target.checked);
                      if (e.target.checked && newAppDepositPaid === 0 && newAppServiceId) {
                        const svc = services.find(s => s.id === newAppServiceId);
                        if (svc) {
                          const def = svc.depositType === 'FIXED' ? svc.depositValue : Math.round((svc.price * svc.depositValue) / 100);
                          setNewAppDepositPaid(def || 10);
                        }
                      }
                    }}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                {newAppHasDeposit && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 animate-fade-in">
                    <span className="text-[11px] font-semibold text-slate-600">Importo Acconto (€):</span>
                    <input
                      type="number"
                      min={0}
                      value={newAppDepositPaid}
                      onChange={(e) => setNewAppDepositPaid(Math.max(0, Number(e.target.value)))}
                      className="w-24 px-2 py-1.5 bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note Opzionali</label>
                <textarea
                  rows={2}
                  placeholder="es. Preferenza colore, richieste particolari..."
                  value={newAppNotes}
                  onChange={(e) => setNewAppNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                />
              </div>

              {/* Pulsanti Modale */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition active:scale-95"
                >
                  Salva Prenotazione
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: INSERISCI IN LISTA D'ATTESA                                       */}
      {/* ========================================================================= */}
      {showAddWaitlistForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <span>Nuovo in Lista d'Attesa</span>
              </h4>
              <button
                onClick={() => setShowAddWaitlistForm(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWaitlistSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Nome e cognome..."
                  value={waitlistClientName}
                  onChange={(e) => setWaitlistClientName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cellulare (per avviso WhatsApp/SMS)</label>
                <input
                  type="tel"
                  required
                  placeholder="+41 79 123 45 67"
                  value={waitlistClientPhone}
                  onChange={(e) => setWaitlistClientPhone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Servizio Richiesto</label>
                <select
                  required
                  value={waitlistServiceId}
                  onChange={(e) => setWaitlistServiceId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                >
                  <option value="">Seleziona Servizio...</option>
                  {services.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.price} €)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fascia Oraria Preferita</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'MORNING', label: 'Mattina' },
                    { val: 'AFTERNOON', label: 'Pomeriggio' },
                    { val: 'ANYTIME', label: 'Qualsiasi' }
                  ].map(p => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setWaitlistTimePref(p.val as any)}
                      className={`py-2 rounded-xl border text-xs font-bold text-center transition ${
                        waitlistTimePref === p.val
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWaitlistForm(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition active:scale-95"
                >
                  Salva in Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
