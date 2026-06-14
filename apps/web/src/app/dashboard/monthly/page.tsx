'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { 
  Wallet, 
  ChevronLeft, ChevronRight, Calendar,
  CircleChevronLeft, CircleChevronRight,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';

interface MonthlyStat {
  month: number;
  income: number;
  expense: number;
  savings: number;
  goalSavings: number;
  invest: number;
  debt: number;
  net: number;
  count: number;
}

interface AnnualSummary {
  annualIncome: number;
  annualExpense: number;
  annualSaving: number;
  annualGoalSaving: number;
  annualInvest: number;
  annualDebt: number;
  annualNet: number;
}

interface BackendCashflow {
  income: number;
  expense: number;
  saving: number;
  goalSaving: number;
  invest: number;
  debt: number;
  net: number;
  records: number;
}



export default function MonthlySummaryPage() {
  const t = useTranslations('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [annualSummary, setAnnualSummary] = useState<AnnualSummary | null>(null);

  const fetchYearlyData = useCallback(async () => {
    try {
      setLoading(true);
      // Use the unified backend aggregation instead of client-side loops
      const res = await api.get(`/dashboard/stats?year=${selectedYear}`);
      const backendStats = res.data.monthlyCashflow || [];

      // Map backend fields to frontend table structure
      const stats = backendStats.map((m: BackendCashflow, idx: number) => ({
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
      setAnnualSummary(res.data.summary);
    } catch {
      console.error('Failed to load yearly data');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchYearlyData();
  }, [fetchYearlyData]);

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
         <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('accessDenied')}</h1>
         <p className="text-gray-600 dark:text-gray-400">{t('accessDeniedDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('subtitle', { year: selectedYear })}</p>
        </div>
        
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
          <button 
            onClick={prevYear}
            data-testid="monthly-summary-btn-year-prev"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <CircleChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 flex items-center gap-2 font-bold min-w-[100px] justify-center" data-testid="monthly-summary-text-year-display">
            <Calendar className="w-4 h-4 text-blue-500" />
            {selectedYear}
          </div>
          <button 
            onClick={nextYear}
            data-testid="monthly-summary-btn-year-next"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <CircleChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards (Annual Totals) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm" data-testid="monthly-summary-card-annual-income">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('summary.annualIncome')}</span>
            <div className="bg-green-100 p-1.5 rounded-lg"><TrendingUp className="w-4 h-4 text-green-600" /></div>
          </div>
          <p className="text-2xl font-bold text-green-600">฿{totalYearStats.income.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm" data-testid="monthly-summary-card-annual-expense">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('summary.annualExpense')}</span>
            <div className="bg-red-100 p-1.5 rounded-lg"><TrendingDown className="w-4 h-4 text-red-600" /></div>
          </div>
          <p className="text-2xl font-bold text-red-600">฿{totalYearStats.expense.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm" data-testid="monthly-summary-card-annual-savings">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('summary.annualSavings')}</span>
            <div className="bg-blue-100 p-1.5 rounded-lg"><Wallet className="w-4 h-4 text-blue-600" /></div>
          </div>
          <p className="text-2xl font-bold text-blue-600">฿{totalYearStats.savings.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm" data-testid="monthly-summary-card-annual-net">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('summary.annualNet')}</span>
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
           <h3 className="font-bold text-gray-900 dark:text-white">{t('table.title', { year: selectedYear })}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('table.month')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right text-green-600">{t('table.income')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right text-red-600">{t('table.expense')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right text-blue-600">{t('table.savings')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right text-purple-600">{t('table.goalSavings')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right text-cyan-600">{t('table.investments')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right text-orange-600">{t('table.debtPaid')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">{t('table.netBalance')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">{t('table.records')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                 <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">{t('loading')}</td>
                 </tr>
              ) : monthlyStats.map((s) => {
                const monthName = format(new Date(selectedYear, s.month, 1), 'MMMM');
                const isFuture = selectedYear === new Date().getFullYear() && s.month > new Date().getMonth();

                return (
                  <tr 
                    key={s.month} 
                    data-testid={`monthly-summary-list-row-${monthName.toLowerCase()}`}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isFuture ? 'opacity-40' : ''}`}
                  >
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
                      {s.count} {t('table.txs')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {annualSummary && (
              <tfoot className="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                    {t('table.totalAnnual')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-mono">
                    ฿{annualSummary.annualIncome.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-mono">
                    ฿{annualSummary.annualExpense.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-mono">
                    ฿{annualSummary.annualSaving.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-mono">
                    ฿{annualSummary.annualGoalSaving.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-cyan-600 font-mono">
                    ฿{annualSummary.annualInvest.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-mono">
                    ฿{annualSummary.annualDebt.toLocaleString()}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono ${annualSummary.annualNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ฿{annualSummary.annualNet.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-right text-gray-500">
                    -
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
