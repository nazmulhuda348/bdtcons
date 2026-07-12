import React, { useRef, useState } from 'react';
import { useAppContext } from '../AppContext';
import { Download, Upload, FileText, Database, Check, AlertCircle, Terminal, Filter, List, PieChart } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { INITIAL_CATEGORIES } from '../constants';

const MotionDiv = motion.div as any;

export const Backup: React.FC = () => {
  const { 
    transactions, setTransactions,
    projects, updateProjects,
    clients, updateClients,
    leads, updateLeads,
    users, updateUsers,
    categories, updateCategories,
    selectedProjectId, setSelectedProjectId,
    currentUser, setCurrentUser,
    globalMarkupOverride
  } = useAppContext();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Filters State
  const [startDate, setStartDate] = useState<string>('2026-06-19');
  const [endDate, setEndDate] = useState<string>('2026-07-09');
  const [transactionType, setTransactionType] = useState<string>('all'); 
  const [selectedDepositor, setSelectedDepositor] = useState<string>('all');
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string>('all');

  const handleJsonExport = () => {
    try {
      const exportData = {
        currentUser, activeProject: selectedProjectId,
        projects, users, transactions, clients, leads, categories
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Snapshot_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failure:", err);
    }
  };

  const getFilteredData = () => {
    let filteredTx = selectedProjectId === 'all' 
      ? transactions 
      : transactions.filter(t => t.projectId === selectedProjectId);
      
    if (startDate) filteredTx = filteredTx.filter(t => new Date(t.date) >= new Date(startDate));
    if (endDate) filteredTx = filteredTx.filter(t => new Date(t.date) <= new Date(endDate));
    
    if (transactionType !== 'all') {
      filteredTx = filteredTx.filter(t => t.type === transactionType);
    }
    if (selectedDepositor !== 'all') {
      filteredTx = filteredTx.filter(t => t.type !== 'deposit' || t.clientId === selectedDepositor);
    }
    if (selectedExpenseCategory !== 'all') {
      filteredTx = filteredTx.filter(t => t.type !== 'expense' || t.categoryId === selectedExpenseCategory);
    }

    const activeProject = projects.find(p => p.id === selectedProjectId);
    const markup = globalMarkupOverride !== null ? globalMarkupOverride : (activeProject?.serviceMarkup || 0);
    const projectName = activeProject ? activeProject.name : 'ENTERPRISE CONSOLIDATED';
    
    return { filteredTx, markup, projectName };
  };

  const drawWatermarkAndFooter = (doc: jsPDF, projectName: string) => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // 1. PROJECT NAME WATERMARK
      try {
        doc.setGState(new (doc as any).GState({opacity: 0.05})); 
        doc.setFontSize(55);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 150, 150);
        doc.text(projectName.toUpperCase(), pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
        doc.setGState(new (doc as any).GState({opacity: 1}));
      } catch(e) {
        console.error("Watermark generation failed", e);
      }

      // 2. PROJECT NAME FOOTER
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `${projectName.toUpperCase()} - Detailed Ledger - Page ${i} of ${pageCount}`, 
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  };

  /**
   * 1. EXPORT FOR LEDGER (Standard Format)
   */
  const handleLedgerPdfExport = () => {
    const { filteredTx, markup, projectName } = getFilteredData();
    const doc = new jsPDF();
    
    const totalDeposits = filteredTx.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const rawExpenses = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalCost = rawExpenses * (1 + markup / 100);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor('#0f172a');
    doc.text("FINANCIAL LEDGER REPORT", 14, 25);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor('#64748b');
    doc.text(`PROJECT: ${projectName.toUpperCase()}`, 14, 32);
    doc.setDrawColor('#e2e8f0'); doc.line(14, 38, 196, 38);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor('#0f172a');
    doc.text("DATE GENERATED:", 14, 48); doc.setFont('helvetica', 'normal'); doc.text(new Date().toLocaleString(), 50, 48);

    const ledgerRows = filteredTx.map(t => [
      t.date,
      t.type.toUpperCase(),
      (categories.find(c => c.id === t.categoryId)?.name || 'MISC').toUpperCase(),
      t.description.toUpperCase(),
      `$${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    ]);

    doc.setFontSize(10); doc.setTextColor('#0f172a'); doc.text("TRANSACTION LEDGER", 14, 60);

    if (ledgerRows.length > 0) {
      autoTable(doc, {
        startY: 65,
        head: [['DATE', 'TYPE', 'CATEGORY/SOURCE', 'DESCRIPTION', 'AMOUNT']],
        body: ledgerRows,
        headStyles: { fillColor: '#0f172a', textColor: '#ffffff', fontStyle: 'bold', fontSize: 9 },
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 4 },
        alternateRowStyles: { fillColor: '#f8fafc' }
      });
    }

    drawWatermarkAndFooter(doc, projectName);
    doc.save(`Ledger_Report_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  /**
   * 2. EXPORT FOR DETAILED (Matched EXACTLY to provided images: Colored headers & Project name watermark)
   */
  const handleDetailedPdfExport = () => {
    const { filteredTx, markup, projectName } = getFilteredData();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;
    const marginLeft = 14;
    const marginRight = pageWidth - 14;

    const totalDeposits = filteredTx.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const rawExpenses = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalCost = rawExpenses * (1 + markup / 100);
    const netBalance = totalDeposits - totalCost;

    // --- EXACT HEADER MATCH (From Image) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(20, 30, 40); // Dark Slate
    doc.text("DETAILED LEDGER REPORT", marginLeft, currentY); 
    
    currentY += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Gray
    doc.text(`PROJECT: ${projectName.toUpperCase()}`, marginLeft, currentY); 
    
    currentY += 5;
    doc.text(`DATE GENERATED: ${new Date().toLocaleString()}`, marginLeft, currentY); 
    
    currentY += 8;
    doc.setFont('helvetica', 'bold');
    
    // Total Deposits (Green)
    doc.setTextColor(11, 154, 90); // Exact Green from image
    doc.text(`Total Deposits: $${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, marginLeft, currentY);
    
    // Total Expenses (Red)
    doc.setTextColor(216, 31, 74); // Exact Red from image
    doc.text(`Total Expenses: $${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 75, currentY);
    
    // Net Balance (Blue)
    doc.setTextColor(20, 133, 198); // Exact Blue from image
    doc.text(`Net Balance: $${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 145, currentY);
    
    currentY += 15;

    // Helper to check page break
    const checkPageBreak = (neededSpace: number) => {
        if (currentY + neededSpace > 275) {
            doc.addPage();
            currentY = 20;
        }
    };

    // --- INCOME/DEPOSITS SECTION ---
    const deposits = filteredTx.filter(t => t.type === 'deposit');
    if (deposits.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 30, 40);
      doc.text("INCOME / DEPOSITS", marginLeft, currentY); 
      currentY += 8;

      const clientsMap = new Map<string, typeof transactions>();
      deposits.forEach(d => {
          const cName = clients.find(c => c.id === d.clientId)?.name || 'INTERNAL REVENUE';
          if (!clientsMap.has(cName)) clientsMap.set(cName, []);
          clientsMap.get(cName)!.push(d);
      });

      clientsMap.forEach((txs, cName) => {
          checkPageBreak(30);
          const subtotal = txs.reduce((sum, t) => sum + t.amount, 0);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(20, 30, 40);
          doc.text(`Depositor: ${cName.toUpperCase()}`, marginLeft, currentY); 
          
          // Subtotal aligned to right (Green)
          doc.setTextColor(11, 154, 90); 
          doc.text(`Subtotal: $${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, marginRight, currentY, { align: 'right' });
          currentY += 3;
          
          const rows = txs.map(t => [
              t.date,
              t.description.toUpperCase(),
              `$${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
          ]);

          autoTable(doc, {
              startY: currentY,
              head: [['DATE', 'DESCRIPTION', 'AMOUNT']], 
              body: rows,
              theme: 'plain', 
              headStyles: { fillColor: '#0b9a5a', textColor: '#ffffff', fontStyle: 'bold', fontSize: 9 }, // Green Header
              alternateRowStyles: { fillColor: '#f4fdf8' }, // Very faint green alternating row
              styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, textColor: 0 },
              columnStyles: { 
                  0: { cellWidth: 35 },
                  2: { halign: 'right', cellWidth: 40 } 
              }
          });
          
          const docWithAutoTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
          currentY = (docWithAutoTable.lastAutoTable?.finalY || currentY) + 12;
      });
    }

    // --- EXPENDITURES SECTION ---
    const expenses = filteredTx.filter(t => t.type === 'expense');
    if (expenses.length > 0) {
      checkPageBreak(25);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 30, 40);
      doc.text("EXPENDITURES", marginLeft, currentY); 
      currentY += 8;

      const catMap = new Map<string, typeof transactions>();
      expenses.forEach(e => {
          const catName = categories.find(c => c.id === e.categoryId)?.name || 'UNCATEGORIZED';
          if (!catMap.has(catName)) catMap.set(catName, []);
          catMap.get(catName)!.push(e);
      });

      catMap.forEach((txs, catName) => {
          checkPageBreak(30);
          const subtotal = txs.reduce((sum, t) => sum + t.amount, 0);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(20, 30, 40);
          doc.text(`Category: ${catName.toUpperCase()}`, marginLeft, currentY); 
          
          // Subtotal aligned to right (Red)
          doc.setTextColor(216, 31, 74); 
          doc.text(`Subtotal: $${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, marginRight, currentY, { align: 'right' });
          currentY += 3;
          
          const rows = txs.map(t => [
              t.date,
              t.description.toUpperCase(),
              `$${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
          ]);

          autoTable(doc, {
              startY: currentY,
              head: [['DATE', 'ITEM DESCRIPTION', 'AMOUNT']], 
              body: rows,
              theme: 'plain', 
              headStyles: { fillColor: '#d81f4a', textColor: '#ffffff', fontStyle: 'bold', fontSize: 9 }, // Red Header
              alternateRowStyles: { fillColor: '#fff1f2' }, // Very faint red alternating row
              styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, textColor: 0 },
              columnStyles: { 
                  0: { cellWidth: 35 },
                  2: { halign: 'right', cellWidth: 40 } 
              }
          });
          
          const docWithAutoTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
          currentY = (docWithAutoTable.lastAutoTable?.finalY || currentY) + 12;
      });
    }

    // Draw dynamically named watermark & footer
    drawWatermarkAndFooter(doc, projectName);

    doc.save(`Detailed_Ledger_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setCurrentUser(data.currentUser || null);
        setSelectedProjectId(String(data.activeProject || 'all'));
        updateClients(data.clients || []);
        updateLeads(data.leads || []);
        updateCategories(data.categories || INITIAL_CATEGORIES);
        updateProjects(data.projects || []);
        updateUsers(data.users || []);
        setTransactions(data.transactions || []);
        setImportStatus({ success: true, msg: 'Snapshot successfully restored.' });
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err) {
        setImportStatus({ success: false, msg: 'File Parse Error.' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <MotionDiv initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold font-outfit text-white mb-2 leading-tight">
          Building Developments<br/><span className="text-amber-400">& Technologies Forensics</span>
        </h2>
        <p className="text-slate-500">Cloud data auditing and disaster recovery terminal</p>
      </div>

      <AnimatePresence>
        {importStatus && (
          <MotionDiv 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`p-6 rounded-2xl flex items-center space-x-4 border ${importStatus.success ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-red-400/10 border-red-400/20 text-red-400'}`}
          >
            {importStatus.success ? <Check size={24} /> : <AlertCircle size={24} />}
            <span className="text-sm font-bold uppercase tracking-wider">{importStatus.msg}</span>
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-8 items-stretch">
        {/* PDF Export Node */}
        <div className="flex-1 bg-slate-800 rounded-[2rem] border border-slate-700 p-8 shadow-xl flex flex-col group">
          <div className="flex items-center space-x-4 mb-6">
             <div className="p-4 bg-amber-400/10 rounded-2xl"><Terminal className="text-amber-400" size={32} /></div>
             <div>
               <h3 className="text-xl font-bold text-white">Audit Generation</h3>
               <p className="text-xs text-slate-500">Generate formatted PDF reports</p>
             </div>
          </div>
          
          {/* --- FILTER SECTION --- */}
          <div className="w-full bg-slate-900/50 p-5 rounded-2xl border border-slate-700 mb-6 space-y-4">
            <div className="flex items-center text-amber-400 mb-2 space-x-2">
              <Filter size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Audit Filters</span>
            </div>
            
            {/* Date Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold pl-1">Start Date</label>
                <input 
                  type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-white text-xs mt-1 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold pl-1">End Date</label>
                <input 
                  type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-white text-xs mt-1 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="w-full">
              <label className="text-[10px] text-blue-400 uppercase font-bold pl-1">Transaction Type</label>
              <select 
                value={transactionType} onChange={(e) => setTransactionType(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-white text-xs mt-1 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Transactions (Consolidated)</option>
                <option value="deposit">Only Deposits (Income)</option>
                <option value="expense">Only Expenses</option>
              </select>
            </div>

            {/* Deposit and Expense Detailed Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className={`text-[10px] uppercase font-bold pl-1 ${transactionType === 'expense' ? 'text-slate-600' : 'text-emerald-500'}`}>Target Depositor</label>
                <select 
                  value={selectedDepositor} 
                  onChange={(e) => setSelectedDepositor(e.target.value)}
                  disabled={transactionType === 'expense'}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-white text-xs mt-1 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <option value="all">All Depositors</option>
                  {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </div>

              <div className="flex-1">
                <label className={`text-[10px] uppercase font-bold pl-1 ${transactionType === 'deposit' ? 'text-slate-600' : 'text-rose-500'}`}>Target Category</label>
                <select 
                  value={selectedExpenseCategory} 
                  onChange={(e) => setSelectedExpenseCategory(e.target.value)}
                  disabled={transactionType === 'deposit'}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-white text-xs mt-1 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          {/* --- END OF FILTER SECTION --- */}

          {/* --- EXPORT BUTTONS --- */}
          <div className="w-full space-y-3 mt-auto">
             <button onClick={handleLedgerPdfExport} className="w-full bg-amber-400 text-slate-900 font-black py-4 rounded-xl flex items-center justify-center space-x-2 hover:bg-amber-500 transition-all shadow-lg">
                <List size={18} />
                <span className="uppercase tracking-widest text-xs">Export for Ledger</span>
             </button>
             <button onClick={handleDetailedPdfExport} className="w-full bg-emerald-500 text-slate-900 font-black py-4 rounded-xl flex items-center justify-center space-x-2 hover:bg-emerald-600 transition-all shadow-lg">
                <PieChart size={18} />
                <span className="uppercase tracking-widest text-xs">Export Detailed Ledger</span>
             </button>
             <button onClick={handleJsonExport} className="w-full bg-slate-900 border border-slate-700 text-slate-500 font-bold py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-slate-700 transition-all mt-2">
                <Download size={16} />
                <span className="uppercase tracking-widest text-[10px]">Data Snapshot (JSON)</span>
             </button>
          </div>
        </div>

        {/* Disaster Recovery Node */}
        <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-[2rem] p-10 flex flex-col items-center text-center justify-center">
          <div className="p-5 bg-blue-400/10 rounded-[1.5rem] mb-6"><Database className="text-blue-400" size={40} /></div>
          <h3 className="text-2xl font-bold text-white mb-3">Disaster Recovery</h3>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">Manually restore state from a previously exported JSON snapshot to recover lost context.</p>
          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-900 border border-slate-700 text-slate-300 font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-slate-700 transition-all">
              <Upload size={18} />
              <span className="uppercase tracking-widest text-[10px]">Manual State Restore</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />
        </div>
      </div>
    </MotionDiv>
  );
};