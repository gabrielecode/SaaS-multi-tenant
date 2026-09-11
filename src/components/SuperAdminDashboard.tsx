import { useState } from 'react';
import { TenantSalon, SystemLog } from '../types';
import { Building2, ShieldCheck, DollarSign, Activity, Users, AlertTriangle, CheckCircle, RefreshCw, Server, Database } from 'lucide-react';

interface SuperAdminDashboardProps {
  tenants: TenantSalon[];
  onSelectTenant: (tenantId: string) => void;
  currentTenantId: string;
}

export default function SuperAdminDashboard({ tenants, onSelectTenant, currentTenantId }: SuperAdminDashboardProps) {
  const [tenantList, setTenantList] = useState<TenantSalon[]>(tenants);
  const [searchTerm, setSearchTerm] = useState('');
  const [logs] = useState<SystemLog[]>(() => {
    return JSON.parse(localStorage.getItem('ns_system_logs') || '[]');
  });

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
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Controllo Infrastruttura & Saloni</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestisci tutti i tenant iscritti, monitora il fatturato ricorrente (MRR) e lo stato di Supabase.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sincronizza Cloud
          </button>
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
                      <div className="text-[11px] text-slate-400">{tenant.email}</div>
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
                    <td className="p-4 text-right space-x-2">
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
    </div>
  );
}
