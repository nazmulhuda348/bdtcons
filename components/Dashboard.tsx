// Fix: Explicitly ensuring numeric types for arithmetic operations to resolve TypeScript errors on lines 209 and 213.
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Settings, 
  Users, 
  ChevronDown, 
  Building2, 
  UserCheck,
  ArrowRight,
  ArrowDown,
  Tag,
  Landmark,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AccountId, UserRole } from '../types';

// Structural Fix for React 19 + Framer Motion Type Conflicts
const MotionDiv = motion.div as any;

export const Dashboard: React.FC = () => {
  const { 
    transactions, projects, accounts, categories, selectedProjectId, 
    globalMarkupOverride, currentUser, banks, partners, partnerBalances 
  } = useAppContext();
  
  const [showNetBreakdown, setShowNetBreakdown] = useState(false);
  const [showDepositsBreakdown, setShowDepositsBreakdown] = useState(false);
  const [showExpensesBreakdown, setShowExpensesBreakdown] = useState(false);
  
  // 🔴 Node Detail দেখার জন্য নতুন স্টেট
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const effectiveMarkup = globalMarkupOverride !== null ? globalMarkupOverride : (activeProject?.serviceMarkup || 0);

  const stats = useMemo(() => {
    // SECURITY: Filter base transactions if user is a GUEST
    let baseTx = transactions;
    if (currentUser?.role === UserRole.GUEST) {
      const allowed = currentUser.assignedProjects || [];
      baseTx = transactions.filter(t => allowed.includes(t.projectId));
    }

    const filtered = selectedProjectId === 'all' 
      ? baseTx 
      : baseTx.filter(t => t.projectId === selectedProjectId);

    const deposits = filtered.filter(t => t.type === 'deposit').reduce((acc, t) => acc + t.amount, 0);
    const rawExpenses = filtered.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const costWithMarkup = rawExpenses * (1 + effectiveMarkup / 100);
    const netBalance = deposits - rawExpenses;

    const depositsByCategory = filtered
      .filter(t => t.type === 'deposit')
      .reduce((acc, t) => {
        const cat = categories.find(c => c.id === t.categoryId)?.name || 'Other Revenue';
        acc[cat] = (acc[cat] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const expensesByCategory = filtered
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const cat = categories.find(c => c.id === t.categoryId)?.name || 'Misc Expense';
        acc[cat] = (acc[cat] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return { deposits, rawExpenses, costWithMarkup, netBalance, depositsByCategory, expensesByCategory };
  }, [transactions, selectedProjectId, effectiveMarkup, categories, currentUser]);

  // 🔴 নির্দিষ্ট ব্যাংকের ব্যালেন্স হিসাব করার লজিক
  const bankBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    banks.forEach(b => { balances[b.id] = 0; });
    
    transactions.forEach(t => {
      if (t.accountId === AccountId.BANK && t.bankId) {
        balances[t.bankId] = (balances[t.bankId] || 0) + (t.type === 'deposit' ? t.amount : -t.amount);
      }
    });
    return balances;
  }, [transactions, banks]);

  const pipelineNodes = [
    { id: 'start', label: 'Net Balance', value: stats.netBalance, icon: DollarSign, color: 'from-slate-700 to-slate-800' },
    { id: AccountId.BANK, label: 'Bank Node', value: accounts[AccountId.BANK], icon: Building2, color: 'from-blue-600/20 to-indigo-600/20' },
    { id: AccountId.PARTNER, label: 'Partner Ledger', value: accounts[AccountId.PARTNER], icon: Users, color: 'from-amber-600/20 to-orange-600/20' },
    { id: AccountId.MANAGER, label: 'Manager Fund', value: accounts[AccountId.MANAGER], icon: UserCheck, color: 'from-emerald-600/20 to-teal-600/20' },
  ];

  const showPipeline = currentUser?.role !== UserRole.GUEST;

  return (
    <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6 md:space-y-8">
      
      {/* Visual Pipeline Flowchart - Restricted for GUESTS */}
      {showPipeline && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 overflow-hidden">
          <div className="flex items-center justify-between mb-8 md:mb-10">
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-amber-400/10 rounded-xl"><Settings size={20} className="text-amber-400" /></div>
               <h3 className="text-lg md:text-xl font-bold text-white font-outfit uppercase tracking-widest">Treasury Pipeline</h3>
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden md:block">Click nodes for details</p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6 relative">
            {pipelineNodes.map((node, idx) => (
              <React.Fragment key={node.id}>
                <MotionDiv 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => node.id !== 'start' ? setActiveNode(activeNode === node.id ? null : node.id) : null}
                  className={`relative w-full lg:flex-1 bg-gradient-to-br ${node.color} border transition-all cursor-pointer p-5 md:p-6 rounded-2xl md:rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col items-center text-center ${activeNode === node.id ? 'border-amber-400 shadow-amber-400/10' : 'border-slate-700/50 hover:border-slate-600'}`}
                >
                  <div className="p-2 md:p-3 bg-slate-900/50 rounded-xl md:rounded-2xl mb-3 md:mb-4 text-white">
                    <node.icon size={20} className="md:w-6 md:h-6" />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{node.label}</span>
                  <span className="text-lg md:text-xl font-black text-white font-outfit">${node.value.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                  
                  {node.id === 'start' && (
                     <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-400 text-slate-950 text-[7px] md:text-[8px] font-black rounded-full uppercase">Source</div>
                  )}
                </MotionDiv>
                
                {idx < pipelineNodes.length - 1 && (
                  <div className="flex lg:hidden items-center text-slate-800 my-1">
                    <ArrowDown size={18} className="animate-pulse" />
                  </div>
                )}
                {idx < pipelineNodes.length - 1 && (
                  <div className="hidden lg:flex items-center text-slate-700">
                    <ArrowRight size={24} className="animate-pulse" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* 🔴 Detailed Breakdown Section (Bank & Partner) 🔴 */}
          <AnimatePresence>
            {activeNode === AccountId.BANK && (
              <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-8 pt-8 border-t border-slate-800 overflow-hidden">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Landmark size={14}/> Detailed Bank Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {banks.map(bank => (
                     <div key={bank.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                        <div>
                          <p className="text-white font-bold text-sm">{bank.name}</p>
                          {bank.accountNumber && <p className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1"><CreditCard size={10}/> {bank.accountNumber}</p>}
                        </div>
                        <span className="text-lg font-black text-blue-400 font-outfit">${(bankBalances[bank.id] || 0).toLocaleString()}</span>
                     </div>
                   ))}
                   {banks.length === 0 && <p className="text-xs text-slate-500 italic">No registered banks found.</p>}
                </div>
              </MotionDiv>
            )}

            {activeNode === AccountId.PARTNER && (
              <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-8 pt-8 border-t border-slate-800 overflow-hidden">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={14}/> Partner Share Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {partners.map(partner => (
                     <div key={partner.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                        <div>
                          <p className="text-white font-bold text-sm">{partner.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Stakeholder</p>
                        </div>
                        <span className="text-lg font-black text-amber-400 font-outfit">${(partnerBalances[partner.id] || 0).toLocaleString()}</span>
                     </div>
                   ))}
                   {partners.length === 0 && <p className="text-xs text-slate-500 italic">No registered partners found.</p>}
                </div>
              </MotionDiv>
            )}
            
            {activeNode === AccountId.MANAGER && (
              <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-8 pt-8 border-t border-slate-800 overflow-hidden">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center max-w-sm">
                   <div>
                     <p className="text-white font-bold text-sm">Manager Operating Fund</p>
                     <p className="text-[10px] text-slate-500 mt-0.5">General Cash In Hand</p>
                   </div>
                   <span className="text-lg font-black text-emerald-400 font-outfit">${accounts[AccountId.MANAGER].toLocaleString()}</span>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-outfit text-white">Project Health</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {selectedProjectId === 'all' 
              ? (currentUser?.role === UserRole.GUEST ? 'Summary of assigned portfolios' : 'Enterprise-wide consolidation')
              : `Metrics for ${activeProject?.name}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Gross Deposits Card */}
        <MotionDiv 
          whileHover={{ y: -4 }} 
          onClick={() => setShowDepositsBreakdown(!showDepositsBreakdown)}
          className={`cursor-pointer p-5 md:p-6 rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden ${showDepositsBreakdown ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-800 border-slate-700'}`}
        >
          <div className={`p-2 w-fit rounded-xl mb-4 ${showDepositsBreakdown ? 'bg-slate-950/20' : 'bg-emerald-400/10'}`}>
            <TrendingUp className={showDepositsBreakdown ? 'text-slate-950' : 'text-emerald-400'} size={24} />
          </div>
          <p className={`text-xs md:text-sm font-medium uppercase tracking-wider ${showDepositsBreakdown ? 'text-slate-950/70' : 'text-slate-500'}`}>Gross Deposits</p>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl md:text-2xl font-bold mt-1 font-outfit ${showDepositsBreakdown ? 'text-slate-950' : 'text-emerald-400'}`}>
              ${stats.deposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <ChevronDown size={18} className={`transition-transform duration-300 ${showDepositsBreakdown ? 'rotate-180 text-slate-950' : 'text-slate-600'}`} />
          </div>

          <AnimatePresence>
            {showDepositsBreakdown && (
              <MotionDiv 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 pt-6 border-t border-slate-950/10 space-y-3"
              >
                {Object.entries(stats.depositsByCategory).length === 0 ? (
                  <p className="text-[10px] text-slate-950/60 uppercase font-black">No deposits recorded</p>
                ) : (
                  Object.entries(stats.depositsByCategory).map(([cat, amt]) => (
                    <div key={cat} className="flex items-center justify-between text-slate-950">
                      <div className="flex items-center space-x-2">
                         <Tag size={12} className="opacity-50" />
                         <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[100px]">{cat}</span>
                      </div>
                      <span className="text-xs font-bold font-outfit">
                         ${amt.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionDiv>

        {/* Simulated Cost Card */}
        <MotionDiv 
          whileHover={{ y: -4 }} 
          onClick={() => setShowExpensesBreakdown(!showExpensesBreakdown)}
          className={`cursor-pointer p-5 md:p-6 rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden ${showExpensesBreakdown ? 'bg-amber-400 border-amber-400' : 'bg-slate-800 border-slate-700'}`}
        >
          <div className={`p-2 w-fit rounded-xl mb-4 ${showExpensesBreakdown ? 'bg-slate-950/20' : 'bg-amber-400/10'}`}>
            <TrendingDown className={showExpensesBreakdown ? 'text-slate-950' : 'text-amber-400'} size={24} />
          </div>
          <p className={`text-xs md:text-sm font-medium uppercase tracking-wider ${showExpensesBreakdown ? 'text-slate-950/70' : 'text-slate-500'}`}>Simulated Cost</p>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl md:text-2xl font-bold mt-1 font-outfit ${showExpensesBreakdown ? 'text-slate-950' : 'text-slate-100'}`}>
              ${stats.costWithMarkup.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <ChevronDown size={18} className={`transition-transform duration-300 ${showExpensesBreakdown ? 'rotate-180 text-slate-950' : 'text-slate-600'}`} />
          </div>

          <AnimatePresence>
            {showExpensesBreakdown && (
              <MotionDiv 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 pt-6 border-t border-slate-950/10 space-y-3"
              >
                {Object.entries(stats.expensesByCategory).length === 0 ? (
                  <p className="text-[10px] text-slate-950/60 uppercase font-black">No expenses recorded</p>
                ) : (
                  Object.entries(stats.expensesByCategory).map(([cat, amt]) => {
                    const amtWithMarkup = amt * (1 + effectiveMarkup / 100);
                    return (
                      <div key={cat} className="flex items-center justify-between text-slate-950">
                        <div className="flex items-center space-x-2">
                           <Tag size={12} className="opacity-50" />
                           <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[100px]">{cat}</span>
                        </div>
                        <span className="text-xs font-bold font-outfit">
                           ${amtWithMarkup.toLocaleString()}
                        </span>
                      </div>
                    );
                  })
                )}
                {effectiveMarkup > 0 && (
                  <div className="mt-2 text-right">
                    <span className="text-[8px] font-black uppercase tracking-tighter text-slate-950/50">Incl. {effectiveMarkup}% markup</span>
                  </div>
                )}
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionDiv>

        {/* Net Treasury Card */}
        <MotionDiv 
          whileHover={{ scale: 1.01, y: -4 }}
          onClick={() => setShowNetBreakdown(!showNetBreakdown)}
          className={`relative cursor-pointer p-5 md:p-6 rounded-2xl border transition-all duration-300 shadow-2xl overflow-hidden ${showNetBreakdown ? 'bg-amber-400 border-amber-400' : 'bg-slate-800 border-slate-700'}`}
        >
          <div className={`p-2 w-fit rounded-xl mb-4 ${showNetBreakdown ? 'bg-slate-950/20' : 'bg-emerald-400/10'}`}>
            <DollarSign className={showNetBreakdown ? 'text-slate-950' : 'text-emerald-400'} size={24} />
          </div>
          <p className={`text-xs md:text-sm font-medium ${showNetBreakdown ? 'text-slate-950/70' : 'text-slate-500'} uppercase tracking-wider`}>Net Treasury</p>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl md:text-2xl font-bold mt-1 font-outfit ${showNetBreakdown ? 'text-white' : 'text-white'}`}>
              ${stats.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <ChevronDown size={18} className={`transition-transform duration-300 ${showNetBreakdown ? 'rotate-180 text-slate-950' : 'text-slate-600'}`} />
          </div>

          <AnimatePresence>
            {showNetBreakdown && (
              <MotionDiv 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 pt-6 border-t border-slate-950/10 space-y-3"
              >
                {[
                  { id: AccountId.BANK, label: 'Bank', icon: Building2 },
                  { id: AccountId.PARTNER, label: 'Partner', icon: Users },
                  { id: AccountId.MANAGER, label: 'Manager', icon: UserCheck }
                ].map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between text-slate-950">
                    <div className="flex items-center space-x-2">
                       <acc.icon size={14} className="opacity-50" />
                       <span className="text-[9px] font-black uppercase tracking-widest">{acc.label}</span>
                    </div>
                    <span className="text-xs font-bold font-outfit">
                       {currentUser?.role === UserRole.GUEST 
                          ? 'Restricted Access' 
                          : `$${(accounts[acc.id] || 0).toLocaleString()}`}
                    </span>
                  </div>
                ))}
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionDiv>

        {/* Node Distribution */}
        <MotionDiv whileHover={{ y: -4 }} className="bg-slate-800 p-5 md:p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="p-2 w-fit rounded-xl bg-slate-400/10 mb-4">
            <Settings className="text-slate-400" size={24} />
          </div>
          <p className="text-slate-500 text-xs md:text-sm font-medium uppercase tracking-wider">Node Distribution</p>
          <div className="mt-2 space-y-2">
             <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-500">
                <span>Allocation Visibility</span>
                <span>{currentUser?.role === UserRole.GUEST ? 'Limited' : 'Full'}</span>
             </div>
             <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                {currentUser?.role !== UserRole.GUEST ? (
                  <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min(100, (Number(accounts[AccountId.BANK] || 0) / (Number(stats.netBalance) || 1)) * 100)}%` }} />
                ) : (
                  <div className="h-full bg-slate-700 w-1/3 animate-pulse" />
                )}
             </div>
          </div>
        </MotionDiv>
      </div>
    </MotionDiv>
  );
};