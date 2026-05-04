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
  
  // ==========================================
  // 🔴 NEW: Real Estate & Land Properties
  // ==========================================
  totalShares?: number;          // প্রজেক্টের মোট শেয়ার সংখ্যা
  targetSharePrice?: number;     // প্রতি শেয়ারের প্রাথমিক টার্গেট মূল্য
  totalLandCost?: number;        // জমির মোট ক্রয়মূল্য (খরচ)
  landArea?: string;             // জমির পরিমাণ (যেমন: '10 Katha')
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
  bankId?: string;       
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
  fromBankId?: string; 
  toBankId?: string;   
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

// ==========================================
// 🔴 NEW: Real Estate ERP Interfaces
// ==========================================

export enum UnitStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  SOLD = 'SOLD'
}

// ফ্ল্যাট, দোকান বা প্লটের ইনভেন্টরি
export interface InventoryUnit {
  id: string;
  projectId: string;
  unitName: string;      // e.g., Flat A1, Shop 1
  sizeSqFt: number;      // স্কয়ার ফিট
  ratePerSqFt: number;   // প্রতি স্কয়ার ফিটের দাম
  parkingCharge?: number;
  utilityCharge?: number;
  status: UnitStatus;
}

// শেয়ার বা ফ্ল্যাট বিক্রির চুক্তি (Sales & Booking)
export type SaleType = 'SHARE' | 'UNIT';

export interface SalesAgreement {
  id: string;
  projectId: string;
  clientId: string;
  saleType: SaleType;
  date: string;
  
  unitId?: string;           // যদি ফ্ল্যাট বিক্রি হয়
  numberOfShares?: number;   // যদি শেয়ার বিক্রি হয়
  
  agreedPrice: number;       // Actual Sold Price (যে দামে বিক্রি হলো)
  downPayment?: number;      // বুকিং মানি বা ডাউনপেমেন্ট
  installmentCount?: number; // কিস্তির সংখ্যা
  note?: string;
}

// পার্টনারদের জমি কেনার ইনভেস্টমেন্ট ট্র্যাক করার জন্য
export interface PartnerInvestment {
  id: string;
  projectId: string;
  partnerId: string;
  date: string;
  investedAmount: number;
  note?: string;
}

// ==========================================
// App State Configuration
// ==========================================
export interface AppState {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  clients: Client[];
  partners: Partner[];
  banks: Bank[];                   
  suppliers: Supplier[];
  materials: Material[];
  inventoryLogs: InventoryLog[];
  leads: Lead[];
  categories: Category[];
  transactions: Transaction[];
  
  // 🔴 NEW STATE VARIABLES
  inventoryUnits: InventoryUnit[];
  salesAgreements: SalesAgreement[];
  partnerInvestments: PartnerInvestment[];

  accounts: Record<AccountId, number>;
  transfers: InternalTransfer[];
  selectedProjectId: string | 'all';
  globalMarkupOverride: number | null;
  viewAllMode: boolean;
}