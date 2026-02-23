import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { usePermissions } from '../hooks/usePermissions';
import { 
  LayoutDashboard, BookOpen, BarChart2, Settings, LogOut, Menu,
  Database, Search, Users, Wallet, UserCircle, Truck, MessageSquare, X, DollarSign, PlusCircle, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { setCurrentUser } = useAppContext();
  const { isAdmin, isManager, currentUser, hasPermission } = usePermissions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Client Registry রিমুভ করে বাকি মেনুর আইটেমগুলো রাখা হয়েছে
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'ledger', label: 'Ledger', icon: BookOpen, visible: true }, 
    { id: 'deposit', label: 'Deposit & Receipt', icon: DollarSign, visible: hasPermission('deposit_receipt') },
    
    { id: 'treasury', label: 'Cash Management', icon: Wallet, visible: hasPermission('cash_management') },
    { id: 'partners', label: 'Partners', icon: UserCircle, visible: hasPermission('partners') },
    { id: 'sync', label: 'Smart Sync', icon: PlusCircle, visible: hasPermission('smart_sync') },
    
    { id: 'suppliers', label: 'Suppliers', icon: Truck, visible: isAdmin || isManager }, 
    { id: 'leads', label: 'Lead Pipeline', icon: Search, visible: hasPermission('leads_pipeline') },
    { id: 'marketing', label: 'Marketing', icon: MessageSquare, visible: hasPermission('marketing') },
    
    { id: 'insights', label: 'Insights', icon: BarChart2, visible: true },
    { id: 'admin', label: 'Admin Panel', icon: Settings, visible: hasPermission('admin_panel') },
    { id: 'backup', label: 'Backup', icon: Database, visible: isAdmin },
  ];

  const visibleNavItems = navItems.filter(item => item.visible);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const userRole = (currentUser?.role || 'GUEST').toString().toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-300 overflow-hidden">
      {/* SIDEBAR - DESKTOP & MOBILE DRAWER */}
      <AnimatePresence>
        {(mobileMenuOpen || window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed inset-y-0 left-0 z-[70] w-[280px] bg-slate-900 border-r border-slate-800 md:relative md:translate-x-0 h-full`}
          >
            <div className="flex flex-col h-full w-full">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold font-outfit text-white tracking-tight leading-tight">
                    Building Developments <br/>
                    <span className="text-amber-400">& Technologies.</span>
                  </h1>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-2 text-slate-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
                {visibleNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all group ${
                          isActive 
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-xl shadow-amber-400/10' 
                            : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                        }`}
                      >
                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-sm uppercase tracking-widest">{item.label}</span>
                      </button>
                    );
                  })}
              </nav>

              <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center space-x-4 p-4 bg-slate-800/50 rounded-2xl mb-4 border border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg flex-shrink-0">
                    {currentUser?.name?.charAt(0) || '?'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{currentUser?.name || 'User'}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest truncate">{userRole}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-400/10 rounded-2xl transition-all"
                >
                  <LogOut size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* RESPONSIVE HEADER */}
        <header className="h-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <button className="md:hidden p-2 text-slate-400 hover:bg-slate-900 rounded-lg" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <ProjectSelector />
          </div>

          <div className="flex items-center space-x-2 md:space-x-6">
            <div className="hidden lg:flex items-center space-x-3 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">
               <Search size={18} />
               <span className="text-xs font-bold tracking-widest uppercase">Search</span>
            </div>
            <div className="w-px h-6 bg-slate-800 hidden lg:block" />
            <div className="flex items-center space-x-2">
               <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
               <span className="hidden sm:inline text-[10px] font-bold text-slate-500 uppercase tracking-widest">Node: Online</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE VIEWPORT */}
        <div className="p-4 md:p-8 lg:p-12 overflow-y-auto flex-1 custom-scrollbar">
          <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
             >
               {children}
             </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-[60] md:hidden backdrop-blur-sm" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

const ProjectSelector: React.FC = () => {
  const { projects, selectedProjectId, setSelectedProjectId } = useAppContext();
  const { isAdmin, isManager, currentUser } = usePermissions();

  const filteredProjects = projects.filter(p => {
    if (isAdmin || isManager) return true;
    const assigned = currentUser?.assignedProjects || [];
    return assigned.includes(p.id);
  });

  return (
    <div className="flex items-center space-x-2 md:space-x-4">
      <div className="hidden sm:block">
         <div className="flex items-center space-x-2 text-amber-400">
            <Database size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Context</span>
         </div>
      </div>
      <select 
        value={selectedProjectId}
        onChange={(e) => setSelectedProjectId(e.target.value)}
        className="bg-slate-900 border border-slate-800 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-xl focus:ring-2 focus:ring-amber-400 block w-full max-w-[180px] md:max-w-[280px] px-2 md:px-4 py-2 md:py-3 cursor-pointer transition-all outline-none shadow-xl shadow-black/20"
      >
        <option value="all">Enterprise Global View</option>
        {filteredProjects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
};