'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';

import { Edit2, Trash2, X, CheckCircle, AlertCircle, Building2, ArrowUpCircle, ArrowDownCircle, MoreHorizontal, Plus, Loader2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Bank } from '@/types/models';
import GlassCard from '@/components/ui/GlassCard';


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
      <ArrowUpCircle className="w-3 h-3 ml-1 text-emerald" /> : 
      <ArrowDownCircle className="w-3 h-3 ml-1 text-emerald" />;
  };

  if (loading && banks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-emerald" />
        <p className="text-[10px] text-slate mt-2 uppercase tracking-widest font-black">Loading master data...</p>
      </div>
    );
  }
  
  // Restricted access UI
  if (!hasPermission('banks', 'canView')) {
    return (
      <GlassCard className="p-12 rounded-2xl text-center max-w-2xl mx-auto mt-12 animate-scale-in">
         <AlertCircle className="w-16 h-16 text-rose mx-auto mb-6" />
         <h1 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">Access Denied</h1>
         <p className="text-[10px] text-slate font-bold uppercase tracking-widest">You do not have permission to view bank master data.</p>
      </GlassCard>
    );
  }

  return (
    <div className="relative min-h-screen pb-12 animate-fade-in-up">
      {/* Alert Pop-up */}
      {alert && (
        <div className={`fixed top-4 right-4 z-[110] max-w-[400px] w-full p-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border animate-scale-in ${alert.type === 'success' ? 'bg-emerald/20 text-emerald border-emerald/30' : 'bg-rose/20 text-rose border-rose/30'}`}>
          {alert.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald" /> : <AlertCircle className="w-5 h-5 text-rose" />}
          <p className="font-bold text-xs uppercase tracking-wider">{alert.message}</p>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3 uppercase">
            <Building2 className="w-8 h-8 text-emerald" />
            Bank Master Data
          </h1>
          <p className="text-[10px] text-slate mt-1 uppercase font-black tracking-[0.2em]">
            A list of supported banks in the system for account creation
          </p>
        </div>
        
        {hasPermission('banks', 'canCreate') && (
          <button 
            onClick={openAddModal}
            data-testid="banks-list-btn-add-bank"
            className="flex items-center justify-center gap-3 px-8 py-3 bg-emerald text-navy font-black rounded-full transition-all shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus size={18} className="relative z-10" />
            <span className="text-xs uppercase tracking-[0.1em] relative z-10">Add New Bank</span>
          </button>
        )}
      </div>
      
      {/* Table Card */}
      <GlassCard className="overflow-hidden bg-navy/40">
        <div className="overflow-x-auto px-4 py-2 custom-scrollbar">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400 uppercase font-bold text-[10px]">
                <th 
                  scope="col" 
                  className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">Bank Name <SortIcon column="name" /></div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center">Code <SortIcon column="code" /></div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('color')}
                >
                  <div className="flex items-center">Color Mark <SortIcon column="color" /></div>
                </th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedBanks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate font-bold">No banks defined in system.</td>
                </tr>
              ) : sortedBanks.map((bank) => (
                <tr key={bank.id} className="bg-white/[0.02] hover:bg-white/[0.06] transition-all group">
                  <td className="whitespace-nowrap py-3 px-6 text-sm font-bold text-white rounded-l-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/[0.02]" style={{ color: bank.color }}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      {bank.name}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-xs text-slate-300">
                    <span className="font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[10px] text-emerald font-bold">
                      {bank.code}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-xs">
                     <div className="flex items-center gap-2">
                       <div className="w-3.5 h-3.5 rounded shadow-sm border border-white/10" style={{ backgroundColor: bank.color }}></div>
                       <span className="text-slate-400 font-mono text-[10px]">{bank.color}</span>
                     </div>
                  </td>
                  <td className="relative whitespace-nowrap py-3 px-6 text-right text-xs font-medium rounded-r-xl">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hasPermission('banks', 'canUpdate') && (
                        <button 
                          onClick={() => openEditModal(bank)} 
                          data-testid={`banks-list-btn-edit-${bank.code}`}
                          className="text-slate-400 hover:text-blue-400 transition-colors" 
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                      )}
                      {hasPermission('banks', 'canDelete') && (
                        <button 
                          onClick={() => handleDelete(bank.id)} 
                          data-testid={`banks-list-btn-delete-${bank.code}`}
                          className="text-slate-400 hover:text-rose transition-colors" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 inline" />
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
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 animate-scale-in">
           <div className="bg-navy/90 border border-white/10 rounded-[1.25rem] shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                 <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                   {isEditing ? <Edit2 className="w-5 h-5 text-emerald" /> : <Building2 className="w-5 h-5 text-emerald" />}
                   {isEditing ? 'Edit Bank' : 'Create New Bank'}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">Bank Name</label>
                    <input 
                      type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Kasikornbank"
                      data-testid="banks-form-input-name"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-xs outline-none focus:border-emerald/50 transition-all" 
                    />
                 </div>
                 
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">Bank Code (Unique)</label>
                    <input 
                      type="text" required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g. KBANK"
                      data-testid="banks-form-input-code"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-xs outline-none focus:border-emerald/50 font-mono transition-all" 
                    />
                 </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">Brand Color</label>
                    <div className="flex flex-wrap gap-2 mb-3 bg-white/5 p-3 rounded-xl border border-white/5">
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
                          className={`w-6 h-6 rounded-full border border-white/10 shadow-sm transition-all hover:scale-110 active:scale-95 ${formData.color === preset.color ? 'ring-2 ring-offset-2 ring-emerald scale-110' : ''}`}
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                    <div className="flex gap-3 items-center">
                       <input 
                         type="color" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})}
                         className="h-10 w-20 p-1 rounded-xl border border-white/5 bg-white/5 cursor-pointer outline-none" 
                       />
                       <input 
                         type="text" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})}
                         className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-white font-mono text-xs outline-none focus:border-emerald/50" 
                       />
                    </div>
                  </div>

                 <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Cancel</button>
                    <button type="submit" data-testid="banks-form-btn-save" className="px-8 py-3 bg-emerald text-navy font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] active:scale-95 transition-all">Save Bank</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
