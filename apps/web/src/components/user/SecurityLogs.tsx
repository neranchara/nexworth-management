'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Calendar, Clock, ChevronRight, Fingerprint, Activity, ShieldAlert } from 'lucide-react';
import api from '@/lib/api';

interface SecurityLog {
  id: string;
  startedAt: string;
  endedAt: string | null;
  ticketReference: string;
  impersonator: {
    email: string;
  };
}

export const SecurityLogs = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/me/security-logs');
      setLogs(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch security logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchLogs();
    };
    init();
  }, [fetchLogs]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald blur-xl opacity-20" />
            <div className="w-14 h-14 bg-white/[0.03] rounded-2xl flex items-center justify-center text-emerald border border-white/10 shadow-2xl relative z-10 backdrop-blur-md">
              <ShieldCheck size={32} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Transparency Logs</h2>
            <p className="text-[10px] text-emerald font-black uppercase tracking-[0.4em] mt-2 opacity-60">System-Wide Audit Access Trail</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-2 bg-white/[0.03] rounded-full border border-white/10 backdrop-blur-sm shadow-xl">
           <div className="relative">
             <div className="absolute inset-0 bg-emerald blur-sm opacity-50 animate-pulse" />
             <Activity size={14} className="text-emerald relative z-10" />
           </div>
           <span className="text-[10px] font-black text-emerald uppercase tracking-widest">Real-Time Monitoring</span>
        </div>
      </div>

      {/* Main Logs List */}
      <div data-testid="user-security-logs-list" className="space-y-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white/[0.02] animate-pulse rounded-[2rem] border border-white/5 shadow-inner"></div>
          ))
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <div 
              key={log.id} 
              data-testid={`user-security-log-item-${log.id}`}
              className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/10 shadow-xl backdrop-blur-md relative group hover:bg-white/[0.04] transition-all duration-500 overflow-hidden cursor-default"
            >
              <div className="absolute -right-24 -top-24 w-64 h-64 bg-emerald/5 rounded-full blur-[80px] group-hover:bg-emerald/10 transition-colors duration-1000" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald blur-lg opacity-10 group-hover:opacity-30 transition-opacity" />
                    <div className="w-14 h-14 bg-navy/60 rounded-[1.25rem] flex items-center justify-center text-emerald shadow-inner border border-white/10 group-hover:scale-110 transition-transform duration-500 relative z-10">
                      <Fingerprint size={28} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-lg font-black text-white tracking-tight uppercase">Support Diagnostic Session</span>
                      <div className="px-4 py-1.5 bg-emerald/20 text-emerald text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald/30 shadow-lg shadow-emerald/10">
                        REF: {log.ticketReference}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-xl group-hover:text-slate-300 transition-colors">
                       Administrative technician <span className="text-emerald/80">{log.impersonator.email.split('@')[0]}***</span> granted temporary access for system optimization and technical support.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-3 shrink-0 bg-white/5 p-6 rounded-[1.5rem] border border-white/5 group-hover:border-white/10 transition-colors shadow-inner">
                  <div className="flex items-center gap-3 text-slate-400 font-black text-[11px] uppercase tracking-[0.2em]">
                    <Calendar size={16} className="text-emerald/50" />
                    {new Date(log.startedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-3 text-white font-black text-[11px] uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-xl shadow-lg border border-white/5">
                    <Clock size={16} className="text-emerald" />
                    <span className="font-mono">{new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                    {log.endedAt && (
                      <>
                        <span className="mx-1 text-slate-700">/</span>
                        <span className="font-mono">{new Date(log.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                <ChevronRight size={24} className="text-emerald" />
              </div>
            </div>
          ))
        ) : (
          <div 
            data-testid="user-security-empty-state"
            className="flex flex-col items-center justify-center py-32 bg-white/[0.01] rounded-[3rem] border-2 border-dashed border-white/5 group transition-all hover:bg-white/[0.03] hover:border-emerald/10 shadow-inner"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-slate-500 blur-3xl opacity-5" />
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center relative z-10 border border-white/5 group-hover:rotate-12 transition-transform duration-700">
                <ShieldCheck size={48} className="text-slate-700" />
              </div>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-[0.4em]">Privacy Shield Intact</h3>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] mt-4 opacity-60">No external administrative access has been recorded.</p>
          </div>
        )}
      </div>

      {/* Security Footer Notice */}
      <div className="p-10 rounded-[2.5rem] bg-emerald/[0.02] border border-emerald/10 relative overflow-hidden group backdrop-blur-md shadow-2xl">
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald/10 transition-colors duration-1000" />
        <div className="flex items-start gap-6 relative z-10">
          <div className="w-12 h-12 bg-emerald/10 rounded-2xl flex items-center justify-center text-emerald border border-emerald/20 shadow-inner group-hover:rotate-6 transition-transform">
            <ShieldAlert size={24} />
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-black text-emerald uppercase tracking-[0.3em]">Institutional Grade Audit Protocol</h4>
            <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-2xl group-hover:text-slate-300 transition-colors">
              Nexworth implements <span className="text-white">Strict Identity Isolation</span>. Support sessions are ephemeral, read-only, and tied to specific verified technical tickets. This audit log is cryptographically immutable and serves as the definitive record of system transparency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

