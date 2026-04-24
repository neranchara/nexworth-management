'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { Wallet, Calendar, ShieldCheck, Activity, CreditCard, TrendingUp, Info, Table, BarChart2, Layers, Check, Eye, EyeOff, Layout, Settings2 } from 'lucide-react';
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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
  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 h-full flex flex-col justify-between">
    <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs">Here is your financial status.</p>
    </div>
    
    <div className="grid grid-cols-2 gap-4 flex-1">
      <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex flex-col justify-center">
         <div className="flex items-center justify-between mb-1">
           <h3 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Real Assets</h3>
           <Wallet className="w-3.5 h-3.5 text-blue-500" />
         </div>
         <p className="text-xl font-black text-gray-900 dark:text-white truncate">
           {loading ? '...' : `${stats?.currency || '฿'}${(stats?.summary?.totalAssets || 0).toLocaleString()}`}
         </p>
      </div>

      <div className="bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/30 flex flex-col justify-center">
         <div className="flex items-center justify-between mb-1">
           <h3 className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Goal Money</h3>
           <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
         </div>
         <p className="text-xl font-black text-gray-900 dark:text-white truncate">
           {loading ? '...' : `${stats?.currency || '฿'}${(stats?.summary?.totalGoalAssets || 0).toLocaleString()}`}
         </p>
      </div>

      <div className="bg-red-50/50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-800/30 flex flex-col justify-center">
         <div className="flex items-center justify-between mb-1">
           <h3 className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Liabilities</h3>
           <CreditCard className="w-3.5 h-3.5 text-red-500" />
         </div>
         <p className="text-xl font-black text-gray-900 dark:text-white truncate">
           {loading ? '...' : `${stats?.currency || '฿'}${(stats?.summary?.totalLiabilities || 0).toLocaleString()}`}
         </p>
      </div>

      <div className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-800/30 flex flex-col justify-center">
         <div className="flex items-center justify-between mb-1">
           <h3 className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Net Worth</h3>
           <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
         </div>
         <p className="text-xl font-black text-gray-900 dark:text-white truncate">
           {loading ? '...' : `${stats?.currency || '฿'}${(stats?.summary?.netWorth || 0).toLocaleString()}`}
         </p>
      </div>
    </div>
  </div>
);

