'use client';
import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { Plus, ArrowUpCircle, CheckCircle, AlertCircle, Wallet, ArrowDownCircle, MoreHorizontal, Search, FileText, CircleAlert, HandCoins, PenLine, Info, Eye, EyeOff, Users } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';
import { Account } from '@/types/models';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import GlassModal from '@/components/ui/GlassModal';

interface Loan {
  id: string;
  name: string;
  direction: 'BORROW' | 'LEND';
  borrowerName?: string | null;
  accountId: string;
  accountName: string;
  totalBorrowed: number;
  totalRepaid: number;
  balance: number;
  date: string;
  actualDate?: string;
  code?: string;
  latestRepaymentDate?: string;
  transactions?: any[];
}

type TabType = 'BORROW' | 'LEND';

export default function LoanTrackerPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('BORROW');
  const { hasPermission } = usePermissions();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLoanId, setCurrentLoanId] = useState<string | null>(null);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const [newLoanForm, setNewLoanForm] = useState({ name: '', borrowerName: '', accountId: '', initialAmount: '', actualDate: '' });
  const [repayForm, setRepayForm] = useState({ amount: '', type: 'REPAY' as 'REPAY' | 'BORROW', note: '', actualDate: '', accountId: '' });

  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showAlert = (message: string, type: 'success' | 'error') => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlert({ message, type });
    alertTimeoutRef.current = setTimeout(() => setAlert(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [loansRes, accRes] = await Promise.all([
        api.get('/loans'),
        api.get('/accounts')
      ]);
      setLoans(loansRes.data.loans || []);
      setAccounts(accRes.data.accounts || []);
    } catch {
      showAlert('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabLoans = loans.filter(l => l.direction === activeTab);

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newLoanForm.name,
        accountId: newLoanForm.accountId,
        initialAmount: parseFloat(newLoanForm.initialAmount),
        direction: isEditing ? undefined : activeTab,
        borrowerName: newLoanForm.borrowerName || undefined,
        actualDate: newLoanForm.actualDate ? new Date(newLoanForm.actualDate).toISOString() : undefined
      };

      if (isEditing && currentLoanId) {
        await api.put(`/loans/${currentLoanId}`, payload);
        showAlert('อัพเดทรายการสำเร็จ', 'success');
      } else {
        await api.post('/loans', payload);
        showAlert('สร้างรายการสำเร็จ', 'success');
      }

      setShowNewLoanModal(false);
      setNewLoanForm({ name: '', borrowerName: '', accountId: '', initialAmount: '', actualDate: '' });
      setIsEditing(false);
      setCurrentLoanId(null);
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      showAlert(e.response?.data?.error || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const openEditModal = (loan: Loan) => {
    setNewLoanForm({
      name: loan.name,
      borrowerName: loan.borrowerName || '',
      accountId: loan.accountId,
      initialAmount: loan.totalBorrowed.toString(),
      actualDate: loan.actualDate ? format(new Date(loan.actualDate), 'yyyy-MM-dd') : ''
    });
    setIsEditing(true);
    setCurrentLoanId(loan.id);
    setShowNewLoanModal(true);
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    try {
      await api.post(`/loans/${selectedLoan.id}/transactions`, {
        type: repayForm.type,
        amount: parseFloat(repayForm.amount),
        note: repayForm.note,
        accountId: repayForm.accountId,
        actualDate: repayForm.actualDate ? new Date(repayForm.actualDate).toISOString() : undefined
      });
      setShowRepayModal(false);
      setRepayForm({ amount: '', type: 'REPAY', note: '', actualDate: '', accountId: '' });
      setSelectedLoan(null);
      showAlert('บันทึกรายการสำเร็จ', 'success');
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      showAlert(e.response?.data?.error || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortedLoans = () => {
    if (!sortConfig) return tabLoans;
    return [...tabLoans].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortConfig.key) {
        case 'date':
          aVal = a.actualDate ? new Date(a.actualDate).getTime() : new Date(a.date).getTime();
          bVal = b.actualDate ? new Date(b.actualDate).getTime() : new Date(b.date).getTime();
          break;
        case 'description': aVal = (a.name || '').toLowerCase();         bVal = (b.name || '').toLowerCase();         break;
        case 'borrower':    aVal = (a.borrowerName || '').toLowerCase(); bVal = (b.borrowerName || '').toLowerCase(); break;
        case 'account':     aVal = (a.accountName || '').toLowerCase();  bVal = (b.accountName || '').toLowerCase();  break;
        case 'borrowed':    aVal = a.totalBorrowed; bVal = b.totalBorrowed; break;
        case 'repaid':      aVal = a.totalRepaid;   bVal = b.totalRepaid;   break;
        case 'balance':     aVal = a.balance;        bVal = b.balance;       break;
        default: return 0;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const displayLoans = getSortedLoans().filter(loan => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      loan.name.toLowerCase().includes(q) ||
      loan.accountName.toLowerCase().includes(q) ||
      (loan.borrowerName || '').toLowerCase().includes(q) ||
      (loan.code || '').toLowerCase().includes(q);
    const isPending = loan.balance > 0;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && isPending) ||
      (statusFilter === 'settled' && !isPending);
    return matchesSearch && matchesStatus;
  });

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <MoreHorizontal className="w-3 h-3 ml-1 opacity-20" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUpCircle className="w-3 h-3 ml-1 text-blue-500" />
      : <ArrowDownCircle className="w-3 h-3 ml-1 text-blue-500" />;
  };

  if (isLoading) return <div className="p-8">Loading Loan Tracker...</div>;

  const totalLent   = tabLoans.reduce((s, l) => s + l.totalBorrowed, 0);
  const totalRepaid = tabLoans.reduce((s, l) => s + l.totalRepaid, 0);
  const remaining   = totalLent - totalRepaid;
  const repayPct    = totalLent > 0 ? Math.round((totalRepaid / totalLent) * 100) : 0;
  const isLend      = activeTab === 'LEND';
  const pendingLendCount = loans.filter(l => l.direction === 'LEND' && l.balance > 0).length;

  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const r = 36, c = 2 * Math.PI * r;
    return (
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} className="stroke-white/5" strokeWidth="8" fill="none" />
          <circle cx="50" cy="50" r={r} className="stroke-emerald transition-all duration-1000 ease-in-out" strokeWidth="8" fill="none"
            strokeDasharray={c} strokeDashoffset={c - (percentage / 100) * c} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-emerald">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden w-full space-y-4">
      {alert && (
        <div className={`fixed top-4 right-4 z-[200] max-w-[400px] w-full p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
          alert.type === 'success' ? 'bg-emerald/10 border-emerald/20 text-emerald' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-bold text-sm">{alert.message}</p>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-baseline gap-2">
            Loan Tracker
            <span className="text-slate-400 text-sm font-normal">
              {isLend ? 'ลูกหนี้ / เงินให้ยืม' : 'สรุปสถานะการยืม (ภายใน)'}
            </span>
          </h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest -mt-1">
            {isLend ? 'Lending Management & Receivables' : 'Lending Management & Monitoring'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden md:block text-[10px] text-slate-500 italic mr-2">ต้องการบันทึกการยืมเงินเพิ่ม?</p>
          <Link href="/dashboard/transactions" className="bg-emerald text-navy px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95">
            <Plus className="w-4 h-4" /> ไปหน้าธุรกรรม
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 shrink-0 bg-white/[0.03] border border-white/5 rounded-xl p-1 w-fit">
        <button
          onClick={() => { setActiveTab('BORROW'); setSearchQuery(''); setStatusFilter('pending'); }}
          className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'BORROW'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-slate-500 hover:text-white'
          }`}
        >
          ยืมภายใน
        </button>
        <button
          onClick={() => { setActiveTab('LEND'); setSearchQuery(''); setStatusFilter('pending'); }}
          className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'LEND'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-500 hover:text-white'
          }`}
        >
          <Users size={12} /> ลูกหนี้
          {pendingLendCount > 0 && (
            <span className="bg-blue-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
              {pendingLendCount}
            </span>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-12 gap-4 shrink-0">
        <GlassCard className={`col-span-12 lg:col-span-3 p-5 border-l-4 ${isLend ? 'border-blue-400' : 'border-orange-500'} flex flex-col justify-between h-32 hover:bg-white/[0.02] transition-colors`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isLend ? 'ยอดให้ยืมทั้งหมด' : 'ยอดขอยืมทั้งหมด'}
          </span>
          <h3 className="text-3xl font-bold text-white">฿{totalLent.toLocaleString()}</h3>
          <p className="text-[9px] text-orange-500 font-bold uppercase flex items-center gap-1">
            <CircleAlert size={10} /> Pending Dues
          </p>
        </GlassCard>
        <GlassCard className="col-span-12 lg:col-span-3 p-5 border-l-4 border-emerald flex flex-col justify-between h-32 hover:bg-white/[0.02] transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isLend ? 'รับคืนแล้ว' : 'คืนแล้ว (Settled)'}
          </span>
          <h3 className="text-3xl font-bold text-emerald">฿{totalRepaid.toLocaleString()}</h3>
          <p className="text-[9px] text-slate-400 uppercase">Fully Repaid: {tabLoans.filter(l => l.balance <= 0).length} Records</p>
        </GlassCard>
        <GlassCard className="col-span-12 lg:col-span-3 p-5 border-l-4 border-blue-400 flex flex-col justify-between h-32 hover:bg-white/[0.02] transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">คงเหลือสุทธิ</span>
          <h3 className="text-3xl font-bold text-white">฿{remaining.toLocaleString()}</h3>
          <div className="w-full bg-navy border border-white/5 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-blue-400 h-full transition-all duration-1000" style={{ width: `${totalLent > 0 ? (remaining / totalLent) * 100 : 0}%` }} />
          </div>
        </GlassCard>
        <GlassCard className="col-span-12 lg:col-span-3 p-4 flex items-center justify-center gap-6 h-32 bg-emerald/5 border border-emerald/10 hover:bg-emerald/10 transition-colors">
          <CircularProgress percentage={repayPct} />
          <div className="flex flex-col text-left">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Overall</span>
            <span className="text-[10px] text-emerald uppercase font-bold tracking-widest">
              {isLend ? 'Collection Progress' : 'Repayment Progress'}
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Table */}
      <GlassCard className="flex-1 flex flex-col overflow-hidden bg-navy/40">
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
              <input
                type="text"
                placeholder={isLend ? 'ค้นหาชื่อผู้ยืม หรือรายการ...' : 'ค้นหาชื่อบัญชีหรือรายการ...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-navy/50 border border-white/5 rounded-full py-1.5 pl-9 pr-4 text-[10px] text-white focus:outline-none focus:border-emerald placeholder:text-slate-500 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'pending' | 'settled')}
              className="bg-navy/80 border border-white/5 rounded-lg py-1.5 px-3 text-[10px] text-slate-300 outline-none focus:border-emerald appearance-none cursor-pointer"
            >
              <option value="pending" className="bg-[#001F3F]">สถานะ: ค้างชำระ</option>
              <option value="all" className="bg-[#001F3F]">สถานะ: ทั้งหมด</option>
              <option value="settled" className="bg-[#001F3F]">สถานะ: ชำระครบแล้ว</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            {statusFilter === 'pending' && (
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <EyeOff size={10} /> ซ่อน {tabLoans.filter(l => l.balance <= 0).length} รายการที่ชำระครบแล้ว
              </span>
            )}
            {isLend && hasPermission('loan-tracker', 'canCreate') && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setCurrentLoanId(null);
                  setNewLoanForm({ name: '', borrowerName: '', accountId: '', initialAmount: '', actualDate: '' });
                  setShowNewLoanModal(true);
                }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
              >
                <Plus size={12} /> เพิ่มลูกหนี้
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-0 custom-scrollbar relative">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2">
            <thead className="sticky top-0 z-[60]">
              <tr>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229] rounded-l-lg" onClick={() => handleSort('code')}>REF <SortIcon column="code" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('date')}>DATE <SortIcon column="date" /></th>
                {isLend && (
                  <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('borrower')}>ผู้ยืม <SortIcon column="borrower" /></th>
                )}
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('description')}>DESCRIPTION <SortIcon column="description" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('account')}>ACCOUNT <SortIcon column="account" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] text-right cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('borrowed')}>{isLend ? 'ให้ยืม' : 'BORROWED'} <SortIcon column="borrowed" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] text-right cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('repaid')}>{isLend ? 'รับคืน' : 'REPAID'} <SortIcon column="repaid" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] text-right cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('balance')}>BALANCE <SortIcon column="balance" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] text-center shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229] rounded-r-lg">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayLoans.map(loan => {
                const isPending = loan.balance > 0;
                return (
                  <tr key={loan.id} className={`transition-all group ${isPending ? `bg-white/[0.02] hover:bg-white/[0.06] ${isLend ? 'border-blue-400' : 'border-orange-500'}` : 'opacity-35 pointer-events-none select-none border-white/5'} border-l-4`}>
                    <td className={`px-6 py-4 rounded-l-xl font-bold ${isPending ? (isLend ? 'text-blue-400' : 'text-orange-500') : 'text-slate-500'}`}>
                      {loan.code || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {format(new Date(loan.actualDate || loan.date), 'dd/MM/yyyy')}
                    </td>
                    {isLend && (
                      <td className="px-6 py-4 font-bold text-blue-300 text-sm">
                        {loan.borrowerName || <span className="text-slate-600 text-xs italic">ไม่ระบุ</span>}
                      </td>
                    )}
                    <td className="px-6 py-4 font-medium text-white text-sm">{loan.name}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText size={12} className="opacity-50" />
                        {loan.accountName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white text-sm">
                      {loan.totalBorrowed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald text-sm">
                      {loan.totalRepaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold text-sm ${isPending ? (isLend ? 'text-blue-400' : 'text-orange-500') : 'text-slate-500'}`}>
                      {loan.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 rounded-r-xl">
                      <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasPermission('loan-tracker', 'canUpdate') && (
                          <>
                            {isPending && (
                              <button
                                onClick={() => { setSelectedLoan(loan); setShowRepayModal(true); setRepayForm({ ...repayForm, type: 'REPAY' }); }}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isLend ? 'bg-blue-500 text-white hover:shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-emerald text-navy hover:shadow-[0_0_10px_rgba(80,200,120,0.4)]'}`}
                              >
                                {isLend ? 'รับคืน' : 'คืนเงิน'}
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(loan)}
                              className="px-2 py-1.5 rounded-lg text-[10px] bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
                            >
                              <PenLine size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {displayLoans.length === 0 && (
                <tr>
                  <td colSpan={isLend ? 9 : 8} className="px-6 py-10 text-center text-slate-400">
                    {isLend ? 'ยังไม่มีรายการลูกหนี้' : 'ไม่มีข้อมูลการยืม'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Create / Edit Modal */}
      <GlassModal
        isOpen={showNewLoanModal}
        onClose={() => { setShowNewLoanModal(false); setIsEditing(false); }}
        title={isEditing ? 'แก้ไขรายการ' : (isLend ? 'เพิ่มลูกหนี้ใหม่' : 'สร้างรายการยืมใหม่')}
      >
        <form onSubmit={handleCreateLoan} className="flex flex-col gap-4">
          {!isEditing && (
            <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg flex items-start gap-2 text-orange-400 text-xs mb-2">
              <Info size={14} className="shrink-0 mt-0.5" />
              <p>การสร้างรายการควรสร้างจากหน้า Transaction เพื่อให้ระบบบัญชีครบถ้วน หน้านี้เหมาะสำหรับยอดยกมาเท่านั้น</p>
            </div>
          )}

          {(isLend || (isEditing && selectedLoan?.direction === 'LEND')) && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">ชื่อผู้ยืม</label>
              <input
                type="text"
                className="w-full bg-navy/50 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-400 placeholder:text-slate-600 transition-all"
                value={newLoanForm.borrowerName}
                onChange={e => setNewLoanForm({ ...newLoanForm, borrowerName: e.target.value })}
                placeholder="เช่น มด, พี่สมชาย, น้อง"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รายละเอียด / วัตถุประสงค์</label>
            <input
              required type="text"
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald placeholder:text-slate-600 transition-all"
              value={newLoanForm.name}
              onChange={e => setNewLoanForm({ ...newLoanForm, name: e.target.value })}
              placeholder={isLend ? 'เช่น ค่าเทอม, สร้างบ้าน' : 'เช่น ทำบ้าน, จ่ายภาษี'}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">บัญชีต้นทาง</label>
            <select
              required
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald appearance-none transition-all"
              value={newLoanForm.accountId}
              onChange={e => setNewLoanForm({ ...newLoanForm, accountId: e.target.value })}
            >
              <option value="" className="bg-[#001F3F]">เลือกบัญชี...</option>
              {accounts.map(a => <option key={a.id} value={a.id} className="bg-[#001F3F]">{a.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                จำนวนเงิน {isEditing && <span className="text-[8px] text-orange-400">(ไม่สามารถแก้ได้)</span>}
              </label>
              <input
                required type="number" step="0.01"
                className={`w-full bg-navy/50 border rounded-xl px-4 py-3 text-sm font-bold text-white outline-none transition-all ${isEditing ? 'border-white/5 opacity-50 cursor-not-allowed' : 'border-emerald/30 focus:border-emerald'}`}
                disabled={isEditing}
                value={newLoanForm.initialAmount}
                onChange={e => setNewLoanForm({ ...newLoanForm, initialAmount: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-emerald uppercase tracking-widest">วันที่จริง</label>
              <input
                type="date"
                className="w-full bg-navy/50 border border-emerald/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all [color-scheme:dark]"
                value={newLoanForm.actualDate}
                onChange={e => setNewLoanForm({ ...newLoanForm, actualDate: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-emerald text-navy font-black text-sm uppercase tracking-wider py-4 rounded-xl mt-4 hover:shadow-[0_0_15px_rgba(80,200,120,0.3)] transition-all active:scale-[0.98]">
            บันทึกรายการ
          </button>
        </form>
      </GlassModal>

      {/* Repay / Receive Modal */}
      <GlassModal
        isOpen={showRepayModal && selectedLoan !== null}
        onClose={() => { setShowRepayModal(false); setSelectedLoan(null); }}
        title={isLend ? 'บันทึกการรับเงินคืน' : 'รายการคืนเงิน (Repay)'}
      >
        <div className="mb-4 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">สำหรับรายการ</span>
          <span className="text-sm font-bold text-white">
            {selectedLoan?.borrowerName && <span className="text-blue-400">{selectedLoan.borrowerName} — </span>}
            {selectedLoan?.name}
            <span className="text-emerald text-xs ml-1">({selectedLoan?.accountName})</span>
          </span>
        </div>
        <form onSubmit={handleTransaction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
              <span>จำนวนเงิน</span>
              <span className="text-orange-400">ยอดคงเหลือ: ฿{selectedLoan?.balance.toLocaleString()}</span>
            </label>
            <input
              required type="number" step="0.01"
              className="w-full bg-navy/50 border border-emerald/30 rounded-xl px-4 py-3 text-2xl font-bold text-white outline-none focus:border-emerald transition-all"
              value={repayForm.amount}
              onChange={e => setRepayForm({ ...repayForm, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {isLend ? 'รับเข้าบัญชีไหน' : 'จ่ายจากบัญชีไหน'}
            </label>
            <select
              required
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald appearance-none transition-all"
              value={repayForm.accountId}
              onChange={e => setRepayForm({ ...repayForm, accountId: e.target.value })}
            >
              <option value="" className="bg-[#001F3F]">เลือกบัญชี...</option>
              {accounts.map(a => <option key={a.id} value={a.id} className="bg-[#001F3F]">{a.name} (฿{a.balance?.toLocaleString() || 0})</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-emerald uppercase tracking-widest">วันที่จริง</label>
            <input
              type="date"
              className="w-full bg-navy/50 border border-emerald/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all [color-scheme:dark]"
              value={repayForm.actualDate}
              onChange={e => setRepayForm({ ...repayForm, actualDate: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">หมายเหตุ</label>
            <input
              type="text"
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all placeholder:text-slate-600"
              value={repayForm.note}
              onChange={e => setRepayForm({ ...repayForm, note: e.target.value })}
              placeholder={isLend ? 'คำอธิบายการรับเงินคืน' : 'คำอธิบายการคืนเงิน'}
            />
          </div>
          <button type="submit" className="w-full bg-emerald text-navy font-black text-sm uppercase tracking-wider py-4 rounded-xl mt-4 hover:shadow-[0_0_15px_rgba(80,200,120,0.3)] transition-all active:scale-[0.98]">
            {isLend ? 'บันทึกการรับเงินคืน' : 'บันทึกการชำระ'}
          </button>
        </form>
      </GlassModal>
    </div>
  );
}
