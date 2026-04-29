import React, { useState, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Send, CheckCircle2, Loader2, Receipt, User, Phone, DollarSign, Calendar, Building2, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../AppContext';

// Structural Fix for React 19 + Framer Motion Type Conflicts
const MotionDiv = motion.div as any;

// আপনার ব্যাকএন্ড URL (Render)
const BACKEND_URL = (import.meta as any).env?.VITE_MARKETING_BACKEND_URL || 'https://whatsapp-0954.onrender.com';

export const MoneyDeposit: React.FC = () => {
  // AppContext থেকে প্রজেক্ট, ক্লায়েন্ট, ট্রানজেকশন, ব্যাংক এবং addTransaction নিয়ে আসা হচ্ছে
  const { projects, clients, transactions, banks, addTransaction } = useAppContext();
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBankId, setSelectedBankId] = useState(''); // 🔴 নতুন ব্যাংক স্টেট
  const [amount, setAmount] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // এই রেফারেন্সটি রিসিটের ডিজাইনকে সিলেক্ট করবে
  const receiptRef = useRef<HTMLDivElement>(null);

  // ১. সিলেক্ট করা প্রজেক্টের ডাটা বের করা
  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // ২. সিলেক্ট করা ক্লায়েন্টের সম্পূর্ণ ডাটা বের করা
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // সিলেক্ট করা ব্যাংকের ডাটা (রিসিটে দেখানোর জন্য)
  const selectedBank = useMemo(() => {
    return banks?.find(b => b.id === selectedBankId) || null;
  }, [banks, selectedBankId]);

  // ৩. নির্দিষ্ট প্রজেক্টে নির্দিষ্ট ক্লায়েন্টের আগের সর্বমোট জমার হিসাব বের করা
  const previousTotal = useMemo(() => {
    if (!selectedClientId || !selectedProjectId) return 0;
    return transactions
      .filter(t => t.clientId === selectedClientId && t.projectId === selectedProjectId && t.type === 'deposit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, selectedClientId, selectedProjectId]);

  // ৪. রিয়েল-টাইম টোটাল ক্যালকুলেশন
  const newDepositAmount = Number(amount) || 0;
  const grandTotal = previousTotal + newDepositAmount;

  // তারিখ ফরম্যাট করার ফাংশন
  const formattedDate = new Date(depositDate).toLocaleDateString('en-GB');

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      return alert('অনুগ্রহ করে প্রথমে প্রজেক্ট সিলেক্ট করুন!');
    }
    if (!selectedClient || !amount) {
      return alert('অনুগ্রহ করে ক্লায়েন্ট সিলেক্ট করুন এবং টাকার পরিমাণ দিন!');
    }
    if (!selectedBankId) {
      return alert('অনুগ্রহ করে ব্যাংক সিলেক্ট করুন!');
    }
    if (!selectedClient.phone) {
      return alert('এই ক্লায়েন্টের কোনো হোয়াটসঅ্যাপ নম্বর সেভ করা নেই। দয়া করে Admin Panel থেকে নম্বর আপডেট করুন।');
    }
    
    setIsProcessing(true);
    setSuccessMsg('');

    try {
      // ১. ডাটাবেস/Ledger-এ ট্রানজেকশন সেভ করা
      await addTransaction({
        id: `t_${Date.now()}`,
        projectId: selectedProject.id, 
        date: depositDate,
        description: `Deposit from ${selectedClient.name}`,
        amount: newDepositAmount,
        categoryId: 'cat1', // Deposit ক্যাটাগরির আইডি (আপনার constants.tsx অনুযায়ী)
        accountId: 'BANK' as any,
        bankId: selectedBankId, // 🔴 ট্রানজেকশনে ব্যাংক আইডি সেভ করা হলো
        clientId: selectedClient.id,
        type: 'deposit',
        auditUser: 'System',
        createdByUserId: 'system'
      } as any);

      // ২. পিডিএফ রিসিটের জন্য ট্রানজেকশন আইডি
      const transactionId = "TRX-" + Math.floor(100000 + Math.random() * 900000);

      // ৩. PDF রিসিট তৈরি করা (html2canvas & jsPDF)
      const receiptElement = receiptRef.current;
      if (!receiptElement) throw new Error("Receipt element not found");

      const canvas = await html2canvas(receiptElement, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a5'); // A5 সাইজের পিডিএফ
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBase64 = pdf.output('datauristring'); // Base64 ডাটা

      // ৪. WhatsApp-এ মেসেজ পাঠানো
      const bankDetails = selectedBank ? `${selectedBank.name} ${selectedBank.accountNumber ? `(A/C: ${selectedBank.accountNumber})` : ''}` : 'Cash/Bank';
      const message = `সম্মানিত ${selectedClient.name},\n\n*${selectedProject.name}* প্রজেক্টের জন্য আপনার নতুন জমা: ${newDepositAmount.toLocaleString()} টাকা সফলভাবে গ্রহণ করা হয়েছে (তারিখ: ${formattedDate})।\nজমাকৃত ব্যাংক: ${bankDetails}\n\nএই প্রজেক্টে আপনার এ পর্যন্ত সর্বমোট জমা: ${grandTotal.toLocaleString()} টাকা।\n\nআপনার ডিজিটাল মানি রিসিটটি এই মেসেজের সাথে সংযুক্ত করা হলো।\n\nট্রানজেকশন আইডি: ${transactionId}\n\n------------------------\n🟢 *Building Developments & Technologies*\n_Smart Software. Smart Business. Smart Growth._`;

      const response = await fetch(`${BACKEND_URL}/api/marketing/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [selectedClient.phone],
          message: message,
          mediaList: [
            {
              data: pdfBase64,
              mimetype: 'application/pdf',
              filename: `Money_Receipt_${transactionId}.pdf`
            }
          ]
        })
      });

      if (!response.ok) throw new Error('WhatsApp message failed to send');

      setSuccessMsg('সফল! টাকা Ledger-এ সেভ হয়েছে এবং WhatsApp-এ রিসিট পাঠানো হয়েছে।');
      
      // ৫. ফর্ম ক্লিয়ার করা
      setSelectedClientId('');
      setAmount('');
      setSelectedBankId('');
      setDepositDate(new Date().toISOString().split('T')[0]);

    } catch (error) {
      console.error(error);
      alert('কোথাও একটি সমস্যা হয়েছে: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 max-w-6xl mx-auto">
      
      {/* বাম পাশ: টাকা জমা দেওয়ার ফর্ম */}
      <MotionDiv initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-emerald-500/10 rounded-xl"><DollarSign className="text-emerald-400" size={24} /></div>
          <h2 className="text-2xl font-bold text-white font-outfit">Deposit & Receipt</h2>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-emerald-400">
            <CheckCircle2 size={20} />
            <p className="text-sm font-bold">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleDeposit} className="space-y-5">
          {/* প্রজেক্ট সিলেক্ট করার অপশন */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Project</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <select 
                value={selectedProjectId} 
                onChange={e => {
                  setSelectedProjectId(e.target.value);
                  setSelectedClientId(''); // প্রজেক্ট চেঞ্জ করলে ক্লায়েন্ট রিসেট হবে
                }} 
                required 
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>-- প্রজেক্ট নির্বাচন করুন --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* তারিখ সিলেক্ট করার অপশন */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deposit Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="date" 
                value={depositDate} 
                onChange={e => setDepositDate(e.target.value)} 
                required 
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* ক্লায়েন্ট ড্রপডাউন */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Client</label>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">From Registry</span>
            </div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <select 
                value={selectedClientId} 
                onChange={e => setSelectedClientId(e.target.value)} 
                required 
                disabled={!selectedProjectId} // প্রজেক্ট সিলেক্ট না করলে ক্লায়েন্ট সিলেক্ট করা যাবে না
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none disabled:opacity-50 cursor-pointer"
              >
                <option value="" disabled>-- ক্লায়েন্ট নির্বাচন করুন --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* অটোমেটিক হোয়াটসঅ্যাপ নম্বর */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Number (Auto-filled)</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                value={selectedClient?.phone || ''} 
                readOnly 
                placeholder="ক্লায়েন্ট সিলেক্ট করলে নম্বর আসবে" 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-400 text-sm outline-none cursor-not-allowed" 
              />
            </div>
          </div>

          {/* 🔴 ব্যাংক সিলেক্ট করার অপশন (নতুন যুক্ত করা হয়েছে) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Bank (কোথায় জমা হয়েছে?)</label>
            <div className="relative">
              <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
              <select 
                value={selectedBankId} 
                onChange={e => setSelectedBankId(e.target.value)} 
                required 
                className="w-full bg-slate-900 border border-amber-500/30 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm focus:ring-2 focus:ring-amber-400 outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>-- ব্যাংক নির্বাচন করুন --</option>
                {banks?.map(b => (
                  <option key={b.id} value={b.id}>{b.name} {b.accountNumber ? `(${b.accountNumber})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* জমার পরিমাণ */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Deposit Amount (BDT)</label>
               {/* রিয়েল টাইম আগের জমার হিসাব */}
               {selectedClient && selectedProject && (
                 <span className="text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                    Project Total: <span className="text-emerald-400">৳ {previousTotal.toLocaleString()}</span>
                 </span>
               )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">৳</span>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                required 
                placeholder="0.00" 
                disabled={!selectedClientId}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white text-lg font-bold font-outfit focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50" 
              />
            </div>
          </div>

          <button type="submit" disabled={isProcessing || !selectedClientId || !selectedProjectId || !selectedBankId} className={`w-full py-4 mt-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center space-x-3 shadow-xl ${isProcessing || !selectedClientId || !selectedProjectId || !selectedBankId ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'}`}>
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            <span>{isProcessing ? 'Processing & Sending PDF...' : 'Generate Receipt & Send WhatsApp'}</span>
          </button>
        </form>
      </MotionDiv>

      {/* ডান পাশ: মানি রিসিট প্রিভিউ (যাকে আমরা PDF বানাবো) */}
      <MotionDiv initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center lg:items-start">
        <div className="mb-4 flex items-center space-x-2 text-slate-400">
          <Receipt size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Live Receipt Preview</span>
        </div>
        
        {/* ============================================== */}
        {/* এই div টাই মূলত PDF হয়ে ক্লায়েন্টের কাছে যাবে */}
        {/* ============================================== */}
        <div 
          ref={receiptRef} 
          className="bg-white p-10 rounded-xl shadow-2xl relative overflow-hidden text-slate-900 w-full"
          style={{ maxWidth: '400px', minHeight: '520px' }}
        >
          {/* Watermark */}
          <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
             <span className="text-6xl font-black rotate-45 uppercase">BDT Enterprise</span>
          </div>

          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-slate-200 pb-6 relative z-10">
            <h1 className="text-2xl font-black text-emerald-600 uppercase tracking-wider mb-1">Building Developments</h1>
            <h2 className="text-lg font-bold text-slate-700 uppercase tracking-widest">& Technologies</h2>
            <p className="text-[10px] font-bold text-slate-500 mt-2">Smart Software. Smart Business. Smart Growth.</p>
          </div>

          {/* Receipt Info */}
          <div className="mb-6 relative z-10">
            <h3 className="text-xl font-black text-center mb-6 uppercase tracking-widest border border-slate-300 py-2 rounded-lg bg-slate-50">Money Receipt</h3>
            <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold">{formattedDate}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
                <span className="text-slate-500">Project Name:</span>
                <span className="font-bold text-emerald-700">{selectedProject?.name || '_______________'}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
                <span className="text-slate-500">Client Name:</span>
                <span className="font-bold text-lg">{selectedClient?.name || '_______________'}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
                <span className="text-slate-500">Phone Number:</span>
                <span className="font-bold">{selectedClient?.phone || '_______________'}</span>
              </div>
              {/* 🔴 রিসিটে ব্যাংকের তথ্য যোগ করা হলো */}
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
                <span className="text-slate-500">Deposited To:</span>
                <span className="font-bold text-amber-600">
                  {selectedBank ? `${selectedBank.name} ${selectedBank.accountNumber ? `(${selectedBank.accountNumber})` : ''}` : '_______________'}
                </span>
              </div>
            </div>
          </div>

          {/* Amount Area */}
          <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 relative z-10 space-y-3">
            <div className="flex justify-between text-xs text-emerald-700 font-bold border-b border-emerald-200 pb-2">
               <span className="uppercase tracking-wider">Previous Deposit:</span>
               <span>৳ {previousTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-700 font-bold border-b border-emerald-200 pb-2">
               <span className="uppercase tracking-wider">New Deposit:</span>
               <span>৳ {newDepositAmount.toLocaleString()}</span>
            </div>
            <div className="text-center pt-2">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Grand Total Received</p>
              <h2 className="text-3xl font-black text-slate-900">৳ {grandTotal.toLocaleString()}</h2>
            </div>
          </div>

          {/* Signature */}
          <div className="mt-12 flex justify-between items-end relative z-10">
             <div className="text-center">
                <div className="w-32 border-t-2 border-slate-800 mb-2"></div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Client Signature</p>
             </div>
             <div className="text-center">
                <div className="w-32 border-t-2 border-slate-800 mb-2"></div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Authorized By</p>
             </div>
          </div>
        </div>
        {/* ============================================== */}
      </MotionDiv>

    </div>
  );
};