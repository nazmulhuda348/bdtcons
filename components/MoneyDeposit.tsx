import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Send, CheckCircle2, Loader2, Receipt, User, Phone, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

// আপনার ব্যাকএন্ড URL (Render)
const BACKEND_URL = (import.meta as any).env?.VITE_MARKETING_BACKEND_URL || 'https://whatsapp-0954.onrender.com';

export const MoneyDeposit: React.FC = () => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [amount, setAmount] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // এই রেফারেন্সটি রিসিটের ডিজাইনকে সিলেক্ট করবে
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !amount) return alert('অনুগ্রহ করে সব তথ্য পূরণ করুন');
    
    setIsProcessing(true);
    setSuccessMsg('');

    try {
      // ১. ডাটাবেসে সেভ করার লজিক (আপনার ডাটাবেস অনুযায়ী এখানে কোড বসাবেন)
      // await saveToSupabaseOrFirebase({ clientName, clientPhone, amount });
      
      const transactionId = "TRX-" + Math.floor(100000 + Math.random() * 900000); // একটি ডামি ট্রানজেকশন আইডি
      const date = new Date().toLocaleDateString('en-GB');

      // ২. রিসিট PDF তৈরি করা (html2canvas & jsPDF)
      const receiptElement = receiptRef.current;
      if (!receiptElement) throw new Error("Receipt element not found");

      // রিসিটের ছবি তোলা
      const canvas = await html2canvas(receiptElement, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a5'); // A5 সাইজের পিডিএফ (রিসিটের জন্য ভালো)
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBase64 = pdf.output('datauristring'); // Base64 ডাটা

      // ৩. WhatsApp-এ পাঠানো
      const message = `সম্মানিত ${clientName},\n\nআপনার ${amount} টাকা সফলভাবে জমা হয়েছে। আপনার ডিজিটাল মানি রিসিটটি এই মেসেজের সাথে সংযুক্ত করা হলো।\n\nট্রানজেকশন আইডি: ${transactionId}\n\n------------------------\n🟢 *Building Developments & Technologies*\n_Smart Software. Smart Business. Smart Growth._`;

      const response = await fetch(`${BACKEND_URL}/api/marketing/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [clientPhone],
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

      setSuccessMsg('সফল! টাকা জমা হয়েছে এবং WhatsApp-এ PDF রিসিট পাঠানো হয়েছে।');
      
      // ফর্ম ক্লিয়ার করা
      setClientName('');
      setClientPhone('');
      setAmount('');

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
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-emerald-500/10 rounded-xl"><DollarSign className="text-emerald-400" size={24} /></div>
          <h2 className="text-2xl font-bold text-white font-outfit">Deposit Money</h2>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-emerald-400">
            <CheckCircle2 size={20} />
            <p className="text-sm font-bold">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleDeposit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} required placeholder="Enter client name" className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} required placeholder="e.g. 017XXXXXXXX" className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deposit Amount (BDT)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">৳</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>

          <button type="submit" disabled={isProcessing} className={`w-full py-4 mt-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center space-x-3 shadow-xl ${isProcessing ? 'bg-slate-700 text-slate-500' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'}`}>
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            <span>{isProcessing ? 'Processing & Sending PDF...' : 'Save & Send WhatsApp Receipt'}</span>
          </button>
        </form>
      </motion.div>

      {/* ডান পাশ: মানি রিসিট প্রিভিউ (যাকে আমরা PDF বানাবো) */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
        <div className="mb-4 flex items-center space-x-2 text-slate-400">
          <Receipt size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Live Receipt Preview</span>
        </div>
        
        {/* ============================================== */}
        {/* এই div টাই মূলত PDF হয়ে ক্লায়েন্টের কাছে যাবে */}
        {/* ============================================== */}
        <div 
          ref={receiptRef} 
          className="bg-white p-10 rounded-xl shadow-2xl relative overflow-hidden text-slate-900"
          style={{ width: '400px', minHeight: '500px' }} // ফিক্সড সাইজ যাতে PDF ঠিকমতো আসে
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
          <div className="mb-8 relative z-10">
            <h3 className="text-xl font-black text-center mb-6 uppercase tracking-widest border border-slate-300 py-2 rounded-lg bg-slate-50">Money Receipt</h3>
            <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold">{new Date().toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
                <span className="text-slate-500">Client Name:</span>
                <span className="font-bold text-lg">{clientName || '_______________'}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
                <span className="text-slate-500">Phone Number:</span>
                <span className="font-bold">{clientPhone || '_______________'}</span>
              </div>
            </div>
          </div>

          {/* Amount Area */}
          <div className="bg-emerald-50 rounded-xl p-6 text-center border border-emerald-100 relative z-10">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Amount Received</p>
            <h2 className="text-4xl font-black text-slate-900">৳ {amount || '0.00'}</h2>
          </div>

          {/* Signature */}
          <div className="mt-16 flex justify-between items-end relative z-10">
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
      </motion.div>

    </div>
  );
};