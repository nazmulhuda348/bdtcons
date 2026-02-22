import React, { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  Mail, 
  Phone, 
  Calendar,
  History,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRightCircle,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { Partner, InternalTransfer, AccountId } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermissions } from '../hooks/usePermissions';

export const PartnerManagement: React.FC = () => {
  const { partners, updatePartners, deletePartner, transfers, partnerBalances } = useAppContext();
  const { isAdmin } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredPartners = useMemo(() => {
    return partners.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [partners, searchTerm]);

  const partnerTransfers = useMemo(() => {
    if (!selectedPartnerId) return [];
    return transfers.filter(t => t.partnerId === selectedPartnerId);
  }, [transfers, selectedPartnerId]);

  const selectedPartner = useMemo(() => 
    partners.find(p => p.id === selectedPartnerId), 
    [partners, selectedPartnerId]
  );

  const handleDelete = async (id: string) => {
    try {
      await deletePartner(id);
      if (selectedPartnerId === id) setSelectedPartnerId(null);
      setConfirmDeleteId(null);
    } catch (err) {
      alert("Failed to delete partner. Check network connectivity.");
    }
  };

  const scrollToDetail = () => {
    if (window.innerWidth < 1024) {
      document.getElementById('partner-detail-view')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 md:space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-outfit text-white tracking-tight">Partner Ecosystem</h2>
          <p className="text-sm text-slate-500">Individual Stakeholder Management</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-yellow-500 text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all shadow-lg"
        >
          <Plus size={20} />
          <span>New Partner</span>
        </motion.button>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 md:gap-8">
        {/* PARTNER DIRECTORY LIST */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          <div className="bg-slate-900/50 p-1 border border-slate-800 rounded-2xl flex relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input 
              type="text" 
              placeholder="Filter stakeholders..."
              className="w-full bg-transparent py-3 pl-12 pr-4 text-xs text-white outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:overflow-y-auto lg:max-h-[60vh] pr-1 custom-scrollbar">
            {filteredPartners.length === 0 ? (
              <div className="col-span-full text-center py-10 text-slate-600 italic text-sm">No stakeholders found</div>
            ) : (
              filteredPartners.map((partner) => (
                <motion.div 
                  key={partner.id}
                  onClick={() => { setSelectedPartnerId(partner.id); scrollToDetail(); }}
                  whileHover={{ x: 4 }}
                  className={`p-5 rounded-2xl md:rounded-[1.8rem] border cursor-pointer transition-all relative overflow-hidden group ${selectedPartnerId === partner.id ? 'bg-slate-800 border-yellow-500 shadow-xl' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${selectedPartnerId === partner.id ? 'bg-yellow-500 text-slate-900' : 'bg-slate-800 text-yellow-500'}`}>
                      {partner.name.charAt(0)}
                    </div>
                    <div className="flex items-center space-x-2">
                       <button 
                         onClick={(e) => { e.stopPropagation(); setEditingPartner(partner); }} 
                         className="p-2 text-slate-500 hover:text-white transition-colors"
                       >
                         <Edit2 size={14} />
                       </button>
                       
                       {isAdmin && (
                         <>
                           {confirmDeleteId === partner.id ? (
                             <div className="flex items-center space-x-1 animate-in zoom-in duration-200">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleDelete(partner.id); }} 
                                 className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded uppercase"
                               >
                                 Yes
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} 
                                 className="bg-slate-700 text-slate-300 text-[8px] font-black px-2 py-1 rounded uppercase"
                               >
                                 No
                               </button>
                             </div>
                           ) : (
                             <button 
                               onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(partner.id); }} 
                               className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                             >
                               <Trash2 size={14} />
                             </button>
                           )}
                         </>
                       )}
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <h4 className="text-white font-bold tracking-tight truncate">{partner.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium truncate mb-4">{partner.email || 'No contact email'}</p>
                    
                    <div className="flex items-end justify-between border-t border-slate-700/50 pt-3">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em]">Liquid Fund</span>
                          <span className="text-lg font-black text-yellow-500 font-outfit tracking-tighter">
                            ${(partnerBalances[partner.id] || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                          </span>
                       </div>
                       <ChevronRight size={18} className={`${selectedPartnerId === partner.id ? 'text-yellow-500' : 'text-slate-700'}`} />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* PARTNER DETAIL VIEW (STATEMENT) */}
        <div id="partner-detail-view" className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedPartner ? (
              <motion.div 
                key={selectedPartner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-700 relative overflow-hidden group shadow-2xl">
                     <div className="relative z-10">
                       <div className="flex items-center space-x-3 mb-6">
                          <div className="p-3 bg-yellow-500/10 rounded-2xl"><TrendingUp className="text-yellow-500" size={24} /></div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Net Individual Fund</span>
                       </div>
                       <h3 className="text-3xl md:text-4xl font-black text-yellow-500 font-outfit tracking-tighter">
                         ${(partnerBalances[selectedPartner.id] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </h3>
                     </div>
                  </div>
                  
                  <div className="bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-700 flex flex-col justify-between shadow-xl">
                     <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-2xl"><History className="text-blue-500" size={24} /></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Activity Level</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <div className="flex flex-col">
                         <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Total Movements</span>
                         <span className="text-2xl font-black text-white font-outfit">{partnerTransfers.length}</span>
                       </div>
                       <div className="flex items-center space-x-2 text-emerald-400">
                         <Check size={14} className="animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                       </div>
                     </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-2xl md:rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-2xl">
                  <div className="p-6 md:p-8 border-b border-slate-700 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div className="flex items-center space-x-4">
                        <History className="text-yellow-500" size={20} />
                        <div>
                          <h3 className="text-lg md:text-xl font-bold text-white font-outfit">Detailed Statement</h3>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">{selectedPartner.name}</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-900/30 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-slate-700">
                          <th className="px-8 py-6">Timestamp</th>
                          <th className="px-8 py-6">Transaction Path</th>
                          <th className="px-8 py-6">Memo</th>
                          <th className="px-8 py-6 text-right">Fund Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {partnerTransfers.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tf => {
                          const isCredit = tf.toAccount === AccountId.PARTNER;
                          return (
                            <tr key={tf.id} className="hover:bg-slate-700/20 transition-colors group">
                              <td className="px-8 py-6 text-xs text-slate-500 font-mono">
                                {new Date(tf.date).toLocaleDateString('en-GB')}
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center space-x-3">
                                   <div className="text-[8px] font-black px-2 py-0.5 rounded-md border uppercase bg-slate-900 text-slate-500 border-slate-700">
                                      {tf.fromAccount.replace('_', ' ')}
                                   </div>
                                   <ArrowRightCircle size={10} className="text-slate-700" />
                                   <div className="text-[8px] font-black px-2 py-0.5 rounded-md border uppercase bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                      {tf.toAccount.replace('_', ' ')}
                                   </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-sm text-slate-300 truncate max-w-[150px]">
                                {tf.note}
                              </td>
                              <td className={`px-8 py-6 text-right font-black font-outfit text-base ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isCredit ? '+' : '-'}${tf.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                        {partnerTransfers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-20 text-center text-slate-600 italic text-sm">
                               No movements recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[40vh] md:h-full bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col items-center justify-center text-slate-700 p-10 md:p-20 text-center">
                <Users size={32} className="opacity-10 mb-4" />
                <h3 className="text-xl font-bold font-outfit text-white mb-2">Select Stakeholder</h3>
                <p className="max-w-xs text-xs text-slate-500">Choose a profile from the directory to initialize the drilldown terminal.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {(showAddModal || editingPartner) && (
        <PartnerModal 
          partner={editingPartner || undefined} 
          onClose={() => { setShowAddModal(false); setEditingPartner(null); }} 
        />
      )}
    </motion.div>
  );
};

const PartnerModal: React.FC<{ partner?: Partner, onClose: () => void }> = ({ partner, onClose }) => {
  const { updatePartners } = useAppContext();
  const [form, setForm] = useState<Partial<Partner>>(partner || {
    name: '',
    email: '',
    phone: '',
    joinedDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return alert('Name is mandatory.');
    if (partner) {
      updatePartners(prev => prev.map(p => p.id === partner.id ? { ...p, ...form } as Partner : p));
    } else {
      updatePartners(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), ...form } as Partner]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl p-6 md:p-10 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
        <h3 className="text-2xl md:text-3xl font-bold font-outfit text-white mb-6">{partner ? 'Edit Profile' : 'New Stakeholder'}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Name</label>
            <input required placeholder="Full Legal Name" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 md:py-4 text-white focus:ring-2 focus:ring-yellow-500 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email</label>
            <input required type="email" placeholder="contact@email.com" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 md:py-4 text-white focus:ring-2 focus:ring-yellow-500 outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone</label>
            <input placeholder="+1..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 md:py-4 text-white focus:ring-2 focus:ring-yellow-500 outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          
          <div className="flex gap-3 pt-4">
             <button type="button" onClick={onClose} className="flex-1 bg-slate-900 text-slate-500 font-bold py-4 rounded-xl text-[10px] uppercase border border-slate-700">Cancel</button>
             <button type="submit" className="flex-[2] bg-yellow-500 text-slate-900 font-black py-4 rounded-xl text-[10px] uppercase shadow-lg shadow-yellow-500/20">
                {partner ? 'Save' : 'Register'}
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};