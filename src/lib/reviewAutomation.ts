import { Appointment, AppointmentStatus, BusinessConfig, Service } from '../types';
import { buildWhatsAppUrl, normalizePhoneForWhatsApp } from './phoneUtils';
import { logSystemEvent, sendWhatsAppTemplateMessage } from './supabase';

export const DEFAULT_REVIEW_TEMPLATE = 
  "Ciao {NOME}! Speriamo che ti sia piaciuto il servizio oggi da {SALONE}. Ti andrebbe di lasciarci una recensione su Google per aiutarci a crescere? Bastano 2 secondi qui: {LINK_RECENSIONE}. Grazie mille!";

/**
 * Compila il template del messaggio WhatsApp sostituendo i segnaposto con i dati reali
 */
export function formatReviewMessage(
  template: string | undefined,
  clientName: string,
  salonName: string,
  serviceName: string = 'il tuo trattamento',
  reviewLink: string = ''
): string {
  const tpl = template && template.trim() ? template : DEFAULT_REVIEW_TEMPLATE;
  const firstName = (clientName || 'Gentile Cliente').split(' ')[0];

  return tpl
    .replace(/{NOME}/g, firstName)
    .replace(/\[Nome Cliente\]/gi, firstName)
    .replace(/{SALONE}/g, salonName || 'il nostro Salone')
    .replace(/\[Nome Salone\]/gi, salonName || 'il nostro Salone')
    .replace(/{SERVIZIO}/g, serviceName)
    .replace(/\[Servizio\]/gi, serviceName)
    .replace(/{LINK_RECENSIONE}/g, reviewLink.trim())
    .replace(/\[Link Diretto Google Review\]/gi, reviewLink.trim())
    .replace(/{LINK}/g, reviewLink.trim());
}

/**
 * Calcola lo stato dell'automazione recensione per un dato appuntamento
 */
export function getGoogleReviewState(appointment: Appointment, config: BusinessConfig) {
  const isCompleted = appointment.status === AppointmentStatus.COMPLETED;
  const isAlreadySent = Boolean(appointment.reviewRequestSent || appointment.recensione_richiesta);
  const delayHours = typeof config.googleReviewDelayHours === 'number' ? config.googleReviewDelayHours : 2;
  const reviewLink = config.googleReviewLink || 'https://g.page/r/example/review';
  
  const messageText = formatReviewMessage(
    config.googleReviewTemplate,
    appointment.clientName,
    config.name,
    appointment.serviceName,
    reviewLink
  );

  const whatsAppUrl = buildWhatsAppUrl(
    appointment.clientPhone,
    messageText,
    config.country || 'CH'
  );

  if (!isCompleted) {
    return {
      isEligible: false,
      isAlreadySent: false,
      isPendingTimer: false,
      delayHours,
      remainingMinutes: 0,
      reviewLink,
      messageText,
      whatsAppUrl,
      scheduledSendTime: null
    };
  }

  if (isAlreadySent) {
    return {
      isEligible: true,
      isAlreadySent: true,
      isPendingTimer: false,
      delayHours,
      remainingMinutes: 0,
      reviewLink,
      messageText,
      whatsAppUrl,
      scheduledSendTime: appointment.reviewRequestedAt ? new Date(appointment.reviewRequestedAt) : null
    };
  }

  // Calcolo timer di attesa (delay)
  // Se è presente completedAt usiamo quella, altrimenti la data/ora prevista dell'appuntamento
  let completedTimeMs: number;
  if (appointment.completedAt) {
    completedTimeMs = new Date(appointment.completedAt).getTime();
  } else {
    completedTimeMs = new Date(`${appointment.date}T${appointment.time}:00`).getTime();
  }

  const scheduledTimeMs = completedTimeMs + (delayHours * 60 * 60 * 1000);
  const nowMs = Date.now();
  const diffMs = scheduledTimeMs - nowMs;
  const isPendingTimer = diffMs > 0;
  const remainingMinutes = Math.max(0, Math.ceil(diffMs / (60 * 1000)));

  return {
    isEligible: true,
    isAlreadySent: false,
    isPendingTimer,
    delayHours,
    remainingMinutes,
    reviewLink,
    messageText,
    whatsAppUrl,
    scheduledSendTime: new Date(scheduledTimeMs)
  };
}

/**
 * Invia o finalizza la richiesta di recensione Google via WhatsApp per un appuntamento
 * Imposta il flag anti-duplicato 'reviewRequestSent = true' e 'recensione_richiesta = true'
 */
