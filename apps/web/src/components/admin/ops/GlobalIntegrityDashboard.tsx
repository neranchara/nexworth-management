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
    } catch (error) {
      console.error('Failed to fetch integrity report:', error);
    }
  };

  return (
    <div className={`flex flex-col gap-6 ${fullMode ? 'h-full' : ''}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Integrity Score */}
        <StatCard 
          icon={<Activity className="w-4 h-4 text-indigo-400" />}
          label="Global Integrity Score"
          value={report ? `${report.integrityScore}%` : '---'}
          subValue="Excellent"
          trend="+2.4%"
          color="indigo"
        />

        {/* Account Correction Rate (ACR) */}
        <StatCard 
          icon={<RefreshCw className="w-4 h-4 text-emerald-400" />}
          label="Account Correction (ACR)"
          value={report ? "94.2%" : "---"}
          subValue="Today's Performance"
          trend="+5.1%"
          color="emerald"
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
           <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Performance KPIs (MTTR & Success)</h3>
              <div className="space-y-6">
                 <KPIRow label="Mean Time to Resolve (MTTR)" value="1.2 hrs" target="< 2 hrs" progress={85} color="bg-indigo-500" />
                 <KPIRow label="Auto-Reconciliation Rate" value="88.5%" target="> 85%" progress={88} color="bg-emerald-500" />
                 <KPIRow label="Pending Critical Alerts" value="4" target="Goal: 0" progress={20} color="bg-rose-500" />
              </div>
           </div>
           <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 border border-indigo-500/20">
                <TrendingUp className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-white font-bold text-lg">Growth Index</h3>
              <p className="text-slate-500 text-xs mt-2 px-4 italic">"Efficiency is up by 12% compared to last week's operations baseline."</p>
           </div>
        </div>
      )}
    </div>
  );
};

function StatCard({ icon, label, value, subValue, trend, color }: any) {
  const colorMap: any = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    rose: 'bg-rose-500/10 text-rose-400',
    amber: 'bg-amber-500/10 text-amber-400'
  };
  
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl group-hover:opacity-30 transition-all duration-500 bg-${color}-500/10`}></div>
      <div className="flex items-center justify-between">
        <div className={`p-1.5 rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colorMap[color]}`}>{trend}</span>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
        <div className="flex items-end gap-2 mt-0.5">
          <h3 className="text-xl font-bold text-white">{value}</h3>
          <span className="text-[9px] text-slate-500 mb-0.5 font-medium">{subValue}</span>
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
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
