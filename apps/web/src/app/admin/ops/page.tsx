'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalIntegrityDashboard } from '@/components/admin/ops/GlobalIntegrityDashboard';
import { DiagnosticTerminal } from '@/components/admin/ops/DiagnosticTerminal';
import { AuditLogExplorer } from '@/components/admin/ops/AuditLogExplorer';
import { HealthCard } from '@/components/admin/ops/HealthCard';
import { SystemSettings } from '@/components/admin/ops/SystemSettings';
import { History, LayoutDashboard, Settings, LogOut, Terminal, Activity, Calendar } from 'lucide-react';
import { ImpersonationProvider } from '@/context/ImpersonationContext';

type TabType = 'dashboard' | 'activity' | 'audit' | 'diagnostic' | 'settings';

export default function OpsCenterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isHistorical, setIsHistorical] = useState(false);
  const router = useRouter();

  const handleExit = () => {
    if (confirm('Are you sure you want to exit the Operations Center?')) {
      router.push('/dashboard');
    }
  };

  return (
    <ImpersonationProvider>
      <div className="h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden flex">
        {/* Sidebar - Desktop Only */}
        <aside className="w-64 bg-slate-900/50 border-r border-slate-800 backdrop-blur-xl hidden lg:flex flex-col p-6 z-20">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">N</div>
            <span className="text-xl font-bold tracking-tight text-white">Nexworth <span className="text-indigo-500 text-xs font-mono">OPS</span></span>
          </div>

          <nav className="flex-1 flex flex-col gap-2">
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              testId="layout-nav-link-dashboard" 
            />
            <NavItem 
              icon={<Activity size={20} />} 
              label="System Health" 
              active={activeTab === 'activity'} 
              onClick={() => setActiveTab('activity')}
              testId="layout-nav-link-activity" 
            />
            <NavItem 
              icon={<History size={20} />} 
              label="Audit Logs" 
              active={activeTab === 'audit'} 
              onClick={() => setActiveTab('audit')}
              testId="layout-nav-link-audit" 
            />
            <NavItem 
              icon={<Terminal size={20} />} 
              label="Diagnostic" 
              active={activeTab === 'diagnostic'} 
              onClick={() => setActiveTab('diagnostic')}
              testId="layout-nav-link-diagnostic" 
            />
            
            <div className="mt-auto pt-6 border-t border-slate-800/50">
              <NavItem 
                icon={<Settings size={20} />} 
                label="Admin Settings" 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')}
                testId="layout-nav-link-settings" 
              />
              <NavItem 
                icon={<LogOut size={20} />} 
                label="Exit Console" 
                onClick={handleExit}
                testId="layout-nav-btn-logout" 
                danger 
              />
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent)]">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isHistorical ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">
                  {isHistorical ? 'Historical Analysis Mode' : 'Live Operations Control'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {activeTab === 'dashboard' && 'Operations Dashboard'}
                {activeTab === 'activity' && 'System Health Monitor'}
                {activeTab === 'audit' && 'Audit Log Explorer'}
                {activeTab === 'diagnostic' && 'Advanced Diagnostic'}
                {activeTab === 'settings' && 'Admin Configuration'}
              </h1>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-900/80 p-1 rounded-xl border border-white/5 shadow-2xl">
              <button 
                onClick={() => setIsHistorical(false)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${!isHistorical ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Real-time
              </button>
              <button 
                onClick={() => setIsHistorical(true)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isHistorical ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                <Calendar size={14} />
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
    </ImpersonationProvider>
  );
}

function NavItem({ 
  icon, 
  label, 
  active = false, 
  danger = false, 
  testId, 
  onClick 
}: { 
  icon: React.ReactNode, 
  label: string, 
  active?: boolean, 
  danger?: boolean, 
  testId?: string, 
  onClick?: () => void 
}) {
  return (
    <button 
      data-testid={testId}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 translate-x-1' 
        : danger
          ? 'text-rose-500 hover:bg-rose-500/10 active:scale-95'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white active:scale-95'
    }`}>
      <span className={active ? 'text-white' : ''}>{icon}</span>
      {label}
    </button>
  );
}
