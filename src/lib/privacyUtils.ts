/**
 * Utilità per la conformità alla LPD (Legge federale sulla protezione dei dati - Svizzera)
 * e al GDPR per la visualizzazione dell'applicazione da parte del Super Admin.
 * Permette al Super Admin di monitorare e verificare il corretto funzionamento tecnico 
 * e i volumi dell'app senza avere accesso ai dati personali sensibili di clienti e titolari.
 */

import { Client, Appointment } from '../types';

/**
 * Offusca un numero di telefono preservando solo il prefisso e le ultime 2 cifre
 * Esempio: +41 79 987 65 43 -> +41 79 ••• •• 43
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return 'Non specificato';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length <= 4) return '••• •• ' + digits;

  const prefix = trimmed.startsWith('+41') ? '+41 ' : trimmed.startsWith('+39') ? '+39 ' : '+';
  const last2 = digits.slice(-2);
  return `${prefix}••• •• ${last2}`;
}

/**
 * Offusca un indirizzo email preservando prima lettera e dominio
 * Esempio: mario.rossi@gmail.com -> m•••••i@gmail.com
 */
export function maskEmail(email?: string | null): string {
  if (!email) return 'Non specificata';
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 2) return '••••@' + trimmed.split('@')[1];
  
  const userPart = trimmed.substring(0, atIndex);
  const domainPart = trimmed.substring(atIndex);
  const first = userPart[0];
  const last = userPart[userPart.length - 1];
  return `${first}•••••${last}${domainPart}`;
}

/**
 * Maschera note cliniche, note personali o dettagli riservati del cliente
 */
export function maskNotes(notes?: string | null): string {
  if (!notes || notes === 'Nessuna nota presente.') return 'Nessuna nota presente.';
  return '🔒 [Dato Riservato Cliente - Offuscato per Super Admin a norma LPD/GDPR]';
}

/**
 * Offusca il nome del cliente per audit super admin se richiesto
 * Esempio: Davide Neri -> Davide N.
 */
export function maskClientName(name: string): string {
  if (!name) return 'Cliente Anonimo';
  const parts = name.trim().split(' ');
  if (parts.length > 1) {
    return `${parts[0]} ${parts[1][0]}.`;
  }
  return `${name[0]}••••`;
}

/**
 * Clona un oggetto Client sostituendo i dati personali con le versioni mascherate
 */
export function anonymizeClientForSuperAdmin(client: Client): Client {
  return {
    ...client,
    name: maskClientName(client.name),
    phone: maskPhoneNumber(client.phone),
    email: client.email ? maskEmail(client.email) : '',
    notes: maskNotes(client.notes)
  };
}

/**
 * Clona un oggetto Appointment sostituendo i recapiti e dati sensibili
 */
export function anonymizeAppointmentForSuperAdmin(appointment: Appointment): Appointment {
  return {
    ...appointment,
    clientName: maskClientName(appointment.clientName),
    clientPhone: maskPhoneNumber(appointment.clientPhone),
    notes: appointment.notes ? maskNotes(appointment.notes) : undefined
  };
}
