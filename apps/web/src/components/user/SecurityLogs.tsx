'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, Clock, UserCheck, ChevronRight } from 'lucide-react';
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

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/me/security-logs');
      setLogs(response.data.data);
    } catch (error) {
      console.error('Failed to fetch transparency logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-emerald-500/10 rounded-2xl">
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Security & Transparency</h2>
          <p className="text-slate-500 text-sm mt-1">Audit logs of administrative access to your account.</p>
        </div>
      </div>

      <div data-testid="user-security-logs-list" className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-50 dark:bg-slate-800/50 animate-pulse rounded-2xl"></div>
          ))
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <div 
              key={log.id} 
              data-testid={`user-security-log-item-${log.id}`}
              className="group relative bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-2xl p-5 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <UserCheck className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">System Support Access</span>
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Ref: {log.ticketReference}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 italic">
                      Support Engineer ({log.impersonator.email.split('@')[0]}***) accessed for troubleshooting.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(log.startedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {log.endedAt && ` - ${new Date(log.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                </div>
              </div>
              
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          ))
        ) : (
          <div 
            data-testid="user-security-empty-state"
            className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800"
          >
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-50" />
            <p className="text-slate-500 font-medium">No administrative access history found.</p>
            <p className="text-slate-400 text-xs mt-1">Your account has not been accessed by support staff.</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          <strong>Privacy Note:</strong> In accordance with our security policies, all support access is logged and requires a valid support ticket reference. Staff can only access your account in Read-Only mode to protect your data.
        </p>
      </div>
    </div>
  );
};
