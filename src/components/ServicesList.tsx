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
          <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
            <NotebookTabs className="w-5 h-5 text-indigo-600 stroke-[1.5]" />
            Listino Servizi
          </h2>
          <p className="text-xs text-slate-500 mt-1">Configura i tuoi trattamenti, prezzi, durate e le policy di caparra per prenotazione online.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] self-start sm:self-auto shadow-md"
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
              className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-between space-y-4 transition-all ${
                service.isActive ? 'glass-card glass-card-hover border-slate-200/80' : 'border-slate-200 bg-slate-50/50 opacity-60'
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
                      <ToggleRight className="w-9 h-9 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-300" />
                    )}
                  </button>
                </div>

                {/* Duration and Price Indicators */}
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {service.duration} Minuti
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" /> {service.price} €
                  </span>
                </div>

                {/* Deposit configuration card */}
                {service.depositRequired ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-800">Caparra Attiva</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Richiesti <span className="font-bold text-emerald-700">{service.depositValue}{service.depositType === 'PERCENTAGE' ? '%' : '€'}</span> ({service.depositType === 'PERCENTAGE' ? `${Math.round((service.price * service.depositValue) / 100)}€` : `${service.depositValue}€`}) all'atto della prenotazione.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-start gap-2.5 text-xs text-slate-500">
                    <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-700">Nessuna Caparra</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        I clienti possono prenotarsi gratuitamente. Maggior rischio di disdetta last-minute.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Area */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Stato: {service.isActive ? 'Attivo & Online' : 'Disattivato'}</span>
                {service.depositRequired && (
                  <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Protetto da Stripe
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD SERVICE */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-950">Aggiungi Nuovo Trattamento</h4>
              <button onClick={() => setShowAddForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
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
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200 placeholder-slate-400"
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
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
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
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {/* Protect layout */}
              <div className="border border-slate-200 p-3 rounded-xl space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800">Richiedi Caparra Online</label>
                    <p className="text-[10px] text-slate-500">I clienti pagano una quota subito per bloccare l'orario.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={newDepositRequired}
                    onChange={(e) => setNewDepositRequired(e.target.checked)}
                    className="w-4.5 h-4.5 accent-indigo-600 cursor-pointer"
                  />
                </div>

                {newDepositRequired && (
                  <div className="space-y-3 pt-2 border-t border-slate-200/80 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo di Caparra</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewDepositType('FIXED')}
                          className={`p-2 rounded-lg text-xs font-semibold border text-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                            newDepositType === 'FIXED'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Quota Fissa (es. 10€)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewDepositType('PERCENTAGE')}
                          className={`p-2 rounded-lg text-xs font-semibold border text-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                            newDepositType === 'PERCENTAGE'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
                        className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
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
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-3 rounded-lg border border-slate-200 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] shadow-sm"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] shadow-md"
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
