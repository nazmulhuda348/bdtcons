import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, User, Transaction, Project, Client, Partner, Supplier, Category, Lead, AccountId, InternalTransfer, UserRole } from './types';
import { INITIAL_USERS, INITIAL_PROJECTS, INITIAL_CLIENTS, INITIAL_CATEGORIES, INITIAL_TRANSACTIONS, INITIAL_LEADS, INITIAL_ACCOUNTS } from './constants';

const getEnvVar = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

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
  setGlobalMarkupOverride: (val: number | null) => void;
  importData: (json: string) => void;
  transferCash: (transfer: InternalTransfer) => Promise<void>;
  partnerBalances: Record<string, number>;
  setViewAllMode: (val: boolean) => void;
  syncToCloud: () => Promise<boolean>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const safeGetStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const safeSetStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = safeGetStorage('bdt_current_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [viewAllMode, setViewAllMode] = useState<boolean>(() => {
    const saved = safeGetStorage('bdt_view_all_mode');
    return saved ? JSON.parse(saved) : true;
  });

  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<InternalTransfer[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');
  const [globalMarkupOverride, setGlobalMarkupOverride] = useState<number | null>(null);

  const fetchCloudData = useCallback(async () => {
    if (!supabase) {
      setUsers(INITIAL_USERS);
      setProjects(INITIAL_PROJECTS);
      setClients(INITIAL_CLIENTS);
      setCategories(INITIAL_CATEGORIES);
      setTransactions(INITIAL_TRANSACTIONS);
      setLeads(INITIAL_LEADS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const fetchOrSeed = async (table: string, fallback: any[]) => {
        const { data, error } = await supabase!.from(table).select('*');
        if (error) throw error;
        
        if (!data || data.length === 0) {
          if (fallback.length > 0) {
            const { data: seeded, error: seedErr } = await supabase!.from(table).insert(fallback).select();
            if (seedErr) throw seedErr;
            return seeded || fallback;
          }
          return [];
        }
        return data;
      };

      const [u, p, c, cat, pt, s, l, t, tr] = await Promise.all([
        fetchOrSeed('users', INITIAL_USERS),
        fetchOrSeed('projects', INITIAL_PROJECTS),
        fetchOrSeed('clients', INITIAL_CLIENTS),
        fetchOrSeed('categories', INITIAL_CATEGORIES),
        fetchOrSeed('partners', []),
        fetchOrSeed('suppliers', []),
        fetchOrSeed('leads', INITIAL_LEADS),
        fetchOrSeed('transactions', INITIAL_TRANSACTIONS),
        fetchOrSeed('transfers', [])
      ]);

      setUsers(u);
      setProjects(p);
      setClients(c);
      setCategories(cat);
      setPartners(pt);
      setSuppliers(s);
      setLeads(l);
      setTransactions(t);
      setTransfers(tr);
    } catch (err) {
      console.error("Infrastructure Initialization Error:", err);
      setUsers(INITIAL_USERS);
      setProjects(INITIAL_PROJECTS);
      setClients(INITIAL_CLIENTS);
      setCategories(INITIAL_CATEGORIES);
      setTransactions(INITIAL_TRANSACTIONS);
      setLeads(INITIAL_LEADS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCloudData();
  }, [fetchCloudData]);

  const accounts = useMemo(() => {
    const totals: Record<AccountId, number> = { ...INITIAL_ACCOUNTS };
    transactions.forEach(t => {
      if (t.type === 'deposit') {
        totals[t.accountId] += (t.amount || 0);
      } else {
        totals[t.accountId] -= (t.amount || 0);
      }
    });
    transfers.forEach(tf => {
      totals[tf.fromAccount] -= (tf.amount || 0);
      totals[tf.toAccount] += (tf.amount || 0);
    });
    return totals;
  }, [transactions, transfers]);

  const partnerBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    partners.forEach(p => { balances[p.id] = 0; });
    transactions.forEach(t => {
      if (t.accountId === AccountId.PARTNER && t.partnerId && balances[t.partnerId] !== undefined) {
        if (t.type === 'expense') balances[t.partnerId] -= t.amount;
        else balances[t.partnerId] += t.amount;
      }
    });
    transfers.forEach(tf => {
      if (tf.partnerId && balances[tf.partnerId] !== undefined) {
        if (tf.toAccount === AccountId.PARTNER) balances[tf.partnerId] += tf.amount;
        if (tf.fromAccount === AccountId.PARTNER) balances[tf.partnerId] -= tf.amount;
      }
    });
    return balances;
  }, [partners, transactions, transfers]);

  useEffect(() => {
    safeSetStorage('bdt_current_session', JSON.stringify(currentUser));
    safeSetStorage('bdt_view_all_mode', JSON.stringify(viewAllMode));
  }, [currentUser, viewAllMode]);

  const syncToCloud = async (): Promise<boolean> => {
    if (!supabase) return false;
    await fetchCloudData();
    return true;
  };

  const addTransaction = useCallback(async (tx: Transaction) => {
    if (!currentUser) return;
    // CRITICAL: Ensure auditUser is never null to satisfy Supabase NOT NULL constraint
    const auditName = currentUser.name || tx.auditUser || 'System Admin';
    const securedTx = { ...tx, createdByUserId: currentUser.id, auditUser: auditName };
    if (supabase) {
      const { error } = await supabase.from('transactions').insert([securedTx]);
      if (error) throw new Error(error.message);
    }
    setTransactions(prev => [securedTx, ...prev]);
  }, [currentUser]);

  const updateTransaction = useCallback(async (updatedTx: Transaction) => {
    // CRITICAL: Ensure auditUser is preserved or defaulted during updates
    const auditName = updatedTx.auditUser || currentUser?.name || 'System Admin';
    const cleanUpdate = { ...updatedTx, auditUser: auditName };
    
    if (supabase) {
      const { error } = await supabase.from('transactions').update(cleanUpdate).eq('id', updatedTx.id);
      if (error) throw new Error(error.message);
    }
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? cleanUpdate : t));
  }, [currentUser]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const transferCash = useCallback(async (transfer: InternalTransfer) => {
    if (supabase) {
      const { error } = await supabase.from('transfers').insert([transfer]);
      if (error) throw new Error(error.message);
    }
    setTransfers(prev => [transfer, ...prev]);
  }, []);

  const genericUpdater = (table: string, setter: any) => async (update: any) => {
    setter((prev: any) => {
      const next = typeof update === 'function' ? update(prev) : update;
      if (supabase) {
        // Safe fire-and-forget sync outside the pure setter
        setTimeout(() => {
          supabase.from(table).upsert(next).then(({ error }) => {
            if (error) console.error(`Cloud Sync Error [${table}]:`, error);
          });
        }, 0);
      }
      return next;
    });
  };

  const genericDeleter = (table: string, setter: any) => async (id: string) => {
    if (supabase) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
    setter((prev: any) => prev.filter((item: any) => item.id !== id));
  };

  const updateUsers = genericUpdater('users', setUsers);
  const deleteUser = genericDeleter('users', setUsers);
  const updateProjects = genericUpdater('projects', setProjects);
  const deleteProject = genericDeleter('projects', setProjects);
  const updateClients = genericUpdater('clients', setClients);
  const deleteClient = genericDeleter('clients', setClients);
  const updatePartners = genericUpdater('partners', setPartners);
  const deletePartner = genericDeleter('partners', setPartners);
  const updateSuppliers = genericUpdater('suppliers', setSuppliers);
  const deleteSupplier = genericDeleter('suppliers', setSuppliers);
  const updateLeads = genericUpdater('leads', setLeads);
  const deleteLead = genericDeleter('leads', setLeads);
  const updateCategories = genericUpdater('categories', setCategories);

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      users, updateUsers, deleteUser,
      projects, updateProjects, deleteProject,
      clients, updateClients, deleteClient,
      partners, updatePartners, deletePartner,
      suppliers, updateSuppliers, deleteSupplier,
      leads, updateLeads, deleteLead,
      categories, updateCategories,
      transactions, setTransactions, addTransaction, deleteTransaction, updateTransaction,
      accounts, transfers, transferCash, partnerBalances,
      selectedProjectId, setSelectedProjectId,
      globalMarkupOverride, setGlobalMarkupOverride,
      importData: () => {}, viewAllMode, setViewAllMode, syncToCloud,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};