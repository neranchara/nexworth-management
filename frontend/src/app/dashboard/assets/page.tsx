'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Edit2, Trash2, X, CheckCircle, AlertCircle, Building2, TrendingUp, Coins, PlusCircle, Wallet, ArrowUpCircle, ArrowDownCircle, MoreHorizontal } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/authStore';

const ALLOWED_ASSET_TYPES = ['SAVING', 'GOAL', 'INVESTMENT', 'EMERGENCY'];

const ASSET_TYPES = [
  { value: 'SAVING', label: 'Saving' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'EMERGENCY', label: 'Emergency Fund' },
  { value: 'GOAL', label: 'Financial Goal' },
];

export default function AssetsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]); // Master list of accounts for dropdown
  const { hasPermission } = usePermissions();
  const [banks, setBanks] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });

  // Alert state
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    accountId: 'new',
    newAccountName: '',
    newAccountType: 'BANK',
    bankId: '',
    amount: 0,
    type: 'ASSET' as 'ASSET' | 'LIABILITY',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, accountsRes, banksRes, statsRes] = await Promise.all([
        api.get('/financial-records?type=ASSET'),
        api.get('/accounts'),
        api.get('/banks'),
        api.get('/dashboard/stats'),
      ]);

      // Filter records and accounts for Assets page based on restricted types
      const filteredRecords = (recordsRes.data.records || []).filter((r: any) => 
        ALLOWED_ASSET_TYPES.includes(r.account?.type)
      );
      const filteredAccounts = (accountsRes.data.accounts || []).filter((acc: any) => 
        ALLOWED_ASSET_TYPES.includes(acc.type)
      );

      setRecords(filteredRecords);
      setAccounts(filteredAccounts); 
      setBanks(banksRes.data.banks);
      setDashboardStats(statsRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showAlert = (message: string, type: 'success' | 'error') => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlert({ message, type });
    alertTimeoutRef.current = setTimeout(() => setAlert(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      accountId: accounts.length > 0 ? accounts[0].id : 'new',
      newAccountName: '',
      newAccountType: 'BANK',
      bankId: '',
      amount: 0,
      type: 'ASSET',
      note: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsEditing(false);
    setCurrentRecordId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (r: any) => {
    setFormData({
      accountId: r.accountId,
      newAccountName: '',
      newAccountType: r.account?.type || 'BANK',
      bankId: r.account?.bankId || '',
      amount: r.amount,
      type: r.type,
      note: r.note || '',
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setIsEditing(true);
    setCurrentRecordId(r.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this asset record? (Account will NOT be deleted)')) return;
    try {
      await api.delete(`/financial-records/${id}`);
      showAlert('Asset record removed successfully', 'success');
      fetchData();
    } catch (err: any) {
      showAlert(err.response?.data?.error || 'Remove failed', 'error');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        accountId: formData.accountId === 'new' ? null : formData.accountId,
        newAccountName: formData.accountId === 'new' ? formData.newAccountName : null,
        newAccountType: formData.accountId === 'new' ? formData.newAccountType : null,
        bankId: formData.accountId === 'new' ? (formData.bankId || null) : null,
        amount: Number(formData.amount),
        date: new Date(formData.date).toISOString(),
      };

      if (isEditing && currentRecordId) {
        await api.put(`/financial-records/${currentRecordId}`, payload);
        showAlert('Asset record updated successfully', 'success');
      } else {
        await api.post('/financial-records', payload);
        showAlert('Asset record added successfully', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      const message =
        err.response?.data?.error?.issues?.[0]?.message ||
        err.response?.data?.error ||
        'Save failed';
      showAlert(typeof message === 'string' ? message : JSON.stringify(message), 'error');
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'BANK':
      case 'CASHFLOW':
      case 'SAVING':
      case 'INTERNAL':
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'STOCK':
      case 'INVESTMENT':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'GOLD':
        return <Coins className="w-4 h-4 text-yellow-500" />;
      case 'GOAL':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      case 'EMERGENCY':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'FAMILY':
        return <CheckCircle className="w-4 h-4 text-indigo-500" />;
      default:
        return <Building2 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    if (['BANK', 'CASHFLOW', 'INTERNAL', 'SAVING'].includes(type))
      return 'bg-blue-50 text-blue-700 ring-blue-700/10';
    if (['STOCK', 'INVESTMENT'].includes(type))
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/10';
    if (['GOLD'].includes(type)) return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
    if (['EMERGENCY'].includes(type)) return 'bg-red-50 text-red-700 ring-red-600/10';
    return 'bg-purple-50 text-purple-700 ring-purple-600/10';
  };

  // Sorting logic
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedRecords = () => {
    if (!sortConfig) return records;

    return [...records].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'name':
          aValue = (a.account?.name || '').toLowerCase();
          bValue = (b.account?.name || '').toLowerCase();
          break;
        case 'date':
          aValue = a.date ? new Date(a.date).getTime() : 0;
          bValue = b.date ? new Date(b.date).getTime() : 0;
          break;
        case 'type':
          aValue = (a.account?.type || '').toLowerCase();
          bValue = (b.account?.type || '').toLowerCase();
          break;
        case 'bank':
          aValue = (a.account?.bank?.name || '').toLowerCase();
          bValue = (b.account?.bank?.name || '').toLowerCase();
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

  const sortedRecords = getSortedRecords();

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <MoreHorizontal className="w-3 h-3 ml-1 opacity-20" />;
    return sortConfig.direction === 'asc' ?
      <ArrowUpCircle className="w-3 h-3 ml-1 text-blue-500" /> :
      <ArrowDownCircle className="w-3 h-3 ml-1 text-blue-500" />;
  };

  const totalAssets = sortedRecords.reduce((sum, r) => sum + (r.amount || 0), 0);

  if (loading && records.length === 0) return <div className="p-6">Loading data...</div>;
  if (error && records.length === 0) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="relative space-y-6">
      {/* Alert Pop-up */}
      {alert && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-[400px] w-full p-4 rounded-lg shadow-lg flex items-center gap-3 transition-all ${
            alert.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          )}
          <p className="font-medium text-sm break-words">{alert.message}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Assets</span>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ฿{totalAssets.toLocaleString()}
          </p>
          <span className="text-sm text-gray-500 mt-1">Calculated from latest asset records</span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Asset Entries</span>
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{records.length}</p>
          <span className="text-sm text-gray-500 mt-1">Tracked value points</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Assets Management</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Manage your savings, investments, and other asset values.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            {hasPermission('assets', 'canCreate') && (
              <button
                id="btn-add-asset"
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                <PlusCircle className="w-4 h-4" />
                Add Asset Value
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">Account <SortIcon column="name" /></div>
                      </th>
                      <th
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center">Date <SortIcon column="date" /></div>
                      </th>
                      <th
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center">Type <SortIcon column="type" /></div>
                      </th>
                      <th
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('bank')}
                      >
                        <div className="flex items-center">Institution <SortIcon column="bank" /></div>
                      </th>
                      <th
                        className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center justify-end">Value <SortIcon column="amount" /></div>
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Note</th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 whitespace-nowrap text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {sortedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-sm text-gray-500">
                          No asset records found. Add one to track your savings.
                        </td>
                      </tr>
                    ) : (
                      sortedRecords.map((record) => {
                        const account = record.account;
                        return (
                          <tr key={record.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                              <div className="flex items-center gap-2">
                                {getAccountIcon(account.type)}
                                {account.name}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                               {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getTypeBadgeColor(account.type)}`}
                              >
                                {account.type}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                              {account.bank ? (
                                <div className="flex items-center gap-2">
                                  {account.bank.color && (
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: account.bank.color }} />
                                  )}
                                  {account.bank.name}
                                </div>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                              {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(record.amount)}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-[150px] truncate">
                              {record.note || '-'}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              {hasPermission('assets', 'canUpdate') && (
                                <button
                                  onClick={() => openEditModal(record)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4 inline" />
                                </button>
                              )}
                              {hasPermission('assets', 'canDelete') && (
                                <button
                                  onClick={() => handleDelete(record.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Asset Record' : 'Add Asset Value'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Account (from My Accounts)</label>
                <select
                  required
                  disabled={isEditing}
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="new">+ Create New Account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              {formData.accountId === 'new' && !isEditing && (
                <div className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/50">
                  <div>
                    <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-1 tracking-wider">New Asset / Account Name</label>
                    <input
                      type="text"
                      placeholder="e.g. ออมสิน บัญชีเงินซื้อรถ"
                      required={formData.accountId === 'new'}
                      value={formData.newAccountName}
                      onChange={(e) => setFormData({ ...formData, newAccountName: e.target.value })}
                      className="w-full rounded-md border border-blue-200 dark:border-blue-800 px-3 py-2 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-1 tracking-wider">Account Type</label>
                      <select
                        value={formData.newAccountType}
                        onChange={(e) => setFormData({ ...formData, newAccountType: e.target.value })}
                        className="w-full rounded-md border border-blue-200 dark:border-blue-800 px-3 py-2 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                      >
                        {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-1 tracking-wider">Institution</label>
                      <select
                        value={formData.bankId}
                        onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                        className="w-full rounded-md border border-blue-200 dark:border-blue-800 px-3 py-2 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                      >
                        <option value="">No Institution</option>
                        {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Value (฿)</label>
                  <input
                    id="input-asset-amount"
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">As of Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (Optional)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="e.g. Current balance after monthly update"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              </div>

              <div className="pt-4 border-t dark:border-gray-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 hover:dark:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-asset"
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  {isEditing ? 'Update Value' : 'Save Value'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
