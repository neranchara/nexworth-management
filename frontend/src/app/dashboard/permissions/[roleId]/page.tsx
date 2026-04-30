'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  Shield, Save, CheckCircle, AlertCircle, 
  Loader2, ArrowLeft, ShieldCheck, Box, Info
} from 'lucide-react';
import { Permission } from '@/types/auth';
import { usePermissions } from '@/hooks/usePermissions';

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
  { id: 'organizations', name: 'Organizations Management' },
];

export default function ManagePermissionsPage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = use(params);
  const [role, setRole] = useState<{ id: string, name: string, description: string, isSystemRole: boolean, organizationId?: string } | null>(null);
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId');

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = orgId ? `/roles?orgId=${orgId}` : '/roles';
      const rolesRes = await api.get(url);
      const foundRole = rolesRes.data.roles.find((r: any) => r.id === roleId);
      if (!foundRole) {
        router.push('/dashboard/permissions');
        return;
      }
      setRole(foundRole);
      
      const res = await api.get(`/roles/${roleId}/permissions`);
      const existing = res.data.permissions;
      
      const isTargetSystemOrg = foundRole.organizationId === '7f4b8f80-dfb7-4492-9a06-28dad5691dd7' || foundRole.isSystemRole;
      const availableResources = RESOURCES.filter(r => r.id !== 'organizations' || isTargetSystemOrg);

      const merged = availableResources.map(resDef => {
        const found = existing.find((p: Permission) => p.resource === resDef.id);
        return found || { resource: resDef.id, canView: false, canCreate: false, canUpdate: false, canDelete: false };
      });
      
      setPermissions(merged);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleId) fetchData();
  }, [roleId]);

  const handleToggle = (resource: string, field: keyof Permission) => {
    if (!hasPermission('permissions', 'canUpdate')) return;
    setPermissions(prev => prev.map(p => p.resource === resource ? { ...p, [field]: !p[field] } : p));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post(`/roles/${roleId}/permissions`, permissions);
      setMessage({ text: 'Settings Saved', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ text: 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission('permissions', 'canView')) return <div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-red-500">Access Denied</div>;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* Balanced Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/dashboard/permissions${orgId ? `?orgId=${orgId}` : ''}`)}
            className="p-1.5 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Configure Permissions</h1>
              {role?.isSystemRole && <span className="px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[9px] font-black uppercase border border-orange-100">System</span>}
            </div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{role?.name || 'Loading...'}</p>
          </div>
        </div>
        
        {hasPermission('permissions', 'canUpdate') && (
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            Save Settings
          </button>
        )}
      </div>

      {/* Role Description (Relocated here) */}
      {role?.description && (
        <div className="mb-6 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed italic">
            &quot;{role.description}&quot;
          </p>
        </div>
      )}

      {message && (
        <div className={`mb-6 py-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {message.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {message.text}
        </div>
      )}

      {/* Matrix Table - Compact & Balanced */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Resource Module</th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center w-24">View</th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center w-24">Create</th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center w-24">Update</th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center w-24">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></td></tr>
              ) : permissions.map((p) => (
                <tr key={p.resource} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-3 rounded-full bg-blue-500" />
                      <span className="text-[13px] font-bold text-gray-900 dark:text-white">
                        {RESOURCES.find(r => r.id === p.resource)?.name || p.resource}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4"><div className="flex justify-center"><CompactToggle checked={p.canView} onChange={() => handleToggle(p.resource, 'canView')} disabled={!hasPermission('permissions', 'canUpdate')} /></div></td>
                  <td className="px-4 py-4"><div className="flex justify-center"><CompactToggle checked={p.canCreate} onChange={() => handleToggle(p.resource, 'canCreate')} disabled={!hasPermission('permissions', 'canUpdate')} /></div></td>
                  <td className="px-4 py-4"><div className="flex justify-center"><CompactToggle checked={p.canUpdate} onChange={() => handleToggle(p.resource, 'canUpdate')} disabled={!hasPermission('permissions', 'canUpdate')} /></div></td>
                  <td className="px-4 py-4"><div className="flex justify-center"><CompactToggle checked={p.canDelete} onChange={() => handleToggle(p.resource, 'canDelete')} disabled={!hasPermission('permissions', 'canUpdate')} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const CompactToggle = ({ checked, onChange, disabled }: any) => (
  <button
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all disabled:opacity-30 ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
  >
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
  </button>
);
