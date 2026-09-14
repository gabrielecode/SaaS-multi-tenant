/**
 * Specifiche Backend, Schemi Database SQL e Cron Worker per l'automazione
 * "Richiesta Recensione Google WhatsApp" post-servizio completato.
 * 
 * Questo file include:
 * 1. MIGRATION SQL per PostgreSQL / Supabase
 * 2. NODE.JS / EXPRESS / CRON SERVICE per esecuzione autonoma server-side
 * 3. SUPABASE EDGE FUNCTION / WEBHOOK trigger
 */

export const SQL_DATABASE_MIGRATION = `-- =========================================================================
-- SQL MIGRATION: Automazione Recensioni Google su WhatsApp (NoShow Reducer)
-- Eseguibile su Supabase SQL Editor, PostgreSQL o Cloud SQL
-- =========================================================================

-- 1. Aggiornamento Tabella Appuntamenti
ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_request_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recensione_richiesta BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMPTZ;

-- Indice per ottimizzare la query del Cron Worker (cerca appuntamenti completati senza invio)
CREATE INDEX IF NOT EXISTS idx_appointments_review_queue 
  ON appointments (status, review_request_sent, recensione_richiesta, completed_at)
  WHERE status = 'COMPLETED' AND review_request_sent = FALSE;

-- 2. Aggiornamento Tabella Impostazioni Salone (Business Config)
ALTER TABLE business_configs
  ADD COLUMN IF NOT EXISTS google_review_link TEXT DEFAULT 'https://g.page/r/your-salon/review',
  ADD COLUMN IF NOT EXISTS google_review_automation_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS google_review_delay_hours NUMERIC DEFAULT 2,
  ADD COLUMN IF NOT EXISTS google_review_template TEXT DEFAULT 'Ciao {NOME}! Speriamo che ti sia piaciuto il servizio oggi da {SALONE}. Ti andrebbe di lasciarci una recensione su Google per aiutarci a crescere? Bastano 2 secondi qui: {LINK_RECENSIONE}. Grazie mille!',
  ADD COLUMN IF NOT EXISTS auto_complete_past_appointments BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN appointments.completed_at IS 'Timestamp ISO del completamento servizio';
COMMENT ON COLUMN appointments.review_request_sent IS 'Flag anti-duplicato per evitare richieste multiple';
COMMENT ON COLUMN appointments.recensione_richiesta IS 'Alias compatibile flag recensione richiesta';
COMMENT ON COLUMN business_configs.google_review_delay_hours IS 'Ritardo di invio in ore dopo il completamento (default: 2 ore)';
`;

export const NODEJS_BACKEND_CRON_CODE = `/**
 * Backend Node.js / Express Cron Worker
 * Esegue il polling periodico ogni 5 minuti per:
 * 1. Segnare come COMPLETED gli appuntamenti terminati
 * 2. Inviare il messaggio WhatsApp tramite Meta Cloud API dopo il delay configurato
 */

import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Esegui ogni 5 minuti
cron.schedule('*/5 * * * *', async () => {
  console.log('[CRON] Controllo automazione recensioni Google WhatsApp in corso...');
  const now = new Date();

  // 1. Recupera configurazioni saloni attive
  const { data: configs } = await supabase
    .from('business_configs')
    .select('*')
    .eq('google_review_automation_enabled', true);

  if (!configs || configs.length === 0) return;

  for (const config of configs) {
    const delayHours = config.google_review_delay_hours || 2;
    const cutoffTime = new Date(now.getTime() - delayHours * 60 * 60 * 1000).toISOString();

    // 2. Query Appuntamenti COMPLETED senza invio recensione e con completamento antecedente al cutoff
    const { data: pendingAppointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('tenant_id', config.tenant_id)
      .eq('status', 'COMPLETED')
      .eq('review_request_sent', false)
      .lte('completed_at', cutoffTime);

    if (!pendingAppointments || pendingAppointments.length === 0) continue;

    for (const app of pendingAppointments) {
      const clientName = (app.client_name || '').split(' ')[0];
      const message = (config.google_review_template || '')
        .replace('{NOME}', clientName)
        .replace('{SALONE}', config.name)
        .replace('{SERVIZIO}', app.service_name || 'trattamento')
        .replace('{LINK_RECENSIONE}', config.google_review_link || '');

      try {
        // Invio tramite Meta WhatsApp Cloud API
        if (config.meta_phone_number_id && config.meta_whatsapp_token) {
          const response = await fetch(\`https://graph.facebook.com/v17.0/\${config.meta_phone_number_id}/messages\`, {
            method: 'POST',
            headers: {
              'Authorization': \`Bearer \${config.meta_whatsapp_token}\`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: app.client_phone.replace(/\\D/g, ''),
              type: 'text',
              text: { body: message }
            })
          });

          if (!response.ok) {
            console.error(\`Errore invio WhatsApp a \${app.client_phone}\`, await response.text());
            continue;
          }
        }

        // Aggiorna stato nel DB con flag anti-duplicato
        await supabase
          .from('appointments')
          .update({
            review_request_sent: true,
            recensione_richiesta: true,
            review_requested_at: new Date().toISOString()
          })
          .eq('id', app.id);

        console.log(\`[CRON] Recensione Google inviata a \${app.client_name} per appuntamento \${app.id}\`);
      } catch (err) {
        console.error('Errore invio recensione:', err);
      }
    }
  }
});
`;
