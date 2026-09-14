import { AppointmentStatus, Client, Service, Appointment, WaitlistEntry, BusinessConfig, TenantSalon, WhatsAppCampaign, SystemLog } from '../types';

export const INITIAL_TENANTS: TenantSalon[] = [
  {
    id: 'salon_default_1',
    name: "Gentleman's Grooming Club Lugano",
    category: "Barbiere & Parrucchiere",
    ownerName: "Gabriele Rossi",
    email: "info@gentlemansclub.ch",
    phone: "+41 79 345 67 89",
    subscriptionStatus: 'ACTIVE',
    plan: 'PRO',
    monthlyFee: 49,
    createdAt: '2025-11-01',
    supabaseConfigured: true,
    metaWhatsAppConfigured: true
  },
  {
    id: 'salon_tenant_2',
    name: "Studio Estetica Venere Bellinzona",
    category: "Centro Estetico & Benessere",
    ownerName: "Elena Conti",
    email: "elena@esteticavenere.ch",
    phone: "+41 78 123 45 67",
    subscriptionStatus: 'ACTIVE',
    plan: 'ENTERPRISE',
    monthlyFee: 99,
    createdAt: '2025-12-15',
    supabaseConfigured: true,
    metaWhatsAppConfigured: false
  },
  {
    id: 'salon_tenant_3',
    name: "Hair Design Chiasso",
    category: "Salone Acconciature Donna",
    ownerName: "Marco Rinaldi",
    email: "marco@hairdesignchiasso.ch",
    phone: "+41 76 987 65 43",
    subscriptionStatus: 'TRIAL',
    plan: 'BASIC',
    monthlyFee: 29,
    createdAt: '2026-06-01',
    supabaseConfigured: false,
    metaWhatsAppConfigured: false
  }
];

export const INITIAL_BUSINESS_CONFIG: BusinessConfig = {
  tenant_id: 'salon_default_1',
  name: "Gentleman's Grooming Club Lugano",
  category: "Barbiere & Parrucchiere",
  ownerName: "Gabriele Rossi",
  email: "info@gentlemansclub.ch",
  phone: "+41 79 345 67 89",
  phonePrefix: "+41",
  address: "Via Nassa 22",
  city: "Lugano",
  country: "CH",
  currency: "CHF",
  reminderTimingHours: 24,
  reminderChannel: 'WHATSAPP',
  reminderTemplate: "Ciao {NOME}, ti ricordiamo il tuo appuntamento per {SERVIZIO} il {DATA} alle {ORA}. Conferma con un tap qui: {LINK_CONFERMA} o disdici entro 24h.",
  stripeConnected: true,
  autoWaitlistNotify: true,
  cancellationPolicyHours: 24,
  depositPolicy: 'OPTIONAL',
  googleReviewLink: 'https://g.page/r/CbG9Z123gentlemansclub/review',
  googleReviewAutomationEnabled: true,
  googleReviewDelayHours: 2,
  googleReviewTemplate: "Ciao {NOME}! Speriamo che ti sia piaciuto il servizio oggi da {SALONE}. Ti andrebbe di lasciarci una recensione su Google per aiutarci a crescere? Bastano 2 secondi qui: {LINK_RECENSIONE}. Grazie mille!",
  autoCompletePastAppointments: true,
  supabaseUrl: 'https://xyz-noshowreducer.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  metaWhatsappToken: 'EAAG...mock_meta_token',
  metaPhoneNumberId: '105482390124892'
};

