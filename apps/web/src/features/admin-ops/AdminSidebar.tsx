'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  History, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Terminal, 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Shield
} from 'lucide-react';
import { clsx } from 'clsx';
import { APP_CONFIG } from '@/config/app.config';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function AdminSidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed 
}: AdminSidebarProps) {
  const router = useRouter();

  const handleExit = () => {
    if (confirm('Are you sure you want to exit the Operations Center?')) {
      router.push('/dashboard');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'activity', label: 'System Health', icon: Activity },
    { id: 'audit', label: 'Audit Logs', icon: History },
    { id: 'support', label: 'Support Console', icon: Shield },
    { id: 'diagnostic', label: 'Diagnostic', icon: Terminal },
  ];

  return (
    <aside 
      className={clsx(
        "bg-ops-sidebar border-r border-ops-border backdrop-blur-xl hidden lg:flex flex-col relative transition-all duration-300 z-50",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-ops-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-ops-primary/20 z-50 hover:scale-110 transition-transform"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 shrink-0 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ops-primary rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-ops-primary/20 shrink-0">N</div>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
              Nexworth <span className="text-ops-primary text-xs font-mono">OPS</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2 mt-4 px-3">
        {navItems.map((item) => (
          <NavItem 
            key={item.id}
            icon={<item.icon size={20} />} 
            label={item.label} 
            active={activeTab === item.id} 
            isCollapsed={isCollapsed}
            onClick={() => setActiveTab(item.id)}
          />
        ))}

        <div className="mt-auto py-6 border-t border-ops-border/50">
          <NavItem 
            icon={<Settings size={20} />} 
            label="Admin Settings" 
            active={activeTab === 'settings'} 
            isCollapsed={isCollapsed}
            onClick={() => setActiveTab('settings')}
          />
          <NavItem 
            icon={<LogOut size={20} />} 
            label="Exit Console" 
            isCollapsed={isCollapsed}
            onClick={handleExit}
            danger 
          />
          
          <div className={clsx(
            "mt-4 px-4 transition-opacity duration-300",
            isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
          )}>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-40">
              System {APP_CONFIG.FULL_VERSION_STRING}
            </p>
          </div>
        </div>
      </nav>
    </aside>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

function NavItem({ 
  icon, 
  label, 
  active = false, 
  danger = false, 
  isCollapsed,
  onClick 
}: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      title={isCollapsed ? label : ''}
      className={clsx(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group relative",
        active 
          ? 'bg-ops-primary text-white shadow-lg shadow-ops-primary/20' 
          : danger
            ? 'text-rose-500 hover:bg-rose-500/10 active:scale-95'
            : 'text-slate-400 hover:bg-white/5 hover:text-white active:scale-95'
      )}
    >
      <span className={clsx(
        "shrink-0 transition-colors",
        active ? 'text-white' : danger ? 'text-rose-500' : 'text-slate-400 group-hover:text-white'
      )}>
        {icon}
      </span>
      {!isCollapsed && (
        <span className="whitespace-nowrap opacity-100 transition-opacity duration-300">
          {label}
        </span>
      )}
    </button>
  );
}
