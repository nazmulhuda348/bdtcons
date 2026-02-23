import React, { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { 
  Users, Search, Phone, Facebook, UserCheck, Trash2, Plus, X, 
  MapPin, Briefcase, Heart, Tag, Edit2 
} from 'lucide-react';
import { Lead, LeadStatus, LeadSource, Client } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermissions } from '../hooks/usePermissions';

export const Leads: React.FC = () => {
  const { leads, updateLeads, updateClients, deleteLead } = useAppContext();
  const { isAdmin } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null); // Edit এর জন্য নতুন স্টেট
  
  const [confirmConvertId, setConfirmConvertId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    return (leads || []).filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      (l.category && l.category.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => {
      if (a.status === LeadStatus.CONVERTED && b.status !== LeadStatus.CONVERTED) return 1;
      if (a.status !== LeadStatus.CONVERTED && b.status === LeadStatus.CONVERTED) return -1;
      return 0;
    });
  }, [leads, searchTerm]);

  const convertToClient = (lead: Lead) => {
    if (lead.status === LeadStatus.CONVERTED) return;

    const newClient: Client = {
      id: `c_${Date.now()}`,
      name: lead.name,
      email: '', 
      phone: lead.phone,
      facebookId: lead.facebookId || ''
    };

    updateClients(prev => [...prev, newClient]);
    updateLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: LeadStatus.CONVERTED } : l));
    setConfirmConvertId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLead(id);
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Error deleting lead:", error);
      alert("Lead delete করতে সমস্যা হয়েছে!");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-outfit text-white tracking-tight">Lead Pipeline</h2>
          <p className="text-sm text-slate-500">Monitoring {leads.length} operational accounts</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-amber-400 text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/20"
        >
          <Plus size={20} />
          <span>New Lead</span>
        </motion.button>
      </div>

      <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-900/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, phone or category..."
              className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-700">
                <th className="px-6 py-5">Lead Info</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Profession & Hobby</th>
                <th className="px-6 py-5">Address</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              <AnimatePresence mode="popLayout">
                {filteredLeads.map((lead) => (
                  <motion.tr 
                    key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="hover:bg-slate-700/20 transition-colors group"
                  >
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm tracking-tight mb-0.5">{lead.name}</span>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                          <Phone size={10} />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.facebookId && (
                           <div className="flex items-center space-x-1 text-[10px] text-blue-400 mt-1">
                              <Facebook size={10} />
                              <span>{lead.facebookId}</span>
                           </div>
                        )}
                        {lead.status === LeadStatus.CONVERTED && (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded w-fit mt-1 uppercase">Converted</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-6">
                      {lead.category ? (
                        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                          <Tag size={12} />
                          <span>{lead.category}</span>
                        </div>
                      ) : <span className="text-slate-600 text-xs">-</span>}
                    </td>

                    <td className="px-6 py-6">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2 text-slate-300 text-xs">
                           <Briefcase size={12} />
                           <span>{lead.profession || '-'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-500 text-[10px]">
                           <Heart size={10} className="text-red-400" />
                           <span>{lead.hobby || '-'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-6">
                      <div className="flex items-center space-x-2 text-slate-400 text-xs">
                        <MapPin size={12} className="text-slate-500" />
                        <span>{lead.address || '-'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-6">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity min-w-[120px]">
                        {lead.status !== LeadStatus.CONVERTED && (
                          <>
                            {confirmConvertId === lead.id ? (
                              <div className="flex items-center space-x-1 animate-in zoom-in duration-200">
                                <button onClick={() => convertToClient(lead)} className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded uppercase">Confirm</button>
                                <button onClick={() => setConfirmConvertId(null)} className="bg-slate-700 text-slate-300 text-[9px] font-bold px-2 py-1 rounded uppercase">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmConvertId(lead.id)} className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all" title="Convert to Client">
                                <UserCheck size={18} />
                              </button>
                            )}
                          </>
                        )}

                        {/* Edit Button */}
                        <button 
                          onClick={() => setEditingLead(lead)} 
                          className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all" 
                          title="Edit Lead"
                        >
                          <Edit2 size={16} />
                        </button>

                        {isAdmin && (
                          <>
                            {confirmDeleteId === lead.id ? (
                              <div className="flex items-center space-x-1 animate-in zoom-in duration-200">
                                <button onClick={() => handleDelete(lead.id)} className="bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded uppercase">Confirm</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="bg-slate-700 text-slate-300 text-[9px] font-bold px-2 py-1 rounded uppercase">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDeleteId(lead.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Remove Lead">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {/* Add Modal */}
        {showAddModal && <LeadModal onClose={() => setShowAddModal(false)} />}
        
        {/* Edit Modal */}
        {editingLead && <LeadModal editData={editingLead} onClose={() => setEditingLead(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};

const LeadModal: React.FC<{ onClose: () => void, editData?: Lead }> = ({ onClose, editData }) => {
  const { leads, updateLeads } = useAppContext();
  
  // যদি editData থাকে, তাহলে ফর্মে আগের ডাটা বসবে, নাহলে ফাঁকা ফর্ম আসবে
  const [form, setForm] = useState(editData || {
    name: '', phone: '', address: '', profession: '', facebookId: '', hobby: '', 
    category: 'General', notes: '', status: LeadStatus.INTERESTED, source: LeadSource.OTHER 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return alert('Name and Phone are mandatory.');
    
    // DUPLICATE PHONE CHECK: শুধু তখনই চেক করবে যদি এটি নতুন লিড হয়, অথবা এডিট করার সময় ফোন নাম্বার পরিবর্তন করা হয়
    if (!editData || editData.phone !== form.phone) {
      const isDuplicate = leads.some(l => l.phone === form.phone);
      if (isDuplicate) {
        alert('❌ Denied! এই ফোন নাম্বারের ডাটাটি আগে থেকেই এন্ট্রি করা আছে।');
        return;
      }
    }

    if (editData) {
      // Update Existing Lead
      updateLeads(prev => prev.map(l => l.id === editData.id ? { ...l, ...form } : l));
    } else {
      // Add New Lead
      const newLead: Lead = { id: `L_${Date.now()}`, ...form };
      updateLeads(prev => [...prev, newLead]);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
        <h3 className="text-3xl font-bold font-outfit text-white mb-2">{editData ? 'Edit Lead' : 'New Lead'}</h3>
        <p className="text-slate-500 mb-8 text-sm">{editData ? 'Update client information.' : 'Add a new potential client.'}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Lead Name *</label>
              <input required placeholder="Name" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-400 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone *</label>
              <input required placeholder="Phone" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-400 outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Category</label>
             <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-400 outline-none appearance-none"
                value={form.category || 'General'}
                onChange={e => setForm({...form, category: e.target.value})}
             >
                <option value="General">General</option>
                <option value="Land">Land</option>
                <option value="Software">Software</option>
                <option value="Interior">Interior</option>
                <option value="Construction">Construction</option>
             </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Address</label>
            <input placeholder="Address" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-400 outline-none" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Profession</label>
              <input placeholder="Profession" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" value={form.profession || ''} onChange={e => setForm({...form, profession: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Hobby</label>
              <input placeholder="Hobby" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" value={form.hobby || ''} onChange={e => setForm({...form, hobby: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Facebook ID</label>
            <input placeholder="Facebook Profile Link/ID" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" value={form.facebookId || ''} onChange={e => setForm({...form, facebookId: e.target.value})} />
          </div>
          
          <div className="flex space-x-4 pt-4">
             <button type="button" onClick={onClose} className="flex-1 bg-slate-700 text-slate-300 font-bold py-4 rounded-xl hover:bg-slate-600 transition-all uppercase text-[10px]">Cancel</button>
             <button type="submit" className="flex-[2] bg-amber-400 text-slate-950 font-black py-4 rounded-xl hover:bg-amber-500 transition-all uppercase text-[10px]">{editData ? 'Update Lead' : 'Save Lead'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};