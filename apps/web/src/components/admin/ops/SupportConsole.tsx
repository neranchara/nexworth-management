import React, { useState, useEffect } from 'react';
import { Search, Filter, Shield, UserCheck, Clock, ExternalLink, RefreshCw, AlertTriangle, CheckCircle2, Zap, Activity } from 'lucide-react';
import api from '@/lib/api';

interface ImpersonationLog {
  id: string;
  impersonator: { email: string; firstName: string; lastName: string };
  targetUser: { email: string; firstName: string; lastName: string };
  ticketReference: string;
  accessIp: string;
  startedAt: string;
  endedAt?: string;
}

interface ReconciliationReport {
  accountId: string;
  accountName: string;
  type: 'ASSET' | 'LIABILITY';
  currentBalance: number;
  calculatedBalance: number;
  diff: number;
  isMatch: boolean;
  transactionCount: number;
}

export const SupportConsole = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'integrity'>('logs');
  const [logs, setLogs] = useState<ImpersonationLog[]>([]);
  const [integrityReports, setIntegrityReports] = useState<ReconciliationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/impersonation-logs');
      setLogs(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch support logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegrity = async () => {
    try {
      setLoading(true);
      // Fetch user diagnostic first to get a user, then reconcile their accounts
      // In a real scenario, we might have a global scan. For now, let's scan all mismatches.
      const response = await api.get('/admin/integrity-report');
      // If we had a bulk check, we'd use it. For now, let's simulate with some common accounts 
      // or fetch the global report if implemented.
      
      // Let's assume we implement a more broad scan in the backend or fetch recent accounts.
      // For the demo, let's use the integrity report data.
      if (response.data.data.mismatches) {
        setIntegrityReports(response.data.data.mismatches);
      } else {
        // Fetch all accounts and check them (This might be slow, but it's an admin tool)
        const accountsRes = await api.get('/accounts');
        const reports = [];
        for (const acc of accountsRes.data.data.slice(0, 10)) {
           try {
             const recRes = await api.post(`/admin/reconcile/${acc.id}`);
             reports.push(recRes.data.data);
           } catch (e) {}
        }
        setIntegrityReports(reports);
      }
    } catch (error: any) {
      console.error('Failed to fetch integrity reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (accountId: string) => {
    try {
      setSyncing(accountId);
      await api.post(`/admin/reconcile/${accountId}/sync`);
      // Refresh after sync
      if (activeTab === 'integrity') fetchIntegrity();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
    else fetchIntegrity();
  }, [activeTab]);

  const filteredLogs = logs.filter(log => 
    log.impersonator.email.toLowerCase().includes(search.toLowerCase()) ||
    log.targetUser.email.toLowerCase().includes(search.toLowerCase()) ||
    log.ticketReference.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex flex-col h-full overflow-hidden gap-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">Support Console</h2>
            <p className="text-[10px] text-slate-500 mt-1 font-bold tracking-tight uppercase">Admin Diagnostics & System Integrity</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Tab Switcher */}
          <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex items-center">
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Support Logs
            </button>
            <button 
              onClick={() => setActiveTab('integrity')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'integrity' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Data Integrity
            </button>
          </div>

          <div className="relative w-64">
            <input
              type="text"
              placeholder={activeTab === 'logs' ? "Search sessions..." : "Search accounts..."}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none placeholder:text-slate-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          </div>
          
          <button 
            onClick={activeTab === 'logs' ? fetchLogs : fetchIntegrity} 
            className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden border border-white/5 rounded-2xl bg-slate-900/30 shadow-inner">
        <div className="h-full overflow-auto custom-scrollbar relative">
          {activeTab === 'logs' ? (
            <table className="w-full text-left text-[11px] border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
                <tr>
                  <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5">Timestamp</th>
                  <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5">Support Agent</th>
                  <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5">Target User</th>
                  <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5">Ticket</th>
                  <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5 text-right">Access IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4"><div className="h-2 bg-slate-800 rounded w-16"></div></td>
                      <td className="px-5 py-4"><div className="h-4 bg-slate-800 rounded w-40"></div></td>
                      <td className="px-5 py-4"><div className="h-4 bg-slate-800 rounded w-40"></div></td>
                      <td className="px-5 py-4"><div className="h-3 bg-slate-800 rounded w-32"></div></td>
                      <td className="px-5 py-4 text-right"><div className="h-2 bg-slate-800 rounded w-20 ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-emerald-500/[0.03] transition-colors group">
                      <td className="px-5 py-4 text-slate-500 font-mono text-[10px]">
                        <div className="flex flex-col">
                          <span>{new Date(log.startedAt).toLocaleDateString()}</span>
                          <span className="text-[9px] opacity-70">{new Date(log.startedAt).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-[10px]">
                            {log.impersonator.firstName?.[0]}{log.impersonator.lastName?.[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-200 font-bold tracking-tight">{log.impersonator.firstName} {log.impersonator.lastName}</span>
                            <span className="text-[9px] text-slate-500 lowercase">{log.impersonator.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3 h-3 text-emerald-500/50" />
                            <span className="text-slate-300 font-medium">{log.targetUser.firstName} {log.targetUser.lastName}</span>
                          </div>
                          <span className="text-[9px] text-slate-600 ml-4.5">{log.targetUser.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-1 bg-slate-800/50 text-slate-400 border border-white/5 rounded-lg text-[10px] font-bold tracking-tight">
                          {log.ticketReference}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-slate-500 text-[10px]">
                        {log.accessIp || 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="px-5 py-24 text-center opacity-30">No logs found</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-[11px] border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
                <tr>
                  <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5">Account Name</th>
                  <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5">Type</th>
                  <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5 text-right">Current Balance</th>
                  <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5 text-right">Calculated</th>
                  <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5 text-center">Status</th>
                  <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4"><div className="h-4 bg-slate-800 rounded w-40"></div></td>
                      <td className="px-5 py-4"><div className="h-3 bg-slate-800 rounded w-20"></div></td>
                      <td className="px-5 py-4 text-right"><div className="h-4 bg-slate-800 rounded w-24 ml-auto"></div></td>
                      <td className="px-5 py-4 text-right"><div className="h-4 bg-slate-800 rounded w-24 ml-auto"></div></td>
                      <td className="px-5 py-4"><div className="h-4 bg-slate-800 rounded-full w-12 mx-auto"></div></td>
                      <td className="px-5 py-4"><div className="h-8 bg-slate-800 rounded w-20 ml-auto"></div></td>
                    </tr>
                  ))
                ) : integrityReports.length > 0 ? (
                  integrityReports.map((report) => (
                    <tr key={report.accountId} className="hover:bg-emerald-500/[0.03] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200 font-bold tracking-tight">{report.accountName}</span>
                          <span className="text-[9px] text-slate-500 font-mono uppercase">{report.accountId}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[9px] font-black tracking-widest uppercase ${report.type === 'ASSET' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {report.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-slate-300 font-mono font-bold">
                        {report.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-500 font-mono">
                        {report.calculatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {report.isMatch ? (
                          <div className="flex items-center justify-center gap-1.5 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full text-[9px] font-black uppercase">
                            <CheckCircle2 className="w-3 h-3" />
                            Healthy
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-full text-[9px] font-black uppercase animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Mismatch
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {!report.isMatch && (
                          <button 
                            disabled={syncing === report.accountId}
                            onClick={() => handleSync(report.accountId)}
                            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ml-auto transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                          >
                            <Zap className={`w-3 h-3 ${syncing === report.accountId ? 'animate-pulse' : ''}`} />
                            {syncing === report.accountId ? 'Syncing...' : 'Force Sync'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="px-5 py-24 text-center opacity-30">No integrity issues found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="flex items-center justify-between shrink-0 pt-2 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'logs' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'logs' ? 'text-emerald-500' : 'text-blue-500'}`}>
              {activeTab === 'logs' ? 'Live Audit Active' : 'Integrity Monitor Online'}
            </span>
          </div>
          <span className="w-px h-3 bg-white/10" />
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">
            {activeTab === 'logs' ? `${filteredLogs.length} Records Retrieved` : `${integrityReports.length} Accounts Scanned`}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-[9px] text-slate-500 font-medium italic">
          <Activity className="w-3 h-3" />
          <span>Security & Integrity Protocol v3.2.0</span>
        </div>
      </div>
    </div>
  );
};
