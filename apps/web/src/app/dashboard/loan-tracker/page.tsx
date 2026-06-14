'use client';
import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { Plus, ArrowUpCircle, CheckCircle, AlertCircle, Wallet, ArrowDownCircle, MoreHorizontal, Search, FileText, CircleAlert, HandCoins, PenLine, Info, Eye, EyeOff } from 'lucide-react';
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


export default function LoanTrackerPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const { hasPermission } = usePermissions();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLoanId, setCurrentLoanId] = useState<string | null>(null);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [newLoanForm, setNewLoanForm] = useState({ name: '', accountId: '', initialAmount: '', actualDate: '' });
  const [repayForm, setRepayForm] = useState({ amount: '', type: 'REPAY' as 'REPAY' | 'BORROW', note: '', actualDate: '', accountId: '' });

  // Alert state
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
      console.error('Failed to load data');
      showAlert('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newLoanForm.name,
        accountId: newLoanForm.accountId,
        initialAmount: parseFloat(newLoanForm.initialAmount),
        actualDate: newLoanForm.actualDate ? new Date(newLoanForm.actualDate).toISOString() : undefined
      };

      if (isEditing && currentLoanId) {
        await api.put(`/loans/${currentLoanId}`, payload);
        showAlert('อัพเดทรายการยืมเงินสำเร็จ', 'success');
      } else {
        await api.post('/loans', payload);
        showAlert('สร้างรายการยืมเงินสำเร็จ', 'success');
      }
      
      setShowNewLoanModal(false);
      setNewLoanForm({ name: '', accountId: '', initialAmount: '', actualDate: '' });
      setIsEditing(false);
      setCurrentLoanId(null);
      fetchData();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      showAlert(errorResponse.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกรายการ', 'error');
    }
  };

  const openEditModal = (loan: Loan) => {
    setNewLoanForm({
      name: loan.name,
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
      const errorResponse = err as { response?: { data?: { error?: string } } };
      showAlert(errorResponse.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกรายการ', 'error');
    }
  };

  const getFlattenedLots = () => {
    const allBorrows: any[] = [];
    
    // First, collect all borrows across all loans
    loans.forEach(loan => {
      let remainingRepayment = loan.totalRepaid;
      
      const borrows = (loan.transactions || [])
        .filter((tx: any) => {
          const behavior = tx.type?.behavior || tx.category?.type?.behavior;
          return behavior === 'LOAN_BORROW';
        })
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
      borrows.forEach((tx: any) => {
        const amount = tx.amount;
        const repaidForThisLot = Math.min(amount, remainingRepayment);
        remainingRepayment -= repaidForThisLot;
        
        allBorrows.push({
          id: tx.id,
          loanId: loan.id,
          name: loan.name,
          accountId: loan.accountId,
          accountName: loan.accountName,
          borrowed: amount,
          repaid: repaidForThisLot,
          balance: amount - repaidForThisLot,
          date: tx.date,
          actualDate: tx.actualDate,
          fullLoan: loan
        });
      });
    });

    // Sort all borrows globally by date to assign sequential codes
    allBorrows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return allBorrows.map((lot, index) => ({
      ...lot,
      displayCode: `L${String(index + 1).padStart(3, '0')}`
    }));
  };

  const flattenedLots = getFlattenedLots();

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedLots = () => {
    if (!sortConfig) return flattenedLots;

    return [...flattenedLots].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'date':
          aValue = a.actualDate ? new Date(a.actualDate).getTime() : new Date(a.date).getTime();
          bValue = b.actualDate ? new Date(b.actualDate).getTime() : new Date(b.date).getTime();
          break;
        case 'description':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'account':
          aValue = (a.accountName || '').toLowerCase();
          bValue = (b.accountName || '').toLowerCase();
          break;
        case 'borrowed':
          aValue = a.borrowed;
          bValue = b.borrowed;
          break;
        case 'repaid':
          aValue = a.repaid;
          bValue = b.repaid;
          break;
        case 'balance':
          aValue = a.balance;
          bValue = b.balance;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedLots = getSortedLots();

  const displayLoans = loans.filter(loan => {
    const matchesSearch = !searchQuery ||
      loan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loan.code || '').toLowerCase().includes(searchQuery.toLowerCase());

    const isPending = loan.balance > 0;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && isPending) ||
      (statusFilter === 'settled' && !isPending);

    return matchesSearch && matchesStatus;
  });

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <MoreHorizontal className="w-3 h-3 ml-1 opacity-20" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUpCircle className="w-3 h-3 ml-1 text-blue-500" /> : 
      <ArrowDownCircle className="w-3 h-3 ml-1 text-blue-500" />;
  };

  if (isLoading) return <div className="p-8">Loading Loan Tracker...</div>;

  const totalBorrowed = loans.reduce((acc, l) => acc + l.totalBorrowed, 0);
  const totalRepaid = loans.reduce((acc, l) => acc + l.totalRepaid, 0);
  const remainingDebt = totalBorrowed - totalRepaid;
  const repaymentPercentage = totalBorrowed > 0 ? Math.round((totalRepaid / totalBorrowed) * 100) : 0;

  // Simple SVG Donut Chart
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return (
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} className="stroke-white/5" strokeWidth="8" fill="none" />
          <circle 
            cx="50" cy="50" r={radius} 
            className="stroke-emerald transition-all duration-1000 ease-in-out" 
            strokeWidth="8" fill="none" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-emerald">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden w-full space-y-4">
      {/* Alert Pop-up */}
      {alert && (
        <div className={`fixed top-4 right-4 z-[200] max-w-[400px] w-full p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
          alert.type === 'success' ? 'bg-emerald/10 border-emerald/20 text-emerald' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-bold text-sm">{alert.message}</p>
        </div>
      )}

      {/* Header Section (Navigation Focus) */}
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-baseline gap-2">
            Loan Tracker <span className="text-slate-400 text-sm font-normal">สรุปสถานะการยืม (ภายใน)</span>
          </h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest -mt-1">Lending Management & Monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden md:block text-[10px] text-slate-500 italic mr-2">ต้องการบันทึกการยืมเงินเพิ่ม?</p>
          <Link href="/dashboard/transactions" className="bg-emerald text-navy px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95">
            <Plus className="w-4 h-4" /> ไปหน้าธุรกรรม
          </Link>
        </div>
      </header>

      {/* Summary Area */}
      <div className="grid grid-cols-12 gap-4 shrink-0">
        <GlassCard className="col-span-12 lg:col-span-3 p-5 border-l-4 border-orange-500 flex flex-col justify-between h-32 hover:bg-white/[0.02] transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ยอดขอยืมทั้งหมด</span>
          <h3 className="text-3xl font-bold text-white">฿{totalBorrowed.toLocaleString()}</h3>
          <p className="text-[9px] text-orange-500 font-bold uppercase flex items-center gap-1">
            <CircleAlert size={10} /> Pending Dues
          </p>
        </GlassCard>
        <GlassCard className="col-span-12 lg:col-span-3 p-5 border-l-4 border-emerald flex flex-col justify-between h-32 hover:bg-white/[0.02] transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">คืนแล้ว (Settled)</span>
          <h3 className="text-3xl font-bold text-emerald">฿{totalRepaid.toLocaleString()}</h3>
          <p className="text-[9px] text-slate-400 uppercase">Fully Repaid: {loans.filter(l => l.balance <= 0).length} Records</p>
        </GlassCard>
        <GlassCard className="col-span-12 lg:col-span-3 p-5 border-l-4 border-blue-400 flex flex-col justify-between h-32 hover:bg-white/[0.02] transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">คงเหลือสุทธิ</span>
          <h3 className="text-3xl font-bold text-white">฿{remainingDebt.toLocaleString()}</h3>
          <div className="w-full bg-navy border border-white/5 h-1.5 rounded-full overflow-hidden mt-1">
             <div className="bg-blue-400 h-full transition-all duration-1000" style={{ width: `${totalBorrowed > 0 ? (remainingDebt / totalBorrowed) * 100 : 0}%` }}></div>
          </div>
        </GlassCard>
        <GlassCard className="col-span-12 lg:col-span-3 p-4 flex items-center justify-center gap-6 h-32 bg-emerald/5 border border-emerald/10 hover:bg-emerald/10 transition-colors">
          <CircularProgress percentage={repaymentPercentage} />
          <div className="flex flex-col text-left">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Overall</span>
            <span className="text-[10px] text-emerald uppercase font-bold tracking-widest">Repayment Progress</span>
          </div>
        </GlassCard>
      </div>

      {/* Transaction Table Section */}
      <GlassCard className="flex-1 flex flex-col overflow-hidden bg-navy/40">
        {/* Filters */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
              <input
                type="text"
                placeholder="ค้นหาชื่อบัญชีหรือรายการ..."
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
          {statusFilter === 'pending' && (
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <EyeOff size={10} />
              ซ่อน {loans.filter(l => l.balance <= 0).length} รายการที่ชำระครบแล้ว
            </span>
          )}
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-0 custom-scrollbar relative">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2">
            <thead className="sticky top-0 z-[60]">
              <tr>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229] rounded-l-lg" onClick={() => handleSort('code')}>REF <SortIcon column="code" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('date')}>DATE <SortIcon column="date" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('description')}>DESCRIPTION <SortIcon column="description" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('account')}>ACCOUNT <SortIcon column="account" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] text-right cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('borrowed')}>BORROWED <SortIcon column="borrowed" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] text-right cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('repaid')}>REPAID <SortIcon column="repaid" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] text-right cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('balance')}>BALANCE <SortIcon column="balance" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] text-center shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229] rounded-r-lg">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayLoans.map((loan) => {
                const isPending = loan.balance > 0;
                const isSettled = !isPending;
                return (
                  <tr key={loan.id} className={`transition-all group ${isSettled ? 'opacity-35 pointer-events-none select-none' : 'bg-white/[0.02] hover:bg-white/[0.06]'} ${isPending ? 'border-l-4 border-orange-500' : 'border-l-4 border-white/5'}`}>
                    <td className={`px-6 py-4 rounded-l-xl font-bold ${isPending ? 'text-orange-500' : 'text-slate-500'}`}>
                      {loan.code || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {format(new Date(loan.actualDate || loan.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-white text-sm">
                      {loan.name}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText size={12} className="opacity-50" />
                        {loan.accountName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white text-sm" data-testid={`loans-list-td-borrowed-${loan.code}`}>
                      {loan.totalBorrowed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald text-sm" data-testid={`loans-list-td-repaid-${loan.code}`}>
                      {loan.totalRepaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold text-sm ${isPending ? 'text-orange-500' : 'text-slate-500'}`} data-testid={`loans-list-td-balance-${loan.code}`}>
                      {loan.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 rounded-r-xl">
                      <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasPermission('loan-tracker', 'canUpdate') && (
                          <>
                            {isPending && (
                              <button 
                                onClick={() => { setSelectedLoan(loan); setShowRepayModal(true); setRepayForm({ ...repayForm, type: 'REPAY' }) }}
                                data-testid={`loans-list-btn-repay-${loan.code}`}
                                className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-emerald text-navy hover:shadow-[0_0_10px_rgba(80,200,120,0.4)] transition-all"
                              >
                                คืนเงิน
                              </button>
                            )}
                            <button 
                              onClick={() => openEditModal(loan)}
                              data-testid={`loans-list-btn-edit-${loan.code}`}
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
              {loans.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-400">ไม่มีข้อมูลการยืม</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Edit Loan Modal (Glassmorphism) - Still needed for editing purposes */}
      <GlassModal isOpen={showNewLoanModal} onClose={() => { setShowNewLoanModal(false); setIsEditing(false); }} title={isEditing ? 'แก้ไขรายการยืมเงิน' : 'สร้างรายการยืมใหม่'}>
        <form onSubmit={handleCreateLoan} className="flex flex-col gap-4">
          {!isEditing && (
             <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg flex items-start gap-2 text-orange-400 text-xs mb-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p>การสร้างรายการยืมเงิน ควรสร้างจากหน้า Transaction เพื่อให้ระบบบัญชีครบถ้วน การสร้างจากหน้านี้เหมาะสำหรับการยอดยกมาเท่านั้น</p>
             </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รายละเอียด / วัตถุประสงค์</label>
            <input required type="text" className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald placeholder:text-slate-600 transition-all"
              value={newLoanForm.name} onChange={e => setNewLoanForm({...newLoanForm, name: e.target.value})} placeholder="เช่น ทำบ้าน, จ่ายภาษี" 
              data-testid="loans-form-input-name" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">บัญชีต้นทาง (ยืมจากบัญชีไหน)</label>
            <select required className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald appearance-none transition-all"
              value={newLoanForm.accountId} onChange={e => setNewLoanForm({...newLoanForm, accountId: e.target.value})}
              data-testid="loans-form-sel-account">
              <option value="" className="bg-[#001F3F]">เลือกบัญชี...</option>
              {accounts.map(a => <option key={a.id} value={a.id} className="bg-[#001F3F]">{a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">จำนวนเงิน {isEditing && <span className="text-[8px] text-orange-400">(ไม่สามารถแก้ได้)</span>}</label>
              <input required type="number" step="0.01" className={`w-full bg-navy/50 border rounded-xl px-4 py-3 text-sm font-bold text-white outline-none transition-all ${isEditing ? 'border-white/5 opacity-50 cursor-not-allowed' : 'border-emerald/30 focus:border-emerald'}`}
                disabled={isEditing}
                value={newLoanForm.initialAmount} onChange={e => setNewLoanForm({...newLoanForm, initialAmount: e.target.value})} 
                data-testid="loans-form-input-amount" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-emerald uppercase tracking-widest flex items-center gap-1">
                 วันที่ยืมเงินจริง
              </label>
              <input 
                type="date" 
                className="w-full bg-navy/50 border border-emerald/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all [color-scheme:dark]"
                value={newLoanForm.actualDate} onChange={e => setNewLoanForm({...newLoanForm, actualDate: e.target.value})}
                data-testid="loans-form-input-date"
              />
            </div>
          </div>
          
          <button type="submit" data-testid="loans-form-btn-save" className="w-full bg-emerald text-navy font-black text-sm uppercase tracking-wider py-4 rounded-xl mt-4 hover:shadow-[0_0_15px_rgba(80,200,120,0.3)] transition-all active:scale-[0.98]">
            บันทึกรายการ
          </button>
        </form>
      </GlassModal>

      {/* Repay Modal (Glassmorphism) */}
      <GlassModal isOpen={showRepayModal && selectedLoan !== null} onClose={() => { setShowRepayModal(false); setSelectedLoan(null); }} title="รายการคืนเงิน (Repay)">
        <div className="mb-4 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
           <span className="text-[10px] text-slate-400 uppercase tracking-widest">สำหรับรายการ</span>
           <span className="text-sm font-bold text-white">{selectedLoan?.name} <span className="text-emerald text-xs ml-1">({selectedLoan?.accountName})</span></span>
        </div>
        <form onSubmit={handleTransaction} className="flex flex-col gap-4">
           <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
              <span>จำนวนเงิน</span>
              <span className="text-orange-400">ยอดคงเหลือ: ฿{selectedLoan?.balance.toLocaleString()}</span>
            </label>
            <input required type="number" step="0.01" className="w-full bg-navy/50 border border-emerald/30 rounded-xl px-4 py-3 text-2xl font-bold text-white outline-none focus:border-emerald transition-all"
              value={repayForm.amount} onChange={e => setRepayForm({...repayForm, amount: e.target.value})} 
              data-testid="loans-repay-form-input-amount" placeholder="0.00" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">จ่ายจากบัญชีไหน (Source Account)</label>
              <select required className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald appearance-none transition-all"
                value={repayForm.accountId} onChange={e => setRepayForm({...repayForm, accountId: e.target.value})}
                data-testid="loans-repay-form-sel-account">
                <option value="" className="bg-[#001F3F]">เลือกบัญชีเพื่อหักเงิน...</option>
                {accounts.map(a => <option key={a.id} value={a.id} className="bg-[#001F3F]">{a.name} (฿{a.balance?.toLocaleString() || 0})</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <label className="text-[10px] font-black text-emerald uppercase tracking-widest flex items-center gap-1">
                วันที่จ่ายเงินจริง (Actual Date)
              </label>
              <input 
                type="date" 
                className="w-full bg-navy/50 border border-emerald/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all [color-scheme:dark]"
                value={repayForm.actualDate} onChange={e => setRepayForm({...repayForm, actualDate: e.target.value})}
                data-testid="loans-repay-form-input-date"
              />
            </div>
          </div>
           <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">หมายเหตุ (ถ้ามี)</label>
            <input type="text" className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all placeholder:text-slate-600"
              value={repayForm.note} onChange={e => setRepayForm({...repayForm, note: e.target.value})} 
              data-testid="loans-repay-form-input-note" placeholder="คำอธิบายการคืนเงิน" />
          </div>
          <button type="submit" data-testid="loans-repay-form-btn-save" className="w-full bg-emerald text-navy font-black text-sm uppercase tracking-wider py-4 rounded-xl mt-4 hover:shadow-[0_0_15px_rgba(80,200,120,0.3)] transition-all active:scale-[0.98]">
            บันทึกการชำระ
          </button>
        </form>
      </GlassModal>
    </div>
  );
}
