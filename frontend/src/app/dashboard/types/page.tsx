'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { TransactionType } from '@/types/models';
import { Edit2, Trash2, X, CheckCircle, AlertCircle, Layers } from 'lucide-react';

const BEHAVIORS = [
  { value: 'INCOME', label: 'Income (รายรับ)', color: 'text-green-600' },
  { value: 'EXPENSE', label: 'Expense (รายจ่าย)', color: 'text-red-600' },
  { value: 'SAVING', label: 'Saving (การออม)', color: 'text-blue-600' },
  { value: 'INVESTMENT', label: 'Investment (การลงทุน)', color: 'text-cyan-600' },
  { value: 'GOAL_SAVING', label: 'Goal Saving (ออมมีเป้าหมาย)', color: 'text-indigo-600' },
  { value: 'INTERNAL_TRANSFER', label: 'Internal Transfer (โอนภายใน)', color: 'text-gray-600' },
  { value: 'DEBT', label: 'Debt (หนี้)', color: 'text-purple-600' },
  { value: 'LOAN_BORROW', label: 'Loan Borrow (ยืมเงิน)', color: 'text-orange-600' },
  { value: 'LOAN_REPAY', label: 'Loan Repay (คืนเงิน)', color: 'text-emerald-600' },
];

export default function TransactionTypesPage() {
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTypeId, setCurrentTypeId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    behavior: 'EXPENSE',
    isActive: true
  });

  const { user } = useAuthStore();

  const fetchTypes = useCallback(async () => {
    try {
      const res = await api.get('/types');
      setTypes(res.data.types);
    } catch {
      console.error('Failed to load transaction types');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchTypes();
    };
    init();
  }, [fetchTypes]);

  const showAlert = (message: string, type: 'success' | 'error') => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlert({ message, type });
    alertTimeoutRef.current = setTimeout(() => setAlert(null), 3000);
  };

  const resetForm = () => {
    setFormData({ name: '', behavior: 'EXPENSE', isActive: true });
    setIsEditing(false);
    setCurrentTypeId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (t: TransactionType) => {
    setFormData({
      name: t.name,
      behavior: t.behavior,
      isActive: t.isActive
    });
    setIsEditing(true);
    setCurrentTypeId(t.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? Deleting a type will fail if it's used by categories.")) return;
    try {
      await api.delete(`/types/${id}`);
      showAlert('Type deleted successfully', 'success');
      fetchTypes();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      showAlert(errorResponse.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentTypeId) {
        await api.put(`/types/${currentTypeId}`, formData);
        showAlert('Type updated successfully', 'success');
      } else {
        await api.post('/types', formData);
        showAlert('Type created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchTypes();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      showAlert(errorResponse.response?.data?.error || 'Save failed', 'error');
    }
  };

  if (user?.role !== 'Admin') {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
         <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
         <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
         <p className="text-gray-600 dark:text-gray-400">Only administrators can manage transaction types.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {alert && (
        <div className={`fixed top-4 right-4 z-[110] max-w-[400px] w-full p-4 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
          <p className="font-medium text-sm">{alert.message}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Transaction Types</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Manage high-level transaction types and their system behaviors.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button onClick={openAddModal} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Add New Type
            </button>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Type Name</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">System Behavior</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="relative py-3.5 pl-3 pr-4 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {types.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-gray-400" />
                      {t.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300 font-mono">
                      {t.behavior}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium flex justify-end gap-3">
                      <button onClick={() => openEditModal(t)} className="text-blue-600 hover:text-blue-900"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                 <h2 className="text-lg font-semibold">{isEditing ? 'Edit Type' : 'Create Type'}</h2>
                 <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Type Name (e.g. รายรับ, รายจ่าย)</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border rounded-md px-3 py-2 dark:bg-gray-700" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">System Behavior</label>
                    <select required value={formData.behavior} onChange={(e) => setFormData({...formData, behavior: e.target.value})} className="w-full border rounded-md px-3 py-2 dark:bg-gray-700">
                      {BEHAVIORS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 italic">* This controls how the system calculates balances.</p>
                 </div>
                 <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
