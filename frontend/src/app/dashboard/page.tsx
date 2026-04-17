'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { Wallet, TrendingDown, Calendar, ShieldCheck, Activity, CreditCard, TrendingUp, Info } from 'lucide-react';
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

const DashboardGrid = dynamic(() => import('@/components/DashboardGrid'), { ssr: false });

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const [stats, setStats] = useState<any>({ 
    summary: {
      totalAssets: 0, 
      totalGoalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
      savingRate: 0,
      goalRate: 0,
      debtRatio: 0,
      investmentRatio: 0,
      emergencyMonths: 0
    },
    currency: '฿',
    monthlyCashflow: [],
    health: {
      score: 0,
      status: 'Loading...',
      metrics: { savingRate: 0, goalRate: 0, emergencyMonths: 0, debtRatio: 0, investmentRatio: 0 },
      scores: { saving: 0, emergency: 0, debt: 0, investment: 0 }
    },
    goalTracking: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getHealthColor = (score: number) => {
    if (score >= 90) return '#10b981'; // Green-500
    if (score >= 75) return '#34d399'; // Green-400
    if (score >= 60) return '#3b82f6'; // Blue-500
    if (score >= 40) return '#f59e0b'; // Amber-500
    return '#ef4444'; // Red-500
  };

  const healthData = [
    { name: 'Score', value: stats.health?.score || 0 },
    { name: 'Remaining', value: 100 - (stats.health?.score || 0) }
  ];
  
  if (!hasPermission('dashboard', 'canView')) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
         <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-4" />
         <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
         <p className="text-gray-600 dark:text-gray-400">You do not have permission to view the dashboard.</p>
      </div>
    );
  }

  // ============================================
  // Define Grid Items
  // ============================================

  const welcomeCard = (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 h-full">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Welcome back, {user?.firstName} {user?.lastName}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Here is your real-time financial overview.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Real Assets Card */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
           <div className="flex items-center justify-between mb-1">
             <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Real Assets</h3>
             <Wallet className="w-4 h-4 text-blue-500" />
           </div>
           <p className="text-2xl font-bold text-gray-900 dark:text-white">
             {loading ? '...' : `${stats.currency}${stats.summary.totalAssets.toLocaleString()}`}
           </p>
           <p className="text-[10px] text-gray-400 mt-1 italic">Excl. Goal & Internal</p>
        </div>

        {/* Goal Money Card */}
        <div className="bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800/30">
           <div className="flex items-center justify-between mb-1">
             <h3 className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Goal Money</h3>
             <TrendingUp className="w-4 h-4 text-purple-500" />
           </div>
           <p className="text-2xl font-bold text-gray-900 dark:text-white">
             {loading ? '...' : `${stats.currency}${stats.summary.totalGoalAssets.toLocaleString()}`}
           </p>
           <p className="text-[10px] text-gray-400 mt-1 italic">Temporary / Borrowed</p>
        </div>

        {/* Total Liabilities Card */}
        <div className="bg-red-50/50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-800/30">
           <div className="flex items-center justify-between mb-1">
             <h3 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Liabilities</h3>
             <CreditCard className="w-4 h-4 text-red-500" />
           </div>
           <p className="text-2xl font-bold text-gray-900 dark:text-white">
             {loading ? '...' : `${stats.currency}${stats.summary.totalLiabilities.toLocaleString()}`}
           </p>
        </div>

        {/* Net Worth Card */}
        <div className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-800/30">
           <div className="flex items-center justify-between mb-1">
             <h3 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Net Worth</h3>
             <ShieldCheck className="w-4 h-4 text-green-500" />
           </div>
           <p className="text-2xl font-bold text-gray-900 dark:text-white">
             {loading ? '...' : `${stats.currency}${stats.summary.netWorth.toLocaleString()}`}
           </p>
           <p className="text-[10px] text-gray-400 mt-1 italic">Real Assets - Debt</p>
        </div>
      </div>
    </div>
  );

  const healthCard = (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex flex-col items-center justify-center relative h-full">
      <div className="absolute top-4 right-4 group">
         <Info className="w-4 h-4 text-gray-400 cursor-help" />
         <div className="hidden group-hover:block absolute right-0 mt-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
            Score based on Saving Rate, Emergency Fund, Debt stability, and Investments.
         </div>
      </div>
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Financial Health</h2>
      
      <div className="relative h-48 w-48">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{loading ? '--' : stats.health?.score}</span>
          <span className="text-xs font-bold uppercase tracking-tighter" style={{ color: getHealthColor(stats.health?.score || 0) }}>
            {stats.health?.status}
          </span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
          Your financial status is overall <strong>{stats.health?.status}</strong>. Keep it up!
        </p>
      </div>
    </div>
  );

  const monthlyMetricsCard = (
    <div className="h-full">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monthly Metrics</h3>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: TrendingUp, label: 'Saving Rate', value: `${(stats.health?.metrics.savingRate * 100).toFixed(1)}%`, score: stats.health?.scores.saving, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { icon: TrendingUp, label: 'Goal Rate', value: `${(stats.health?.metrics.goalRate * 100).toFixed(1)}%`, score: null, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((item, idx) => (
          <div key={idx} className={`${item.bg} p-4 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${item.bg.replace('/20', '/40')} ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{loading ? '...' : item.value}</p>
              </div>
            </div>
            {item.score !== null && (
              <>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${item.color.replace('text-', 'bg-')}`} 
                    style={{ width: loading ? '0%' : `${(item.score / 25) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] mt-2 text-right font-medium text-gray-400">Score: {loading ? '--' : item.score}/25</p>
              </>
            )}
            {item.score === null && (
               <p className="text-[10px] mt-2 text-gray-400">Goal Effort (No Score)</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const overallSummaryCard = (
    <div className="h-full">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-green-500" />
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overall Summary</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: ShieldCheck, label: 'Emergency fund', value: `${stats.health?.metrics.emergencyMonths} Mo`, score: stats.health?.scores.emergency, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
          { icon: CreditCard, label: 'Debt Ratio', value: `${(stats.health?.metrics.debtRatio * 100).toFixed(1)}%`, score: stats.health?.scores.debt, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
          { icon: Activity, label: 'Investment', value: `${(stats.health?.metrics.investmentRatio * 100).toFixed(1)}%`, score: stats.health?.scores.investment, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
        ].map((item, idx) => (
          <div key={idx} className={`${item.bg} p-4 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${item.bg.replace('/20', '/40')} ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{loading ? '...' : item.value}</p>
              </div>
            </div>
            {item.score !== null && (
              <>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${item.color.replace('text-', 'bg-')}`} 
                    style={{ width: loading ? '0%' : `${(item.score / 25) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] mt-2 text-right font-medium text-gray-400">Score: {loading ? '--' : item.score}/25</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const cashflowCard = (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Cashflow Summary</h2>
        </div>
        <Link 
          href="/dashboard/monthly" 
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Detailed Monthly Report
          <TrendingUp className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Chart Table */}
        <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-green-600 uppercase tracking-wider">Income</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-red-600 uppercase tracking-wider">Expense</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-blue-600 uppercase tracking-wider">Savings</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-purple-600 uppercase tracking-wider">Goal Savings</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-cyan-600 uppercase tracking-wider">Investments</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-orange-600 uppercase tracking-wider">Debt Paid</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-blue-800 dark:text-blue-400 uppercase tracking-wider">Net Balance</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              {(stats.monthlyCashflow || []).map((m: any) => (
                <tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-2 font-medium">{m.month}</td>
                  <td className="px-4 py-2 text-right text-green-600 font-mono">{m.income > 0 ? m.income.toLocaleString() : '-'}</td>
                  <td className="px-4 py-2 text-right text-red-600 font-mono">{m.expense > 0 ? m.expense.toLocaleString() : '-'}</td>
                  <td className="px-4 py-2 text-right text-blue-600 font-mono">{m.saving > 0 ? m.saving.toLocaleString() : '-'}</td>
                  <td className="px-4 py-2 text-right text-purple-600 font-mono">{m.goalSaving > 0 ? m.goalSaving.toLocaleString() : '-'}</td>
                  <td className="px-4 py-2 text-right text-cyan-600 font-mono">{m.invest > 0 ? m.invest.toLocaleString() : '-'}</td>
                  <td className="px-4 py-2 text-right text-orange-600 font-mono">{m.debt > 0 ? m.debt.toLocaleString() : '-'}</td>
                  <td className={`px-4 py-2 text-right font-bold font-mono ${m.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {m.net !== 0 ? m.net.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-gray-500">
                    {m.records > 0 ? `${m.records}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Chart Visualization */}
        <div className="h-[400px] w-full bg-white dark:bg-gray-800 p-2 rounded-lg border dark:border-gray-700">
           <h3 className="text-center text-sm font-semibold mb-4 text-gray-500 uppercase">Monthly Cashflow Visualization</h3>
           <ResponsiveContainer width="100%" height="85%">
              <BarChart data={stats.monthlyCashflow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value.toLocaleString()}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => value.toLocaleString()}
                />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saving" name="Saving" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="internalLoan" name="Int Loan" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="debt" name="Debt" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Net" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const goalTrackingCard = (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Multi-Goal Tracking</h2>
      </div>
      
      {stats.goalTracking?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.goalTracking.map((goal: any) => (
            <div key={goal.id} className="p-4 border dark:border-gray-700 rounded-xl bg-gray-50/30 dark:bg-gray-800/50">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">{goal.name}</h3>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">GOAL</span>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Current Saved</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.currency}{goal.balance.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full transition-all duration-1000" style={{ width: '100%' }} />
              </div>
              <p className="text-[10px] mt-2 text-gray-400 italic font-medium text-center">Tracking balance from transactions</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed dark:border-gray-700 rounded-xl">
           <Info className="w-10 h-10 text-gray-300 mx-auto mb-2" />
           <p className="text-gray-500 dark:text-gray-400 text-sm">No active goals found. Create a Goal Account to start tracking.</p>
        </div>
      )}
    </div>
  );

  // ============================================
  // Grid Layout Configuration
  // ============================================

  const gridItems: GridItemConfig[] = [
    {
      key: 'welcome',
      content: welcomeCard,
      defaultLayout: {
        lg: { x: 0, y: 0, w: 8, h: 5, minW: 6, minH: 4 },
        md: { x: 0, y: 0, w: 10, h: 5 },
        sm: { x: 0, y: 0, w: 6, h: 7 },
      }
    },
    {
      key: 'health',
      content: healthCard,
      defaultLayout: {
        lg: { x: 8, y: 0, w: 4, h: 5, minW: 3, minH: 4 },
        md: { x: 0, y: 5, w: 10, h: 5 },
        sm: { x: 0, y: 7, w: 6, h: 5 },
      }
    },
    {
      key: 'monthly-metrics',
      content: monthlyMetricsCard,
      defaultLayout: {
        lg: { x: 0, y: 5, w: 6, h: 4, minW: 4, minH: 3 },
        md: { x: 0, y: 10, w: 5, h: 4 },
        sm: { x: 0, y: 12, w: 6, h: 5 },
      }
    },
    {
      key: 'overall-summary',
      content: overallSummaryCard,
      defaultLayout: {
        lg: { x: 6, y: 5, w: 6, h: 4, minW: 4, minH: 3 },
        md: { x: 5, y: 10, w: 5, h: 4 },
        sm: { x: 0, y: 17, w: 6, h: 5 },
      }
    },
    {
      key: 'cashflow',
      content: cashflowCard,
      defaultLayout: {
        lg: { x: 0, y: 9, w: 12, h: 13, minW: 6, minH: 8 },
        md: { x: 0, y: 14, w: 10, h: 13 },
        sm: { x: 0, y: 22, w: 6, h: 15 },
      }
    },
    {
      key: 'goals',
      content: goalTrackingCard,
      defaultLayout: {
        lg: { x: 0, y: 22, w: 12, h: 5, minW: 4, minH: 3 },
        md: { x: 0, y: 27, w: 10, h: 5 },
        sm: { x: 0, y: 37, w: 6, h: 6 },
      }
    },
  ];

  return (
    <div className="pb-12">
      <DashboardGrid items={gridItems} />
    </div>
  );
}
