'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { 
  Shield, Plus, Trash2, Edit2, ShieldCheck, 
  ArrowRight, Loader2, X, Settings2, ChevronRight
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  _count?: {
    users: number;
  };
}

export default function RolesListPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [currentRoleId, setCurrentRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const url = orgId ? `/roles?orgId=${orgId}` : '/roles';
      const res = await api.get(url);
      setRoles(res.data.roles);
      setOrganizations(res.data.organizations || []);
    } catch (err) {
      console.error('Failed to fetch roles', err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreateOrUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingRole && currentRoleId) {
        await api.put(`/roles/${currentRoleId}`, { name: roleName, description: roleDescription, isSystemRole });
        setMessage({ text: 'Updated', type: 'success' });
      } else {
        await api.post('/roles', { 
          name: roleName, 
          description: roleDescription, 
          isSystemRole,
          organizationId: orgId || user?.organizationId 
        });
        setMessage({ text: 'Created', type: 'success' });
      }
      setIsModalOpen(false);
      fetchRoles();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Failed', type: 'error' });
    }
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/roles/${id}`);
      fetchRoles();
    } catch (err: any) {
      setMessage({ text: 'Delete failed', type: 'error' });
    }
  };

  const openCreateModal = () => {
    setIsEditingRole(false);
    setCurrentRoleId(null);
    setRoleName('');
    setRoleDescription('');
    setIsSystemRole(false);
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setIsEditingRole(true);
    setCurrentRoleId(role.id);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setIsSystemRole(role.isSystemRole || false);
    setIsModalOpen(true);
  };

  const filteredRoles = roles.filter(r => {
    const targetOrg = organizations.find(o => o.id === (orgId || user?.organizationId));
    const isSuperAdmin = user?.role === 'Super Admin' || user?.email === 'superadmin@nexworth.online';

    // If we are looking at System Management org (either via Menu or Hub)
    if (targetOrg?.name === 'System Management' || user?.orgName === 'System Management' && !orgId) {
      // 1. Only show roles marked as isSystemRole
      if (!r.isSystemRole) return false;
      // 2. If Login User is NOT Super Admin, hide the 'Super Admin' role itself
      if (!isSuperAdmin && r.name === 'Super Admin') return false;
      return true;
    }
    // For all other organizations, show all their roles
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto min-h-screen animate-in fade-in duration-500">
      {/* Balanced Header */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Shield className="text-white w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            Role Permissions
            {orgId && (
              <span className="flex items-center gap-2 text-gray-300 ml-1">
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-500 dark:text-gray-400 font-medium">{organizations.find(o => o.id === orgId)?.name || 'Org Roles'}</span>
              </span>
            )}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {hasPermission('permissions', 'canCreate') && (
            <button
              onClick={openCreateModal}
              data-testid="permissions-list-btn-add-role"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              New Role
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`mb-6 py-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map((role) => (
            <div 
              key={role.id}
              className="group bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:border-blue-500/50 transition-all flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className={`p-1.5 rounded-md ${role.isSystemRole ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-[13px] text-gray-900 dark:text-white truncate">{role.name}</span>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {hasPermission('permissions', 'canUpdate') && (
                    <button 
                      onClick={() => openEditModal(role)} 
                      data-testid={`permissions-list-btn-edit-${role.name}`}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {hasPermission('permissions', 'canDelete') && (role._count?.users || 0) === 0 && (
                    <button 
                      onClick={() => handleDeleteRole(role.id, role.name)} 
                      data-testid={`permissions-list-btn-delete-${role.name}`}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50 dark:border-gray-700/50">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-[11px] font-bold">{role._count?.users || 0} Users</span>
                </div>

                <button
                  onClick={() => router.push(`/dashboard/permissions/${role.id}${orgId ? `?orgId=${orgId}` : ''}`)}
                  data-testid={`permissions-list-btn-config-${role.name}`}
                  className="flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                >
                  Config
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {isEditingRole ? 'Edit Role' : 'New Role'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreateOrUpdateRole} className="p-4 space-y-4">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Role Name</label>
                <input 
                  type="text" required value={roleName} onChange={(e) => setRoleName(e.target.value)}
                  data-testid="permissions-form-input-name"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-[13px] font-bold focus:outline-none focus:border-blue-500 bg-transparent" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Description (Optional)</label>
                <textarea 
                  value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)}
                  data-testid="permissions-form-input-description"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 bg-transparent min-h-[80px]" 
                />
              </div>

              {user?.isSystemAdmin && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <span className="text-[11px] font-bold text-gray-500">System Management Role</span>
                  <button 
                    type="button"
                    onClick={() => setIsSystemRole(!isSystemRole)}
                    data-testid="permissions-form-btn-toggle-system"
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${isSystemRole ? 'bg-orange-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isSystemRole ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button type="submit" data-testid="permissions-form-btn-save" className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
