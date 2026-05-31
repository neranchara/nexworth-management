'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useDashboardStore } from '@/store/dashboardStore';
import api from '@/lib/api';
import GlassCard from '@/components/ui/GlassCard';
import { clsx } from 'clsx';

// Optimized: Dynamic imports for heavy charts
const HealthRadar = dynamic(() => import('../financial-health/HealthRadar'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-emerald/20 border-t-emerald rounded-full animate-spin" /></div>
});

const VelocityChart = dynamic(() => import('../financial-velocity/VelocityChart'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-white/5 rounded-lg animate-pulse" />
});

const PortfolioDoughnut = dynamic(() => import('../asset-allocation/PortfolioDoughnut'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center"><div className="w-4 h-4 border-2 border-slate/20 border-t-slate rounded-full animate-spin" /></div>
});

const GlassModal = dynamic(() => import('@/components/ui/GlassModal'), { ssr: false });

import {
  TrendingUp,
  Activity,
  Target,
  Scan,
  Loader2,
  Plus,
  Wallet,
  CreditCard,
  PiggyBank,
  BarChart3,
  ShieldAlert,
  Ambulance,
  Settings2,
} from 'lucide-react';

import CashflowHealthWidget from './components/CashflowHealthWidget';
import LiquiditySettingsModal from './components/LiquiditySettingsModal';
import WidgetConfigDropdown from './components/WidgetConfigDropdown';
import KpiCard from './components/KpiCard';

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

