import React, { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { 
  ArrowRightLeft, Search, Filter, Calendar, 
  Building2, Users, UserCheck, Download, CheckCircle2,
  Edit, Trash2, X // 🔴 নতুন আইকন যুক্ত করা হলো
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AccountId, InternalTransfer } from '../types';

// Structural Fix for React 19 + Framer Motion Type Conflicts
const MotionDiv = motion.div as any;
const MotionTr = motion.tr as any;

export const TransferLedger: React.FC = () => {
  // 🔴 updateTransfer এবং deleteTransfer ইম্পোর্ট করা হলো
  const { transfers, banks, partners, clients, projects, updateTransfer, deleteTransfer } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all'); // all, bank, partner, p2p

  // 🔴 এডিট করার জন্য নতুন স্টেট
  const [editingTransfer, setEditingTransfer] = useState<InternalTransfer | null>(null);

  // Helper function to resolve node names
  const resolveNodeName = (type: AccountId | string, specificId?: string) => {
    if (type === AccountId.BANK) {
      if (specificId) {
        const bank = banks.find(b => b.id === specificId);
        return bank ? `${bank.name} ${bank.accountNumber ? `(${bank.accountNumber})` : ''}` : 'Bank';
      }
      return 'Central Bank';
    }
    if (type === AccountId.MANAGER) return 'Manager Fund';
    if (type === AccountId.PARTNER) {
      if (specificId) {
         const partner = partners.find(p => p.id === specificId);
         return partner ? partner.name : 'Partner';
      }
      return 'Partner Stakeholder';
    }
    
    // For Client P2P Transfers (We need to check clients)
    const client = clients.find(c => c.id === type);
    if(client) return client.name;

    return type;
  };

  const getIconForType = (type: string) => {
      if(type === AccountId.BANK) return <Building2 size={14} className="text-blue-400" />;
      if(type === AccountId.PARTNER) return <Users size={14} className="text-amber-400" />;
      if(type === AccountId.MANAGER) return <UserCheck size={14} className="text-emerald-400" />;
      return <Users size={14} className="text-rose-400" />; // For P2P
  }

  // Filter and Sort Transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t: any) => {
      // 1. Search Filter (Note, Amount)
      const matchesSearch = (t.note || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.amount.toString().includes(searchTerm);
      
      // 2. Date Filter
      const matchesDate = dateFilter ? t.date === dateFilter : true;

      // 3. Type Filter
      let matchesType = true;
      if(typeFilter === 'bank') {
         matchesType = t.fromAccount === AccountId.BANK || t.toAccount === AccountId.BANK;
      } else if (typeFilter === 'partner') {
         matchesType = t.fromAccount === AccountId.PARTNER || t.toAccount === AccountId.PARTNER;
      }

      return matchesSearch && matchesDate && matchesType;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transfers, searchTerm, dateFilter, typeFilter]);

  // Export to CSV Logic
  const exportToCSV = () => {
    const headers = ['Date', 'Transfer ID', 'From Node', 'To Node', 'Amount ($)', 'Note / Memo'];
    const rows = filteredTransfers.map((t: any) => [
      t.date,
      t.id,
      resolveNodeName(t.fromAccount, t.fromAccount === AccountId.BANK ? t.fromBankId : t.partnerId),
      resolveNodeName(t.toAccount, t.toAccount === AccountId.BANK ? t.toBankId : t.partnerId),
      t.amount,
      t.note || 'Internal Transfer'
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.map(item => `"${item}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Treasury_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 🔴 ডিলিট হ্যান্ডলার
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this transfer? Balance will be reverted.")) {
      if (deleteTransfer) await deleteTransfer(id);
    }
  };

  // 🔴 এডিট সাবমিট হ্যান্ডলার
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransfer && updateTransfer) {
      await updateTransfer(editingTransfer);
      setEditingTransfer(null);
    }
  };

  return (
    <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold font-outfit text-white tracking-tight flex items-center gap-3">
             <ArrowRightLeft className="text-emerald-400" size={32} />
             Treasury Ledger
          </h2>
          <p className="text-sm text-slate-500 mt-1">Audit trail of all internal cash flows and P2P transfers</p>
        </div>
        <div className="flex gap-3">
           <button onClick={exportToCSV} className="flex items-center space-x-2 bg-slate-800 border border-slate-700 text-slate-300 px-5 py-3 rounded-2xl font-bold uppercase text-[10px] hover:bg-slate-700 transition-all shadow-xl">
             <Download size={16} /> <span>Export Report</span>
           </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-800 rounded-[2rem] border border-slate-700 shadow-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
               type="text" placeholder="Search by memo or amount..." 
               className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-emerald-400/20 outline-none font-bold" 
               value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="relative w-full md:w-48">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
               type="date" 
               className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-emerald-400/20 outline-none font-bold" 
               value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} 
            />
          </div>
          <div className="relative w-full md:w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select 
               className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-emerald-400/20 outline-none font-bold appearance-none cursor-pointer"
               value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            >
               <option value="all">All Transfers</option>
               <option value="bank">Bank Transfers</option>
               <option value="partner">Partner Transfers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-800 rounded-[2rem] border border-slate-700 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
                <th className="px-6 py-5">Date & ID</th>
                <th className="px-6 py-5">Origin (উৎস)</th>
                <th className="px-6 py-5">Destination (গন্তব্য)</th>
                <th className="px-6 py-5 text-right">Amount</th>
                <th className="px-6 py-5">Memo / Note</th>
                <th className="px-6 py-5 text-right">Actions</th> {/* 🔴 নতুন কলাম */}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              <AnimatePresence mode="popLayout">
                {filteredTransfers.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold"> {/* 🔴 colSpan ৬ করা হলো */}
                        No transfer records found matching your filters.
                     </td>
                   </tr>
                ) : (
                  filteredTransfers.map((t: any) => (
                    <MotionTr 
                       key={t.id} 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                       className="hover:bg-slate-700/10 transition-colors group"
                    >
                      <td className="px-6 py-5">
                         <div className="flex flex-col">
                            <span className="text-white font-bold text-sm">{t.date}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">#{t.id}</span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-2">
                           {getIconForType(t.fromAccount)}
                           <span className="text-slate-300 font-bold text-sm">
                             {resolveNodeName(t.fromAccount, t.fromAccount === AccountId.BANK ? t.fromBankId : t.partnerId)}
                           </span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-2">
                           {getIconForType(t.toAccount)}
                           <span className="text-slate-300 font-bold text-sm">
                             {resolveNodeName(t.toAccount, t.toAccount === AccountId.BANK ? t.toBankId : t.partnerId)}
                           </span>
                         </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <span className="text-emerald-400 font-black text-lg font-outfit tracking-tight">
                            ${Number(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                         </span>
                      </td>
                      <td className="px-6 py-5">
                         <span className="text-slate-400 text-xs flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-emerald-500/50" />
                            {t.note || 'Internal Operational Transfer'}
                         </span>
                      </td>

                      {/* 🔴 অ্যাকশন বাটন */}
                      <td className="px-6 py-5 text-right">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                           <button 
                             onClick={() => setEditingTransfer(t)} 
                             className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all"
                             title="Edit"
                           >
                             <Edit size={16} />
                           </button>
                           <button 
                             onClick={() => handleDelete(t.id)} 
                             className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"
                             title="Delete"
                           >
                             <Trash2 size={16} />
                           </button>
                         </div>
                      </td>

                    </MotionTr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔴 এডিট মডাল (টাইপস্ক্রিপ্ট এরর এড়াতে <MotionDiv> ব্যবহার করা হয়েছে) */}
      <AnimatePresence>
        {editingTransfer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <MotionDiv 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative border-t-emerald-400/20"
            >
              <button 
                onClick={() => setEditingTransfer(null)}
                className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-bold font-outfit text-white mb-2 flex items-center gap-2">
                <Edit className="text-emerald-400" size={20} /> Edit Transfer Record
              </h3>
              <p className="text-xs text-slate-500 mb-6">Updating Transfer #{editingTransfer.id}</p>

              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Amount ($)</label>
                  <input 
                    type="number" 
                    required 
                    step="any"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-white focus:ring-2 focus:ring-emerald-400 outline-none transition-all font-bold font-outfit text-lg"
                    value={editingTransfer.amount}
                    onChange={e => setEditingTransfer({...editingTransfer, amount: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Memo / Note</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-white focus:ring-2 focus:ring-emerald-400 outline-none transition-all text-sm font-bold"
                    value={editingTransfer.note || ''}
                    onChange={e => setEditingTransfer({...editingTransfer, note: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setEditingTransfer(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-2xl transition-all text-xs uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-emerald-400 hover:bg-emerald-500 text-slate-900 font-black py-3.5 rounded-2xl transition-all text-xs uppercase tracking-widest shadow-xl shadow-emerald-400/10"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

    </MotionDiv>
  );
};