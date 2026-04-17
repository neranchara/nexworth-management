'use client';
import { useState, useEffect, useRef } from 'react';
import { PlusCircle, ArrowUpCircle, X, CheckCircle, AlertCircle, Wallet, ArrowDownCircle, MoreHorizontal } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';

export default function LoanTrackerPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const { hasPermission } = usePermissions();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLoanId, setCurrentLoanId] = useState<string | null>(null);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });

  // Form states
  const [newLoanForm, setNewLoanForm] = useState({ name: '', accountId: '', initialAmount: '', actualDate: '' });
  const [repayForm, setRepayForm] = useState({ amount: '', type: 'REPAY' as 'REPAY' | 'BORROW', note: '', actualDate: '' });

  // Alert state
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showAlert = (message: string, type: 'success' | 'error') => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlert({ message, type });
    alertTimeoutRef.current = setTimeout(() => setAlert(null), 3000);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [loansRes, accRes] = await Promise.all([
        api.get('/loans'),
        api.get('/accounts')
      ]);

      setLoans(loansRes.data.loans || []);
      setAccounts(accRes.data.accounts || []);
    } catch (e) {
      console.error('Failed to fetch data', e);
      showAlert('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    } catch (err: any) {
      showAlert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกรายการ', 'error');
    }
  };

  const openEditModal = (loan: any) => {
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
        actualDate: repayForm.actualDate ? new Date(repayForm.actualDate).toISOString() : undefined
      });
      setShowRepayModal(false);
      setRepayForm({ amount: '', type: 'REPAY', note: '', actualDate: '' });
      setSelectedLoan(null);
      showAlert('บันทึกรายการสำเร็จ', 'success');
      fetchData();
    } catch (err: any) {
      showAlert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกรายการ', 'error');
    }
  };

  // Sorting logic
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedLoans = () => {
    if (!sortConfig) return loans;

    return [...loans].sort((a, b) => {
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
          aValue = a.totalBorrowed;
          bValue = b.totalBorrowed;
          break;
        case 'repaid':
          aValue = a.totalRepaid;
          bValue = b.totalRepaid;
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

  const sortedLoans = getSortedLoans();

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

  return (
    <div className="space-y-6 relative">
      {/* Alert Pop-up */}
      {alert && (
        <div className={`fixed top-4 right-4 z-[110] max-w-[400px] w-full p-4 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-500" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />}
          <p className="font-medium text-sm break-words">{alert.message}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loan Tracker (โอนภายใน)</h1>
        {hasPermission('loan-tracker', 'canCreate') && (
          <button
            onClick={() => setShowNewLoanModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <PlusCircle className="w-5 h-5" /> สร้างรายการยืมใหม่
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">ยอดยืมทั้งหมด (Borrowed)</p>
          <p className="text-3xl font-bold text-orange-600">฿{totalBorrowed.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">คืนแล้ว (Repaid)</p>
          <p className="text-3xl font-bold text-green-600">฿{totalRepaid.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">คงเหลือ (Balance)</p>
          <p className="text-3xl font-bold text-blue-600">฿{remainingDebt.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">Ref / Record <SortIcon column="date" /></div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('date')} 
              >
                <div className="flex items-center">Loan Date <SortIcon column="date" /></div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center">Description <SortIcon column="description" /></div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('account')}
              >
                <div className="flex items-center">Source Account <SortIcon column="account" /></div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('borrowed')}
              >
                <div className="flex items-center justify-end">Borrow <SortIcon column="borrowed" /></div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('repaid')}
              >
                <div className="flex items-center justify-end">Repaid <SortIcon column="repaid" /></div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('balance')}
              >
                <div className="flex items-center justify-end">Balance <SortIcon column="balance" /></div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedLoans.map((loan) => (
              <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{loan.code || loan.id.substring(0,8)}</div>
                  <div className="text-xs text-gray-500">{format(new Date(loan.date), 'dd/MM/yyyy')}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {loan.actualDate ? format(new Date(loan.actualDate), 'dd/MM/yyyy') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{loan.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-gray-400" />
                  {loan.accountName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600 text-right">{loan.totalBorrowed.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-green-600">{loan.totalRepaid.toLocaleString()}</div>
                  {loan.latestRepaymentDate && (
                    <div className="text-[10px] text-gray-500 italic mt-0.5">
                      Last: {format(new Date(loan.latestRepaymentDate), 'dd/MM/yyyy')}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 text-right">{loan.balance.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {hasPermission('loan-tracker', 'canUpdate') && (
                    <>
                      <button 
                        onClick={() => { setSelectedLoan(loan); setShowRepayModal(true); setRepayForm({ ...repayForm, type: 'REPAY' }) }}
                        className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded mx-1"
                      >
                        คืนเงิน
                      </button>
                      <button 
                        onClick={() => { setSelectedLoan(loan); setShowRepayModal(true); setRepayForm({ ...repayForm, type: 'BORROW' }) }}
                        className="text-orange-600 hover:text-orange-900 bg-orange-50 px-3 py-1 rounded mx-1"
                      >
                        ยืมเพิ่ม
                      </button>
                      <button 
                        onClick={() => openEditModal(loan)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded mx-1 text-xs"
                      >
                        แก้ไข
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNewLoanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">{isEditing ? 'แก้ไขรายการยืมเงิน' : 'สร้างรายการยืมใหม่ (New Loan)'}</h2>
            <form onSubmit={handleCreateLoan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รายละเอียด / วัตถุประสงค์</label>
                <input required type="text" className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={newLoanForm.name} onChange={e => setNewLoanForm({...newLoanForm, name: e.target.value})} placeholder="เช่น ทำบ้าน, จ่ายภาษี" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">บัญชีต้นทาง (ยืมจากบัญชีไหน)</label>
                <select required className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={newLoanForm.accountId} onChange={e => setNewLoanForm({...newLoanForm, accountId: e.target.value})}>
                  <option value="">เลือกบัญชี...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">จำนวนเงิน {isEditing && <span className="text-[10px] text-gray-400 font-normal ml-1">(ไม่สามารถเปลี่ยนได้ผ่านการแก้ไขนี้)</span>}</label>
                <input required type="number" step="0.01" className={`w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 ${isEditing ? 'bg-gray-100 opacity-60 cursor-not-allowed' : ''}`}
                  disabled={isEditing}
                  value={newLoanForm.initialAmount} onChange={e => setNewLoanForm({...newLoanForm, initialAmount: e.target.value})} />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> วันที่ยืมเงินจริง (Loan Date)
                </label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg p-2 bg-white dark:bg-gray-700 border-blue-200 dark:border-blue-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newLoanForm.actualDate} onChange={e => setNewLoanForm({...newLoanForm, actualDate: e.target.value})}
                />
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">* ระบุวันที่ยืมเงินจริง เพื่อใช้คำนวณในคอลัมน์ Loan Date</p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowNewLoanModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">บันทึกรายการ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRepayModal && selectedLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">{repayForm.type === 'REPAY' ? 'รายการคืนเงิน (Repay)' : 'รายการยืมเพิ่ม (Borrow More)'}</h2>
            <p className="text-sm text-gray-500 mb-4">สำหรับ: {selectedLoan.name} ({selectedLoan.accountName})</p>
            <form onSubmit={handleTransaction} className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                  <span>จำนวนเงิน</span>
                  <span className="text-xs text-gray-500">(Initial: ฿{selectedLoan.totalAmount?.toLocaleString()})</span>
                </label>
                <input required type="number" step="0.01" className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={repayForm.amount} onChange={e => setRepayForm({...repayForm, amount: e.target.value})} />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> วันที่จ่ายเงินจริง (Actual Date)
                </label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg p-2 bg-white dark:bg-gray-700 border-blue-200 dark:border-blue-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={repayForm.actualDate} onChange={e => setRepayForm({...repayForm, actualDate: e.target.value})}
                />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หมายเหตุ (ถ้ามี)</label>
                <input type="text" className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={repayForm.note} onChange={e => setRepayForm({...repayForm, note: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowRepayModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
                <button type="submit" className={`px-4 py-2 text-white rounded-lg ${repayForm.type === 'REPAY' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>บันทึกรายการ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
