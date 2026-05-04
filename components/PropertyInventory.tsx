import React, { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { usePermissions } from '../hooks/usePermissions';
import { 
  Building, Plus, Search, Edit2, Trash2, X, LayoutGrid, 
  CheckCircle2, DollarSign, AlertTriangle, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InventoryUnit, UnitStatus } from '../types';

// Structural Fix for React 19 + Framer Motion Type Conflicts
const MotionDiv = motion.div as any;

export const PropertyInventory: React.FC = () => {
  const { 
    inventoryUnits = [], 
    updateInventoryUnits, 
    deleteInventoryUnit, 
    projects, 
    selectedProjectId,
    setSelectedProjectId
  } = useAppContext();
  
  const { isAdmin, isManager, currentUser } = usePermissions();

  const filteredProjects = projects.filter(p => {
    if (isAdmin || isManager) return true;
    const assigned = currentUser?.assignedProjects || [];
    return assigned.includes(p.id);
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<InventoryUnit | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Active Project Selection Fallback
  const activeProjectId = selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId;

  // Filter Units based on Project and Search Term
  const filteredUnits = useMemo(() => {
    return inventoryUnits.filter(u => {
      const matchesProject = u.projectId === activeProjectId;
      const matchesSearch = u.unitName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesProject && matchesSearch;
    }).sort((a, b) => a.unitName.localeCompare(b.unitName));
  }, [inventoryUnits, activeProjectId, searchTerm]);

  // Status Metrics
  const metrics = useMemo(() => {
    const available = filteredUnits.filter(u => u.status === UnitStatus.AVAILABLE).length;
    const booked = filteredUnits.filter(u => u.status === UnitStatus.BOOKED).length;
    const sold = filteredUnits.filter(u => u.status === UnitStatus.SOLD).length;
    return { total: filteredUnits.length, available, booked, sold };
  }, [filteredUnits]);

  // Helper: Status Colors
  const getStatusStyle = (status: UnitStatus) => {
    switch (status) {
      case UnitStatus.AVAILABLE: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case UnitStatus.BOOKED: return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
      case UnitStatus.SOLD: return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const calculateTotalPrice = (unit: InventoryUnit) => {
    return (unit.sizeSqFt * unit.ratePerSqFt) + (unit.parkingCharge || 0) + (unit.utilityCharge || 0);
  };

  const handleDelete = async (id: string) => {
    if (deleteInventoryUnit) {
      await deleteInventoryUnit(id);
    } else {
      updateInventoryUnits(prev => prev.filter(u => u.id !== id));
    }
    setConfirmDeleteId(null);
  };

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
      {/* Header & Project Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold font-outfit text-white tracking-tight flex items-center gap-3">
             <Building className="text-amber-400" size={32} />
             Property Inventory
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage flats, plots, and commercial units</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex items-center px-4 py-2 w-full sm:w-64">
             <Layers className="text-amber-400 mr-3" size={18} />
             <select 
               value={activeProjectId}
               onChange={(e) => setSelectedProjectId(e.target.value)}
               className="bg-transparent text-white font-bold text-sm outline-none w-full cursor-pointer appearance-none"
             >
               {filteredProjects.length === 0 && <option value="" className="bg-slate-900 text-white">No Projects Found</option>}
               {filteredProjects.map(p => <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>)}
             </select>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)} 
            disabled={!activeProjectId}
            className="flex items-center justify-center space-x-2 bg-amber-400 text-slate-950 px-6 py-3 md:py-4 rounded-2xl font-black uppercase text-xs hover:bg-amber-300 shadow-xl shadow-amber-400/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Plus size={18} /> <span>Add Unit</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Units', value: metrics.total, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Available', value: metrics.available, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Booked', value: metrics.booked, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Sold', value: metrics.sold, color: 'text-rose-400', bg: 'bg-rose-500/10' }
        ].map((kpi, i) => (
           <div key={i} className="bg-slate-800 border border-slate-700 rounded-[1.5rem] p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
                <LayoutGrid size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{kpi.label}</p>
                <p className={`text-2xl font-black font-outfit ${kpi.color}`}>{kpi.value}</p>
              </div>
           </div>
        ))}
      </div>

      {/* Search and Grid List */}
      <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 shadow-2xl p-6 md:p-8 min-h-[500px]">
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" placeholder="Search by Unit Name (e.g. Flat A1)..." 
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-14 pr-4 text-sm text-white focus:ring-2 focus:ring-amber-400/50 outline-none font-bold"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           <AnimatePresence>
             {filteredUnits.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-[2rem]">
                  <LayoutGrid size={48} className="mb-4 opacity-20" />
                  <p className="font-bold text-sm uppercase tracking-widest">No units found</p>
                  <p className="text-xs mt-1">Click "Add Unit" to build your inventory.</p>
                </div>
             ) : (
               filteredUnits.map(unit => (
                 <MotionDiv 
                   key={unit.id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-slate-900/50 border border-slate-700 p-6 rounded-3xl relative group hover:border-amber-400/50 transition-all shadow-lg"
                 >
                    <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingUnit(unit)} className="p-2 bg-slate-800 text-slate-400 hover:text-blue-400 rounded-xl"><Edit2 size={14} /></button>
                      {isAdmin && <button onClick={() => setConfirmDeleteId(unit.id)} className="p-2 bg-slate-800 text-slate-400 hover:text-rose-400 rounded-xl"><Trash2 size={14} /></button>}
                    </div>

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black text-white">{unit.unitName}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Property ID: {unit.id.substring(0, 8)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-6">
                       <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${getStatusStyle(unit.status)}`}>
                         {unit.status}
                       </span>
                       <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border bg-slate-800 text-slate-300 border-slate-700">
                         {unit.sizeSqFt} SQFT
                       </span>
                    </div>

                    <div className="space-y-3 bg-slate-800 p-4 rounded-2xl border border-slate-700/50">
                       <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-bold">Rate/SqFt:</span>
                          <span className="text-white font-mono">${unit.ratePerSqFt.toLocaleString()}</span>
                       </div>
                       {(unit.parkingCharge || 0) > 0 && (
                         <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-bold">Parking:</span>
                            <span className="text-white font-mono">${unit.parkingCharge?.toLocaleString()}</span>
                         </div>
                       )}
                       {(unit.utilityCharge || 0) > 0 && (
                         <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-bold">Utility:</span>
                            <span className="text-white font-mono">${unit.utilityCharge?.toLocaleString()}</span>
                         </div>
                       )}
                       <div className="pt-3 mt-3 border-t border-slate-700 flex justify-between items-center">
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Total Value</span>
                          <span className="text-lg font-black text-amber-400 font-outfit">${calculateTotalPrice(unit).toLocaleString()}</span>
                       </div>
                    </div>
                 </MotionDiv>
               ))
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingUnit) && (
        <UnitModal 
          activeProjectId={activeProjectId}
          editData={editingUnit || undefined} 
          onClose={() => { setShowAddModal(false); setEditingUnit(null); }} 
        />
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <MotionDiv 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-800 border border-rose-500/20 w-full max-w-md rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Property Unit?</h3>
              <p className="text-slate-400 text-sm mb-8">This will permanently remove the unit from your inventory.</p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-4 bg-slate-900 text-slate-300 font-bold rounded-2xl uppercase text-[10px] tracking-widest border border-slate-700">Cancel</button>
                <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-4 bg-rose-500 text-white font-bold rounded-2xl uppercase text-[10px] tracking-widest">Delete Unit</button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </MotionDiv>
  );
};

const UnitModal: React.FC<{ activeProjectId: string, onClose: () => void, editData?: InventoryUnit }> = ({ activeProjectId, onClose, editData }) => {
  const { updateInventoryUnits } = useAppContext();
  
  const [form, setForm] = useState<Partial<InventoryUnit>>(editData || { 
    projectId: activeProjectId,
    unitName: '', 
    sizeSqFt: 0, 
    ratePerSqFt: 0,
    parkingCharge: 0,
    utilityCharge: 0,
    status: UnitStatus.AVAILABLE
  });

  const liveTotal = (Number(form.sizeSqFt) * Number(form.ratePerSqFt)) + Number(form.parkingCharge || 0) + Number(form.utilityCharge || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unitName) return alert('Unit Name is required.');
    
    if (editData) {
      updateInventoryUnits(prev => prev.map(u => u.id === editData.id ? { ...u, ...form } as InventoryUnit : u));
    } else {
      updateInventoryUnits(prev => [...prev, { id: `unit_${Date.now()}`, ...form } as InventoryUnit]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <MotionDiv initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
        
        <div className="flex items-center gap-3 mb-8">
           <div className="p-3 bg-amber-400/10 rounded-xl"><Building className="text-amber-400" size={24}/></div>
           <h3 className="text-2xl font-bold font-outfit text-white tracking-tight">{editData ? 'Edit Property Unit' : 'Add New Unit'}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Unit Name / Number</label>
            <input required placeholder="e.g. Flat A1, Shop 5" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-amber-400" value={form.unitName} onChange={e => setForm({...form, unitName: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Size (SqFt)</label>
               <input required type="number" min="1" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white font-mono outline-none focus:border-amber-400" value={form.sizeSqFt || ''} onChange={e => setForm({...form, sizeSqFt: parseFloat(e.target.value) || 0})} />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Rate per SqFt ($)</label>
               <input required type="number" min="0" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white font-mono outline-none focus:border-amber-400" value={form.ratePerSqFt || ''} onChange={e => setForm({...form, ratePerSqFt: parseFloat(e.target.value) || 0})} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Parking Charge ($)</label>
               <input type="number" min="0" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white font-mono outline-none focus:border-amber-400" value={form.parkingCharge || ''} onChange={e => setForm({...form, parkingCharge: parseFloat(e.target.value) || 0})} />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Utility Charge ($)</label>
               <input type="number" min="0" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white font-mono outline-none focus:border-amber-400" value={form.utilityCharge || ''} onChange={e => setForm({...form, utilityCharge: parseFloat(e.target.value) || 0})} />
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Current Status</label>
            <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-amber-400 appearance-none cursor-pointer" value={form.status} onChange={e => setForm({...form, status: e.target.value as UnitStatus})}>
               <option value={UnitStatus.AVAILABLE}>🟢 AVAILABLE</option>
               <option value={UnitStatus.BOOKED}>🟡 BOOKED</option>
               <option value={UnitStatus.SOLD}>🔴 SOLD</option>
            </select>
          </div>

          <div className="bg-amber-400/10 border border-amber-400/30 p-5 rounded-2xl flex justify-between items-center mt-4">
             <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Total Unit Value</span>
             <span className="text-2xl font-black text-amber-400 font-outfit flex items-center"><DollarSign size={20}/>{liveTotal.toLocaleString()}</span>
          </div>
          
          <div className="flex gap-3 pt-4">
             <button type="button" onClick={onClose} className="flex-1 bg-slate-900 text-slate-500 font-bold py-4 rounded-xl text-xs uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
             <button type="submit" className="flex-1 bg-amber-400 text-slate-950 font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-amber-500 transition-colors flex items-center justify-center gap-2">
               <CheckCircle2 size={18}/> <span>Save Unit</span>
             </button>
          </div>
        </form>
      </MotionDiv>
    </div>
  );
};