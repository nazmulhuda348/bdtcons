import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { UserRole, User, Project, Client } from '../types';
import { 
  Users, Briefcase, UserCircle, Plus, Trash2, Shield, X, Key, 
  ShieldCheck, UserPlus, AlertTriangle, Edit2, Facebook, CheckSquare,
  Landmark, PieChart, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Structural Fix for React 19 + Framer Motion Type Conflicts
const MotionDiv = motion.div as any;

// 🔴 আপডেট করা পারমিশন লিস্ট
export const AVAILABLE_PERMISSIONS = [
  { id: 'add_ledger', label: 'A. Ledger (Add Entry)' },
  { id: 'edit_ledger', label: 'A. Ledger (Edit Entry)' },
  { id: 'deposit_receipt', label: 'B. Deposit & Receipt' },
  
  { id: 'cash_management', label: 'C. Cash Management' },
  { id: 'transfer_history', label: 'C. Transfer History' },
  
  { id: 'partners', label: 'D. Partner Registry' },
  
  { id: 'property_inventory', label: 'E. Property Inventory' },
  { id: 'property_sales', label: 'E. Sales & Bookings' },
  
  { id: 'suppliers_inventory', label: 'F. Suppliers & Site Stock' },
  
  { id: 'leads_pipeline', label: 'G. Leads Pipeline' },
  { id: 'marketing', label: 'G. Marketing Automation' },
  
  { id: 'smart_sync', label: 'H. Smart Sync' },
  { id: 'insights', label: 'I. Insights & Analytics' },
  { id: 'admin_panel', label: 'J. Admin Panel' }
];

export const AdminPanel: React.FC = () => {
  const { 
    users, projects, clients, 
    updateUsers, updateProjects, updateClients, 
    deleteUser, deleteProject, deleteClient
  } = useAppContext(); 

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'projects' | 'clients'>('users');

  const tabs = [
    { id: 'users', label: 'User Permissions', icon: Shield },
    { id: 'projects', label: 'Project Portfolio', icon: Briefcase },
    { id: 'clients', label: 'Client Registry', icon: UserCircle },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-outfit text-white">Administration Control</h2>
          <p className="text-slate-500 mt-1">Manage infrastructure, user access and custom permissions</p>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-all ${activeSubTab === tab.id ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <tab.icon size={18} />
            <span className="font-bold uppercase tracking-wider text-xs">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeSubTab === 'users' && <UserManager users={users} setUsers={updateUsers} projects={projects} deleteUserDb={deleteUser} />}
        {activeSubTab === 'projects' && <ProjectManager projects={projects} setProjects={updateProjects} deleteProjectDb={deleteProject} />}
        {activeSubTab === 'clients' && <ClientManager clients={clients} setClients={updateClients} deleteClientDb={deleteClient} projects={projects} />}
      </div>
    </div>
  );
};

// ==========================================
// User Manager (Unchanged)
// ==========================================
const UserManager: React.FC<{ users: User[], setUsers: any, projects: Project[], deleteUserDb: (id: string) => Promise<void> }> = ({ users, setUsers, projects, deleteUserDb }) => {
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [permissionsModalUser, setPermissionsModalUser] = useState<User | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUserDb(id);
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const toggleProjectAccess = (userId: string, projectId: string) => {
    setUsers((prev: User[]) => prev.map(u => {
      if (u.id === userId) {
        const assigned = u.assignedProjects || [];
        const has = assigned.includes(projectId);
        return {
          ...u,
          assignedProjects: has ? assigned.filter(id => id !== projectId) : [...assigned, projectId]
        };
      }
      return u;
    }));
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col justify-between shadow-xl relative group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-amber-400 font-bold text-xl">
                  {user.name?.charAt(0) || '?'}
                </div>
                <div className="flex items-center space-x-2">
                  {user.role !== UserRole.ADMIN && (
                    <button onClick={() => setPermissionsModalUser(user)} className="p-2 bg-slate-900 text-slate-400 hover:text-emerald-400 rounded-xl transition-all" title="Manage Permissions">
                      <CheckSquare size={16} />
                    </button>
                  )}
                  <button onClick={() => setPasswordModalUser(user)} className="p-2 bg-slate-900 text-slate-400 hover:text-amber-400 rounded-xl transition-all" title="Change Password">
                    <Key size={16} />
                  </button>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${user.role === UserRole.ADMIN ? 'bg-red-400/10 text-red-400' : 'bg-blue-400/10 text-blue-400'}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <h4 className="text-white font-bold text-lg">{user.name || 'Unknown User'}</h4>
              <p className="text-slate-500 text-sm mb-4">@{user.username}</p>
              
              {user.role !== UserRole.ADMIN && (
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Permissions</p>
                     <div className="flex flex-wrap gap-1">
                       {user.permissions && user.permissions.length > 0 ? (
                          user.permissions.map(p => (
                             <span key={p} className="text-[9px] bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded uppercase tracking-wider">
                               {AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.label || p}
                             </span>
                          ))
                       ) : (
                          <span className="text-xs text-slate-600 italic">No specific permissions</span>
                       )}
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assigned Projects</p>
                    <div className="flex flex-wrap gap-2">
                      {projects.map(p => (
                        <button
                          key={p.id}
                          onClick={() => toggleProjectAccess(user.id, p.id)}
                          className={`text-[10px] px-2 py-1 rounded-md transition-all ${(user.assignedProjects || []).includes(p.id) ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {user.role !== UserRole.ADMIN && (
               <div className="mt-auto pt-4 border-t border-slate-700/50">
                 {confirmDeleteId === user.id ? (
                   <div className="flex items-center space-x-2 animate-in fade-in zoom-in duration-200">
                     <button onClick={() => handleDeleteUser(user.id)} className="flex-1 bg-red-500 text-white text-[10px] font-bold py-2 rounded-lg uppercase tracking-wider">Confirm</button>
                     <button onClick={() => setConfirmDeleteId(null)} className="flex-1 bg-slate-700 text-slate-300 text-[10px] font-bold py-2 rounded-lg uppercase tracking-wider">Cancel</button>
                   </div>
                 ) : (
                   <button onClick={() => setConfirmDeleteId(user.id)} className="w-full flex items-center justify-center space-x-2 text-slate-500 hover:text-red-400 py-2 rounded-xl transition-colors">
                     <Trash2 size={16} />
                     <span className="text-sm font-semibold">Remove User</span>
                   </button>
                 )}
               </div>
            )}
          </div>
        ))}
        <button 
          onClick={() => setShowAddUserModal(true)}
          className="border-2 border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-amber-400 hover:text-amber-400 transition-all group min-h-[220px]"
        >
           <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
           <span className="font-bold">Add New Employee</span>
        </button>
      </div>

     <AnimatePresence>
        {passwordModalUser && (
          <PasswordChangeModal 
            user={passwordModalUser} 
            onClose={() => setPasswordModalUser(null)} 
            onSubmit={(id: string, pw: string) => setUsers((prev: User[]) => prev.map(u => u.id === id ? { ...u, password: pw } : u))} 
          />
        )}
        {showAddUserModal && (
          <AddUserModal 
            onClose={() => setShowAddUserModal(false)} 
            onSubmit={async (nu: Partial<User>) => {
               setUsers((prev: User[]) => [...prev, { ...nu, id: Math.random().toString(36).substr(2, 9) } as User]);
            }} 
          />
        )}
        {permissionsModalUser && (
          <PermissionsChangeModal 
            user={permissionsModalUser} 
            onClose={() => setPermissionsModalUser(null)} 
            onSubmit={(id: string, perms: string[]) => setUsers((prev: User[]) => prev.map(u => u.id === id ? { ...u, permissions: perms } : u))} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ==========================================
// 🔴 NEW: Updated Project Manager (Real Estate ERP) 🔴
// ==========================================
const ProjectManager: React.FC<{ projects: Project[], setProjects: any, deleteProjectDb: (id: string) => Promise<void> }> = ({ projects, setProjects, deleteProjectDb }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [newProject, setNewProject] = useState<Partial<Project>>({ 
    name: '', 
    serviceMarkup: 0, 
    totalShares: 0,
    targetSharePrice: 0,
    totalLandCost: 0,
    landArea: ''
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setProjects((prev: Project[]) => prev.map(p => p.id === editingProject.id ? editingProject : p));
    setEditingProject(null);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;
    setProjects((prev: Project[]) => [...prev, { ...newProject, id: `proj_${Date.now()}` } as Project]);
    setShowAdd(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(p => (
        <div key={p.id} className="bg-slate-800 rounded-3xl border border-slate-700 p-6 shadow-xl relative group overflow-hidden">
           <div className="absolute top-4 right-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all">
             <button onClick={() => setEditingProject(p)} className="text-slate-500 hover:text-amber-400 bg-slate-900 p-2 rounded-lg"><Edit2 size={14} /></button>
             <button onClick={() => deleteProjectDb(p.id)} className="text-slate-500 hover:text-red-400 bg-slate-900 p-2 rounded-lg"><Trash2 size={14} /></button>
           </div>
           
           <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-amber-400/10 text-amber-400 rounded-xl"><Briefcase size={20}/></div>
             <div>
               <h4 className="text-white font-bold text-lg leading-tight">{p.name}</h4>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-1 mt-0.5"><MapPin size={10}/> {p.landArea || 'Area not set'}</p>
             </div>
           </div>

           <div className="space-y-2 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-400 flex items-center gap-1.5"><Landmark size={12}/> Land Cost</span>
                 <span className="text-emerald-400 font-mono font-bold">${p.totalLandCost?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-400 flex items-center gap-1.5"><PieChart size={12}/> Target Price/Share</span>
                 <span className="text-amber-400 font-mono font-bold">${p.targetSharePrice?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-400 flex items-center gap-1.5"><Users size={12}/> Total Shares</span>
                 <span className="text-slate-300 font-mono font-bold">{p.totalShares || 0}</span>
              </div>
           </div>
        </div>
      ))}

      <button onClick={() => setShowAdd(true)} className="border-2 border-dashed border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-amber-400 hover:text-amber-400 min-h-[200px] transition-all">
        <Plus size={32} className="mb-2" />
        <span className="font-bold text-sm uppercase tracking-widest">Register New Project</span>
      </button>
      
      {/* ADD MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <MotionDiv initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 rounded-[2.5rem] p-8 md:p-10 w-full max-w-xl border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowAdd(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={24} /></button>
            <div className="flex items-center gap-3 mb-8">
               <div className="p-3 bg-amber-400/10 rounded-xl"><Briefcase className="text-amber-400" size={24}/></div>
               <h3 className="text-2xl font-bold font-outfit text-white tracking-tight">New Project Setup</h3>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Project Name</label>
                   <input required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-amber-400" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Land Area (জমির পরিমাণ)</label>
                   <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-amber-400" placeholder="e.g. 10 Katha" value={newProject.landArea} onChange={e => setNewProject({...newProject, landArea: e.target.value})} />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-1">Total Estimated Land Cost ($)</label>
                 <input type="number" min="0" className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-5 py-4 text-emerald-400 font-black text-lg outline-none focus:border-emerald-400" value={newProject.totalLandCost || ''} onChange={e => setNewProject({...newProject, totalLandCost: parseFloat(e.target.value) || 0})} />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-700">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Total Shares (কয়টি শেয়ার?)</label>
                   <input type="number" min="0" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-amber-400" value={newProject.totalShares || ''} onChange={e => setNewProject({...newProject, totalShares: parseInt(e.target.value) || 0})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Target Price / Share</label>
                   <input type="number" min="0" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-amber-400" value={newProject.targetSharePrice || ''} onChange={e => setNewProject({...newProject, targetSharePrice: parseFloat(e.target.value) || 0})} />
                 </div>
               </div>

               <div className="flex gap-3 pt-6">
                 <button type="button" onClick={() => setShowAdd(false)} className="flex-1 px-4 py-4 rounded-xl border border-slate-700 text-slate-500 font-bold text-xs uppercase hover:text-white transition-colors">Cancel</button>
                 <button type="submit" className="flex-[2] px-4 py-4 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-amber-300 transition-colors">Initialize Project</button>
               </div>
            </form>
          </MotionDiv>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <MotionDiv initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 rounded-[2.5rem] p-8 md:p-10 w-full max-w-xl border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setEditingProject(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={24} /></button>
            <div className="flex items-center gap-3 mb-8">
               <div className="p-3 bg-amber-400/10 rounded-xl"><Edit2 className="text-amber-400" size={24}/></div>
               <h3 className="text-2xl font-bold font-outfit text-white tracking-tight">Edit Project Details</h3>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Project Name</label>
                   <input required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-amber-400" value={editingProject.name} onChange={e => setEditingProject({...editingProject, name: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Land Area</label>
                   <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-amber-400" value={editingProject.landArea || ''} onChange={e => setEditingProject({...editingProject, landArea: e.target.value})} />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-1">Total Estimated Land Cost ($)</label>
                 <input type="number" min="0" className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-5 py-4 text-emerald-400 font-black text-lg outline-none focus:border-emerald-400" value={editingProject.totalLandCost || ''} onChange={e => setEditingProject({...editingProject, totalLandCost: parseFloat(e.target.value) || 0})} />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-700">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Total Shares</label>
                   <input type="number" min="0" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-amber-400" value={editingProject.totalShares || ''} onChange={e => setEditingProject({...editingProject, totalShares: parseInt(e.target.value) || 0})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Target Price / Share</label>
                   <input type="number" min="0" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-amber-400" value={editingProject.targetSharePrice || ''} onChange={e => setEditingProject({...editingProject, targetSharePrice: parseFloat(e.target.value) || 0})} />
                 </div>
               </div>

               <div className="flex gap-3 pt-6">
                 <button type="button" onClick={() => setEditingProject(null)} className="flex-1 px-4 py-4 rounded-xl border border-slate-700 text-slate-500 font-bold text-xs uppercase hover:text-white transition-colors">Cancel</button>
                 <button type="submit" className="flex-[2] px-4 py-4 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-amber-300 transition-colors">Update Project</button>
               </div>
            </form>
          </MotionDiv>
        </div>
      )}
    </div>
  );
};

// ==========================================
// Client Manager (Unchanged)
// ==========================================
const ClientManager: React.FC<{ 
  clients: Client[], setClients: any, deleteClientDb: (id: string) => Promise<void>, projects: Project[]
}> = ({ clients, setClients, deleteClientDb, projects }) => {
  // ... (Your existing ClientManager code remains EXACTLY the same here)
  const [showAdd, setShowAdd] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Partial<Client>>({ name: '', email: '', phone: '', facebookId: '', projectId: '' });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setClients((prev: Client[]) => prev.map(c => c.id === editingClient.id ? editingClient : c));
    setEditingClient(null);
  };

  const handleCreateClient = async () => {
    if (!newClient.name) return;
    setClients((prev: Client[]) => [...prev, { ...newClient, id: Math.random().toString(36).substr(2, 9) } as Client]);
    setShowAdd(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map(c => {
        const assignedProject = projects.find(p => p.id === c.projectId);
        return (
          <div key={c.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl relative group">
             <div className="absolute top-4 right-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all">
               <button onClick={() => setEditingClient(c)} className="text-slate-600 hover:text-amber-400"><Edit2 size={16} /></button>
               <button onClick={() => deleteClientDb(c.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={16} /></button>
             </div>
             <h4 className="text-white font-bold">{c.name}</h4>
             
             {assignedProject && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-md">
                  {assignedProject.name}
                </span>
             )}

             <div className="space-y-1 mt-3">
               <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <ShieldCheck size={12} className="opacity-50 text-amber-400" />
                  <span>{c.email || 'No email'}</span>
               </div>
               {c.phone && <p className="text-[10px] text-slate-500 font-mono">{c.phone}</p>}
               {c.facebookId && (
                  <div className="flex items-center space-x-2 text-[10px] text-blue-400 font-bold mt-1">
                     <Facebook size={10} />
                     <span>{c.facebookId}</span>
                  </div>
               )}
             </div>
          </div>
        );
      })}
      <button onClick={() => setShowAdd(true)} className="border-2 border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-amber-400 hover:text-amber-400 min-h-[140px]"><Plus size={32} /><span className="font-bold">Add New Client</span></button>
      
      {showAdd && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-3xl p-8 w-full max-w-md border border-slate-700 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">New Client</h3>
            <div className="space-y-4">
               <input placeholder="Client Name" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400" onChange={e => setNewClient({...newClient, name: e.target.value})} />
               <input placeholder="Email" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400" onChange={e => setNewClient({...newClient, email: e.target.value})} />
               <input placeholder="Phone" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400" onChange={e => setNewClient({...newClient, phone: e.target.value})} />
               <input placeholder="Facebook ID" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400" onChange={e => setNewClient({...newClient, facebookId: e.target.value})} />
               
               <div className="relative">
                 <select 
                   value={newClient.projectId || ''} 
                   onChange={e => setNewClient({...newClient, projectId: e.target.value})} 
                   className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-400 outline-none appearance-none cursor-pointer"
                 >
                   <option value="">Select Project (Optional)</option>
                   {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
               </div>

               <div className="flex space-x-3 pt-4">
                 <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
                 <button onClick={handleCreateClient} className="flex-1 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest">Register</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {editingClient && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-3xl p-8 w-full max-w-md border border-slate-700 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Edit Client</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
               <input required placeholder="Client Name" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400" value={editingClient.name} onChange={e => setEditingClient({...editingClient, name: e.target.value})} />
               <input required placeholder="Email" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400" value={editingClient.email} onChange={e => setEditingClient({...editingClient, email: e.target.value})} />
               <input required placeholder="Phone" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400" value={editingClient.phone} onChange={e => setEditingClient({...editingClient, phone: e.target.value})} />
               <input placeholder="Facebook ID" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400" value={editingClient.facebookId || ''} onChange={e => setEditingClient({...editingClient, facebookId: e.target.value})} />
               
               <div className="relative">
                 <select 
                   value={editingClient.projectId || ''} 
                   onChange={e => setEditingClient({...editingClient, projectId: e.target.value})} 
                   className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-400 outline-none appearance-none cursor-pointer"
                 >
                   <option value="">Select Project (Optional)</option>
                   {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
               </div>

               <div className="flex space-x-3 pt-4">
                 <button type="button" onClick={() => setEditingClient(null)} className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
                 <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest">Update</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// Rest of the modals (AddUserModal, PermissionsChangeModal, PasswordChangeModal)
// ==========================================
// Your previous code for these modals remains EXACTLY the same. 
// For brevity, I'm assuming you have them in your file or can copy-paste them from your original AdminPanel.tsx file.
const AddUserModal: React.FC<{ onClose: () => void, onSubmit: (user: any) => void }> = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({ username: '', name: '', password: '', role: UserRole.MANAGER });
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const togglePerm = (id: string) => {
    setSelectedPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <MotionDiv initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-3xl p-8 shadow-2xl my-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-amber-400/10 rounded-xl"><UserPlus className="text-amber-400" size={20} /></div>
             <h3 className="text-xl font-bold text-white">Create Employee</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={24} /></button>
        </div>
        
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          onSubmit({ ...form, assignedProjects: [], permissions: selectedPerms }); 
          onClose(); 
        }} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <input required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" placeholder="Display Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value.toLowerCase()})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <input required type="password" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" placeholder="Initial Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}>
              <option value={UserRole.MANAGER}>Manager Level</option>
              <option value={UserRole.GUEST}>Custom / Guest Level</option>
            </select>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 mt-4">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Custom Access Permissions</label>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {AVAILABLE_PERMISSIONS.map(p => (
                  <label key={p.id} className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedPerms.includes(p.id) ? 'bg-amber-400/10 border-amber-400/50' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                     <input 
                       type="checkbox" 
                       checked={selectedPerms.includes(p.id)}
                       onChange={() => togglePerm(p.id)}
                       className="accent-amber-400 w-4 h-4 cursor-pointer"
                     />
                     <span className={`text-xs font-bold ${selectedPerms.includes(p.id) ? 'text-amber-400' : 'text-slate-400'}`}>{p.label}</span>
                  </label>
               ))}
             </div>
          </div>

          <button type="submit" className="w-full py-4 mt-4 bg-amber-400 text-slate-900 font-bold rounded-2xl hover:bg-amber-500 transition-all uppercase text-[10px] tracking-widest">Create Profile</button>
        </form>
      </MotionDiv>
    </div>
  );
};

const PermissionsChangeModal: React.FC<{ user: User, onClose: () => void, onSubmit: (id: string, perms: string[]) => void }> = ({ user, onClose, onSubmit }) => {
  const [selectedPerms, setSelectedPerms] = useState<string[]>(user.permissions || []);

  const togglePerm = (id: string) => {
    setSelectedPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <MotionDiv initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-3xl p-8 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">Edit Permissions</h3>
        <p className="text-slate-400 text-sm mb-6">Modify access limits for <strong>{user.name}</strong></p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
           {AVAILABLE_PERMISSIONS.map(p => (
              <label key={p.id} className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedPerms.includes(p.id) ? 'bg-amber-400/10 border-amber-400/50' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                 <input type="checkbox" checked={selectedPerms.includes(p.id)} onChange={() => togglePerm(p.id)} className="accent-amber-400 w-4 h-4 cursor-pointer" />
                 <span className={`text-xs font-bold ${selectedPerms.includes(p.id) ? 'text-amber-400' : 'text-slate-400'}`}>{p.label}</span>
              </label>
           ))}
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-900 text-slate-400 font-bold rounded-2xl">Cancel</button>
          <button onClick={() => { onSubmit(user.id, selectedPerms); onClose(); }} className="flex-1 py-4 bg-emerald-500 text-slate-950 font-bold rounded-2xl">Save Changes</button>
        </div>
      </MotionDiv>
    </div>
  );
};

const PasswordChangeModal: React.FC<{ user: User, onClose: () => void, onSubmit: (id: string, pw: string) => void }> = ({ user, onClose, onSubmit }) => {
  const [newPassword, setNewPassword] = useState('');
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <MotionDiv initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-6">Reset Secret Key for {user.name}</h3>
        <input type="password" required className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 px-4 text-white mb-6" placeholder="New password..." value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-900 text-slate-400 font-bold rounded-2xl">Cancel</button>
          <button onClick={() => { onSubmit(user.id, newPassword); onClose(); }} className="flex-1 py-4 bg-amber-400 text-slate-900 font-bold rounded-2xl">Update Key</button>
        </div>
      </MotionDiv>
    </div>
  );
};