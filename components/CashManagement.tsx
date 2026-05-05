import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { 
  Building2, Wallet, Users, UserCheck, ArrowRightLeft, 
  Check, History, Landmark, Plus, Trash2, CreditCard, Send
} from 'lucide-react';
import { AccountId, InternalTransfer, Bank } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// Structural Fix for React 19 + Framer Motion Type Conflicts
const MotionDiv = motion.div as any;

export const CashManagement: React.FC = () => {
  const { accounts, transfers, transferCash, partners, banks, updateBanks, deleteBank, clients, projects, transferClientToClient } = useAppContext();
  
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccount, setNewBankAccount] = useState('');
  
  // 🔴 Updated State to hold two distinct partners
  const [transferForm, setTransferForm] = useState({
    from: AccountId.BANK,
    to: AccountId.PARTNER,
    fromBankId: '', 
    toBankId: '',   
    fromPartnerId: '', // 🔴 Source Partner
    toPartnerId: '',   // 🔴 Destination Partner
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [clientTransferForm, setClientTransferForm] = useState({
    senderId: '',
    receiverId: '',
    projectId: '',
    amount: '',
    note: ''
  });

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) return;
    
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

    // Validation
    if (transferForm.from === AccountId.BANK && !transferForm.fromBankId) return alert('Please select the Source Bank.');
    if (transferForm.to === AccountId.BANK && !transferForm.toBankId) return alert('Please select the Destination Bank.');
    if (transferForm.from === AccountId.PARTNER && !transferForm.fromPartnerId) return alert('Please select the Source Partner.');
    if (transferForm.to === AccountId.PARTNER && !transferForm.toPartnerId) return alert('Please select the Destination Partner.');
    
    if (transferForm.from === AccountId.PARTNER && transferForm.to === AccountId.PARTNER && transferForm.fromPartnerId === transferForm.toPartnerId) {
      return alert('Source and Destination partners cannot be the same person!');
    }

    const fromBank = banks.find(b => b.id === transferForm.fromBankId);
    const toBank = banks.find(b => b.id === transferForm.toBankId);

    let enhancedNote = transferForm.note || 'Internal Operational Transfer';
    if (transferForm.from === AccountId.BANK || transferForm.to === AccountId.BANK) {
      const fromStr = transferForm.from === AccountId.BANK ? (fromBank?.name || 'Bank') : transferForm.from;
      const toStr = transferForm.to === AccountId.BANK ? (toBank?.name || 'Bank') : transferForm.to;
      enhancedNote = `[${fromStr} ➡️ ${toStr}] ${transferForm.note}`;
    }

    // 🔴 Partner to Partner Split Logic
    if (transferForm.from === AccountId.PARTNER && transferForm.to === AccountId.PARTNER) {
        const fromPartner = partners.find(p => p.id === transferForm.fromPartnerId);
        const toPartner = partners.find(p => p.id === transferForm.toPartnerId);

        // Transaction 1: Debit Sender
        const tx1: InternalTransfer = {
          id: `tf_${Date.now()}_1`,
          date: transferForm.date,
          fromAccount: AccountId.PARTNER,
          toAccount: AccountId.MANAGER, // Bridged through Manager Fund
          amount,
          note: `[P2P] Transfer to ${toPartner?.name} ${transferForm.note ? `- ${transferForm.note}` : ''}`,
          partnerId: transferForm.fromPartnerId
        };

        // Transaction 2: Credit Receiver
        const tx2: InternalTransfer = {
          id: `tf_${Date.now()}_2`,
          date: transferForm.date,
          fromAccount: AccountId.MANAGER, // Bridged through Manager Fund
          toAccount: AccountId.PARTNER,
          amount,
          note: `[P2P] Received from ${fromPartner?.name} ${transferForm.note ? `- ${transferForm.note}` : ''}`,
          partnerId: transferForm.toPartnerId
        };

        await transferCash(tx1);
        await transferCash(tx2);
    } else {
        // Normal Single Transfer
        const activePartnerId = transferForm.from === AccountId.PARTNER ? transferForm.fromPartnerId : (transferForm.to === AccountId.PARTNER ? transferForm.toPartnerId : undefined);
        
        const newTransfer: InternalTransfer = {
          id: `tf_${Date.now()}`,
          date: transferForm.date,
          fromAccount: transferForm.from,
          toAccount: transferForm.to,
          fromBankId: transferForm.from === AccountId.BANK ? transferForm.fromBankId : undefined,
          toBankId: transferForm.to === AccountId.BANK ? transferForm.toBankId : undefined,
          amount,
          note: enhancedNote,
          partnerId: activePartnerId 
        };

        await transferCash(newTransfer);
    }
    
    setTransferForm({ 
      ...transferForm, 
      amount: '', 
      note: '', 
      fromBankId: '', 
      toBankId: '',
      fromPartnerId: '',
      toPartnerId: '' 
    });
  };

  const handleClientTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(clientTransferForm.amount);
    if (isNaN(amount) || amount <= 0) return alert('Invalid amount entered.');
    if (clientTransferForm.senderId === clientTransferForm.receiverId) return alert('Sender and Receiver cannot be the same person!');
    if (!clientTransferForm.projectId) return alert('Please select a relevant project.');

    await transferClientToClient(
      clientTransferForm.senderId,
      clientTransferForm.receiverId,
      amount,
      clientTransferForm.projectId,
      clientTransferForm.note
    );

    setClientTransferForm({ ...clientTransferForm, amount: '', note: '' });
    alert('Client to Client Transfer Successful! Ledger updated.');
  };

  return (
    <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-12">
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
               
               {/* 🔴 FROM NODE */}
               <div className="space-y-3">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">From Node (উৎস)</label>
                   <select className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none" value={transferForm.from} onChange={e => setTransferForm({...transferForm, from: e.target.value as AccountId, fromBankId: '', fromPartnerId: ''})}>
                      <option value={AccountId.BANK}>Central Bank</option>
                      <option value={AccountId.MANAGER}>Manager Fund</option>
                      <option value={AccountId.PARTNER}>Partner Stakeholder</option>
                   </select>
                 </div>
                 {transferForm.from === AccountId.BANK && (
                   <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                     <label className="text-[9px] font-black text-amber-400 uppercase tracking-widest ml-1 mb-1 block">Select Source Bank</label>
                     <select required className="w-full bg-slate-950 border border-amber-400/30 rounded-2xl px-5 py-3 text-white font-bold outline-none" value={transferForm.fromBankId} onChange={e => setTransferForm({...transferForm, fromBankId: e.target.value})}>
                        <option value="">-- Choose Bank --</option>
                        {banks.map(b => <option key={b.id} value={b.id}>{b.name} {b.accountNumber ? `(${b.accountNumber})` : ''}</option>)}
                     </select>
                   </MotionDiv>
                 )}
                 {transferForm.from === AccountId.PARTNER && (
                   <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                     <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest ml-1 mb-1 block">Select Source Partner</label>
                     <select required className="w-full bg-slate-950 border border-rose-500/30 rounded-2xl px-5 py-3 text-white font-bold outline-none" value={transferForm.fromPartnerId} onChange={e => setTransferForm({...transferForm, fromPartnerId: e.target.value})}>
                        <option value="">-- Choose Partner --</option>
                        {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                   </MotionDiv>
                 )}
               </div>

               {/* 🔴 TO NODE */}
               <div className="space-y-3">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">To Node (গন্তব্য)</label>
                   <select className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none" value={transferForm.to} onChange={e => setTransferForm({...transferForm, to: e.target.value as AccountId, toBankId: '', toPartnerId: ''})}>
                      <option value={AccountId.BANK}>Central Bank</option>
                      <option value={AccountId.MANAGER}>Manager Fund</option>
                      <option value={AccountId.PARTNER}>Partner Stakeholder</option>
                   </select>
                 </div>
                 {transferForm.to === AccountId.BANK && (
                   <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                     <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest ml-1 mb-1 block">Select Destination Bank</label>
                     <select required className="w-full bg-slate-950 border border-emerald-400/30 rounded-2xl px-5 py-3 text-white font-bold outline-none" value={transferForm.toBankId} onChange={e => setTransferForm({...transferForm, toBankId: e.target.value})}>
                        <option value="">-- Choose Bank --</option>
                        {banks.map(b => <option key={b.id} value={b.id}>{b.name} {b.accountNumber ? `(${b.accountNumber})` : ''}</option>)}
                     </select>
                   </MotionDiv>
                 )}
                 {transferForm.to === AccountId.PARTNER && (
                   <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                     <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest ml-1 mb-1 block">Select Destination Partner</label>
                     <select required className="w-full bg-slate-950 border border-emerald-500/30 rounded-2xl px-5 py-3 text-white font-bold outline-none" value={transferForm.toPartnerId} onChange={e => setTransferForm({...transferForm, toPartnerId: e.target.value})}>
                        <option value="">-- Choose Partner --</option>
                        {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                   </MotionDiv>
                 )}
               </div>
            </div>

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

      {/* ==========================================
          🔴 Client to Client Transfer Section
      ========================================== */}
      <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 p-8 shadow-2xl mt-8">
        <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-outfit">Client to Client Adjustment (P2P)</h3>
              <p className="text-xs text-slate-500 mt-1">Settle dues between clients without affecting company treasury.</p>
            </div>
        </div>

        <form onSubmit={handleClientTransfer} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 p-6 rounded-3xl border border-slate-700/50">
             
             {/* Sender Client */}
             <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Sender Client (কার ব্যালেন্স থেকে কাটবে?)</label>
                <select required className="w-full bg-slate-950 border border-rose-500/30 rounded-2xl px-5 py-4 text-white font-bold outline-none" value={clientTransferForm.senderId} onChange={e => setClientTransferForm({...clientTransferForm, senderId: e.target.value})}>
                   <option value="">-- Select Sender --</option>
                   {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>

             {/* Receiver Client */}
             <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Receiver Client (কার ব্যালেন্সে যোগ হবে?)</label>
                <select required className="w-full bg-slate-950 border border-emerald-500/30 rounded-2xl px-5 py-4 text-white font-bold outline-none" value={clientTransferForm.receiverId} onChange={e => setClientTransferForm({...clientTransferForm, receiverId: e.target.value})}>
                   <option value="">-- Select Receiver --</option>
                   {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount ($)</label>
               <input required type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-black text-lg outline-none focus:border-emerald-400" value={clientTransferForm.amount} onChange={e => setClientTransferForm({...clientTransferForm, amount: e.target.value})} />
             </div>
             
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Context Project</label>
                <select required className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-emerald-400" value={clientTransferForm.projectId} onChange={e => setClientTransferForm({...clientTransferForm, projectId: e.target.value})}>
                   <option value="">-- Select Project Context --</option>
                   {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Adjustment Note</label>
             <input type="text" placeholder="e.g. Settling payment for materials..." className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-emerald-400" value={clientTransferForm.note} onChange={e => setClientTransferForm({...clientTransferForm, note: e.target.value})} />
          </div>

          <button type="submit" className="w-full bg-emerald-500 text-slate-950 font-black py-5 rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 mt-4">
             <Send size={18} />
             <span>Execute P2P Transfer</span>
          </button>
        </form>
      </div>
    </MotionDiv>
  );
};