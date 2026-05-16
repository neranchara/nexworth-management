'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Database, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

export const GlobalIntegrityDashboard = ({ fullMode = false }: { fullMode?: boolean }) => {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const response = await api.get('/admin/integrity-report');
      setReport(response.data.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Failed to fetch integrity report:', error);
      }
    }
  };

  return (
    <div className={`flex flex-col gap-6 ${fullMode ? 'h-full' : ''}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Integrity Score */}
        <StatCard 
          icon={<Activity className="w-4 h-4 text-ops-primary" />}
          label="Global Integrity Score"
          value={report ? `${report.integrityScore}%` : '---'}
          subValue="Excellent"
          trend="+2.4%"
          color="ops"
        />

        {/* Account Correction Rate (ACR) */}
        <StatCard 
          icon={<RefreshCw className="w-4 h-4 text-ops-primary" />}
          label="Account Correction (ACR)"
          value={report ? "94.2%" : "---"}
          subValue="Today's Performance"
          trend="+5.1%"
          color="ops"
        />

        {/* Balance Mismatch */}
        <StatCard 
          icon={<AlertCircle className="w-4 h-4 text-rose-400" />}
          label="Balance Mismatch"
          value={report ? `฿${report.mismatchCount}` : '฿0.00'}
          subValue="Threshold: 1M"
          trend="Safe"
          color="rose"
        />

        {/* Throughput */}
        <StatCard 
          icon={<TrendingUp className="w-4 h-4 text-amber-400" />}
          label="System Throughput"
          value="425 tps"
          subValue={report ? `Org: ${report.organizationsCount}` : '---'}
          trend="Live"
          color="amber"
        />
      </div>

       {fullMode && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="lg:col-span-2 bg-slate-900/50 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest">Performance KPIs (MTTR & Success)</h3>
              <div className="space-y-6">
                 <KPIRow label="Mean Time to Resolve (MTTR)" value="1.2 hrs" target="< 2 hrs" progress={85} color="bg-ops-primary" />
                 <KPIRow label="Auto-Reconciliation Rate" value="88.5%" target="> 85%" progress={88} color="bg-ops-primary" />
                 <KPIRow label="Pending Critical Alerts" value="4" target="Goal: 0" progress={20} color="bg-rose-500" />
              </div>
           </div>
           <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center group">
              <div className="w-20 h-20 bg-ops-primary/5 rounded-full flex items-center justify-center mb-4 border border-ops-primary/10 group-hover:scale-110 transition-transform duration-700">
                <TrendingUp className="w-10 h-10 text-ops-primary" />
              </div>
              <h3 className="text-white font-black text-lg uppercase tracking-widest">Growth Index</h3>
              <p className="text-slate-500 text-[11px] font-bold mt-2 px-4 italic leading-relaxed opacity-60">"Efficiency is up by 12% compared to last week's operations baseline."</p>
           </div>
        </div>
      )}
    </div>
  );
};

function StatCard({ icon, label, value, subValue, trend, color }: any) {
  const colorMap: any = {
    ops: 'bg-ops-primary/10 text-ops-primary',
    emerald: 'bg-ops-primary/10 text-ops-primary',
    rose: 'bg-rose-500/10 text-rose-400',
    amber: 'bg-amber-500/10 text-amber-400'
  };
  
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group shadow-xl">
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl group-hover:opacity-30 transition-all duration-500 ${
        color === 'ops' ? 'bg-ops-primary/10' : `bg-${color}-500/10`
      }`}></div>
      <div className="flex items-center justify-between">
        <div className={`p-1.5 rounded-lg border border-white/5 ${colorMap[color]}`}>
          {icon}
        </div>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${colorMap[color]}`}>{trend}</span>
      </div>
      <div>
        <p className="text-[10px] text-slate font-black uppercase tracking-[0.2em] opacity-40">{label}</p>
        <div className="flex items-end gap-2 mt-1">
          <h3 className="text-xl font-black text-white tracking-tighter">{value}</h3>
          <span className="text-[9px] text-slate mb-0.5 font-bold uppercase tracking-widest opacity-60">{subValue}</span>
        </div>
      </div>
    </div>
  );
}

function KPIRow({ label, value, target, progress, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs text-white font-semibold">{label}</p>
          <p className="text-[10px] text-slate-500">Target: {target}</p>
        </div>
        <span className="text-sm font-black text-white">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div className={`h-full ${color} transition-all duration-1000 shadow-[0_0_10px_rgba(80,200,120,0.3)]`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
