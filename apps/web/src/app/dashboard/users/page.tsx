'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { 
  Edit2, Trash2, X, CheckCircle, AlertCircle, 
  ArrowUpCircle, ArrowDownCircle, MoreHorizontal,
  Users, Plus, RefreshCw, Loader2, Search, UserPlus, ChevronRight
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { User, Organization } from '@/types/models';

interface Role {
  id: string;
  name: string;
}

export default function UsersManagementPage() {
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
    if (!window.confirm("Generate a new random password and send it to the user's email?")) return;
    try {
      const res = await api.post(`/users/${id}/reset-password`);
      showAlert(res.data.message, 'success');
    } catch (err: any) {
      showAlert(err.response?.data?.error || 'Reset failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      showAlert('Deleted', 'success');
      fetchUsersAndRoles();
    } catch (err: any) {
      showAlert('Delete failed', 'error');
    }
  };

  const toggleStatus = async (u: User) => {
    if (!user?.isSystemAdmin && u.organizationId !== user?.organizationId) return;
    // Don't disable the main system management org status easily, but follow general rules
    if (u.organizationId === '7f4b8f80-dfb7-4492-9a06-28dad5691dd7' && u.role?.name === 'Super Admin' && !user?.isSystemAdmin) return;
    
    try {
      await api.put(`/users/${u.id}`, { isActive: !u.isActive });
      showAlert('Status updated', 'success');
      fetchUsersAndRoles();
    } catch (err: any) {
      showAlert('Update failed', 'error');
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
        showAlert('Updated', 'success');
      } else {
        await api.post('/users', payload);
        showAlert('Created', 'success');
      }
      setIsModalOpen(false);
      fetchUsersAndRoles();
    } catch (err: any) {
      showAlert(err.response?.data?.error || 'Save failed', 'error');
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
    return sortConfig.direction === 'asc' ? <ArrowUpCircle className="w-3 h-3 ml-1 text-blue-500" /> : <ArrowDownCircle className="w-3 h-3 ml-1 text-blue-500" />;
  };

  return (
    <div className="py-6 min-h-screen animate-in fade-in duration-700">
      {/* Alert Pop-up */}
      {alert && (
        <div className={`fixed top-4 right-4 z-[110] py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2 border ${alert.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {alert.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {alert.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Users
            {orgId && (
              <span className="flex items-center gap-2 text-gray-300 ml-1">
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-500 dark:text-gray-400 font-medium">{organizations.find(o => o.id === orgId)?.name || users[0]?.organization?.name || 'Org Directory'}</span>
              </span>
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-[13px]">
            {orgId ? `Managing all users under ${(organizations.find(o => o.id === orgId)?.name || users[0]?.organization?.name || 'this organization')}.` : 'Manage access and roles for your organization.'}
          </p>
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
              data-testid="users-list-input-search"
            />
          </div>
          {hasPermission('users', 'canCreate') && (
            <button
              onClick={openAddModal}
              className="bg-emerald text-navy px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
              data-testid="users-list-btn-add-user"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Table Section - Compact & Professional */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest cursor-pointer group" onClick={() => handleSort('name')}>
                  <div className="flex items-center">Name <SortIcon column="name" /></div>
                </th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest cursor-pointer group" onClick={() => handleSort('email')}>
                  <div className="flex items-center">Email <SortIcon column="email" /></div>
                </th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Role</th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Organization</th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-xs font-bold text-gray-400">No users found.</td></tr>
              ) : filteredUsers.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                  <td className="px-6 py-3">
                    <span className="text-[13px] font-bold text-gray-900 dark:text-white">{person.firstName} {person.lastName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{person.email}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${person.organizationId === '7f4b8f80-dfb7-4492-9a06-28dad5691dd7' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                      {person.role?.name || 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{person.organization?.name || '---'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => toggleStatus(person)}
                      data-testid={`users-list-toggle-status-${person.email}`}
                      disabled={(!user?.isSystemAdmin && person.organizationId !== user?.organizationId) || (person.organizationId === '7f4b8f80-dfb7-4492-9a06-28dad5691dd7' || person.isSystemAdmin)}
                      className={`inline-block w-3 h-3 rounded-full border-2 transition-all ${person.isActive ? 'bg-green-500 border-green-200' : 'bg-red-500 border-red-200'} ${((!user?.isSystemAdmin && person.organizationId !== user?.organizationId) || (person.organizationId === '7f4b8f80-dfb7-4492-9a06-28dad5691dd7' || person.isSystemAdmin)) ? 'cursor-default opacity-40' : 'cursor-pointer hover:scale-125'}`}
                      title={person.isActive ? 'Active' : 'Inactive'}
                    />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user?.isSystemAdmin && person.organizationId !== user.organizationId && !person.isSystemAdmin && (
                        <button 
                          onClick={() => handleResetPassword(person.id)} 
                          data-testid={`users-list-btn-reset-pw-${person.email}`}
                          className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {(person.id === user?.id || (!person.isSystemAdmin && (hasPermission('users', 'canUpdate') || (user?.isSystemAdmin && person.organizationId !== user.organizationId)))) && (
                        <button 
                          onClick={() => openEditModal(person)} 
                          data-testid={`users-list-btn-edit-${person.email}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {hasPermission('users', 'canDelete') && (user?.isSystemAdmin && person.organizationId === user.organizationId) && person.id !== user?.id && !person.isSystemAdmin && (
                        <button 
                          onClick={() => handleDelete(person.id)} 
                          data-testid={`users-list-btn-delete-${person.email}`}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
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

      {/* Compact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                 <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                   {currentUserId === user?.id ? 'My Account Details' : (isEditing && formData.organizationId !== '7f4b8f80-dfb7-4492-9a06-28dad5691dd7' ? 'View User Details' : (isEditing ? 'Edit Profile' : 'New User'))}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">First Name</label>
                      <input type="text" required value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[13px] font-bold focus:outline-none focus:border-blue-500 bg-transparent" 
                        data-testid="users-form-input-firstname"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Name</label>
                      <input type="text" required value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[13px] font-bold focus:outline-none focus:border-blue-500 bg-transparent" 
                        data-testid="users-form-input-lastname"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[13px] focus:outline-none focus:border-blue-500 bg-transparent" 
                      data-testid="users-form-input-email"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Password {isEditing && <span className="text-[9px] lowercase font-medium opacity-60">(optional)</span>}</label>
                    <input type="password" required={!isEditing} minLength={6} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder={isEditing ? '••••••••' : ''} 
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[13px] focus:outline-none focus:border-blue-500 bg-transparent" 
                      data-testid="users-form-input-password"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Role</label>
                      <select required value={formData.roleId} onChange={(e) => setFormData({...formData, roleId: e.target.value})} 
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[13px] font-bold focus:outline-none focus:border-blue-500 bg-transparent"
                        data-testid="users-form-sel-role"
                      >
                        <option value="" disabled>Select...</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Org</label>
                      {user?.isSystemAdmin ? (
                        <select required value={formData.organizationId} onChange={(e) => setFormData({...formData, organizationId: e.target.value})} 
                          disabled={isEditing && !user?.isSystemAdmin}
                          className={`w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[13px] font-bold focus:outline-none focus:border-blue-500 bg-transparent ${isEditing && !user?.isSystemAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                          data-testid="users-form-sel-org"
                        >
                          <option value="" disabled>Select...</option>
                          {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      ) : <div className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-[11px] font-bold text-gray-500 truncate">{user?.orgName}</div>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <span className="text-[11px] font-bold text-gray-500">Active Account</span>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {isEditing && (
                      <button 
                        type="button" 
                        onClick={handleRequestReset}
                        className="flex-1 py-2 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg border border-amber-100 hover:bg-amber-100 transition-all active:scale-95"
                      >
                        Reset Password
                      </button>
                    )}
                    <button type="submit" className="flex-[2] py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all active:scale-95 shadow-sm" data-testid="users-form-btn-save">
                      Save User
                    </button>
                  </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
