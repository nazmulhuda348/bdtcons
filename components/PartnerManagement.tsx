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

// Structural Fix for React 19 + Framer Motion Type Conflicts
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

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
      (p.email || '').toLowerCase().includes(searchTerm.toLowerCase()) // Fix: Optional chaining for email
    );
  }, [partners, searchTerm]);

  const partnerTransfers = useMemo(() => {
    if (!selectedPartnerId) return [];
    return transfers.filter(t => t.partnerId === selectedPartnerId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPartnerId, transfers]);

  const activePartner = partners.find(p => p.id === selectedPartnerId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-outfit text-white tracking-tight">Partner Registry</h2>
          <p className="text-slate-500 mt-1">Manage stakeholder balances and audit trails</p>
        </div>
        <div className="flex w-full md:w-auto">
          <MotionButton 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)} 
            className="w-full md:w-auto flex items-center justify-center space-x-2 bg-amber-400 text-slate-950 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-amber-400/10 hover:bg-amber-300 transition-all"
          >
            <Plus size={18} />
            <span>Add Partner</span>
          </MotionButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* PARTNER LIST */}
        <div className="lg:col-span-4 bg-slate-800 rounded-[2rem] border border-slate-700 shadow-2xl flex flex-col h-[700px]">
          <div className="p-6 border-b border-slate-700 bg-slate-900/30">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search stakeholders..." 
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {filteredPartners.map(p => {
              const balance = partnerBalances[p.id] || 0;
              return (
                <MotionDiv
                  key={p.id}
                  onClick={() => setSelectedPartnerId(p.id)}
                  whileHover={{ x: 4 }}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                    selectedPartnerId === p.id 
                      ? 'bg-amber-400 border-amber-400 shadow-xl' 
                      : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-bold text-sm ${selectedPartnerId === p.id ? 'text-slate-950' : 'text-white'}`}>{p.name}</h4>
                      <p className={`text-[10px] uppercase font-black tracking-widest mt-1 ${selectedPartnerId === p.id ? 'text-slate-900/60' : 'text-slate-500'}`}>
                        Bal: ${balance.toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight size={18} className={selectedPartnerId === p.id ? 'text-slate-950' : 'text-slate-600'} />
                  </div>
                </MotionDiv>
              );
            })}
            {filteredPartners.length === 0 && (
               <div className="text-center py-10">
                  <Users className="mx-auto text-slate-600 mb-3 opacity-50" size={32} />
                  <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">No Partners Found</p>
               </div>
            )}
          </div>
        </div>

        {/* PARTNER DETAILS & LEDGER */}
        <div className="lg:col-span-8">
          {activePartner ? (
            <div className="bg-slate-800 rounded-[2rem] border border-slate-700 shadow-2xl h-[700px] flex flex-col overflow-hidden">
              {/* Partner Header Card */}
              <div className="p-8 bg-slate-900/50 border-b border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div className="flex items-center space-x-5">
                      <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20">
                         <span className="text-2xl font-black text-slate-950">{activePartner.name.charAt(0)}</span>
                      </div>
                      <div>
                         <h3 className="text-2xl font-bold text-white mb-2">{activePartner.name}</h3>
                         <div className="flex items-center space-x-4 text-xs font-bold text-slate-500">
                            {activePartner.email && <span className="flex items-center space-x-1.5"><Mail size={12}/> <span>{activePartner.email}</span></span>}
                            <span className="flex items-center space-x-1.5"><Phone size={12}/> <span>{activePartner.phone}</span></span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <button onClick={() => setEditingPartner(activePartner)} className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 hover:border-slate-500 transition-all">
                       <Edit2 size={16} />
                     </button>
                     {isAdmin && (
                        <button onClick={() => setConfirmDeleteId(activePartner.id)} className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl border border-red-500/20 hover:border-red-500 transition-all">
                          <Trash2 size={16} />
                        </button>
                     )}
                   </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                   <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex items-center space-x-4">
                      <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><Wallet size={20}/></div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Net Balance</p>
                         <h4 className="text-2xl font-black text-white font-outfit mt-1">${(partnerBalances[activePartner.id] || 0).toLocaleString()}</h4>
                      </div>
                   </div>
                   <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex items-center space-x-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><History size={20}/></div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Movement Events</p>
                         <h4 className="text-2xl font-black text-white font-outfit mt-1">{partnerTransfers.length} Transactions</h4>
                      </div>
                   </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-800 p-8">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Movement Audit Trail</h4>
                
                {partnerTransfers.length > 0 ? (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {partnerTransfers.map((t) => {
                         const isCredit = t.toAccount === AccountId.PARTNER;
                         return (
                            <MotionDiv 
                              key={t.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50 flex items-center justify-between"
                            >
                               <div className="flex items-center space-x-4">
                                  <div className={`p-3 rounded-xl ${isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                     {isCredit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-white">{t.note}</p>
                                     <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500 font-mono">
                                        <span>{new Date(t.date).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="uppercase font-bold tracking-widest text-slate-400">
                                          {t.fromAccount} <ArrowRightCircle size={10} className="inline mx-0.5" /> {t.toAccount}
                                        </span>
                                     </div>
                                  </div>
                               </div>
                               <span className={`text-lg font-black font-outfit ${isCredit ? 'text-emerald-400' : 'text-slate-300'}`}>
                                  {isCredit ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                               </span>
                            </MotionDiv>
                         )
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                    <History size={48} className="mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest">No activity recorded</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-[2rem] border border-slate-700 border-dashed h-[700px] flex flex-col items-center justify-center text-slate-500">
               <Users size={64} className="mb-4 opacity-20" />
               <p className="text-sm font-bold uppercase tracking-widest">Select a partner to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <MotionDiv 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="bg-slate-800 border border-red-500/20 w-full max-w-md rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Partner?</h3>
              <p className="text-slate-400 text-sm mb-8">This action cannot be undone. Balances and records might become orphaned.</p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-4 bg-slate-900 text-slate-300 font-bold rounded-2xl uppercase text-[10px] tracking-widest border border-slate-700">Cancel</button>
                <button onClick={() => { deletePartner(confirmDeleteId); setConfirmDeleteId(null); if(selectedPartnerId === confirmDeleteId) setSelectedPartnerId(null); }} className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl uppercase text-[10px] tracking-widest">Confirm Delete</button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {(showAddModal || editingPartner) && (
        <PartnerModal 
          editData={editingPartner || undefined} 
          onClose={() => { setShowAddModal(false); setEditingPartner(null); }} 
        />
      )}
    </div>
  );
};

const PartnerModal: React.FC<{ onClose: () => void, editData?: Partner }> = ({ onClose, editData }) => {
  const { updatePartners } = useAppContext();
  
  // Fix: Removed 'joinedDate' from initial state to match the Partial<Partner> interface.
  const [form, setForm] = useState<Partial<Partner>>(editData || { 
    name: '', 
    email: '', 
    phone: '' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editData) {
      updatePartners(prev => prev.map(p => p.id === editData.id ? { ...p, ...form } as Partner : p));
    } else {
      updatePartners(prev => [...prev, { id: `P_${Date.now()}`, ...form } as Partner]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <MotionDiv initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl p-6 md:p-10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
        
        <h3 className="text-2xl font-bold font-outfit text-white mb-8 tracking-tight">
          {editData ? 'Edit Profile' : 'Register Partner'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
            <input required placeholder="Enter full name" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 md:py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email</label>
            <input type="email" placeholder="contact@email.com" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 md:py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone</label>
            <input required placeholder="+1..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 md:py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          
          <div className="flex gap-3 pt-4">
             <button type="button" onClick={onClose} className="flex-1 bg-slate-900 text-slate-500 font-bold py-4 rounded-xl text-[10px] uppercase border border-slate-700 hover:text-slate-300 transition-colors">Cancel</button>
             <button type="submit" className="flex-1 bg-amber-400 text-slate-950 font-black py-4 rounded-xl text-[10px] uppercase hover:bg-amber-500 transition-colors">Save Details</button>
          </div>
        </form>
      </MotionDiv>
    </div>
  );
};