import type { UserRole } from '../constants/state-machines';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  default_payment_terms: string;
  default_currency: string;
  reminder_interval_days: number;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}
