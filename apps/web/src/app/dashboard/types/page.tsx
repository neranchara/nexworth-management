'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { TransactionType } from '@/types/models';
import { Edit2, Trash2, X, CheckCircle, AlertCircle, Layers, Plus } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const DEFAULT_BEHAVIORS = [
  { value: 'INCOME', label: 'รายรับ (Income)', color: 'text-emerald' },
  { value: 'EXPENSE', label: 'รายจ่าย (Expense)', color: 'text-rose' },
  { value: 'SAVING', label: 'การออม (Saving)', color: 'text-blue-400' },
  { value: 'INVESTMENT', label: 'การลงทุน (Investment)', color: 'text-cyan-400' },
  { value: 'GOAL_SAVING', label: 'ออมมีเป้าหมาย (Goal Saving)', color: 'text-indigo-400' },
  { value: 'INTERNAL_TRANSFER', label: 'โอนเงินภายใน (Internal Transfer)', color: 'text-slate' },
  { value: 'DEBT', label: 'หนี้สิน (Debt)', color: 'text-purple-400' },
  { value: 'LOAN_BORROW', label: 'ยืมเงิน (Loan Borrow)', color: 'text-orange-400' },
  { value: 'LOAN_REPAY', label: 'คืนเงิน (Loan Repay)', color: 'text-emerald' },
];

const DEFAULT_LABELS = {
  title: 'ประเภทพฤติกรรม',
  subtitle: 'ตั้งค่ากฎการคำนวณของระบบ',
  addNew: 'เพิ่มประเภทใหม่',
  logic: 'ตรรกะระบบ',
  active: 'เปิดใช้งาน',
  inactive: 'ปิดใช้งาน',
  edit: 'แก้ไขพฤติกรรม',
  create: 'พฤติกรรมใหม่',
  form: {
    name: 'ชื่อประเภท',
    behavior: 'พฤติกรรมระบบ',
    status: 'สถานะการใช้งาน',
    cancel: 'ยกเลิก',
    save: 'บันทึกพฤติกรรม'
  }
};

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

  const [behaviors, setBehaviors] = useState<any[]>(DEFAULT_BEHAVIORS);
  const [labels, setLabels] = useState<any>(DEFAULT_LABELS);

  const fetchTypes = useCallback(async () => {
    try {
      const [typeRes, configRes] = await Promise.all([
        api.get('/types'),
        api.get('/configs', { params: { category: 'UI_TRANSLATIONS' } }),
        api.get('/configs', { params: { key: 'TRANSACTION_BEHAVIORS' } }) // specifically for behaviors
      ]);
      
      setTypes(typeRes.data.types || []);
      
      // Load UI Labels
      const uiLabels = configRes.data.data?.find((c: any) => c.key === 'UI_LABELS_TYPES');
      if (uiLabels) setLabels(uiLabels.value);

      // Load Behaviors
      const dbBehaviors = configRes.data.data?.find((c: any) => c.key === 'TRANSACTION_BEHAVIORS');
      if (dbBehaviors) setBehaviors(dbBehaviors.value);
      
    } catch {
      console.error('Failed to load transaction types or config');
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
      <GlassCard className="p-12 rounded-2xl text-center max-w-2xl mx-auto mt-12 animate-scale-in">
         <AlertCircle className="w-16 h-16 text-rose mx-auto mb-6" />
         <h1 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">Access Denied</h1>
         <p className="text-[10px] text-slate font-bold uppercase tracking-widest">Administrators Only Area</p>
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
            <Layers className="w-8 h-8 text-emerald" />
            {labels.title}
          </h1>
          <p className="text-[10px] text-slate mt-1 uppercase font-black tracking-[0.2em]">{labels.subtitle}</p>
        </div>
        
        <button 
          onClick={openAddModal}
          data-testid="types-list-btn-add-type"
          className="flex items-center justify-center gap-3 px-8 py-3 bg-emerald text-navy font-black rounded-full transition-all shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus size={18} className="relative z-10" />
          <span className="text-xs uppercase tracking-[0.1em] relative z-10">{labels.addNew}</span>
        </button>
      </div>

      {/* Behaviors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {types.map((t, i) => {
          const behaviorInfo = behaviors.find(b => b.value === t.behavior);
          const behaviorColor = behaviorInfo?.color.replace('text-', 'bg-') || 'bg-slate';
          
          return (
            <GlassCard 
              key={t.id} 
              interactive
              className={`p-4 group stagger-${(i % 4) + 1}`}
              borderAccent={t.behavior === 'INCOME' ? 'emerald' : t.behavior === 'EXPENSE' ? 'rose' : 'none'}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${behaviorColor}/10 ${behaviorInfo?.color}`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(t)} className="p-1.5 text-slate hover:text-white transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate hover:text-rose transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-base font-black text-white group-hover:text-emerald transition-colors uppercase tracking-tight truncate">
                  {t.name}
                </h3>
                <div className="mt-1 space-y-1">
                  <p className="text-[8px] uppercase tracking-widest text-slate/40 font-black">{labels.logic}</p>
                  <code className="text-[9px] text-emerald bg-emerald/5 px-2 py-0.5 rounded border border-emerald/10 font-bold">
                    {t.behavior}
                  </code>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-[8px] font-black text-slate uppercase tracking-widest">
                  <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? 'bg-emerald animate-pulse shadow-[0_0_8px_rgba(80,200,120,0.6)]' : 'bg-slate-700'}`} />
                  {t.isActive ? labels.active : labels.inactive}
                </div>
                <div className="text-[9px] text-slate font-bold italic opacity-60">
                  {behaviorInfo?.label}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 animate-scale-in">
           <div className="bg-navy/90 border border-white/10 rounded-[1.25rem] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                 <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                   {isEditing ? <Edit2 className="w-5 h-5 text-emerald" /> : <Layers className="w-5 h-5 text-emerald" />}
                   {isEditing ? labels.edit : labels.create}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate hover:text-white transition-colors">
                   <X className="w-6 h-6" />
                 </button>
              </div>
              
              <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">{labels.form.name}</label>
                    <input 
                      type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Daily Expense"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-xs outline-none focus:border-emerald/50 transition-all" 
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">{labels.form.behavior}</label>
                    <select 
                      required value={formData.behavior} onChange={(e) => setFormData({...formData, behavior: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-xs outline-none focus:border-emerald/50 appearance-none transition-all"
                    >
                      {behaviors.map(b => (
                        <option className="bg-navy" key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </select>
                    <div className="p-3 bg-emerald/5 border border-emerald/10 rounded-lg">
                      <p className="text-[9px] text-emerald font-bold leading-relaxed italic opacity-80">
                        * Careful: Changing behavior affects how the balance is calculated in all linked categories.
                      </p>
                    </div>
                 </div>

                 <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-tight">{labels.form.status}</p>
                      <p className="text-[9px] text-slate font-bold uppercase tracking-tighter">Enable system rule</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-emerald' : 'bg-white/10'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                 </div>

                 <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">{labels.form.cancel}</button>
                    <button type="submit" className="px-8 py-3 bg-emerald text-navy font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] active:scale-95 transition-all">
                      {isEditing ? labels.form.save : labels.form.save}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
