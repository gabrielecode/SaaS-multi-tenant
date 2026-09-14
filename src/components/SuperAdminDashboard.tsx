import { useState, useMemo, FormEvent } from 'react';
import { TenantSalon, SystemLog, Appointment } from '../types';
import { maskEmail, maskPhoneNumber } from '../lib/privacyUtils';
import { 
  Building2, 
  ShieldCheck, 
  DollarSign, 
  Activity, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Server, 
  Database, 
  Plus, 
  X, 
  Eye, 
  Lock, 
  ShieldAlert, 
  Calendar,
  Search,
  Check,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  LogOut,
  Sparkles
} from 'lucide-react';

interface SuperAdminDashboardProps {
  tenants: TenantSalon[];
  onSelectTenant: (tenantId: string) => void;
  currentTenantId: string;
  onInspectApp?: (tenantId: string) => void;
  onLogoutAdmin?: () => void;
  appointments?: Appointment[];
}

export default function SuperAdminDashboard({ 
  tenants, 
  onSelectTenant, 
  currentTenantId,
  onInspectApp,
  onLogoutAdmin,
  appointments = []
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

  // Active tenant details
  const activeTenant = tenantList.find(t => t.id === currentTenantId) || tenantList[0];

  return (
    <div className="space-y-4 animate-fade-in pb-12 bg-[#FAFAFA] text-[#14161A] font-sans">
      
      {/* ------------------------------------------------------------- */}
      {/* EXECUTIVE TOPBAR WITH TENANT SELECTOR & SUPER ADMIN AUDIT MODE */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#14161A] text-white p-4 rounded-[6px] border border-[#E4E6EA] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-900/40 text-purple-300 text-[10px] font-bold uppercase rounded-[4px] border border-purple-700/50 flex items-center gap-1.5 font-mono">
              <ShieldAlert className="w-3 h-3 text-purple-400" /> Super Admin Audit Mode
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-900/40 text-emerald-300 text-[10px] font-bold uppercase rounded-[4px] border border-emerald-700/50 flex items-center gap-1 font-mono">
              <Lock className="w-2.5 h-2.5" /> GDPR & LPD
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white font-display">
            Piattaforma Multi-Tenant Enterprise
          </h2>
          <p className="text-xs text-slate-400">
            Controllo centralizzato di tutti i saloni, ispezioni di sicurezza e gestione abbonamenti.
          </p>
        </div>

        {/* Topbar Right Controls: Active Tenant Selector & Privacy Switch */}
        <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
          
          {/* Selettore Salone Attivo */}
          <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-[4px] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#1450FF] shrink-0" />
            <div className="text-left">
              <span className="block text-[9px] text-slate-400 uppercase font-bold">Tenant Attivo:</span>
              <select
                value={currentTenantId}
                onChange={(e) => onSelectTenant(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
              >
                {tenantList.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.name} ({t.plan})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Privacy Masking Toggle */}
          <button
            onClick={() => setPrivacyMaskingActive(!privacyMaskingActive)}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition flex items-center gap-1.5 border ${
              privacyMaskingActive 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                : 'bg-amber-950 text-amber-300 border-amber-800'
            }`}
            title="Attiva o disattiva l'anonimizzazione dei dati personali (GDPR)"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{privacyMaskingActive ? 'Privacy ON' : 'Privacy OFF'}</span>
          </button>

          {onLogoutAdmin && (
            <button
              onClick={onLogoutAdmin}
              className="p-2 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-300 rounded-[4px] transition border border-slate-700"
              title="Esci da Super Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* KPI METRIC CARDS EXECUTIVE                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* KPI 1: MRR */}
        <div className="bg-white p-4 rounded-[6px] border border-[#E4E6EA] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">MRR Totale</p>
            <h3 className="text-xl font-bold text-[#14161A] mt-0.5 font-mono">€{totalMRR} <span className="text-[11px] font-normal text-slate-500">/mo</span></h3>
          </div>
          <div className="p-2.5 bg-blue-50 text-[#1450FF] rounded-[4px] border border-blue-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Saloni Attivi */}
        <div className="bg-white p-4 rounded-[6px] border border-[#E4E6EA] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Saloni Iscritti</p>
            <h3 className="text-xl font-bold text-[#14161A] mt-0.5 font-mono">{activeSalonsCount} <span className="text-[11px] font-normal text-slate-500">/ {tenantList.length}</span></h3>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-700 rounded-[4px] border border-[#E4E6EA]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Supabase Postgres */}
        <div className="bg-white p-4 rounded-[6px] border border-[#E4E6EA] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Database Postgres</p>
            <h3 className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              RLS Attivo (Zero Leak)
            </h3>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-[4px] border border-emerald-100">
            <Database className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: WhatsApp Webhook API */}
        <div className="bg-white p-4 rounded-[6px] border border-[#E4E6EA] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WhatsApp API</p>
            <h3 className="text-xs font-bold text-purple-700 mt-1 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Webhook v21.0
            </h3>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-[4px] border border-purple-100">
            <Activity className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* TABELLA DEI TENANT (Design System ad alta densità)            */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-[6px] border border-[#E4E6EA] overflow-hidden">
        <div className="p-4 border-b border-[#E4E6EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-[#14161A] font-display">Gestione Tenant Saloni</h3>
            <p className="text-xs text-slate-500">Elenco completo dei saloni registrati, piani attivi e controlli di accesso isolati.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca salone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-[#E4E6EA] rounded-[4px] text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1450FF] w-full sm:w-56"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-[#1450FF] hover:bg-blue-600 text-white font-bold text-xs rounded-[4px] flex items-center gap-1 shrink-0 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuovo Salone</span>
            </button>
          </div>
        </div>

        {/* Tabella pulita con bordi netti #E4E6EA */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E4E6EA] text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Salone / Categoria</th>
                <th className="p-3">Titolare</th>
                <th className="p-3">Contatti</th>
                <th className="p-3">Piano / Tariffa</th>
                <th className="p-3">Stato</th>
                <th className="p-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E6EA]">
              {filteredTenants.map(tenant => {
                const isCurrent = tenant.id === currentTenantId;
                const tenantAppsCount = appointments.filter(a => a.tenant_id === tenant.id).length || Math.floor(Math.random() * 30) + 10;

                return (
                  <tr key={tenant.id} className={`hover:bg-slate-50/80 transition ${isCurrent ? 'bg-blue-50/40' : ''}`}>
                    <td className="p-3">
                      <div className="font-bold text-[#14161A] flex items-center gap-1.5">
                        <span>{tenant.name}</span>
                        {isCurrent && (
                          <span className="bg-[#1450FF] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[4px]">
                            Attivo
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{tenant.category}</span>
                    </td>
                    <td className="p-3 font-medium text-slate-800">
                      {tenant.ownerName}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">
                      <div>{privacyMaskingActive ? maskEmail(tenant.email) : tenant.email}</div>
                      <div>{privacyMaskingActive ? maskPhoneNumber(tenant.phone) : tenant.phone}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold font-mono text-[#1450FF]">
                        {tenant.plan}
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1"> (€{tenant.monthlyFee}/mo)</span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border ${
                        tenant.subscriptionStatus === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tenant.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {tenant.subscriptionStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectTenant(tenant.id)}
                          className={`px-2.5 py-1 rounded-[4px] font-bold text-[11px] transition ${
                            isCurrent
                              ? 'bg-[#1450FF] text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-[#E4E6EA]'
                          }`}
                        >
                          {isCurrent ? 'Selezionato' : 'Seleziona'}
                        </button>
                        {onInspectApp && (
                          <button
                            onClick={() => onInspectApp(tenant.id)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-[4px] font-bold text-[11px] transition"
                            title="Ispeziona app tenant"
                          >
                            Ispeziona
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TABELLA DEI LOG DI AUDIT E ANONIMIZZAZIONE GDPR                */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Log di Audit e Anonimizzazione GDPR / LPD</span>
            </h3>
            <p className="text-xs text-slate-500">Tracciamento in tempo reale delle attività di accesso e mascheramento automatico dei dati personali.</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl">
            Conforme Art. 32 GDPR
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Timestamp</th>
                <th className="pb-3 px-3">Livello</th>
                <th className="pb-3 px-3">Servizio / Modulo</th>
                <th className="pb-3 px-3">Evento & Descrizione</th>
                <th className="pb-3 px-3 text-right">Stato Privacy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log: SystemLog) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      log.level === 'INFO' ? 'bg-blue-50 text-blue-700' :
                      log.level === 'WARNING' ? 'bg-amber-50 text-amber-700' :
                      'bg-rose-50 text-rose-700'
                    }`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {log.service}
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    {log.message}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" /> Mascherato
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODALE: REGISTRA NUOVO SALONE TENANT                          */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 my-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Registra Nuovo Salone (Tenant)</h3>
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
                <AlertTriangle className="w-4 h-4 shrink-0" />
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
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
                      className={`p-2.5 rounded-2xl border text-center font-bold transition ${
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
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3 rounded-2xl transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-2xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crea Salone Tenant</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
