
import { UserRole, Project, User, Client, Category, Transaction, Lead, LeadStatus, LeadSource, AccountId } from './types';

export const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'Downtown Skyrise', serviceMarkup: 15, description: 'Commercial renovation project' },
  { id: 'p2', name: 'Coastal Bridge', serviceMarkup: 10, description: 'Infrastructure maintenance' },
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', username: 'admin', password: 'admin', name: 'Lead Admin', role: UserRole.ADMIN, assignedProjects: [] },
  { id: 'u2', username: 'manager', password: 'manager', name: 'John Manager', role: UserRole.MANAGER, assignedProjects: [] },
  { id: 'u3', username: 'guest', password: 'guest', name: 'Jane Visitor', role: UserRole.GUEST, assignedProjects: ['p1'] },
];

export const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', name: 'Skyline Corp', email: 'billing@skyline.com', phone: '555-0101', facebookId: 'skyline.corp.official' },
  { id: 'c2', name: 'Gov Services', email: 'ops@gov.com', phone: '555-0102', facebookId: '' },
];

export const INITIAL_LEADS: Lead[] = [
  { id: 'L1', name: 'Global Tech Ltd', phone: '555-8888', status: LeadStatus.INTERESTED, source: LeadSource.WEB, notes: 'Interested in Skyrise Phase 2' },
  { id: 'L2', name: 'Marcus Anderson', phone: '555-9922', status: LeadStatus.CONTACTED, source: LeadSource.REFERRAL, notes: 'Follow up regarding local permits' },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Deposit', type: 'income' },
  { id: 'cat2', name: 'Raw Materials', type: 'expense' },
  { id: 'cat3', name: 'Labor', type: 'expense' },
  { id: 'cat4', name: 'Logistics', type: 'expense' },
  { id: 'cat5', name: 'Legal', type: 'expense' },
];

export const INITIAL_ACCOUNTS: Record<AccountId, number> = {
  [AccountId.BANK]: 0,
  [AccountId.HAND_CASH]: 0,
  [AccountId.PARTNER]: 0,
  [AccountId.MANAGER]: 0,
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Added createdByUserId to ensure compliance with Transaction type
  { id: 't1', projectId: 'p1', date: '2024-01-15', description: 'Initial Project Deposit', amount: 50000, categoryId: 'cat1', accountId: AccountId.BANK, type: 'deposit', auditUser: 'Lead Admin', createdByUserId: 'u1' },
  { id: 't2', projectId: 'p1', date: '2024-01-20', description: 'Concrete purchase', amount: 12000, categoryId: 'cat2', accountId: AccountId.BANK, type: 'expense', auditUser: 'John Manager', createdByUserId: 'u2' },
  { id: 't3', projectId: 'p2', date: '2024-02-05', description: 'Government Grant', amount: 100000, categoryId: 'cat1', accountId: AccountId.BANK, type: 'deposit', auditUser: 'Lead Admin', createdByUserId: 'u1' },
];
