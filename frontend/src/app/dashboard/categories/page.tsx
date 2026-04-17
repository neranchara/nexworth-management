'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Edit2, Trash2, X, CheckCircle, AlertCircle, Tag, Layers, ArrowUpCircle, ArrowDownCircle, MoreHorizontal } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const { hasPermission } = usePermissions();
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  
  // Alert state
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    typeId: '',
    isActive: true
  });

  const { user } = useAuthStore();

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catRes, typeRes] = await Promise.all([
        api.get('/categories'),
        api.get('/types')
      ]);
      setCategories(catRes.data.categories);
      const typesList = typeRes.data.types;
      setTypes(typesList);
      
      if (typesList.length > 0 && !formData.typeId) {
        setFormData(prev => ({ ...prev, typeId: typesList[0].id }));
      }
    } catch (err) {
      setError('Failed to load categories or types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showAlert = (message: string, type: 'success' | 'error') => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlert({ message, type });
    alertTimeoutRef.current = setTimeout(() => setAlert(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      typeId: types.length > 0 ? types[0].id : '',
      isActive: true
    });
    setIsEditing(false);
    setCurrentCategoryId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setFormData({
      name: c.name,
      typeId: c.typeId,
      isActive: c.isActive
    });
    setIsEditing(true);
    setCurrentCategoryId(c.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.delete(`/categories/${id}`);
      showAlert('Category deleted successfully', 'success');
      fetchInitialData();
    } catch (err: any) {
      showAlert(err.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentCategoryId) {
        await api.put(`/categories/${currentCategoryId}`, formData);
        showAlert('Category updated successfully', 'success');
      } else {
        await api.post('/categories', formData);
        showAlert('Category created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      showAlert(err.response?.data?.error || 'Save failed', 'error');
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

  const getSortedCategories = () => {
    if (!sortConfig) return categories;

    return [...categories].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'type':
          aValue = (a.type?.name || '').toLowerCase();
          bValue = (b.type?.name || '').toLowerCase();
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

  const sortedCategories = getSortedCategories();

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <MoreHorizontal className="w-3 h-3 ml-1 opacity-20" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUpCircle className="w-3 h-3 ml-1 text-blue-500" /> : 
      <ArrowDownCircle className="w-3 h-3 ml-1 text-blue-500" />;
  };

  if (loading && categories.length === 0) return <div className="p-6 text-gray-500 dark:text-gray-400">Loading master data...</div>;
  
  if (!hasPermission('categories', 'canView')) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
         <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
         <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
         <p className="text-gray-600 dark:text-gray-400">You do not have permission to view transaction categories.</p>
      </div>
    );
  }

  const getTypeBadge = (behavior: string) => {
    switch (behavior) {
        case 'INCOME': return 'bg-green-100 text-green-800';
        case 'EXPENSE': return 'bg-red-100 text-red-800';
        case 'SAVING': return 'bg-blue-100 text-blue-800';
        case 'INVESTMENT': return 'bg-cyan-100 text-cyan-800';
        case 'GOAL_SAVING': return 'bg-indigo-100 text-indigo-800';
        case 'DEBT': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Transaction Categories</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Manage master data for income and expense categories. Categorized by dynamic transaction types.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            {hasPermission('categories', 'canCreate') && (
              <button 
                onClick={openAddModal}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add New Category
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
                        <div className="flex items-center">Category Name <SortIcon column="name" /></div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center">Type <SortIcon column="type" /></div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('isActive')}
                      >
                        <div className="flex items-center">Status <SortIcon column="isActive" /></div>
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 whitespace-nowrap text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {sortedCategories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-sm text-gray-500">No categories defined in system.</td>
                      </tr>
                    ) : sortedCategories.map((cat) => (
                      <tr key={cat.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-gray-400" />
                            {cat.name}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                           <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getTypeBadge(cat.type?.behavior)}`}>
                             {cat.type?.name || 'Unset'}
                           </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {hasPermission('categories', 'canUpdate') && (
                            <button onClick={() => openEditModal(cat)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4">
                              <Edit2 className="w-4 h-4 inline" />
                            </button>
                          )}
                          {hasPermission('categories', 'canDelete') && (
                            <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-blue-300">
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
                   {isEditing ? 'Edit Category' : 'Create New Category'}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
                    <input 
                      type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. อาหาร, เงินเดือน"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Type</label>
                    <select 
                      required value={formData.typeId} onChange={(e) => setFormData({...formData, typeId: e.target.value})}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Select Type</option>
                      {types.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.behavior})</option>
                      ))}
                    </select>
                 </div>

                 <div className="flex items-center justify-between pt-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex flex-col">
                      <span>Status</span>
                      <span className="text-xs font-normal text-gray-500">Enable/Disable in dropdowns</span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.isActive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                 </div>

                 <div className="pt-4 border-t dark:border-gray-700 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 flex-1">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex-1 shadow-sm">Save Category</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
