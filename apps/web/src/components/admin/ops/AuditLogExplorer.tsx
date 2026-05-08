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
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const exportUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/export/audit-logs?token=${token}`;
      window.open(exportUrl, '_blank');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 flex flex-col h-full overflow-hidden gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <History className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Audit Log Explorer</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search logs..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-1.5 pl-9 pr-4 text-xs text-slate-200 focus:ring-2 focus:ring-amber-500/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-500" />
          </div>
          <button 
            onClick={() => fetchLogs()} 
            className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden border border-slate-800 rounded-xl">
        <div className="h-full overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-800 z-10 text-slate-400 font-bold uppercase tracking-widest">
              <tr>
                <th className="px-4 py-4 border-b border-slate-700 min-w-[120px]">Timestamp</th>
                <th className="px-4 py-4 border-b border-slate-700">Risk Tag</th>
                <th className="px-4 py-4 border-b border-slate-700">Action Type</th>
                <th className="px-4 py-4 border-b border-slate-700">Target Entity</th>
                <th className="px-4 py-4 border-b border-slate-700 text-right">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-2 bg-slate-800 rounded w-24"></div></td>
                    <td className="px-4 py-4"><div className="h-2 bg-slate-800 rounded w-32"></div></td>
                    <td className="px-4 py-4"><div className="h-2 bg-slate-800 rounded w-20"></div></td>
                    <td className="px-4 py-4"><div className="h-2 bg-slate-800 rounded w-40"></div></td>
                    <td className="px-4 py-4"><div className="h-2 bg-slate-800 rounded w-10"></div></td>
                  </tr>
                ))
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-4 text-slate-400 font-mono text-[10px]">
                      {new Date(log.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm border ${
                        log.riskTag === 'MATERIALITY_THRESHOLD_EXCEEDED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                        log.riskTag === 'HISTORICAL_DATA_ADJUSTMENT' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-slate-800 text-slate-500 border-slate-700'
                      }`}>
                        {log.riskTag?.replace(/_/g, ' ') || 'NORMAL'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-[11px]">{log.action}</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest">{log.organization?.name || 'SYSTEM'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-medium">{log.entity}</span>
                        <span className="text-[9px] text-slate-600 font-mono truncate max-w-[100px]">{log.entityId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${log.action.includes('ERROR') ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                         <span className={`font-black text-[10px] ${log.action.includes('ERROR') ? 'text-rose-400' : 'text-emerald-400'}`}>
                           {log.action.includes('ERROR') ? 'FAIL' : 'SUCCESS'}
                         </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500 italic">No audit logs found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex items-center justify-between shrink-0 pt-2 border-t border-slate-800">
        <p className="text-[10px] text-slate-500">Showing {filteredLogs.length} recent operations</p>
        <button 
          onClick={handleExport}
          className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors text-[10px] font-semibold uppercase tracking-widest"
        >
          <Download className="w-3 h-3" />
          Export CSV
        </button>
      </div>
    </div>
  );
};
