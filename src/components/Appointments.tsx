import { useState, useMemo, FormEvent } from 'react';
import { Appointment, AppointmentStatus, Client, Service, WaitlistEntry } from '../types';
import { Plus, Check, X, AlertTriangle, RefreshCw, Calendar, Mail, MessageSquare, PlusCircle, Bell, UserPlus } from 'lucide-react';

interface AppointmentsProps {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  waitlist: WaitlistEntry[];
  onUpdateAppointments: (apps: Appointment[]) => void;
  onUpdateWaitlist: (wl: WaitlistEntry[]) => void;
  onUpdateClients: (cls: Client[]) => void;
}

export default function Appointments({
  appointments,
  clients,
  services,
  waitlist,
  onUpdateAppointments,
  onUpdateWaitlist,
  onUpdateClients
}: AppointmentsProps) {
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-24');
  const [activeTab, setActiveTab] = useState<'agenda' | 'waitlist'>('agenda');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddWaitlistForm, setShowAddWaitlistForm] = useState(false);

  // Custom Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Form states for manual Appointment
  const [newAppClientId, setNewAppClientId] = useState('');
  const [newAppClientName, setNewAppClientName] = useState('');
  const [newAppClientPhone, setNewAppClientPhone] = useState('');
  const [newAppServiceId, setNewAppServiceId] = useState('');
  const [newAppTime, setNewAppTime] = useState('10:00');
  const [newAppNotes, setNewAppNotes] = useState('');

  // Form states for Waitlist entry
  const [waitlistClientName, setWaitlistClientName] = useState('');
  const [waitlistClientPhone, setWaitlistClientPhone] = useState('');
  const [waitlistServiceId, setWaitlistServiceId] = useState('');
  const [waitlistTimePref, setWaitlistTimePref] = useState<'MORNING' | 'AFTERNOON' | 'ANYTIME'>('ANYTIME');

  // Match waitlist status message
  const [matchedNotification, setMatchedNotification] = useState<string | null>(null);

  // Filter appointments for the selected date
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(a => a.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate]);

  // Handle status changes
  const handleStatusChange = (id: string, newStatus: AppointmentStatus) => {
    const updated = appointments.map(app => {
      if (app.id === id) {
        // If changing to NO_SHOW or COMPLETED, let's also update the client's metrics
        if (newStatus === AppointmentStatus.NO_SHOW || newStatus === AppointmentStatus.COMPLETED) {
          const clientIndex = clients.findIndex(c => c.id === app.clientId);
          if (clientIndex !== -1) {
            const updatedClients = [...clients];
            const client = updatedClients[clientIndex];
            
            if (newStatus === AppointmentStatus.NO_SHOW) {
              client.noShowCount += 1;
              client.riskLevel = 'HIGH';
            } else if (newStatus === AppointmentStatus.COMPLETED) {
              client.completedCount += 1;
            }

            // Recalculate reliability score
            const total = client.completedCount + client.noShowCount;
            client.reliabilityScore = total > 0 ? Math.round((client.completedCount / total) * 100) : 100;
            if (client.reliabilityScore >= 80) client.riskLevel = 'LOW';
            else if (client.reliabilityScore >= 60) client.riskLevel = 'MEDIUM';
            else client.riskLevel = 'HIGH';

            onUpdateClients(updatedClients);
          }
        }
        return { ...app, status: newStatus };
      }
      return app;
    });
    onUpdateAppointments(updated);
  };

  // Submit manual booking form
  const handleAddAppointmentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newAppServiceId) return;

    let finalClientId = newAppClientId;
    let finalClientName = newAppClientName;
    let finalClientPhone = newAppClientPhone;

    // If existing client selected
    if (newAppClientId) {
      const exist = clients.find(c => c.id === newAppClientId);
      if (exist) {
        finalClientName = exist.name;
        finalClientPhone = exist.phone;
      }
    } else {
      // Create new client first
      if (!newAppClientName || !newAppClientPhone) return;
      finalClientId = 'c_' + Date.now();
      const newClient: Client = {
        id: finalClientId,
        name: newAppClientName,
        phone: newAppClientPhone,
        email: '',
        noShowCount: 0,
        completedCount: 0,
        reliabilityScore: 100,
        notes: 'Nuovo cliente creato da Agenda',
        riskLevel: 'LOW'
      };
      onUpdateClients([...clients, newClient]);
    }

    const selectedService = services.find(s => s.id === newAppServiceId);
    if (!selectedService) return;

    // Compute deposit amount
    let deposit = 0;
    if (selectedService.depositRequired) {
      if (selectedService.depositType === 'FIXED') {
        deposit = selectedService.depositValue;
      } else {
        deposit = Math.round((selectedService.price * selectedService.depositValue) / 100);
      }
    }

    const newApp: Appointment = {
      id: 'a_' + Date.now(),
      clientId: finalClientId,
      clientName: finalClientName,
      clientPhone: finalClientPhone,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date: selectedDate,
      time: newAppTime,
      price: selectedService.price,
      depositPaid: deposit,
      status: AppointmentStatus.CONFIRMED, // Manually added by owner usually starts as confirmed/locked
      notes: newAppNotes,
      reminderSent: false,
      isConfirmedByClient: true
    };

    onUpdateAppointments([...appointments, newApp]);

    // Reset Form
    setNewAppClientId('');
    setNewAppClientName('');
    setNewAppClientPhone('');
    setNewAppServiceId('');
    setNewAppTime('10:00');
    setNewAppNotes('');
    setShowAddForm(false);
  };

  // Submit manual Waitlist form
  const handleAddWaitlistSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!waitlistClientName || !waitlistClientPhone || !waitlistServiceId) return;

    const newWl: WaitlistEntry = {
      id: 'w_' + Date.now(),
      clientId: 'c_' + Date.now(),
      clientName: waitlistClientName,
      clientPhone: waitlistClientPhone,
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
  };

  // Trigger Notification to Waitlist on Cancellation/No-Show
  const handleNotifyWaitlist = (serviceId: string, time: string) => {
    // Find waitlist entries for this date and service
    const matching = waitlist.filter(w => w.date === selectedDate && w.serviceId === serviceId);
    
    if (matching.length > 0) {
      const recipient = matching[0];
      setMatchedNotification(
        `Notifica inviata a ${recipient.clientName} (${recipient.clientPhone}) via SMS: "Ciao! Uno slot per il servizio si è liberato oggi alle ${time}. Rispondi OK per prenotarlo all'istante!"`
      );
      // Remove notified entry from waitlist
      onUpdateWaitlist(waitlist.filter(w => w.id !== recipient.id));
    } else {
      setMatchedNotification(
        `Nessun cliente corrispondente in lista d'attesa per questo servizio in data ${selectedDate}.`
      );
    }

    setTimeout(() => {
      setMatchedNotification(null);
    }, 8000);
  };

    return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-600 border border-indigo-500 text-white font-bold text-xs py-3.5 px-5 rounded-2xl shadow-2xl animate-bounce flex items-center gap-2">
          <Check className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600 stroke-[1.5]" />
          Calendario Agenda
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Monitora gli slot, gestisci gli appuntamenti della giornata e visualizza la lista d'attesa.
        </p>
      </div>

      {/* Tab Selector & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${activeTab === 'agenda' ? 'bg-white text-indigo-700 border border-slate-200 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Agenda Giornaliera
          </button>
          <button
            onClick={() => setActiveTab('waitlist')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-200 flex items-center gap-1.5 hover:-translate-y-0.5 active:scale-95 ${activeTab === 'waitlist' ? 'bg-white text-indigo-700 border border-slate-200 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Lista d'Attesa
            {waitlist.length > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {waitlist.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'agenda' ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] self-start sm:self-auto shadow-md"
          >
            <Plus className="w-4 h-4 text-white" />
            Nuovo Appuntamento
          </button>
        ) : (
          <button
            onClick={() => setShowAddWaitlistForm(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] self-start sm:self-auto shadow-md"
          >
            <Plus className="w-4 h-4" />
            Inserisci in Lista
          </button>
        )}
      </div>

      {/* Matching alerts */}
      {matchedNotification && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-100 flex items-start gap-3 animate-pulse">
          <Bell className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-emerald-300">Lista d'Attesa Intelligente</p>
            <p className="mt-0.5 text-emerald-200/80">{matchedNotification}</p>
          </div>
        </div>
      )}

      {/* Main Panels */}
      {activeTab === 'agenda' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Date Selector */}
          <div className="glass-card p-5 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-indigo-600" />
              Seleziona Data
            </h4>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
              {[
                { date: '2026-06-23', label: 'Ieri' },
                { date: '2026-06-24', label: 'Oggi' },
                { date: '2026-06-25', label: 'Domani' },
                { date: '2026-06-26', label: 'Venerdì' }
              ].map(item => (
                <button
                  key={item.date}
                  onClick={() => setSelectedDate(item.date)}
                  className={`p-3 rounded-lg border text-left transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5 active:scale-95 ${
                    selectedDate === item.date
                      ? 'border-indigo-100 bg-indigo-50/70 text-indigo-700 shadow-sm font-bold'
                      : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${selectedDate === item.date ? 'text-indigo-600' : 'text-slate-400'}`}>{item.label}</span>
                  <span className="text-xs font-semibold mt-1">
                    {new Date(item.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Appointments Grid */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glass-card p-4 rounded-xl flex items-center justify-between text-xs text-slate-500">
              <span>Slot occupati in data {new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              <span className="font-bold text-slate-900">{filteredAppointments.length} Appuntamenti</span>
            </div>

            {filteredAppointments.length > 0 ? (
              <div className="space-y-3">
                {filteredAppointments.map(app => {
                  const isPast = app.date < '2026-06-24';
                  return (
                    <div
                      key={app.id}
                      className={`p-5 rounded-2xl border transition ${
                        app.status === AppointmentStatus.NO_SHOW 
                          ? 'border-rose-200 bg-rose-50/40' 
                          : 'glass-card glass-card-hover'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {app.time}
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              app.status === AppointmentStatus.CONFIRMED ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                              app.status === AppointmentStatus.PENDING ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                              app.status === AppointmentStatus.COMPLETED ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                              app.status === AppointmentStatus.NO_SHOW ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {app.status === AppointmentStatus.CONFIRMED ? 'Confermato' :
                               app.status === AppointmentStatus.PENDING ? 'In attesa' :
                               app.status === AppointmentStatus.COMPLETED ? 'Completato' :
                               app.status === AppointmentStatus.NO_SHOW ? 'No-Show' : 'Annullato'}
                            </span>
                            {app.isConfirmedByClient && app.status !== AppointmentStatus.NO_SHOW && (
                              <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 uppercase">
                                <Check className="w-2.5 h-2.5" /> Cliente Confermato
                              </span>
                            )}
                          </div>
                          
                          <h5 className="text-base font-bold text-slate-950 pt-1">{app.clientName}</h5>
                          <p className="text-xs text-slate-600 font-semibold">{app.serviceName} • {app.price} €</p>
                          {app.notes && (
                            <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                              " {app.notes} "
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 self-start sm:self-auto">
                          <p className="text-xs text-slate-500 font-medium">
                            Caparra versata: <span className="font-bold text-slate-950">{app.depositPaid} €</span>
                          </p>

                          {/* Quick Interactive Actions */}
                          <div className="flex items-center gap-1.5 mt-2">
                            {app.status === AppointmentStatus.PENDING && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(app.id, AppointmentStatus.CONFIRMED)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-emerald-200"
                                  title="Segna come confermato"
                                >
                                  <Check className="w-3.5 h-3.5" /> Conferma
                                </button>
                                <button
                                  onClick={() => handleStatusChange(app.id, AppointmentStatus.CANCELLED)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-rose-200"
                                  title="Annulla appuntamento"
                                >
                                  <X className="w-3.5 h-3.5" /> Annulla
                                </button>
                              </>
                            )}

                            {app.status === AppointmentStatus.CONFIRMED && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(app.id, AppointmentStatus.COMPLETED)}
                                  className="p-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" /> Eseguito
                                </button>
                                <button
                                  onClick={() => handleStatusChange(app.id, AppointmentStatus.NO_SHOW)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" /> No-Show
                                </button>
                              </>
                            )}

                            {(app.status === AppointmentStatus.NO_SHOW || app.status === AppointmentStatus.CANCELLED) && (
                              <button
                                onClick={() => handleNotifyWaitlist(app.serviceId, app.time)}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-200"
                              >
                                <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                                Chiama Lista Attesa
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
              <div className="glass-card p-12 rounded-2xl text-center">
                <Calendar className="w-12 h-12 mx-auto text-slate-300 stroke-1 mb-3" />
                <h5 className="text-sm font-bold text-slate-800">Nessun appuntamento schedulato</h5>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Non ci sono appuntamenti registrati per questa data. Clicca su "Nuovo Appuntamento" per aggiungerne uno manualmente.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Waitlist Panel */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-base font-bold text-slate-900">Persone in Lista d'Attesa</h4>
            {waitlist.length > 0 ? (
              <div className="space-y-3">
                {waitlist.map(w => {
                  const matchingService = services.find(s => s.id === w.serviceId);
                  return (
                    <div key={w.id} className="p-4 glass-card glass-card-hover rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-slate-900">{w.clientName}</h5>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase border border-indigo-100">
                            Pref: {w.timePreference === 'MORNING' ? 'Mattina' : w.timePreference === 'AFTERNOON' ? 'Pomeriggio' : 'Qualsiasi ora'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Servizio: {matchingService?.name || 'Servizio Generico'}</p>
                        <p className="text-xs text-slate-500 font-medium">Recapito: {w.clientPhone}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            // Convert Waitlist into active booking
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
                            showToast(`Prenotazione creata con successo per ${w.clientName}!`);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          Prenota Ora
                        </button>
                        <button
                          onClick={() => onUpdateWaitlist(waitlist.filter(item => item.id !== w.id))}
                          className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600"
                          title="Rimuovi"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-card p-12 rounded-2xl text-center">
                <Bell className="w-12 h-12 mx-auto text-slate-300 stroke-1 mb-3 animate-pulse" />
                <h5 className="text-sm font-bold text-slate-800">Lista d'attesa vuota</h5>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Nessun cliente in attesa. Quando l'agenda è piena, puoi inserire i clienti interessati qui per coprire i no-show.
                </p>
              </div>
            )}
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-950">Come funziona la Lista d'Attesa?</h4>
            <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-4 font-medium">
              <li>Quando un cliente cancella, l'app confronta la data e il servizio con i clienti registrati in lista.</li>
              <li>Se viene rilevato un match, l'app invia un <strong className="text-indigo-600">SMS automatico di sollecito</strong> con un pulsante rapido per prenotarsi.</li>
              <li>Il primo cliente della lista d'attesa che risponde si assicura lo slot liberato, prevenendo perdite finanziarie.</li>
            </ul>
          </div>
        </div>
      )}

      {/* MODAL: ADD APPOINTMENT */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-950">Nuovo Appuntamento Manuale</h4>
              <button onClick={() => setShowAddForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAppointmentSubmit} className="space-y-3.5 text-slate-700">
              {/* Client Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Seleziona Cliente</label>
                <select
                  value={newAppClientId}
                  onChange={(e) => {
                    setNewAppClientId(e.target.value);
                    if (e.target.value) {
                      setNewAppClientName('');
                      setNewAppClientPhone('');
                    }
                  }}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                >
                  <option value="">-- Crea Nuovo Cliente --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              {/* If New Client details required */}
              {!newAppClientId && (
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Nome e Cognome</label>
                    <input
                      type="text"
                      required={!newAppClientId}
                      placeholder="es. Mario Rossi"
                      value={newAppClientName}
                      onChange={(e) => setNewAppClientName(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 mt-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Telefono</label>
                    <input
                      type="tel"
                      required={!newAppClientId}
                      placeholder="+39 340..."
                      value={newAppClientPhone}
                      onChange={(e) => setNewAppClientPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 mt-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                    />
                  </div>
                </div>
              )}

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Servizio Richiesto</label>
                <select
                  required
                  value={newAppServiceId}
                  onChange={(e) => setNewAppServiceId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                >
                  <option value="">Seleziona Servizio...</option>
                  {services.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.price} € ({s.duration} min)</option>
                  ))}
                </select>
              </div>

              {/* Time Selector */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    disabled
                    value={selectedDate}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-400 text-xs rounded-lg p-2.5 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Orario</label>
                  <input
                    type="time"
                    required
                    value={newAppTime}
                    onChange={(e) => setNewAppTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note Opzionali</label>
                <textarea
                  rows={2}
                  placeholder="Note aggiuntive..."
                  value={newAppNotes}
                  onChange={(e) => setNewAppNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-3 rounded-lg border border-slate-200 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] shadow-sm"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] shadow-md"
                >
                  Conferma & Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD WAITLIST */}
      {showAddWaitlistForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-950">Inserisci Cliente in Lista d'Attesa</h4>
              <button onClick={() => setShowAddWaitlistForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWaitlistSubmit} className="space-y-3.5 text-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Nome e cognome..."
                  value={waitlistClientName}
                  onChange={(e) => setWaitlistClientName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefono Cliente</label>
                <input
                  type="tel"
                  required
                  placeholder="Numero cellulare per SMS..."
                  value={waitlistClientPhone}
                  onChange={(e) => setWaitlistClientPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Servizio Desiderato</label>
                <select
                  required
                  value={waitlistServiceId}
                  onChange={(e) => setWaitlistServiceId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                >
                  <option value="">Seleziona Servizio...</option>
                  {services.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferenza Orario</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'MORNING', label: 'Mattina' },
                    { val: 'AFTERNOON', label: 'Pomeriggio' },
                    { val: 'ANYTIME', label: 'Qualsiasi' }
                  ].map(pref => (
                    <button
                      key={pref.val}
                      type="button"
                      onClick={() => setWaitlistTimePref(pref.val as any)}
                      className={`p-2.5 rounded-lg text-xs font-semibold border text-center transition-all duration-200 ${
                        waitlistTimePref === pref.val
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:-translate-y-0.5 active:scale-[0.98]'
                      }`}
                    >
                      {pref.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWaitlistForm(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-3 rounded-lg border border-slate-200 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] shadow-sm"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] shadow-md"
                >
                  Aggiungi alla lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
