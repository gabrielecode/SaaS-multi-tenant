import React, { useState } from 'react';
import { BusinessConfig, Client, WhatsAppCampaign } from '../types';
import { sendWhatsAppTemplateMessage, logSystemEvent } from '../lib/supabase';
import { MessageSquare, Send, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

interface MarketingWhatsAppProps {
  config: BusinessConfig;
  clients: Client[];
  campaigns: WhatsAppCampaign[];
  onUpdateCampaigns: (campaigns: WhatsAppCampaign[]) => void;
}

export default function MarketingWhatsApp({ config, clients, campaigns, onUpdateCampaigns }: MarketingWhatsAppProps) {
  const [title, setTitle] = useState('');
  const [templateName, setTemplateName] = useState('vip_discount_promo');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'VIP' | 'AT_RISK' | 'INACTIVE'>('VIP');
  const [messageBody, setMessageBody] = useState('Ciao {NOME}, ti regaliamo uno sconto del 20% sul tuo prossimo trattamento da ' + config.name + '! Prenota ora direttamente dal link.');
  const [isSending, setIsSending] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const getFilteredClients = () => {
    if (targetAudience === 'VIP') return clients.filter(c => c.isVip || c.reliabilityScore >= 90);
    if (targetAudience === 'AT_RISK') return clients.filter(c => c.riskLevel === 'HIGH' || c.noShowCount > 0);
    if (targetAudience === 'INACTIVE') return clients.filter(c => c.completedCount <= 2);
    return clients;
  };

  const recipients = getFilteredClients();

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !messageBody) return;

    setIsSending(true);

    try {
      let sentCount = 0;
      for (const client of recipients) {
        await sendWhatsAppTemplateMessage(
          config.metaPhoneNumberId || '105482390124892',
          config.metaWhatsappToken || 'mock_token',
          client.phone,
          templateName,
          { nome: client.name }
        );
        sentCount++;
      }

      const newCampaign: WhatsAppCampaign = {
        id: 'camp_' + Date.now(),
        tenant_id: config.tenant_id,
        title,
        templateName,
        targetAudience,
        messageBody,
        sentCount,
        deliveredCount: sentCount,
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };

      onUpdateCampaigns([newCampaign, ...campaigns]);
      logSystemEvent('INFO', 'META_WHATSAPP', `Campagna WhatsApp "${title}" inviata con successo a ${sentCount} clienti via Meta Cloud API`, config.tenant_id);

      setSuccessToast(`Campagna inviata con successo a ${sentCount} contatti via WhatsApp Cloud API!`);
      setTitle('');
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err) {
      console.error(err);
      logSystemEvent('ERROR', 'META_WHATSAPP', `Errore invio campagna WhatsApp: ${err}`, config.tenant_id);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 uppercase">Meta WhatsApp Cloud API</span>
            <span className="text-xs text-slate-400">Marketing & Promozioni Automatiche</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Campagne Promozionali WhatsApp</h2>
          <p className="text-xs text-slate-500 mt-0.5">Invia offerte mirate, promemoria di ritorno e coupon sconto collegati all'API ufficiale Meta.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${config.metaWhatsappToken ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            <span className={`w-2 h-2 rounded-full ${config.metaWhatsappToken ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            {config.metaWhatsappToken ? 'API Meta Connessa' : 'Token da Configurare'}
          </span>
        </div>
      </div>

      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-xs shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-1">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            Crea Nuova Campagna
          </h3>

          <form onSubmit={handleSendCampaign} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Titolo Campagna *</label>
              <input
                type="text"
                required
                placeholder="es. Promo Primavera VIP"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Template Ufficiale Meta</label>
              <select
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="vip_discount_promo">Sconto Fedeltà VIP (vip_discount_promo)</option>
                <option value="reactivation_offer">Riattivazione Cliente Inattivo (reactivation_offer)</option>
                <option value="last_minute_slot">Ultimo Minuto Disponibile (last_minute_slot)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Filtro Pubblico Target</label>
              <select
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="VIP">Clienti VIP & Alta Affidabilità ({clients.filter(c => c.isVip || c.reliabilityScore >= 90).length})</option>
                <option value="INACTIVE">Clienti Inattivi ({clients.filter(c => c.completedCount <= 2).length})</option>
                <option value="AT_RISK">Clienti a Rischio No-Show ({clients.filter(c => c.riskLevel === 'HIGH').length})</option>
                <option value="ALL">Tutti i Clienti ({clients.length})</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Destinatari stimati: <span className="font-bold text-emerald-600">{recipients.length} clienti</span></p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Testo Messaggio WhatsApp</label>
              <textarea
                rows={4}
                required
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400">Puoi usare la variabile &#123;NOME&#125; per personalizzare il messaggio.</span>
            </div>

            <button
              type="submit"
              disabled={isSending || recipients.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Invio in corso tramite Meta API...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Invia Campagna ({recipients.length} WhatsApp)
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Storico Campagne & Metriche di Consegna
          </h3>

          <div className="space-y-3">
            {campaigns.map(camp => (
              <div key={camp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">{camp.title}</div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-200 uppercase">
                    {camp.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100 font-mono">
                  {camp.messageBody}
                </p>
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-3">
                    <span>Target: <strong className="text-slate-800">{camp.targetAudience}</strong></span>
                    <span>Template: <strong className="text-slate-800">{camp.templateName}</strong></span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold">
                    <span className="text-emerald-600">✓ Inviati: {camp.sentCount}</span>
                    <span className="text-blue-600">Consegnati: {camp.deliveredCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
