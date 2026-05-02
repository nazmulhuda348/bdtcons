import React, { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { 
  ArrowRightLeft, Search, Filter, Calendar, 
  Building2, Users, UserCheck, Download, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AccountId, InternalTransfer } from '../types';

// Structural Fix for React 19 + Framer Motion Type Conflicts
const MotionDiv = motion.div as any;
const MotionTr = motion.tr as any;

export const TransferLedger: React.FC = () => {
  const { transfers, banks, partners, clients, projects } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all'); // all, bank, partner, p2p

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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              <AnimatePresence mode="popLayout">
                {filteredTransfers.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold">
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
                    </MotionTr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

    </MotionDiv>
  );
};