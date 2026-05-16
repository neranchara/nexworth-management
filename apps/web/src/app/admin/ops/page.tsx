'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalIntegrityDashboard } from '@/components/admin/ops/GlobalIntegrityDashboard';
import { DiagnosticTerminal } from '@/components/admin/ops/DiagnosticTerminal';
import { AuditLogExplorer } from '@/components/admin/ops/AuditLogExplorer';
import { HealthCard } from '@/components/admin/ops/HealthCard';
import { SystemSettings } from '@/components/admin/ops/SystemSettings';
import { PerformanceAnalytics } from '@/components/admin/ops/PerformanceAnalytics';
import { SupportConsole } from '@/components/admin/ops/SupportConsole';
import { History, LayoutDashboard, Settings, LogOut, Terminal, Activity, Calendar, Zap, Shield } from 'lucide-react';
import { ImpersonationProvider } from '@/context/ImpersonationContext';

import AdminSidebar from '@/features/admin-ops/AdminSidebar';
import { AdminThemeProvider } from '@/components/admin/AdminThemeProvider';

type TabType = 'dashboard' | 'performance' | 'activity' | 'audit' | 'support' | 'diagnostic' | 'settings';

export default function OpsCenterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isHistorical, setIsHistorical] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();

  const handleExit = () => {
    if (confirm('Are you sure you want to exit the Operations Center?')) {
      router.push('/dashboard');
    }
  };

  return (
    <ImpersonationProvider>
      <AdminThemeProvider>
        <div className="h-screen bg-ops-bg text-slate-200 font-sans selection:bg-ops-primary/30 overflow-hidden flex">
        <AdminSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent)]">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isHistorical ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-bold text-ops-primary uppercase tracking-[0.2em]">
                  {isHistorical ? 'Historical Analysis Mode' : 'Live Operations Control'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {activeTab === 'dashboard' && 'Operations Dashboard'}
                {activeTab === 'performance' && 'System Performance Analytics'}
                {activeTab === 'activity' && 'System Health Monitor'}
                {activeTab === 'audit' && 'Audit Log Explorer'}
                {activeTab === 'support' && 'Support Console'}
                {activeTab === 'diagnostic' && 'Advanced Diagnostic'}
                {activeTab === 'settings' && 'Admin Configuration'}
              </h1>
            </div>
            
            <div className="flex items-center gap-3 bg-ops-sidebar/80 p-1 rounded-xl border border-white/5 shadow-2xl">
              <button 
                onClick={() => setIsHistorical(false)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${!isHistorical ? 'bg-ops-primary text-white shadow-lg shadow-ops-primary/20' : 'text-slate-400 hover:text-white'}`}
              >
                Real-time
              </button>
              <button 
                onClick={() => setIsHistorical(true)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isHistorical ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                <History size={14} />
                Historical
              </button>
            </div>
          </header>

          <section className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0">
            {activeTab === 'dashboard' && (
              <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                <div className="shrink-0">
                  <GlobalIntegrityDashboard fullMode={isHistorical} />
                </div>
                <div className="flex-1 grid grid-cols-1 xl:grid-cols-5 gap-6 overflow-hidden min-h-0">
                  <div className="xl:col-span-3 flex flex-col min-h-0">
                    <DiagnosticTerminal />
                  </div>
                  <div className="xl:col-span-2 flex flex-col min-h-0">
                    <AuditLogExplorer />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                <PerformanceAnalytics />
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="flex-1 animate-in fade-in slide-in-from-left-4 duration-500 overflow-hidden">
                <HealthCard fullMode />
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
                <AuditLogExplorer fullWidth />
              </div>
            )}

            {activeTab === 'support' && (
              <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                <SupportConsole />
              </div>
            )}

            {activeTab === 'diagnostic' && (
              <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                <DiagnosticTerminal />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="flex-1 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
                <SystemSettings />
              </div>
            )}
          </section>
        </main>
      </div>
      </AdminThemeProvider>
    </ImpersonationProvider>
  );
}