export const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
    tenant_id: 'salon_default_1',
    name: 'Taglio Capelli Premium & Styling',
    duration: 45,
    price: 35,
    depositRequired: true,
    depositType: 'FIXED',
    depositValue: 10,
    isActive: true
  },
  {
    id: 's2',
    tenant_id: 'salon_default_1',
    name: 'Rasatura Barba all\'Italiana (Panni caldi)',
    duration: 30,
    price: 25,
    depositRequired: false,
    depositType: 'FIXED',
    depositValue: 0,
    isActive: true
  },
  {
    id: 's3',
    tenant_id: 'salon_default_1',
    name: 'Combo Capelli & Barba + Trattamento Viso',
    duration: 75,
    price: 60,
    depositRequired: true,
    depositType: 'PERCENTAGE',
    depositValue: 50,
    isActive: true
  },
  {
    id: 's4',
    tenant_id: 'salon_default_1',
    name: 'Colorazione & Trattamento Antiforfora',
    duration: 60,
    price: 45,
    depositRequired: true,
    depositType: 'FIXED',
    depositValue: 15,
    isActive: true
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    tenant_id: 'salon_default_1',
    name: 'Alessandro Rossi',
    phone: '+39 333 111 2222',
    email: 'alessandro.rossi@email.it',
    noShowCount: 0,
    completedCount: 12,
    reliabilityScore: 100,
    notes: 'Cliente abituale super puntuale. Preferisce caffè macchiato.',
    riskLevel: 'LOW',
    habits: ['Arriva 5 min prima', 'Usa prodotti biologici', 'Taglio corto sfumato'],
    preferenceHistory: ['Taglio Capelli Premium', 'Combo Barba & Capelli'],
    loyaltyPoints: 120,
    isVip: true
  },
  {
    id: 'c2',
    tenant_id: 'salon_default_1',
    name: 'Marco Bianchi',
    phone: '+39 333 444 5555',
    email: 'marco.bianchi@email.it',
    noShowCount: 2,
    completedCount: 2,
    reliabilityScore: 50,
    notes: 'Ha fatto no-show due volte di sabato. Richiede sempre caparra obbligatoria.',
    riskLevel: 'HIGH',
    habits: ['Disdette frequenti il sabato', 'Ritardo medio 10 min'],
    preferenceHistory: ['Taglio Capelli Base'],
    loyaltyPoints: 20,
    isVip: false
  },
  {
    id: 'c3',
    tenant_id: 'salon_default_1',
    name: 'Giulia Verdi',
    phone: '+39 347 888 9999',
    email: 'giulia.verdi@email.it',
    noShowCount: 0,
    completedCount: 6,
    reliabilityScore: 100,
    notes: 'Ottima cliente, puntuale.',
    riskLevel: 'LOW',
    habits: ['Prenota sempre via web app', 'Puntualità svizzera'],
    preferenceHistory: ['Combo Capelli & Barba'],
    loyaltyPoints: 70,
    isVip: true
  },
  {
    id: 'c4',
    tenant_id: 'salon_default_1',
    name: 'Luca Gialli',
    phone: '+39 328 123 4567',
    email: 'luca.gialli@email.it',
    noShowCount: 1,
    completedCount: 4,
    reliabilityScore: 80,
    notes: 'Tende ad arrivare con 5-10 minuti di ritardo.',
    riskLevel: 'MEDIUM',
    habits: ['Preferisce orari serali'],
    preferenceHistory: ['Taglio Capelli Premium'],
    loyaltyPoints: 45,
    isVip: false
  },
  {
    id: 'c5',
    tenant_id: 'salon_default_1',
    name: 'Davide Neri',
    phone: '+39 339 987 6543',
    email: 'davide.neri@email.it',
    noShowCount: 0,
    completedCount: 1,
    reliabilityScore: 100,
    notes: 'Nuovo cliente, consigliato da Alessandro.',
    riskLevel: 'LOW',
    habits: ['Primo trattamento completato'],
    preferenceHistory: ['Rasatura Barba'],
    loyaltyPoints: 10,
    isVip: false
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'a_past_1',
    tenant_id: 'salon_default_1',
    clientId: 'c1',
    clientName: 'Alessandro Rossi',
    clientPhone: '+39 333 111 2222',
    serviceId: 's1',
    serviceName: 'Taglio Capelli Premium & Styling',
    date: '2026-06-22',
    time: '10:00',
    price: 35,
    depositPaid: 10,
    status: AppointmentStatus.COMPLETED,
    completedAt: '2026-06-22T10:45:00.000Z',
    reviewRequestSent: true,
    recensione_richiesta: true,
    reviewRequestedAt: '2026-06-22T12:45:00.000Z',
    reminderSent: true,
    isConfirmedByClient: true
  },
  {
    id: 'a_past_2',
    tenant_id: 'salon_default_1',
    clientId: 'c2',
    clientName: 'Marco Bianchi',
    clientPhone: '+39 333 444 5555',
    serviceId: 's3',
    serviceName: 'Combo Capelli & Barba + Trattamento Viso',
    date: '2026-06-22',
    time: '11:30',
    price: 60,
    depositPaid: 30,
    status: AppointmentStatus.NO_SHOW,
    notes: 'Non si è presentato e non ha risposto al telefono. Trattenuto acconto di 30€.',
    reminderSent: true,
    isConfirmedByClient: false
  },
  {
    id: 'a_today_1',
    tenant_id: 'salon_default_1',
    clientId: 'c1',
    clientName: 'Alessandro Rossi',
    clientPhone: '+39 333 111 2222',
    serviceId: 's1',
    serviceName: 'Taglio Capelli Premium & Styling',
    date: '2026-06-24',
    time: '09:00',
    price: 35,
    depositPaid: 10,
    status: AppointmentStatus.CONFIRMED,
    reminderSent: true,
    isConfirmedByClient: true
  },
  {
    id: 'a_today_2',
    tenant_id: 'salon_default_1',
    clientId: 'c5',
    clientName: 'Davide Neri',
    clientPhone: '+39 339 987 6543',
    serviceId: 's2',
    serviceName: 'Rasatura Barba all\'Italiana (Panni caldi)',
    date: '2026-06-24',
    time: '10:30',
    price: 25,
    depositPaid: 0,
    status: AppointmentStatus.PENDING,
    reminderSent: true,
    isConfirmedByClient: false
  },
  {
    id: 'a_today_3',
    tenant_id: 'salon_default_1',
    clientId: 'c3',
    clientName: 'Giulia Verdi',
    clientPhone: '+39 347 888 9999',
    serviceId: 's3',
    serviceName: 'Combo Capelli & Barba + Trattamento Viso',
    date: '2026-06-24',
    time: '14:00',
    price: 60,
    depositPaid: 30,
    status: AppointmentStatus.CONFIRMED,
    reminderSent: true,
    isConfirmedByClient: true
  }
];

