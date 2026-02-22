
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Users, Box, DollarSign, PieChart, X, History, Tag, Calendar } from 'lucide-react';
import { UserRole } from '../types';

export const Insights: React.FC = () => {
  const { transactions, selectedProjectId, clients, categories, currentUser } = useAppContext();
  const [drillDown, setDrillDown] = useState<{ type: 'client' | 'category', name: string } | null>(null);

  // Filter transactions by the active project context and SECURITY: Restricted Guest View
  const filtered = useMemo(() => {
    let tx = transactions || [];
    
    // SECURITY: If GUEST, they only see their assigned projects
    if (currentUser?.role === UserRole.GUEST) {
      const allowed = currentUser.assignedProjects || [];
      tx = tx.filter(t => allowed.includes(t.projectId));
    }

    return selectedProjectId === 'all' ? tx : tx.filter(t => t.projectId === selectedProjectId);
  }, [transactions, selectedProjectId, currentUser]);

  /**
   * INCOME SUMMARY LOGIC
   */
  const incomeSummary = useMemo(() => {
    const stats = filtered
      .filter(t => t.type === 'deposit')
      .reduce((acc, t) => {
        const client = clients.find(c => c.id === t.clientId);
        const clientName = client ? client.name.trim() : 'INTERNAL REVENUE';
        const key = clientName.toLowerCase();
        
        if (!acc[key]) {
          acc[key] = { displayName: clientName, total: 0 };
        }
        acc[key].total += Number(t.amount || 0);
        return acc;
      }, {} as Record<string, { displayName: string, total: number }>);

    const results = Object.values(stats) as { displayName: string; total: number }[];
    return results.sort((a, b) => b.total - a.total);
  }, [filtered, clients]);

  /**
   * EXPENSE SUMMARY LOGIC
   */
  const expenseSummary = useMemo(() => {
    const stats = filtered
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = categories.find(c => c.id === t.categoryId);
        const categoryName = category ? category.name.trim() : 'Uncategorized';
        const key = categoryName.toLowerCase();
        
        if (!acc[key]) {
          acc[key] = { displayName: categoryName, total: 0 };
        }
        acc[key].total += Number(t.amount || 0);
        return acc;
      }, {} as Record<string, { displayName: string, total: number }>);

    const results = Object.values(stats) as { displayName: string; total: number }[];
    return results.sort((a, b) => b.total - a.total);
  }, [filtered, categories]);

  const drillDownData = useMemo(() => {
    if (!drillDown) return [];
    return filtered.filter(t => {
      if (drillDown.type === 'client') {
        const client = clients.find(c => c.id === t.clientId);
        const name = client ? client.name : 'INTERNAL REVENUE';
        return name === drillDown.name && t.type === 'deposit';
      } else {
        const cat = categories.find(c => c.id === t.categoryId);
        const name = cat ? cat.name : 'Uncategorized';
        return name === drillDown.name && t.type === 'expense';
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [drillDown, filtered, clients, categories]);

  const formatCurrency = (val: number) => 
    `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-outfit text-white tracking-tight">Financial Intelligence</h2>
          <p className="text-sm text-slate-500">
            {selectedProjectId === 'all' 
              ? (currentUser?.role === UserRole.GUEST ? 'Consolidated Assigned Portfolios' : 'Consolidated Enterprise Analytics')
              : `Deep-dive analytics for ${selectedProjectId}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* INCOME SUMMARY */}
        <div className="bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-400/10 rounded-xl">
                <Users className="text-emerald-400" size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Income Summary</h3>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Click row to drill-down</p>
              </div>
            </div>
            <ArrowUpRight size={16} className="text-emerald-400" />
          </div>
          
          <div className="flex-1 max-h-[500px] overflow-y-auto custom-scrollbar">
            {incomeSummary.length === 0 ? (
              <div className="p-20 text-center text-slate-600 italic text-sm">No revenue data identified.</div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-900/20 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50">
                    <th className="px-8 py-4 text-left">Depositor Name</th>
                    <th className="px-8 py-4 text-right">Total Inflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {incomeSummary.map((item, idx) => (
                    <motion.tr 
                      key={item.displayName}
                      onClick={() => setDrillDown({ type: 'client', name: item.displayName })}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-emerald-400/5 cursor-pointer transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-slate-300 group-hover:text-emerald-400 transition-colors">{item.displayName}</span>
                      </td>
                      <td className="px-8 py-5 text-right font-black font-outfit text-emerald-400 text-lg">
                        {formatCurrency(item.total)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* EXPENSE SUMMARY */}
        <div className="bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-400/10 rounded-xl">
                <Box className="text-red-400" size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Expense Summary</h3>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Click row to drill-down</p>
              </div>
            </div>
            <ArrowDownRight size={16} className="text-red-400" />
          </div>
          
          <div className="flex-1 max-h-[500px] overflow-y-auto custom-scrollbar">
            {expenseSummary.length === 0 ? (
              <div className="p-20 text-center text-slate-600 italic text-sm">No expenditure data identified.</div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-900/20 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50">
                    <th className="px-8 py-4 text-left">Fiscal Category</th>
                    <th className="px-8 py-4 text-right">Total Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {expenseSummary.map((item, idx) => (
                    <motion.tr 
                      key={item.displayName}
                      onClick={() => setDrillDown({ type: 'category', name: item.displayName })}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-red-400/5 cursor-pointer transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-slate-300 group-hover:text-red-400 transition-colors">{item.displayName}</span>
                      </td>
                      <td className="px-8 py-5 text-right font-black font-outfit text-red-400 text-lg">
                        {formatCurrency(item.total)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl flex items-center justify-between group overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <PieChart size={120} />
          </div>
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-emerald-400/10 rounded-2xl text-emerald-400">
               <DollarSign size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Gross Deposits</p>
              <h4 className="text-3xl font-black text-white font-outfit mt-1">
                {formatCurrency(incomeSummary.reduce((acc, curr) => acc + curr.total, 0))}
              </h4>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl flex items-center justify-between group overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <PieChart size={120} />
          </div>
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-red-400/10 rounded-2xl text-red-400">
               <DollarSign size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Gross Expenses</p>
              <h4 className="text-3xl font-black text-white font-outfit mt-1">
                {formatCurrency(expenseSummary.reduce((acc, curr) => acc + curr.total, 0))}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* DRILL DOWN MODAL */}
      <AnimatePresence>
        {drillDown && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-slate-950/90 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col h-full max-h-[85vh] overflow-hidden"
            >
              <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl ${drillDown.type === 'client' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                    <History size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-outfit uppercase tracking-tight">{drillDown.name}</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Transaction Audit Drill-down</p>
                  </div>
                </div>
                <button onClick={() => setDrillDown(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-900">
                    <tr className="bg-slate-800/50 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-700">
                      <th className="px-8 py-5"><div className="flex items-center gap-2"><Calendar size={12}/> Date</div></th>
                      <th className="px-8 py-5"><div className="flex items-center gap-2"><Tag size={12}/> Classification</div></th>
                      <th className="px-8 py-5">Audit Description</th>
                      <th className="px-8 py-5 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {drillDownData.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-8 py-6 text-[11px] font-mono text-slate-400">{tx.date}</td>
                        <td className="px-8 py-6">
                           <span className="text-[10px] font-black px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-500 uppercase tracking-widest">
                             {categories.find(c => c.id === tx.categoryId)?.name || 'Misc'}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-300">{tx.description}</td>
                        <td className={`px-8 py-6 text-right font-black font-outfit text-lg ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-slate-100'}`}>
                          {tx.type === 'expense' ? '-' : '+'}${tx.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
