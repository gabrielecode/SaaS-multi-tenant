export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  COMPLETED = 'COMPLETED',
}

export interface TenantSalon {
  id: string;
  name: string;
  category: string;
  ownerName: string;
  email: string;
  phone: string;
  subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  monthlyFee: number;
  createdAt: string;
  supabaseConfigured: boolean;
  metaWhatsAppConfigured: boolean;
}

export interface Client {
  id: string;
  tenant_id?: string;
  name: string;
  phone: string;
  email: string;
  noShowCount: number;
  completedCount: number;
  reliabilityScore: number; // Percentage (e.g. 85%)
  notes: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  habits?: string[];
  preferenceHistory?: string[];
  loyaltyPoints?: number;
  isVip?: boolean;
}

export interface Service {
  id: string;
  tenant_id?: string;
  name: string;
  duration: number; // in minutes
  price: number;
  depositRequired: boolean;
  depositType: 'FIXED' | 'PERCENTAGE';
  depositValue: number;
  isActive: boolean;
  description?: string;
  category?: string;
}

export interface Appointment {
  id: string;
  tenant_id?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  price: number;
  depositPaid: number;
  paymentMethod?: 'IN_SALON' | 'STRIPE_DEPOSIT' | 'CARD';
  status: AppointmentStatus;
  notes?: string;
  reminderSent: boolean;
  isConfirmedByClient: boolean;
  stripePaymentId?: string;
  rescheduledFrom?: string;
}

export interface WaitlistEntry {
  id: string;
  tenant_id?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  date: string; // Preferred date
  timePreference: 'MORNING' | 'AFTERNOON' | 'ANYTIME';
  createdAt: string;
}

export interface BusinessConfig {
  tenant_id?: string;
  name: string;
  category: string;
  phone: string;
  reminderTimingHours: number; // e.g. 24
  reminderChannel: 'SMS' | 'WHATSAPP' | 'EMAIL';
  reminderTemplate: string;
  stripeConnected: boolean;
  autoWaitlistNotify: boolean;
  cancellationPolicyHours: number; // e.g. 24
  depositPolicy?: 'OPTIONAL' | 'DISABLED' | 'MANDATORY';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  metaWhatsappToken?: string;
  metaPhoneNumberId?: string;
  metaWabaId?: string;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
}

export interface Promotion {
  id: string;
  tenant_id?: string;
  title: string;
  description: string;
  discountPercentage?: number;
  discountFixed?: number;
  code: string;
  validUntil: string;
  badge?: string;
  highlight?: boolean;
}

export interface WhatsAppCampaign {
  id: string;
  tenant_id?: string;
  title: string;
  templateName: string;
  targetAudience: 'ALL' | 'VIP' | 'AT_RISK' | 'INACTIVE';
  messageBody: string;
  sentCount: number;
  deliveredCount: number;
  status: 'DRAFT' | 'SENDING' | 'COMPLETED';
  createdAt: string;
}

export interface ClientAuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  pushSubscribed: boolean;
  token?: string;
  password?: string;
  createdAt?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  service: 'SUPABASE' | 'META_WHATSAPP' | 'STRIPE' | 'CRON_REMINDERS';
  message: string;
  tenant_id?: string;
}
