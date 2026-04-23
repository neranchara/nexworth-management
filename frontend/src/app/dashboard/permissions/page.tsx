'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Shield, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Permission } from '@/types/auth';
import { usePermissions } from '@/hooks/usePermissions';

interface Role {
  id: string;
  name: string;
}


const RESOURCES = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'monthly', name: 'Monthly Summary' },
  { id: 'transactions', name: 'Transactions' },
  { id: 'accounts', name: 'My Accounts' },
  { id: 'assets', name: 'Assets Management' },
  { id: 'liabilities', name: 'Liabilities Management' },
  { id: 'banks', name: 'Banks' },
  { id: 'types', name: 'Transaction Types' },
  { id: 'categories', name: 'Categories' },
  { id: 'users', name: 'User Management' },
  { id: 'loan-tracker', name: 'Loan Tracker' },
  { id: 'permissions', name: 'Role Permissions' },
];

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const { hasPermission } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data.roles);
      if (res.data.roles.length > 0) {
        setSelectedRole(res.data.roles[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch roles', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async (roleId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/roles/${roleId}/permissions`);
      const existing = res.data.permissions;
      
      // Merge with default list of resources
      const merged = RESOURCES.map(resDef => {
        const found = existing.find((p: Permission) => p.resource === resDef.id);
        return found || {
          resource: resDef.id,
          canView: false,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
        };
      });
      
      setPermissions(merged);
    } catch (err) {
      console.error('Failed to fetch permissions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchPermissions(selectedRole);
    }
  }, [selectedRole]);

  const handleToggle = (resource: string, field: keyof Permission) => {
    setPermissions(prev => prev.map(p => {
      if (p.resource === resource) {
        return { ...p, [field]: !p[field] };
      }
      return p;
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post(`/roles/${selectedRole}/permissions`, permissions);
      setMessage({ text: 'Permissions updated successfully', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ text: 'Failed to update permissions', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading && roles.length === 0) return <div className="p-8"><Loader2 className="animate-spin" /> Loading roles...</div>;
  
  if (!hasPermission('permissions', 'canView')) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
         <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
         <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
         <p className="text-gray-600 dark:text-gray-400">You do not have permission to manage role permissions.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-blue-600" />
            Role Permissions Management
          </h1>
          <p className="text-gray-500">Define what each user role can see and do.</p>
        </div>
        
        {hasPermission('permissions', 'canUpdate') && (
          <button
            onClick={handleSave}
            disabled={saving || !selectedRole}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-4">
          <label className="font-semibold text-gray-700 dark:text-gray-300">Select Role:</label>
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Module/Resource</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">View</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Create</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Update</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading configurations...</td></tr>
              ) : permissions.map((p) => (
                <tr key={p.resource} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {RESOURCES.find(r => r.id === p.resource)?.name || p.resource}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={p.canView} 
                      onChange={() => handleToggle(p.resource, 'canView')}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={p.canCreate} 
                      onChange={() => handleToggle(p.resource, 'canCreate')}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={p.canUpdate} 
                      onChange={() => handleToggle(p.resource, 'canUpdate')}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={p.canDelete} 
                      onChange={() => handleToggle(p.resource, 'canDelete')}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
