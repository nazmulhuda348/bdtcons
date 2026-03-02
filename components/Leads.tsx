import React, { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { 
  Users, Search, Phone, Facebook, UserCheck, Trash2, Plus, X, 
  MapPin, Briefcase, Heart, Tag, Edit2, Settings2, Check, AlertCircle, Filter 
} from 'lucide-react';
import { Lead, LeadStatus, LeadSource, Client } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermissions } from '../hooks/usePermissions';

export const Leads: React.FC = () => {
  const { 
    allProspects = [], 
    deleteLead, 
    availableLeadCategories = [] 
  } = useAppContext();
  
  const { isAdmin } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredProspects = useMemo(() => {
    return allProspects.filter(l => {
      const matchesSearch = (l.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (l.phone || '').includes(searchTerm);
      const matchesCategory = selectedCategory === 'all' || l.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => (a.status === LeadStatus.CONVERTED ? 1 : -1));
  }, [allProspects, searchTerm, selectedCategory]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Lead Pipeline</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Database records: {allProspects.length}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => setShowCatModal(true)} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-slate-800 border border-slate-700 text-slate-300 px-6 py-4 rounded-2xl font-bold uppercase text-[10px] hover:bg-slate-700 transition-all">
            <Settings2 size={16} /> <span>Manage Segments</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-400 text-slate-950 px-8 py-4 rounded-2xl font-black uppercase text-xs hover:bg-amber-300 shadow-xl shadow-amber-400/10 transition-all">
            <Plus size={18} /> <span>New Entry</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-900/30 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input type="text" placeholder="Search by name, phone..." className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl py-4 pl-14 pr-6 text-sm text-white focus:ring-4 focus:ring-amber-400/10 outline-none font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="relative w-full sm:w-72">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-400"><Filter size={18} /></div>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl py-4 pl-14 pr-10 text-sm text-white focus:ring-4 focus:ring-amber-400/10 outline-none font-bold appearance-none cursor-pointer">
              <option value="all">All Segments / Projects</option>
              {availableLeadCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
                <th className="px-6 py-5">Prospect Info</th>
                <th className="px-6 py-5">Segment</th>
                <th className="px-6 py-5">Profession & Hobby</th>
                <th className="px-6 py-5">Address</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              <AnimatePresence mode="popLayout">
                {filteredProspects.map((lead) => (
                  <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-slate-700/10 transition-colors group">
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm mb-0.5">{lead.name}</span>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono"><Phone size={10} className="text-amber-400/50" /><span>{lead.phone}</span></div>
                        {lead.facebookId && <div className="flex items-center space-x-1 text-[10px] text-blue-400 mt-1"><Facebook size={10} /><span>{lead.facebookId}</span></div>}
                        {lead.id.startsWith('sync_') && <span className="w-fit text-[7px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase font-black mt-1.5">Registry</span>}
                      </div>
                    </td>
                    <td className="px-6 py-6"><span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600 text-amber-400 text-[9px] font-black uppercase">{lead.category || 'General'}</span></td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col space-y-1 text-xs">
                        <div className="flex items-center space-x-2 text-slate-300"><Briefcase size={12} className="text-slate-500" /><span>{lead.profession || '-'}</span></div>
                        <div className="flex items-center space-x-2 text-slate-500"><Heart size={10} className="text-red-400/60" /><span>{lead.hobby || '-'}</span></div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-slate-400 text-xs">{lead.address || '-'}</td>
                    <td className="px-6 py-6 text-right">
                       {!lead.id.startsWith('sync_') && (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setEditingLead(lead)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"><Edit2 size={16} /></button>
                            {isAdmin && <button onClick={() => setConfirmDeleteId(lead.id)} className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg"><Trash2 size={16} /></button>}
                          </div>
                       )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && <LeadModal onClose={() => setShowAddModal(false)} />}
        {editingLead && <LeadModal editData={editingLead} onClose={() => setEditingLead(null)} />}
        {showCatModal && <CategoryManagerModal onClose={() => setShowCatModal(false)} />}
      </AnimatePresence>
    </motion.div>
  );
};

const CategoryManagerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { leadCategories = [], updateLeadCategories, projects = [] } = useAppContext();
  const [newCat, setNewCat] = useState('');
  const add = () => { if (newCat.trim()) { updateLeadCategories(prev => [...prev, newCat.trim()]); setNewCat(''); } };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-[2.5rem] p-10 relative">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500"><X size={24} /></button>
        <h3 className="text-2xl font-black text-white mb-6 uppercase">Business Segments</h3>
        <div className="flex gap-2 mb-8">
           <input placeholder="Add Manual Segment..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white outline-none" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
           <button onClick={add} className="bg-amber-400 p-4 rounded-xl"><Plus size={24}/></button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
           {leadCategories.map(cat => (
              <div key={cat} className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                 <span className="text-white font-bold text-sm">{cat}</span>
                 {cat !== 'General' && <button onClick={() => updateLeadCategories(prev => prev.filter(c => c !== cat))} className="text-rose-500"><Trash2 size={16}/></button>}
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const LeadModal: React.FC<{ onClose: () => void, editData?: Lead }> = ({ onClose, editData }) => {
  const { addLead, updateLeadItem, leads, availableLeadCategories = [] } = useAppContext();
  const [form, setForm] = useState<Partial<Lead>>(editData || { name: '', phone: '', address: '', profession: '', facebookId: '', hobby: '', category: 'General' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return alert('Name and Phone are mandatory.');
    if (editData) { await updateLeadItem({ ...editData, ...form } as Lead); }
    else { await addLead({ id: `L_${Date.now()}`, ...form } as Lead); }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-[3rem] p-12 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-10 right-10 text-slate-500"><X size={24} /></button>
        <h3 className="text-3xl font-black text-white mb-8 italic uppercase">{editData ? 'Edit Entry' : 'New Entry'}</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <input required placeholder="Name" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input required placeholder="Phone" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white font-mono" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white font-bold appearance-none cursor-pointer" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
             {availableLeadCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
          </select>
          <input placeholder="Address" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
          <div className="grid grid-cols-2 gap-5">
            <input placeholder="Profession" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white" value={form.profession || ''} onChange={e => setForm({...form, profession: e.target.value})} />
            <input placeholder="Hobby" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white" value={form.hobby || ''} onChange={e => setForm({...form, hobby: e.target.value})} />
          </div>
          <input placeholder="Facebook Link" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white" value={form.facebookId || ''} onChange={e => setForm({...form, facebookId: e.target.value})} />
          <div className="flex gap-4 pt-6">
             <button type="button" onClick={onClose} className="flex-1 bg-slate-700 text-slate-400 font-black py-5 rounded-2xl uppercase">Cancel</button>
             <button type="submit" className="flex-[2] bg-amber-400 text-slate-950 font-black py-5 rounded-2xl uppercase">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};