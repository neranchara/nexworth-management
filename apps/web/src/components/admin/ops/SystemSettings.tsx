'use client';

import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, ShieldCheck, Zap, Globe, Mail } from 'lucide-react';
import api from '@/lib/api';

export const SystemSettings = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/admin/config');
      setConfigs(res.data.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Failed to fetch configs:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: any, category: string) => {
    setSaving(true);
    try {
      await api.post('/admin/config', {
        key,
        value,
        category,
        reason: `Admin updated ${key} via Ops Center`
      });
      setStatus({ message: `Updated ${key} successfully`, type: 'success' });
      fetchConfigs();
    } catch (error) {
      setStatus({ message: `Failed to update ${key}`, type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatus({ message: '', type: null }), 3000);
    }
  };

  const getConfig = (key: string) => configs.find(c => c.key === key)?.value || '';

  if (loading) return <div className="h-full flex items-center justify-center text-slate-500">Loading Configuration...</div>;

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-6">
      {status.type && (
        <div className={`p-3 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <ShieldCheck size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">{status.message}</span>
        </div>
      )}

      {/* Business Rules Section */}
      <ConfigSection title="Business Rules & Materiality" icon={<Zap className="text-amber-400" />}>
        <ConfigItem 
          label="Tax Rate (VAT)" 
          description="Global VAT percentage applied to transactions."
          value={getConfig('tax_rate_vat')}
          onSave={(val: string) => handleSave('tax_rate_vat', val, 'BUSINESS')}
        />
        <ConfigItem 
          label="Auto-Match Threshold (Amount)" 
          description="Max difference allowed for auto-reconciliation (THB)."
          value={getConfig('reconcile_threshold_amount')}
          onSave={(val: string) => handleSave('reconcile_threshold_amount', val, 'BUSINESS')}
        />
        <ConfigItem 
          label="Auto-Match Threshold (Percent)" 
          description="Max difference allowed for auto-reconciliation (%)."
          value={getConfig('reconcile_threshold_percent')}
          onSave={(val: string) => handleSave('reconcile_threshold_percent', val, 'BUSINESS')}
        />
      </ConfigSection>

      {/* System Status Section */}
      <ConfigSection title="System Governance" icon={<Globe className="text-indigo-400" />}>
        <ConfigToggle 
          label="Maintenance Mode" 
          description="Redirect users to maintenance page during updates."
          active={getConfig('maintenance_mode') === 'true'}
          onSave={(val: boolean) => handleSave('maintenance_mode', val ? 'true' : 'false', 'TECHNICAL')}
        />
        <ConfigItem 
          label="System Alert Message" 
          description="Global banner message shown to all users."
          value={getConfig('system_alert_message')}
          onSave={(val: string) => handleSave('system_alert_message', val, 'TECHNICAL')}
        />
      </ConfigSection>

      {/* Notifications Section */}
      <ConfigSection title="Communications & Webhooks" icon={<Mail className="text-emerald-400" />}>
        <ConfigItem 
          label="Payment Webhook URL" 
          description="Endpoint for receiving external payment notifications."
          value={getConfig('webhook_payment_url')}
          onSave={(val: string) => handleSave('webhook_payment_url', val, 'TECHNICAL')}
        />
      </ConfigSection>
    </div>
  );
};

function ConfigSection({ title, icon, children }: any) {
  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
        {icon}
        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">{title}</h3>
      </div>
      <div className="divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

function ConfigItem({ label, description, value, onSave }: any) {
  const [currentValue, setCurrentValue] = useState(value);
  return (
    <div className="px-6 py-5 flex items-center justify-between gap-10 group hover:bg-white/5 transition-colors">
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-200">{label}</p>
        <p className="text-[10px] text-slate-500 mt-1">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <input 
          type="text" 
          className="bg-slate-950 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-2 focus:ring-indigo-500/30 transition-all w-48 outline-none"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
        />
        <button 
          onClick={() => onSave(currentValue)}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Save size={14} />
        </button>
      </div>
    </div>
  );
}

function ConfigToggle({ label, description, active, onSave }: any) {
  return (
    <div className="px-6 py-5 flex items-center justify-between gap-10 group hover:bg-white/5 transition-colors">
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-200">{label}</p>
        <p className="text-[10px] text-slate-500 mt-1">{description}</p>
      </div>
      <button 
        onClick={() => onSave(!active)}
        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${active ? 'bg-indigo-600' : 'bg-slate-700'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
