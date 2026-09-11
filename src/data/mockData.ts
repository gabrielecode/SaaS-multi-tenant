import { AppointmentStatus, Client, Service, Appointment, WaitlistEntry, BusinessConfig } from '../types';

export const INITIAL_BUSINESS_CONFIG: BusinessConfig = {
  name: "Gentleman's Grooming Club",
  category: "Barbiere & Parrucchiere",
  phone: "+39 345 678 9012",
  reminderTimingHours: 24,
  reminderChannel: 'SMS',
  reminderTemplate: "Ciao {NOME}, ti ricordiamo il tuo appuntamento per {SERVIZIO} il {DATA} alle {ORA}. Conferma con un tap qui: {LINK_CONFERMA} o disdici entro 24h.",
  stripeConnected: true,
  autoWaitlistNotify: true,
  cancellationPolicyHours: 24
};

export const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
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
    name: 'Combo Capelli & Barba + Trattamento Viso',
    duration: 75,
    price: 60,
    depositRequired: true,
    depositType: 'PERCENTAGE',
    depositValue: 50, // 50% deposit (30€)
    isActive: true
  },
  {
    id: 's4',
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
    name: 'Alessandro Rossi',
    phone: '+39 333 111 2222',
    email: 'alessandro.rossi@email.it',
    noShowCount: 0,
    completedCount: 12,
    reliabilityScore: 100,
    notes: 'Cliente abituale super puntuale. Preferisce caffè macchiato.',
    riskLevel: 'LOW'
  },
  {
    id: 'c2',
    name: 'Marco Bianchi',
    phone: '+39 333 444 5555',
    email: 'marco.bianchi@email.it',
    noShowCount: 2,
    completedCount: 2,
    reliabilityScore: 50,
    notes: 'Ha fatto no-show due volte di sabato. Richiede sempre caparra obbligatoria.',
    riskLevel: 'HIGH'
  },
  {
    id: 'c3',
    name: 'Giulia Verdi',
    phone: '+39 347 888 9999',
    email: 'giulia.verdi@email.it',
    noShowCount: 0,
    completedCount: 6,
    reliabilityScore: 100,
    notes: 'Ottima cliente, puntuale.',
    riskLevel: 'LOW'
  },
  {
    id: 'c4',
    name: 'Luca Gialli',
    phone: '+39 328 123 4567',
    email: 'luca.gialli@email.it',
    noShowCount: 1,
    completedCount: 4,
    reliabilityScore: 80,
    notes: 'Tende ad arrivare con 5-10 minuti di ritardo.',
    riskLevel: 'MEDIUM'
  },
  {
    id: 'c5',
    name: 'Davide Neri',
    phone: '+39 339 987 6543',
    email: 'davide.neri@email.it',
    noShowCount: 0,
    completedCount: 1,
    reliabilityScore: 100,
    notes: 'Nuovo cliente, consigliato da Alessandro.',
    riskLevel: 'LOW'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  // --- PAST / HISTORY APPOINTMENTS (to generate analytics) ---
  {
    id: 'a_past_1',
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
    reminderSent: true,
    isConfirmedByClient: true
  },
  {
    id: 'a_past_2',
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
    id: 'a_past_3',
    clientId: 'c3',
    clientName: 'Giulia Verdi',
    clientPhone: '+39 347 888 9999',
    serviceId: 's2',
    serviceName: 'Rasatura Barba all\'Italiana (Panni caldi)',
    date: '2026-06-23',
    time: '09:00',
    price: 25,
    depositPaid: 0,
    status: AppointmentStatus.COMPLETED,
    reminderSent: true,
    isConfirmedByClient: true
  },
  {
    id: 'a_past_4',
    clientId: 'c4',
    clientName: 'Luca Gialli',
    clientPhone: '+39 328 123 4567',
    serviceId: 's1',
    serviceName: 'Taglio Capelli Premium & Styling',
    date: '2026-06-23',
    time: '15:00',
    price: 35,
    depositPaid: 10,
    status: AppointmentStatus.COMPLETED,
    reminderSent: true,
    isConfirmedByClient: true
  },
  {
    id: 'a_past_5',
    clientId: 'c2',
    clientName: 'Marco Bianchi',
    clientPhone: '+39 333 444 5555',
    serviceId: 's1',
    serviceName: 'Taglio Capelli Premium & Styling',
    date: '2026-06-15',
    time: '16:00',
    price: 35,
    depositPaid: 10,
    status: AppointmentStatus.NO_SHOW,
    notes: 'Annullato last-minute. Trattenuto acconto di 10€.',
    reminderSent: true,
    isConfirmedByClient: false
  },

  // --- TODAY'S APPOINTMENTS (June 24, 2026) ---
  {
    id: 'a_today_1',
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
  },
  {
    id: 'a_today_4',
    clientId: 'c4',
    clientName: 'Luca Gialli',
    clientPhone: '+39 328 123 4567',
    serviceId: 's4',
    serviceName: 'Colorazione & Trattamento Antiforfora',
    date: '2026-06-24',
    time: '16:00',
    price: 45,
    depositPaid: 15,
    status: AppointmentStatus.PENDING,
    reminderSent: true,
    isConfirmedByClient: false
  },

  // --- FUTURE APPOINTMENTS ---
  {
    id: 'a_fut_1',
    clientId: 'c1',
    clientName: 'Alessandro Rossi',
    clientPhone: '+39 333 111 2222',
    serviceId: 's3',
    serviceName: 'Combo Capelli & Barba + Trattamento Viso',
    date: '2026-06-25',
    time: '10:00',
    price: 60,
    depositPaid: 30,
    status: AppointmentStatus.PENDING,
    reminderSent: false,
    isConfirmedByClient: false
  },
  {
    id: 'a_fut_2',
    clientId: 'c3',
    clientName: 'Giulia Verdi',
    clientPhone: '+39 347 888 9999',
    serviceId: 's1',
    serviceName: 'Taglio Capelli Premium & Styling',
    date: '2026-06-26',
    time: '11:00',
    price: 35,
    depositPaid: 10,
    status: AppointmentStatus.PENDING,
    reminderSent: false,
    isConfirmedByClient: false
  }
];

export const INITIAL_WAITLIST: WaitlistEntry[] = [
  {
    id: 'w1',
    clientId: 'c2',
    clientName: 'Marco Bianchi',
    clientPhone: '+39 333 444 5555',
    serviceId: 's1',
    date: '2026-06-24',
    timePreference: 'MORNING',
    createdAt: '2026-06-23T18:30:00Z'
  },
  {
    id: 'w2',
    clientId: 'c4',
    clientName: 'Luca Gialli',
    clientPhone: '+39 328 123 4567',
    serviceId: 's3',
    date: '2026-06-24',
    timePreference: 'AFTERNOON',
    createdAt: '2026-06-24T08:00:00Z'
  }
];