export const INITIAL_WAITLIST: WaitlistEntry[] = [
  {
    id: 'w1',
    tenant_id: 'salon_default_1',
    clientId: 'c2',
    clientName: 'Marco Bianchi',
    clientPhone: '+39 333 444 5555',
    serviceId: 's1',
    date: '2026-06-24',
    timePreference: 'MORNING',
    createdAt: '2026-06-23T18:30:00Z'
  }
];

export const INITIAL_CAMPAIGNS: WhatsAppCampaign[] = [
  {
    id: 'camp_1',
    tenant_id: 'salon_default_1',
    title: 'Promo Torna a Trovarci (VIP)',
    templateName: 'vip_discount_promo',
    targetAudience: 'VIP',
    messageBody: 'Ciao {NOME}, ti regaliamo uno sconto del 20% sul tuo prossimo trattamento al Gentleman\'s Club! Prenota ora.',
    sentCount: 42,
    deliveredCount: 41,
    status: 'COMPLETED',
    createdAt: '2026-06-10T10:00:00Z'
  },
  {
    id: 'camp_2',
    tenant_id: 'salon_default_1',
    title: 'Recupero Clienti Inattivi',
    templateName: 'reactivation_offer',
    targetAudience: 'INACTIVE',
    messageBody: 'Ehi {NOME}, è passato un po\' di tempo dall\'ultima visita! Passa a trovarci questa settimana con un omaggio speciale.',
    sentCount: 18,
    deliveredCount: 18,
    status: 'COMPLETED',
    createdAt: '2026-06-18T14:20:00Z'
  }
];

export const INITIAL_SYSTEM_LOGS: SystemLog[] = [
  {
    id: 'log_1',
    timestamp: '2026-06-24T08:30:12Z',
    level: 'INFO',
    service: 'META_WHATSAPP',
    message: 'Meta Cloud API webhook verified successfully for tenant salon_default_1',
    tenant_id: 'salon_default_1'
  },
  {
    id: 'log_2',
    timestamp: '2026-06-24T07:15:00Z',
    level: 'INFO',
    service: 'SUPABASE',
    message: 'Postgres row-level security (RLS) policies successfully enforced for appointments table',
    tenant_id: 'salon_default_1'
  },
  {
    id: 'log_3',
    timestamp: '2026-06-23T22:00:05Z',
    level: 'INFO',
    service: 'CRON_REMINDERS',
    message: 'Sent automated 24h WhatsApp reminder to Alessandro Rossi (+39 333 111 2222)',
    tenant_id: 'salon_default_1'
  }
];
