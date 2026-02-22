import React, { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { 
  Users, 
  Search, 
  Filter, 
  Phone, 
  Globe, 
  Facebook, 
  MessageSquare,
  UserCheck,
  Edit2,
  Trash2,
  Plus,
  X,
  Check
} from 'lucide-react';
import { Lead, LeadStatus, LeadSource, Client } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermissions } from '../hooks/usePermissions';

export const Leads: React.FC = () => {
  const { leads, updateLeads, updateClients } = useAppContext();
  const { isAdmin } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // State for Confirmation Workflow
  const [confirmConvertId, setConfirmConvertId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    return (leads || []).filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm)
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
      email: '', // Placeholder
      phone: lead.phone,
    };

    updateClients(prev => [...prev, newClient]);
    updateLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: LeadStatus.CONVERTED } : l));
    setConfirmConvertId(null);
  };

  const handleDelete = (id: string) => {
    updateLeads(prev => prev.filter(l => l.id !== id));
    setConfirmDeleteId(null);
  };

  const getStatusStyle = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.INTERESTED: return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
      case LeadStatus.CONTACTED: return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
      case LeadStatus.CONVERTED: return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
      case LeadStatus.LOST: return 'bg-red-400/10 text-red-400 border-red-400/20';
      default: return 'bg-slate-700/50 text-slate-400 border-slate-600';
    }
  };

  const getSourceIcon = (source: LeadSource) => {
    switch (source) {
      case LeadSource.WEB: return <Globe size={14} />;
      case LeadSource.FACEBOOK: return <Facebook size={14} />;
      case LeadSource.REFERRAL: return <Users size={14} />;
      default: return <MessageSquare size={14} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-outfit text-white tracking-tight">Lead Pipeline</h2>
          <p className="text-sm text-slate-500">Monitoring {leads.length} operational accounts</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-amber-400 text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/20"
        >
          <Plus size={20} />
          <span>New Lead</span>
        </motion.button>
      </div>

      <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              type="text" 
              placeholder="Search leads by name or contact..."
              className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
             <button className="flex items-center space-x-2 bg-slate-700/50 px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-slate-700 transition-colors uppercase tracking-widest border border-slate-600">
               <Filter size={12} className="text-amber-400" />
               <span>Funnel Logic</span>
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-700">
                <th className="px-6 py-5">Potential Client</th>
                <th className="px-6 py-5">Source</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Notes</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              <AnimatePresence mode="popLayout">
                {filteredLeads.map((lead) => (
                  <motion.tr 
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-700/20 transition-colors group"
                  >
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm tracking-tight mb-0.5">{lead.name}</span>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                          <Phone size={10} />
                          <span>{lead.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center space-x-2 text-slate-300">
                        {getSourceIcon(lead.source)}
                        <span className="text-[10px] font-bold uppercase tracking-widest">{lead.source}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${getStatusStyle(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-xs text-slate-500 italic max-w-xs truncate">{lead.notes || 'No activity log'}</p>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity min-w-[120px]">
                        {lead.status !== LeadStatus.CONVERTED && (
                          <>
                            {confirmConvertId === lead.id ? (
                              <div className="flex items-center space-x-1 animate-in zoom-in duration-200">
                                <button 
                                  onClick={() => convertToClient(lead)}
                                  className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded hover:bg-emerald-600 transition-colors uppercase"
                                >
                                  Confirm
                                </button>
                                <button 
                                  onClick={() => setConfirmConvertId(null)}
                                  className="bg-slate-700 text-slate-300 text-[9px] font-bold px-2 py-1 rounded hover:bg-slate-600 transition-colors uppercase"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setConfirmConvertId(lead.id)}
                                className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all"
                                title="Convert to Client"
                              >
                                <UserCheck size={18} />
                              </button>
                            )}
                          </>
                        )}
                        
                        {isAdmin && (
                          <>
                            {confirmDeleteId === lead.id ? (
                              <div className="flex items-center space-x-1 animate-in zoom-in duration-200">
                                <button 
                                  onClick={() => handleDelete(lead.id)}
                                  className="bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded hover:bg-red-600 transition-colors uppercase"
                                >
                                  Confirm
                                </button>
                                <button 
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="bg-slate-700 text-slate-300 text-[9px] font-bold px-2 py-1 rounded hover:bg-slate-600 transition-colors uppercase"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setConfirmDeleteId(lead.id)}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                title="Remove Lead"
                              >
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
          {filteredLeads.length === 0 && (
            <div className="p-20 text-center">
              <Users className="mx-auto text-slate-700 mb-4" size={48} />
              <p className="text-slate-500 font-medium">No leads matching search.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <LeadModal onClose={() => setShowAddModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const LeadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { updateLeads } = useAppContext();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    source: LeadSource.WEB,
    status: LeadStatus.INTERESTED,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return alert('Name and Phone are mandatory.');
    
    const newLead: Lead = {
      id: `L_${Date.now()}`,
      ...form
    };

    updateLeads(prev => [...prev, newLead]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
          <X size={24} />
        </button>
        <h3 className="text-3xl font-bold font-outfit text-white mb-2 tracking-tight">Register New Lead</h3>
        <p className="text-slate-500 mb-8 text-sm">Initialize a new opportunity in the pipeline.</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Lead Name</label>
            <input 
              required 
              placeholder="e.g. Acme Corp" 
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-700" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
            <input 
              required 
              placeholder="+1 (555) 000-0000" 
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-700" 
              value={form.phone} 
              onChange={e => setForm({...form, phone: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Source</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none transition-all appearance-none"
                value={form.source}
                onChange={e => setForm({...form, source: e.target.value as LeadSource})}
              >
                <option value={LeadSource.WEB}>Web</option>
                <option value={LeadSource.FACEBOOK}>Facebook</option>
                <option value={LeadSource.REFERRAL}>Referral</option>
                <option value={LeadSource.OTHER}>Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Status</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none transition-all appearance-none"
                value={form.status}
                onChange={e => setForm({...form, status: e.target.value as LeadStatus})}
              >
                <option value={LeadStatus.INTERESTED}>Interested</option>
                <option value={LeadStatus.CONTACTED}>Contacted</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Activity Notes</label>
            <textarea 
              rows={3}
              placeholder="Record operational details..."
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-700 resize-none"
              value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})}
            />
          </div>
          
          <div className="flex space-x-4 pt-4">
             <button 
               type="button" 
               onClick={onClose} 
               className="flex-1 bg-slate-700 text-slate-300 font-bold py-5 rounded-2xl hover:bg-slate-600 transition-all text-[10px] uppercase tracking-widest border border-slate-600"
             >
               Cancel
             </button>
             <button 
               type="submit" 
               className="flex-[2] bg-amber-400 text-slate-900 font-black py-5 rounded-2xl hover:bg-amber-500 transition-all shadow-xl shadow-amber-400/20 text-[10px] uppercase tracking-widest"
             >
               Commit Lead
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};