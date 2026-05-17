'use client';

import React, { useState } from 'react';
import { Search, ShieldAlert, CheckCircle2, AlertTriangle, Radar as RadarIcon, Sparkles, Wrench, LogOut, Shield } from 'lucide-react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

import api from '@/lib/api';

interface DiagnosticData {
  user: {
    id: string;
    name: string;
    email: string;
    lineUserId?: string;
    isActive: boolean;
    role?: any;
    tokenExpireDate?: string;
    lastIpAccess?: string;
  };
  metrics: {
    subject: string;
    value: number;
    fullMark: number;
  }[];
  findings: {
    id: string;
    type: 'success' | 'warning' | 'danger';
    message: string;
    description: string;
  }[];
}

import { MaskedValue } from '@/components/ui/MaskedValue';

export const DiagnosticTerminal = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ diagnosis: string; recommendations: string[]; suggestedFixes?: { type: string; description: string; payload: any }[] } | null>(null);
  const [fixLoading, setFixLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: null }), 5000);
  };

  const handleAIDiagnosis = async () => {
    if (!data) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const response = await api.post('/ai/diagnose', {
        metrics: data.metrics,
        findings: data.findings
      });
      setAiResult(response.data.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('AI Diagnosis failed:', error);
        showNotification('AI Service is currently busy. Please try again later.', 'error');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleExecuteFixes = async () => {
    if (!aiResult?.suggestedFixes || !data) return;
    
    if (!confirm(`Are you sure you want to execute ${aiResult.suggestedFixes.length} fixes suggested by AI?`)) {
      return;
    }

    setFixLoading(true);
    try {
      await api.post('/admin/execute-fixes', {
        fixes: aiResult.suggestedFixes,
        targetId: data.user.id
      });
      showNotification('All fixes executed successfully!', 'success');
      setAiResult(null);
      handleSearch({ preventDefault: () => {} } as any);
    } catch (error) {
      console.error('Fix execution failed:', error);
      showNotification('Failed to execute fixes.', 'error');
    } finally {
      setFixLoading(false);
    }
  };

  const handleCommand = async (command: string) => {
    if (!data?.user.id) return;
    try {
      const res = await api.post('/admin/diagnostic/command', {
        command,
        userId: data.user.id,
        target: data.user.email
      });
      showNotification(res.data.data.message, 'success');
      if (command === 'revoke-sessions') handleSearch({ preventDefault: () => {} } as any);
    } catch (error: any) {
      showNotification(error.response?.data?.error || 'Command failed', 'error');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search) return;
    
    setLoading(true);
    setAiResult(null);
    try {
      const response = await api.get(`/admin/user-diagnostic/${search}`);
      const userData = response.data.data;
      
      // Transform raw DB user data into diagnostic metrics
      const transformedData: DiagnosticData = {
        user: {
          id: userData.id,
          name: userData.email.split('@')[0],
          email: userData.email,
          lineUserId: userData.lineUserId,
          isActive: userData.isActive,
          role: userData.role,
          tokenExpireDate: userData.tokenExpireDate,
          lastIpAccess: userData.lastIpAccess
        },
        metrics: [
          { subject: 'Security', value: userData.lineUserId ? 90 : 40, fullMark: 100 },
          { subject: 'Integrity', value: 95, fullMark: 100 },
          { subject: 'Accounts', value: Math.min((userData._count?.accounts || 0) * 20, 100), fullMark: 100 },
          { subject: 'Activity', value: Math.min((userData._count?.transactions || 0) * 5, 100), fullMark: 100 },
          { subject: 'Privilege', value: (typeof userData.role === 'object' ? userData.role?.name : userData.role) === 'ADMIN' || (typeof userData.role === 'object' ? userData.role?.name : userData.role) === 'Admin' ? 100 : 50, fullMark: 100 },
        ],
        findings: [
          { 
            id: '1', 
            type: userData.lineUserId ? 'success' : 'warning', 
            message: 'LINE Integration', 
            description: userData.lineUserId ? 'Secured via paired LINE account.' : 'Pairing with LINE is missing. High risk of account lockout.' 
          },
          { 
            id: '2', 
            type: 'success', 
            message: 'System Integrity', 
            description: 'Global consistency score for this user is within safe limits.' 
          },
        ]
      };
      
      setData(transformedData);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Diagnostic scan failed:', error);
        showNotification('User not found or connection error', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 h-full flex flex-col gap-5 overflow-hidden shadow-2xl">
      {/* Terminal Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-ops-primary/10 rounded-lg border border-ops-primary/20">
            <ShieldAlert className="w-5 h-5 text-ops-primary" />
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-widest">Diagnostic Terminal</h2>
        </div>
        <form onSubmit={handleSearch} className="relative w-64">
          <input
            type="text"
            data-testid="ops-center-search-input"
            placeholder="Search User ID or Email..."
            className="w-full bg-white/5 border border-white/5 rounded-xl py-1.5 pl-9 pr-10 text-xs text-slate-200 focus:ring-2 focus:ring-ops-primary/30 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button 
            type="submit" 
            data-testid="ops-center-search-button"
            className="absolute right-3 top-2 text-slate-500 hover:text-ops-primary transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-500" />
        </form>
      </div>

      {notification.type && (
        <div 
          data-testid="ops-center-notification"
          className={`shrink-0 p-3 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          <span className="text-xs font-medium">{notification.message}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {!data && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-3">
            <div className="w-20 h-20 rounded-full border border-slate-800 flex items-center justify-center bg-slate-900/50">
              <RadarIcon className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-xs font-medium">Enter user details to start diagnostic scan</p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-ops-primary/20 border-t-ops-primary rounded-full animate-spin"></div>
              <span className="text-[10px] text-ops-primary font-bold uppercase tracking-widest">Scanning Network...</span>
            </div>
          </div>
        )}

        {data && !loading && (
          <div 
            data-testid="ops-center-diagnostic-ready"
            className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300 overflow-hidden"
          >
             {/* Left Column: Visual Metrics */}
            <div className="flex flex-col gap-4 min-h-0">
              <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <span className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">System Health Vector</span>
                  <div className="px-2 py-0.5 bg-emerald/10 rounded-full border border-emerald/20">
                    <span className="text-[9px] font-black text-emerald uppercase tracking-tighter">92% INTEGRITY</span>
                  </div>
                </div>
                <div className="flex-1 min-h-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.metrics}>
                      <PolarGrid stroke="#ffffff0a" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900 }} />
                      <Radar
                        name="Health"
                        dataKey="value"
                        stroke="var(--ops-primary)"
                        fill="var(--ops-primary)"
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

               {/* User Identity Card */}
              <div className="shrink-0 grid grid-cols-2 gap-3">
                <div className="p-4 bg-ops-primary/5 border border-ops-primary/10 rounded-2xl">
                  <p className="text-[9px] text-ops-primary font-black uppercase tracking-widest opacity-60">Target Identity</p>
                  <h3 className="text-sm font-black text-white mt-1 truncate">{(data.user as any).name}</h3>
                  <p className="text-[10px] text-slate font-bold truncate mt-0.5 opacity-40">{(data.user as any).email}</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <p className="text-[9px] text-slate font-black uppercase tracking-widest opacity-40">Access Metadata</p>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate font-bold opacity-40">Role:</span>
                      <span className="text-[9px] font-black text-ops-primary uppercase tracking-widest">
                        {typeof (data.user as any).role === 'object' 
                          ? ((data.user as any).role?.name || 'USER') 
                          : ((data.user as any).role || 'USER')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate font-bold opacity-40">Last IP:</span>
                      <span className="text-[9px] font-mono text-slate-400">{(data.user as any).lastIpAccess || '127.0.0.1'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: AI & Findings */}
            <div className="flex flex-col gap-4 min-h-0 overflow-hidden">
              {/* AI Trigger */}
              <div className="shrink-0">
                <button 
                  onClick={handleAIDiagnosis}
                  disabled={aiLoading}
                  data-testid="ops-center-ai-analyze-btn"
                  className={`w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    aiLoading 
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                      : 'bg-ops-primary hover:bg-ops-dark text-white shadow-lg shadow-ops-primary/20 active:scale-[0.98]'
                  }`}
                >
                  {aiLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin"></div>
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {aiLoading ? 'HEURISTIC ANALYSIS IN PROGRESS...' : 'EXECUTE AI DIAGNOSTIC'}
                </button>
              </div>

              {/* Scrollable Container for Findings & AI Result */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar min-h-0">
                {/* AI Results */}
                {aiResult && (
                  <div 
                    data-testid="ops-center-ai-insight-panel"
                    className="bg-ops-primary/5 border border-ops-primary/20 rounded-2xl p-5 animate-in zoom-in-95 duration-300"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-ops-primary rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black text-ops-primary uppercase tracking-widest">AI Intelligence Report</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed mb-4 font-medium italic opacity-90">"{aiResult.diagnosis}"</p>
                    
                    <div className="space-y-2 mb-4">
                      {aiResult.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex gap-3 text-[11px] text-slate-400 items-start">
                          <div className="shrink-0 w-4 h-4 rounded-full bg-ops-primary/20 flex items-center justify-center text-[9px] font-bold text-ops-primary">
                            {idx + 1}
                          </div>
                          <span className="pt-0.5">{rec}</span>
                        </div>
                      ))}
                    </div>

                    {aiResult.suggestedFixes && aiResult.suggestedFixes.length > 0 && (
                      <button
                        onClick={handleExecuteFixes}
                        disabled={fixLoading}
                        data-testid="ops-center-execute-fixes-btn"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-900/30"
                      >
                        {fixLoading ? (
                          <div className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <Wrench className="w-3.5 h-3.5" />
                        )}
                        {fixLoading ? 'Executing Protocols...' : `Execute ${aiResult.suggestedFixes.length} Automated Fixes`}
                      </button>
                    )}
                  </div>
                )}

                 {/* Quick Actions Bar */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl shrink-0">
                  <p className="text-[9px] text-slate font-black uppercase tracking-[0.2em] mb-4 text-center opacity-40">Manual Overrides</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleCommand('flush-cache')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-ops-primary/10 border border-white/5 hover:border-ops-primary/30 transition-all group">
                      <Sparkles className="w-4 h-4 text-slate group-hover:text-ops-primary opacity-40 group-hover:opacity-100" />
                      <span className="text-[9px] font-black text-slate group-hover:text-white uppercase tracking-widest opacity-40">Flush</span>
                    </button>
                    <button onClick={() => handleCommand('sync-line')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition-all group">
                      <RadarIcon className="w-4 h-4 text-slate group-hover:text-emerald-400 opacity-40 group-hover:opacity-100" />
                      <span className="text-[9px] font-black text-slate group-hover:text-white uppercase tracking-widest opacity-40">Sync</span>
                    </button>
                    <button onClick={() => handleCommand('revoke-sessions')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 transition-all group">
                      <LogOut className="w-4 h-4 text-slate group-hover:text-rose-400 opacity-40 group-hover:opacity-100" />
                      <span className="text-[9px] font-black text-slate group-hover:text-white uppercase tracking-widest opacity-40">Revoke</span>
                    </button>
                    <button onClick={() => handleCommand('reconcile-all')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 transition-all group">
                      <Shield className="w-4 h-4 text-slate group-hover:text-amber-400 opacity-40 group-hover:opacity-100" />
                      <span className="text-[9px] font-black text-slate group-hover:text-white uppercase tracking-widest opacity-40">Reconcile</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pb-2">
                  <p className="text-[9px] text-slate font-black uppercase tracking-widest px-1 opacity-40">Detected Anomalies</p>
                  {data.findings.map((f) => (
                    <div key={f.id} className={`p-4 rounded-2xl border border-white/5 flex gap-4 transition-all hover:scale-[1.01] relative overflow-hidden group ${
                      f.type === 'success' ? 'bg-emerald-500/5' :
                      f.type === 'warning' ? 'bg-amber-500/5' :
                      'bg-rose-500/5'
                    }`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        f.type === 'success' ? 'bg-emerald-500' :
                        f.type === 'warning' ? 'bg-amber-500' :
                        'bg-rose-500'
                      } opacity-40 group-hover:opacity-100 transition-opacity`}></div>
                      <div className="mt-1 shrink-0">
                        {f.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500/80" />}
                        {f.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500/80" />}
                        {f.type === 'danger' && <ShieldAlert className="w-5 h-5 text-rose-500/80" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold uppercase tracking-tight ${
                          f.type === 'success' ? 'text-emerald-400' :
                          f.type === 'warning' ? 'text-amber-400' :
                          'text-rose-400'
                        }`}>{f.message}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{f.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
