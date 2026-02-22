// Fix: Ensured proper method calls on jsPDF instance and correctly invoked autoTable from default export to satisfy TypeScript argument checks.
import React, { useRef, useState } from 'react';
import { useAppContext } from '../AppContext';
import { Download, Upload, FileText, Database, Check, AlertCircle, Terminal } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { INITIAL_CATEGORIES } from '../constants';

export const Backup: React.FC = () => {
  const { 
    transactions, setTransactions,
    projects, updateProjects,
    clients,
    updateClients,
    leads,
    updateLeads,
    users,
    updateUsers,
    categories,
    updateCategories,
    selectedProjectId,
    setSelectedProjectId,
    currentUser,
    setCurrentUser,
    globalMarkupOverride
  } = useAppContext();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const handleJsonExport = () => {
    try {
      const exportData = {
        currentUser,
        activeProject: selectedProjectId,
        projects,
        users,
        transactions,
        clients,
        leads,
        categories
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Building_Developments_Snapshot_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failure:", err);
    }
  };

  /**
   * REQUISITION: PREMIUM PDF AUDIT GENERATION
   * Upgraded to a "Midnight & Gold" Forensics aesthetic.
   */
  const handlePdfExport = () => {
    // Fix: Explicitly cast doc to any to allow plugin-injected methods like autoTable
    const doc = new jsPDF() as any;
    const activeProject = projects.find(p => p.id === selectedProjectId);
    const projectName = activeProject ? activeProject.name : 'ENTERPRISE CONSOLIDATED';
    const timestamp = new Date().toLocaleString();
    const markup = globalMarkupOverride !== null ? globalMarkupOverride : (activeProject?.serviceMarkup || 0);

    // Calculate Totals
    const filteredTx = selectedProjectId === 'all' 
      ? transactions 
      : transactions.filter(t => t.projectId === selectedProjectId);
      
    const totalDeposits = filteredTx.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const rawExpenses = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalCost = rawExpenses * (1 + markup / 100);
    const netBalance = totalDeposits - totalCost;

    // --- BRANDED HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    // Fix: Ensure setTextColor is correctly handled as an any-cast method
    (doc as any).setTextColor('#0f172a'); // slate-950
    doc.text("FINANCIAL AUDIT REPORT", 14, 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#64748b'); // slate-500
    doc.text("BUILDING DEVELOPMENTS & TECHNOLOGIES", 14, 32);
    
    // Header Divider
    // Fix: Using hex string for setDrawColor to ensure compatibility
    doc.setDrawColor('#e2e8f0'); // slate-200
    doc.line(14, 38, 196, 38);

    // Meta-data section
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#0f172a');
    doc.text("PROJECT CONTEXT:", 14, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(projectName.toUpperCase(), 50, 48);
    
    doc.setFont('helvetica', 'bold');
    doc.text("REPORT TIMESTAMP:", 14, 54);
    doc.setFont('helvetica', 'normal');
    doc.text(timestamp, 50, 54);

    doc.setFont('helvetica', 'bold');
    doc.text("AUTHORIZED AUDITOR:", 14, 60);
    doc.setFont('helvetica', 'normal');
    doc.text((currentUser?.name || "SYSTEM AUTO").toUpperCase(), 50, 60);

    // --- PREMIUM SUMMARY CARDS (HIGHLIGHTED) ---
    const summaryY = 75;
    
    // Card 1: Total Deposits
    doc.setDrawColor('#10b981'); // emerald-500
    doc.setFillColor('#f0fdf4'); // emerald-50
    doc.rect(14, summaryY, 58, 25, 'FD');
    doc.setFontSize(8);
    doc.setTextColor('#059669'); // emerald-600
    doc.text("GROSS DEPOSITS", 19, summaryY + 8);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#064e3b'); // emerald-900
    doc.text(`$${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 19, summaryY + 18);

    // Card 2: Total Expenses (incl markup)
    doc.setDrawColor('#f43f5e'); // rose-500
    doc.setFillColor('#fff1f2'); // rose-50
    doc.rect(76, summaryY, 58, 25, 'FD');
    doc.setFontSize(8);
    doc.setTextColor('#e11d48'); // rose-600
    doc.text("ADJUSTED EXPENDITURE", 81, summaryY + 8);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#881337'); // rose-900
    doc.text(`$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 81, summaryY + 18);

    // Card 3: NET BALANCE (GOLD HIGHLIGHT)
    doc.setDrawColor('#fbbf24'); // amber-400
    doc.setFillColor('#0f172a'); // slate-950 (Dark mode look)
    doc.rect(138, summaryY, 58, 25, 'FD');
    doc.setFontSize(8);
    doc.setTextColor('#fbbf24'); // amber-400
    doc.text("NET TREASURY BALANCE", 143, summaryY + 8);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#ffffff'); // white
    doc.text(`$${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 143, summaryY + 18);

    // --- TABLES ---
    
    // Income Table
    const incomeData = filteredTx
      .filter(t => t.type === 'deposit')
      .reduce((acc, t) => {
        const client = clients.find(c => c.id === t.clientId);
        const name = client ? client.name : 'INTERNAL REVENUE';
        acc[name] = (acc[name] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const incomeRows = Object.entries(incomeData).map(([name, amt]) => [
      name.toUpperCase(), 
      `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    ]);

    doc.setFontSize(10);
    doc.setTextColor('#0f172a');
    doc.text("REVENUE ATTRIBUTION", 14, 115);

    // Fix: Cast doc to any to access the autoTable method injected by the plugin and bypass parameter count checks.
    (doc as any).autoTable({
      startY: 120,
      head: [['SOURCE ENTITY / DEPOSITOR', 'AGGREGATE VALUE']],
      body: incomeRows,
      headStyles: { 
        fillColor: '#0f172a', 
        textColor: '#fbbf24', 
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: { fillColor: '#f8fafc' },
      styles: { 
        font: 'helvetica', 
        fontSize: 9, 
        cellPadding: 4,
        textColor: '#475569' 
      }
    });

    // Expense Table
    const expenseRows = filteredTx
      .filter(t => t.type === 'expense')
      .map(t => [
        t.date,
        (categories.find(c => c.id === t.categoryId)?.name || 'MISC').toUpperCase(),
        t.description.toUpperCase(),
        `$${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      ]);

    doc.setTextColor('#0f172a');
    // Fix: Safely access lastAutoTable via any-casting to retrieve finalY for vertical spacing.
    const lastY = (doc as any).lastAutoTable?.finalY || 150;
    doc.text("EXPENDITURE LEDGER", 14, lastY + 15);

    // Fix: Cast doc to any to access the autoTable method injected by the plugin and bypass parameter count checks.
    (doc as any).autoTable({
      startY: lastY + 20,
      head: [['DATE', 'CATEGORY', 'DESCRIPTION', 'VALUE']],
      body: expenseRows,
      headStyles: { 
        fillColor: '#0f172a', 
        textColor: '#ffffff', 
        fontStyle: 'bold', 
        fontSize: 9
      },
      styles: { 
        font: 'helvetica', 
        fontSize: 8, 
        cellPadding: 4,
        textColor: '#475569'
      },
      alternateRowStyles: { fillColor: '#f8fafc' }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor('#94a3b8'); // slate-400
      // Fix: Use any-cast for internal property access to safely retrieve page dimensions.
      const pageWidth = (doc as any).internal.pageSize.width || 210;
      const pageHeight = (doc as any).internal.pageSize.height || 297;
      doc.text(
        `Building Developments & Technologies - Proprietary Financial Forensic Audit - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    doc.save(`Audit_Report_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
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
    <motion.div 
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
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-6 rounded-2xl flex items-center space-x-4 border ${importStatus.success ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-red-400/10 border-red-400/20 text-red-400'}`}
          >
            {importStatus.success ? <Check size={24} /> : <AlertCircle size={24} />}
            <span className="text-sm font-bold uppercase tracking-wider">{importStatus.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-8 items-stretch">
        {/* PDF & Python Forensics Node */}
        <div className="flex-1 bg-slate-800 rounded-[2rem] border border-slate-700 p-10 shadow-xl flex flex-col items-center text-center group">
          <div className="p-5 bg-amber-400/10 rounded-[1.5rem] mb-6">
             <Terminal className="text-amber-400" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Audit Generation</h3>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">Execute a comprehensive financial audit by generating an official PDF report or exporting JSON for the Python forensics engine.</p>
          <div className="w-full space-y-4">
             <button onClick={handlePdfExport} className="w-full bg-amber-400 text-slate-900 font-black py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-amber-500 transition-all shadow-xl">
                <FileText size={20} />
                <span className="uppercase tracking-widest text-xs">Export for Audit (PDF)</span>
             </button>
             <button onClick={handleJsonExport} className="w-full bg-slate-900 border border-slate-700 text-slate-500 font-bold py-3 rounded-2xl flex items-center justify-center space-x-2 hover:bg-slate-700 transition-all">
                <Download size={18} />
                <span className="uppercase tracking-widest text-[10px]">Data Snapshot (JSON)</span>
             </button>
          </div>
        </div>

        {/* Disaster Recovery Node */}
        <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-[2rem] p-10 flex flex-col items-center text-center justify-center">
          <div className="p-5 bg-blue-400/10 rounded-[1.5rem] mb-6">
             <Database className="text-blue-400" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Disaster Recovery</h3>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">Manually restore state from a previously exported JSON snapshot to recover lost context.</p>
          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-900 border border-slate-700 text-slate-300 font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-slate-700 transition-all">
              <Upload size={18} />
              <span className="uppercase tracking-widest text-[10px]">Manual State Restore</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />
        </div>
      </div>
    </motion.div>
  );
};