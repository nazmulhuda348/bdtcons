
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { 
  Search, Plus, Image as ImageIcon, Trash2, X, ChevronLeft, ChevronRight, 
  User as UserIcon, Tag, Edit2, ArrowUpRight, ArrowDownRight, Check, Upload, Loader2, AlertTriangle, UserPlus, FolderPlus
} from 'lucide-react';
import { UserRole, Transaction, AccountId, Category, Client } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { SecurityToggle } from './SecurityToggle';
import { usePermissions } from '../hooks/usePermissions';

export const Ledger: React.FC = () => {
  const { transactions, deleteTransaction, selectedProjectId, projects, categories, clients, currentUser, viewAllMode } = useAppContext();
  const { isAdmin, isGuest } = usePermissions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialType, setInitialType] = useState<'deposit' | 'expense'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getClientName = (clientId?: any, type?: 'deposit' | 'expense') => {
    const cidStr = String(clientId || '');
    if (!cidStr || cidStr === 'undefined' || cidStr === 'null' || cidStr.trim() === '') {
      return type === 'deposit' ? 'INTERNAL REVENUE' : 'GENERAL PAYEE';
    }
    const client = clients?.find(c => String(c.id) === cidStr);
    return client?.name || 'EXTERNAL ENTITY';
  };

  const filtered = useMemo(() => {
    let result = transactions || [];
    if (currentUser) {
      if (currentUser.role === UserRole.GUEST) {
        const assignedIds = currentUser.assignedProjects || [];
        result = result.filter(t => assignedIds.includes(t.projectId));
      } else if (!viewAllMode) {
        result = result.filter(t => t.createdByUserId === currentUser.id);
      }
    }
    if (selectedProjectId !== 'all') result = result.filter(t => t.projectId === selectedProjectId);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(t => t.description.toLowerCase().includes(s) || getClientName(t.clientId, t.type).toLowerCase().includes(s));
    }
    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedProjectId, searchTerm, projects, currentUser, viewAllMode, clients, categories]);

  // To support "ready to see 100 in 10 pages", we slice for pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filtered, currentPage]);

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProjectId, viewAllMode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-outfit text-white tracking-tight">Financial Ledger</h2>
          <p className="text-xs md:text-sm text-slate-500">Audit history trail ({filtered.length} entries)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:space-x-3 w-full lg:w-auto">
          <SecurityToggle />
          {!isGuest && (
            <div className="flex flex-1 md:flex-none gap-2">
              <button onClick={() => { setInitialType('deposit'); setShowAddModal(true); }} className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-emerald-500 text-slate-950 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-emerald-400"><ArrowUpRight size={18}/><span>Deposit</span></button>
              <button onClick={() => { setInitialType('expense'); setShowAddModal(true); }} className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-amber-400 text-slate-900 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-amber-300"><Plus size={18}/><span>Entry</span></button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-4 bg-slate-900/30 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input type="text" placeholder="Search entries..." className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white outline-none focus:ring-1 focus:ring-amber-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Page {currentPage} of {Math.max(1, totalPages)}</span>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-700">
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Entity / Description</th>
                <th className="px-6 py-5 text-center">Node</th>
                <th className="px-6 py-5 text-right">Impact</th>
                <th className="px-6 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {paginatedItems.map((t) => (
                <tr key={t.id} className="hover:bg-slate-700/20 transition-colors group">
                  <td className="px-6 py-6 text-[11px] text-slate-500 font-mono">{t.date}</td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-sm tracking-tight">
                        {t.type === 'deposit' ? getClientName(t.clientId, 'deposit') : t.description}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                          {categories.find(c => c.id === t.categoryId)?.name || 'Misc'}
                        </span>
                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          Created by {t.auditUser || 'System'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="px-2 py-1 rounded bg-slate-950 text-[9px] font-black text-amber-400 uppercase tracking-widest">{t.accountId}</span>
                  </td>
                  <td className={`px-6 py-6 text-right font-black font-outfit text-lg ${t.type === 'deposit' ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {t.type === 'expense' ? '-' : '+'}${t.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {t.attachment && <button onClick={() => setViewingAttachment(t.attachment!)} className="p-2 text-slate-500 hover:text-amber-400 transition-all"><ImageIcon size={16} /></button>}
                      {!isGuest && <button onClick={() => setEditingTransaction(t)} className="p-2 text-slate-500 hover:text-white transition-all"><Edit2 size={16}/></button>}
                      {isAdmin && <button onClick={() => deleteTransaction(t.id)} className="p-2 text-slate-500 hover:text-red-500 transition-all"><Trash2 size={16}/></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-600 italic">No ledger entries identified.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-6 bg-slate-900/30 border-t border-slate-700 flex justify-center">
           <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(10, totalPages) }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-xl font-black text-xs transition-all border ${
                    currentPage === pageNum 
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-lg shadow-amber-400/20' 
                    : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-white hover:border-slate-500'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              {totalPages > 10 && <span className="text-slate-600 px-2 font-black">...</span>}
           </div>
        </div>
      </div>

      <AnimatePresence>
        {viewingAttachment && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl" onClick={() => setViewingAttachment(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative max-w-4xl w-full">
               <img src={viewingAttachment} className="w-full h-auto rounded-3xl shadow-2xl border border-slate-700" alt="Memo Attachment" />
               <button onClick={() => setViewingAttachment(null)} className="absolute -top-12 right-0 text-white flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest">
                  <X size={20} /> Close Preview
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {(showAddModal || editingTransaction) && (
        <TransactionModal 
          transaction={editingTransaction || undefined} 
          defaultType={initialType}
          onClose={() => { setShowAddModal(false); setEditingTransaction(null); }} 
        />
      )}
    </div>
  );
};

const TransactionModal: React.FC<{ onClose: () => void, transaction?: Transaction, defaultType: 'deposit' | 'expense' }> = ({ onClose, transaction, defaultType }) => {
  const { projects, categories, updateCategories, clients, updateClients, addTransaction, updateTransaction, selectedProjectId, currentUser } = useAppContext();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Add UI states
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');

  const [form, setForm] = useState({
    date: transaction?.date || new Date().toISOString().split('T')[0],
    description: transaction?.description || '',
    amount: transaction?.amount.toString() || '',
    projectId: transaction?.projectId || String(selectedProjectId === 'all' ? (projects?.[0]?.id || '') : selectedProjectId),
    categoryId: transaction?.categoryId || '',
    accountId: transaction?.accountId || AccountId.BANK,
    clientId: transaction?.clientId || '',
    partnerId: transaction?.partnerId || '',
    type: transaction?.type || defaultType,
    attachment: transaction?.attachment || ''
  });

  const filteredCategories = useMemo(() => {
    const targetType = form.type === 'deposit' ? 'income' : 'expense';
    return (categories || []).filter(c => c && c.type === targetType);
  }, [categories, form.type]);

  // Ensure category is always selected
  useEffect(() => {
    if (filteredCategories.length > 0 && !form.categoryId) {
      setForm(prev => ({ ...prev, categoryId: String(filteredCategories[0].id) }));
    }
  }, [filteredCategories, form.type]);

  const handleQuickAddCategory = async () => {
    if (!quickAddName.trim()) return;
    const newCat: Category = {
      id: Math.random().toString(36).substr(2, 9),
      name: quickAddName.trim(),
      type: form.type === 'deposit' ? 'income' : 'expense'
    };
    await updateCategories(prev => [...prev, newCat]);
    setForm(prev => ({ ...prev, categoryId: newCat.id }));
    setQuickAddName('');
    setShowQuickAddCategory(false);
  };

  const handleQuickAddClient = async () => {
    if (!quickAddName.trim()) return;
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: quickAddName.trim(),
      email: '',
      phone: ''
    };
    await updateClients(prev => [...prev, newClient]);
    setForm(prev => ({ ...prev, clientId: newClient.id }));
    setQuickAddName('');
    setShowQuickAddClient(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, attachment: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.categoryId || form.categoryId === "") {
      setErrorMsg("Fiscal category selection is mandatory.");
      return;
    }
    
    if (!form.projectId || form.projectId === "") {
      setErrorMsg("Project portfolio selection is mandatory.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // CRITICAL: Ensure auditUser is included and non-null
    const auditName = transaction?.auditUser || currentUser?.name || 'Unknown User';

    // Convert empty strings to null for optional relational IDs
    const payload = { 
      ...form, 
      amount: parseFloat(form.amount) || 0,
      clientId: form.clientId === "" ? null : form.clientId,
      partnerId: form.partnerId === "" ? null : form.partnerId,
      attachment: form.attachment === "" ? null : form.attachment,
      auditUser: auditName
    };
    
    try {
      if (transaction) {
        await updateTransaction({ ...transaction, ...payload } as any);
      } else {
        await addTransaction({ 
          id: Math.random().toString(36).substr(2, 9), 
          ...payload, 
          auditUser: auditName, 
          createdByUserId: currentUser?.id || 'sys' 
        } as any);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Persistence Failure");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-3xl p-6 md:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
        <h3 className="text-2xl font-bold font-outfit text-white mb-6 tracking-tight">
          {transaction ? 'Modify Ledger Record' : 'Commit New Entry'}
        </h3>
        
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-700">
            <button type="button" onClick={() => setForm(prev => ({ ...prev, type: 'expense' }))} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${form.type === 'expense' ? 'bg-amber-400 text-slate-950' : 'text-slate-500'}`}>Expenditure</button>
            <button type="button" onClick={() => setForm(prev => ({ ...prev, type: 'deposit' }))} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${form.type === 'deposit' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'}`}>Income</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fiscal Value ($)</label>
              <input required type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 text-white focus:ring-1 focus:ring-amber-400 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reporting Date</label>
              <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 text-white outline-none" />
            </div>
          </div>

          <div className="space-y-4">
            {/* Conditional Depositor/Client Field */}
            {form.type === 'deposit' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Depositor Name</label>
                  <button type="button" onClick={() => setShowQuickAddClient(!showQuickAddClient)} className="text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300 flex items-center gap-1">
                    <UserPlus size={12} /> {showQuickAddClient ? 'Cancel' : 'New Depositor'}
                  </button>
                </div>
                {showQuickAddClient ? (
                  <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
                    <input autoFocus placeholder="New Depositor Name..." className="flex-1 bg-slate-900 border border-emerald-500/30 rounded-xl px-4 py-2 text-white outline-none" value={quickAddName} onChange={e => setQuickAddName(e.target.value)} />
                    <button type="button" onClick={handleQuickAddClient} className="bg-emerald-500 text-slate-950 p-3 rounded-xl hover:bg-emerald-400 transition-colors"><Check size={18} /></button>
                  </div>
                ) : (
                  <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none">
                    <option value="">N/A (General Entry)</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Active Portfolio</label>
                <select required value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none">
                  <option value="" disabled>Select Project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    {form.type === 'deposit' ? 'Revenue Category' : 'Expenditure Category'}
                  </label>
                  <button type="button" onClick={() => setShowQuickAddCategory(!showQuickAddCategory)} className="text-[9px] font-black text-amber-400 uppercase tracking-widest hover:text-amber-300 flex items-center gap-1">
                    <FolderPlus size={12} /> {showQuickAddCategory ? 'Cancel' : 'Add Category'}
                  </button>
                </div>
                {showQuickAddCategory ? (
                  <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
                    <input autoFocus placeholder="New Category Name..." className="flex-1 bg-slate-900 border border-amber-500/30 rounded-xl px-4 py-2 text-white outline-none" value={quickAddName} onChange={e => setQuickAddName(e.target.value)} />
                    <button type="button" onClick={handleQuickAddCategory} className="bg-amber-400 text-slate-950 p-3 rounded-xl hover:bg-amber-300 transition-colors"><Check size={18} /></button>
                  </div>
                ) : (
                  <select required value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none">
                    <option value="" disabled>Choose Classification...</option>
                    {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Audit Memo (Description)</label>
            <input required type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Fiscal note detail..." className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-5 py-3 text-white focus:ring-1 focus:ring-amber-400 outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Digital Proof (Image)</label>
            <div className="flex items-center gap-4">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-700 transition-all"
              >
                <ImageIcon size={14} />
                <span>Insert Memo</span>
              </button>
              {form.attachment && (
                <div className="relative group">
                  <img src={form.attachment} className="w-14 h-14 rounded-xl object-cover border border-slate-700 shadow-lg" alt="Thumbnail" />
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, attachment: '' }))} className="absolute -top-2 -right-2 bg-red-500 p-1 rounded-full text-white shadow-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all ${isSubmitting ? 'bg-slate-700 cursor-not-allowed' : (form.type === 'deposit' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-amber-400 hover:bg-amber-300')} text-slate-950 flex items-center justify-center gap-2`}>
            {isSubmitting && <Loader2 className="animate-spin" size={16} />}
            <span>{isSubmitting ? 'Synchronizing...' : (transaction ? 'Confirm Adjustments' : 'Commit to Ledger')}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
