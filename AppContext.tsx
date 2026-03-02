import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, User, Transaction, Project, Client, Partner, Supplier, Category, Lead, AccountId, InternalTransfer, UserRole, LeadStatus } from './types';
import { INITIAL_USERS, INITIAL_PROJECTS, INITIAL_CLIENTS, INITIAL_CATEGORIES, INITIAL_TRANSACTIONS, INITIAL_LEADS, INITIAL_ACCOUNTS } from './constants';

const getEnvVar = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env[key]) return import.meta.env[key];
  } catch (e) {}
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface AppContextType extends AppState {
  setCurrentUser: (user: User | null) => void;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  addTransaction: (tx: Transaction) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setSelectedProjectId: (id: string) => void;
  updateUsers: (users: User[] | ((prev: User[]) => User[])) => void;
  deleteUser: (id: string) => Promise<void>;
  updateProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  deleteProject: (id: string) => Promise<void>;
  updateClients: (clients: Client[] | ((prev: Client[]) => Client[])) => void;
  deleteClient: (id: string) => Promise<void>;
  updatePartners: (partners: Partner[] | ((prev: Partner[]) => Partner[])) => void;
  deletePartner: (id: string) => Promise<void>;
  updateSuppliers: (suppliers: Supplier[] | ((prev: Supplier[]) => Supplier[])) => void;
  deleteSupplier: (id: string) => Promise<void>;
  updateLeads: (leads: Lead[] | ((prev: Lead[]) => Lead[])) => void;
  deleteLead: (id: string) => Promise<void>;
  updateCategories: (categories: Category[] | ((prev: Category[]) => Category[])) => void;
  addLead: (lead: Lead) => Promise<void>;
  updateLeadItem: (lead: Lead) => Promise<void>;
  leadCategories: string[];
  updateLeadCategories: (cats: string[] | ((prev: string[]) => string[])) => void;
  availableLeadCategories: string[];
  allProspects: Lead[];
  setGlobalMarkupOverride: (val: number | null) => void;
  importData: (json: string) => void;
  transferCash: (transfer: InternalTransfer) => Promise<void>;
  partnerBalances: Record<string, number>;
  setViewAllMode: (val: boolean) => void;
  syncToCloud: () => Promise<boolean>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const safeGetStorage = (key: string) => { try { return localStorage.getItem(key); } catch (e) { return null; } };
const safeSetStorage = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch (e) {} };

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(() => { const saved = safeGetStorage('bdt_current_session'); return saved ? JSON.parse(saved) : null; });
  const [viewAllMode, setViewAllMode] = useState<boolean>(() => { const saved = safeGetStorage('bdt_view_all_mode'); return saved ? JSON.parse(saved) : true; });

  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<InternalTransfer[]>([]);

  const [leadCategories, setLeadCategories] = useState<string[]>(() => {
    const saved = safeGetStorage('bdt_lead_cats'); return saved ? JSON.parse(saved) : ['General', 'Land', 'Software'];
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');
  const [globalMarkupOverride, setGlobalMarkupOverride] = useState<number | null>(null);

  const availableLeadCategories = useMemo(() => {
    const projectNames = projects.map(p => p.name);
    return Array.from(new Set([...leadCategories, ...projectNames]));
  }, [leadCategories, projects]);

  const allProspects = useMemo(() => {
    const clientLeads: Lead[] = clients.map(c => {
      const project = projects.find(p => p.id === c.projectId);
      const resolvedCategory = project?.name || (c as any).projectName || 'Registered Client';
      return { id: `sync_${c.id}`, name: c.name, phone: c.phone, category: resolvedCategory, address: '', status: LeadStatus.CONVERTED, profession: 'Registry Client' } as Lead;
    });
    return [...leads, ...clientLeads];
  }, [leads, clients, projects]);

  const fetchCloudData = useCallback(async () => {
    if (!supabase) {
      setUsers(INITIAL_USERS); setProjects(INITIAL_PROJECTS); setClients(INITIAL_CLIENTS);
      setCategories(INITIAL_CATEGORIES); setTransactions(INITIAL_TRANSACTIONS); setLeads(INITIAL_LEADS);
      setIsLoading(false); return;
    }
    setIsLoading(true);
    try {
      const fetchOrSeed = async (table: string, fallback: any[]) => {
        const { data, error } = await supabase!.from(table).select('*');
        if (error) throw error;
        if (!data || data.length === 0) return fallback;
        return data;
      };
      const [u, p, c, cat, pt, s, l, t, tr] = await Promise.all([
        fetchOrSeed('users', INITIAL_USERS), fetchOrSeed('projects', INITIAL_PROJECTS), fetchOrSeed('clients', INITIAL_CLIENTS),
        fetchOrSeed('categories', INITIAL_CATEGORIES), fetchOrSeed('partners', []), fetchOrSeed('suppliers', []),
        fetchOrSeed('leads', INITIAL_LEADS), fetchOrSeed('transactions', INITIAL_TRANSACTIONS), fetchOrSeed('transfers', [])
      ]);
      setUsers(u); setProjects(p); setClients(c); setCategories(cat); setPartners(pt);
      setSuppliers(s); setLeads(l); setTransactions(t); setTransfers(tr);
    } catch (err) { console.error("Cloud Error:", err); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchCloudData(); }, [fetchCloudData]);

  useEffect(() => {
    safeSetStorage('bdt_current_session', JSON.stringify(currentUser));
    safeSetStorage('bdt_view_all_mode', JSON.stringify(viewAllMode));
    safeSetStorage('bdt_lead_cats', JSON.stringify(leadCategories));
  }, [currentUser, viewAllMode, leadCategories]);

  // 🔴 syncToCloud ডিফাইন করা হলো (TypeScript Error Fix) 🔴
  const syncToCloud = async (): Promise<boolean> => {
    if (!supabase) return false;
    await fetchCloudData();
    return true;
  };

  const addTransaction = useCallback(async (tx: Transaction) => {
    if (!currentUser) return;
    const securedTx = { ...tx, createdByUserId: currentUser.id, auditUser: currentUser.name || 'System' };
    if (supabase) await supabase.from('transactions').insert([securedTx]);
    setTransactions(prev => [securedTx, ...prev]);
  }, [currentUser]);

  const updateTransaction = useCallback(async (updatedTx: Transaction) => {
    if (supabase) await supabase.from('transactions').update(updatedTx).eq('id', updatedTx.id);
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    if (supabase) await supabase.from('transactions').delete().eq('id', id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  // 🔴 সংশোধিত লিডস সেভ ফাংশন: অপ্রয়োজনীয় ফিল্ড বাদ দেওয়া হয়েছে 🔴
  const addLead = useCallback(async (lead: Lead) => {
    const { createdByUserId, source, ...cleanLead } = lead as any;
    if (supabase) {
      const { error } = await supabase.from('leads').insert([cleanLead]);
      if (error) console.error("Database Error:", error.message);
    }
    setLeads(prev => [cleanLead as Lead, ...prev]);
  }, []);

  const updateLeadItem = useCallback(async (lead: Lead) => {
    const { createdByUserId, source, ...cleanLead } = lead as any;
    if (supabase) {
      const { error } = await supabase.from('leads').update(cleanLead).eq('id', cleanLead.id);
      if (error) console.error("Database Error:", error.message);
    }
    setLeads(prev => prev.map(l => l.id === cleanLead.id ? cleanLead as Lead : l));
  }, []);

  const genericUpdater = (table: string, setter: any) => async (update: any) => {
    setter((prev: any) => {
      const next = typeof update === 'function' ? update(prev) : update;
      if (supabase) setTimeout(() => { supabase.from(table).upsert(next).then(); }, 0);
      return next;
    });
  };

  const genericDeleter = (table: string, setter: any) => async (id: string) => {
    if (supabase) await supabase.from(table).delete().eq('id', id);
    setter((prev: any) => prev.filter((item: any) => item.id !== id));
  };

  const accounts = useMemo(() => {
    const totals: Record<AccountId, number> = { ...INITIAL_ACCOUNTS };
    transactions.forEach(t => { if (t.type === 'deposit') totals[t.accountId] += (t.amount || 0); else totals[t.accountId] -= (t.amount || 0); });
    transfers.forEach(tf => { totals[tf.fromAccount] -= (tf.amount || 0); totals[tf.toAccount] += (tf.amount || 0); });
    return totals;
  }, [transactions, transfers]);

  const partnerBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    partners.forEach(p => { balances[p.id] = 0; });
    transactions.forEach(t => { if (t.accountId === AccountId.PARTNER && t.partnerId && balances[t.partnerId] !== undefined) { if (t.type === 'expense') balances[t.partnerId] -= t.amount; else balances[t.partnerId] += t.amount; } });
    return balances;
  }, [partners, transactions]);

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      users, updateUsers: genericUpdater('users', setUsers), deleteUser: genericDeleter('users', setUsers),
      projects, updateProjects: genericUpdater('projects', setProjects), deleteProject: genericDeleter('projects', setProjects),
      clients, updateClients: genericUpdater('clients', setClients), deleteClient: genericDeleter('clients', setClients),
      partners, updatePartners: genericUpdater('partners', setPartners), deletePartner: genericDeleter('partners', setPartners),
      suppliers, updateSuppliers: genericUpdater('suppliers', setSuppliers), deleteSupplier: genericDeleter('suppliers', setSuppliers),
      leads, updateLeads: genericUpdater('leads', setLeads), deleteLead: genericDeleter('leads', setLeads),
      addLead, updateLeadItem,
      categories, updateCategories: genericUpdater('categories', setCategories),
      leadCategories, updateLeadCategories: setLeadCategories, availableLeadCategories, allProspects,
      transactions, setTransactions, addTransaction, deleteTransaction, updateTransaction,
      accounts, transfers, transferCash: async (t) => { if (supabase) await supabase.from('transfers').insert([t]); setTransfers(prev => [...prev, t]); }, 
      partnerBalances, selectedProjectId, setSelectedProjectId,
      globalMarkupOverride, setGlobalMarkupOverride, importData: () => {}, viewAllMode, setViewAllMode, syncToCloud, isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext error');
  return context;
};