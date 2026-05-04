import React, { useRef, useState } from 'react';
import { useAppContext } from '../AppContext';
import { Download, Upload, FileText, Database, Check, AlertCircle, Terminal, List } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { INITIAL_CATEGORIES } from '../constants';
import { Transaction } from '../types';

// Structural Fix for React 19 + Framer Motion Type Conflicts
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

  const handleJsonExport = () => {
    try {
      const exportData = { currentUser, activeProject: selectedProjectId, projects, users, transactions, clients, leads, categories };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Building_Developments_Snapshot_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error("Export failure:", err); }
  };

  // ==========================================
  // ১. Export for Ledger (Summary PDF)
  // ==========================================
  const handlePdfExport = () => {
    const doc = new jsPDF();
    const activeProject = projects.find(p => p.id === selectedProjectId);
    const projectName = activeProject ? activeProject.name : 'ENTERPRISE CONSOLIDATED';
    const timestamp = new Date().toLocaleString();
    const markup = globalMarkupOverride !== null ? globalMarkupOverride : (activeProject?.serviceMarkup || 0);

    const filteredTx = selectedProjectId === 'all' ? transactions : transactions.filter(t => t.projectId === selectedProjectId);
    const totalDeposits = filteredTx.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const rawExpenses = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalCost = rawExpenses * (1 + markup / 100);
    const netBalance = totalDeposits - totalCost;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor('#0f172a'); doc.text("FINANCIAL LEDGER AUDIT", 14, 25);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor('#64748b'); doc.text("BUILDING DEVELOPMENTS & TECHNOLOGIES", 14, 32);
    doc.setDrawColor('#e2e8f0'); doc.line(14, 38, 196, 38);

    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor('#0f172a'); doc.text("PROJECT CONTEXT:", 14, 48);
    doc.setFont('helvetica', 'normal'); doc.text(projectName.toUpperCase(), 50, 48);
    doc.setFont('helvetica', 'bold'); doc.text("REPORT TIMESTAMP:", 14, 54);
    doc.setFont('helvetica', 'normal'); doc.text(timestamp, 50, 54);

    const summaryY = 70;
    doc.setDrawColor('#10b981'); doc.setFillColor('#f0fdf4'); doc.rect(14, summaryY, 58, 25, 'FD');
    doc.setFontSize(8); doc.setTextColor('#059669'); doc.text("GROSS DEPOSITS", 19, summaryY + 8);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor('#064e3b'); doc.text(`$${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 19, summaryY + 18);

    doc.setDrawColor('#f43f5e'); doc.setFillColor('#fff1f2'); doc.rect(76, summaryY, 58, 25, 'FD');
    doc.setFontSize(8); doc.setTextColor('#e11d48'); doc.text("ADJUSTED EXPENDITURE", 81, summaryY + 8);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor('#881337'); doc.text(`$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 81, summaryY + 18);

    doc.setDrawColor('#fbbf24'); doc.setFillColor('#0f172a'); doc.rect(138, summaryY, 58, 25, 'FD');
    doc.setFontSize(8); doc.setTextColor('#fbbf24'); doc.text("NET TREASURY BALANCE", 143, summaryY + 8);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor('#ffffff'); doc.text(`$${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 143, summaryY + 18);

    const incomeData = filteredTx.filter(t => t.type === 'deposit').reduce((acc, t) => {
        const client = clients.find(c => c.id === t.clientId);
        const name = client ? client.name : 'INTERNAL REVENUE';
        acc[name] = (acc[name] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

    const incomeRows = Object.entries(incomeData).map(([name, amt]) => [name.toUpperCase(), `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);

    doc.setFontSize(10); doc.setTextColor('#0f172a'); doc.text("REVENUE ATTRIBUTION", 14, 110);
    autoTable(doc, {
      startY: 115, head: [['SOURCE ENTITY / DEPOSITOR', 'AGGREGATE VALUE']], body: incomeRows,
      headStyles: { fillColor: '#0f172a', textColor: '#fbbf24', fontStyle: 'bold', fontSize: 9 },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: '#475569' }
    });

    const expenseRows = filteredTx.filter(t => t.type === 'expense').map(t => [
        t.date,
        (categories.find(c => c.id === t.categoryId)?.name || 'MISC').toUpperCase(),
        t.description.toUpperCase(),
        `$${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    ]);

    const docWithAutoTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
    const lastY = docWithAutoTable.lastAutoTable?.finalY || 145;
    
    doc.setTextColor('#0f172a'); doc.text("EXPENDITURE LEDGER SUMMARY", 14, lastY + 15);
    autoTable(doc, {
      startY: lastY + 20, head: [['DATE', 'CATEGORY', 'DESCRIPTION', 'VALUE']], body: expenseRows,
      headStyles: { fillColor: '#0f172a', textColor: '#ffffff', fontStyle: 'bold', fontSize: 9 },
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 4, textColor: '#475569' }
    });

    doc.save(`Ledger_Report_${projectName.replace(/\s+/g, '_')}.pdf`);
  };

  // ==========================================
  // 🔴 ২. Export Detailed (PDF) - With Net Balance
  // ==========================================
  const handleDetailedPdfExport = () => {
    const doc = new jsPDF();
    const activeProject = projects.find(p => p.id === selectedProjectId);
    const projectName = activeProject ? activeProject.name : 'ENTERPRISE CONSOLIDATED';
    const timestamp = new Date().toLocaleString();

    const filteredTx = selectedProjectId === 'all' 
      ? transactions 
      : transactions.filter(t => t.projectId === selectedProjectId);

    // ক্যালকুলেশন: টোটাল ডিপোজিট, খরচ এবং ব্যালেন্স
    const totalDeposits = filteredTx.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filteredTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalDeposits - totalExpenses; // 🔴 ব্যালেন্স বের করা হলো

    // --- Header Section ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor('#0f172a');
    doc.text("DETAILED LEDGER REPORT", 14, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#64748b');
    doc.text(`PROJECT: ${projectName.toUpperCase()}`, 14, 33);
    doc.text(`DATE GENERATED: ${timestamp}`, 14, 39);
    
    doc.setDrawColor('#e2e8f0');
    doc.line(14, 44, 196, 44);

    // --- Summary Header (Total Deposit, Total Expense, Net Balance) ---
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    // Deposit (Left)
    doc.setTextColor('#059669'); // Emerald
    doc.text(`Total Deposits: $${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 53);

    // Expense (Center)
    doc.setTextColor('#e11d48'); // Rose
    doc.text(`Total Expenses: $${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 105, 53, { align: 'center' });

    // 🔴 Net Balance (Right)
    doc.setTextColor(netBalance >= 0 ? '#0284c7' : '#e11d48'); // Blue if positive, Red if negative
    doc.text(`Net Balance: $${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 196, 53, { align: 'right' });

    doc.setDrawColor('#e2e8f0');
    doc.line(14, 58, 196, 58);

    let currentY = 70;

    // ========================================
    // PART A: DEPOSITS BREAKDOWN (By Depositor)
    // ========================================
    const deposits = filteredTx.filter(t => t.type === 'deposit');
    if (deposits.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#0f172a');
      doc.text("INCOME / DEPOSITS", 14, currentY);
      currentY += 10;

      const groupedDeposits = deposits.reduce((acc, t) => {
        const client = clients.find(c => c.id === t.clientId);
        const depositorName = client ? client.name : 'INTERNAL REVENUE';
        if (!acc[depositorName]) acc[depositorName] = [];
        acc[depositorName].push(t);
        return acc;
      }, {} as Record<string, Transaction[]>);

      Object.entries(groupedDeposits).forEach(([depositorName, txs]) => {
        const depositorTotal = txs.reduce((sum, t) => sum + t.amount, 0);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#334155');
        doc.text(`Depositor: ${depositorName.toUpperCase()}`, 14, currentY);
        
        doc.setTextColor('#059669'); // Green Subtotal
        doc.text(`Subtotal: $${depositorTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 196, currentY, { align: 'right' });

        const rows = txs.map(t => [
          t.date,
          t.description.toUpperCase(),
          `$${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
          startY: currentY + 4,
          head: [['DATE', 'DESCRIPTION', 'AMOUNT']],
          body: rows,
          headStyles: { fillColor: '#059669', textColor: '#ffffff', fontStyle: 'bold', fontSize: 9 }, // Green Table Header
          styles: { font: 'helvetica', fontSize: 8, cellPadding: 4, textColor: '#334155' },
          alternateRowStyles: { fillColor: '#f0fdf4' }, // Light Green Rows
          margin: { bottom: 20 }
        });

        const docWithAutoTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
        currentY = (docWithAutoTable.lastAutoTable?.finalY || currentY) + 12;

        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
      });
    }

    // ========================================
    // PART B: EXPENSES BREAKDOWN (By Category)
    // ========================================
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY += 10;
    }

    const expenses = filteredTx.filter(t => t.type === 'expense');
    if (expenses.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#0f172a');
      doc.text("EXPENDITURES", 14, currentY);
      currentY += 10;

      const groupedExpenses = expenses.reduce((acc, t) => {
        const cat = categories.find(c => c.id === t.categoryId);
        const catName = cat ? cat.name : 'Uncategorized';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(t);
        return acc;
      }, {} as Record<string, Transaction[]>);

      Object.entries(groupedExpenses).forEach(([catName, txs]) => {
        const categoryTotal = txs.reduce((sum, t) => sum + t.amount, 0);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#334155');
        doc.text(`Category: ${catName.toUpperCase()}`, 14, currentY);
        
        doc.setTextColor('#e11d48'); // Red Subtotal
        doc.text(`Subtotal: $${categoryTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 196, currentY, { align: 'right' });

        const rows = txs.map(t => [
          t.date,
          t.description.toUpperCase(),
          `$${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
          startY: currentY + 4,
          head: [['DATE', 'ITEM DESCRIPTION', 'AMOUNT']],
          body: rows,
          headStyles: { fillColor: '#e11d48', textColor: '#ffffff', fontStyle: 'bold', fontSize: 9 }, // Red Table Header
          styles: { font: 'helvetica', fontSize: 8, cellPadding: 4, textColor: '#334155' },
          alternateRowStyles: { fillColor: '#fff1f2' }, // Light Red Rows
          margin: { bottom: 20 }
        });

        const docWithAutoTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
        currentY = (docWithAutoTable.lastAutoTable?.finalY || currentY) + 12;

        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
      });
    }

    if (deposits.length === 0 && expenses.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor('#64748b');
      doc.text("No transaction data recorded for this project yet.", 14, currentY);
    }

    // --- Footer (Page Numbers) ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor('#94a3b8');
      doc.text(
        `Building Developments & Technologies - Detailed Ledger - Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`Detailed_Ledger_${projectName.replace(/\s+/g, '_')}.pdf`);
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
    <MotionDiv 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold font-outfit text-white mb-2 leading-tight">
          Building Developments<br/>
          <span className="text-amber-400">& Technologies Forensics</span>
        </h2>
        <p className="text-slate-500">Cloud data auditing and disaster recovery terminal</p>
      </div>

      <AnimatePresence>
        {importStatus && (
          <MotionDiv 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-6 rounded-2xl flex items-center space-x-4 border ${importStatus.success ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-red-400/10 border-red-400/20 text-red-400'}`}
          >
            {importStatus.success ? <Check size={24} /> : <AlertCircle size={24} />}
            <span className="text-sm font-bold uppercase tracking-wider">{importStatus.msg}</span>
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-8 items-stretch">
        <div className="flex-1 bg-slate-800 rounded-[2rem] border border-slate-700 p-10 shadow-xl flex flex-col items-center text-center group">
          <div className="p-5 bg-amber-400/10 rounded-[1.5rem] mb-6">
             <Terminal className="text-amber-400" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Audit Generation</h3>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">Execute a comprehensive financial audit by generating an official PDF report or exporting JSON for the Python forensics engine.</p>
          
          <div className="w-full space-y-4">
             <button onClick={handlePdfExport} className="w-full bg-amber-400 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-amber-500 transition-all shadow-xl">
                <FileText size={20} />
                <span className="uppercase tracking-widest text-xs">Export for Ledger</span>
             </button>
             
             <button onClick={handleDetailedPdfExport} className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-emerald-400 transition-all shadow-xl">
                <List size={20} />
                <span className="uppercase tracking-widest text-xs">Export Detailed (PDF)</span>
             </button>

             <button onClick={handleJsonExport} className="w-full bg-slate-900 border border-slate-700 text-slate-500 font-bold py-3 rounded-2xl flex items-center justify-center space-x-2 hover:bg-slate-700 hover:text-white transition-all">
                <Download size={18} />
                <span className="uppercase tracking-widest text-[10px]">Data Snapshot (JSON)</span>
             </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-[2rem] p-10 flex flex-col items-center text-center justify-center">
          <div className="p-5 bg-blue-400/10 rounded-[1.5rem] mb-6">
             <Database className="text-blue-400" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Disaster Recovery</h3>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">Manually restore state from a previously exported JSON snapshot to recover lost context.</p>
          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-900 border border-slate-700 text-slate-300 font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-slate-700 hover:text-white transition-all">
              <Upload size={18} />
              <span className="uppercase tracking-widest text-[10px]">Manual State Restore</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />
        </div>
      </div>
    </MotionDiv>
  );
};