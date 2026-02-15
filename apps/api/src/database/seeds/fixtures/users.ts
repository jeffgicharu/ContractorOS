import { SEED_ORG_ID } from './organizations';

export const SEED_ADMIN_ID = '22222222-2222-2222-2222-222222222222';
export const SEED_MANAGER_ID = '22222222-2222-2222-2222-222222222223';

export const users = [
  {
    id: SEED_ADMIN_ID,
    organizationId: SEED_ORG_ID,
    email: 'admin@acme-corp.com',
    password: 'Password1',
    role: 'admin' as const,
    firstName: 'Sarah',
    lastName: 'Chen',
  },
  {
    id: SEED_MANAGER_ID,
    organizationId: SEED_ORG_ID,
    email: 'manager@acme-corp.com',
    password: 'Password1',
    role: 'manager' as const,
    firstName: 'Michael',
    lastName: 'Torres',
  },
];
