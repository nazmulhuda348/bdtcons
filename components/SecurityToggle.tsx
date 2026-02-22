import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, User as UserIcon, Globe } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { UserRole } from '../types';

export const SecurityToggle: React.FC = () => {
  const { viewAllMode, setViewAllMode, currentUser } = useAppContext();

  if (!currentUser || currentUser.role === UserRole.GUEST) return null;

  return (
    <div className="flex items-center space-x-3 bg-slate-900/50 border border-slate-700/50 p-1.5 rounded-2xl">
      <button
        onClick={() => setViewAllMode(false)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
          !viewAllMode ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <UserIcon size={14} />
        <span>My Activity</span>
      </button>
      <button
        onClick={() => setViewAllMode(true)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
          viewAllMode ? 'bg-slate-700 text-amber-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Globe size={14} />
        <span>Global View</span>
      </button>
    </div>
  );
};
