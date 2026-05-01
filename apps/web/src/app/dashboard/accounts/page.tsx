'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Edit2, Trash2, X, CheckCircle, AlertCircle, Building2, TrendingUp, Coins, ArrowUpCircle, ArrowDownCircle, MoreHorizontal, User } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Account, Bank } from '@/types/models';


export default function AccountsManagementPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  
  // Alert state
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    type: 'BANK', // BANK, STOCK, GOLD
    bankId: '',
    isActive: true,
    isPersonal: true
  });

  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();

  const fetchAccountsAndBanks = async () => {
    try {
      setLoading(true);
      const [accountsRes, banksRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/banks')
      ]);
      setAccounts(accountsRes.data.accounts);
      setBanks(banksRes.data.banks);
      
      // Initialize bankId if banks exist
      if (banksRes.data.banks.length > 0 && formData.bankId === '') {
        setFormData(prev => ({ ...prev, bankId: banksRes.data.banks[0].id }));
      }
    } catch {
      setError('Failed to load accounts or banks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountsAndBanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showAlert = (message: string, type: 'success' | 'error') => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlert({ message, type });
    alertTimeoutRef.current = setTimeout(() => setAlert(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      accountNumber: '',
      type: 'BANK',
      bankId: banks.length > 0 ? banks[0].id : '',
      isActive: true,
      isPersonal: true
    });
    setIsEditing(false);
    setCurrentAccountId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (a: Account) => {
    setFormData({
      name: a.name,
      accountNumber: a.accountNumber || '',
      type: a.type,
      bankId: a.bankId || (banks.length > 0 ? banks[0].id : ''),
      isActive: a.isActive,
      isPersonal: a.isPersonal !== undefined ? a.isPersonal : true
    });
    setIsEditing(true);
    setCurrentAccountId(a.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    try {
      await api.delete(`/accounts/${id}`);
      showAlert('Account deleted successfully', 'success');
      fetchAccountsAndBanks();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      showAlert(errorResponse.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentAccountId) {
        await api.put(`/accounts/${currentAccountId}`, formData);
        showAlert('Account updated successfully', 'success');
      } else {
        await api.post('/accounts', formData);
        showAlert('Account created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchAccountsAndBanks();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string | { issues?: { message: string }[] } } } };
      const errorData = errorResponse.response?.data?.error;
      const message = (typeof errorData === 'object' && errorData?.issues?.[0]?.message)
        || (typeof errorData === 'string' ? errorData : null)
        || 'Save failed';
      showAlert(message as string, 'error');
    }
  };

  const getAccountIcon = (type: string) => {
    switch(type) {
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
      case 'LIABILITY':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return <Building2 className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedAccounts = () => {
    if (!sortConfig) return accounts;

    return [...accounts].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'accountNumber':
          aValue = (a.accountNumber || '').toLowerCase();
          bValue = (b.accountNumber || '').toLowerCase();
          break;
        case 'type':
          aValue = (a.type || '').toLowerCase();
          bValue = (b.type || '').toLowerCase();
          break;
        case 'bank':
          aValue = (a.bank?.name || '').toLowerCase();
          bValue = (b.bank?.name || '').toLowerCase();
          break;
        case 'isActive':
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedAccounts = getSortedAccounts();

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <MoreHorizontal className="w-3 h-3 ml-1 opacity-20" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUpCircle className="w-3 h-3 ml-1 text-blue-500" /> : 
      <ArrowDownCircle className="w-3 h-3 ml-1 text-blue-500" />;
  };

  if (loading && accounts.length === 0) return <div className="p-6">Loading data...</div>;
  if (error && accounts.length === 0) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="relative">
      {/* Alert Pop-up */}
      {alert && (
        <div className={`fixed top-4 right-4 z-50 max-w-[400px] w-full p-4 rounded-lg shadow-lg flex items-center gap-3 transition-all ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-500" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />}
          <p className="font-medium text-sm break-words">{alert.message}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">My Accounts</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Manage your Bank, Investment (Stock), and Gold accounts here.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            {hasPermission('accounts', 'canCreate') && (
              <button 
                onClick={openAddModal}
                data-testid="accounts-list-btn-add-account"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Add Account
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
                        scope="col" 
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">Account Name <SortIcon column="name" /></div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('accountNumber')}
                      >
                        <div className="flex items-center">Account Number <SortIcon column="accountNumber" /></div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center">Type <SortIcon column="type" /></div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('bank')}
                      >
                        <div className="flex items-center">Institution <SortIcon column="bank" /></div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('isActive')}
                      >
                        <div className="flex items-center justify-center">Status <SortIcon column="isActive" /></div>
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 whitespace-nowrap text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {sortedAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-sm text-gray-500">No accounts found. Create one to get started.</td>
                      </tr>
                    ) : sortedAccounts.map((account) => (
                      <tr key={account.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          <div className="flex items-center gap-2">
                            {getAccountIcon(account.type)}
                            {account.name}
                            {account.isPersonal && <span title="Personal Account"><User className="w-3 h-3 text-blue-400" /></span>}
                          </div>
                          {user?.role === 'Admin' && <div className="text-xs text-gray-400 font-normal mt-1">Owner: {account.user?.firstName} {account.user?.lastName}</div>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {account.accountNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            ['BANK', 'CASHFLOW', 'INTERNAL', 'SAVING'].includes(account.type) ? 'bg-blue-50 text-blue-700 ring-blue-700/10' : 
                            ['STOCK', 'INVESTMENT'].includes(account.type) ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' : 
                            ['GOLD'].includes(account.type) ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                            ['EMERGENCY', 'LIABILITY'].includes(account.type) ? 'bg-red-50 text-red-700 ring-red-600/10' :
                            'bg-purple-50 text-purple-700 ring-purple-600/10'
                          }`}>
                            {account.type}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {account.bank ? (
                             <div className="flex items-center gap-2">
                               {account.bank.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: account.bank.color }}></div>}
                               {account.bank.name}
                             </div>
                          ) : (
                             <span>-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                          {account.isActive ? (
                             <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">Active</span>
                          ) : (
                             <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">Inactive</span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {hasPermission('accounts', 'canUpdate') && (
                            <button 
                              onClick={() => openEditModal(account)} 
                              data-testid={`accounts-list-btn-edit-${account.name}`}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4" 
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 inline" />
                            </button>
                          )}
                          {hasPermission('accounts', 'canDelete') && (
                            <button 
                              onClick={() => handleDelete(account.id)} 
                              data-testid={`accounts-list-btn-delete-${account.name}`}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" 
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
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
                   {isEditing ? 'Edit Account' : 'Create New Account'}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-5 space-y-5">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Display Name</label>
                   <input 
                     type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                     placeholder="e.g. My SCB Savings, Dime Gold"
                     data-testid="accounts-form-input-name"
                     className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                   />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
                    <input 
                      type="text" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                      placeholder="e.g. 000-0-00000-0 (Optional)"
                      data-testid="accounts-form-input-number"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>

                 <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                       <select 
                        required value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
                        data-testid="accounts-form-sel-type"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                         <option value="CASHFLOW">Cashflow</option>
                         <option value="SAVING">Saving</option>
                         <option value="INVESTMENT">Investment</option>
                         <option value="INTERNAL">Internal Transfer</option>
                         <option value="EMERGENCY">Emergency Fund</option>
                         <option value="GOAL">Financial Goal</option>
                         <option value="FAMILY">Family Helper</option>
                         <option value="LIABILITY">Liability / Credit</option>
                         <option value="BANK">Legacy Bank Account</option>
                         <option value="STOCK">Legacy Stock</option>
                         <option value="GOLD">Legacy Gold</option>
                      </select>
                    </div>
                  </div>

                 <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Institution (Bank)</label>
                    <select 
                      required value={formData.bankId} onChange={(e) => setFormData({...formData, bankId: e.target.value})}
                      data-testid="accounts-form-sel-bank"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2 pb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex flex-col">
                      <span>Personal Account</span>
                      <span className="text-xs text-gray-500 font-normal">Is this your personal account?</span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, isPersonal: !formData.isPersonal})}
                      data-testid="accounts-form-btn-toggle-personal"
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.isPersonal ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.isPersonal ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                 <div className="flex items-center justify-between pt-2 pb-2">
                   <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex flex-col">
                     <span>Account Status</span>
                     <span className="text-xs text-gray-500 font-normal">Is this account currently active?</span>
                   </label>
                   <button 
                     type="button"
                     onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                     data-testid="accounts-form-btn-toggle-status"
                     className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                   >
                     <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                   </button>
                 </div>

                 <div className="pt-4 border-t dark:border-gray-700 flex justify-end gap-3">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 hover:dark:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">Cancel</button>
                   <button type="submit" data-testid="accounts-form-btn-save" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">Save Account</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
