import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { 
  Truck, Plus, Search, Trash2, Edit2, X, MessageCircle, ChevronRight, 
  Package, Phone as PhoneIcon, PackagePlus, PackageMinus, 
  History, Building2, Check, AlertTriangle
} from 'lucide-react';
import { Supplier, Material, InventoryLog, AccountId } from '../types';
import { usePermissions } from '../hooks/usePermissions';

export const Suppliers: React.FC = () => {
  const { 
    suppliers = [], updateSuppliers, deleteSupplier, 
    projects = [], materials = [], updateMaterials, 
    inventoryLogs = [], updateInventoryLogs, 
    addTransaction, currentUser, categories = [] 
  } = useAppContext();
  
  const { isAdmin } = usePermissions();
  
  const [activeTab, setActiveTab] = useState<'directory' | 'inventory'>('directory');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [showStockModal, setShowStockModal] = useState<'IN' | 'OUT' | null>(null);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const safeName = s?.name || '';
      const safeMaterial = s?.material || '';
      return safeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             safeMaterial.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [suppliers, searchTerm]);

  const selectedSupplier = useMemo(() => 
    suppliers.find(s => s.id === selectedSupplierId), 
    [suppliers, selectedSupplierId]
  );

  const openWhatsApp = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSupplier(id);
      if (selectedSupplierId === id) setSelectedSupplierId(null);
      setConfirmDeleteId(null);
    } catch (err) {
      alert("Failed to delete vendor.");
    }
  };

  const liveStock = useMemo(() => {
    return materials.map(mat => {
      const logsForMatAndProj = inventoryLogs.filter(log => log.materialId === mat.id && log.projectId === selectedProjectId);
      const totalIn = logsForMatAndProj.filter(l => l.type === 'IN').reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);
      const totalOut = logsForMatAndProj.filter(l => l.type === 'OUT').reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);
      return { ...mat, currentStock: totalIn - totalOut };
    });
  }, [materials, inventoryLogs, selectedProjectId]);

  const recentLogs = useMemo(() => {
    return inventoryLogs
      .filter(l => l.projectId === selectedProjectId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [inventoryLogs, selectedProjectId]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-outfit text-white tracking-tight">Supply & Inventory</h2>
          <p className="text-sm text-slate-500">Procurement & Site Stock Management</p>
        </div>
        
        <div className="flex bg-slate-900 border border-slate-700 rounded-xl p-1 w-full sm:w-auto">
           <button 
             onClick={() => setActiveTab('directory')} 
             className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'directory' ? 'bg-amber-400 text-slate-900 shadow-md' : 'text-slate-500 hover:text-white'}`}
           >
             Vendors
           </button>
           <button 
             onClick={() => setActiveTab('inventory')} 
             className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-emerald-500 text-slate-900 shadow-md' : 'text-slate-500 hover:text-white'}`}
           >
             Site Stock
           </button>
        </div>
      </div>

      {activeTab === 'directory' && (
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-4 space-y-4 md:space-y-6">
            <div className="flex gap-2">
              <div className="bg-slate-900/50 p-1 border border-slate-800 rounded-2xl flex relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input 
                  type="text" placeholder="Search directory..."
                  className="w-full bg-transparent py-3 pl-12 pr-4 text-xs text-white outline-none"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button onClick={() => setShowAddModal(true)} className="bg-amber-400 text-slate-900 px-4 rounded-2xl flex items-center justify-center hover:bg-amber-500 transition-all"><Plus size={20}/></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:overflow-y-auto lg:max-h-[60vh] pr-1 custom-scrollbar">
              {filteredSuppliers.length === 0 ? (
                <div className="col-span-full text-center py-10 text-slate-600 italic text-sm">No vendors registered.</div>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <div 
                    key={supplier.id} onClick={() => setSelectedSupplierId(supplier.id)}
                    className={`p-5 rounded-2xl md:rounded-[1.8rem] border cursor-pointer transition-all relative overflow-hidden group ${selectedSupplierId === supplier.id ? 'bg-slate-800 border-amber-400 shadow-xl' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${selectedSupplierId === supplier.id ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-amber-400'}`}><Truck size={18} /></div>
                      <div className="flex items-center space-x-2">
                         <button onClick={(e) => { e.stopPropagation(); setEditingSupplier(supplier); }} className="p-2 text-slate-500 hover:text-white transition-colors"><Edit2 size={14} /></button>
                         {isAdmin && (
                           confirmDeleteId === supplier.id ? (
                               <div className="flex items-center space-x-1">
                                 <button onClick={(e) => { e.stopPropagation(); handleDelete(supplier.id); }} className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded uppercase">Erase</button>
                                 <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} className="bg-slate-700 text-slate-300 text-[8px] font-black px-2 py-1 rounded uppercase">X</button>
                               </div>
                             ) : (<button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(supplier.id); }} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>)
                         )}
                      </div>
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-white font-bold tracking-tight truncate">{supplier.name || 'Unnamed Supplier'}</h4>
                      <div className="flex items-center space-x-2 mt-1 mb-4">
                         <Package size={10} className="text-amber-400/50" />
                         <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest truncate">{supplier.material || 'General'}</span>
                      </div>
                      <div className="flex items-end justify-between border-t border-slate-700/50 pt-3">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em]">Contact</span>
                            <span className="text-xs font-bold text-slate-300 font-mono truncate">{supplier.phone || 'N/A'}</span>
                         </div>
                         <ChevronRight size={18} className={`${selectedSupplierId === supplier.id ? 'text-amber-400' : 'text-slate-700'}`} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            {selectedSupplier ? (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-2xl md:rounded-[2.5rem] border border-slate-700 p-6 md:p-10 relative overflow-hidden group shadow-2xl">
                   <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                        <div className="flex items-center space-x-4 mb-8">
                           <div className="p-4 bg-amber-400/10 rounded-2xl"><Package className="text-amber-400" size={32} /></div>
                           <div>
                             <h3 className="text-2xl md:text-3xl font-black text-white font-outfit tracking-tight">{selectedSupplier.name}</h3>
                             <p className="text-amber-400 font-black text-[10px] uppercase tracking-[0.2em]">{selectedSupplier.material || 'General Vendor'}</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center space-x-3 text-slate-400"><PhoneIcon size={18} /><span className="text-sm font-bold font-mono">{selectedSupplier.phone || 'N/A'}</span></div>
                           {selectedSupplier.whatsapp && (<div className="flex items-center space-x-3 text-emerald-400"><MessageCircle size={18} /><span className="text-sm font-bold font-mono">{selectedSupplier.whatsapp}</span></div>)}
                        </div>
                     </div>
                     <div className="flex flex-col justify-center space-y-4">
                        <button onClick={() => openWhatsApp(selectedSupplier.whatsapp || selectedSupplier.phone)} className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-xl hover:bg-emerald-400 transition-all shadow-lg flex items-center justify-center space-x-3 uppercase text-[10px]"><MessageCircle size={18} /><span>WhatsApp Chat</span></button>
                     </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-[40vh] md:h-full bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col items-center justify-center text-slate-700 p-10 md:p-20 text-center">
                <Truck size={32} className="opacity-10 mb-4" />
                <h3 className="text-xl font-bold font-outfit text-white mb-2">Select Supplier</h3>
                <p className="max-w-xs text-xs text-slate-500">Choose a vendor from the list to view details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-800 p-6 rounded-[2rem] border border-slate-700 shadow-xl">
             <div className="flex items-center space-x-4 w-full md:w-auto">
               <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Building2 size={24} /></div>
               <div className="flex-1">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Site</p>
                 <select 
                   value={selectedProjectId} 
                   onChange={(e) => setSelectedProjectId(e.target.value)}
                   className="bg-transparent text-white font-bold text-lg outline-none cursor-pointer w-full"
                 >
                   {projects.map(p => <option key={p.id} value={p.id} className="bg-slate-900 text-sm">{p.name}</option>)}
                 </select>
               </div>
             </div>

             <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setShowStockModal('OUT')} className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all">
                  <PackageMinus size={16}/> <span>Use (Out)</span>
                </button>
                <button onClick={() => setShowStockModal('IN')} className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-emerald-500 text-slate-950 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                  <PackagePlus size={16}/> <span>Buy (In)</span>
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 grid grid-cols-2 gap-4 auto-rows-max">
              {liveStock.length === 0 ? (
                <div className="col-span-full bg-slate-800/50 border border-slate-700 rounded-3xl p-10 text-center text-slate-500">
                  No materials yet. Click "Buy (In)".
                </div>
              ) : (
                liveStock.map(stock => (
                  <div key={stock.id} className="bg-slate-800 rounded-3xl border border-slate-700 p-5 shadow-xl relative overflow-hidden">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 truncate">{stock.name}</p>
                     <div className="flex items-baseline space-x-1">
                        <span className={`text-2xl font-black font-outfit ${stock.currentStock <= 0 ? 'text-red-400' : 'text-white'}`}>
                          {stock.currentStock}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{stock.unit}</span>
                     </div>
                  </div>
                ))
              )}
            </div>

            <div className="lg:col-span-2 bg-slate-800 rounded-[2rem] border border-slate-700 shadow-xl overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-slate-700/50 flex items-center space-x-3 bg-slate-800/80">
                <History className="text-amber-400" size={20} />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Site Usage & Purchase Logs</h3>
              </div>
              
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900/50 sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700">Date</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700">Type</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700">Material</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700">Qty</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700">Purpose / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {recentLogs.length === 0 ? (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-500 italic text-sm">No stock movements found for this site.</td></tr>
                    ) : (
                      recentLogs.map(log => {
                        const material = materials.find(m => m.id === log.materialId);
                        const isOut = log.type === 'OUT';
                        return (
                          <tr key={log.id} className="hover:bg-slate-700/20 transition-colors">
                            <td className="p-4 text-xs text-slate-400 font-mono whitespace-nowrap">{log.date}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider ${isOut ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                {isOut ? 'USED' : 'BOUGHT'}
                              </span>
                            </td>
                            <td className="p-4 text-xs font-bold text-slate-300">{material?.name || 'Unknown'}</td>
                            <td className={`p-4 text-sm font-black ${isOut ? 'text-red-400' : 'text-emerald-400'}`}>
                              {isOut ? '-' : '+'}{log.quantity} <span className="text-[9px] text-slate-500 uppercase">{material?.unit}</span>
                            </td>
                            <td className="p-4 text-xs text-slate-300 max-w-[200px] truncate" title={log.note}>
                              {log.note || (isOut ? 'Site usage' : 'Supplier delivery')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showAddModal || editingSupplier) && (
        <SupplierModal supplier={editingSupplier || undefined} onClose={() => { setShowAddModal(false); setEditingSupplier(null); }} />
      )}
      
      {showStockModal && (
        <StockInOutModal 
          type={showStockModal} 
          projectId={selectedProjectId} 
          onClose={() => setShowStockModal(null)} 
          materials={materials}
          updateMaterials={updateMaterials}
          suppliers={suppliers}
          updateInventoryLogs={updateInventoryLogs}
          addTransaction={addTransaction}
          currentUser={currentUser}
          categories={categories}
        />
      )}
    </div>
  );
};

// ==========================================
// MODAL COMPONENTS 
// ==========================================
const StockInOutModal: React.FC<any> = ({ type, projectId, onClose, materials, updateMaterials, suppliers, updateInventoryLogs, addTransaction, currentUser, categories }) => {
  const [form, setForm] = useState({
    materialId: '', quantity: '', supplierId: '', totalCost: '', note: '', date: new Date().toISOString().split('T')[0]
  });
  
  // Custom Purpose Management
  const [savedPurposes, setSavedPurposes] = useState<string[]>(() => {
    const local = localStorage.getItem('bdt_custom_purposes');
    return local ? JSON.parse(local) : [
      'ছাদ ঢালাই (Roof Casting)', 
      'কলাম ঢালাই (Column Casting)', 
      'গাঁথুনি (Brickwork)', 
      'প্লাস্টার (Plaster)', 
      'ভিত্তি ঢালাই (Foundation)',
      'গ্রেড বিম (Grade Beam)',
    ];
  });
  
  const [purpose, setPurpose] = useState(''); 
  const [showNewPurpose, setShowNewPurpose] = useState(false);
  const [newPurposeName, setNewPurposeName] = useState('');
  
  const [showNewMaterial, setShowNewMaterial] = useState(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatUnit, setNewMatUnit] = useState('Bag');

  const handleAddPurpose = () => {
    if(!newPurposeName.trim()) return;
    const updated = [...savedPurposes, newPurposeName.trim()];
    setSavedPurposes(updated);
    localStorage.setItem('bdt_custom_purposes', JSON.stringify(updated));
    setPurpose(newPurposeName.trim());
    setShowNewPurpose(false);
    setNewPurposeName('');
  };

  const handleAddMaterial = async () => {
    if (!newMatName.trim()) return;
    const newMaterial: Material = { id: `m_${Date.now()}`, name: newMatName.trim(), unit: newMatUnit };
    await updateMaterials((prev: Material[]) => [...prev, newMaterial]);
    setForm({ ...form, materialId: newMaterial.id });
    setShowNewMaterial(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.materialId || !form.quantity) return alert("Material and Quantity are required.");
    if (type === 'OUT' && !purpose && !form.note) return alert("Please specify the purpose of use.");
    
    const qty = parseFloat(form.quantity);
    const cost = parseFloat(form.totalCost) || 0;
    const material = materials.find((m: any) => m.id === form.materialId);
    
    const finalNote = type === 'OUT' ? (purpose ? `[${purpose}] ${form.note}` : form.note) : form.note;

    const logId = `inv_${Date.now()}`;
    const newLog: InventoryLog = {
      id: logId, date: form.date, projectId, type, materialId: form.materialId, quantity: qty, note: finalNote,
      ...(type === 'IN' ? { supplierId: form.supplierId, totalCost: cost, linkedTransactionId: cost > 0 ? `tx_${logId}` : undefined } : {})
    };
    await updateInventoryLogs((prev: InventoryLog[]) => [...prev, newLog]);

    if (type === 'IN' && cost > 0) {
      const supplier = suppliers.find((s: any) => s.id === form.supplierId);
      const expenseCategory = categories.find((c: any) => c.type === 'expense')?.id || ''; 
      
      await addTransaction({
        id: `tx_${logId}`,
        projectId, date: form.date, type: 'expense', amount: cost, categoryId: expenseCategory,
        accountId: AccountId.BANK, 
        description: `Purchased ${qty} ${material?.unit} of ${material?.name} from ${supplier?.name || 'Supplier'}`,
        auditUser: currentUser?.name || 'System', createdByUserId: currentUser?.id || 'sys'
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
        <div className="flex items-center space-x-3 mb-6">
          <div className={`p-3 rounded-xl ${type === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {type === 'IN' ? <PackagePlus size={24} /> : <PackageMinus size={24} />}
          </div>
          <h3 className="text-2xl font-bold font-outfit text-white tracking-tight">{type === 'IN' ? 'Receive Material' : 'Use Material (সাইটে ব্যবহার)'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Select Material</label>
              <button type="button" onClick={() => setShowNewMaterial(!showNewMaterial)} className="text-[9px] font-black text-amber-400 uppercase hover:text-amber-300">
                {showNewMaterial ? 'Cancel' : '+ Add New'}
              </button>
            </div>
            {showNewMaterial ? (
              <div className="flex gap-2">
                <input autoFocus placeholder="Name" className="flex-1 bg-slate-900 border border-amber-500/30 rounded-xl px-4 py-3 text-white outline-none" value={newMatName} onChange={e => setNewMatName(e.target.value)} />
                <input placeholder="Unit" className="w-20 bg-slate-900 border border-amber-500/30 rounded-xl px-3 py-3 text-white outline-none" value={newMatUnit} onChange={e => setNewMatUnit(e.target.value)} />
                <button type="button" onClick={handleAddMaterial} className="bg-amber-400 text-slate-950 p-3 rounded-xl"><Check size={20}/></button>
              </div>
            ) : (
              <select required value={form.materialId} onChange={e => setForm({...form, materialId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none">
                <option value="" disabled>-- Select --</option>
                {materials.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Quantity</label>
              <input required type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none font-bold" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Date</label>
              <input required type="date" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
          </div>

          {type === 'IN' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Supplier</label>
                <select value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none">
                  <option value="">-- General Market --</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Total Cost (Auto Sync)</label>
                <input type="number" step="0.01" className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-4 py-3 text-emerald-400 font-bold outline-none" placeholder="0.00" value={form.totalCost} onChange={e => setForm({...form, totalCost: e.target.value})} />
              </div>
            </>
          )}

          {/* NEW: DYNAMIC PURPOSE SELECTOR WITH ADD NEW */}
          {type === 'OUT' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest pl-1">কী কাজে ব্যবহার হচ্ছে? (Purpose)</label>
                <button type="button" onClick={() => setShowNewPurpose(!showNewPurpose)} className="text-[9px] font-black text-amber-400 uppercase hover:text-amber-300">
                  {showNewPurpose ? 'Cancel' : '+ Add New'}
                </button>
              </div>
              
              {showNewPurpose ? (
                <div className="flex gap-2">
                  <input autoFocus placeholder="e.g. Boundary Wall" className="flex-1 bg-slate-900 border border-amber-500/30 rounded-xl px-4 py-3 text-white outline-none" value={newPurposeName} onChange={e => setNewPurposeName(e.target.value)} />
                  <button type="button" onClick={handleAddPurpose} className="bg-amber-400 text-slate-950 p-3 rounded-xl"><Check size={20}/></button>
                </div>
              ) : (
                <select value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full bg-slate-900 border border-amber-500/30 rounded-xl px-4 py-3 text-white outline-none cursor-pointer">
                  <option value="">-- সিলেক্ট করুন --</option>
                  {savedPurposes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
              {type === 'IN' ? 'Note / Challan' : 'Additional Note (ঐচ্ছিক)'}
            </label>
            <input type="text" placeholder={type === 'IN' ? "Challan details..." : "২য় তলার সামনের অংশ..."} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
          </div>

          <button type="submit" className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all mt-4 ${type === 'IN' ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white hover:bg-red-600'}`}>
            Confirm {type === 'OUT' ? 'Usage' : 'Receive'}
          </button>
        </form>
      </div>
    </div>
  );
};

const SupplierModal: React.FC<any> = ({ supplier, onClose }) => {
  const { updateSuppliers } = useAppContext();
  const [form, setForm] = useState<Partial<Supplier>>(supplier || { name: '', phone: '', material: '', whatsapp: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return alert('Name is mandatory.');
    if (supplier) {
      updateSuppliers((prev: any) => prev.map((s: any) => s.id === supplier.id ? { ...s, ...form } : s));
    } else {
      updateSuppliers((prev: any) => [...prev, { id: Math.random().toString(36).substr(2, 9), ...form }]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl p-6 md:p-10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
        <h3 className="text-2xl font-bold font-outfit text-white mb-6 tracking-tight">{supplier ? 'Edit Vendor' : 'New Vendor'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Supplier Name" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input placeholder="Primary Material" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white outline-none" value={form.material} onChange={e => setForm({...form, material: e.target.value})} />
          <input placeholder="Phone" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          <button type="submit" className="w-full bg-amber-400 text-slate-900 font-black py-4 rounded-xl text-xs uppercase shadow-lg mt-4">Save</button>
        </form>
      </div>
    </div>
  );
};