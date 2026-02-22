import React, { useState } from 'react';
import { AppProvider, useAppContext } from './AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Ledger } from './components/Ledger';
import { Leads } from './components/Leads';
import { Insights } from './components/Insights';
import { AdminPanel } from './components/AdminPanel';
import { SmartSync } from './components/SmartSync';
import { Backup } from './components/Backup';
import { CashManagement } from './components/CashManagement';
import { PartnerManagement } from './components/PartnerManagement';
import { Suppliers } from './components/Suppliers';
import { MarketingAutomation } from './components/MarketingAutomation';
import { MoneyDeposit } from './components/MoneyDeposit';
import { Lock, User as UserIcon, ShieldAlert, Loader2, Database } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const { users, setCurrentUser, isLoading } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isLoading) return;

    const cleanInputUsername = username.trim().toLowerCase();
    const cleanInputPassword = password.trim();

    // Verify against the cloud-synced user registry
    const user = users.find(u => u.username.trim().toLowerCase() === cleanInputUsername);

    if (user && String(user.password).trim() === cleanInputPassword) {
      setCurrentUser(user);
    } else {
      setError('Invalid security credentials. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-96 h-96 bg-amber-400/10 rounded-full blur-[120px]" />
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-10 shadow-2xl relative z-10 border-t-amber-400/20">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-slate-800 rounded-3xl mb-4 border border-slate-700 shadow-xl">
             <h1 className="text-2xl font-bold font-outfit text-white leading-tight">
               Building Developments<br/>
               <span className="text-amber-400">& Technologies.</span>
             </h1>
          </div>
          <h2 className="text-xl font-bold text-white font-outfit">Enterprise Terminal</h2>
          <p className="text-slate-500 mt-2 text-sm">Authentication Protocol Required</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Ident Code (Username)</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                type="text" 
                required
                disabled={isLoading}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-amber-400 outline-none transition-all disabled:opacity-50"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Security Key (Password)</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                type="password" 
                required
                disabled={isLoading}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-amber-400 outline-none transition-all disabled:opacity-50"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <div className="flex items-center space-x-3 text-red-400 bg-red-400/5 border border-red-400/10 p-4 rounded-2xl">
              <ShieldAlert size={20} className="flex-shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
            </div>
          )}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-400 text-slate-900 font-black py-4 rounded-2xl hover:bg-amber-500 transition-all shadow-xl text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            <span>{isLoading ? 'Synchronizing Node...' : 'Initialize Session'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'deposit': return <MoneyDeposit />; // <--- এই নতুন লাইনটি এখানে যোগ করুন
      case 'ledger': return <Ledger />;
      case 'treasury': return <CashManagement />;
      case 'partners': return <PartnerManagement />;
      case 'suppliers': return <Suppliers />;
      case 'leads': return <Leads />;
      case 'marketing': return <MarketingAutomation />;
      case 'insights': return <Insights />;
      case 'admin': return <AdminPanel />;
      case 'sync': return <SmartSync />;
      case 'backup': return <Backup />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useAppContext();

  // Global loading guard for initial handshake
  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Database size={64} className="text-amber-400 animate-pulse" />
          <Loader2 size={24} className="text-white animate-spin absolute -bottom-2 -right-2" />
        </div>
        <div className="text-center">
          <h2 className="text-white font-outfit text-xl font-bold tracking-tight">Synchronizing Infrastructure</h2>
          <p className="text-slate-500 text-xs uppercase tracking-[0.3em] mt-2 font-black">Establishing Secure Cloud Tunnel</p>
        </div>
      </div>
    );
  }

  return currentUser ? <MainApp /> : <LoginPage />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;