export async function triggerReviewRequest(
  appointment: Appointment,
  config: BusinessConfig
): Promise<{ updatedAppointment: Appointment; success: boolean; method: 'META_API' | 'WA_ME'; message: string }> {
  // Controllo anti-duplicato rigido
  if (appointment.reviewRequestSent || appointment.recensione_richiesta) {
    return {
      updatedAppointment: appointment,
      success: true,
      method: 'WA_ME',
      message: 'Richiesta di recensione già inviata in precedenza.'
    };
  }

  const reviewLink = config.googleReviewLink || 'https://g.page/r/example/review';
  const messageText = formatReviewMessage(
    config.googleReviewTemplate,
    appointment.clientName,
    config.name,
    appointment.serviceName,
    reviewLink
  );

  let method: 'META_API' | 'WA_ME' = 'WA_ME';

  // Se è configurata l'API ufficiale Meta WhatsApp Cloud API
  if (config.metaPhoneNumberId && config.metaWhatsappToken) {
    try {
      await sendWhatsAppTemplateMessage(
        config.metaPhoneNumberId,
        config.metaWhatsappToken,
        appointment.clientPhone,
        'google_review_request',
        {
          nome: appointment.clientName.split(' ')[0],
          salone: config.name,
          link: reviewLink
        }
      );
      method = 'META_API';
    } catch (err) {
      console.warn('Meta API error during review trigger, fallback to direct WhatsApp:', err);
    }
  }

  const nowIso = new Date().toISOString();
  const updatedAppointment: Appointment = {
    ...appointment,
    reviewRequestSent: true,
    recensione_richiesta: true, // Flag esplicito come da requisiti
    reviewRequestedAt: nowIso
  };

  logSystemEvent(
    'INFO',
    'META_WHATSAPP',
    `Automazione Recensione Google: inviato messaggio WhatsApp a ${appointment.clientName} (${appointment.clientPhone}) per appuntamento ${appointment.serviceName}`,
    config.tenant_id
  );

  return {
    updatedAppointment,
    success: true,
    method,
    message: `Richiesta recensione inviata con successo a ${appointment.clientName}!`
  };
}

/**
 * Ciclo di automazione eseguito in background (Timer & Auto-completion):
 * 1. Aggiorna automaticamente a COMPLETED gli appuntamenti passati se abilitato.
 * 2. Invia WhatsApp di recensione agli appuntamenti COMPLETED trascorsa la finestra di delay.
 */
export async function runReviewAutomationCycle(
  appointments: Appointment[],
  services: Service[],
  config: BusinessConfig
): Promise<{
  updatedAppointments: Appointment[];
  autoCompletedCount: number;
  reviewsTriggeredCount: number;
  triggeredNames: string[];
}> {
  let hasChanges = false;
  let autoCompletedCount = 0;
  let reviewsTriggeredCount = 0;
  const triggeredNames: string[] = [];
  const now = new Date();
  const nowMs = now.getTime();
  const todayStr = now.toISOString().split('T')[0];

  const updatedAppointments = await Promise.all(
    appointments.map(async (app) => {
      let currentApp = { ...app };

      // 1. Aggiornamento automatico a fine orario servizio (se attivo)
      if (
        config.autoCompletePastAppointments !== false &&
        currentApp.status === AppointmentStatus.CONFIRMED
      ) {
        const service = services.find(s => s.id === currentApp.serviceId);
        const durationMin = service?.duration || 45;

        // Costruisci data/ora di fine servizio
        try {
          const appStart = new Date(`${currentApp.date}T${currentApp.time}:00`);
          const appEndMs = appStart.getTime() + (durationMin * 60 * 1000);

          // Se l'orario di fine è passato da almeno 5 minuti
          if (nowMs > appEndMs + (5 * 60 * 1000)) {
            currentApp.status = AppointmentStatus.COMPLETED;
            currentApp.completedAt = new Date(appEndMs).toISOString();
            hasChanges = true;
            autoCompletedCount++;
            logSystemEvent(
              'INFO',
              'CRON_REMINDERS',
              `Auto-completamento a fine orario: appuntamento ${currentApp.serviceName} di ${currentApp.clientName} segnato come completato`,
              config.tenant_id
            );
          }
        } catch {}
      }

      // 2. Controllo Timer di Attesa (Delay) per Appuntamenti COMPLETED
      if (
        config.googleReviewAutomationEnabled !== false &&
        currentApp.status === AppointmentStatus.COMPLETED &&
        !currentApp.reviewRequestSent &&
        !currentApp.recensione_richiesta
      ) {
        const state = getGoogleReviewState(currentApp, config);
        
        // Se il tempo di attesa è trascorso (remainingMinutes === 0 e non è pending)
        if (!state.isPendingTimer) {
          const res = await triggerReviewRequest(currentApp, config);
          currentApp = res.updatedAppointment;
          hasChanges = true;
          reviewsTriggeredCount++;
          triggeredNames.push(currentApp.clientName);
        }
      }

      return currentApp;
    })
  );

  return {
    updatedAppointments: hasChanges ? updatedAppointments : appointments,
    autoCompletedCount,
    reviewsTriggeredCount,
    triggeredNames
  };
}
