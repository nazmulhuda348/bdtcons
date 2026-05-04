import React, { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { usePermissions } from '../hooks/usePermissions';
import { 
  ShoppingCart, Building, User, DollarSign, Calendar, 
  CheckCircle2, X, Search, FileText, ArrowRight, ShieldCheck, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SalesAgreement, SaleType, UnitStatus, AccountId, Transaction } from '../types';

// Structural Fix for React 19 + Framer Motion Type Conflicts
const MotionDiv = motion.div as any;
const MotionTr = motion.tr as any;

export const PropertySales: React.FC = () => {
  const { 
    salesAgreements = [], 
    updateSalesAgreements, 
    inventoryUnits = [], 
    updateInventoryUnits,
    projects, 
    clients,
    selectedProjectId,
    setSelectedProjectId,
    addTransaction,
    categories,
    currentUser
  } = useAppContext();
  
 const { isAdmin, isManager, } = usePermissions();

  const filteredProjects = projects.filter(p => {
    if (isAdmin || isManager) return true;
    const assigned = currentUser?.assignedProjects || [];
    return assigned.includes(p.id);
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Active Project Selection Fallback
  const activeProjectId = selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId;

  // Filter Agreements based on Project and Search Term
  const filteredSales = useMemo(() => {
    return salesAgreements.filter(s => {
      const matchesProject = s.projectId === activeProjectId;
      const client = clients.find(c => c.id === s.clientId);
      const matchesSearch = client?.name.toLowerCase().includes(searchTerm.toLowerCase()) || '';
      return matchesProject && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [salesAgreements, activeProjectId, searchTerm, clients]);

  // Project Metrics
  const activeProject = projects.find(p => p.id === activeProjectId);
  const totalSalesRevenue = filteredSales.reduce((sum, sale) => sum + sale.agreedPrice, 0);

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold font-outfit text-white tracking-tight flex items-center gap-3">
             <ShoppingCart className="text-emerald-400" size={32} />
             Property & Share Sales
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage client bookings, equity shares, and flat sales</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex items-center px-4 py-2 w-full sm:w-64">
             <Building className="text-emerald-400 mr-3" size={18} />
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
            className="flex items-center justify-center space-x-2 bg-emerald-500 text-slate-950 px-6 py-3 md:py-4 rounded-2xl font-black uppercase text-xs hover:bg-emerald-400 shadow-xl shadow-emerald-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <ShoppingCart size={18} /> <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-slate-800 border border-slate-700 rounded-[1.5rem] p-5 flex items-center gap-4 shadow-lg">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><DollarSign size={20} /></div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gross Sales Revenue</p>
               <p className="text-2xl font-black font-outfit text-white">${totalSalesRevenue.toLocaleString()}</p>
            </div>
         </div>
         <div className="bg-slate-800 border border-slate-700 rounded-[1.5rem] p-5 flex items-center gap-4 shadow-lg">
            <div className="p-3 bg-amber-400/10 rounded-xl text-amber-400"><FileText size={20} /></div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Agreements</p>
               <p className="text-2xl font-black font-outfit text-white">{filteredSales.length}</p>
            </div>
         </div>
         <div className="bg-slate-800 border border-slate-700 rounded-[1.5rem] p-5 flex items-center gap-4 shadow-lg">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Tag size={20} /></div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Share Price</p>
               <p className="text-2xl font-black font-outfit text-white">${(activeProject?.targetSharePrice || 0).toLocaleString()}</p>
            </div>
         </div>
      </div>

      {/* Sales Table */}
      <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 shadow-2xl p-6 md:p-8 min-h-[500px]">
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" placeholder="Search by Client Name..." 
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-14 pr-4 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none font-bold"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
                <th className="px-6 py-5">Date & ID</th>
                <th className="px-6 py-5">Client Name</th>
                <th className="px-6 py-5">Sale Type</th>
                <th className="px-6 py-5">Item Details</th>
                <th className="px-6 py-5 text-right">Agreed Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
               <AnimatePresence>
                 {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <ShoppingCart size={48} className="mb-4 opacity-20" />
                          <p className="font-bold text-sm uppercase tracking-widest">No Sales Found</p>
                          <p className="text-xs mt-1">Record a new sale to generate revenue.</p>
                        </div>
                      </td>
                    </tr>
                 ) : (
                   filteredSales.map(sale => {
                     const client = clients.find(c => c.id === sale.clientId);
                     const unit = inventoryUnits.find(u => u.id === sale.unitId);
                     
                     return (
                       <MotionTr 
                         key={sale.id}
                         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                         className="hover:bg-slate-700/20 transition-colors"
                       >
                         <td className="px-6 py-6">
                            <span className="text-xs font-mono text-slate-400 block">{sale.date}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-black">#{sale.id.substring(0,6)}</span>
                         </td>
                         <td className="px-6 py-6">
                            <span className="text-sm font-bold text-white">{client?.name || 'Unknown Client'}</span>
                         </td>
                         <td className="px-6 py-6">
                            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${sale.saleType === 'SHARE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-400/10 text-amber-400 border-amber-400/20'}`}>
                              {sale.saleType}
                            </span>
                         </td>
                         <td className="px-6 py-6">
                            {sale.saleType === 'UNIT' ? (
                               <div className="flex flex-col">
                                 <span className="text-xs font-bold text-slate-300">{unit?.unitName || 'Deleted Unit'}</span>
                                 <span className="text-[10px] text-slate-500">Flat/Shop Property</span>
                               </div>
                            ) : (
                               <div className="flex flex-col">
                                 <span className="text-xs font-bold text-slate-300">{sale.numberOfShares} Equity Shares</span>
                                 <span className="text-[10px] text-slate-500">Target Rate: ${(activeProject?.targetSharePrice || 0)}</span>
                               </div>
                            )}
                         </td>
                         <td className="px-6 py-6 text-right">
                            <span className="text-lg font-black font-outfit text-emerald-400">${sale.agreedPrice.toLocaleString()}</span>
                            {sale.downPayment ? (
                               <span className="block text-[10px] text-slate-500 mt-1 uppercase font-bold">Booking: ${sale.downPayment.toLocaleString()}</span>
                            ) : null}
                         </td>
                       </MotionTr>
                     );
                   })
                 )}
               </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <SalesModal 
          activeProjectId={activeProjectId}
          onClose={() => setShowAddModal(false)} 
        />
      )}
    </MotionDiv>
  );
};

// ==========================================
// Sales Modal
// ==========================================
const SalesModal: React.FC<{ activeProjectId: string, onClose: () => void }> = ({ activeProjectId, onClose }) => {
  const { 
    updateSalesAgreements, 
    inventoryUnits, 
    updateInventoryUnits,
    clients, 
    addTransaction,
    categories,
    currentUser,
    projects
  } = useAppContext();

  const activeProject = projects.find(p => p.id === activeProjectId);
  const availableUnits = inventoryUnits.filter(u => u.projectId === activeProjectId && u.status === UnitStatus.AVAILABLE);
  const revenueCategory = categories.find(c => c.type === 'income')?.id || '';

  const [form, setForm] = useState<Partial<SalesAgreement>>({ 
    projectId: activeProjectId,
    clientId: '',
    saleType: 'UNIT',
    date: new Date().toISOString().split('T')[0],
    unitId: '',
    numberOfShares: 1,
    agreedPrice: 0,
    downPayment: 0,
    installmentCount: 0,
    note: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculate suggested price when unit or shares change
  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>, field: string) => {
    const val = e.target.value;
    
    if (field === 'unitId') {
      const unit = availableUnits.find(u => u.id === val);
      if (unit) {
        const total = (unit.sizeSqFt * unit.ratePerSqFt) + (unit.parkingCharge || 0) + (unit.utilityCharge || 0);
        setForm({ ...form, unitId: val, agreedPrice: total });
      }
    } else if (field === 'numberOfShares') {
      const shares = parseInt(val) || 0;
      const targetRate = activeProject?.targetSharePrice || 0;
      setForm({ ...form, numberOfShares: shares, agreedPrice: shares * targetRate });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) return alert('Client Selection is mandatory.');
    if (form.saleType === 'UNIT' && !form.unitId) return alert('Please select an available unit.');
    if (form.agreedPrice! <= 0) return alert('Agreed price must be greater than 0.');

    setIsSubmitting(true);
    
    try {
      const saleId = `sale_${Date.now()}`;
      const newSale: SalesAgreement = { id: saleId, ...form } as SalesAgreement;
      
      // 1. Save Sales Agreement
      await updateSalesAgreements(prev => [...prev, newSale]);

      // 2. Update Inventory Status if it's a UNIT sale
      if (form.saleType === 'UNIT' && form.unitId) {
        await updateInventoryUnits(prev => prev.map(u => u.id === form.unitId ? { ...u, status: UnitStatus.SOLD } : u));
      }

      // 3. Auto-generate Transaction for Downpayment/Booking Money
      if (form.downPayment && form.downPayment > 0) {
        const client = clients.find(c => c.id === form.clientId);
        const itemDesc = form.saleType === 'UNIT' 
          ? `Unit: ${availableUnits.find(u => u.id === form.unitId)?.unitName}` 
          : `${form.numberOfShares} Shares`;

        const newTx: Transaction = {
          id: `tx_${Date.now()}`,
          projectId: form.projectId!,
          date: form.date!,
          description: `Booking/Downpayment for ${itemDesc} (Total Agreed: $${form.agreedPrice})`,
          amount: form.downPayment,
          categoryId: revenueCategory,
          accountId: AccountId.BANK, // Default to bank, user can adjust in ledger
          clientId: form.clientId,
          type: 'deposit',
          auditUser: currentUser?.name || 'System',
          createdByUserId: currentUser?.id || 'sys'
        };
        await addTransaction(newTx);
      }
      
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to process sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <MotionDiv initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
        
        <div className="flex items-center gap-3 mb-8">
           <div className="p-3 bg-emerald-500/10 rounded-xl"><ShoppingCart className="text-emerald-400" size={24}/></div>
           <h3 className="text-2xl font-bold font-outfit text-white tracking-tight">Record New Sale</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Select Client / Buyer</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <select required className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-emerald-400 cursor-pointer appearance-none" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}>
                 <option value="">-- Choose Client --</option>
                 {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>
          </div>

          {/* Sale Type Toggle */}
          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-700">
             <button type="button" onClick={() => setForm({...form, saleType: 'UNIT', unitId: '', agreedPrice: 0})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${form.saleType === 'UNIT' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'}`}>Property Unit</button>
             <button type="button" onClick={() => setForm({...form, saleType: 'SHARE', numberOfShares: 1, agreedPrice: activeProject?.targetSharePrice || 0})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${form.saleType === 'SHARE' ? 'bg-blue-500 text-slate-950' : 'text-slate-500'}`}>Equity Share</button>
          </div>

          {/* Item Selection based on Type */}
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50 animate-in fade-in duration-300">
             {form.saleType === 'UNIT' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-1">Available Inventory Units</label>
                  <select required className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-emerald-400 cursor-pointer" value={form.unitId} onChange={(e) => handleItemSelect(e, 'unitId')}>
                     <option value="">-- Select Flat / Shop --</option>
                     {availableUnits.map(u => <option key={u.id} value={u.id}>{u.unitName} ({u.sizeSqFt} SqFt)</option>)}
                  </select>
                  {availableUnits.length === 0 && <p className="text-[10px] text-rose-400 mt-1 pl-1">No units available in this project.</p>}
                </div>
             ) : (
                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1 pl-1">
                     <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Number of Shares</label>
                     <span className="text-[10px] text-slate-500 font-bold">Target Rate: ${activeProject?.targetSharePrice || 0}</span>
                  </div>
                  <input required type="number" min="1" className="w-full bg-slate-950 border border-blue-500/30 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-blue-400" value={form.numberOfShares} onChange={(e) => handleItemSelect(e, 'numberOfShares')} />
                </div>
             )}
          </div>

          {/* Pricing & Installments */}
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Final Agreed Price ($)</label>
               <input required type="number" min="0" step="0.01" className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-4 py-4 text-emerald-400 font-black text-lg outline-none focus:border-emerald-400" value={form.agreedPrice || ''} onChange={e => setForm({...form, agreedPrice: parseFloat(e.target.value) || 0})} />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Downpayment (Booking)</label>
               <input type="number" min="0" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-emerald-400" placeholder="Auto-adds to Ledger" value={form.downPayment || ''} onChange={e => setForm({...form, downPayment: parseFloat(e.target.value) || 0})} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Agreement Date</label>
               <input required type="date" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Total Installments</label>
               <input type="number" min="0" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" placeholder="e.g. 12" value={form.installmentCount || ''} onChange={e => setForm({...form, installmentCount: parseInt(e.target.value) || 0})} />
             </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3 mt-4">
             <ShieldCheck size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
             <p className="text-[10px] text-emerald-400/80 leading-relaxed font-bold">
               Downpayments entered here will be <span className="text-emerald-400">automatically posted</span> to the Financial Ledger as Revenue (Deposit).
             </p>
          </div>
          
          <div className="flex gap-3 pt-4">
             <button type="button" onClick={onClose} className="flex-1 bg-slate-900 text-slate-500 font-bold py-4 rounded-xl text-xs uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
             <button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-500 text-slate-950 font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
               {isSubmitting ? 'Processing...' : <><CheckCircle2 size={18}/> <span>Confirm Sale</span></>}
             </button>
          </div>
        </form>
      </MotionDiv>
    </div>
  );
};