export default function DashboardCockpit() {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');
  // const { user } = useAuthStore(); - Removed as unused
  const {
    stats,
    isLoading,
    fetchDashboardData,
    selectedYear,
    selectedMonth,
    setFilters,
    widgetConfig,
  } = useDashboardStore();

  const handleViewModeChange = (mode: 'annual' | 'monthly') => {
    setViewMode(mode);
    setFilters(selectedYear, new Date().getMonth());
  };

  // Transaction Form State
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState(''); // For transfers
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLiquidityModalOpen, setIsLiquidityModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Meta Data
  const [accounts, setAccounts] = useState<{ id: string; name: string; balance: number }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const fetchMeta = useCallback(async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/categories')
      ]);
      setAccounts(accRes.data.accounts || []);
      setCategories(catRes.data.categories || []);
      
      // Default selections
      if (accRes.data.accounts?.length > 0) setAccountId(accRes.data.accounts[0].id);
      if (accRes.data.categories?.length > 0) setCategoryId(accRes.data.categories[0].id);
    } catch (err) {
      console.error('Failed to fetch transaction meta:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(selectedYear, selectedMonth);
  }, [fetchDashboardData, selectedYear, selectedMonth]);


  const handleScanSlip = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      
      console.log(`[SlipScanner] Starting Scan for: ${file.name}`);
      
      let realAmount = null;
      let rawText = '';
      let qrPayload = null;

      // Safe Hook สำหรับระบบ Automate Test (Playwright E2E Sandbox)
      if (typeof window !== 'undefined' && (window as any).__playwrightMockOCR) {
        const mockRes = await (window as any).__playwrightMockOCR(file);
        realAmount = mockRes.amount;
        rawText = mockRes.text;
        qrPayload = mockRes.qrPayload;
      } else {
        const { scanAmountFromImage } = await import('../../utils/ocrScanner');
        const res = await scanAmountFromImage(file);
        realAmount = res.amount;
        rawText = res.text;
        const { scanQRFromImage } = await import('../../utils/qrScanner');
        qrPayload = await scanQRFromImage(file);
      }

      if (realAmount) {
        console.log('[SlipScanner] Real amount extracted via OCR:', realAmount);
        setAmount(realAmount);
        
        // Simple heuristic for Note: Use first line of text or bank name
        if (rawText.toLowerCase().includes('kbank') || rawText.includes('กสิกร')) setNote('Scan: KBank');
        else if (rawText.toLowerCase().includes('scb') || rawText.includes('ไทยพาณิชย์')) setNote('Scan: SCB');
        else setNote('Scan: Slip Data');
      }



      if (qrPayload) {
        console.log('[SlipScanner] QR found, payload length:', qrPayload.length);
        console.log('[SlipScanner] Sending verification request to: /ai/verify-slip');
        const verifyRes = await api.post('/ai/verify-slip', { payload: qrPayload });
        console.log('[SlipScanner] Verification success:', verifyRes.data.success);
        
        if (verifyRes.data.success && verifyRes.data.data) {
          const { receiverName, category } = verifyRes.data.data;
          // If we have a verified receiver, update the note
          setNote(`Verified: ${receiverName}`);
          
          if (category) {
            const matchedCat = categories.find(c => 
              c.name.toLowerCase().includes(category.toLowerCase()) || 
              category.toLowerCase().includes(c.name.toLowerCase())
            );
            if (matchedCat) setCategoryId(matchedCat.id);
          }
        }
      }
      
      if (!realAmount && !qrPayload) {
        throw new Error('Could not read amount from slip. Please try a clearer image.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to scan slip. Please fill in manually.';
      console.error('Slip scanning failed:', err);
      alert(errorMsg);
    } finally {
      setIsScanning(false);
    }
  }, [categories]);

  const handleSubmit = async () => {
    if (!amount || !accountId) {
      window.alert('โปรดระบุจำนวนเงินและเลือกบัญชี');
      return;
    }

    if (txType === 'TRANSFER' && !toAccountId) {
      window.alert('โปรดเลือกบัญชีปลายทาง');
      return;
    }

    if (txType !== 'TRANSFER' && !categoryId) {
      window.alert('โปรดเลือกหมวดหมู่รายการ');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/transactions', {
        type: txType,
        amount: parseFloat(amount),
        accountId: txType !== 'TRANSFER' ? accountId : undefined,
        fromAccountId: txType === 'TRANSFER' ? accountId : undefined,
        toAccountId: (txType === 'TRANSFER' && toAccountId) ? toAccountId : undefined,
        categoryId: txType !== 'TRANSFER' ? categoryId : undefined,
        note,
        date: new Date().toISOString()
      });

      // Reset & Refresh
      setIsTransactionModalOpen(false);
      setAmount('');
      setNote('');
      fetchDashboardData();
      
      // Explicit success indicator for E2E tests
      const successToast = document.createElement('div');
      successToast.id = 'tx-success-toast';
      successToast.className = 'fixed bottom-4 right-4 bg-emerald text-navy px-6 py-3 rounded-xl font-bold z-[200] animate-bounce';
      successToast.innerText = 'บันทึกรายการสำเร็จ';
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);
    } catch (err: unknown) {
      console.error('Transaction failed:', err);
      // Better error parsing to avoid [object Object]
      let displayMsg = 'Failed to save transaction';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string | object } } };
        const errorMsg = axiosErr.response?.data?.error;
        displayMsg = typeof errorMsg === 'object' 
          ? JSON.stringify(errorMsg, null, 2) 
          : (errorMsg || 'Failed to save transaction');
      }
        
      alert(displayMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex-1 flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-12 gap-5 flex-1">
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-5">
            <div className="h-40 bg-white/5 rounded-[1.25rem]" />
            <div className="h-24 bg-white/5 rounded-[1.25rem]" />
            <div className="flex-1 bg-white/5 rounded-[1.25rem]" />
          </div>
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-5">
            <div className="flex-1 bg-white/5 rounded-[1.25rem]" />
            <div className="h-28 bg-white/5 rounded-[1.25rem]" />
          </div>
        </div>
      </div>
    );
  }

  const netWorth = stats?.summary?.netWorth || 0;
  const assets = stats?.summary?.totalAssets || 0;
  const liabilities = stats?.summary?.totalLiabilities || 0;

  const savingRate    = stats?.summary?.savingRate    || 0;
  const investRatio   = stats?.summary?.investmentRatio || 0;
  const debtRatio     = stats?.summary?.debtRatio     || 0;
  const emergencyMos  = stats?.summary?.emergencyMonths || 0;

  const allocationData = (stats?.assetsByAccount || [])
    .map((acc) => ({ name: acc.name as string, value: acc.balance as number }))
    .sort((a, b) => b.value - a.value).slice(0, 5);

  const showRow3 = widgetConfig.velocity || widgetConfig.allocation;
  const bothRow3 = widgetConfig.velocity && widgetConfig.allocation;
  const showRow4 = widgetConfig.goals    || widgetConfig.radar;
  const bothRow4 = widgetConfig.goals    && widgetConfig.radar;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto gap-5 pr-1 custom-scrollbar">

      {/* ── Header ── */}
      <div className="flex items-center justify-between shrink-0 gap-4 flex-wrap">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold text-white tracking-tight">สรุปสถานะการเงิน</h2>
          <p className="text-[10px] text-slate tracking-[0.3em] uppercase font-bold">Wealth & Performance Metrics</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end w-full sm:w-auto sm:ml-auto">
          {/* Add Transaction */}
          <button
            data-testid="add-transaction-btn"
            onClick={() => { setIsTransactionModalOpen(true); void fetchMeta(); }}
            className="flex items-center gap-2 px-5 py-2 bg-emerald text-navy font-black text-xs uppercase tracking-widest rounded-full shadow-[0_0_16px_rgba(80,200,120,0.3)] hover:shadow-[0_0_24px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 transition-all active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus size={15} className="relative z-10" />
            <span className="relative z-10 hidden sm:inline">บันทึกรายการ</span>
          </button>

          <WidgetConfigDropdown />

          <CashflowHealthWidget
            remaining={(stats?.summary?.monthlyIncome || 0) - (stats?.summary?.monthlyExpense || 0)}
            status={stats?.summary?.cashflowStatus || 'WATCH'}
            onOpenSettings={() => setIsLiquidityModalOpen(true)}
            accounts={stats?.cashflowAccounts}
          />

          <select
            value={selectedYear}
            onChange={(e) => setFilters(Number(e.target.value), selectedMonth)}
            className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black text-emerald uppercase tracking-widest outline-none focus:border-emerald/50 cursor-pointer transition-all hover:bg-white/10"
          >
            {[0,1,2,3,4].map(offset => {
              const year = new Date().getFullYear() - offset;
              return <option key={year} value={year} className="bg-navy text-white">{year}</option>;
            })}
          </select>

          <div className="flex bg-white/5 border border-white/5 rounded-lg p-0.5">
            {(['annual','monthly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleViewModeChange(mode)}
                className={clsx(
                  'px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all',
                  viewMode === mode ? 'bg-emerald/20 text-emerald' : 'text-slate hover:text-white'
                )}
              >
                {mode === 'annual' ? 'ปีทั้งปี' : 'รายเดือน'}
              </button>
            ))}
          </div>

          {viewMode === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setFilters(selectedYear, Number(e.target.value))}
              className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black text-blue-400 uppercase tracking-widest outline-none focus:border-blue-400/50 cursor-pointer transition-all hover:bg-white/10"
            >
              {MONTHS_TH.map((m, i) => (
                <option key={i} value={i} className="bg-navy text-white">{m}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Row 1: Core Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 shrink-0">
        <GlassCard interactive borderAccent="emerald" className="p-5 flex flex-col justify-between gap-3 group cursor-pointer">
          <span className="text-[9px] font-black text-slate uppercase tracking-[0.2em]">Net Worth (สินทรัพย์สุทธิ)</span>
          <h3 className="text-3xl font-black text-white tracking-tighter">฿{netWorth.toLocaleString()}</h3>
          <div className="text-[10px] text-emerald font-bold flex items-center gap-1.5">
            <TrendingUp size={12} /><span>สินทรัพย์สุทธิ</span>
          </div>
        </GlassCard>

        <GlassCard interactive className="p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-slate uppercase tracking-widest">Total Assets</span>
            <Wallet size={14} className="text-emerald/50" />
          </div>
          <p className="text-3xl font-black text-white tracking-tighter">฿{assets.toLocaleString()}</p>
          <p className="text-[9px] text-slate font-bold">สินทรัพย์ทั้งหมด</p>
        </GlassCard>

        <GlassCard interactive className="p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-slate uppercase tracking-widest">Total Liabilities</span>
            <CreditCard size={14} className="text-rose/50" />
          </div>
          <p className="text-3xl font-black text-rose tracking-tighter">฿{liabilities.toLocaleString()}</p>
          <p className="text-[9px] text-slate font-bold">หนี้สินทั้งหมด</p>
        </GlassCard>
      </div>

      {/* ── Row 2: KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 shrink-0">
        <KpiCard
          label="Saving Rate"
          value={`${savingRate.toFixed(1)}%`}
          target="เป้า: ≥ 20%"
          status={savingRate >= 20 ? 'good' : savingRate >= 10 ? 'warning' : 'danger'}
          icon={<PiggyBank size={16} />}
        />
        <KpiCard
          label="Investment Rate"
          value={`${investRatio.toFixed(1)}%`}
          target="เป้า: ≥ 15%"
          status={investRatio >= 15 ? 'good' : investRatio >= 5 ? 'warning' : 'danger'}
          icon={<BarChart3 size={16} />}
        />
        <KpiCard
          label="Debt Ratio"
          value={`${debtRatio.toFixed(1)}%`}
          target="เป้า: ≤ 30%"
          status={debtRatio <= 30 ? 'good' : debtRatio <= 50 ? 'warning' : 'danger'}
          icon={<ShieldAlert size={16} />}
          higherIsBetter={false}
        />
        <KpiCard
          label="Emergency Fund"
          value={`${emergencyMos.toFixed(1)} เดือน`}
          target="เป้า: ≥ 6 เดือน"
          status={emergencyMos >= 6 ? 'good' : emergencyMos >= 3 ? 'warning' : 'danger'}
          icon={<Ambulance size={16} />}
        />
      </div>

      {/* ── Row 3: Velocity + Allocation ── */}
      {showRow3 && (
        <div className="grid grid-cols-12 gap-5 shrink-0">
          {widgetConfig.velocity && (
            <GlassCard
              interactive
              className={clsx('p-6 flex flex-col h-80', bothRow3 ? 'col-span-12 lg:col-span-8' : 'col-span-12')}
              data-testid="cockpit-velocity-card"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Performance Velocity</h3>
                  <p className="text-[9px] text-slate mt-0.5 uppercase tracking-tighter">Income vs Expense Tracking</p>
                </div>
                <div className="flex flex-wrap gap-3 justify-end">
                  <span className="text-[9px] font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald" /> INCOME</span>
                  <span className="text-[9px] font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/10" /> EXPENSE</span>
                  <span className="text-[9px] font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> SAVING</span>
                  <span className="text-[9px] font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" /> INVEST</span>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <VelocityChart data={stats?.monthlyCashflow || []} />
              </div>
            </GlassCard>
          )}

          {widgetConfig.allocation && (
            <GlassCard
              className={clsx('p-5 flex flex-col relative overflow-hidden group h-80', bothRow3 ? 'col-span-12 lg:col-span-4' : 'col-span-12')}
              data-testid="cockpit-allocation-card"
            >
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald/5 rounded-full blur-2xl group-hover:bg-emerald/10 transition-colors duration-500 pointer-events-none" />
              <div className="flex justify-between items-center mb-3 z-10 shrink-0">
                <h3 className="text-[10px] font-black text-slate uppercase tracking-widest">Asset Allocation</h3>
                <span className="text-[9px] text-emerald bg-emerald/10 px-2 py-0.5 rounded-full">Top 5</span>
              </div>
              <div className="flex-1 min-h-0 w-full relative z-10">
                {allocationData.length > 0
                  ? <PortfolioDoughnut data={allocationData} />
                  : <div className="w-full h-full flex items-center justify-center text-[10px] text-slate font-medium">No asset data available</div>
                }
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* ── Row 4: Goals + Radar ── */}
      {showRow4 && (
        <div className="grid grid-cols-12 gap-5 shrink-0">
          {widgetConfig.goals && (
            <GlassCard
              className={clsx('p-5 flex flex-col relative overflow-hidden group h-72', bothRow4 ? 'col-span-12 lg:col-span-8' : 'col-span-12')}
            >
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-400/5 rounded-full blur-2xl group-hover:bg-blue-400/10 transition-colors duration-500 pointer-events-none" />
              <div className="flex justify-between items-center mb-4 z-10 shrink-0">
                <h3 className="text-[10px] font-black text-slate uppercase tracking-widest">Financial Goals</h3>
                <Target size={14} className="text-blue-400" />
              </div>
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
                {(stats?.goalTracking || []).map((goal) => (
                  <div key={goal.id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white truncate max-w-[200px]">{goal.name}</span>
                      <span className="text-[10px] font-black text-blue-400">{Math.round(goal.percentage)}%</span>
                    </div>
                    <div className="w-full bg-navy/50 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)] transition-all duration-1000"
                        style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(stats?.goalTracking || []).length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                    <p className="text-[9px] text-slate font-bold uppercase">No active goals</p>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {widgetConfig.radar && (
            <GlassCard
              interactive
              className={clsx('p-5 flex flex-col items-center h-72', bothRow4 ? 'col-span-12 lg:col-span-4' : 'col-span-12')}
              data-testid="cockpit-radar-card"
            >
              <div className="w-full flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-[10px] font-black text-slate uppercase tracking-widest">Capital Health Radar</h3>
                <Activity size={14} className="text-emerald animate-pulse" />
              </div>
              <div className="relative w-full flex-1 min-h-0">
                <HealthRadar scores={stats?.health?.scores || { saving: 0, emergency: 0, debt: 0, investment: 0 }} />
              </div>
              <div className="w-full pt-3 border-t border-white/5 flex justify-between items-center shrink-0">
                <span className="text-[9px] font-bold text-slate uppercase">System Score</span>
                <span className="text-xl font-black text-emerald">{stats?.health?.score || 0}<span className="text-[10px] text-slate-500 ml-1">pts</span></span>
              </div>
            </GlassCard>
          )}
        </div>
      )}


      {/* Quick Add Transaction Modal */}
      <GlassModal 
        isOpen={isTransactionModalOpen} 
        onClose={() => setIsTransactionModalOpen(false)}
        title="บันทึกรายการใหม่"
      >
        <div className="flex flex-col gap-5">
          {/* AI Scan Header Action */}
          <div 
            data-testid="transactions-btn-scan-slip-modal"
            className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-emerald/40 transition-all cursor-pointer" 
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald/20 rounded-lg flex items-center justify-center text-emerald">
                {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Scan size={16} />}
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald uppercase tracking-widest">Smart Slip Scanner</p>
                <p className="text-[9px] text-slate font-medium">Auto-fill details from bank slip</p>
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScanSlip} disabled={isScanning} />
          </div>

          {/* Transaction Type Tabs */}
          <div className="flex bg-navy/50 p-1 rounded-xl">
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((type) => (
              <button 
                key={type}
                onClick={() => setTxType(type)}
                className={clsx(
                  "flex-1 py-2 text-[10px] font-black uppercase transition-all rounded-lg",
                  txType === type ? "bg-white/10 text-emerald shadow-sm" : "text-slate-400 hover:text-white"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">Amount (THB)</label>
            <input 
              type="number" 
              data-testid="transactions-amount-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" 
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-2xl font-black text-white outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/20 transition-all placeholder:text-slate/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Account Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">
                {txType === 'TRANSFER' ? 'From Account' : 'Account'}
              </label>
              <select 
                data-testid="transactions-account-select"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald/50 appearance-none font-bold cursor-pointer"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="bg-navy">{acc.name}</option>
                ))}
              </select>
            </div>
            
            {/* Category or To Account */}
            <div className="flex flex-col gap-2">
              {txType === 'TRANSFER' ? (
                <>
                  <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">To Account</label>
                  <select 
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald/50 appearance-none font-bold cursor-pointer"
                  >
                    <option value="" className="bg-navy">Select Target...</option>
                    {accounts.filter(acc => acc.id !== accountId).map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-navy">{acc.name}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">Category</label>
                  <select 
                    data-testid="transactions-category-select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald/50 appearance-none font-bold cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-navy">{cat.name}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Note Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">Note (Optional)</label>
            <input 
              type="text" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was this for?" 
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald/50 transition-all placeholder:text-slate/20"
            />
          </div>

          {/* Submit Button */}
          <button 
            data-testid="transactions-submit-btn"
            disabled={isSubmitting || isScanning}
            className="w-full bg-emerald text-navy font-black text-xs uppercase tracking-widest py-4 rounded-xl mt-2 hover:shadow-lg hover:shadow-emerald/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={handleSubmit}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'บันทึกข้อมูล'}
          </button>
        </div>
      </GlassModal>
      {/* Liquidity Settings Modal */}
      <LiquiditySettingsModal 
        isOpen={isLiquidityModalOpen}
        onClose={() => setIsLiquidityModalOpen(false)}
        initialDanger={stats?.summary?.liquidityDangerZone || 30000}
        initialSafe={stats?.summary?.liquiditySafeZone || 70000}
        onSaveSuccess={() => fetchDashboardData()}
      />
    </div>
  );
}
