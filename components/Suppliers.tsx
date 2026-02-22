import React, { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { 
  Truck, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  MessageCircle,
  ChevronRight,
  ExternalLink,
  Package,
  Phone as PhoneIcon
} from 'lucide-react';
import { Supplier } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermissions } from '../hooks/usePermissions';

export const Suppliers: React.FC = () => {
  const { suppliers, updateSuppliers, deleteSupplier } = useAppContext();
  const { isAdmin } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.material.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  const selectedSupplier = useMemo(() => 
    suppliers.find(s => s.id === selectedSupplierId), 
    [suppliers, selectedSupplierId]
  );

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSupplier(id);
      if (selectedSupplierId === id) setSelectedSupplierId(null);
      setConfirmDeleteId(null);
    } catch (err) {
      alert("Failed to delete vendor. Persistence error.");
    }
  };

  const scrollToDetail = () => {
    if (window.innerWidth < 1024) {
      document.getElementById('supplier-detail-view')?.scrollIntoView({ behavior: 'smooth' });
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
          <h2 className="text-2xl md:text-3xl font-bold font-outfit text-white tracking-tight">Supply Chain</h2>
          <p className="text-sm text-slate-500">Material Procurement Registry</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-amber-400 text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-amber-500 transition-all shadow-lg"
        >
          <Plus size={20} />
          <span>New Supplier</span>
        </motion.button>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 md:gap-8">
        {/* DIRECTORY LIST */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          <div className="bg-slate-900/50 p-1 border border-slate-800 rounded-2xl flex relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input 
              type="text" 
              placeholder="Search directory..."
              className="w-full bg-transparent py-3 pl-12 pr-4 text-xs text-white outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:overflow-y-auto lg:max-h-[60vh] pr-1 custom-scrollbar">
            {filteredSuppliers.length === 0 ? (
              <div className="col-span-full text-center py-10 text-slate-600 italic text-sm">No vendors registered.</div>
            ) : (
              filteredSuppliers.map((supplier) => (
                <motion.div 
                  key={supplier.id}
                  onClick={() => { setSelectedSupplierId(supplier.id); scrollToDetail(); }}
                  whileHover={{ x: 4 }}
                  className={`p-5 rounded-2xl md:rounded-[1.8rem] border cursor-pointer transition-all relative overflow-hidden group ${selectedSupplierId === supplier.id ? 'bg-slate-800 border-amber-400 shadow-xl' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${selectedSupplierId === supplier.id ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-amber-400'}`}>
                      <Truck size={18} />
                    </div>
                    <div className="flex items-center space-x-2">
                       <button onClick={(e) => { e.stopPropagation(); setEditingSupplier(supplier); }} className="p-2 text-slate-500 hover:text-white transition-colors">
                         <Edit2 size={14} />
                       </button>
                       {isAdmin && (
                         <>
                           {confirmDeleteId === supplier.id ? (
                             <div className="flex items-center space-x-1 animate-in zoom-in duration-200">
                               <button onClick={(e) => { e.stopPropagation(); handleDelete(supplier.id); }} className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded uppercase">Erase</button>
                               <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} className="bg-slate-700 text-slate-300 text-[8px] font-black px-2 py-1 rounded uppercase">X</button>
                             </div>
                           ) : (
                             <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(supplier.id); }} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                               <Trash2 size={14} />
                             </button>
                           )}
                         </>
                       )}
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <h4 className="text-white font-bold tracking-tight truncate">{supplier.name}</h4>
                    <div className="flex items-center space-x-2 mt-1 mb-4">
                       <Package size={10} className="text-amber-400/50" />
                       <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest truncate">{supplier.material}</span>
                    </div>
                    <div className="flex items-end justify-between border-t border-slate-700/50 pt-3">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em]">Contact</span>
                          <span className="text-xs font-bold text-slate-300 font-mono truncate">{supplier.phone}</span>
                       </div>
                       <ChevronRight size={18} className={`${selectedSupplierId === supplier.id ? 'text-amber-400' : 'text-slate-700'}`} />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* DETAIL VIEW */}
        <div id="supplier-detail-view" className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedSupplier ? (
              <motion.div 
                key={selectedSupplier.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-slate-800 rounded-2xl md:rounded-[2.5rem] border border-slate-700 p-6 md:p-10 relative overflow-hidden group shadow-2xl">
                   <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                        <div className="flex items-center space-x-4 mb-8">
                           <div className="p-4 bg-amber-400/10 rounded-2xl"><Package className="text-amber-400" size={32} /></div>
                           <div>
                             <h3 className="text-2xl md:text-3xl font-black text-white font-outfit tracking-tight">{selectedSupplier.name}</h3>
                             <p className="text-amber-400 font-black text-[10px] uppercase tracking-[0.2em]">{selectedSupplier.material}</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex items-center space-x-3 text-slate-400">
                              <PhoneIcon size={18} />
                              <span className="text-sm font-bold font-mono">{selectedSupplier.phone}</span>
                           </div>
                           {selectedSupplier.whatsapp && (
                             <div className="flex items-center space-x-3 text-emerald-400">
                                <MessageCircle size={18} />
                                <span className="text-sm font-bold font-mono">{selectedSupplier.whatsapp}</span>
                             </div>
                           )}
                        </div>
                     </div>

                     <div className="flex flex-col justify-center space-y-4">
                        <button 
                          onClick={() => openWhatsApp(selectedSupplier.whatsapp || selectedSupplier.phone)}
                          className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-xl hover:bg-emerald-400 transition-all shadow-lg flex items-center justify-center space-x-3 uppercase text-[10px]"
                        >
                           <MessageCircle size={18} />
                           <span>WhatsApp Chat</span>
                        </button>
                        <button className="w-full bg-slate-900 border border-slate-700 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center space-x-3 uppercase text-[10px]">
                           <ExternalLink size={18} />
                           <span>Supplier Portal</span>
                        </button>
                     </div>
                   </div>
                </div>

                <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 md:p-10 text-center">
                   <p className="text-slate-500 italic text-sm">Purchase history and procurement analytics for this vendor are integrated into the main Ledger under the '{selectedSupplier.material}' category.</p>
                </div>
              </motion.div>
            ) : (
              <div className="h-[40vh] md:h-full bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col items-center justify-center text-slate-700 p-10 md:p-20 text-center">
                <Truck size={32} className="opacity-10 mb-4" />
                <h3 className="text-xl font-bold font-outfit text-white mb-2">Select Supplier</h3>
                <p className="max-w-xs text-xs text-slate-500">Choose a vendor from the list to view detailed context.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {(showAddModal || editingSupplier) && (
        <SupplierModal 
          supplier={editingSupplier || undefined} 
          onClose={() => { setShowAddModal(false); setEditingSupplier(null); }} 
        />
      )}
    </motion.div>
  );
};

const SupplierModal: React.FC<{ supplier?: Supplier, onClose: () => void }> = ({ supplier, onClose }) => {
  const { updateSuppliers } = useAppContext();
  const [form, setForm] = useState<Partial<Supplier>>(supplier || { name: '', phone: '', material: '', whatsapp: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.material?.trim()) return alert('Name and Material are mandatory.');
    if (supplier) {
      updateSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, ...form } as Supplier : s));
    } else {
      updateSuppliers(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), ...form } as Supplier]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl p-6 md:p-10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
        <h3 className="text-2xl font-bold font-outfit text-white mb-6 tracking-tight">{supplier ? 'Edit Vendor' : 'New Vendor'}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Supplier Name</label>
            <input required placeholder="Apex Steel Ltd" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 md:py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Primary Material</label>
            <input required placeholder="Sand, Cement, Rod..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 md:py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none" value={form.material} onChange={e => setForm({...form, material: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
            <input required placeholder="+1..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 md:py-4 text-white focus:ring-2 focus:ring-amber-400 outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          
          <div className="flex gap-3 pt-4">
             <button type="button" onClick={onClose} className="flex-1 bg-slate-900 text-slate-500 font-bold py-4 rounded-xl text-[10px] uppercase border border-slate-700">Cancel</button>
             <button type="submit" className="flex-[2] bg-amber-400 text-slate-900 font-black py-4 rounded-xl text-[10px] uppercase shadow-lg">
                Register Vendor
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};