const HealthCard = ({ stats, loading, healthData }: { stats: any; loading: boolean; healthData: any[] }) => (
  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex flex-col items-center justify-center relative h-full">
    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Financial Health</h2>
    
    <div className="relative h-40 w-40 sm:h-48 sm:w-48">
      {!loading && stats?.health?.score !== undefined ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={healthData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              startAngle={225}
              endAngle={-45}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={getHealthColor(stats.health?.score || 0)} />
              <Cell fill="transparent" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{loading ? '--' : stats?.health?.score}</span>
        <span className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: getHealthColor(stats?.health?.score || 0) }}>
          {stats?.health?.status}
        </span>
      </div>
    </div>
  </div>
);

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
  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5 h-full flex flex-col justify-between">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-xl ${bg} ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</h3>
      </div>
      {hasDateFilter && (
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 px-2 py-0.5 rounded-lg border dark:border-gray-700 scale-90 origin-right">
           <select value={selectedMonth} onChange={(e) => onMonthChange(parseInt(e.target.value))} className="bg-transparent border-none text-[10px] font-bold text-blue-600 dark:text-blue-400 focus:ring-0 cursor-pointer p-0">
             {MONTHS.map((m, i) => (<option key={i} value={i}>{m.substring(0, 3)}</option>))}
           </select>
           <select value={selectedYear} onChange={(e) => onYearChange(parseInt(e.target.value))} className="bg-transparent border-none text-[10px] font-bold text-gray-500 dark:text-gray-400 focus:ring-0 cursor-pointer p-0 border-l dark:border-gray-700">
             {YEARS.map(y => (<option key={y} value={y}>{y}</option>))}
           </select>
        </div>
      )}
    </div>
    
    <div className="flex-1 flex flex-col justify-center">
      <p className="text-4xl font-black text-gray-900 dark:text-white mb-4">
        {loading ? '...' : value}
      </p>
      
      {score !== undefined && (
        <div className="space-y-2">
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${color.replace('text-', 'bg-')}`} style={{ width: loading ? '0%' : `${(score / 25) * 100}%` }} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Performance Score</span>
            <span className="text-xs font-black text-gray-900 dark:text-white">{loading ? '--' : score}/25</span>
          </div>
        </div>
      )}
    </div>
  </div>
);

const CashflowCard = ({ stats, loading, isLocked, cashflowMode, visualMonth, visualYear, pieData, onModeChange, onVisualMonthChange, onVisualYearChange }: any) => (
  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 h-full flex flex-col">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <Calendar className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Summary (Aggregated)</h2>
      </div>
      <div className="flex items-center gap-4">
        {!isLocked && (
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {['table', 'chart', 'both'].map((m: any) => (
              <button key={m} onClick={() => onModeChange(m)} className={`p-1.5 rounded-md transition-all ${cashflowMode === m ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {m === 'table' ? <Table className="w-4 h-4" /> : m === 'chart' ? <BarChart2 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
        <Link href="/dashboard/monthly" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Detailed Monthly Report<TrendingUp className="w-4 h-4" /></Link>
      </div>
    </div>
    
    <div className={`grid gap-8 flex-1 ${cashflowMode === 'both' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
      {(cashflowMode === 'table' || cashflowMode === 'both') && (
        <div className="overflow-x-auto border dark:border-gray-700 rounded-2xl">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-[10px] sm:text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-4 py-4 text-right font-bold text-green-600 uppercase tracking-wider border-l dark:border-gray-700/50">Income</th>
                <th className="px-4 py-4 text-right font-bold text-red-600 uppercase tracking-wider">Expense</th>
                <th className="px-4 py-4 text-right font-bold text-blue-600 uppercase tracking-wider">Savings</th>
                <th className="px-4 py-4 text-right font-bold text-purple-600 uppercase tracking-wider">Goal Savings</th>
                <th className="px-4 py-4 text-right font-bold text-cyan-600 uppercase tracking-wider">Investments</th>
                <th className="px-4 py-4 text-right font-bold text-orange-600 uppercase tracking-wider">Debt Paid</th>
                <th className="px-4 py-4 text-right font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider bg-blue-50/30 dark:bg-blue-900/10">Net Balance</th>
                <th className="px-4 py-4 text-right font-bold text-gray-400 uppercase tracking-wider">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {(stats?.monthlyCashflow || []).map((m: any) => (
                <tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300">{m.month}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-mono font-medium border-l dark:border-gray-700/50">
                    {m.income.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 font-mono font-medium">
                    {m.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600 font-mono font-medium">
                    {m.saving.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right text-purple-600 font-mono font-medium">
                    {m.goalSaving.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right text-cyan-600 font-mono font-medium">
                    {m.invest.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600 font-mono font-medium">
                    {m.debt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold font-mono bg-blue-50/30 dark:bg-blue-900/10 ${m.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {m.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-[10px] text-gray-400 font-medium">{m.records} txs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(cashflowMode === 'chart' || cashflowMode === 'both') && (
        <div className="min-h-[400px] flex-1 w-full bg-white dark:bg-gray-800 p-2 rounded-lg border dark:border-gray-700 flex flex-col">
           <div className="flex items-center justify-between mb-4 px-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Monthly Distribution</h3>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded-lg border dark:border-gray-700">
                 <select value={visualMonth} onChange={(e) => onVisualMonthChange(parseInt(e.target.value))} className="bg-transparent border-none text-xs font-bold text-blue-600 dark:text-blue-400 p-0 focus:ring-0">
                   {MONTHS.map((m, i) => (<option key={i} value={i}>{m.substring(0, 3)}</option>))}
                 </select>
                 <select value={visualYear} onChange={(e) => onVisualYearChange(parseInt(e.target.value))} className="bg-transparent border-none text-xs font-bold text-gray-500 dark:text-gray-400 p-0 border-l dark:border-gray-700 pl-2 focus:ring-0">
                   {YEARS.map(y => (<option key={y} value={y}>{y}</option>))}
                 </select>
              </div>
           </div>
           {!loading && pieData.length > 0 ? (
             <div className="flex-1 flex flex-col md:flex-row items-center justify-around">
               <div className="h-[250px] w-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">{pieData.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip formatter={(value: any) => `${value.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} /></PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="space-y-3 min-w-[200px]">
                  {pieData.map((item: any, idx: number) => (
                     <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 dark:bg-gray-900/30">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.name}</span></div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value.toLocaleString()}</span>
                     </div>
                  ))}
               </div>
             </div>
           ) : (
             <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg"><Info className="w-10 h-10 text-gray-300 mb-2" /><p className="text-gray-400 text-sm italic">No data recorded for {MONTHS[visualMonth]} {visualYear}</p></div>
           )}
        </div>
      )}
    </div>
  </div>
);

