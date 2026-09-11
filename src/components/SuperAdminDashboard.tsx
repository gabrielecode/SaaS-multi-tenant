import { useState, FormEvent } from 'react';
import { TenantSalon, SystemLog } from '../types';
import { maskEmail, maskPhoneNumber } from '../lib/privacyUtils';
import { Building2, ShieldCheck, DollarSign, Activity, Users, AlertTriangle, CheckCircle, RefreshCw, Server, Database, Plus, X, Eye, Lock, ShieldAlert } from 'lucide-react';

interface SuperAdminDashboardProps {
  tenants: TenantSalon[];
  onSelectTenant: (tenantId: string) => void;
  currentTenantId: string;
  onInspectApp?: (tenantId: string) => void;
  onLogoutAdmin?: () => void;
}

export default function SuperAdminDashboard({ 
  tenants, 
  onSelectTenant, 
  currentTenantId,
  onInspectApp,
  onLogoutAdmin
}: SuperAdminDashboardProps) {
  const [tenantList, setTenantList] = useState<TenantSalon[]>(tenants);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [privacyMaskingActive, setPrivacyMaskingActive] = useState(true);
  
  // New Tenant form state
  const [newSalonName, setNewSalonName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newCategory, setNewCategory] = useState('Barbiere & Parrucchiere');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPlan, setNewPlan] = useState<'BASIC' | 'PRO' | 'ENTERPRISE'>('PRO');
  const [modalError, setModalError] = useState<string | null>(null);

  const [logs] = useState<SystemLog[]>(() => {
    return JSON.parse(localStorage.getItem('ns_system_logs') || '[]');
  });

  const handleRegisterTenant = (e: FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!newSalonName.trim() || !newOwnerName.trim() || !newEmail.trim() || !newPhone.trim()) {
      setModalError('Tutti i campi contrassegnati con * sono obbligatori.');
      return;
    }

    const feeMap = { BASIC: 29, PRO: 49, ENTERPRISE: 99 };
    const newTenant: TenantSalon = {
      id: 'salon_tenant_' + Date.now(),
      name: newSalonName.trim(),
      category: newCategory,
      ownerName: newOwnerName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      subscriptionStatus: 'ACTIVE',
      plan: newPlan,
      monthlyFee: feeMap[newPlan],
      createdAt: new Date().toISOString().split('T')[0],
      supabaseConfigured: true,
      metaWhatsAppConfigured: true
    };

    const updated = [newTenant, ...tenantList];
    setTenantList(updated);
    localStorage.setItem('ns_tenants', JSON.stringify(updated));

    // Reset form
    setNewSalonName('');
    setNewOwnerName('');
    setNewEmail('');
    setNewPhone('');
    setShowAddModal(false);
  };

  const totalMRR = tenantList.reduce((acc, t) => acc + (t.subscriptionStatus === 'ACTIVE' ? t.monthlyFee : 0), 0);
  const activeSalonsCount = tenantList.filter(t => t.subscriptionStatus === 'ACTIVE').length;

  const handleToggleStatus = (tenantId: string) => {
    setTenantList(prev => prev.map(t => {
      if (t.id === tenantId) {
        const nextStatus = t.subscriptionStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        return { ...t, subscriptionStatus: nextStatus };
      }
      return t;
    }));
  };

  const filteredTenants = tenantList.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Super Admin Top Hero */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full border border-purple-200 uppercase">Super Admin SaaS</span>
            <span className="text-xs text-slate-400">Piattaforma Multi-Tenant Centrale</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Dati Sensibili Protetti (LPD/GDPR)
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Controllo Infrastruttura & Saloni</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestisci tutti i tenant iscritti, monitora il fatturato ricorrente (MRR) e ispeziona l'app con anonimizzazione automatica dei dati privati.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onInspectApp && (
            <button
              onClick={() => onInspectApp(currentTenantId)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95"
              title="Visiona tutta l'app del salone selezionato con dati sensibili esclusi"
            >
              <Eye className="w-3.5 h-3.5" />
              Visiona Tutta l'App (Audit)
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Registra Salone
          </button>
          {onLogoutAdmin && (
            <button
              onClick={onLogoutAdmin}
              className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold rounded-xl transition active:scale-95"
            >
              Disconnetti
            </button>
          )}
        </div>
      </div>

      {/* SaaS Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Fatturato MRR</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">€{totalMRR} <span className="text-xs font-normal text-slate-500">/mo</span></h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Saloni Attivi</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{activeSalonsCount} <span className="text-xs font-normal text-slate-500">/ {tenantList.length}</span></h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Supabase Postgres</p>
            <h3 className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Connesso & Sicuro (RLS)
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Meta WhatsApp API</p>
            <h3 className="text-xs font-bold text-indigo-600 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Cloud Webhook Attivo
            </h3>
          </div>
        </div>
      </div>

      {/* Tenants Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Elenco Saloni Multi-Tenant</h3>
            <p className="text-xs text-slate-500">Seleziona un tenant per impersonarlo o gestisci lo stato dell'abbonamento.</p>
          </div>
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Cerca saloni o titolare..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="p-4">Salone / Tenant</th>
                <th className="p-4">Titolare</th>
                <th className="p-4">Piano & Prezzo</th>
                <th className="p-4">Stato Abbonamento</th>
                <th className="p-4">Integrazioni</th>
                <th className="p-4 text-right">Azioni / Impersona</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTenants.map(tenant => {
                const isCurrent = tenant.id === currentTenantId;
                return (
                  <tr key={tenant.id} className={`hover:bg-slate-50/50 transition ${isCurrent ? 'bg-indigo-50/30' : ''}`}>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{tenant.name}</div>
                      <div className="text-[11px] text-slate-400">{tenant.category} • ID: {tenant.id}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{tenant.ownerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-emerald-600" />
                        {privacyMaskingActive ? maskEmail(tenant.email) : tenant.email}
                      </div>
                      {tenant.phone && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {privacyMaskingActive ? maskPhoneNumber(tenant.phone) : tenant.phone}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 font-bold text-slate-700 rounded-md text-[10px] uppercase">
                        {tenant.plan}
                      </span>
                      <span className="ml-2 font-bold text-indigo-600">€{tenant.monthlyFee}/mo</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        tenant.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        tenant.subscriptionStatus === 'TRIAL' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          tenant.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500' :
                          tenant.subscriptionStatus === 'TRIAL' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}></span>
                        {tenant.subscriptionStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${tenant.supabaseConfigured ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                          Supabase
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${tenant.metaWhatsAppConfigured ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          WhatsApp
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      {onInspectApp && (
                        <button
                          onClick={() => onInspectApp(tenant.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition"
                          title="Visiona app con dati sensibili protetti"
                        >
                          Visiona App
                        </button>
                      )}
                      <button
                        onClick={() => onSelectTenant(tenant.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isCurrent 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isCurrent ? 'In Uso' : 'Seleziona'}
                      </button>
                      <button
                        onClick={() => handleToggleStatus(tenant.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                        title="Attiva/Sospendi"
                      >
                        {tenant.subscriptionStatus === 'ACTIVE' ? 'Sospendi' : 'Riattiva'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Logs & Audit Trail */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Registro Eventi & Audit Trail Cloud</h3>
            <p className="text-xs text-slate-500">Monitoraggio real-time delle chiamate API Webhook Meta WhatsApp e transazioni database.</p>
          </div>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg">Ultimi eventi</span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {logs.map((log: SystemLog) => (
            <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between text-xs gap-3">
              <div className="flex items-start gap-2.5">
                {log.level === 'INFO' && <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />}
                {log.level === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />}
                {log.level === 'ERROR' && <ShieldCheck className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />}
                <div>
                  <div className="font-semibold text-slate-800">{log.message}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Servizio: <span className="font-mono text-indigo-600">{log.service}</span> • Tenant: {log.tenant_id}</div>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Registra Nuovo Salone Tenant */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 my-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Registra Nuovo Salone (Tenant)</h3>
                  <p className="text-xs text-slate-500">Crea un nuovo ambiente aziendale isolato sulla piattaforma SaaS.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setModalError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{modalError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterTenant} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome del Salone / Attività *</label>
                <input
                  type="text"
                  required
                  placeholder="es. Barberia & Spa Napoli Centro"
                  value={newSalonName}
                  onChange={e => setNewSalonName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Titolare *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Antonio Esposito"
                    value={newOwnerName}
                    onChange={e => setNewOwnerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="Barbiere & Parrucchiere">Barbiere & Parrucchiere</option>
                    <option value="Centro Estetico & Benessere">Centro Estetico & Benessere</option>
                    <option value="Salone Acconciature Donna">Salone Acconciature Donna</option>
                    <option value="Nail & Lash Studio">Nail & Lash Studio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Aziendale / Login *</label>
                  <input
                    type="email"
                    required
                    placeholder="es. info@barberia.it"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefono WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="es. +39 340 1234567"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Piano SaaS Selezionato</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'BASIC', label: 'Basic (29€/m)', fee: 29 },
                    { id: 'PRO', label: 'Pro (49€/m)', fee: 49 },
                    { id: 'ENTERPRISE', label: 'Enterprise (99€/m)', fee: 99 }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewPlan(p.id as any)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition ${
                        newPlan === p.id 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-[11px]">{p.id}</div>
                      <div className="text-[10px] text-slate-400 font-normal">€{p.fee}/mese</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Crea Salone Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
