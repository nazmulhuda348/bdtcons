
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  GUEST = 'GUEST'
}

export enum LeadStatus {
  INTERESTED = 'INTERESTED',
  CONTACTED = 'CONTACTED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST'
}

export enum LeadSource {
  FACEBOOK = 'FACEBOOK',
  REFERRAL = 'REFERRAL',
  WEB = 'WEB',
  OTHER = 'OTHER'
}

export enum AccountId {
  BANK = 'BANK',
  HAND_CASH = 'HAND_CASH',
  PARTNER = 'PARTNER',
  MANAGER = 'MANAGER'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  assignedProjects: string[];
}

export interface Project {
  id: string;
  name: string;
  serviceMarkup: number;
  description: string;
  createdByUserId?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  facebookId?: string;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  material: string;
  whatsapp?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  notes: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export interface Transaction {
  id: string;
  projectId: string;
  date: string;
  description: string;
  amount: number;
  categoryId: string;
  accountId: AccountId; 
  clientId?: string;
  partnerId?: string; 
  attachment?: string;
  type: 'deposit' | 'expense';
  auditUser: string;
  createdByUserId: string;
}

export interface InternalTransfer {
  id: string;
  date: string;
  fromAccount: AccountId;
  toAccount: AccountId;
  amount: number;
  note: string;
  partnerId?: string; 
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  clients: Client[];
  partners: Partner[];
  suppliers: Supplier[];
  leads: Lead[];
  categories: Category[];
  transactions: Transaction[];
  accounts: Record<AccountId, number>;
  transfers: InternalTransfer[];
  selectedProjectId: string | 'all';
  globalMarkupOverride: number | null;
  viewAllMode: boolean;
}
