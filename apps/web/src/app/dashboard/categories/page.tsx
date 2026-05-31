'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';

import { Edit2, Trash2, Tag, ArrowUpCircle, ArrowDownCircle, MoreHorizontal, AlertCircle, CheckCircle, LayoutGrid, List } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { TransactionCategory, TransactionType } from '@/types/models';
import GlassCard from '@/components/ui/GlassCard';
import GlassModal from '@/components/ui/GlassModal';
import { clsx } from 'clsx';

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const { hasPermission } = usePermissions();
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchInitialData = useCallback(async () => {
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
    } catch {
      console.error('Failed to load categories or types');
    } finally {
      setLoading(false);
    }
  }, [formData.typeId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

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

  const openEditModal = (c: TransactionCategory) => {
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
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      showAlert(errorResponse.response?.data?.error || 'Delete failed', 'error');
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
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      showAlert(errorResponse.response?.data?.error || 'Save failed', 'error');
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
      let aValue: string | number;
      let bValue: string | number;

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

  if (loading && categories.length === 0) return <div className="p-6 text-slate-400">Loading master data...</div>;
  
  if (!hasPermission('categories', 'canView')) {
    return (
      <GlassCard className="p-12 text-center bg-navy/40 max-w-xl mx-auto">
         <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
         <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
         <p className="text-slate-400 text-sm">You do not have permission to view transaction categories.</p>
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden w-full space-y-4">
      {/* Alert Pop-up */}
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
          <h2 className="text-xl font-bold text-white">Transaction Categories</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            Manage master data for income and expense categories. Categorized by dynamic transaction types.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasPermission('categories', 'canCreate') && (
            <button 
              onClick={openAddModal}
              data-testid="categories-list-btn-add-cat"
              className="bg-emerald text-navy px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95"
            >
              Add New Category
            </button>
          )}
        </div>
      </header>

      <GlassCard className="flex-1 overflow-hidden bg-navy/40">
        <div className="h-full overflow-y-auto px-4 custom-scrollbar">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2">
            <thead className="sticky top-0 z-[60] bg-[#001229]">
              <tr>
                <th className="px-6 py-4 text-slate-400 uppercase font-bold text-[10px] cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center">Category Name <SortIcon column="name" /></div>
                </th>
                <th className="px-6 py-4 text-slate-400 uppercase font-bold text-[10px] cursor-pointer" onClick={() => handleSort('type')}>
                  <div className="flex items-center">Type <SortIcon column="type" /></div>
                </th>
                <th className="px-6 py-4 text-slate-400 uppercase font-bold text-[10px] cursor-pointer" onClick={() => handleSort('isActive')}>
                  <div className="flex items-center">Status <SortIcon column="isActive" /></div>
                </th>
                <th className="px-6 py-4 text-slate-400 uppercase font-bold text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs font-bold text-slate-400">No categories defined in system.</td>
                </tr>
              ) : sortedCategories.map((cat) => (
                <tr key={cat.id} className="bg-white/[0.02] hover:bg-white/[0.06] transition-all group">
                  <td className="px-6 py-3 rounded-l-xl text-white font-bold">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      {cat.name}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-white">
                     <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                       cat.type?.behavior === 'INCOME' ? 'bg-emerald/10 text-emerald' : 
                       cat.type?.behavior === 'SAVING' || cat.type?.behavior === 'GOAL_SAVING' ? 'bg-blue-500/10 text-blue-400' :
                       cat.type?.behavior === 'INVESTMENT' ? 'bg-cyan-500/10 text-cyan-400' :
                       cat.type?.behavior === 'DEBT' ? 'bg-rose-500/10 text-rose-400' :
                       'bg-slate-500/10 text-slate-400'
                     }`}>
                       {cat.type?.name || 'Unset'}
                     </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      cat.isActive ? 'bg-emerald/10 text-emerald' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right rounded-r-xl">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hasPermission('categories', 'canUpdate') && (
                        <button 
                          onClick={() => openEditModal(cat)} 
                          data-testid={`categories-list-btn-edit-${cat.name}`}
                          className="text-slate-400 hover:text-blue-400"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {hasPermission('categories', 'canDelete') && (
                        <button 
                          onClick={() => handleDelete(cat.id)} 
                          data-testid={`categories-list-btn-delete-${cat.name}`}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Modal for Create/Edit */}
      <GlassModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditing ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
           <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category Name</label>
              <input 
                type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. อาหาร, เงินเดือน"
                data-testid="categories-form-input-name"
                className="w-full bg-navy/50 border border-white/5 rounded-lg py-2 px-3 text-xs text-white outline-none focus:border-white/20 transition-all font-bold" 
              />
           </div>
           
           <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Transaction Type</label>
              <select 
                required value={formData.typeId} onChange={(e) => setFormData({...formData, typeId: e.target.value})}
                data-testid="categories-form-sel-type"
                className="w-full bg-navy/80 border border-white/5 rounded-lg py-2 px-3 text-xs text-slate-300 outline-none focus:border-white/20 transition-all"
              >
                <option value="" disabled>Select Type</option>
                {types.map(t => (
                  <option key={t.id} value={t.id} className="bg-[#001229]">{t.name} ({t.behavior})</option>
                ))}
              </select>
           </div>

           <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <label className="text-[11px] font-bold text-slate-400 flex flex-col">
                <span>Status</span>
                <span className="text-[9px] font-normal text-slate-500">Enable/Disable in dropdowns</span>
              </label>
              <button 
                type="button"
                onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${formData.isActive ? 'bg-emerald' : 'bg-white/10'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
           </div>

           <div className="pt-4 border-t border-white/5 flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="py-2 bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 text-xs font-bold rounded-lg transition-all active:scale-95 flex-1">Cancel</button>
              <button type="submit" data-testid="categories-form-btn-save" className="py-2 bg-emerald text-navy text-xs font-black uppercase tracking-widest rounded-lg hover:shadow-[0_0_20px_rgba(80,200,120,0.3)] transition-all active:scale-95 flex-1">Save Category</button>
           </div>
        </form>
      </GlassModal>
    </div>
  );
}
