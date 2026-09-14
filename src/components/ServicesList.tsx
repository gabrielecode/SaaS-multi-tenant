import { useState, FormEvent } from 'react';
import { Service } from '../types';
import { Plus, ToggleLeft, ToggleRight, DollarSign, Clock, ShieldAlert, X, ShieldCheck, CreditCard, NotebookTabs } from 'lucide-react';

interface ServicesListProps {
  services: Service[];
  onUpdateServices: (svs: Service[]) => void;
}

export default function ServicesList({ services, onUpdateServices }: ServicesListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newPrice, setNewPrice] = useState(20);
  const [newDepositRequired, setNewDepositRequired] = useState(false);
  const [newDepositType, setNewDepositType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [newDepositValue, setNewDepositValue] = useState(5);

  // Toggle service active state
  const toggleServiceActive = (id: string) => {
    const updated = services.map(s => {
      if (s.id === id) {
        return { ...s, isActive: !s.isActive };
      }
      return s;
    });
    onUpdateServices(updated);
  };

  // Submit new service
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const newService: Service = {
      id: 's_' + Date.now(),
      name: newName,
      duration: newDuration,
      price: newPrice,
      depositRequired: newDepositRequired,
      depositType: newDepositType,
      depositValue: newDepositValue,
      isActive: true
    };

    onUpdateServices([...services, newService]);
    
    // Reset Form
    setNewName('');
    setNewDuration(30);
    setNewPrice(20);
    setNewDepositRequired(false);
    setNewDepositType('FIXED');
    setNewDepositValue(5);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2 font-display">
            <NotebookTabs className="w-5 h-5 text-[#1450FF] stroke-[1.5]" />
            Listino Servizi
          </h2>
          <p className="text-xs text-slate-500 mt-1">Configura i tuoi trattamenti, prezzi, durate e le policy di caparra per prenotazione online.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-[#1450FF] hover:bg-blue-600 text-white font-semibold text-xs px-4 py-2.5 rounded-[4px] flex items-center gap-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" />
          Aggiungi Trattamento
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map(service => {
          return (
            <div 
              key={service.id} 
              className={`rounded-[6px] p-5 border flex flex-col justify-between space-y-4 transition-all ${
                service.isActive ? 'bg-white border-[#E4E6EA]' : 'border-[#E4E6EA] bg-slate-50/50 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-bold text-slate-950 max-w-[70%]">{service.name}</h4>
                  <button 
                    onClick={() => toggleServiceActive(service.id)}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    {service.isActive ? (
                      <ToggleRight className="w-9 h-9 text-[#1450FF]" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-300" />
                    )}
                  </button>
                </div>

                {/* Duration and Price Indicators */}
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 font-mono">
                  <span className="flex items-center gap-1 bg-slate-100 border border-[#E4E6EA] px-2.5 py-1 rounded-[4px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {service.duration} Minuti
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 border border-[#E4E6EA] px-2.5 py-1 rounded-[4px]">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" /> {service.price} €
                  </span>
                </div>

                {/* Deposit configuration card */}
                {service.depositRequired ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-[4px] flex items-start gap-2.5 text-xs text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-800">Acconto Opzionale Attivo</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Consigliati <span className="font-bold text-emerald-700 font-mono">{service.depositValue}{service.depositType === 'PERCENTAGE' ? '%' : '€'}</span> ({service.depositType === 'PERCENTAGE' ? `${Math.round((service.price * service.depositValue) / 100)}€` : `${service.depositValue}€`}). Il cliente può versarli o pagare in sede.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-[#E4E6EA] p-3 rounded-[4px] flex items-start gap-2.5 text-xs text-slate-500">
                    <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-700">Nessun Acconto Proposto</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        I clienti prenotano direttamente pagando a fine servizio in salone.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Area */}
              <div className="pt-3 border-t border-[#E4E6EA] flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Stato: {service.isActive ? 'Attivo & Online' : 'Disattivato'}</span>
                {service.depositRequired && (
                  <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1 font-mono">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Acconto Opzionale
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD SERVICE */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#E4E6EA] rounded-[6px] max-w-md w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6EA]">
              <h4 className="text-base font-bold text-slate-950 font-display flex items-center gap-2">
                <NotebookTabs className="w-4 h-4 text-[#1450FF]" />
                Aggiungi Nuovo Trattamento
              </h4>
              <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-slate-100 rounded-[4px] text-slate-500 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome del Trattamento</label>
                <input
                  type="text"
                  required
                  placeholder="es. Taglio Capelli & Barba"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none transition placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durata (Minuti)</label>
                  <input
                    type="number"
                    required
                    min={15}
                    max={240}
                    step={5}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prezzo (€)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={1000}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2.5 focus:border-[#1450FF] focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* Protect layout */}
              <div className="border border-[#E4E6EA] p-3 rounded-[4px] space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800">Abilita Opzione Acconto Online (Facoltativo)</label>
                    <p className="text-[10px] text-slate-500">I clienti potranno scegliere se versare l'acconto subito o pagare direttamente in sede.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={newDepositRequired}
                    onChange={(e) => setNewDepositRequired(e.target.checked)}
                    className="w-4.5 h-4.5 accent-[#1450FF] cursor-pointer"
                  />
                </div>

                {newDepositRequired && (
                  <div className="space-y-3 pt-2 border-t border-[#E4E6EA] animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo di Caparra</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewDepositType('FIXED')}
                          className={`p-2 rounded-[4px] text-xs font-semibold border text-center transition ${
                            newDepositType === 'FIXED'
                              ? 'border-blue-300 bg-blue-50 text-[#1450FF] font-bold'
                              : 'border-[#E4E6EA] bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Quota Fissa (es. 10€)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewDepositType('PERCENTAGE')}
                          className={`p-2 rounded-[4px] text-xs font-semibold border text-center transition ${
                            newDepositType === 'PERCENTAGE'
                              ? 'border-blue-300 bg-blue-50 text-[#1450FF] font-bold'
                              : 'border-[#E4E6EA] bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Percentuale (es. 50%)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Valore Caparra ({newDepositType === 'FIXED' ? '€' : '%'})
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={newDepositType === 'FIXED' ? newPrice : 100}
                        value={newDepositValue}
                        onChange={(e) => setNewDepositValue(Number(e.target.value))}
                        className="w-full bg-white border border-[#E4E6EA] text-slate-900 text-xs rounded-[4px] p-2 focus:border-[#1450FF] focus:outline-none transition font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        I clienti pagheranno {newDepositType === 'FIXED' ? `${newDepositValue}€` : `${Math.round((newPrice * newDepositValue) / 100)}€`} all'atto della prenotazione.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-[4px] border border-[#E4E6EA] transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="w-full bg-[#1450FF] hover:bg-blue-600 text-white text-xs font-semibold py-2.5 rounded-[4px] transition active:scale-[0.98]"
                >
                  Salva Servizio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
