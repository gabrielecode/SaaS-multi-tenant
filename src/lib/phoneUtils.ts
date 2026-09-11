/**
 * Utility per la gestione, validazione e formattazione dei numeri di telefono
 * con supporto specializzato per la Svizzera (+41) e prefissi internazionali.
 */

export interface CountryOption {
  code: string;
  name: string;
  prefix: string; // es. '+41'
  flag: string;
  placeholder: string;
  example: string;
}

export const SUPPORTED_COUNTRIES: CountryOption[] = [
  { code: 'CH', name: 'Svizzera', prefix: '+41', flag: '🇨🇭', placeholder: '79 123 45 67', example: '+41 79 123 45 67' },
  { code: 'IT', name: 'Italia', prefix: '+39', flag: '🇮🇹', placeholder: '345 678 9012', example: '+39 345 678 9012' },
  { code: 'FR', name: 'Francia', prefix: '+33', flag: '🇫🇷', placeholder: '6 12 34 56 78', example: '+33 6 12 34 56 78' },
  { code: 'DE', name: 'Germania', prefix: '+49', flag: '🇩🇪', placeholder: '151 23456789', example: '+49 151 23456789' },
  { code: 'AT', name: 'Austria', prefix: '+43', flag: '🇦🇹', placeholder: '664 1234567', example: '+43 664 1234567' },
  { code: 'GB', name: 'Regno Unito', prefix: '+44', flag: '🇬🇧', placeholder: '7911 123456', example: '+44 7911 123456' }
];

/**
 * Normalizza un numero di telefono per l'invio su WhatsApp (API Meta o wa.me link).
 * Ritorna solo le cifre del numero internazionale (senza +, spazi o trattini).
 * Se il numero è in formato locale svizzero (es. '079 123 45 67' o '076...'),
 * rimuove lo 0 iniziale e antepone il prefisso svizzero '41'.
 */
export function normalizePhoneForWhatsApp(phone: string, defaultCountryCode: string = 'CH'): string {
  if (!phone) return '';
  
  // Rimuovi caratteri non numerici tranne l'eventuale '+' iniziale
  let cleaned = phone.trim().replace(/\s+/g, '').replace(/[-().]/g, '');
  
  // Se inizia con '+' o '00'
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }
  
  if (cleaned.startsWith('+')) {
    const digits = cleaned.substring(1).replace(/\D/g, '');
    // Se ha il prefisso svizzero 41 seguito da 0 (es. +41 079...), rimuovi lo 0 interno
    if (digits.startsWith('410') && digits.length >= 10) {
      return '41' + digits.substring(3);
    }
    return digits;
  }
  
  const rawDigits = cleaned.replace(/\D/g, '');
  if (!rawDigits) return '';

  // Se inizia già con 41 ed è lungo almeno 9-11 cifre
  if (rawDigits.startsWith('41') && rawDigits.length >= 10) {
    if (rawDigits.startsWith('410')) {
      return '41' + rawDigits.substring(3);
    }
    return rawDigits;
  }

  // Se inizia già con 39 ed è lungo almeno 11-12 cifre
  if (rawDigits.startsWith('39') && rawDigits.length >= 11) {
    return rawDigits;
  }

  // Se il numero è in formato locale svizzero (inizia con 0, es: 079..., 078..., 076..., 077..., 091...)
  if (rawDigits.startsWith('0')) {
    const withoutZero = rawDigits.substring(1);
    if (defaultCountryCode === 'IT') {
      return '39' + rawDigits;
    }
    // Default Svizzera
    return '41' + withoutZero;
  }

  // Se non inizia con 0 ma è un numero svizzero (es. 791234567, 9 cifre tipiche dei cellulari svizzeri)
  if (defaultCountryCode === 'CH') {
    return '41' + rawDigits;
  } else if (defaultCountryCode === 'IT') {
    return '39' + rawDigits;
  }

  // Fallback prefisso svizzero se siamo in Svizzera
  return '41' + rawDigits;
}

/**
 * Genera il link wa.me sicuro e pronto per l'apertura su WhatsApp Web o App Mobile
 */
export function buildWhatsAppUrl(phone: string, message: string = '', defaultCountry: string = 'CH'): string {
  const normalized = normalizePhoneForWhatsApp(phone, defaultCountry);
  if (!normalized) return '#';
  const encodedText = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${normalized}${encodedText}`;
}

/**
 * Formatta un numero di telefono per l'anteprima elegante a video
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  // Se contiene già il prefisso esplicito
  if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
    return trimmed;
  }
  // Se è locale svizzero es. 0791234567 -> +41 79 123 45 67
  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('41') && digits.length === 11) {
    return `+41 ${digits.substring(2, 4)} ${digits.substring(4, 7)} ${digits.substring(7, 9)} ${digits.substring(9, 11)}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+41 ${digits.substring(1, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 8)} ${digits.substring(8, 10)}`;
  }
  return trimmed;
}

/**
 * Genera l'URL per inviare un SMS nativo da smartphone o tablet.
 * Compatibile con standard moderni iOS e Android.
 */
export function buildSmsUrl(phone: string, message: string = '', defaultCountry: string = 'CH'): string {
  const normalized = normalizePhoneForWhatsApp(phone, defaultCountry);
  if (!normalized) return '#';
  const encodedText = message ? encodeURIComponent(message) : '';
  // Separatore universale per iOS/Android: ?body=
  return `sms:+${normalized}?body=${encodedText}`;
}

/**
 * Genera l'URL mailto: sicuro per l'invio via email
 */
export function buildMailtoUrl(email: string, subject: string = '', body: string = ''): string {
  if (!email) return '#';
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  const queryString = params.length > 0 ? `?${params.join('&')}` : '';
  return `mailto:${email.trim()}${queryString}`;
}
