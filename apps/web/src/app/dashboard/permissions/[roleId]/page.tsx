'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Shield, Save, CheckCircle, AlertCircle,
  Loader2, ArrowLeft, Info
} from 'lucide-react';
import { Permission } from '@/types/auth';
import { usePermissions } from '@/hooks/usePermissions';
import { clsx } from 'clsx';

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

  if (!hasPermission('permissions', 'canView')) {
    return (
      <div className="p-8 text-center text-xs font-black uppercase tracking-widest text-rose">
        Access Denied
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/permissions${orgId ? `?orgId=${orgId}` : ''}`)}
            className="p-2 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all text-slate hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-2xl font-black text-white tracking-tight">Configure Permissions</h1>
              {role?.isSystemRole && (
                <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 text-[9px] font-black uppercase border border-orange-500/20">System</span>
              )}
            </div>
            <p className="text-[11px] font-black text-emerald uppercase tracking-widest">{role?.name || 'Loading...'}</p>
          </div>
        </div>

        {hasPermission('permissions', 'canUpdate') && (
          <button
            onClick={handleSave}
            disabled={saving || loading}
            data-testid="permissions-config-btn-save"
            className="flex items-center gap-2 bg-emerald text-navy px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            Save Settings
          </button>
        )}
      </div>

      {/* Role Description */}
      {role?.description && (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate leading-relaxed italic">&quot;{role.description}&quot;</p>
        </div>
      )}

      {/* Alert */}
      {message && (
        <div className={clsx(
          "mb-6 py-3 px-4 rounded-xl flex items-center gap-2 text-xs font-bold border animate-in slide-in-from-top-2",
          message.type === 'success'
            ? 'bg-emerald/10 text-emerald border-emerald/20'
            : 'bg-rose/10 text-rose border-rose/20'
        )}>
          {message.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {message.text}
        </div>
      )}

      {/* Permissions Matrix */}
      <div className="bg-navy/40 backdrop-blur-xl rounded-[1.25rem] border border-white/5 overflow-hidden flex-1">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-slate uppercase tracking-widest">Resource Module</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate uppercase tracking-widest text-center w-28">View</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate uppercase tracking-widest text-center w-28">Create</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate uppercase tracking-widest text-center w-28">Update</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate uppercase tracking-widest text-center w-28">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="p-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald" /></td></tr>
              ) : permissions.map((p) => (
                <tr key={p.resource} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-4 rounded-full bg-emerald/50" />
                      <span className="text-sm font-bold text-white">
                        {RESOURCES.find(r => r.id === p.resource)?.name || p.resource}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4"><div className="flex justify-center"><GlassToggle checked={p.canView} onChange={() => handleToggle(p.resource, 'canView')} disabled={!hasPermission('permissions', 'canUpdate')} testId={`permissions-config-toggle-${p.resource}-view`} /></div></td>
                  <td className="px-4 py-4"><div className="flex justify-center"><GlassToggle checked={p.canCreate} onChange={() => handleToggle(p.resource, 'canCreate')} disabled={!hasPermission('permissions', 'canUpdate')} testId={`permissions-config-toggle-${p.resource}-create`} /></div></td>
                  <td className="px-4 py-4"><div className="flex justify-center"><GlassToggle checked={p.canUpdate} onChange={() => handleToggle(p.resource, 'canUpdate')} disabled={!hasPermission('permissions', 'canUpdate')} testId={`permissions-config-toggle-${p.resource}-update`} /></div></td>
                  <td className="px-4 py-4"><div className="flex justify-center"><GlassToggle checked={p.canDelete} onChange={() => handleToggle(p.resource, 'canDelete')} disabled={!hasPermission('permissions', 'canUpdate')} testId={`permissions-config-toggle-${p.resource}-delete`} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const GlassToggle = ({ checked, onChange, disabled, testId }: { checked: boolean; onChange: () => void; disabled: boolean; testId: string }) => (
  <button
    onClick={onChange}
    disabled={disabled}
    data-testid={testId}
    className={clsx(
      "relative inline-flex h-5 w-9 items-center rounded-full transition-all disabled:opacity-30",
      checked
        ? 'bg-emerald shadow-[0_0_10px_rgba(80,200,120,0.4)]'
        : 'bg-white/10'
    )}
  >
    <span className={clsx(
      "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform",
      checked ? 'translate-x-5' : 'translate-x-0.5'
    )} />
  </button>
);
