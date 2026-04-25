'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { 
  TrendingUp, Activity, CreditCard, ShieldCheck, 
  Calendar, Layers, Table, BarChart2, Info, ChevronRight,
  Building2, Target, Wallet, Check, Eye, EyeOff, Layout, Settings2 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { usePermissions } from '@/hooks/usePermissions';
import type { GridItemConfig } from '@/components/DashboardGrid';

// ============================================
// Interfaces
// ============================================

interface MonthlyCashflow {
  month: string;
  income: number;
  expense: number;
  saving: number;
  goalSaving: number;
  invest: number;
  debt: number;
  net: number;
  records: number;
}

interface GoalTracking {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
}

export interface Stats {
  summary: {
    totalAssets: number;
    totalGoalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    totalOrganizations?: number;
    totalUsers?: number;
    totalTransactions?: number;
    annualIncome?: number;
    annualExpense?: number;
    annualSaving?: number;
    annualGoalSaving?: number;
    annualInvest?: number;
    annualDebt?: number;
    annualNet?: number;
  };
  currency: string;
  monthlyCashflow: MonthlyCashflow[];
  health: {
    score: number;
    status: string;
    metrics: {
      savingRate: number;
      goalRate: number;
      emergencyMonths: number;
      debtRatio: number;
      investmentRatio: number;
    };
    scores: {
      saving: number;
      emergency: number;
      debt: number;
      investment: number;
    };
  };
  goalTracking: GoalTracking[];
  isSystemAdmin?: boolean;
  recentOrganizations?: any[];
}

// ============================================
// Constants & Helpers
// ============================================

const DashboardGrid = dynamic(() => import('@/components/DashboardGrid'), { ssr: false });

const MONTH_MAP = [
  { code: 'M01', name: 'January', short: 'Jan' },
  { code: 'M02', name: 'February', short: 'Feb' },
  { code: 'M03', name: 'March', short: 'Mar' },
  { code: 'M04', name: 'April', short: 'Apr' },
  { code: 'M05', name: 'May', short: 'May' },
  { code: 'M06', name: 'June', short: 'Jun' },
  { code: 'M07', name: 'July', short: 'Jul' },
  { code: 'M08', name: 'August', short: 'Aug' },
  { code: 'M09', name: 'September', short: 'Sep' },
  { code: 'M10', name: 'October', short: 'Oct' },
  { code: 'M11', name: 'November', short: 'Nov' },
  { code: 'M12', name: 'December', short: 'Dec' }
];

const MONTHS = MONTH_MAP.map(m => m.name);

const getMonthCode = (input: any): string => {
  if (typeof input === 'number') return `M${(input + 1).toString().padStart(2, '0')}`;
  if (!input) return 'M01';
  const str = input.toString().substring(0, 3).toLowerCase();
  const index = MONTH_MAP.findIndex(m => m.short.toLowerCase() === str);
  return index !== -1 ? MONTH_MAP[index].code : 'M01';
};

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const ALL_WIDGETS = [
  { key: 'welcome', label: 'Assets Summary', icon: Wallet },
  { key: 'health', label: 'Health Score', icon: ShieldCheck },
  { key: 'saving-rate', label: 'Saving Rate', icon: TrendingUp },
  { key: 'goal-rate', label: 'Goal Rate', icon: TrendingUp },
  { key: 'emergency-fund', label: 'Emergency Fund', icon: ShieldCheck },
  { key: 'debt-ratio', label: 'Debt Ratio', icon: CreditCard },
  { key: 'investment-ratio', label: 'Investment', icon: Activity },
  { key: 'cashflow', label: 'Monthly Summary', icon: Calendar },
  { key: 'goals', label: 'Goal Tracking', icon: TrendingUp }
];

const getHealthColor = (score: number) => {
  if (score >= 90) return '#10b981';
  if (score >= 75) return '#34d399';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
};

// ============================================
// Sub-Components
// ============================================

