'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Building2, 
  TrendingUp, 
  Coins, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  MoreHorizontal, 
  User,
  Plus,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Account, Bank } from '@/types/models';
import GlassCard from '@/components/ui/GlassCard';


const DEFAULT_LABELS = {
  title: 'บัญชีของฉัน',
  subtitle: 'จัดการสภาพคล่องและวงเงินสินเชื่อ',
  totalAssets: 'สินทรัพย์ทั้งหมด',
  liabilities: 'หนี้สิน',
  personal: 'ส่วนตัว',
  active: 'เปิดใช้งาน',
  addNew: 'เพิ่มบัญชีใหม่',
  noData: 'ไม่พบบัญชี',
  form: {
    name: 'ชื่อบัญชี',
    number: 'เลขที่บัญชี',
    type: 'ประเภท',
    institution: 'สถาบันการเงิน',
    personal: 'บัญชีส่วนตัว',
    status: 'สถานะการใช้งาน',
    cancel: 'ยกเลิก',
    save: 'บันทึกบัญชี'
  }
};

export default function AccountsManagementPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [accountTypes, setAccountTypes] = useState<{label: string, value: string}[]>([]);
  const [labels, setLabels] = useState<any>(DEFAULT_LABELS);
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
      const [accountsRes, banksRes, configRes, uiRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/banks'),
        api.get('/configs', { params: { category: 'DROPDOWNS' } }),
        api.get('/configs', { params: { key: 'UI_LABELS_ACCOUNTS' } })
      ]);
      setAccounts(accountsRes.data.accounts || []);
      setBanks(banksRes.data.banks || []);
      
      const typesConfig = configRes.data.data.find((c: any) => c.key === 'ACCOUNT_TYPES');
      if (typesConfig) {
        setAccountTypes(typesConfig.value);
      }

      if (uiRes.data.data?.[0]?.value) {
        setLabels({
          ...DEFAULT_LABELS,
          ...uiRes.data.data[0].value,
          form: {
            ...DEFAULT_LABELS.form,
            ...(uiRes.data.data[0].value.form || {})
          }
        });
      }
      if (banksRes.data.banks?.length > 0 && formData.bankId === '') {
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
      name: a?.name || '',
      accountNumber: a?.accountNumber || '',
      type: a?.type || 'BANK',
      bankId: a?.bankId || (banks && banks.length > 0 ? banks[0].id : ''),
      isActive: a?.isActive ?? true,
      isPersonal: a?.isPersonal ?? true
    });
    setIsEditing(true);
    setCurrentAccountId(a?.id || null);
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
        return <Building2 className="w-5 h-5 text-emerald" />;
      case 'STOCK':
      case 'INVESTMENT':
        return <TrendingUp className="w-5 h-5 text-blue-400" />;
      case 'GOLD':
        return <Coins className="w-5 h-5 text-yellow-500" />;
      case 'GOAL':
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      case 'EMERGENCY':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'FAMILY':
        return <CheckCircle className="w-5 h-5 text-indigo-500" />;
      case 'LIABILITY':
        return <AlertCircle className="w-5 h-5 text-rose" />;
      default: return <Building2 className="w-5 h-5 text-slate" />;
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

  if (loading && accounts.length === 0) return <div className="p-6">Loading data...</div>;
  if (error && accounts.length === 0) return <div className="p-6 text-rose">{error}</div>;

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
            {labels.title}
          </h1>
          <p className="text-[10px] text-slate mt-1 uppercase font-black tracking-[0.2em]">{labels.subtitle}</p>
        </div>
        
        {hasPermission('accounts', 'canCreate') && (
          <button 
            onClick={openAddModal}
            data-testid="accounts-list-btn-add-account"
            className="flex items-center justify-center gap-3 px-8 py-3 bg-emerald text-navy font-black rounded-full transition-all shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95 group relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
             <Plus size={18} className="relative z-10" />
             <span className="text-xs uppercase tracking-[0.1em] relative z-10">{labels.addNew}</span>
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: labels.totalAssets, count: accounts.filter(a => a.type !== 'LIABILITY').length, icon: TrendingUp, color: 'text-emerald' },
          { label: labels.liabilities, count: accounts.filter(a => a.type === 'LIABILITY').length, icon: AlertCircle, color: 'text-rose' },
          { label: labels.personal, count: accounts.filter(a => a.isPersonal).length, icon: User, color: 'text-blue-400' },
          { label: labels.active, count: accounts.filter(a => a.isActive).length, icon: CheckCircle, color: 'text-emerald' },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-4 flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-white">{stat.count}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Accounts Grid */}
      {sortedAccounts.length === 0 ? (
        <GlassCard className="p-12 text-center rounded-[1.25rem]">
          <Building2 className="w-12 h-12 text-slate/20 mx-auto mb-4" />
          <p className="text-slate font-bold uppercase text-[10px] tracking-widest">{labels.noData}</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedAccounts.map((account, i) => (
            <GlassCard 
              key={account.id} 
              interactive
              className={`p-4 stagger-${(i % 4) + 1}`}
              borderAccent={account.type === 'LIABILITY' ? 'rose' : 'emerald'}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 rounded-lg bg-white/5">
                  {getAccountIcon(account.type)}
                </div>
                <div className="flex gap-1.5">
                  {hasPermission('accounts', 'canUpdate') && (
                    <button onClick={() => openEditModal(account)} className="p-1.5 text-slate hover:text-white transition-colors" title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {hasPermission('accounts', 'canDelete') && (
                    <button onClick={() => handleDelete(account.id)} className="p-1.5 text-slate hover:text-rose transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-base font-black text-white group-hover:text-emerald transition-colors truncate uppercase tracking-tight">
                  {account.name}
                </h3>
                <p className="text-[10px] text-slate font-bold font-mono mt-0.5 opacity-60">
                  {account.accountNumber || '•••• •••• ••••'}
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-[8px] font-black text-slate uppercase tracking-widest">
                  <span className={`w-1.5 h-1.5 rounded-full ${account.isActive ? 'bg-emerald animate-pulse shadow-[0_0_8px_rgba(80,200,120,0.6)]' : 'bg-slate-700'}`} />
                  {accountTypes.find(t => t.value === account.type)?.label || account.type}
                </div>
                {account.bank && (
                   <span className="text-[8px] text-emerald font-black uppercase px-2 py-0.5 rounded-md bg-emerald/10 border border-emerald/20">
                      {account.bank?.name}
                   </span>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 py-8 overflow-y-auto animate-scale-in">
           <div className="bg-navy/90 border border-white/10 rounded-[1.25rem] shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                 <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                   {isEditing ? <Edit2 className="w-5 h-5 text-emerald" /> : <Building2 className="w-5 h-5 text-emerald" />}
                   {isEditing ? 'แก้ไขบัญชี' : 'บัญชีใหม่'}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate hover:text-white transition-colors">
                   <X className="w-6 h-6" />
                 </button>
              </div>
              
              <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">{labels.form.name}</label>
                      <input 
                        type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Savings Primary"
                        data-testid="accounts-form-input-name"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-xs outline-none focus:border-emerald/50 transition-all" 
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">{labels.form.number}</label>
                      <input 
                        type="text" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                        placeholder="Optional"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-xs outline-none focus:border-emerald/50 transition-all" 
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">{labels.form.type}</label>
                        <select 
                        required value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
                        data-testid="accounts-form-sel-type"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-xs outline-none focus:border-emerald/50 appearance-none transition-all"
                      >
                         {accountTypes.map(t => (
                           <option key={t.value} className="bg-navy" value={t.value}>{t.label}</option>
                         ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">{labels.form.institution}</label>
                      <select 
                        required value={formData.bankId} onChange={(e) => setFormData({...formData, bankId: e.target.value})}
                        data-testid="accounts-form-sel-bank"
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-xs outline-none focus:border-emerald/50 appearance-none transition-all"
                      >
                        <option className="bg-navy" value="">None</option>
                        {banks && banks.map(b => (
                          <option className="bg-navy" key={b.id} value={b.id}>{b?.name}</option>
                        ))}
                      </select>
                    </div>
                 </div>

                 <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                     <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                       <div>
                         <p className="text-xs font-black text-white uppercase tracking-tight">{labels.form.personal}</p>
                         <p className="text-[9px] text-slate font-bold uppercase tracking-tighter">Track as personal asset</p>
                       </div>
                       <button 
                         type="button"
                         onClick={() => setFormData({...formData, isPersonal: !formData.isPersonal})}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isPersonal ? 'bg-emerald' : 'bg-white/10'}`}
                       >
                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isPersonal ? 'translate-x-6' : 'translate-x-1'}`} />
                       </button>
                     </div>

                     <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                       <div>
                         <p className="text-xs font-black text-white uppercase tracking-tight">{labels.form.status}</p>
                         <p className="text-[9px] text-slate font-bold uppercase tracking-tighter">Enable system tracking</p>
                       </div>
                       <button 
                         type="button"
                         data-testid="accounts-form-btn-toggle-active"
                         onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-emerald' : 'bg-white/10'}`}
                       >
                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                       </button>
                     </div>
                  </div>

                 <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">{labels.form.cancel}</button>
                    <button type="submit" data-testid="accounts-form-btn-save" className="px-8 py-3 bg-emerald text-navy font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] active:scale-95 transition-all">
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
