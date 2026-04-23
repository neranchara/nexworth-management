'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';

import { 
  Plus, Search, Download, Upload, MoreHorizontal, 
  ArrowUpCircle, ArrowDownCircle, RefreshCw, Wallet, 
  Calendar, Edit2, Trash2, X, CheckCircle, AlertCircle, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';
import * as XLSX from 'xlsx';
import { Transaction, Account, TransactionCategory, TransactionType } from '@/types/models';




export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  
  // New UI Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccount, setFilterAccount] = useState('');

  // Alert state
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);
  
  // Form fields
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
      const [txRes, accRes, catRes, typeRes] = await Promise.all([
        api.get('/transactions', { params: { month: filterMonth, year: filterYear } }),
        api.get('/accounts'),
        api.get('/categories'),
        api.get('/types')
      ]);
      setTransactions(txRes.data.transactions);
      setAccounts(accRes.data.accounts);
      setCategories(catRes.data.categories);
      setTypes(typeRes.data.types);
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
    const isExpense = ['EXPENSE', 'DEBT'].includes(behavior);
    
    // Find linked account if it's a transfer
    let fromAccId = isExpense ? tx.accountId : '';
    let toAccId = !isExpense ? tx.accountId : '';
    let displayTypeId = tx.typeId;
    let displayCategoryId = tx.categoryId;

    if (tx.linkedTransactionId) {
      const linkedTx = transactions.find(t => t.id === tx.linkedTransactionId);
      if (linkedTx) {
        if (isExpense) {
           toAccId = linkedTx.accountId;
           // If we are editing the Expense leg, show the Category/Type of the Receiving leg
           // so the user edits the actual purpose (e.g. Investment) instead of 'Transfer Out'
           displayTypeId = linkedTx.typeId;
           displayCategoryId = linkedTx.categoryId;
        } else {
           fromAccId = linkedTx.accountId;
        }
      }
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
    if (!window.confirm("Are you sure you want to delete this transaction? If it's a transfer, the linked transaction will also be deleted.")) return;
    try {
      await api.delete(`/transactions/${id}`);
      showAlert('Transaction deleted successfully', 'success');
      fetchData();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      showAlert(errorResponse.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromAccountId && !formData.toAccountId) {
       showAlert('Please select either a From Account, a To Account, or both.', 'error');
       return;
    }

    const payload: {
      amount: number;
      date: string;
      actualDate: string | null;
      fromAccountId?: string;
      toAccountId?: string;
      description?: string;
      categoryId?: string;
      note?: string;
      typeId?: string;
    } = {
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
      actualDate: formData.actualDate ? new Date(formData.actualDate).toISOString() : null
    };

    if (!payload.fromAccountId) delete payload.fromAccountId;
    if (!payload.toAccountId) delete payload.toAccountId;

    try {
      console.log('[DEBUG] Submitting Payload:', payload);
      if (isEditing && currentTxId) {
        await api.put(`/transactions/${currentTxId}`, payload);
        showAlert('Transaction updated successfully (v2)', 'success');
      } else {
        await api.post('/transactions', payload);
        showAlert('Transaction created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      showAlert(errorResponse.response?.data?.error || 'Save failed', 'error');
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedTransactions = () => {
    let filtered = transactions;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(t => 
            (t.description || '').toLowerCase().includes(query) || 
            (t.note || '').toLowerCase().includes(query)
        );
    }
    
    // UI Improvement: Hide the receiving leg of a transfer when viewing All Accounts
    if (!filterAccount) {
      filtered = filtered.filter(t => {
        if (t.linkedTransactionId) {
          const linked = transactions.find(tx => tx.id === t.linkedTransactionId);
          if (!linked) return true; // Show if we can't find the pair
          
          // Hide this leg if it's explicitly 'Transfer In'
          if (t.category?.name === 'โอนเข้าภายใน') return false;
          
          // Hide this leg if its partner is 'Transfer Out' (meaning this is the destination)
          if (linked.category?.name === 'โอนออกภายใน') return false;

          // Tie-breaker fallback to ensure exactly one leg is shown if neither matched hide conditions
          const wouldLinkedBeHidden = linked.category?.name === 'โอนเข้าภายใน' || t.category?.name === 'โอนออกภายใน';
          if (!wouldLinkedBeHidden && t.id > linked.id) return false;
        }
        return true;
      });
    }

    if (filterType) filtered = filtered.filter(t => t.typeId === filterType);
    if (filterCategory) filtered = filtered.filter(t => t.categoryId === filterCategory);
    if (filterAccount) filtered = filtered.filter(t => t.accountId === filterAccount);

    if (!sortConfig) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'description':
          aValue = (a.description || '').toLowerCase();
          bValue = (b.description || '').toLowerCase();
          break;
        case 'type':
          aValue = (a.type?.name || '').toLowerCase();
          bValue = (b.type?.name || '').toLowerCase();
          break;
        case 'category':
          aValue = (a.category?.name || '').toLowerCase();
          bValue = (b.category?.name || '').toLowerCase();
          break;
        case 'account':
          const aAccName = a.asset?.account?.name || a.liability?.account?.name || '';
          const bAccName = b.asset?.account?.name || b.liability?.account?.name || '';
          aValue = aAccName.toLowerCase();
          bValue = bAccName.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedTransactions = getSortedTransactions();

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <MoreHorizontal className="w-4 h-4 ml-1 opacity-30 text-gray-400 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUpCircle className="w-4 h-4 ml-1 text-blue-500" /> : 
      <ArrowDownCircle className="w-4 h-4 ml-1 text-blue-500" />;
  };

  const handleDownloadTemplate = () => {
    const template = [
      { Date: format(new Date(), 'yyyy-MM-dd'), PaymentDate: '', Description: 'เงินเดือน', Amount: 50000, CategoryName: 'เงินเดือน', AccountName: 'กสิกรไทย', Note: '' },
      { Date: format(new Date(), 'yyyy-MM-dd'), PaymentDate: '', Description: 'กินข้าว', Amount: 150, CategoryName: 'อาหารและเครื่องดื่ม', AccountName: 'กสิกรไทย', Note: 'KFC' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'Nexworth_Transactions_Template.xlsx');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const records = XLSX.utils.sheet_to_json(worksheet) as Record<string, string | number>[];

        const payload = [];
        for (const row of records) {
          const category = categories.find(c => c.name.toLowerCase() === row.CategoryName?.toString().toLowerCase().trim());
          const account = accounts.find(a => a.name.toLowerCase() === row.AccountName?.toString().toLowerCase().trim());
          
          if (!category || !account) {
            showAlert(`Mismatched Name: Cannot find category '${row.CategoryName}' or account '${row.AccountName}'. Please check template.`, 'error');
            setLoading(false);
            return;
          }

          payload.push({
            date: new Date(row.Date.toString()).toISOString(),
            actualDate: row.PaymentDate ? new Date(row.PaymentDate.toString()).toISOString() : null,
            description: row.Description?.toString() || '',
            amount: parseFloat(row.Amount.toString()),
            categoryId: category.id,
            accountId: account.id,
            note: row.Note?.toString() || ''
          });
        }

        if (payload.length > 0) {
            await api.post('/transactions/bulk', payload);
            showAlert(`${payload.length} transactions imported successfully`, 'success');
            fetchData();
        } else {
            showAlert('No valid rows found to import.', 'error');
            setLoading(false);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        showAlert('Failed to import: ' + errorMsg, 'error');
        setLoading(false);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredCategories = formData.typeId ? categories.filter(c => c.typeId === formData.typeId) : categories;

  if (loading && transactions.length === 0) return <div className="p-6 text-gray-500">Loading transactions...</div>;

  const getTypeBadge = (behavior: string) => {
    switch (behavior) {
        case 'INCOME': return 'bg-green-100 text-green-800';
        case 'EXPENSE': return 'bg-red-100 text-red-800';
        case 'SAVING_INVESTMENT': return 'bg-blue-100 text-blue-800';
        case 'DEBT': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 relative">
       {/* Alert Pop-up */}
       {alert && (
        <div className={`fixed top-4 right-4 z-[110] max-w-[400px] w-full p-4 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-500" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />}
          <p className="font-medium text-sm break-words">{alert.message}</p>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-500 dark:text-gray-400">Record, filter, and manage your financial transactions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
             onClick={handleDownloadTemplate}
             className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
          >
             <Download className="w-4 h-4 mr-2" /> Template
          </button>
          
          <input type="file" accept=".xlsx,.csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
          >
             <Upload className="w-4 h-4 mr-2" /> Import
          </button>

          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm ml-2">
             <select 
               value={filterMonth} 
               onChange={(e) => setFilterMonth(parseInt(e.target.value))}
               className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer px-2 dark:bg-gray-800"
             >
               {Array.from({ length: 12 }, (_, i) => (
                 <option key={i + 1} value={i + 1}>
                   {format(new Date(2024, i, 1), 'MMMM')}
                 </option>
               ))}
             </select>
             <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
             <select 
               value={filterYear} 
               onChange={(e) => setFilterYear(parseInt(e.target.value))}
               className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer px-2 dark:bg-gray-800"
             >
               {[filterYear - 1, filterYear, filterYear + 1].map(y => (
                 <option key={y} value={y}>{y}</option>
               ))}
             </select>
          </div>
          {hasPermission('transactions', 'canCreate') && (
            <button 
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm ml-2"
            >
              <Plus className="w-5 h-5 mr-1" />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
         <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 dark:bg-gray-900"
            />
         </div>
         <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 dark:bg-gray-900"
         >
            <option value="">All Types</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
         </select>
         <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 dark:bg-gray-900"
         >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
         </select>
         <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 dark:bg-gray-900"
         >
            <option value="">All Accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
         </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th 
                  className="group px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors select-none"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">Record Date <SortIcon column="date" /></div>
                </th>
                <th 
                  className="group px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors select-none"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center">Description <SortIcon column="description" /></div>
                </th>
                <th 
                  className="group px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors select-none"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">Type <SortIcon column="type" /></div>
                </th>
                <th 
                  className="group px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors select-none"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">Category <SortIcon column="category" /></div>
                </th>
                <th 
                  className="group px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors select-none"
                  onClick={() => handleSort('account')}
                >
                  <div className="flex items-center">Account <SortIcon column="account" /></div>
                </th>
                <th 
                  className="group px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors select-none"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end">Amount <SortIcon column="amount" /></div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">No transactions match your criteria.</td>
                </tr>
              ) : sortedTransactions.map(tx => {
                const behavior = tx.type?.behavior || tx.category?.type?.behavior || '';
                
                return (
                  <tr key={tx.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                       <div className="font-medium text-gray-900 dark:text-white">{format(new Date(tx.date), 'dd/MM/yyyy')}</div>
                       {tx.linkedTransactionId && (
                           <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold bg-purple-100 dark:bg-purple-900/40 inline-flex px-1.5 mt-1 rounded items-center">
                              <RefreshCw className="w-2.5 h-2.5 mr-1" /> Transfer
                           </div>
                       )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {tx.description || '-'}
                      {tx.note && <div className="text-xs text-gray-400 font-normal mt-0.5">{tx.note}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                          {(() => {
                              if (tx.linkedTransactionId && !filterAccount) {
                                  const linkedTx = transactions.find(t => t.id === tx.linkedTransactionId);
                                  if (linkedTx) {
                                      const primaryIsGeneric = tx.category?.name === 'โอนออกภายใน' || tx.category?.name === 'โอนเข้าภายใน';
                                      const linkedIsGeneric = linkedTx.category?.name === 'โอนออกภายใน' || linkedTx.category?.name === 'โอนเข้าภายใน';
                                      if (primaryIsGeneric && !linkedIsGeneric) return linkedTx.type?.name;
                                  }
                              }
                              return tx.type?.name;
                          })()}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getTypeBadge((() => {
                           if (tx.linkedTransactionId && !filterAccount) {
                               const linkedTx = transactions.find(t => t.id === tx.linkedTransactionId);
                               if (linkedTx) {
                                   const primaryIsGeneric = tx.category?.name === 'โอนออกภายใน' || tx.category?.name === 'โอนเข้าภายใน';
                                   const linkedIsGeneric = linkedTx.category?.name === 'โอนออกภายใน' || linkedTx.category?.name === 'โอนเข้าภายใน';
                                   if (primaryIsGeneric && !linkedIsGeneric) return linkedTx.category?.type?.behavior || behavior;
                               }
                           }
                           return behavior;
                       })())}`}>
                          {(() => {
                              if (tx.linkedTransactionId && !filterAccount) {
                                  const linkedTx = transactions.find(t => t.id === tx.linkedTransactionId);
                                  if (linkedTx) {
                                      const primaryIsGeneric = tx.category?.name === 'โอนออกภายใน' || tx.category?.name === 'โอนเข้าภายใน';
                                      const linkedIsGeneric = linkedTx.category?.name === 'โอนออกภายใน' || linkedTx.category?.name === 'โอนเข้าภายใน';
                                      if (primaryIsGeneric && !linkedIsGeneric) return linkedTx.category?.name;
                                  }
                              }
                              return tx.category?.name;
                          })()}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 min-h-[56px]">
                      {(() => {
                        const accountInfo = tx.account;
                        if (!accountInfo) return <span className="text-gray-400 italic">Unknown</span>;
                        
                        let accountDisplay = (
                          <div className="flex items-center gap-1.5">
                            {accountInfo.bank?.color ? (
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: accountInfo.bank.color }}
                                title={accountInfo.bank.name}
                              />
                            ) : (
                              <Wallet className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="truncate">{accountInfo.name}</span>
                          </div>
                        );

                        // If it's a transfer and we are in "All Accounts" view, show the destination account too
                        if (tx.linkedTransactionId && !filterAccount) {
                           const linkedTx = transactions.find(t => t.id === tx.linkedTransactionId);
                           if (linkedTx && linkedTx.account) {
                              accountDisplay = (
                                 <div className="flex items-center gap-2">
                                    {accountDisplay}
                                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                       {linkedTx.account.bank?.color ? (
                                         <div 
                                           className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-70" 
                                           style={{ backgroundColor: linkedTx.account.bank.color }}
                                         />
                                       ) : (
                                         <Wallet className="w-3 h-3 flex-shrink-0 opacity-70" />
                                       )}
                                       <span className="truncate text-xs">{linkedTx.account.name}</span>
                                    </div>
                                 </div>
                              );
                           }
                        }

                        return accountDisplay;
                      })()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${behavior === 'INCOME' ? 'text-green-600 dark:text-green-400' : (behavior === 'EXPENSE' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white')}`}>
                      {behavior === 'INCOME' ? '+' : (behavior === 'EXPENSE' ? '-' : '')}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       {hasPermission('transactions', 'canUpdate') && (
                         <button onClick={() => openEditModal(tx)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                           <Edit2 className="w-4 h-4 inline" />
                         </button>
                       )}
                       {hasPermission('transactions', 'canDelete') && (
                         <button onClick={() => handleDelete(tx.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                           <Trash2 className="w-4 h-4 inline" />
                         </button>
                       )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-w-lg">
              <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                   {isEditing ? 'Edit Transaction' : 'Record New Transaction'}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Record Date</label>
                       <div className="relative">
                          <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                          <input 
                            type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                          Actual Date <span className="text-[10px] font-normal text-gray-400">(Optional)</span>
                       </label>
                       <div className="relative">
                          <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-blue-400" />
                          <input 
                            type="date" value={formData.actualDate} onChange={(e) => setFormData({...formData, actualDate: e.target.value})}
                            className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                       <select 
                         value={formData.typeId} onChange={(e) => handleTypeChange(e.target.value)}
                         className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                       >
                         {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                       <select 
                         required value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                         className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                       >
                         <option value="">Select Category</option>
                         {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>
                 </div>

                 {/* Dual Account Selector */}
                 <div className="p-3 bg-gray-50 border border-gray-200 dark:bg-gray-900/50 dark:border-gray-700 rounded-lg space-y-3">
                     <p className="text-xs text-center text-gray-500 font-medium pb-2 border-b border-gray-200 dark:border-gray-700">Account Selection (Pick exactly one, or both to do a Transfer)</p>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-semibold text-red-600 dark:text-red-400 mb-1">บัญชีต้นทาง (From)</label>
                           <select 
                             value={formData.fromAccountId} onChange={(e) => setFormData({...formData, fromAccountId: e.target.value})}
                             className="w-full px-3 py-2 text-sm rounded-lg border border-red-200 dark:border-red-900 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                           >
                              <option value="">- None -</option>
                              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-semibold text-green-600 dark:text-green-400 mb-1">บัญชีปลายทาง (To)</label>
                           <select 
                             value={formData.toAccountId} onChange={(e) => setFormData({...formData, toAccountId: e.target.value})}
                             className="w-full px-3 py-2 text-sm rounded-lg border border-green-200 dark:border-green-900 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                           >
                              <option value="">- None -</option>
                              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                           </select>
                        </div>
                     </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                    <div className="relative">
                       <span className="absolute left-4 top-2 text-gray-400 font-bold text-lg">฿</span>
                       <input 
                         type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}
                         placeholder="0.00"
                         className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <input 
                      type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="e.g. Salary, Grocery shopping"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                 </div>

                 <div className="pt-6 border-t dark:border-gray-700 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-colors">
                      {isEditing ? 'Update Transaction' : 'Save Transaction'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
