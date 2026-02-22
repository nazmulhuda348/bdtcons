import React, { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Trash2, 
  Save, 
  ChevronRight,
  Database,
  ArrowDownRight,
  ArrowUpRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AccountId, Transaction } from '../types';

export const SmartSync: React.FC = () => {
  const { addTransaction, projects, categories, clients, selectedProjectId, currentUser } = useAppContext();
  const [inputText, setInputText] = useState('');
  const [previewTransactions, setPreviewTransactions] = useState<Transaction[]>([]);
  const [feedback, setFeedback] = useState<{ count: number, error: boolean } | null>(null);

  const findBestMatch = (text: string, list: any[]) => {
    const normalizedText = text.toLowerCase();
    return list.find(item => normalizedText.includes(item.name.toLowerCase()));
  };

  const processText = () => {
    const lines = inputText.split('\n').filter(l => l.trim().length > 0);
    const results: Transaction[] = [];
    
    // Default Fallbacks
    const fallbackIncomeCat = categories.find(c => c.type === 'income')?.id || null;
    const fallbackExpenseCat = categories.find(c => c.type === 'expense')?.id || null;

    const regex = /(\d{1,2}\.\d{1,2}\.\d{4})\s*(.*?)\s*(\d+(?:\.\d{1,2})?)$/;

    lines.forEach(line => {
      const match = line.match(regex);
      if (match) {
        const [_, dateStr, desc, amtStr] = match;
        const [day, month, year] = dateStr.split('.');
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const amount = parseFloat(amtStr);
        
        let isDeposit = desc.toLowerCase().includes('deposit') || 
                        desc.toLowerCase().includes('income') || 
                        desc.toLowerCase().includes('depositor:');

        let finalDescription = desc;
        let matchedClientId: string | null = null;
        let matchedCategoryId: string | null = null;

        if (isDeposit) {
          if (desc.toLowerCase().includes('depositor:')) {
            const rawName = desc.replace(/depositor:/i, '').trim();
            const clientMatch = findBestMatch(rawName, clients);
            
            if (clientMatch) {
              matchedClientId = clientMatch.id;
              finalDescription = clientMatch.name;
            } else {
              finalDescription = rawName;
            }
          } else {
            const clientMatch = findBestMatch(desc, clients);
            if (clientMatch) {
              matchedClientId = clientMatch.id;
              finalDescription = clientMatch.name;
            }
          }
          matchedCategoryId = fallbackIncomeCat;
        } else {
          const categoryMatch = findBestMatch(desc, categories);
          matchedCategoryId = categoryMatch ? categoryMatch.id : fallbackExpenseCat;
          finalDescription = desc;
        }

        results.push({
          id: Math.random().toString(36).substr(2, 9),
          date: isoDate,
          description: finalDescription,
          amount: amount,
          projectId: selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId,
          categoryId: matchedCategoryId || '', // Will fail if '' so fallback to '' but logic ensures choice
          accountId: AccountId.BANK,
          clientId: matchedClientId,
          type: isDeposit ? 'deposit' : 'expense',
          auditUser: currentUser?.name || 'System Auto',
          createdByUserId: currentUser?.id || 'system'
        });
      }
    });

    if (results.length > 0) {
      setPreviewTransactions(results);
      setFeedback(null);
    } else {
      setFeedback({ count: 0, error: true });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const commitTransactions = () => {
    previewTransactions.forEach(tx => addTransaction(tx));
    setFeedback({ count: previewTransactions.length, error: false });
    setPreviewTransactions([]);
    setInputText('');
    setTimeout(() => setFeedback(null), 5000);
  };

  const removeFromPreview = (id: string) => {
    setPreviewTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 shadow-2xl p-8 relative overflow-hidden">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-amber-400/10 rounded-2xl border border-amber-400/10">
                <Terminal className="text-amber-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-outfit text-white">Input Buffer</h2>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Natural Text Ingestion</p>
              </div>
            </div>

            <textarea 
              rows={12}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white font-mono text-xs focus:ring-4 focus:ring-amber-400/20 outline-none transition-all placeholder:text-slate-700 resize-none"
              placeholder={`23.02.2025depositor:sarwar hossain7850\n16.01.2024 Cement purchase 1200`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <div className="mt-6 flex gap-4">
              <button 
                onClick={processText}
                className="flex-1 bg-amber-400 text-slate-950 font-black py-4 rounded-xl hover:bg-amber-500 transition-all shadow-xl shadow-amber-400/10 flex items-center justify-center space-x-3 uppercase tracking-[0.2em] text-[10px]"
              >
                <Sparkles size={16} />
                <span>Parse Buffer</span>
              </button>
              {previewTransactions.length > 0 && (
                <button 
                  onClick={() => setPreviewTransactions([])}
                  className="px-4 py-4 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <AnimatePresence>
              {feedback && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-6 flex items-center space-x-4 p-4 rounded-xl border ${feedback.error ? 'bg-red-400/10 text-red-400 border-red-400/20' : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'}`}
                >
                  {feedback.error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {feedback.error ? 'Buffer Parse Error' : `Successfully committed ${feedback.count} entries`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Database size={12} />
               <span>Matching Logic Active</span>
             </h4>
             <ul className="space-y-3 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
               <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-amber-400" /> keyword "depositor:" triggers name extraction</li>
               <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400" /> auto-matching with Client Registry</li>
               <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-400" /> handles compact data formats</li>
             </ul>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 shadow-2xl h-full flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-400/10 rounded-2xl"><Save className="text-emerald-400" size={24} /></div>
                <div>
                  <h3 className="text-xl font-bold text-white font-outfit">Review Pipeline</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Confirm Smart-Matched Data</p>
                </div>
              </div>
              {previewTransactions.length > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                  {previewTransactions.length} Pending
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {previewTransactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-30">
                   <Terminal size={64} className="mb-6" />
                   <p className="text-sm font-medium italic">Parsed entries will appear here for audit review.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-700">
                      <th className="px-6 py-4">Context</th>
                      <th className="px-6 py-4">Details</th>
                      <th className="px-6 py-4">Mapped Entity</th>
                      <th className="px-6 py-4 text-right">Value</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {previewTransactions.map((tx) => (
                      <motion.tr 
                        key={tx.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="hover:bg-slate-700/20 transition-colors group"
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                           <div className="flex flex-col">
                             <span className="text-[10px] text-slate-300 font-mono">{tx.date}</span>
                             <span className={`text-[8px] font-black uppercase ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-amber-400'}`}>
                               {tx.type}
                             </span>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs text-white font-bold truncate max-w-[120px]">{tx.description}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col space-y-1">
                             <span className={`text-[9px] font-black px-2 py-0.5 rounded-md w-fit border ${tx.clientId ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-slate-900 text-slate-600 border-slate-700'}`}>
                               {clients.find(c => c.id === tx.clientId)?.name || 'Direct Revenue'}
                             </span>
                             <span className="text-[9px] font-bold text-slate-500">
                               {categories.find(c => c.id === tx.categoryId)?.name || 'Uncategorized'}
                             </span>
                          </div>
                        </td>
                        <td className={`px-6 py-5 text-right font-black font-outfit ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-slate-100'}`}>
                          ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-5">
                          <button 
                            onClick={() => removeFromPreview(tx.id)}
                            className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-8 border-t border-slate-700 bg-slate-900/50">
               <button 
                disabled={previewTransactions.length === 0}
                onClick={commitTransactions}
                className="w-full bg-emerald-500 text-slate-950 font-black py-5 rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-3 uppercase tracking-[0.2em] text-xs disabled:opacity-20 disabled:cursor-not-allowed"
               >
                 <CheckCircle2 size={18} />
                 <span>Commit All to Ledger</span>
               </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};