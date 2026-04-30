'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';

import { Edit2, Trash2, X, CheckCircle, AlertCircle, Building2, ArrowUpCircle, ArrowDownCircle, MoreHorizontal } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Bank } from '@/types/models';


export default function BanksManagementPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  
  // Alert state
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBankId, setCurrentBankId] = useState<string | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    color: '#3B82F6'
  });



  const fetchBanks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/banks');
      setBanks(res.data.banks);
    } catch {
      console.error('Failed to load banks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const showAlert = (message: string, type: 'success' | 'error') => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlert({ message, type });
    alertTimeoutRef.current = setTimeout(() => setAlert(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      color: '#3B82F6'
    });
    setIsEditing(false);
    setCurrentBankId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (b: Bank) => {
    setFormData({
      code: b.code,
      name: b.name,
      color: b.color || '#3B82F6'
    });
    setIsEditing(true);
    setCurrentBankId(b.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this bank? It will fail if any accounts are using it.")) return;
    try {
      await api.delete(`/banks/${id}`);
      showAlert('Bank deleted successfully', 'success');
      fetchBanks();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      showAlert(errorResponse.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentBankId) {
        await api.put(`/banks/${currentBankId}`, formData);
        showAlert('Bank updated successfully', 'success');
      } else {
        await api.post('/banks', formData);
        showAlert('Bank created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchBanks();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string | { issues?: { message: string }[] } } } };
      const errorData = errorResponse.response?.data?.error;
      const message = (typeof errorData === 'object' && errorData?.issues?.[0]?.message)
        || (typeof errorData === 'string' ? errorData : null)
        || 'Save failed';
      showAlert(message, 'error');
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

  const getSortedBanks = () => {
    if (!sortConfig) return banks;

    return [...banks].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'code':
          aValue = (a.code || '').toLowerCase();
          bValue = (b.code || '').toLowerCase();
          break;
        case 'color':
          aValue = (a.color || '').toLowerCase();
          bValue = (b.color || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedBanks = getSortedBanks();

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <MoreHorizontal className="w-3 h-3 ml-1 opacity-20" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUpCircle className="w-3 h-3 ml-1 text-blue-500" /> : 
      <ArrowDownCircle className="w-3 h-3 ml-1 text-blue-500" />;
  };

  if (loading && banks.length === 0) return <div className="p-6 text-gray-500 dark:text-gray-400">Loading master data...</div>;
  
  // Restricted access UI
  if (!hasPermission('banks', 'canView')) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
         <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
         <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
         <p className="text-gray-600 dark:text-gray-400">You do not have permission to view bank master data.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Alert Pop-up */}
      {alert && (
        <div className={`fixed top-4 right-4 z-[110] max-w-[400px] w-full p-4 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-500" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />}
          <p className="font-medium text-sm break-words">{alert.message}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Bank Master Data</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              A list of supported banks in the system. These will appear in the &quot;Select Bank&quot; dropdown when users create accounts.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            {hasPermission('banks', 'canCreate') && (
              <button 
                onClick={openAddModal}
                data-testid="banks-list-btn-add-bank"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add New Bank
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
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">Bank Name <SortIcon column="name" /></div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('code')}
                      >
                        <div className="flex items-center">Code <SortIcon column="code" /></div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('color')}
                      >
                        <div className="flex items-center">Color Mark <SortIcon column="color" /></div>
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 whitespace-nowrap text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {sortedBanks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-sm text-gray-500">No banks defined in system.</td>
                      </tr>
                    ) : sortedBanks.map((bank) => (
                      <tr key={bank.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {bank.name}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                            {bank.code}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                           <div className="flex items-center gap-2">
                             <div className="w-4 h-4 rounded shadow-sm border border-gray-200" style={{ backgroundColor: bank.color }}></div>
                             <span className="text-gray-500 dark:text-gray-400">{bank.color}</span>
                           </div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {hasPermission('banks', 'canUpdate') && (
                            <button 
                              onClick={() => openEditModal(bank)} 
                              data-testid={`banks-list-btn-edit-${bank.code}`}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4" 
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 inline" />
                            </button>
                          )}
                          {hasPermission('banks', 'canDelete') && (
                            <button 
                              onClick={() => handleDelete(bank.id)} 
                              data-testid={`banks-list-btn-delete-${bank.code}`}
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
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                 <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                   {isEditing ? 'Edit Bank' : 'Create New Bank'}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                    <input 
                      type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Kasikornbank"
                      data-testid="banks-form-input-name"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Code (Unique)</label>
                    <input 
                      type="text" required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g. KBANK"
                      data-testid="banks-form-input-code"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" 
                    />
                 </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand Color</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[
                        { name: 'KBANK', color: '#00A950' },
                        { name: 'SCB', color: '#4E2E7F' },
                        { name: 'BBL', color: '#0047AB' },
                        { name: 'KTB', color: '#00ADEF' },
                        { name: 'BAY', color: '#FFD200' },
                        { name: 'TTB', color: '#EF4822' },
                        { name: 'GSB', color: '#EB198D' },
                        { name: 'UOB', color: '#003679' },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: preset.color })}
                          className={`w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm transition-transform hover:scale-110 active:scale-95 ${formData.color === preset.color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`}
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                    <div className="flex gap-3 items-center">
                       <input 
                         type="color" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})}
                         className="h-10 w-20 p-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer" 
                       />
                       <input 
                         type="text" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})}
                         className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-sm font-mono" 
                       />
                    </div>
                  </div>

                 <div className="pt-4 border-t dark:border-gray-700 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 flex-1">Cancel</button>
                    <button type="submit" data-testid="banks-form-btn-save" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex-1 shadow-sm">Save Bank</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
