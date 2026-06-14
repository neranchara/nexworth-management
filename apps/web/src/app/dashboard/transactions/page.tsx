'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';

import { 
  Plus, Search, MoreHorizontal, 
  ArrowUpCircle, ArrowDownCircle, 
  Edit2, Trash2, CheckCircle, AlertCircle, Bot, CloudUpload, Loader2,
  Scan, X
} from 'lucide-react';
import { format } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';
import * as XLSX from 'xlsx';
import { Transaction, Account, TransactionCategory, TransactionType } from '@/types/models';
import GlassCard from '@/components/ui/GlassCard';
import GlassModal from '@/components/ui/GlassModal';
import { mergePageLabels } from '@/utils/uiLabels';
import { SYSTEM_CATEGORY_KEYS } from '@/config/systemConfig';

const DEFAULT_LABELS = {
  title: 'ประวัติธุรกรรม',
  subtitle: 'จัดการข้อมูลทางการเงิน',
  addNew: 'บันทึกรายการใหม่',
  search: 'ค้นหา...',
  allCategories: 'ทุกหมวดหมู่',
  allAccounts: 'ทุกบัญชี',
  table: {
    date: 'วันที่',
    description: 'รายละเอียด',
    category: 'หมวดหมู่',
    account: 'บัญชี',
    amount: 'จำนวนเงิน',
    action: 'จัดการ'
  },
  form: {
    titleAdd: 'บันทึกรายการใหม่',
    titleEdit: 'แก้ไขรายการ',
    amount: 'จำนวนเงิน (บาท)',
    account: 'บัญชี',
    category: 'หมวดหมู่',
    note: 'บันทึกเพิ่มเติม',
    date: 'วันที่',
    save: 'บันทึกรายการ',
    update: 'อัปเดตรายการ'
  }
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const scanFileRef = useRef<HTMLInputElement>(null);
  const [labels, setLabels] = useState<any>(DEFAULT_LABELS);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  const [accountTypes, setAccountTypes] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccount, setFilterAccount] = useState('');

  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    actualDate: '',
    fromAccountId: '',
    toAccountId: '',
    categoryId: '',
    typeId: '',
    amount: '',
    description: '',
    note: ''
  });

  const { hasPermission } = usePermissions();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [txRes, accRes, catRes, typeRes, uiRes, configRes] = await Promise.all([
        api.get('/transactions', { params: { month: filterMonth, year: filterYear } }),
        api.get('/accounts'),
        api.get('/categories'),
        api.get('/types'),
        api.get('/configs', { params: { key: 'UI_LABELS_TRANSACTIONS' } }),
        api.get('/configs', { params: { category: 'DROPDOWNS' } })
      ]);
      setTransactions(txRes.data.transactions);
      setAccounts(accRes.data.accounts);
      setCategories(catRes.data.categories);
      setTypes(typeRes.data.types);
      
      if (uiRes.data.data?.[0]?.value) {
        setLabels(mergePageLabels(DEFAULT_LABELS, uiRes.data.data[0].value));
      }
      const typesConfig = configRes.data.data.find((c: any) => c.key === 'ACCOUNT_TYPES');
      if (typesConfig) {
        setAccountTypes(typesConfig.value);
      }
    } catch {
      console.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showAlert = (message: string, type: 'success' | 'error') => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlert({ message, type });
    alertTimeoutRef.current = setTimeout(() => setAlert(null), 3000);
  };

  const handleTypeChange = (typeId: string) => {
    const firstCat = categories.find(c => c.typeId === typeId);
    setFormData({ 
      ...formData, 
      typeId, 
      categoryId: firstCat ? firstCat.id : '' 
    });
  };

  const resetForm = () => {
    const expenseType = types.find(t => t.behavior === 'EXPENSE') || types[0];
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      actualDate: '',
      fromAccountId: '',
      toAccountId: '',
      categoryId: categories.find(c => c.typeId === expenseType?.id)?.id || '',
      typeId: expenseType?.id || '',
      amount: '',
      description: '',
      note: ''
    });
    setIsEditing(false);
    setCurrentTxId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    const behavior = tx.type?.behavior || tx.category?.type?.behavior || '';
    let fromAccId = '';
    let toAccId = '';
    let displayTypeId = tx.typeId;
    let displayCategoryId = tx.categoryId;

    if (tx.linkedTransactionId) {
      const linkedTx = transactions.find(t => t.id === tx.linkedTransactionId);
      if (linkedTx) {
        const isSystemCat = (sysKey?: string | null) => sysKey === SYSTEM_CATEGORY_KEYS.TRANSFER_IN || sysKey === SYSTEM_CATEGORY_KEYS.TRANSFER_OUT;
        const isCurrentFrom = (tx.type as any)?.isExpenseLike || tx.category?.systemKey === SYSTEM_CATEGORY_KEYS.TRANSFER_OUT;
        const isLinkedTo = !(linkedTx.type as any)?.isExpenseLike || linkedTx.category?.systemKey === SYSTEM_CATEGORY_KEYS.TRANSFER_IN;
        if (isCurrentFrom && isLinkedTo) { fromAccId = tx.accountId; toAccId = linkedTx.accountId; }
        else { fromAccId = linkedTx.accountId; toAccId = tx.accountId; }
        if (isSystemCat(tx.category?.systemKey) && !isSystemCat(linkedTx.category?.systemKey)) {
            displayTypeId = linkedTx.typeId;
            displayCategoryId = linkedTx.categoryId;
        }
      }
    } else {
      const isFromBox = tx.direction !== 'TO';
      fromAccId = isFromBox ? tx.accountId : '';
      toAccId = !isFromBox ? tx.accountId : '';
    }

    setFormData({
      date: format(new Date(tx.date), 'yyyy-MM-dd'),
      actualDate: tx.actualDate ? format(new Date(tx.actualDate), 'yyyy-MM-dd') : '',
      fromAccountId: fromAccId,
      toAccountId: toAccId,
      categoryId: displayCategoryId,
      typeId: displayTypeId,
      amount: Math.abs(tx.amount).toString(),
      description: tx.description || '',
      note: tx.note || ''
    });
    setIsEditing(true);
    setCurrentTxId(tx.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      showAlert('Transaction deleted successfully.', 'success');
      fetchData();
    } catch (err: any) { showAlert(`Delete failed: ${err.response?.data?.error || 'Unknown error'}`, 'error'); }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromAccountId && !formData.toAccountId) {
       showAlert('Please select either a From Account, a To Account, or both.', 'error');
       return;
    }

    const selectedType = types.find(t => t.id === formData.typeId);
    const selectedCat = categories.find(c => c.id === formData.categoryId);
    const behavior = selectedType?.behavior || 'EXPENSE';
    const catName = (selectedCat?.name || '').toLowerCase();
    
    let finalDirection: 'FROM' | 'TO' | null = null;
    
    if (formData.fromAccountId && formData.toAccountId) {
        // It's a transfer, do not force a single direction
        finalDirection = null;
    } else if (formData.fromAccountId) {
        finalDirection = 'FROM';
    } else if (formData.toAccountId) {
        finalDirection = 'TO';
    }

    const payload: any = {
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
      actualDate: formData.actualDate ? new Date(formData.actualDate).toISOString() : null,
      direction: finalDirection
    };

    // Sanitize payload: Remove empty strings that cause UUID validation errors
    if (!payload.fromAccountId || payload.fromAccountId === '') delete payload.fromAccountId;
    if (!payload.toAccountId || payload.toAccountId === '') delete payload.toAccountId;
    if (!payload.categoryId || payload.categoryId === '') delete payload.categoryId;
    if (!payload.typeId || payload.typeId === '') delete payload.typeId;

    try {
      if (isEditing && currentTxId) {
        await api.put(`/transactions/${currentTxId}`, payload);
        showAlert('Transaction updated successfully.', 'success');
      } else {
        await api.post('/transactions', payload);
        showAlert('Transaction created successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) { 
      console.error('Save failed details:', err);
      const errorMsg = err.response?.data?.error;
      const displayMsg = typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : (errorMsg || 'Unknown error');
      showAlert(`Save failed: ${displayMsg}`, 'error'); 
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key as keyof Transaction] as any;
    const bValue = b[sortConfig.key as keyof Transaction] as any;
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  }).filter(t => {
    if (searchQuery && !t.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType && t.typeId !== filterType) return false;
    if (filterCategory && t.categoryId !== filterCategory) return false;
    if (filterAccount && t.accountId !== filterAccount) return false;
    return true;
  });

  const handleScanSlip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    try {
      let realAmount = null;
      let rawText = '';
      let qrPayload = null;

      // Safe Hookสำหรับระบบ Automate Test (Playwright E2E Sandbox)
      if (typeof window !== 'undefined' && (window as any).__playwrightMockOCR) {
        const mockRes = await (window as any).__playwrightMockOCR(file);
        realAmount = mockRes.amount;
        rawText = mockRes.text;
        qrPayload = mockRes.qrPayload;
      } else {
        const { scanAmountFromImage } = await import('../../../utils/ocrScanner');
        const res = await scanAmountFromImage(file);
        realAmount = res.amount;
        rawText = res.text;
        const { scanQRFromImage } = await import('../../../utils/qrScanner');
        qrPayload = await scanQRFromImage(file);
      }
      
      let verifiedData = null;
      if (qrPayload) {
        const verifyRes = await api.post('/ai/verify-slip', { payload: qrPayload });
        if (verifyRes.data.success) verifiedData = verifyRes.data.data;
      }

      const extracted = {
        amount: realAmount ? realAmount : (verifiedData?.amount?.toString() || ''),
        date: verifiedData?.transTime ? format(new Date(verifiedData.transTime), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        description: verifiedData?.receiverName ? `โอนให้ ${verifiedData.receiverName}` : 'สแกนจากสลิปธนาคาร',
        bankName: verifiedData?.bankName || ''
      };
      
      const matchAcc = accounts.find(a => 
          a.name.toLowerCase().includes((extracted.bankName || rawText).toLowerCase()) ||
          (rawText.toLowerCase().includes('kbank') && a.bank?.name === 'KBank')
      );

      const detectedCat = (rawText || '').toLowerCase();
      const matchCat = categories.find(c => 
          c.name.toLowerCase().includes(detectedCat) || 
          (detectedCat.includes('อาหาร') && c.name === 'อาหารและเครื่องดื่ม')
      );

      setFormData(prev => ({
          ...prev,
          amount: extracted.amount,
          date: extracted.date,
          description: extracted.description,
          fromAccountId: matchAcc?.id || prev.fromAccountId,
          categoryId: matchCat?.id || prev.categoryId,
          typeId: matchCat?.typeId || prev.typeId
      }));
      showAlert('Slip scanned and auto-filled!', 'success');
    } catch (err) { showAlert('Scan failed. Try a clearer image.', 'error'); } 
    finally { setIsScanning(false); if (scanFileRef.current) scanFileRef.current.value = ''; }
  };

  const currentTypeBehavior = types.find(t => t.id === formData.typeId)?.behavior || 'EXPENSE';

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden w-full space-y-4">
       {alert && (
        <div className={`fixed top-4 right-4 z-[200] p-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all backdrop-blur-md border ${
          alert.type === 'success' ? 'bg-emerald/10 border-emerald/20 text-emerald' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-bold text-sm">{alert.message}</p>
        </div>
      )}

      <header className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white">{labels.title}</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{labels.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            data-testid="transactions-header-btn-scan-slip"
            className="bg-white/5 border border-white/5 text-emerald px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 hover:bg-emerald/10 hover:border-emerald/20"
          >
            <Scan className="w-4 h-4" /> Scan Slip
          </button>
          
          {hasPermission('transactions', 'canCreate') && (
            <button 
              onClick={openAddModal}
              data-testid="transactions-list-btn-add-tx"
              className="bg-emerald text-navy px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="w-4 h-4" /> {labels.addNew}
            </button>
          )}
        </div>
      </header>

      <GlassCard className="p-3 flex flex-wrap gap-3 items-center shrink-0 bg-navy/40">
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
            <input 
              type="text" placeholder={labels.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy/50 border border-white/5 rounded-lg py-1.5 pl-9 text-xs text-white outline-none"
            />
         </div>
         <select value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))} className="bg-navy/80 border border-white/5 rounded-lg py-1.5 px-3 text-xs text-slate-300 outline-none focus:border-emerald">
            {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, idx) => (
              <option key={idx + 1} value={idx + 1} className="bg-navy">{m}</option>
            ))}
         </select>
         <select value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))} className="bg-navy/80 border border-white/5 rounded-lg py-1.5 px-3 text-xs text-slate-300 outline-none focus:border-emerald">
            {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y} className="bg-navy">{y + 543} ({y})</option>
            ))}
         </select>
         <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-navy/80 border border-white/5 rounded-lg py-1.5 px-3 text-xs text-slate-300 outline-none focus:border-emerald">
            <option value="" className="bg-navy">{labels.allCategories}</option>
            {categories.map(c => <option key={c.id} value={c.id} className="bg-navy">{c.name}</option>)}
         </select>
         <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className="bg-navy/80 border border-white/5 rounded-lg py-1.5 px-3 text-xs text-slate-300 outline-none focus:border-emerald">
            <option value="" className="bg-navy">{labels.allAccounts}</option>
            {accounts.map(a => <option key={a.id} value={a.id} className="bg-navy">{a.name}</option>)}
         </select>
      </GlassCard>

      <GlassCard className="flex-1 overflow-hidden bg-navy/40">
        <div className="h-full overflow-y-auto px-4 custom-scrollbar">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2">
            <thead className="sticky top-0 z-[60] bg-[#001229]">
              <tr>
                <th className="px-6 py-4 text-slate-400 uppercase font-bold text-[10px]">{labels.table.date}</th>
                <th className="px-6 py-4 text-slate-400 uppercase font-bold text-[10px]">{labels.table.description}</th>
                <th className="px-6 py-4 text-slate-400 uppercase font-bold text-[10px]">{labels.table.category}</th>
                <th className="px-6 py-4 text-slate-400 uppercase font-bold text-[10px]">{labels.table.account}</th>
                <th className="px-6 py-4 text-slate-400 uppercase font-bold text-[10px] text-right">{labels.table.amount}</th>
                <th className="px-6 py-4 text-slate-400 uppercase font-bold text-[10px] text-center">{labels.table.action}</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map(tx => (
                <tr key={tx.id} className="bg-white/[0.02] hover:bg-white/[0.06] transition-all group">
                  <td className="px-6 py-3 rounded-l-xl text-white">{format(new Date(tx.date), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-3 text-white font-bold">{tx.description || '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      tx.type?.behavior === 'INCOME' ? 'bg-emerald/10 text-emerald' : 
                      tx.type?.behavior === 'SAVING' || tx.type?.behavior === 'GOAL_SAVING' ? 'bg-blue-500/10 text-blue-400' :
                      tx.type?.behavior === 'INVESTMENT' ? 'bg-cyan-500/10 text-cyan-400' :
                      tx.type?.behavior === 'INTERNAL_TRANSFER' ? 'bg-slate-500/10 text-slate-400' :
                      tx.type?.behavior === 'EMERGENCY' ? 'bg-orange-500/10 text-orange-400' :
                      tx.type?.behavior === 'LOAN_BORROW' ? 'bg-purple-500/10 text-purple-400' :
                      tx.type?.behavior === 'LOAN_REPAY' ? 'bg-emerald-500/10 text-emerald-400' :
                      tx.type?.behavior === 'LEND_OUT' ? 'bg-blue-500/10 text-blue-400' :
                      tx.type?.behavior === 'LEND_REPAY' ? 'bg-blue-500/10 text-blue-300' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {tx.category?.name}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-300">{tx.account?.name}</td>
                  <td className={`px-6 py-3 text-right font-bold ${tx.direction === 'FROM' ? 'text-rose-400' : 'text-emerald'}`}>
                    {tx.direction === 'FROM' ? '-' : ''}
                    {Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3 text-center rounded-r-xl">
                    <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(tx)} className="text-slate-400 hover:text-blue-400"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(tx.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Modern Record New Transaction Modal */}
      <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? labels.form.titleEdit : labels.form.titleAdd}>
        <div className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
          
          {/* Smart Slip Scanner Section */}
          {!isEditing && (
            <div className="bg-[#0A2A2A] border border-emerald/20 rounded-2xl p-5 flex items-center justify-between group hover:border-emerald/40 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald/10 rounded-xl flex items-center justify-center text-emerald">
                  {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <Scan className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald uppercase tracking-wider">AI Slip Intelligence</h4>
                  <p className="text-[10px] text-slate-400">Auto-fill details from bank slip</p>
                </div>
              </div>
              <button 
                data-testid="transactions-btn-scan-slip"
                onClick={() => scanFileRef.current?.click()}
                disabled={isScanning}
                className="bg-emerald text-navy px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_15px_rgba(80,200,120,0.4)] transition-all disabled:opacity-50"
              >
                Select Slip
              </button>
              <input type="file" ref={scanFileRef} className="hidden" accept="image/*" onChange={handleScanSlip} data-testid="ai-scanner-input" />
            </div>
          )}


          <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
            {/* Amount Field (Main Highlight) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{labels.form.amount}</label>
              <div className="relative group">
                <input 
                  type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  data-testid="transactions-form-input-amount"
                  className="w-full bg-[#001229] border border-white/5 rounded-2xl px-6 py-6 text-3xl font-black text-white outline-none focus:border-emerald transition-all placeholder:text-slate-800"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold">฿</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{labels.form.category}</label>
              <select 
                required value={formData.categoryId} 
                onChange={(e) => {
                  const catId = e.target.value;
                  const selectedCat = categories.find(c => c.id === catId);
                  setFormData({
                    ...formData,
                    categoryId: catId,
                    typeId: selectedCat?.typeId || formData.typeId
                  });
                }}
                className="w-full bg-[#001229] border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald appearance-none"
              >
                <option value="">Select Category</option>
                {categories
                  .filter(c => {
                    const behavior = types.find(t => t.id === c.typeId)?.behavior ?? '';
                    return !['LOAN_BORROW', 'LOAN_REPAY', 'LEND_OUT', 'LEND_REPAY'].includes(behavior);
                  })
                  .map(c => {
                  const typeName = types.find(t => t.id === c.typeId)?.name || 'Unknown';
                  return (
                    <option key={c.id} value={c.id} className="bg-[#001229]">
                      [{typeName}] {c.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">จากบัญชี (From)</label>
                <select 
                  required={!formData.toAccountId} value={formData.fromAccountId} onChange={(e) => setFormData({...formData, fromAccountId: e.target.value})}
                  className="w-full bg-[#001229] border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald appearance-none"
                >
                  <option value="">- ไม่มีบัญชีต้นทาง -</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เข้าบัญชี (To)</label>
                <select 
                  required={!formData.fromAccountId} value={formData.toAccountId} onChange={(e) => setFormData({...formData, toAccountId: e.target.value})}
                  className="w-full bg-[#001229] border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald appearance-none"
                >
                  <option value="">- ไม่มีบัญชีปลายทาง -</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{labels.form.note}</label>
              <textarea 
                value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="What was this for?"
                rows={2}
                className="w-full bg-[#001229] border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all resize-none placeholder:text-slate-700"
              />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{labels.form.date}</label>
                <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="bg-[#001229] border border-white/5 rounded-xl px-4 py-3 text-sm text-white [color-scheme:dark]" />
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald text-navy font-black text-sm uppercase tracking-widest py-4 rounded-xl mt-2 hover:shadow-[0_0_25px_rgba(80,200,120,0.4)] transition-all active:scale-[0.98]"
            >
              {isEditing ? labels.form.update : labels.form.save}
            </button>
          </form>
        </div>
      </GlassModal>
    </div>
  );
}
