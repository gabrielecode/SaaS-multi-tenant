import { useState, useMemo, FormEvent } from 'react';
import { Client } from '../types';
import { Search, UserPlus, AlertOctagon, CheckCircle2, AlertTriangle, Phone, Mail, Edit3, X, Save, ShieldAlert, Users, Share2, Send } from 'lucide-react';

interface ClientsListProps {
  clients: Client[];
  onUpdateClients: (cls: Client[]) => void;
  onOpenInviteClient?: (client?: Client) => void;
}

export default function ClientsList({ clients, onUpdateClients, onOpenInviteClient }: ClientsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New client form states
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newRisk, setNewRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [addError, setAddError] = useState<string | null>(null);

  // Editing notes state
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editNotesText, setEditNotesText] = useState('');

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchRisk = filterRisk === 'ALL' || c.riskLevel === filterRisk;
      return matchSearch && matchRisk;
    });
  }, [clients, searchTerm, filterRisk]);

  // Handle new client submit
  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const cleanName = newName.trim();
    const cleanPhone = newPhone.trim();
    const cleanEmail = newEmail.trim().toLowerCase();

    if (!cleanName) {
      setAddError('Inserisci il nome e cognome del cliente.');
      return;
    }

    const digitsOnlyPhone = cleanPhone.replace(/\D/g, '');
    if (digitsOnlyPhone.length < 8) {
      setAddError('Inserisci un numero di cellulare valido (almeno 8 cifre).');
      return;
    }

    // Check duplicate phone
    const existingByPhone = clients.find(c => c.phone.replace(/\D/g, '') === digitsOnlyPhone);
    if (existingByPhone) {
      setAddError(`Questo numero è già associato a ${existingByPhone.name}. Modifica il profilo esistente.`);
      return;
    }

    // Check duplicate email if provided
    if (cleanEmail) {
      const existingByEmail = clients.find(c => c.email && c.email.toLowerCase() === cleanEmail);
      if (existingByEmail) {
        setAddError(`Questa email è già associata a ${existingByEmail.name}.`);
        return;
      }
    }

    const newCl: Client = {
      id: 'c_' + Date.now(),
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      noShowCount: 0,
      completedCount: 0,
      reliabilityScore: 100,
      notes: newNotes.trim() || 'Nessuna nota aggiuntiva.',
      riskLevel: newRisk
    };

    onUpdateClients([...clients, newCl]);
    
    // Reset Form
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewNotes('');
    setNewRisk('LOW');
    setAddError(null);
    setShowAddForm(false);
  };

  // Start editing client notes
  const startEditingNotes = (client: Client) => {
    setEditingClientId(client.id);
    setEditNotesText(client.notes);
  };

  // Save client notes
  const saveClientNotes = (id: string) => {
    const updated = clients.map(c => {
      if (c.id === id) {
        return { ...c, notes: editNotesText };
      }
      return c;
    });
    onUpdateClients(updated);
    setEditingClientId(null);
  };

  // Toggle require 100% deposit / set risk level to high
  const toggleHighRisk = (id: string) => {
    const updated = clients.map(c => {
      if (c.id === id) {
        const isCurrentlyHigh = c.riskLevel === 'HIGH';
        return { 
          ...c, 
          riskLevel: isCurrentlyHigh ? 'LOW' as const : 'HIGH' as const,
          notes: isCurrentlyHigh 
            ? c.notes.replace('[CAPARRA 100% RICHIESTA] ', '') 
            : `[CAPARRA 100% RICHIESTA] ${c.notes}`
        };
      }
      return c;
    });
    onUpdateClients(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 stroke-[1.5]" />
            Anagrafica Clienti
          </h2>
          <p className="text-xs text-slate-500 mt-1">Gestisci i recapiti, invia inviti per la Web App e tieni traccia del punteggio di puntualità.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onOpenInviteClient && (
            <button
              onClick={() => onOpenInviteClient()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] shadow-sm"
              title="Invia link di iscrizione Web App via WhatsApp, Email o SMS"
            >
              <Share2 className="w-4 h-4 text-white" />
              Invia Invito App
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#1450FF] hover:bg-blue-600 text-white font-semibold text-xs px-5 py-3 rounded-[4px] flex items-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4 text-white" />
            Nuovo Cliente
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 glass-card p-4 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca cliente per nome, telefono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg pl-10 pr-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
          />
        </div>

        <div>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
          >
            <option value="ALL">Filtra affidabilità: Tutti</option>
            <option value="LOW">Affidabilità Alta (Basso rischio)</option>
            <option value="MEDIUM">Affidabilità Media (Medio rischio)</option>
            <option value="HIGH">Affidabilità Bassa (Rischio No-Show)</option>
          </select>
        </div>
      </div>

      {/* Clients Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClients.length > 0 ? (
          filteredClients.map(client => {
            const isHighRisk = client.riskLevel === 'HIGH';
            const isMediumRisk = client.riskLevel === 'MEDIUM';

            return (
              <div 
                key={client.id} 
                className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-between space-y-4 transition ${
                  isHighRisk ? 'border-rose-200 bg-rose-50/40' : 'glass-card glass-card-hover'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-950">{client.name}</h4>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {client.phone}
                      </p>
                      {client.email && (
                        <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {client.email}
                        </p>
                      )}
                    </div>

                    {/* Reliability Badge */}
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isHighRisk ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        isMediumRisk ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        Affidabilità: {client.reliabilityScore}%
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                        {client.completedCount} eseguiti • {client.noShowCount} no-show
                      </p>
                    </div>
                  </div>

                  {/* Notes Card & Editor */}
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Note Titolare</span>
                      {editingClientId !== client.id ? (
                        <button 
                          onClick={() => startEditingNotes(client)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>

                    {editingClientId === client.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={editNotesText}
                          onChange={(e) => setEditNotesText(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                        />
                        <div className="flex items-center gap-1.5 justify-end">
                          <button 
                            onClick={() => setEditingClientId(null)}
                            className="bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-slate-200 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-sm"
                          >
                            Annulla
                          </button>
                          <button 
                            onClick={() => saveClientNotes(client.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-sm"
                          >
                            <Save className="w-3 h-3" /> Salva
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-700 font-medium leading-relaxed">
                        {client.notes || "Nessuna nota presente."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Protect / Risk trigger footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    {isHighRisk ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertOctagon className="w-4 h-4" /> Caparra 100% obbligatoria
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Sotto controllo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenInviteClient && (
                      <button
                        type="button"
                        onClick={() => onOpenInviteClient(client)}
                        className="text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
                        title="Invia link invito Web App via WhatsApp, Email o SMS"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Invita App</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleHighRisk(client.id)}
                      className={`text-xs font-semibold px-3.5 py-2 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-sm ${
                        isHighRisk 
                          ? 'border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100' 
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white hover:border-slate-300'
                      }`}
                    >
                      {isHighRisk ? 'Rimuovi restrizione' : 'Richiedi Caparra 100%'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-card p-12 rounded-2xl text-center col-span-2 border border-slate-200/80">
            <Search className="w-12 h-12 mx-auto text-slate-300 stroke-1 mb-3" />
            <h5 className="text-sm font-bold text-slate-800">Nessun cliente trovato</h5>
            <p className="text-xs text-slate-500 mt-1">
              Prova a cambiare i termini della ricerca o i filtri di affidabilità.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: ADD CLIENT */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-950">Aggiungi Nuovo Cliente</h4>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setAddError(null);
                }} 
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="font-semibold">{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome e Cognome</label>
                <input
                  type="text"
                  required
                  placeholder="es. Marco Bianchi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefono</label>
                  <input
                    type="tel"
                    required
                    placeholder="es. +39 333..."
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email (Opzionale)</label>
                  <input
                    type="email"
                    placeholder="es. nome@esempio.it"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Livello di Rischio Iniziale</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'LOW', label: 'Basso (Iniziale)' },
                    { val: 'MEDIUM', label: 'Medio' },
                    { val: 'HIGH', label: 'Rischio Alto' }
                  ].map(risk => (
                    <button
                      key={risk.val}
                      type="button"
                      onClick={() => setNewRisk(risk.val as any)}
                      className={`p-2.5 rounded-lg text-xs font-semibold border text-center transition-all duration-200 ${
                        newRisk === risk.val
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:-translate-y-0.5 active:scale-[0.98]'
                      }`}
                    >
                      {risk.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note, Intolleranze o Abitudini</label>
                <textarea
                  rows={2}
                  placeholder="es. Richiede sempre caffè macchiato, consigliare caparra se disdice di sabato..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
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
                  Crea Profilo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