const GoalTrackingCard = ({ stats }: any) => (
  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5 h-full">
    <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-purple-600" /><h2 className="text-lg font-bold text-gray-900 dark:text-white">Multi-Goal Tracking</h2></div>
    {stats?.goalTracking?.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.goalTracking.map((goal: any) => (
          <div key={goal.id} className="p-3 border dark:border-gray-700 rounded-xl bg-gray-50/30 dark:bg-gray-800/50 hover:border-purple-300 dark:hover:border-purple-900 transition-colors flex flex-col justify-between h-full">
            <div className="flex justify-between items-start gap-2 mb-2">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{goal.name}</h3>
              <span className="text-[8px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded uppercase flex-shrink-0">Goal</span>
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Saved</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{(stats?.currency || '฿')}{(goal.currentAmount || 0).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full transition-all duration-1000" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-6 border-2 border-dashed dark:border-gray-700 rounded-xl"><Info className="w-8 h-8 text-gray-300 mx-auto mb-1" /><p className="text-gray-500 dark:text-gray-400 text-xs">No active goals found.</p></div>
    )}
  </div>
);

const SystemAdminDashboard = ({ stats }: { stats: any }) => (
  <div className="pb-12 space-y-8 animate-in fade-in duration-700">
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-xl text-white">
      <h1 className="text-3xl font-bold mb-2">System Management Dashboard</h1>
      <p className="text-blue-100 opacity-90">Welcome back, Super Admin. Here is the global status of Nexworth.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { label: 'Total Organizations', value: stats.summary.totalOrganizations, icon: ShieldCheck, color: 'border-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
        { label: 'Total Users', value: stats.summary.totalUsers, icon: Activity, color: 'border-green-500', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
        { label: 'Total Transactions', value: stats.summary.totalTransactions?.toLocaleString(), icon: TrendingUp, color: 'border-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' }
      ].map((card, i) => (
        <div key={i} className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-l-4 ${card.color} hover:scale-[1.02] transition-transform`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 ${card.bg} rounded-xl ${card.text}`}><card.icon className="w-6 h-6" /></div>
            <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p><p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p></div>
          </div>
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border dark:border-gray-700">
      <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center"><h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Organizations</h2><Link href="/dashboard/organizations" className="text-blue-600 hover:underline text-sm font-medium">View All</Link></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50"><tr><th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Org Name</th><th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Created At</th><th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Users</th><th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Status</th></tr></thead>
          <tbody className="divide-y dark:divide-gray-700">
            {stats.recentOrganizations?.map((org: any) => (
              <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{org.name}</td><td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(org.createdAt).toLocaleDateString()}</td><td className="px-6 py-4 text-gray-500 dark:text-gray-400">{org._count.users} Users</td><td className="px-6 py-4 text-right"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</span></td></tr>
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/dashboard/stats?year=${selectedYear}&month=${selectedMonth}`);
        setStats(res.data);
      } catch (err) {
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

  const pieData = useMemo(() => {
    if (!stats?.monthlyCashflow) return [];
    const monthName = MONTHS[visualMonth].substring(0, 3);
    const monthData = stats.monthlyCashflow.find((m: any) => m.month === monthName);
    if (!monthData) return [];
    return [
      { name: 'Income', value: monthData.income, color: '#3b82f6' },
      { name: 'Expense', value: monthData.expense, color: '#ef4444' },
      { name: 'Saving', value: monthData.saving + monthData.goalSaving, color: '#22c55e' },
      { name: 'Investment', value: monthData.invest, color: '#06b6d4' },
      { name: 'Debt Paid', value: monthData.debt, color: '#f59e0b' },
    ].filter(d => d.value > 0);
  }, [stats, visualMonth]);

  const healthData = useMemo(() => [
    { name: 'Score', value: stats?.health?.score || 0 },
    { name: 'Remaining', value: 100 - (stats?.health?.score || 0) }
  ], [stats?.health?.score]);

  const goalsLength = stats?.goalTracking?.length || 0;
  const getGoalsHeight = useCallback((breakpoint: 'lg' | 'md' | 'sm') => {
    const goals = goalsLength;
    if (goals === 0) return 4;
    let cols = breakpoint === 'lg' ? 4 : breakpoint === 'md' ? 2 : 1;
    const rows = Math.ceil(goals / cols);
    return Math.max(4, Math.ceil(1.5 + (rows * 3)));
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
      
      { key: 'saving-rate', content: <MetricCard label="Saving Rate" value={`${(stats?.health?.metrics.savingRate * 100).toFixed(1)}%`} score={stats?.health?.scores.saving} icon={TrendingUp} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-900/20" loading={loading} hasDateFilter selectedMonth={selectedMonth} selectedYear={selectedYear} onMonthChange={setSelectedMonth} onYearChange={setSelectedYear} />, defaultLayout: { lg: { x: 9, y: 0, w: 3, h: 6, minW: 2, minH: 3 }, md: { x: 5, y: 6, w: 5, h: 6 }, sm: { x: 0, y: 12, w: 6, h: 5 } } },
      
      { key: 'goal-rate', content: <MetricCard label="Goal Rate" value={`${(stats?.health?.metrics.goalRate * 100).toFixed(1)}%`} icon={TrendingUp} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-900/20" loading={loading} />, defaultLayout: { lg: { x: 0, y: 6, w: 3, h: 5, minW: 2, minH: 3 }, md: { x: 0, y: 12, w: 5, h: 5 }, sm: { x: 0, y: 17, w: 6, h: 5 } } },
      
      { key: 'emergency-fund', content: <MetricCard label="Emergency Fund" value={`${stats?.health?.metrics.emergencyMonths} Mo`} score={stats?.health?.scores.emergency} icon={ShieldCheck} color="text-green-500" bg="bg-green-50 dark:bg-green-900/20" loading={loading} />, defaultLayout: { lg: { x: 3, y: 6, w: 3, h: 5, minW: 2, minH: 3 }, md: { x: 5, y: 12, w: 5, h: 5 }, sm: { x: 0, y: 22, w: 6, h: 5 } } },
      
      { key: 'debt-ratio', content: <MetricCard label="Debt Ratio" value={`${(stats?.health?.metrics.debtRatio * 100).toFixed(1)}%`} score={stats?.health?.scores.debt} icon={CreditCard} color="text-red-500" bg="bg-red-50 dark:bg-red-900/20" loading={loading} />, defaultLayout: { lg: { x: 6, y: 6, w: 3, h: 5, minW: 2, minH: 3 }, md: { x: 0, y: 17, w: 5, h: 5 }, sm: { x: 0, y: 27, w: 6, h: 5 } } },
      
      { key: 'investment-ratio', content: <MetricCard label="Investment" value={`${(stats?.health?.metrics.investmentRatio * 100).toFixed(1)}%`} score={stats?.health?.scores.investment} icon={Activity} color="text-cyan-500" bg="bg-cyan-50 dark:bg-cyan-900/20" loading={loading} />, defaultLayout: { lg: { x: 9, y: 6, w: 3, h: 5, minW: 2, minH: 3 }, md: { x: 5, y: 17, w: 5, h: 5 }, sm: { x: 0, y: 32, w: 6, h: 5 } } },
      
      { key: 'cashflow', content: <CashflowCard stats={stats} loading={loading} isLocked={isLocked} cashflowMode={cashflowMode} visualMonth={visualMonth} visualYear={visualYear} pieData={pieData} onModeChange={updateCashflowMode} onVisualMonthChange={setVisualMonth} onVisualYearChange={setVisualYear} />, defaultLayout: { lg: { x: 0, y: 11, w: 12, h: 14, minW: 6, minH: 8 }, md: { x: 0, y: 22, w: 10, h: 14 }, sm: { x: 0, y: 37, w: 6, h: 15 } } },
      
      { key: 'goals', content: <GoalTrackingCard stats={stats} />, defaultLayout: { lg: { x: 0, y: 25, w: 12, h: getGoalsHeight('lg'), minW: 4, minH: 3 }, md: { x: 0, y: 36, w: 10, h: getGoalsHeight('md') }, sm: { x: 0, y: 52, w: 6, h: getGoalsHeight('sm') } } }
    ];
    return items.filter(item => enabledWidgets.includes(item.key));
  }, [user, stats, loading, isLocked, cashflowMode, enabledWidgets, visualMonth, visualYear, pieData, healthData, getGoalsHeight, updateCashflowMode, setSelectedMonth, setSelectedYear, selectedMonth, selectedYear]);

  if (!hasPermission('dashboard', 'canView')) {
    return (<div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center"><ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-4" /><h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1><p className="text-gray-600 dark:text-gray-400">No permission to view dashboard.</p></div>);
  }

  if (loading && !stats) {
    return (<div className="w-full h-[60vh] flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div><p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading system overview...</p></div></div>);
  }

  if (stats?.isSystemAdmin) return <SystemAdminDashboard stats={stats} />;

  return (
    <div className="pb-12 space-y-4">
      {/* CASHFLOW Banner - minimal */}
      {cashflowAccounts && cashflowAccounts.length > 0 && (
        <div className="relative flex items-center gap-4 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm text-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap shrink-0">Balance</span>
          <div className="flex items-center gap-5 flex-wrap flex-1">
            {cashflowAccounts.map((acc: any) => {
              const balance = acc.balance ?? 0;
              const isLow = balance < thresholds.low;
              const isMid = balance >= thresholds.low && balance < thresholds.mid;
              return (
                <div key={acc.id} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isLow ? 'bg-red-400 animate-pulse' : isMid ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">{acc.name}</span>
                  <span className={`text-sm font-bold tabular-nums ${
                    isLow ? 'text-red-500' : isMid ? 'text-amber-500' : 'text-emerald-500'
                  }`}>฿{balance.toLocaleString()}</span>
                </div>
              );
            })}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowThresholdSettings(p => !p)}
            className="ml-auto p-1 rounded text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
            title="ตั้งค่าเกณฑ์สถานะ"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          {/* Threshold Settings Popover */}
          {showThresholdSettings && (
            <div className="absolute right-0 top-9 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 w-64 animate-in fade-in slide-in-from-top-2 duration-150">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">ตั้งค่าเกณฑ์สถานะ</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">ต่ำกว่า (แดง)</span>
                  </div>
                  <input
                    type="number"
                    className="w-28 text-right text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                    value={thresholds.low}
                    onChange={e => {
                      const val = { ...thresholds, low: Number(e.target.value) };
                      setThresholds(val);
                      localStorage.setItem('nexworth-cashflow-thresholds', JSON.stringify(val));
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">ต่ำกว่า (เหลือง)</span>
                  </div>
                  <input
                    type="number"
                    className="w-28 text-right text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    value={thresholds.mid}
                    onChange={e => {
                      const val = { ...thresholds, mid: Number(e.target.value) };
                      setThresholds(val);
                      localStorage.setItem('nexworth-cashflow-thresholds', JSON.stringify(val));
                    }}
                  />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-1 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400"/>{'< '}{thresholds.low.toLocaleString()}</span>
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>{thresholds.low.toLocaleString()}–{thresholds.mid.toLocaleString()}</span>
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>{'> '}{thresholds.mid.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}
      {!isLocked && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-blue-200 dark:border-blue-900/50 animate-in slide-in-from-top-2 duration-300">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2"><div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400"><Layout className="w-4 h-4" /></div><div><h3 className="text-sm font-bold text-gray-900 dark:text-white">Widget Manager</h3><p className="text-[10px] text-gray-500 dark:text-gray-400">Enable or disable dashboard components</p></div></div>
              <div className="flex flex-wrap items-center gap-2">{ALL_WIDGETS.map(widget => { const isActive = enabledWidgets.includes(widget.key); return (<button key={widget.key} onClick={() => toggleWidget(widget.key)} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800' : 'bg-gray-50 dark:bg-gray-900/30 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900/50 border border-transparent'}`}><widget.icon className="w-3.5 h-3.5" />{widget.label}{isActive ? <Eye className="w-3.5 h-3.5 ml-1" /> : <EyeOff className="w-3.5 h-3.5 ml-1" />}</button>); })}</div>
           </div>
        </div>
      )}
      <DashboardGrid items={gridItems} isLocked={isLocked} setIsLocked={setIsLocked} />
    </div>
  );
}
