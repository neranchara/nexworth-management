'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Users, Receipt, Wallet, ArrowRight, ShieldCheck, Search, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    transactions: number;
    accounts: number;
  };
}

export default function OrganizationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newOrg, setNewOrg] = useState({
    name: '',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user && !user.isSystemAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchOrganizations();
  }, [user, router]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organizations');
      setOrganizations(res.data);
    } catch (err) {
      console.error('Failed to fetch organizations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (orgId: string, currentStatus: boolean) => {
    try {
      await api.put(`/organizations/${orgId}`, { isActive: !currentStatus });
      fetchOrganizations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update organization status');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.post('/organizations', newOrg);
      setShowCreateModal(false);
      setNewOrg({ name: '', adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '' });
      fetchOrganizations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && organizations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Organizations
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-[13px]">Manage and monitor all system organizations.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-[12px] transition-all"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Org
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrgs.map((org) => (
          <div key={org.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-all group relative overflow-hidden ${!org.isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <Building2 className="w-16 h-16 -mr-3 -mt-3" />
            </div>
            
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-md font-bold text-gray-900 dark:text-white leading-tight">{org.name}</h3>
                  <p className="text-[10px] text-gray-400">Since {new Date(org.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              {org.name === 'System Management' ? (
                <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-400" title="Locked">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              ) : (
                <button 
                  onClick={() => handleToggleActive(org.id, org.isActive)}
                  className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${org.isActive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${org.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              )}
            </div>
 
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                <Users className="w-3.5 h-3.5 text-blue-500 mx-auto mb-1" />
                <p className="text-[12px] font-bold text-gray-900 dark:text-white">{org._count.users}</p>
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">Users</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                <Wallet className="w-3.5 h-3.5 text-purple-500 mx-auto mb-1" />
                <p className="text-[12px] font-bold text-gray-900 dark:text-white">{org._count.accounts}</p>
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">Accounts</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                <Receipt className="w-3.5 h-3.5 text-green-500 mx-auto mb-1" />
                <p className="text-[12px] font-bold text-gray-900 dark:text-white">{org._count.transactions}</p>
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">TXs</p>
              </div>
            </div>
 
            <button 
              onClick={() => router.push(`/dashboard/organizations/${org.id}`)}
              className="w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 hover:text-white text-gray-600 dark:text-gray-300 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 group-hover:bg-blue-600 group-hover:text-white"
            >
              View Hub
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="text-blue-600" />
                Create New Organization
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Organization Name</label>
                <input 
                  type="text" 
                  required
                  value={newOrg.name}
                  onChange={e => setNewOrg({...newOrg, name: e.target.value})}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div className="pt-4 border-t dark:border-gray-700">
                <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Default Admin Account
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                   <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={newOrg.adminFirstName}
                      onChange={e => setNewOrg({...newOrg, adminFirstName: e.target.value})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                   <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={newOrg.adminLastName}
                      onChange={e => setNewOrg({...newOrg, adminLastName: e.target.value})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={newOrg.adminEmail}
                      onChange={e => setNewOrg({...newOrg, adminEmail: e.target.value})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="admin@organization.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Default Password</label>
                    <input 
                      type="password" 
                      required
                      value={newOrg.adminPassword}
                      onChange={e => setNewOrg({...newOrg, adminPassword: e.target.value})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
