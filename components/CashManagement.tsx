import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { 
  Building2, Wallet, Users, UserCheck, ArrowRightLeft, 
  Check, History, Landmark, Plus, Trash2, CreditCard 
} from 'lucide-react';
import { AccountId, InternalTransfer, Bank } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// Structural Fix for React 19 + Framer Motion Type Conflicts
const MotionDiv = motion.div as any;

export const CashManagement: React.FC = () => {
  const { accounts, transfers, transferCash, partners, banks, updateBanks, deleteBank } = useAppContext();
  
  // ব্যাংক রেজিস্ট্রি করার জন্য নতুন স্টেট
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccount, setNewBankAccount] = useState('');
  
  const [transferForm, setTransferForm] = useState({
    from: AccountId.BANK,
    to: AccountId.PARTNER,
    fromBankId: '', // From Node এর জন্য ব্যাংক
    toBankId: '',   // To Node এর জন্য ব্যাংক
    amount: '',
    note: '',
    partnerId: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) return;
    
    // নতুন ব্যাংক অবজেক্টে অ্যাকাউন্ট নাম্বার সহ সেভ করা হচ্ছে
    const newBank: Bank = { 
      id: `b_${Date.now()}`, 
      name: newBankName.trim(),
      accountNumber: newBankAccount.trim() || undefined
    };
    
    await updateBanks([...banks, newBank]);
    setNewBankName('');
    setNewBankAccount('');
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferForm.amount);
    if (isNaN(amount) || amount <= 0) return alert('Invalid amount');

    // ভ্যালিডেশন: ব্যাংক সিলেক্ট করা হয়েছে কি না চেক করা
    if (transferForm.from === AccountId.BANK && !transferForm.fromBankId) return alert('Please select the Source Bank.');
    if (transferForm.to === AccountId.BANK && !transferForm.toBankId) return alert('Please select the Destination Bank.');
    if (transferForm.from === AccountId.PARTNER && !transferForm.partnerId) return alert('Please select a Partner.');
    if (transferForm.to === AccountId.PARTNER && !transferForm.partnerId) return alert('Please select a Partner.');

    // কোন ব্যাংক সিলেক্ট করা হয়েছে তা বের করা
    const fromBank = banks.find(b => b.id === transferForm.fromBankId);
    const toBank = banks.find(b => b.id === transferForm.toBankId);

    // নোটের সাথে ব্যাংকের নাম যুক্ত করা (যাতে ডাটাবেস এরর না আসে এবং হিস্ট্রি ট্র্যাক করা যায়)
    let enhancedNote = transferForm.note || 'Internal Operational Transfer';
    if (transferForm.from === AccountId.BANK || transferForm.to === AccountId.BANK) {
      const fromStr = transferForm.from === AccountId.BANK ? (fromBank?.name || 'Bank') : transferForm.from;
      const toStr = transferForm.to === AccountId.BANK ? (toBank?.name || 'Bank') : transferForm.to;
      enhancedNote = `[${fromStr} ➡️ ${toStr}] ${transferForm.note}`;
    }

    // 🔴 FIX: এখানে fromBankId এবং toBankId ডাটাবেসে পাঠানোর জন্য যুক্ত করা হয়েছে
    const newTransfer: InternalTransfer = {
      id: Math.random().toString(36).substr(2, 9),
      date: transferForm.date,
      fromAccount: transferForm.from,
      toAccount: transferForm.to,
      fromBankId: transferForm.from === AccountId.BANK ? transferForm.fromBankId : undefined,
      toBankId: transferForm.to === AccountId.BANK ? transferForm.toBankId : undefined,
      amount,
      note: enhancedNote,
      partnerId: transferForm.partnerId === "" ? undefined : transferForm.partnerId 
    };

    await transferCash(newTransfer);
    
    // ফর্ম রিসেট
    setTransferForm({ 
      ...transferForm, 
      amount: '', 
      note: '', 
      partnerId: '', 
      fromBankId: '', 
      toBankId: '' 
    });
  };

  return (
    <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold font-outfit text-white tracking-tight">Enterprise Treasury</h2>
          <p className="text-sm text-slate-500">Liquidity and node fund movements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ==========================================
            ব্যাংক রেজিস্ট্রি সেকশন
        ========================================== */}
        <div className="lg:col-span-4 bg-slate-800 rounded-[2.5rem] border border-slate-700 p-8 shadow-2xl">
           <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                 <Landmark size={24} />
              </div>
              <h3 className="text-xl font-bold text-white font-outfit">Bank Registry</h3>
           </div>
           
           <form onSubmit={handleAddBank} className="space-y-3 mb-8">
              <input 
                required placeholder="Bank Name (e.g. DBBL)" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-400"
                value={newBankName} onChange={e => setNewBankName(e.target.value)}
              />
              <div className="flex gap-2">
                <input 
                  placeholder="A/C Number (Optional)" 
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-400 font-mono"
                  value={newBankAccount} onChange={e => setNewBankAccount(e.target.value)}
                />
                <button type="submit" className="bg-amber-400 text-slate-900 px-5 rounded-xl hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/10 font-bold uppercase text-xs">
                  Add
                </button>
              </div>
           </form>

           <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {banks.length === 0 ? (
                <div className="text-center py-10 opacity-20">
                   <Building2 size={48} className="mx-auto mb-2" />
                   <p className="text-[10px] font-black uppercase">No Banks Registered</p>
                </div>
              ) : (
                banks.map(bank => (
                  <div key={bank.id} className="flex flex-col bg-slate-900/50 p-4 rounded-2xl border border-slate-700 relative group">
                     <span className="text-sm font-bold text-slate-200">{bank.name}</span>
                     {bank.accountNumber && (
                       <span className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                         <CreditCard size={10}/> {bank.accountNumber}
                       </span>
                     )}
                     <button onClick={() => deleteBank(bank.id)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                     </button>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* ==========================================
            ইন্টারনাল ট্রান্সফার সেকশন
        ========================================== */}
        <div className="lg:col-span-8 bg-slate-800 rounded-[2.5rem] border border-slate-700 p-8 shadow-2xl">
          <div className="flex items-center space-x-4 mb-8">
             <div className="p-3 bg-amber-400/10 rounded-2xl text-amber-400">
                <ArrowRightLeft size={24} />
             </div>
             <h3 className="text-xl font-bold text-white font-outfit">Internal Pipeline</h3>
          </div>
          
          <form onSubmit={handleTransfer} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 p-6 rounded-3xl border border-slate-700/50">
               
               {/* From Node Section */}
               <div className="space-y-3">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">From Node (উৎস)</label>
                   <select className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none" value={transferForm.from} onChange={e => setTransferForm({...transferForm, from: e.target.value as AccountId, fromBankId: ''})}>
                      <option value={AccountId.BANK}>Central Bank</option>
                      <option value={AccountId.MANAGER}>Manager Fund</option>
                      <option value={AccountId.PARTNER}>Partner Stakeholder</option>
                   </select>
                 </div>
                 {/* From Node Bank Dropdown */}
                 {transferForm.from === AccountId.BANK && (
                   <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                     <label className="text-[9px] font-black text-amber-400 uppercase tracking-widest ml-1 mb-1 block">Select Source Bank</label>
                     <select required className="w-full bg-slate-950 border border-amber-400/30 rounded-2xl px-5 py-3 text-white font-bold outline-none" value={transferForm.fromBankId} onChange={e => setTransferForm({...transferForm, fromBankId: e.target.value})}>
                        <option value="">-- Choose Bank --</option>
                        {banks.map(b => (
                          <option key={b.id} value={b.id}>{b.name} {b.accountNumber ? `(${b.accountNumber})` : ''}</option>
                        ))}
                     </select>
                   </MotionDiv>
                 )}
               </div>

               {/* To Node Section */}
               <div className="space-y-3">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">To Node (গন্তব্য)</label>
                   <select className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none" value={transferForm.to} onChange={e => setTransferForm({...transferForm, to: e.target.value as AccountId, toBankId: ''})}>
                      <option value={AccountId.BANK}>Central Bank</option>
                      <option value={AccountId.MANAGER}>Manager Fund</option>
                      <option value={AccountId.PARTNER}>Partner Stakeholder</option>
                   </select>
                 </div>
                 {/* To Node Bank Dropdown */}
                 {transferForm.to === AccountId.BANK && (
                   <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                     <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest ml-1 mb-1 block">Select Destination Bank</label>
                     <select required className="w-full bg-slate-950 border border-emerald-400/30 rounded-2xl px-5 py-3 text-white font-bold outline-none" value={transferForm.toBankId} onChange={e => setTransferForm({...transferForm, toBankId: e.target.value})}>
                        <option value="">-- Choose Bank --</option>
                        {banks.map(b => (
                          <option key={b.id} value={b.id}>{b.name} {b.accountNumber ? `(${b.accountNumber})` : ''}</option>
                        ))}
                     </select>
                   </MotionDiv>
                 )}
               </div>

            </div>

            {/* Partner Selection (If required) */}
            { (transferForm.from === AccountId.PARTNER || transferForm.to === AccountId.PARTNER) && (
              <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest ml-1">Attributed Partner (পার্টনারের নাম)</label>
                <select required className="w-full bg-slate-900 border border-amber-400/20 rounded-2xl px-5 py-4 text-white font-bold outline-none" value={transferForm.partnerId} onChange={e => setTransferForm({...transferForm, partnerId: e.target.value})}>
                   <option value="">-- Choose Partner --</option>
                   {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </MotionDiv>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Transfer Amount ($)</label>
                 <input required type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-black text-lg outline-none focus:border-amber-400" value={transferForm.amount} onChange={e => setTransferForm({...transferForm, amount: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
                 <input required type="date" className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-amber-400" value={transferForm.date} onChange={e => setTransferForm({...transferForm, date: e.target.value})} />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Internal Note / Memo</label>
               <input type="text" placeholder="Audit memo..." className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-amber-400" value={transferForm.note} onChange={e => setTransferForm({...transferForm, note: e.target.value})} />
            </div>

            <button type="submit" className="w-full bg-amber-400 text-slate-950 font-black py-5 rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-amber-400/20 hover:bg-amber-300 transition-all flex items-center justify-center gap-3 mt-4">
               <Check size={18} />
               <span>Execute Fund Movement</span>
            </button>
          </form>
        </div>
      </div>
    </MotionDiv>
  );
};