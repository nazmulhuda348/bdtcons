import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { 
  Building2, 
  Wallet, 
  Users, 
  UserCheck, 
  ArrowRightLeft, 
  Check, 
  History,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { AccountId, InternalTransfer } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const CashManagement: React.FC = () => {
  const { accounts, transfers, transferCash, partners } = useAppContext();
  const [transferForm, setTransferForm] = useState({
    from: AccountId.BANK,
    to: AccountId.PARTNER,
    amount: '',
    note: '',
    partnerId: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferForm.amount);
    if (isNaN(amount) || amount <= 0) return alert('Invalid amount');
    if (transferForm.from === transferForm.to) return alert('Cannot transfer to same account');
    
    const newTransfer: InternalTransfer = {
      id: Math.random().toString(36).substr(2, 9),
      date: transferForm.date,
      fromAccount: transferForm.from,
      toAccount: transferForm.to,
      amount,
      note: transferForm.note || 'Internal Operational Transfer',
      // Explicitly send null for optional FKs to satisfy DB constraints
      partnerId: transferForm.partnerId === "" ? undefined : transferForm.partnerId 
    };

    transferCash(newTransfer);
    setTransferForm({ ...transferForm, amount: '', note: '', partnerId: '' });
  };

  const accountCards = [
    { id: AccountId.BANK, label: 'Bank Account', icon: Building2, color: 'from-blue-500/20 to-indigo-500/20', accent: 'text-blue-400' },
    { id: AccountId.PARTNER, label: 'Partner Ledger', icon: Users, color: 'from-amber-500/20 to-orange-500/20', accent: 'text-amber-400' },
    { id: AccountId.MANAGER, label: 'Manager Fund', icon: UserCheck, color: 'from-purple-500/20 to-pink-500/20', accent: 'text-purple-400' },
  ];

  const showPartnerSelect = transferForm.to === AccountId.PARTNER || transferForm.from === AccountId.PARTNER;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div>
        <h2 className="text-3xl font-bold font-outfit text-white tracking-tight">Enterprise Treasury</h2>
        <p className="text-sm text-slate-500">Liquidity management and internal pipeline movements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accountCards.map((acc) => (
          <motion.div 
            key={acc.id}
            whileHover={{ y: -5 }}
            className={`relative p-8 rounded-[2rem] border border-slate-700 bg-gradient-to-br ${acc.color} backdrop-blur-xl shadow-2xl overflow-hidden group`}
          >
             <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <acc.icon size={120} />
             </div>
             <div className="flex items-center space-x-4 mb-6">
                <div className={`p-3 rounded-2xl bg-slate-900/50 ${acc.accent}`}>
                   <acc.icon size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{acc.label}</span>
             </div>
             <div className="space-y-1">
                <p className="text-3xl font-black text-white font-outfit">
                  ${(accounts[acc.id] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400">
                   <TrendingUp size={10} />
                   <span>Liquidity Stable</span>
                </div>
             </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 p-8 shadow-2xl h-full">
            <div className="flex items-center space-x-4 mb-8">
               <div className="p-3 bg-amber-400/10 rounded-2xl">
                  <ArrowRightLeft className="text-amber-400" size={24} />
               </div>
               <h3 className="text-xl font-bold text-white font-outfit">Pipeline Movement</h3>
            </div>
            
            <form onSubmit={handleTransfer} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Movement Date</label>
                <input 
                  type="date" required 
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                  value={transferForm.date}
                  onChange={e => setTransferForm({ ...transferForm, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Source Node</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                  value={transferForm.from}
                  onChange={e => setTransferForm({ ...transferForm, from: e.target.value as AccountId })}
                >
                  {accountCards.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Destination Node</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                  value={transferForm.to}
                  onChange={e => setTransferForm({ ...transferForm, to: e.target.value as AccountId })}
                >
                  {accountCards.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>

              {showPartnerSelect && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Stakeholder Attribution</label>
                  <select 
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                    value={transferForm.partnerId}
                    onChange={e => setTransferForm({ ...transferForm, partnerId: e.target.value })}
                  >
                    <option value="">Select Partner</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Transfer Amount ($)</label>
                <input 
                  type="number" step="0.01" required 
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-outfit text-xl focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                  placeholder="0.00"
                  value={transferForm.amount}
                  onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Audit Note</label>
                <input 
                  type="text"
                  placeholder="Internal audit memo..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                  value={transferForm.note}
                  onChange={e => setTransferForm({ ...transferForm, note: e.target.value })}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-amber-400 text-slate-900 font-black py-5 rounded-2xl hover:bg-amber-500 transition-all shadow-xl shadow-amber-400/20 text-xs uppercase tracking-widest flex items-center justify-center space-x-2"
              >
                <Check size={18} />
                <span>Execute Movement</span>
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 p-8 shadow-2xl flex flex-col h-full overflow-hidden">
            <div className="flex items-center space-x-4 mb-8">
               <div className="p-3 bg-blue-400/10 rounded-2xl">
                  <History className="text-blue-400" size={24} />
               </div>
               <h3 className="text-xl font-bold text-white font-outfit">Movement Audit</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {transfers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600">
                   <ArrowRightLeft size={48} className="mb-4 opacity-10" />
                   <p className="text-sm font-medium italic">No internal fund movements recorded</p>
                </div>
              ) : (
                transfers.map((t) => (
                  <div key={t.id} className="bg-slate-900/50 border border-slate-700 p-6 rounded-2xl flex items-center justify-between">
                     <div className="flex items-center space-x-6">
                        <div className="flex flex-col items-center">
                           <span className="text-[8px] font-black uppercase text-slate-600 mb-1">{t.fromAccount}</span>
                           <div className="w-10 h-10 rounded-xl bg-red-400/10 text-red-400 flex items-center justify-center">
                              <TrendingDown size={18} />
                           </div>
                        </div>
                        <div className="h-px w-8 bg-slate-700" />
                        <div className="flex flex-col items-center">
                           <span className="text-[8px] font-black uppercase text-slate-600 mb-1">{t.toAccount}</span>
                           <div className="w-10 h-10 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
                              <TrendingUp size={18} />
                           </div>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-white">
                             {t.note}
                             {t.partnerId && <span className="ml-2 text-[10px] text-amber-400 font-black uppercase tracking-widest">Stakeholder: {partners.find(p => p.id === t.partnerId)?.name}</span>}
                           </span>
                           <span className="text-[10px] text-slate-500 font-mono">{new Date(t.date).toLocaleString()}</span>
                        </div>
                     </div>
                     <div className="text-xl font-black text-white font-outfit">
                        ${t.amount.toLocaleString()}
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};