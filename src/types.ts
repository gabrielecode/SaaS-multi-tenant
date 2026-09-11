export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  COMPLETED = 'COMPLETED',
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  noShowCount: number;
  completedCount: number;
  reliabilityScore: number; // Percentage (e.g. 85%)
  notes: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  depositRequired: boolean;
  depositType: 'FIXED' | 'PERCENTAGE';
  depositValue: number;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string; // denormalized for ease of use
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  price: number;
  depositPaid: number;
  status: AppointmentStatus;
  notes?: string;
  reminderSent: boolean;
  isConfirmedByClient: boolean;
  stripePaymentId?: string;
}

export interface WaitlistEntry {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  date: string; // Preferred date
  timePreference: 'MORNING' | 'AFTERNOON' | 'ANYTIME';
  createdAt: string;
}

export interface BusinessConfig {
  name: string;
  category: string;
  phone: string;
  reminderTimingHours: number; // e.g. 24
  reminderChannel: 'SMS' | 'WHATSAPP' | 'EMAIL';
  reminderTemplate: string;
  stripeConnected: boolean;
  autoWaitlistNotify: boolean;
  cancellationPolicyHours: number; // e.g. 24
}
