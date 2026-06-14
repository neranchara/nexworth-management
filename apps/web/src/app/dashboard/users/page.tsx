'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import {
  Edit2, Trash2, X, CheckCircle, AlertCircle,
  ArrowUpCircle, ArrowDownCircle, MoreHorizontal,
  Users, Plus, RefreshCw, Loader2, Search, UserPlus, ChevronRight,
  LayoutGrid, List
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { User, Organization } from '@/types/models';
import { clsx } from 'clsx';
import { SUPER_ADMIN_ROLE, SYSTEM_ORG_ID } from '@/config/systemConfig';
import GlassCard from '@/components/ui/GlassCard';

interface Role {
  id: string;
  name: string;
}

export default function UsersManagementPage() {
  const t = useTranslations('users');
  const [users, setUsers] = useState<User[]>([]);
  const { hasPermission } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'firstName', direction: 'asc' });

  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() =>
    (typeof window !== 'undefined' ? localStorage.getItem('viewMode_users') as 'grid' | 'table' : null) || 'table'
  );

  const toggleViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('viewMode_users', mode);
  };

  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: '',
    organizationId: '',
    isActive: true
  });

  const { user } = useAuthStore();
  const router = useRouter();

  const fetchUsersAndRoles = useCallback(async () => {
    try {
      setLoading(true);
      const url = orgId ? `/users?orgId=${orgId}` : '/users';
      const [usersRes, rolesRes] = await Promise.all([
        api.get(url),
        api.get('/roles')
      ]);
      setUsers(usersRes.data.users);
      setRoles(rolesRes.data.roles);
      setOrganizations(rolesRes.data.organizations || []);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (user && !hasPermission('users', 'canView')) {
      router.push('/dashboard');
      return;
    }
    fetchUsersAndRoles();
  }, [user, router, hasPermission, fetchUsersAndRoles]);

  const showAlert = (message: string, type: 'success' | 'error') => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlert({ message, type });
    alertTimeoutRef.current = setTimeout(() => setAlert(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleId: roles.length > 0 ? roles[0].id : '',
      organizationId: orgId || user?.organizationId || '',
      isActive: true
    });
    setIsEditing(false);
    setCurrentUserId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setFormData({
      email: u.email,
      password: '',
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      roleId: roles.find(r => r.name === u.role?.name)?.id || '',
      organizationId: u.organization?.id || '',
      isActive: u.isActive
    });
    setIsEditing(true);
    setCurrentUserId(u.id);
    setIsModalOpen(true);
  };

  const handleResetPassword = async (id: string) => {
    if (!window.confirm(t('confirm.resetPassword'))) return;
    try {
      const res = await api.post(`/users/${id}/reset-password`);
      showAlert(res.data.message, 'success');
    } catch (err: any) {
      showAlert(err.response?.data?.error || t('alert.resetFailed'), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirm.delete'))) return;
    try {
      await api.delete(`/users/${id}`);
      showAlert(t('alert.deleted'), 'success');
      fetchUsersAndRoles();
    } catch (err: any) {
      showAlert(t('alert.deleteFailed'), 'error');
    }
  };

  const toggleStatus = async (u: User) => {
    if (!user?.isSystemAdmin && u.organizationId !== user?.organizationId) return;
    if (u.organizationId === SYSTEM_ORG_ID && u.role?.name === SUPER_ADMIN_ROLE && !user?.isSystemAdmin) return;

    try {
      await api.put(`/users/${u.id}`, { isActive: !u.isActive });
      showAlert(t('alert.statusUpdated'), 'success');
      fetchUsersAndRoles();
    } catch (err: any) {
      showAlert(t('alert.updateFailed'), 'error');
    }
  };

  const handleRequestReset = async () => {
    if (!currentUserId) return;
    try {
      const res = await api.post(`/users/${currentUserId}/request-reset`);
      showAlert(res.data.message, 'success');
    } catch (err: any) {
      showAlert(err.response?.data?.error || 'Request failed', 'error');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData };
      if (isEditing && !payload.password) delete payload.password;

      if (isEditing && currentUserId) {
        await api.put(`/users/${currentUserId}`, payload);
        showAlert(t('alert.updated'), 'success');
      } else {
        await api.post('/users', payload);
        showAlert(t('alert.created'), 'success');
      }
      setIsModalOpen(false);
      fetchUsersAndRoles();
    } catch (err: any) {
      showAlert(err.response?.data?.error || t('alert.saveFailed'), 'error');
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortConfig) return 0;
    let aValue: any, bValue: any;
    switch (sortConfig.key) {
      case 'name': aValue = `${a.firstName} ${a.lastName}`.toLowerCase(); bValue = `${b.firstName} ${b.lastName}`.toLowerCase(); break;
      case 'email': aValue = a.email.toLowerCase(); bValue = b.email.toLowerCase(); break;
      case 'role': aValue = (a.role?.name || '').toLowerCase(); bValue = (b.role?.name || '').toLowerCase(); break;
      case 'organization': aValue = (a.organization?.name || '').toLowerCase(); bValue = (b.organization?.name || '').toLowerCase(); break;
      case 'isActive': aValue = a.isActive ? 1 : 0; bValue = b.isActive ? 1 : 0; break;
      default: return 0;
    }
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredUsers = sortedUsers.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <MoreHorizontal className="w-3 h-3 ml-1 opacity-20" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUpCircle className="w-3 h-3 ml-1 text-emerald" />
      : <ArrowDownCircle className="w-3 h-3 ml-1 text-emerald" />;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-700">

      {/* Alert */}
      {alert && (
        <div className={clsx(
          "fixed top-4 right-4 z-[110] py-3 px-4 rounded-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2 border backdrop-blur-md shadow-xl",
          alert.type === 'success'
            ? 'bg-emerald/10 text-emerald border-emerald/20'
            : 'bg-rose/10 text-rose border-rose/20'
        )}>
          {alert.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {alert.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-white/10 pb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="w-6 h-6 text-emerald" />
            {t('title')}
            {orgId && (
              <span className="flex items-center gap-2 text-white/30 ml-1">
                <ChevronRight className="w-4 h-4" />
                <span className="text-slate font-medium">{organizations.find(o => o.id === orgId)?.name || users[0]?.organization?.name || 'Org Directory'}</span>
              </span>
            )}
          </h1>
          <p className="text-slate text-[12px] mt-1 font-bold uppercase tracking-widest">
            {orgId ? `Managing users under ${(organizations.find(o => o.id === orgId)?.name || users[0]?.organization?.name || 'this organization')}.` : 'Manage access and roles for your organization.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate w-4 h-4" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-emerald/50 outline-none text-sm text-white placeholder:text-slate/50 transition-all focus:bg-white/10"
              data-testid="users-list-input-search"
            />
          </div>
          
          {/* View Toggle */}
          <div className="flex bg-white/5 border border-white/5 rounded-lg p-0.5 shrink-0">
            {(['table', 'grid'] as const).map((mode) => (
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

          {hasPermission('users', 'canCreate') && (
            <button
              onClick={openAddModal}
              className="bg-emerald text-navy px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 shrink-0"
              data-testid="users-list-btn-add-user"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {t('addNew')}
            </button>
          )}
        </div>
      </div>

      {/* Users View */}
      {viewMode === 'table' ? (
        <div className="bg-navy/40 backdrop-blur-xl rounded-[1.25rem] border border-white/5 overflow-hidden flex-1">
          <div className="overflow-x-auto h-full">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-slate uppercase tracking-widest cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">{t('table.name')} <SortIcon column="name" /></div>
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate uppercase tracking-widest cursor-pointer" onClick={() => handleSort('email')}>
                    <div className="flex items-center">{t('table.email')} <SortIcon column="email" /></div>
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate uppercase tracking-widest text-center">{t('table.role')}</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate uppercase tracking-widest">{t('table.organization')}</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate uppercase tracking-widest text-center">{t('table.status')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate uppercase tracking-widest text-right">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={6} className="p-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald" /></td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={6} className="p-16 text-center text-xs font-bold text-slate uppercase tracking-widest">{t('empty')}</td></tr>
                ) : filteredUsers.map((person) => (
                  <tr key={person.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-white">{person.firstName} {person.lastName}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-slate">{person.email}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={clsx(
                        "inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                        person.organizationId === SYSTEM_ORG_ID
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                          : 'bg-emerald/10 text-emerald border-emerald/20'
                      )}>
                        {person.role?.name || 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-bold text-slate">{person.organization?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleStatus(person)}
                        data-testid={`users-list-toggle-status-${person.email}`}
                        disabled={(!user?.isSystemAdmin && person.organizationId !== user?.organizationId) || (person.organizationId === SYSTEM_ORG_ID || person.isSystemAdmin)}
                        className={clsx(
                          "inline-block w-2.5 h-2.5 rounded-full border-2 transition-all shadow-sm",
                          person.isActive ? 'bg-emerald border-emerald/40 shadow-emerald/30' : 'bg-rose border-rose/40',
                          ((!user?.isSystemAdmin && person.organizationId !== user?.organizationId) || (person.organizationId === SYSTEM_ORG_ID || person.isSystemAdmin))
                            ? 'cursor-default opacity-40'
                            : 'cursor-pointer hover:scale-125'
                        )}
                        title={person.isActive ? 'Active' : 'Inactive'}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {user?.isSystemAdmin && person.organizationId !== user.organizationId && !person.isSystemAdmin && (
                          <button
                            onClick={() => handleResetPassword(person.id)}
                            data-testid={`users-list-btn-reset-pw-${person.email}`}
                            className="p-2 text-slate hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-500/20"
                            title="Reset Password"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(person.id === user?.id || (!person.isSystemAdmin && (hasPermission('users', 'canUpdate') || (user?.isSystemAdmin && person.organizationId !== user.organizationId)))) && (
                          <button
                            onClick={() => openEditModal(person)}
                            data-testid={`users-list-btn-edit-${person.email}`}
                            className="p-2 text-slate hover:text-emerald hover:bg-emerald/10 rounded-lg transition-colors border border-transparent hover:border-emerald/20"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('users', 'canDelete') && (user?.isSystemAdmin && person.organizationId === user.organizationId) && person.id !== user?.id && !person.isSystemAdmin && (
                          <button
                            onClick={() => handleDelete(person.id)}
                            data-testid={`users-list-btn-delete-${person.email}`}
                            className="p-2 text-slate hover:text-rose hover:bg-rose/10 rounded-lg transition-colors border border-transparent hover:border-rose/20"
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
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="p-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald" /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 text-center text-xs font-bold text-slate uppercase tracking-widest">{t('empty')}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredUsers.map((person) => (
                <GlassCard
                  key={person.id}
                  className="p-5 flex flex-col justify-between rounded-[1.25rem] bg-navy/40 border border-white/5 relative group hover:border-emerald/30 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald transition-colors truncate">
                        {person.firstName} {person.lastName}
                      </h3>
                      <p className="text-[10px] text-slate truncate mt-0.5">{person.email}</p>
                    </div>
                    <button
                      onClick={() => toggleStatus(person)}
                      data-testid={`users-grid-toggle-status-${person.email}`}
                      disabled={(!user?.isSystemAdmin && person.organizationId !== user?.organizationId) || (person.organizationId === SYSTEM_ORG_ID || person.isSystemAdmin)}
                      className={clsx(
                        "w-2.5 h-2.5 rounded-full border-2 transition-all shadow-sm shrink-0",
                        person.isActive ? 'bg-emerald border-emerald/40 shadow-emerald/30 animate-pulse' : 'bg-rose border-rose/40',
                        ((!user?.isSystemAdmin && person.organizationId !== user?.organizationId) || (person.organizationId === SYSTEM_ORG_ID || person.isSystemAdmin))
                          ? 'cursor-default opacity-40'
                          : 'cursor-pointer hover:scale-125'
                      )}
                      title={person.isActive ? 'Active' : 'Inactive'}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 items-center mb-4">
                    <span className={clsx(
                      "px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shrink-0",
                      person.organizationId === SYSTEM_ORG_ID
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        : 'bg-emerald/10 text-emerald border-emerald/20'
                    )}>
                      {person.role?.name || 'User'}
                    </span>
                    {person.organization?.name && (
                      <span className="text-[9px] font-bold text-slate/80 bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg truncate max-w-[150px]">
                        {person.organization.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-white/5 mt-auto">
                    {user?.isSystemAdmin && person.organizationId !== user.organizationId && !person.isSystemAdmin && (
                      <button
                        onClick={() => handleResetPassword(person.id)}
                        data-testid={`users-grid-btn-reset-pw-${person.email}`}
                        className="p-1.5 text-slate hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-500/20"
                        title="Reset Password"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(person.id === user?.id || (!person.isSystemAdmin && (hasPermission('users', 'canUpdate') || (user?.isSystemAdmin && person.organizationId !== user.organizationId)))) && (
                      <button
                        onClick={() => openEditModal(person)}
                        data-testid={`users-grid-btn-edit-${person.email}`}
                        className="p-1.5 text-slate hover:text-emerald hover:bg-emerald/10 rounded-lg transition-colors border border-transparent hover:border-emerald/20"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {hasPermission('users', 'canDelete') && (user?.isSystemAdmin && person.organizationId === user.organizationId) && person.id !== user?.id && !person.isSystemAdmin && (
                      <button
                        onClick={() => handleDelete(person.id)}
                        data-testid={`users-grid-btn-delete-${person.email}`}
                        className="p-1.5 text-slate hover:text-rose hover:bg-rose/10 rounded-lg transition-colors border border-transparent hover:border-rose/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal — New User / View User Details / Edit Profile */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-navy/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/10">
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/10">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">
                {currentUserId === user?.id
                  ? t('modal.myAccount')
                  : (isEditing && formData.organizationId !== SYSTEM_ORG_ID
                    ? t('modal.viewDetails')
                    : (isEditing ? t('modal.editProfile') : t('modal.newUser')))}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate uppercase tracking-widest mb-1.5">{t('form.firstName')}</label>
                  <input type="text" required value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-emerald/50 transition-all"
                    data-testid="users-form-input-firstname"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate uppercase tracking-widest mb-1.5">{t('form.lastName')}</label>
                  <input type="text" required value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-emerald/50 transition-all"
                    data-testid="users-form-input-lastname"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate uppercase tracking-widest mb-1.5">{t('form.email')}</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald/50 transition-all"
                  data-testid="users-form-input-email"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate uppercase tracking-widest mb-1.5">
                  {t('form.password')} {isEditing && <span className="text-[9px] lowercase font-medium opacity-60">{t('form.passwordOptional')}</span>}
                </label>
                <input type="password" required={!isEditing} minLength={6} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder={isEditing ? '••••••••' : ''}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald/50 transition-all"
                  data-testid="users-form-input-password"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate uppercase tracking-widest mb-1.5">{t('form.role')}</label>
                  <select required value={formData.roleId} onChange={(e) => setFormData({...formData, roleId: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-emerald/50 cursor-pointer appearance-none"
                    data-testid="users-form-sel-role"
                  >
                    <option value="" disabled className="bg-navy">{t('form.select')}</option>
                    {roles.map(r => <option key={r.id} value={r.id} className="bg-navy">{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate uppercase tracking-widest mb-1.5">{t('form.org')}</label>
                  {user?.isSystemAdmin ? (
                    <select required value={formData.organizationId} onChange={(e) => setFormData({...formData, organizationId: e.target.value})}
                      disabled={isEditing && !user?.isSystemAdmin}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-emerald/50 cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="users-form-sel-org"
                    >
                      <option value="" disabled className="bg-navy">{t('form.select')}</option>
                      {organizations.map(o => <option key={o.id} value={o.id} className="bg-navy">{o.name}</option>)}
                    </select>
                  ) : (
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate truncate">{user?.orgName}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xs font-bold text-slate">{t('form.activeAccount')}</span>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                  className={clsx(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-all",
                    formData.isActive ? 'bg-emerald shadow-[0_0_10px_rgba(80,200,120,0.4)]' : 'bg-white/10'
                  )}
                >
                  <span className={clsx("inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm", formData.isActive ? 'translate-x-5' : 'translate-x-0.5')} />
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleRequestReset}
                    className="flex-1 py-2.5 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-xl border border-amber-500/20 hover:bg-amber-500/20 transition-all active:scale-95"
                  >
                    {t('form.resetPassword')}
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-[2] py-2.5 bg-emerald text-navy text-xs font-black rounded-xl hover:shadow-[0_0_20px_rgba(80,200,120,0.4)] transition-all active:scale-95"
                  data-testid="users-form-btn-save"
                >
                  {t('form.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
