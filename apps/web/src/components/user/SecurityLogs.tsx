'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Calendar, Clock, Fingerprint, Activity, ShieldAlert } from 'lucide-react';
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
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-emerald border border-white/10">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Transparency Logs</h2>
            <p className="text-[10px] text-emerald font-bold uppercase tracking-[0.3em] opacity-60">Audit Access Trail</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
          <Activity size={11} className="text-emerald" />
          <span className="text-[9px] font-black text-emerald uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Logs List */}
      <div data-testid="user-security-logs-list" className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl border border-white/5" />
          ))
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <div
              key={log.id}
              data-testid={`user-security-log-item-${log.id}`}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-all duration-300 group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-navy/60 rounded-lg flex items-center justify-center text-emerald border border-white/10 shrink-0">
                    <Fingerprint size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-white uppercase tracking-wide">Support Diagnostic Session</span>
                      <span className="px-2 py-0.5 bg-emerald/10 text-emerald text-[9px] font-black rounded-full border border-emerald/20">
                        REF: {log.ticketReference}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate mt-0.5">
                      Technician <span className="text-emerald/80">{log.impersonator.email.split('@')[0]}***</span> — temporary read-only access
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0 text-[10px] text-slate font-bold">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} className="text-emerald/50" />
                    {new Date(log.startedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-emerald" />
                    <span className="font-mono">
                      {new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      {log.endedAt && ` – ${new Date(log.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            data-testid="user-security-empty-state"
            className="flex flex-col items-center justify-center py-16 bg-white/[0.01] rounded-2xl border border-dashed border-white/5"
          >
            <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
              <ShieldCheck size={28} className="text-slate/40" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Privacy Shield Intact</h3>
            <p className="text-[10px] text-slate font-bold uppercase tracking-widest mt-2 opacity-60">No external administrative access recorded.</p>
          </div>
        )}
      </div>

      {/* Footer Notice */}
      <div className="p-4 rounded-xl bg-emerald/[0.02] border border-emerald/10 flex items-start gap-3">
        <div className="w-8 h-8 bg-emerald/10 rounded-lg flex items-center justify-center text-emerald border border-emerald/20 shrink-0">
          <ShieldAlert size={16} />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-emerald uppercase tracking-widest mb-1">Institutional Grade Audit Protocol</h4>
          <p className="text-[11px] text-slate leading-relaxed">
            Support sessions are read-only, ephemeral, and tied to verified tickets. This log is cryptographically immutable.
          </p>
        </div>
      </div>
    </div>
  );
};
