import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { 
  Send, Users, Image as ImageIcon, QrCode, CheckCircle2, 
  Loader2, Trash2, Smartphone, RefreshCw, Clock, Wifi, WifiOff, LogOut, Plus, ShieldCheck, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = (import.meta as any).env?.VITE_MARKETING_BACKEND_URL || 'https://whatsapp-0954.onrender.com';

export const MarketingAutomation: React.FC = () => {
  const { leads } = useAppContext();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // নতুন: Category State
  const [message, setMessage] = useState('');
  
  // Multiple Files State
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ১. ইউনিক ক্যাটাগরিগুলো বের করা
  const categories = useMemo(() => {
    const cats = new Set((leads || []).map(l => l.category || 'General'));
    return ['all', ...Array.from(cats)];
  }, [leads]);

  // ২. ক্যাটাগরি অনুযায়ী লিড ফিল্টার করা
  const filteredLeadsList = useMemo(() => {
    return (leads || []).filter(l => {
      const hasPhone = l.phone && l.phone.trim().length >= 8;
      const catMatch = selectedCategory === 'all' || (l.category || 'General') === selectedCategory;
      return hasPhone && catMatch;
    });
  }, [leads, selectedCategory]);

  const updateQrState = (qr: string) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
    setQrCode(qrUrl);
    setIsConnecting(false);
    setIsDisconnecting(false);
  };

  // ফিক্স ১: সকেট কানেকশন আপডেট ও রিয়েল-টাইম স্ট্যাটাস
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'] // Render সার্ভারের জন্য এটি জরুরি
    });
    socketRef.current = socket;

    socket.on('connect', () => { setBackendOnline(true); fetchStatus(); });
    socket.on('disconnect', () => { setBackendOnline(false); setIsConnected(false); });
    socket.on('qr', (qr: string) => updateQrState(qr));
    
    socket.on('ready', () => {
      setIsConnected(true); setQrCode(null); setIsConnecting(false); setIsDisconnecting(false);
    });

    socket.on('disconnected', () => {
      setIsConnected(false); setQrCode(null); setIsConnecting(false); setIsDisconnecting(false);
    });

    // প্রতি ২০ সেকেন্ড পর পর সার্ভার হেলথ চেক করবে
    fetchStatus();
    const interval = setInterval(fetchStatus, 20000);

    return () => { 
      socket.disconnect(); 
      clearInterval(interval);
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/status`);
      if (res.ok) {
        setBackendOnline(true);
        const data = await res.json();
        if (data.status === 'CONNECTED') {
          setIsConnected(true); setIsConnecting(false); setQrCode(null);
        } else if (data.status === 'QR_READY' && data.qr) {
          updateQrState(data.qr);
        } else {
          setIsConnected(false); setIsConnecting(false); setQrCode(null);
        }
      } else {
        setBackendOnline(false);
      }
    } catch (e) { setBackendOnline(false); }
  };

  const toggleLead = (id: string) => setSelectedLeads(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  
  const toggleAll = () => {
    if (selectedLeads.length === filteredLeadsList.length && filteredLeadsList.length > 0) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeadsList.map(l => l.id));
    }
  };

  // ফিক্স ২: মাল্টিপল ফাইল আপলোড লজিক আপডেট
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setMediaFiles(prev => [...prev, ...filesArray]);
      
      const previewsArray = filesArray.map((file: File) => URL.createObjectURL(file));
      setMediaPreviews(prev => [...prev, ...previewsArray]);

      // ইনপুট ক্লিয়ার করা, যাতে একই ফাইল বা নতুন ফাইল আবার আপলোড করা যায়
      e.target.value = '';
    }
  };

  const removeFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

 const triggerConnection = async () => {
    if (!backendOnline) return alert("Backend Node Offline.");
    setIsConnecting(true); 
    setQrCode(null);
    
    try {
      await fetch(`${BACKEND_URL}/api/marketing/connect`, { method: 'POST' });
      
      setTimeout(() => {
        if (!qrCode && !isConnected) {
            setIsConnecting(false);
            fetchStatus();
        }
      }, 10000);

    } catch (err) { 
      setIsConnecting(false); 
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Disconnect WhatsApp session?")) return;
    setIsDisconnecting(true);
    try {
      await fetch(`${BACKEND_URL}/api/marketing/disconnect`, { method: 'POST' });
      setIsConnected(false); setQrCode(null);
    } catch (err) {} finally { setIsDisconnecting(false); fetchStatus(); }
  };

  const launchCampaign = async () => {
    if (!isConnected) return alert("Link WhatsApp first.");
    if (selectedLeads.length === 0) return alert("Select leads.");
    
    setIsSending(true);
    setSendingProgress(0);

    const targetPhones = filteredLeadsList.filter(l => selectedLeads.includes(l.id)).map(l => l.phone);

    let finalMessage = message.trim();
    if (finalMessage || mediaFiles.length > 0) {
      const signature = `\n\n------------------------\n🟢 *Building Developments & Technologies*\n_Smart Real Estate. Smart Software. Smart Technologies._`;
      finalMessage = finalMessage ? finalMessage + signature : signature.trim();
    }

    const mediaList = await Promise.all(mediaFiles.map(async (file) => {
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      return {
        data: base64Data,
        mimetype: file.type,
        filename: file.name
      };
    }));

    try {
      const response = await fetch(`${BACKEND_URL}/api/marketing/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: targetPhones,
          message: finalMessage, 
          mediaList 
        })
      });

      if (!response.ok) throw new Error('Campaign failed to start');

      const totalEstimatedSeconds = selectedLeads.length * 6;
      let elapsed = 0;
      const progressTimer = setInterval(() => {
        elapsed += 1;
        setSendingProgress(Math.min((elapsed / totalEstimatedSeconds) * 100, 99));
        if (elapsed >= totalEstimatedSeconds) {
          clearInterval(progressTimer); setSendingProgress(100);
          setTimeout(() => { setIsSending(false); setSendingProgress(0); }, 1500);
        }
      }, 1000);

    } catch (err) {
      alert("Error: " + (err as Error).message);
      setIsSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-outfit text-white tracking-tight">Marketing Automation</h2>
          <div className="flex items-center gap-3 mt-1">
             <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-tighter ${backendOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {backendOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
              {backendOnline ? 'Node Online' : 'Node Offline'}
            </div>
          </div>
        </div>
        
        {!isConnected ? (
          <button onClick={triggerConnection} disabled={isConnecting || isDisconnecting || !backendOnline} className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${isConnecting || !backendOnline ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'}`}>
            {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
            <span>{isConnecting ? 'Generating QR...' : 'Link WhatsApp'}</span>
          </button>
        ) : (
          <div className="flex items-center space-x-3">
             <button onClick={fetchStatus} className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white"><RefreshCw size={16} /></button>
             <button onClick={handleLogout} className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 px-6 py-4 rounded-2xl text-red-400 hover:bg-red-500/20 text-[10px] font-black uppercase"><LogOut size={14} /><span>Disconnect</span></button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COMPOSER */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence mode="wait">
            {qrCode ? (
              <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-2xl">
                 <img src={qrCode} alt="WhatsApp QR" className="w-64 h-64 mb-4" />
                 <h4 className="text-slate-950 font-black uppercase">Scan QR Code</h4>
                 <button onClick={() => setQrCode(null)} className="mt-4 text-slate-400 hover:text-slate-900 text-xs font-bold">Close</button>
              </motion.div>
            ) : (
              <motion.div key="composer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-800 rounded-[2.5rem] border border-slate-700 p-8 shadow-2xl space-y-8">
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message Body (Caption)</label>
                  <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your main message here..." className="w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white text-sm focus:ring-4 focus:ring-amber-400/10 outline-none resize-none" />
                  
                  <div className="flex items-start space-x-2 mt-2 px-2">
                    <ShieldCheck size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-slate-400 leading-tight">
                      A professional signature <span className="text-emerald-400 font-bold">(Building Developments & Technologies)</span> will be added automatically to the end of your message.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Media Attachments ({mediaFiles.length})</label>
                     <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-amber-400 flex items-center gap-1 hover:text-amber-300"><Plus size={12}/> Add More</button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                     {mediaPreviews.map((preview, index) => (
                       <div key={index} className="aspect-square bg-slate-900 rounded-2xl relative overflow-hidden group border border-slate-700">
                          {mediaFiles[index]?.type.startsWith('video/') ? (
                             <video src={preview} className="w-full h-full object-cover" />
                          ) : (
                             <img src={preview} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                             <button onClick={(e) => removeFile(index, e)} className="bg-red-500 p-2 rounded-xl text-white hover:scale-110"><Trash2 size={16} /></button>
                          </div>
                       </div>
                     ))}
                     
                     <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition-all">
                        <ImageIcon className="text-slate-600 mb-1" size={24} />
                        <span className="text-[8px] text-slate-500 font-bold uppercase">Upload</span>
                     </div>
                  </div>
                  
                  <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                </div>

                <button onClick={launchCampaign} disabled={isSending || !isConnected || selectedLeads.length === 0 || (!message.trim() && mediaFiles.length === 0)} className={`w-full py-5 rounded-3xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center space-x-4 ${isSending || !isConnected || selectedLeads.length === 0 || (!message.trim() && mediaFiles.length === 0) ? 'bg-slate-700 text-slate-500' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'}`}>
                  {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  <span>{isSending ? `Sending... ${Math.round(sendingProgress)}%` : `Launch to ${selectedLeads.length} Leads`}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RECIPIENTS */}
        <div className="lg:col-span-7">
          <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[750px]">
            <div className="p-8 border-b border-slate-700 bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white font-outfit">Recipients</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{filteredLeadsList.length} Contacts</p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* ഫিক্স ৩: Category Filter Dropdown */}
                <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
                  <div className="px-2 py-1 bg-slate-800 rounded-lg">
                    <Filter size={12} className="text-amber-400" />
                  </div>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedLeads([]); 
                    }}
                    className="bg-transparent text-white text-[10px] font-bold uppercase tracking-wider outline-none border-none pr-2 cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-slate-800 text-white">
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                <button onClick={toggleAll} className="bg-slate-900 border border-slate-800 px-6 py-3 rounded-xl text-[10px] font-black text-slate-300 uppercase hover:text-white transition-all">
                  {selectedLeads.length === filteredLeadsList.length && filteredLeadsList.length > 0 ? 'Clear' : 'Select All'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
               <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-800 border-b border-slate-700">
                     <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <th className="px-8 py-4 w-12 text-center">Sel</th>
                        <th className="px-8 py-4">Name</th>
                        <th className="px-8 py-4">Category</th>
                        <th className="px-8 py-4">Phone</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                     {filteredLeadsList.length > 0 ? filteredLeadsList.map((lead) => (
                        <tr key={lead.id} onClick={() => toggleLead(lead.id)} className={`cursor-pointer transition-colors group ${selectedLeads.includes(lead.id) ? 'bg-amber-400/5' : 'hover:bg-slate-700/20'}`}>
                           <td className="px-8 py-6 text-center">
                              <div className={`mx-auto w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedLeads.includes(lead.id) ? 'bg-amber-400 border-amber-400 text-slate-950' : 'border-slate-700'}`}>
                                 {selectedLeads.includes(lead.id) && <CheckCircle2 size={14} />}
                              </div>
                           </td>
                           <td className="px-8 py-6 text-sm font-bold text-slate-300">{lead.name}</td>
                           <td className="px-8 py-6">
                              <span className="text-[9px] font-bold px-2 py-1 bg-slate-700 rounded text-amber-400 uppercase tracking-wider">{lead.category || 'General'}</span>
                           </td>
                           <td className="px-8 py-6 text-xs text-slate-500">{lead.phone}</td>
                        </tr>
                     )) : (
                        <tr>
                          <td colSpan={4} className="text-center py-10 text-slate-500">No leads available in this category.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};