const WelcomeCard = ({ user, stats, loading }: { user: any; stats: any; loading: boolean }) => (
  <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 shadow-xl rounded-2xl p-6 h-full flex flex-col justify-between group">
    {/* Decorative Background Elements */}
    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700" />
    
    <div className="relative z-10 mb-6">
      <h1 className="text-2xl font-black text-white mb-1 tracking-tight">
        Welcome, {user?.firstName}
      </h1>
      <p className="text-slate-400 text-[11px] font-medium uppercase tracking-[0.2em]">Financial Overview</p>
    </div>
    
    <div className="relative z-10 grid grid-cols-2 gap-3 flex-1">
      {[
        { label: 'Real Assets', value: stats?.summary?.totalAssets, icon: Wallet, color: 'from-blue-500/20 to-blue-600/5', text: 'text-blue-400' },
        { label: 'Goal Money', value: stats?.summary?.totalGoalAssets, icon: TrendingUp, color: 'from-purple-500/20 to-purple-600/5', text: 'text-purple-400' },
        { label: 'Liabilities', value: stats?.summary?.totalLiabilities, icon: CreditCard, color: 'from-rose-500/20 to-rose-600/5', text: 'text-rose-400' },
        { label: 'Net Worth', value: stats?.summary?.netWorth, icon: ShieldCheck, color: 'from-emerald-500/20 to-emerald-600/5', text: 'text-emerald-400' }
      ].map((item, idx) => (
        <div key={idx} className={`bg-gradient-to-br ${item.color} p-3.5 rounded-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">{item.label}</span>
            <item.icon className={`w-3.5 h-3.5 ${item.text}`} />
          </div>
          <p className="text-lg font-black text-white tabular-nums leading-none">
            {loading ? '...' : `${stats?.currency || '฿'}${(item.value || 0).toLocaleString()}`}
          </p>
        </div>
      ))}
    </div>
  </div>
);

const HealthCard = ({ stats, loading, healthData }: { stats: any; loading: boolean; healthData: any[] }) => {
  const score = stats?.health?.score || 0;
  const color = getHealthColor(score);
  
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-6 h-full flex flex-col items-center justify-between border border-gray-100 dark:border-slate-800/50 group">
      {/* Dynamic Background Glow */}
      <div 
        className="absolute inset-0 opacity-10 dark:opacity-20 transition-all duration-1000 blur-3xl pointer-events-none"
        style={{ 
          background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)` 
        }} 
      />
      
      <div className="relative z-10 w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Financial Health</h2>
        </div>
        <div className={`p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700`}>
          <Activity className="w-5 h-5" style={{ color }} />
        </div>
      </div>

      <div className="relative z-10 w-full aspect-square max-w-[200px]">
        {!loading && stats ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={healthData}
                cx="50%"
                cy="50%"
                innerRadius={72}
                outerRadius={88}
                startAngle={210}
                endAngle={-30}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
                cornerRadius={20}
              >
                <Cell fill={color} />
                <Cell fill="rgba(0,0,0,0.04)" className="dark:fill-white/5" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Central Score Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <div className="relative">
            <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              {loading ? '--' : score}
            </span>
            <span className="absolute -top-1 -right-4 text-xs font-black text-slate-400 opacity-50">%</span>
          </div>
          <div className="mt-2 px-3 py-1 rounded-full border shadow-sm transition-all duration-500" style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
              {stats?.health?.status || 'Calculating...'}
            </span>
          </div>
        </div>
      </div>

      {/* Mini Insight */}
      <div className="relative z-10 w-full mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {score >= 80 ? 'Portfolio is excellently balanced.' : score >= 50 ? 'Steady progress, keep it up.' : 'Action required on liabilities.'}
          </p>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ 
  label, 
  value, 
  score, 
  icon: Icon, 
  color, 
  bg, 
  loading,
  hasDateFilter,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange
}: any) => (
  <div className="group relative overflow-hidden bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-xl rounded-3xl p-7 h-full flex flex-col justify-between border border-white/5 hover:border-white/10 transition-all duration-500 hover:translate-y-[-4px] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
    {/* Subtle Glow Accent */}
    <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none ${bg}`} />
    
    <div className="relative z-10 flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${bg} ${color} shadow-lg shadow-black/20 ring-1 ring-white/10`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</h3>
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Performance Metric</p>
        </div>
      </div>
      {hasDateFilter && (
        <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-xl border border-white/5">
           <select 
             value={selectedMonth} 
             onChange={(e) => onMonthChange(parseInt(e.target.value))} 
             className="bg-transparent border-none text-[10px] font-black text-blue-400 focus:ring-0 cursor-pointer p-0 appearance-none text-center"
           >
             {MONTHS.map((m, i) => (<option key={i} value={i} className="bg-slate-900">{m.substring(0, 3)}</option>))}
           </select>
           <div className="w-px h-3 bg-white/10 mx-0.5" />
           <select 
             value={selectedYear} 
             onChange={(e) => onYearChange(parseInt(e.target.value))} 
             className="bg-transparent border-none text-[10px] font-black text-slate-500 focus:ring-0 cursor-pointer p-0 appearance-none text-center"
           >
             {YEARS.map(y => (<option key={y} value={y} className="bg-slate-900">{y}</option>))}
           </select>
        </div>
      )}
    </div>

    <div className="relative z-10 mb-8">
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black text-white tracking-tighter tabular-nums leading-none">
          {loading ? '...' : value}
        </span>
      </div>
    </div>

    {/* Modern Metric Score Indicator */}
    <div className="relative z-10 mt-auto pt-4 border-t border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Metric Score</span>
        <span className={`text-[10px] font-black tabular-nums ${score >= 20 ? 'text-emerald-400' : score >= 10 ? 'text-amber-400' : 'text-rose-400'}`}>
          {score}<span className="text-slate-600 ml-0.5">/25</span>
        </span>
      </div>
      <div className="relative w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.1)] ${
            score >= 20 ? 'bg-emerald-500 shadow-emerald-500/20' : score >= 10 ? 'bg-amber-500 shadow-amber-500/20' : 'bg-rose-500 shadow-rose-500/20'
          }`}
          style={{ width: `${(score / 25) * 100}%` }}
        />
      </div>
    </div>
  </div>
);

const CashflowCard = ({ stats, loading, isLocked, cashflowMode, visualMonth, visualYear, pieData, selectedMonthData, onModeChange, onVisualMonthChange, onVisualYearChange }: any) => (
  <div className="bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] p-8 h-full flex flex-col border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
      <div className="flex items-center gap-4">
        <div className="p-3.5 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20 ring-1 ring-white/20">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight leading-none">Financial Velocity</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1.5">Monthly Performance Flow</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        {!isLocked && (
          <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            {[
              { m: 'table', icon: Table },
              { m: 'chart', icon: BarChart2 },
              { m: 'both', icon: Layers }
            ].map(({ m, icon: Icon }) => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  cashflowMode === m 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    
    <div className={`flex flex-col gap-8 flex-1 ${cashflowMode === 'both' ? 'xl:flex-row' : ''}`}>
      {(cashflowMode === 'table' || cashflowMode === 'both') && (
        <div className={`overflow-x-auto bg-slate-900/30 rounded-3xl border border-white/5 custom-scrollbar ${cashflowMode === 'both' ? 'xl:w-3/5' : 'w-full'}`}>
          <table className="min-w-[800px] w-full text-[11px]">
            <thead>
              <tr className="bg-slate-800/40 backdrop-blur-md border-b border-white/5">
                <th className="sticky left-0 bg-slate-800/80 backdrop-blur-md px-5 py-4 text-left font-black text-slate-500 uppercase tracking-widest z-10">Month</th>
                <th className="px-5 py-4 text-right font-black text-emerald-400 uppercase tracking-widest">Income</th>
                <th className="px-5 py-4 text-right font-black text-rose-400 uppercase tracking-widest">Expense</th>
                <th className="px-5 py-4 text-right font-black text-blue-400 uppercase tracking-widest">Savings</th>
                <th className="px-5 py-4 text-right font-black text-purple-400 uppercase tracking-widest">Goal</th>
                <th className="px-5 py-4 text-right font-black text-cyan-400 uppercase tracking-widest">Invest</th>
                <th className="px-5 py-4 text-right font-black text-amber-400 uppercase tracking-widest">Debt</th>
                <th className="px-5 py-4 text-right font-black text-white uppercase tracking-widest bg-blue-600/10">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(stats?.monthlyCashflow || []).map((m: any) => (
                <tr key={m.month} className="hover:bg-white/5 transition-colors group">
                  <td className="sticky left-0 bg-slate-900/80 backdrop-blur-md px-5 py-4 font-black text-slate-300 z-10">{m.month}</td>
                  <td className="px-5 py-4 text-right text-emerald-400/80 group-hover:text-emerald-400 font-bold tabular-nums">
                    {m.income.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-5 py-4 text-right text-rose-400/80 group-hover:text-rose-400 font-bold tabular-nums">
                    {m.expense.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-5 py-4 text-right text-blue-400/80 group-hover:text-blue-400 font-bold tabular-nums">
                    {m.saving.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-5 py-4 text-right text-purple-400/80 group-hover:text-purple-400 font-bold tabular-nums">
                    {m.goalSaving.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-5 py-4 text-right text-cyan-400/80 group-hover:text-cyan-400 font-bold tabular-nums">
                    {m.invest.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-5 py-4 text-right text-amber-400/80 group-hover:text-amber-400 font-bold tabular-nums">
                    {m.debt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className={`px-5 py-4 text-right font-black tabular-nums bg-blue-600/5 ${m.net >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                    {m.net.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(cashflowMode === 'chart' || cashflowMode === 'both') && (
        <div className={`min-h-[450px] bg-slate-900/30 p-8 rounded-[2rem] border border-white/5 flex flex-col ${cashflowMode === 'both' ? 'xl:w-2/5' : 'w-full'}`}>
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Flow Distribution</h3>
              <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                 <select value={visualMonth} onChange={(e) => onVisualMonthChange(parseInt(e.target.value))} className="bg-transparent border-none text-[10px] font-black text-blue-400 p-0 focus:ring-0 appearance-none text-center">
                   {MONTHS.map((m, i) => (<option key={i} value={i} className="bg-slate-900">{m.substring(0, 3)}</option>))}
                 </select>
                 <div className="w-px h-3 bg-white/10 mx-1" />
                 <select value={visualYear} onChange={(e) => onVisualYearChange(parseInt(e.target.value))} className="bg-transparent border-none text-[10px] font-black text-slate-500 p-0 focus:ring-0 appearance-none text-center">
                   {YEARS.map(y => (<option key={y} value={y} className="bg-slate-900">{y}</option>))}
                 </select>
              </div>
           </div>
           {!loading && pieData.length > 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center gap-10">
               <div className="h-[260px] w-full max-w-[260px] relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={70} 
                        outerRadius={105} 
                        paddingAngle={8} 
                        dataKey="value" 
                        stroke="none"
                        cornerRadius={12}
                      >
                        {pieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => `฿${value.toLocaleString()}`} 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }} 
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Central Indicator */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Net Flow</span>
                    <span className="text-2xl font-black text-white tabular-nums tracking-tighter">
                      ฿{(selectedMonthData?.net || 0).toLocaleString()}
                    </span>
                  </div>
               </div>
               <div className="w-full grid grid-cols-1 gap-2">
                  {pieData.map((item: any, idx: number) => (
                     <div key={idx} className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">{item.name}</span>
                        </div>
                        <span className="text-xs font-black text-white tabular-nums tracking-tight shrink-0">฿{item.value.toLocaleString()}</span>
                     </div>
                  ))}
               </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-3xl border border-dashed border-white/10">
               <Info className="w-10 h-10 text-slate-700 mb-3" />
               <p className="text-slate-500 text-xs font-black uppercase tracking-widest">No data for {MONTHS[visualMonth]} {visualYear}</p>
             </div>
           )}
        </div>
      )}
    </div>
  </div>
);

