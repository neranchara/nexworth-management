'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import {
  Shield, Plus, Trash2, Edit2, ShieldCheck,
  ArrowRight, Loader2, X, ChevronRight, Users,
  LayoutGrid, List,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { clsx } from 'clsx';

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

  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() =>
    (typeof window !== 'undefined' ? localStorage.getItem('viewMode_permissions') as 'grid' | 'table' : null) || 'grid'
  );

  const toggleViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('viewMode_permissions', mode);
  };

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
      setMessage({ text: `Role "${name}" deleted`, type: 'success' });
      setTimeout(() => setMessage(null), 3000);
      fetchRoles();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Delete failed', type: 'error' });
      setTimeout(() => setMessage(null), 5000);
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
    const isSuperAdmin = user?.role === 'Super Admin' || user?.email === 'superadmin@nexworth.cc';

    if (targetOrg?.name === 'System Management' || user?.orgName === 'System Management' && !orgId) {
      if (!r.isSystemRole) return false;
      if (!isSuperAdmin && r.name === 'Super Admin') return false;
      return true;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald/10 border border-emerald/20 rounded-xl">
            <Shield className="text-emerald w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Role Permissions
              {orgId && (
                <span className="flex items-center gap-2 text-white/30 ml-1">
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-slate font-medium">{organizations.find(o => o.id === orgId)?.name || 'Org Roles'}</span>
                </span>
              )}
            </h1>
            <p className="text-slate text-[11px] font-bold uppercase tracking-widest mt-0.5">Manage roles and access levels</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 border border-white/5 rounded-lg p-0.5">
            {(['grid', 'table'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => toggleViewMode(mode)}
                className={clsx(
                  'p-1.5 rounded-md transition-all',
                  viewMode === mode ? 'bg-emerald/20 text-emerald' : 'text-slate hover:text-white'
                )}
              >
                {mode === 'grid' ? <LayoutGrid size={14} /> : <List size={14} />}
              </button>
            ))}
          </div>

          {hasPermission('permissions', 'canCreate') && (
            <button
              onClick={openCreateModal}
              data-testid="permissions-list-btn-add-role"
              className="bg-emerald text-navy px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              New Role
            </button>
          )}
        </div>
      </div>

      {/* Alert */}
      {message && (
        <div className={clsx(
          "mb-6 py-3 px-4 rounded-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2 border",
          message.type === 'success'
            ? 'bg-emerald/10 text-emerald border-emerald/20'
            : 'bg-rose/10 text-rose border-rose/20'
        )}>
          <ShieldCheck className="w-3.5 h-3.5" />
          {message.text}
        </div>
      )}

      {/* Role View */}
      {loading ? (
        <div className="flex flex-col items-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-emerald" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="group bg-navy/40 backdrop-blur-xl rounded-[1.25rem] p-5 border border-white/5 hover:border-emerald/30 hover:bg-navy/60 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={clsx(
                    "p-2 rounded-xl border",
                    role.isSystemRole
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      : 'bg-emerald/10 text-emerald border-emerald/20'
                  )}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-black text-sm text-white truncate block">{role.name}</span>
                    {role.isSystemRole && (
                      <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">System Role</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {hasPermission('permissions', 'canUpdate') && (
                    <button
                      onClick={() => openEditModal(role)}
                      data-testid={`permissions-list-btn-edit-${role.name}`}
                      className="p-1.5 text-slate hover:text-emerald hover:bg-emerald/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {hasPermission('permissions', 'canDelete') && (role._count?.users || 0) === 0 && (
                    <button
                      onClick={() => handleDeleteRole(role.id, role.name)}
                      data-testid={`permissions-list-btn-delete-${role.name}`}
                      className="p-1.5 text-slate hover:text-rose hover:bg-rose/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {role.description && (
                <p className="text-[11px] text-slate leading-relaxed mb-4 line-clamp-2">{role.description}</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-slate">
                  <Users className="w-3 h-3" />
                  <span className="text-[11px] font-bold">{role._count?.users || 0} Users</span>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/permissions/${role.id}${orgId ? `?orgId=${orgId}` : ''}`)}
                  data-testid={`permissions-list-btn-config-${role.name}`}
                  className="flex items-center gap-1.5 text-[11px] font-black text-emerald hover:text-white uppercase tracking-wider transition-colors"
                >
                  Configure
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-navy/40 backdrop-blur-xl rounded-[1.25rem] border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-[9px] font-black text-slate uppercase tracking-widest">Role</th>
                <th className="px-4 py-3 text-left text-[9px] font-black text-slate uppercase tracking-widest">คำอธิบาย</th>
                <th className="px-4 py-3 text-left text-[9px] font-black text-slate uppercase tracking-widest">ประเภท</th>
                <th className="px-4 py-3 text-left text-[9px] font-black text-slate uppercase tracking-widest">Users</th>
                <th className="px-4 py-3 text-right text-[9px] font-black text-slate uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((role) => (
                <tr key={role.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={clsx(
                        'p-1.5 rounded-lg border',
                        role.isSystemRole ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald/10 text-emerald border-emerald/20'
                      )}>
                        <Shield className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-black text-white">{role.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-slate line-clamp-1">{role.description || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {role.isSystemRole
                      ? <span className="text-[9px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">System</span>
                      : <span className="text-[9px] font-black text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded">Custom</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate">
                      <Users className="w-3 h-3" />
                      <span className="text-[11px] font-bold">{role._count?.users || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/permissions/${role.id}${orgId ? `?orgId=${orgId}` : ''}`)}
                        data-testid={`permissions-list-btn-config-${role.name}`}
                        className="flex items-center gap-1 text-[10px] font-black text-emerald hover:text-white transition-colors px-2 py-1"
                      >
                        Config <ArrowRight className="w-3 h-3" />
                      </button>
                      {hasPermission('permissions', 'canUpdate') && (
                        <button
                          onClick={() => openEditModal(role)}
                          data-testid={`permissions-list-btn-edit-${role.name}`}
                          className="p-1.5 text-slate hover:text-emerald transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {hasPermission('permissions', 'canDelete') && (role._count?.users || 0) === 0 && (
                        <button
                          onClick={() => handleDeleteRole(role.id, role.name)}
                          data-testid={`permissions-list-btn-delete-${role.name}`}
                          className="p-1.5 text-slate hover:text-rose transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal — New Role / Edit Role */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-navy/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/10">
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/10">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">
                {isEditingRole ? 'Edit Role' : 'New Role'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateRole} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate uppercase tracking-widest mb-1.5">Role Name</label>
                <input
                  type="text" required value={roleName} onChange={(e) => setRoleName(e.target.value)}
                  data-testid="permissions-form-input-name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-emerald/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate uppercase tracking-widest mb-1.5">Description <span className="text-[9px] lowercase font-medium opacity-60">(optional)</span></label>
                <textarea
                  value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)}
                  data-testid="permissions-form-input-description"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald/50 transition-all min-h-[80px] resize-none"
                />
              </div>

              {user?.isSystemAdmin && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs font-bold text-slate">System Management Role</span>
                  <button
                    type="button"
                    onClick={() => setIsSystemRole(!isSystemRole)}
                    data-testid="permissions-form-btn-toggle-system"
                    className={clsx(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-all",
                      isSystemRole ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-white/10'
                    )}
                  >
                    <span className={clsx("inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm", isSystemRole ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  data-testid="permissions-form-btn-save"
                  className="w-full py-2.5 bg-emerald text-navy text-xs font-black rounded-xl hover:shadow-[0_0_20px_rgba(80,200,120,0.4)] transition-all active:scale-95"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
