'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  ArrowUpCircle, ArrowDownCircle, Wallet, 
  ChevronLeft, ChevronRight, Calendar,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { format, setYear, getMonth, startOfYear, endOfYear } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';

export default function MonthlySummaryPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);

  const fetchYearlyData = async () => {
    try {
      setLoading(true);
      // Use the unified backend aggregation instead of client-side loops
      const res = await api.get(`/dashboard/stats?year=${selectedYear}`);
      const backendStats = res.data.monthlyCashflow || [];

      // Map backend fields to frontend table structure
      const stats = backendStats.map((m: any, idx: number) => ({
        month: idx,
        income: m.income || 0,
        expense: m.expense || 0,
        savings: m.saving || 0,
        goalSavings: m.goalSaving || 0,
        invest: m.invest || 0,
        debt: m.debt || 0,
        net: m.net || 0,
        count: m.records || 0
      }));

      setMonthlyStats(stats);
    } catch (err) {
      console.error('Failed to load yearly summary from backend', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYearlyData();
  }, [selectedYear]);

  const nextYear = () => setSelectedYear(prev => prev + 1);
  const prevYear = () => setSelectedYear(prev => prev - 1);

  // Totals for the cards
  const totalYearStats = monthlyStats.reduce((acc, curr) => ({
    income: acc.income + curr.income,
    expense: acc.expense + curr.expense,
    savings: acc.savings + curr.savings,
    goalSavings: (acc.goalSavings || 0) + (curr.goalSavings || 0),
    invest: (acc.invest || 0) + (curr.invest || 0),
    debt: (acc.debt || 0) + (curr.debt || 0),
    net: acc.net + curr.net
  }), { income: 0, expense: 0, savings: 0, goalSavings: 0, invest: 0, debt: 0, net: 0 });
  
  if (!hasPermission('monthly', 'canView')) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
         <Calendar className="w-12 h-12 text-red-500 mx-auto mb-4" />
         <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
         <p className="text-gray-600 dark:text-gray-400">You do not have permission to view the monthly summary.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Summary (Aggregated)</h1>
          <p className="text-gray-500 dark:text-gray-400">High-level financial performance by month for {selectedYear}.</p>
        </div>
        
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
          <button 
            onClick={prevYear}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 flex items-center gap-2 font-bold min-w-[100px] justify-center">
            <Calendar className="w-4 h-4 text-blue-500" />
            {selectedYear}
          </div>
          <button 
            onClick={nextYear}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards (Annual Totals) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Annual Income</span>
            <div className="bg-green-100 p-1.5 rounded-lg"><TrendingUp className="w-4 h-4 text-green-600" /></div>
          </div>
          <p className="text-2xl font-bold text-green-600">฿{totalYearStats.income.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Annual Expense</span>
            <div className="bg-red-100 p-1.5 rounded-lg"><TrendingDown className="w-4 h-4 text-red-600" /></div>
          </div>
          <p className="text-2xl font-bold text-red-600">฿{totalYearStats.expense.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Annual Savings</span>
            <div className="bg-blue-100 p-1.5 rounded-lg"><Wallet className="w-4 h-4 text-blue-600" /></div>
          </div>
          <p className="text-2xl font-bold text-blue-600">฿{totalYearStats.savings.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Annual Net</span>
            <div className={`p-1.5 rounded-lg ${totalYearStats.net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <Minus className={`w-4 h-4 ${totalYearStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${totalYearStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ฿{totalYearStats.net.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
           <h3 className="font-bold text-gray-900 dark:text-white">Monthly Breakdown ({selectedYear})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right text-green-600">Income</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right text-red-600">Expense</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right text-blue-600">Savings</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right text-purple-600">Goal Savings</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right text-cyan-600">Investments</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right text-orange-600">Debt Paid</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Net Balance</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                 <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Loading yearly summary...</td>
                 </tr>
              ) : monthlyStats.map((s) => {
                const monthName = format(new Date(selectedYear, s.month, 1), 'MMMM');
                const isFuture = selectedYear === new Date().getFullYear() && s.month > new Date().getMonth();

                return (
                  <tr key={s.month} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isFuture ? 'opacity-40' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                      {monthName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium font-mono">
                      ฿{s.income.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium font-mono">
                      ฿{s.expense.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium font-mono">
                      ฿{s.savings.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-medium font-mono">
                      ฿{s.goalSavings.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-cyan-600 font-medium font-mono">
                      ฿{s.invest.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium font-mono">
                      ฿{s.debt.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold font-mono ${s.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ฿{s.net.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-right text-gray-500">
                      {s.count} txs
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
