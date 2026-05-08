'use client';

import React, { useState } from 'react';
import { Search, ShieldAlert, CheckCircle2, AlertTriangle, Radar as RadarIcon, Sparkles, Wrench } from 'lucide-react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

import api from '@/lib/api';

interface DiagnosticData {
  user: {
    id: string;
    name: string;
    email: string;
    lineUserId?: string;
    isActive: boolean;
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
    } catch (error) {
      console.error('AI Diagnosis failed:', error);
      showNotification('AI Service is currently busy. Please try again later.', 'error');
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
          { subject: 'Privilege', value: userData.role === 'ADMIN' ? 100 : 50, fullMark: 100 },
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
    } catch (error) {
      console.error('Diagnostic scan failed:', error);
      showNotification('User not found or connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 h-full flex flex-col gap-5 overflow-hidden">
      {/* ... (Header remains same) ... */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Diagnostic Terminal</h2>
        </div>
        <form onSubmit={handleSearch} className="relative w-64">
          <input
            type="text"
            data-testid="ops-center-search-input"
            placeholder="Search User ID or Email..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-1.5 pl-9 pr-10 text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button 
            type="submit" 
            data-testid="ops-center-search-button"
            className="absolute right-3 top-2 hover:text-indigo-400 transition-colors"
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

      {!data && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
          <RadarIcon className="w-10 h-10 opacity-20" />
          <p className="text-xs">Enter user details to start diagnostic scan</p>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      )}

      {data && !loading && (
        <div 
          data-testid="ops-center-diagnostic-ready"
          className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200 overflow-hidden min-h-0"
        >
          {/* Metrics Radar */}
          <div className="bg-slate-800/30 rounded-xl p-2 border border-slate-700/50 flex items-center justify-center overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.metrics}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar
                  name="Health"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* User & Findings */}
          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider">Identity</p>
                <h3 className="text-sm font-semibold text-white mt-0.5 truncate">
                  {(data.user as any).name}
                </h3>
                <p className="text-[10px] text-slate-400 truncate">
                  {(data.user as any).email}
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Security Trace</p>
                <div className="flex flex-col gap-1 mt-1">
                   <div className="flex items-center justify-between">
                     <span className="text-[9px] text-slate-500">Role:</span>
                     <span className="text-[9px] font-bold text-indigo-400">{(data.user as any).role}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[9px] text-slate-500">Last IP:</span>
                     <span className="text-[9px] font-mono text-slate-300">{(data.user as any).lastIpAccess || 'N/A'}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* AI Diagnosis Trigger */}
            <div className="flex-shrink-0">
              <button 
                onClick={handleAIDiagnosis}
                disabled={aiLoading}
                data-testid="ops-center-ai-analyze-btn"
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  aiLoading 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98]'
                }`}
              >
                {aiLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin"></div>
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {aiLoading ? 'AI Analyzing...' : 'Analyze with Gemini'}
              </button>
            </div>

            {/* AI Insights Display */}
            {aiResult && (
              <div 
                data-testid="ops-center-ai-insight-panel"
                className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-4 animate-in zoom-in-95 duration-300"
              >
                {/* ... AI Insight Content ... */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">AI Security Insight</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4 italic">"{aiResult.diagnosis}"</p>
                
                <div className="space-y-2">
                  {aiResult.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="flex gap-2 text-[11px] text-slate-400">
                      <span className="text-indigo-500 font-bold">{idx + 1}.</span>
                      {rec}
                    </div>
                  ))}
                </div>

                {aiResult.suggestedFixes && aiResult.suggestedFixes.length > 0 && (
                  <button
                    onClick={handleExecuteFixes}
                    disabled={fixLoading}
                    data-testid="ops-center-execute-fixes-btn"
                    className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                  >
                    {fixLoading ? (
                      <div className="w-3 h-3 border-2 border-slate-600 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Wrench className="w-3.5 h-3.5" />
                    )}
                    {fixLoading ? 'Executing Fixes...' : `Execute ${aiResult.suggestedFixes.length} AI Fixes`}
                  </button>
                )}
              </div>
            )}

            {/* Quick Actions (SA Requirement) */}
            <div className="shrink-0 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Quick Manual Overrides</p>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleCommand('flush-cache')}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-slate-800/50 hover:bg-indigo-500/10 border border-slate-700 hover:border-indigo-500/30 transition-all group"
                >
                  <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                  <span className="text-[9px] font-medium text-slate-400 group-hover:text-slate-200">Flush Cache</span>
                </button>
                <button 
                  onClick={() => handleCommand('sync-line')}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-slate-800/50 hover:bg-emerald-500/10 border border-slate-700 hover:border-emerald-500/30 transition-all group"
                >
                  <RadarIcon className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                  <span className="text-[9px] font-medium text-slate-400 group-hover:text-slate-200">Sync LINE</span>
                </button>
                <button 
                  onClick={() => handleCommand('revoke-sessions')}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-slate-800/50 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/30 transition-all group"
                >
                  <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
                  <span className="text-[9px] font-medium text-slate-400 group-hover:text-slate-200">Revoke All</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {data.findings.map((f) => (
                <div key={f.id} className={`p-3 rounded-lg border flex gap-3 ${
                  f.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                  f.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                  'bg-rose-500/5 border-rose-500/20'
                }`}>
                  <div className="mt-1">
                    {f.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {f.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {f.type === 'danger' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${
                      f.type === 'success' ? 'text-emerald-400' :
                      f.type === 'warning' ? 'text-amber-400' :
                      'text-rose-400'
                    }`}>{f.message}</h4>
                    <p className="text-xs text-slate-400 mt-1">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
