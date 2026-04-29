// types.ts

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  GUEST = 'GUEST'
}

export interface User {
  id: string;
  username: string;
  name: string;
  password?: string;
  role: UserRole;
  permissions?: string[];
  assignedProjects?: string[];
}

export interface Project {
  id: string;
  name: string;
  serviceMarkup: number;
  description?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  facebookId?: string;
  projectId?: string;
}

export interface Partner {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export enum AccountId {
  BANK = 'BANK',
  PARTNER = 'PARTNER',
  MANAGER = 'MANAGER'
}

/** * 🔴 নতুন পরিবর্তন: ব্যাংক ইন্টারফেস যুক্ত করা হয়েছে 
 * এটি আপনাকে আপনার প্রয়োজন মতো ব্যাংক অ্যাকাউন্ট তৈরি করতে সাহায্য করবে।
 */
export interface Bank {
  id: string;
  name: string;
  accountNumber?: string;
}

export interface Transaction {
  id: string;
  projectId: string;
  date: string;
  description: string;
  amount: number;
  categoryId: string;
  accountId: AccountId;
  bankId?: string;       // 🔴 নতুন পরিবর্তন: নির্দিষ্ট ব্যাংক ট্র্যাক করার জন্য
  clientId?: string | null;
  partnerId?: string | null;
  type: 'deposit' | 'expense';
  auditUser: string;
  createdByUserId: string;
  attachment?: string | null;
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

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  LOST = 'LOST',
  CONVERTED = 'CONVERTED'
}

export enum LeadSource {
  FACEBOOK = 'FACEBOOK',
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  MANUAL = 'MANUAL'
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  address?: string;
  profession?: string;
  hobby?: string;
  facebookId?: string;
  category: string;
  status?: LeadStatus;
  source?: LeadSource;
  createdByUserId?: string;
}

// ==========================================
// NEW INVENTORY & SUPPLIER TYPES
// ==========================================
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  material?: string;
  whatsapp?: string;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
}

export interface InventoryLog {
  id: string;
  date: string;
  projectId: string;
  materialId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  supplierId?: string;
  totalCost?: number;
  note?: string;
  linkedTransactionId?: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  clients: Client[];
  partners: Partner[];
  banks: Bank[];                   // 🔴 নতুন পরিবর্তন: ব্যাংক লিস্ট রাখার জন্য
  suppliers: Supplier[];
  materials: Material[];
  inventoryLogs: InventoryLog[];
  leads: Lead[];
  categories: Category[];
  transactions: Transaction[];
  accounts: Record<AccountId, number>;
  transfers: InternalTransfer[];
  selectedProjectId: string | 'all';
  globalMarkupOverride: number | null;
  viewAllMode: boolean;
}