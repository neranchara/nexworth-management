'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, ArrowUpDown, History } from 'lucide-react';
import api from '@/lib/api';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  organization?: { name: string };
}

export const AuditLogExplorer = ({ fullWidth = false }: { fullWidth?: boolean }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      let url = '/admin/audit-logs';
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await api.get(url);
      setLogs(response.data.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Failed to fetch audit logs:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const exportUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/export/audit-logs?token=${token}`;
      window.open(exportUrl, '_blank');
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Export failed:', error);
      }
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex flex-col h-full overflow-hidden gap-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <History className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-widest">Audit Log Explorer</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search by action or entity..."
              className="w-full bg-white/5 border border-white/5 rounded-xl py-1.5 pl-9 pr-4 text-xs text-slate-200 focus:ring-2 focus:ring-amber-500/30 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-500" />
          </div>
          <button 
            onClick={() => fetchLogs()} 
            className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Filter Results"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Container - This is the flex-1 scrollable area */}
      <div className="flex-1 min-h-0 overflow-hidden border border-white/5 rounded-2xl bg-slate-900/30">
        <div className="h-full overflow-auto custom-scrollbar relative">
          <table className="w-full text-left text-[11px] border-collapse min-w-[600px]">
            <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
              <tr>
                <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5">Timestamp</th>
                <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5">Security Tag</th>
                <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5">Action Type</th>
                <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5">Resource</th>
                <th className="px-5 py-4 text-slate-500 font-black uppercase tracking-widest border-b border-white/5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-2 bg-slate-800 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                    <td className="px-5 py-4"><div className="h-3 bg-slate-800 rounded w-32"></div></td>
                    <td className="px-5 py-4"><div className="h-2 bg-slate-800 rounded w-40"></div></td>
                    <td className="px-5 py-4 text-right"><div className="h-2 bg-slate-800 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-4 text-slate-500 font-mono text-[10px]">
                      {new Date(log.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${
                        log.riskTag === 'MATERIALITY_THRESHOLD_EXCEEDED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-lg shadow-rose-900/10' :
                        log.riskTag === 'HISTORICAL_DATA_ADJUSTMENT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-lg shadow-amber-900/10' :
                        'bg-slate-800/50 text-slate-500 border-slate-700/50'
                      }`}>
                        {log.riskTag?.replace(/_/g, ' ') || 'STANDARD_LOG'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-200 font-bold tracking-tight">{log.action}</span>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{log.organization?.name || 'SYSTEM'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-400 font-medium">{log.entity}</span>
                        <span className="text-[9px] text-slate-600 font-mono truncate max-w-[120px]">{log.entityId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${log.action.includes('ERROR') || log.action.includes('FAIL') ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 shadow-lg shadow-emerald-900/20'}`} />
                         <span className={`font-black text-[10px] uppercase tracking-tighter ${log.action.includes('ERROR') || log.action.includes('FAIL') ? 'text-rose-400' : 'text-emerald-400'}`}>
                           {log.action.includes('ERROR') || log.action.includes('FAIL') ? 'Fail' : 'Audit OK'}
                         </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600 opacity-50">
                      <History className="w-10 h-10" />
                      <p className="text-xs font-medium italic">No operational logs found in current buffer</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="flex items-center justify-between shrink-0 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-white/5 rounded-md text-[9px] font-black text-slate-500 uppercase tracking-widest">
            {filteredLogs.length} Records
          </span>
          <span className="text-[10px] text-slate-600 font-medium">Real-time telemetry active</span>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 text-ops-primary hover:text-ops-dark transition-all text-[10px] font-black uppercase tracking-[0.15em] bg-ops-primary/5 px-4 py-2 rounded-xl border border-ops-primary/10 hover:border-ops-primary/20 active:scale-95 shadow-lg shadow-ops-primary/5"
        >
          <Download className="w-3.5 h-3.5" />
          Export Intelligence
        </button>
      </div>
    </div>
  );
};