const GoalTrackingCard = ({ stats }: any) => (
  <div className="bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] p-8 h-full flex flex-col border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
    <div className="flex items-center justify-between mb-10">
      <div className="flex items-center gap-4">
        <div className="p-3.5 bg-purple-600 rounded-2xl text-white shadow-xl shadow-purple-600/20 ring-1 ring-white/20">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight leading-none">Milestones</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1.5">Asset Growth Tracking</p>
        </div>
      </div>
      <div className="px-4 py-2 bg-purple-500/10 rounded-2xl border border-purple-500/20">
        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
          {stats?.goalTracking?.length || 0} Targets Active
        </span>
      </div>
    </div>

    {stats?.goalTracking?.length > 0 ? (
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.goalTracking.map((goal: any) => (
          <div key={goal.id} className="group relative p-8 min-h-[240px] rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-purple-500/30 transition-all duration-500 hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col">
                <h3 className="text-sm font-black text-slate-300 group-hover:text-white transition-colors leading-tight mb-1">{goal.name}</h3>
                <span className="text-[8px] font-black text-purple-500/80 uppercase tracking-widest">Asset Goal</span>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
            </div>
            
            <div className="space-y-5">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Current Progress</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white tabular-nums leading-none tracking-tighter">
                    {(stats?.currency || '฿')}{(goal.currentAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2.5">
                <div className="relative w-full h-2 bg-black/40 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="absolute top-0 left-0 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 h-full rounded-full transition-all duration-1000 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]" 
                    style={{ width: '100%' }} 
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-600 uppercase">Tracked</span>
                  </div>
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider animate-pulse">On Track</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center py-16 bg-black/20 rounded-[2.5rem] border border-dashed border-white/10">
        <div className="p-4 bg-slate-900 rounded-2xl mb-4 border border-white/5">
          <Info className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">No active milestones detected</p>
      </div>
    )}
  </div>
);

const SystemAdminDashboard = ({ stats }: { stats: any }) => (
  <div className="pb-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    {/* Admin Hero Section */}
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-[2.5rem] p-10 shadow-2xl group">
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tighter">System Intelligence</h1>
          <p className="text-blue-100/70 font-medium text-lg max-w-xl leading-relaxed">
            Global monitoring and organization oversight for the Nexworth network.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-6 py-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10">
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-black text-white uppercase">Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Metric Overview */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { label: 'Total Organizations', value: stats.summary.totalOrganizations, icon: Building2, color: 'from-blue-600/20 to-blue-700/5', text: 'text-blue-400', border: 'border-blue-500/20' },
        { label: 'Total Users', value: stats.summary.totalUsers, icon: Activity, color: 'from-indigo-600/20 to-indigo-700/5', text: 'text-indigo-400', border: 'border-indigo-500/20' },
        { label: 'Total Transactions', value: stats.summary.totalTransactions?.toLocaleString(), icon: TrendingUp, color: 'from-emerald-600/20 to-emerald-700/5', text: 'text-emerald-400', border: 'border-emerald-500/20' }
      ].map((card, i) => (
        <div key={i} className={`bg-gradient-to-br ${card.color} p-8 rounded-3xl border ${card.border} shadow-xl hover:translate-y-[-4px] transition-all duration-300`}>
          <div className="flex items-center gap-6">
            <div className={`p-4 bg-slate-900/50 rounded-2xl ${card.text} border border-white/5`}><card.icon className="w-7 h-7" /></div>
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Organization Oversight Table */}
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800/50">
      <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Organization Oversight</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Recent network activity</p>
        </div>
        <Link href="/dashboard/organizations" className="px-5 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-wider">
          View All Network
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80 dark:bg-slate-800/50">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Organization</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Established</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">User Base</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Access Level</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {stats.recentOrganizations?.map((org: any) => (
              <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-8 py-5 font-black text-slate-900 dark:text-white">{org.name}</td>
                <td className="px-8 py-5 text-slate-500 font-medium tabular-nums">{new Date(org.createdAt).toLocaleDateString()}</td>
                <td className="px-8 py-5 text-slate-500 font-bold tabular-nums">{org._count.users} Active</td>
                <td className="px-8 py-5 text-right">
                  <span className="px-3 py-1 rounded-lg text-[9px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider">
                    Full Access
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ============================================
// Main Page Component
// ============================================

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const [stats, setStats] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [cashflowMode, setCashflowMode] = useState<'table' | 'chart' | 'both'>('chart');
  const [cashflowAccounts, setCashflowAccounts] = useState<any[]>([]);
  const [showThresholdSettings, setShowThresholdSettings] = useState(false);
  const [thresholds, setThresholds] = useState<{ low: number; mid: number }>({ low: 5000, mid: 15000 });
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>(ALL_WIDGETS.map(w => w.key));
  const [visualMonth, setVisualMonth] = useState(new Date().getMonth());
  const [visualYear, setVisualYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const savedMode = localStorage.getItem('nexworth-cashflow-mode');
    if (savedMode === 'table' || savedMode === 'chart' || savedMode === 'both') setCashflowMode(savedMode as any);
    const savedWidgets = localStorage.getItem('nexworth-enabled-widgets');
    if (savedWidgets) {
      try {
        const parsed = JSON.parse(savedWidgets);
        if (Array.isArray(parsed)) setEnabledWidgets(parsed);
      } catch (e) {}
    }
    const savedThresholds = localStorage.getItem('nexworth-cashflow-thresholds');
    if (savedThresholds) {
      try {
        setThresholds(JSON.parse(savedThresholds));
      } catch (e) {}
    }
  }, []);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/dashboard/stats?year=${selectedYear}&month=${selectedMonth}`);
        if (res.data) {
          setStats(res.data);
        } else {
          throw new Error('API returned empty data');
        }
      } catch (err: any) {
        console.error('Dashboard Stats Error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to connect to Nexworth API');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedMonth, selectedYear]);

  // Fetch CASHFLOW accounts for the banner
  useEffect(() => {
    const fetchCashflow = async () => {
      try {
        const [accRes, recRes] = await Promise.all([
          api.get('/accounts'),
          api.get('/financial-records?type=ASSET')
        ]);
        const accounts: any[] = accRes.data.accounts || [];
        const records: any[] = recRes.data.records || [];

        // Get personal CASHFLOW/BANK accounts and attach latest balance from financial records
        const cashflow = accounts
          .filter((a: any) => ['CASHFLOW', 'BANK'].includes(a.type) && a.isPersonal && a.isActive)
          .map((a: any) => {
            const latest = records
              .filter((r: any) => r.accountId === a.id)
              .sort((x: any, y: any) => new Date(y.date).getTime() - new Date(x.date).getTime())[0];
            return { ...a, balance: latest?.amount ?? 0 };
          });
        setCashflowAccounts(cashflow);
      } catch {}
    };
    fetchCashflow();
  }, []);

  const selectedMonthData = useMemo(() => {
    if (!stats?.monthlyCashflow) return null;
    const targetCode = getMonthCode(visualMonth);
    return stats.monthlyCashflow.find((m: any) => getMonthCode(m.month) === targetCode);
  }, [stats, visualMonth]);

  const pieData = useMemo(() => {
    if (!selectedMonthData) return [];
    return [
      { name: 'Income', value: selectedMonthData.income, color: '#3b82f6' },
      { name: 'Expense', value: selectedMonthData.expense, color: '#ef4444' },
      { name: 'Saving', value: selectedMonthData.saving + selectedMonthData.goalSaving, color: '#22c55e' },
      { name: 'Investment', value: selectedMonthData.invest, color: '#06b6d4' },
      { name: 'Debt Paid', value: selectedMonthData.debt, color: '#f59e0b' },
    ].filter(d => d.value > 0);
  }, [selectedMonthData]);

  const healthData = useMemo(() => [
    { name: 'Score', value: stats?.health?.score || 0 },
    { name: 'Remaining', value: 100 - (stats?.health?.score || 0) }
  ], [stats?.health?.score]);

  const goalsLength = stats?.goalTracking?.length || 0;
  const getGoalsHeight = useCallback((breakpoint: 'lg' | 'md' | 'sm') => {
    const goals = goalsLength;
    if (goals === 0) return 4;
    const cols = breakpoint === 'sm' ? 1 : 2;
    const rows = Math.ceil(goals / cols);
    return Math.max(4, Math.ceil(1.5 + (rows * 4.5)));
  }, [goalsLength]);

  const toggleWidget = useCallback((key: string) => {
    setEnabledWidgets(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      localStorage.setItem('nexworth-enabled-widgets', JSON.stringify(next));
      return next;
    });
  }, []);

  const updateCashflowMode = useCallback((mode: any) => {
    setCashflowMode(mode);
    localStorage.setItem('nexworth-cashflow-mode', mode);
  }, []);

  const gridItems = useMemo(() => {
    if (!stats) return [];
    const items: GridItemConfig[] = [
      { key: 'welcome', content: <WelcomeCard user={user} stats={stats} loading={loading} />, defaultLayout: { lg: { x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 4 }, md: { x: 0, y: 0, w: 10, h: 6 }, sm: { x: 0, y: 0, w: 6, h: 7 } } },
      { key: 'health', content: <HealthCard stats={stats} loading={loading} healthData={healthData} />, defaultLayout: { lg: { x: 6, y: 0, w: 3, h: 6, minW: 3, minH: 4 }, md: { x: 0, y: 6, w: 5, h: 6 }, sm: { x: 0, y: 7, w: 6, h: 5 } } },
      
      { key: 'saving-rate', content: <MetricCard label="Saving Rate" value={`${((stats?.health?.metrics?.savingRate ?? 0) * 100).toFixed(1)}%`} score={stats?.health?.scores?.saving ?? 0} icon={TrendingUp} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-900/20" loading={loading} hasDateFilter selectedMonth={selectedMonth} selectedYear={selectedYear} onMonthChange={setSelectedMonth} onYearChange={setSelectedYear} />, defaultLayout: { lg: { x: 9, y: 0, w: 3, h: 6, minW: 2, minH: 3 }, md: { x: 5, y: 6, w: 5, h: 6 }, sm: { x: 0, y: 12, w: 6, h: 5 } } },
      
      { key: 'goal-rate', content: <MetricCard label="Goal Rate" value={`${((stats?.health?.metrics?.goalRate ?? 0) * 100).toFixed(1)}%`} icon={TrendingUp} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-900/20" loading={loading} />, defaultLayout: { lg: { x: 0, y: 6, w: 3, h: 5, minW: 2, minH: 3 }, md: { x: 0, y: 12, w: 5, h: 5 }, sm: { x: 0, y: 17, w: 6, h: 5 } } },
      
      { key: 'emergency-fund', content: <MetricCard label="Emergency Fund" value={`${stats?.health?.metrics?.emergencyMonths ?? 0} Mo`} score={stats?.health?.scores?.emergency ?? 0} icon={ShieldCheck} color="text-green-500" bg="bg-green-50 dark:bg-green-900/20" loading={loading} />, defaultLayout: { lg: { x: 3, y: 6, w: 3, h: 5, minW: 2, minH: 3 }, md: { x: 5, y: 12, w: 5, h: 5 }, sm: { x: 0, y: 22, w: 6, h: 5 } } },
      
      { key: 'debt-ratio', content: <MetricCard label="Debt Ratio" value={`${((stats?.health?.metrics?.debtRatio ?? 0) * 100).toFixed(1)}%`} score={stats?.health?.scores?.debt ?? 0} icon={CreditCard} color="text-red-500" bg="bg-red-50 dark:bg-red-900/20" loading={loading} />, defaultLayout: { lg: { x: 6, y: 6, w: 3, h: 5, minW: 2, minH: 3 }, md: { x: 0, y: 17, w: 5, h: 5 }, sm: { x: 0, y: 27, w: 6, h: 5 } } },
      
      { key: 'investment-ratio', content: <MetricCard label="Investment" value={`${((stats?.health?.metrics?.investmentRatio ?? 0) * 100).toFixed(1)}%`} score={stats?.health?.scores?.investment ?? 0} icon={Activity} color="text-cyan-500" bg="bg-cyan-50 dark:bg-cyan-900/20" loading={loading} />, defaultLayout: { lg: { x: 9, y: 6, w: 3, h: 5, minW: 2, minH: 3 }, md: { x: 5, y: 17, w: 5, h: 5 }, sm: { x: 0, y: 32, w: 6, h: 5 } } },
      
      { key: 'cashflow', content: <CashflowCard stats={stats} loading={loading} isLocked={isLocked} cashflowMode={cashflowMode} visualMonth={visualMonth} visualYear={visualYear} pieData={pieData} selectedMonthData={selectedMonthData} onModeChange={updateCashflowMode} onVisualMonthChange={setVisualMonth} onVisualYearChange={setVisualYear} />, defaultLayout: { lg: { x: 0, y: 11, w: 12, h: 14, minW: 6, minH: 8 }, md: { x: 0, y: 22, w: 10, h: 14 }, sm: { x: 0, y: 37, w: 6, h: 15 } } },
      
      { key: 'goals', content: <GoalTrackingCard stats={stats} />, defaultLayout: { lg: { x: 0, y: 25, w: 12, h: getGoalsHeight('lg'), minW: 4, minH: 3 }, md: { x: 0, y: 36, w: 10, h: getGoalsHeight('md') }, sm: { x: 0, y: 52, w: 6, h: getGoalsHeight('sm') } } }
    ];
    return items.filter(item => enabledWidgets.includes(item.key));
  }, [user, stats, loading, isLocked, cashflowMode, enabledWidgets, visualMonth, visualYear, pieData, healthData, getGoalsHeight, updateCashflowMode, setSelectedMonth, setSelectedYear, selectedMonth, selectedYear]);

  if (!hasPermission('dashboard', 'canView')) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl">
          <ShieldCheck className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-white tracking-tight mb-3">Access Denied</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">You don't have the required clearance to view the Nexworth Command Center.</p>
          <Link href="/login" className="inline-block px-8 py-3 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest">Return to Login</Link>
        </div>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-6 h-6 text-blue-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-white tracking-tighter mb-2">Syncing your Wealth...</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Initializing Financial Core</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/20 ring-4 ring-rose-500/10">
            <Info className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-3">API Connection Error</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            {error}. <br/> 
            <span className="text-[10px] text-rose-400 uppercase font-black tracking-widest mt-2 inline-block">
              Check if NEXT_PUBLIC_API_URL is set in Vercel
            </span>
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs shadow-xl"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (user?.role === 'SUPERADMIN' && stats?.isSystemAdmin) {
    return <SystemAdminDashboard stats={stats} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30">
      {/* Premium Mesh Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-purple-900/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] rounded-full bg-emerald-900/5 blur-[100px]" />
      </div>

      <div className="relative z-10 p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {cashflowAccounts && cashflowAccounts.length > 0 && (
        <div className="relative z-40 flex items-center gap-4 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm text-sm group">
          {/* Decorative Background Wrapper */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 dark:from-blue-900/10 to-transparent" />
          </div>
          
          <span className="relative z-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap shrink-0">Cashflow Status</span>
          <div className="relative z-10 flex items-center gap-6 flex-wrap flex-1">
            {cashflowAccounts.map((acc: any) => {
              const balance = acc.balance ?? 0;
              const isLow = balance < thresholds.low;
              const isMid = balance >= thresholds.low && balance < thresholds.mid;
              
              // Bank Icon Logic
              const bankName = acc.bank?.name || acc.name || '';
              const bankColor = acc.bank?.color || (
                bankName.includes('กสิกร') ? '#00A950' : 
                bankName.includes('กรุงเทพ') ? '#1e40af' : 
                bankName.includes('ไทยพาณิชย์') ? '#4c1d95' : 
                bankName.includes('กรุงไทย') ? '#00ADEF' : 
                bankName.includes('กรุงศรี') ? '#FFD100' : 
                bankName.includes('TTB') ? '#004daa' : '#64748b'
              );
              const initial = (acc.bank?.code?.[0] || bankName[0] || 'B').toUpperCase();

              return (
                <div key={acc.id} className="flex items-center gap-3">
                  {/* Bank Avatar Icon */}
                  <div className="relative">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black text-white shadow-sm transition-transform hover:scale-110"
                      style={{ backgroundColor: bankColor }}
                    >
                      {initial}
                    </div>
                    {/* Status Indicator Dot */}
                    <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                      isLow ? 'bg-rose-500 animate-pulse' : isMid ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-none mb-0.5">{acc.name}</span>
                    <span className={`text-sm font-black tabular-nums tracking-tight leading-none ${
                      isLow ? 'text-rose-500' : isMid ? 'text-amber-500' : 'text-emerald-500'
                    }`}>฿{balance.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowThresholdSettings(p => !p)}
            className="relative z-10 ml-auto p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="ตั้งค่าเกณฑ์สถานะ"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* Threshold Settings Popover */}
          {showThresholdSettings && (
            <div className="absolute right-4 top-12 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 w-72 animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Threshold Settings</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Low (Red)</span>
                  </div>
                   <input
                    type="number"
                    className="w-32 text-right text-xs font-black border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    value={thresholds.low}
                    onChange={e => {
                      const val = { ...thresholds, low: e.target.value === '' ? 0 : Number(e.target.value) };
                      setThresholds(val);
                      localStorage.setItem('nexworth-cashflow-thresholds', JSON.stringify(val));
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Mid (Yellow)</span>
                  </div>
                  <input
                    type="number"
                    className="w-32 text-right text-xs font-black border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    value={thresholds.mid}
                    onChange={e => {
                      const val = { ...thresholds, mid: e.target.value === '' ? 0 : Number(e.target.value) };
                      setThresholds(val);
                      localStorage.setItem('nexworth-cashflow-thresholds', JSON.stringify(val));
                    }}
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">
                <div className="bg-rose-50 dark:bg-rose-900/10 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30">{'< '}{thresholds.low.toLocaleString()}</div>
                <div className="bg-amber-50 dark:bg-amber-900/10 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/30">{thresholds.low.toLocaleString()}–{thresholds.mid.toLocaleString()}</div>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">{'> '}{thresholds.mid.toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      )}
      {!isLocked && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900/30 animate-in slide-in-from-top-4 duration-500">
           <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Widget Architecture</h3>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customize your dashboard grid</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {ALL_WIDGETS.map(widget => { 
                  const isActive = enabledWidgets.includes(widget.key); 
                  return (
                    <button 
                      key={widget.key} 
                      onClick={() => toggleWidget(widget.key)} 
                      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-[11px] font-black transition-all uppercase tracking-wider ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20' 
                          : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      <widget.icon className="w-3.5 h-3.5" />
                      {widget.label}
                      {isActive ? <Eye className="w-3.5 h-3.5 opacity-80" /> : <EyeOff className="w-3.5 h-3.5 opacity-40" />}
                    </button>
                  ); 
                })}
              </div>
           </div>
        </div>
      )}
      <DashboardGrid items={gridItems} isLocked={isLocked} setIsLocked={setIsLocked} />
    </div>
  </div>
);
}
