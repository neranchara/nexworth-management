'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Edit2, Trash2, X, CheckCircle, AlertCircle, Plus, CreditCard, ArrowUpCircle, ArrowDownCircle, MoreHorizontal, Search, Landmark } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Account, Bank, FinancialRecord } from '@/types/models';
import GlassCard from '@/components/ui/GlassCard';
import GlassModal from '@/components/ui/GlassModal';


export default function LiabilitiesPage() {
  const t = useTranslations('liabilities');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { hasPermission } = usePermissions();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [dashboardStats, setDashboardStats] = useState<{ summary: { totalLiabilities: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  const [accountTypes, setAccountTypes] = useState<any[]>([]);

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
    newAccountType: 'LIABILITY',
    bankId: '',
    amount: 0,
    type: 'LIABILITY' as 'ASSET' | 'LIABILITY',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [recordsRes, accountsRes, banksRes, statsRes, configRes] = await Promise.all([
        api.get('/financial-records?type=LIABILITY'),
        api.get('/accounts?type=LIABILITY'),
        api.get('/banks'),
        api.get('/dashboard/stats'),
        api.get('/configs', { params: { category: 'DROPDOWNS' } }),
      ]);

      const typesConfig = configRes.data.data.find((c: any) => c.key === 'ACCOUNT_TYPES');
      let liabilityTypes = ['LIABILITY'];
      if (typesConfig) {
        setAccountTypes(typesConfig.value);
        liabilityTypes = typesConfig.value.filter((t: any) => t.category === 'LIABILITY').map((t: any) => t.value);
      }

      setRecords(recordsRes.data.records);
      const allAccounts = accountsRes.data.accounts || [];
      const liabilityAccounts = allAccounts.filter((acc: Account) => liabilityTypes.includes(acc.type));
      setAccounts(liabilityAccounts);
      setBanks(banksRes.data.banks);
      setDashboardStats(statsRes.data);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showAlert = (message: string, type: 'success' | 'error') => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlert({ message, type });
    alertTimeoutRef.current = setTimeout(() => setAlert(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      accountId: accounts.length > 0 ? accounts[0].id : 'new',
      newAccountName: '',
      newAccountType: 'LIABILITY',
      bankId: '',
      amount: 0,
      type: 'LIABILITY',
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

  const openEditModal = (r: FinancialRecord) => {
    setFormData({
      accountId: r.accountId,
      newAccountName: '',
      newAccountType: 'LIABILITY',
      bankId: r.account?.bankId || '',
      amount: Math.abs(r.amount), // Display as positive for UI
      type: r.type,
      note: r.note || '',
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setIsEditing(true);
    setCurrentRecordId(r.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirm.delete'))) return;
    try {
      await api.delete(`/financial-records/${id}`);
      showAlert(t('alert.removed'), 'success');
      fetchData();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      showAlert(errorResponse.response?.data?.error || t('alert.removeFailed'), 'error');
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
        amount: Number(formData.amount), // Backend should handle the sign or UI can decide
        date: new Date(formData.date).toISOString(),
      };

      if (isEditing && currentRecordId) {
        await api.put(`/financial-records/${currentRecordId}`, payload);
        showAlert(t('alert.updated'), 'success');
      } else {
        await api.post('/financial-records', payload);
        showAlert(t('alert.added'), 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string | { issues?: { message: string }[] } } } };
      const errorData = errorResponse.response?.data?.error;
      const message = (typeof errorData === 'object' && errorData?.issues?.[0]?.message)
        || (typeof errorData === 'string' ? errorData : null)
        || t('alert.saveFailed');
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

  const getSortedRecords = () => {
    if (!sortConfig) return records;

    return [...records].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case 'name':
          aValue = (a.account?.name || '').toLowerCase();
          bValue = (b.account?.name || '').toLowerCase();
          break;
        case 'date':
          aValue = a.date ? new Date(a.date).getTime() : 0;
          bValue = b.date ? new Date(b.date).getTime() : 0;
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
    if (sortConfig?.key !== column) return <MoreHorizontal className="w-3 h-3 ml-1 opacity-20 inline" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUpCircle className="w-3 h-3 ml-1 text-emerald inline" /> : 
      <ArrowDownCircle className="w-3 h-3 ml-1 text-emerald inline" />;
  };

  const totalLiabilities = dashboardStats?.summary?.totalLiabilities || 0;

  if (loading && records.length === 0) return <div className="p-6 text-white">{t('loading')}</div>;
  if (error && records.length === 0) return <div className="p-6 text-rose-400">{error}</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden w-full space-y-4">
      {/* Alert */}
      {alert && (
        <div className={`fixed top-4 right-4 z-[200] max-w-[400px] w-full p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
          alert.type === 'success' ? 'bg-emerald/10 border-emerald/20 text-emerald' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-bold text-sm">{alert.message}</p>
        </div>
      )}

      {/* Header — same structure as Transaction History */}
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white">{t('title')}</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest -mt-0.5">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest px-2">
            {t('totalLiabilities')}: <span className="text-rose-400 text-sm font-black">฿{totalLiabilities.toLocaleString()}</span>
          </span>
          {hasPermission('liabilities', 'canCreate') && (
            <button
              onClick={openAddModal}
              data-testid="liabilities-list-btn-add-liab"
              className="bg-emerald text-navy px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> {t('addNew')}
            </button>
          )}
        </div>
      </header>

      {/* Unified Filter Bar — same as Transaction History */}
      <GlassCard className="p-3 flex flex-wrap gap-3 items-center shrink-0 bg-navy/40">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
          <input
            type="text" placeholder={t('search')}
            className="w-full bg-navy/50 border border-white/5 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-emerald placeholder:text-slate-500 transition-all"
          />
        </div>
        <select className="bg-navy/80 border border-white/5 rounded-lg py-1.5 px-3 text-xs text-slate-300 outline-none focus:border-emerald appearance-none">
          <option className="bg-[#001F3F]">{t('allInstitutions')}</option>
          {banks.map(b => <option key={b.id} value={b.id} className="bg-[#001F3F]">{b.name}</option>)}
        </select>
      </GlassCard>

      {/* Full-height Table — same as Transaction History */}
      <GlassCard className="flex-1 flex flex-col overflow-hidden bg-navy/40">
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-0 custom-scrollbar relative">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2">
            <thead className="sticky top-0 z-[60]">
              <tr>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('name')}>{t('table.account')} <SortIcon column="name" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('date')}>{t('table.type')} <SortIcon column="date" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('bank')}>{t('table.institution')} <SortIcon column="bank" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] text-right cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('amount')}>{t('table.amount')} <SortIcon column="amount" /></th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]">{t('table.note')}</th>
                <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] text-center shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]">{t('table.action')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">{t('noData')}</td>
                </tr>
              ) : (
                sortedRecords.map((record) => {
                  const account = record.account;
                  if (!account) return null;
                  return (
                    <tr key={record.id} className="bg-white/[0.02] hover:bg-white/[0.06] transition-all group">
                      <td className="px-6 py-3 rounded-l-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center border border-white/5">
                            <CreditCard size={16} />
                          </div>
                          <span className="font-bold text-white text-sm">{account.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-300 text-sm">
                        {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-3 text-slate-300 text-xs">
                        {account.bank ? (
                          <div className="flex items-center gap-2">
                            <Landmark size={12} className="text-slate-500" />
                            {account.bank.name}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-sm text-white">
                        ฿{Math.abs(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3 text-slate-400 text-xs italic max-w-[150px] truncate">
                        {record.note || '-'}
                      </td>
                      <td className="px-6 py-3 text-center rounded-r-xl">
                        <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {hasPermission('liabilities', 'canUpdate') && (
                            <button onClick={() => openEditModal(record)} data-testid={`liabilities-list-btn-edit-${account.name}`} className="text-slate-400 hover:text-blue-400 transition-colors">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {hasPermission('liabilities', 'canDelete') && (
                            <button onClick={() => handleDelete(record.id)} data-testid={`liabilities-list-btn-delete-${account.name}`} className="text-slate-400 hover:text-rose-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* GlassModal for Add/Edit */}
      <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? t('form.titleEdit') : t('form.titleAdd')}>
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.account')}</label>
            <select
              required disabled={isEditing} value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              data-testid="liabilities-form-sel-account"
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald appearance-none disabled:opacity-50"
            >
              <option value="new" className="bg-[#001F3F]">{t('form.newAccount')}</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id} className="bg-[#001F3F]">{acc.name} ({accountTypes.find(t => t.value === acc.type)?.label || acc.type})</option>)}
            </select>
          </div>

          {formData.accountId === 'new' && !isEditing && (
            <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{t('form.newName')}</label>
                <input
                  type="text" placeholder="e.g. หนี้เพื่อน A" required={formData.accountId === 'new'}
                  value={formData.newAccountName}
                  onChange={(e) => setFormData({ ...formData, newAccountName: e.target.value })}
                  data-testid="liabilities-form-input-new-name"
                  className="w-full bg-navy/50 border border-rose-500/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-rose-400 placeholder:text-slate-600"
                />
              </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{t('form.bank')}</label>
                  <select
                    value={formData.bankId}
                    onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                    data-testid="liabilities-form-sel-bank"
                    className="w-full bg-navy/50 border border-rose-500/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-rose-400 appearance-none"
                  >
                    <option value="" className="bg-[#001F3F]">{t('form.noInstitution')}</option>
                    {banks.map(b => <option key={b.id} value={b.id} className="bg-[#001F3F]">{b.name}</option>)}
                  </select>
                </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{t('form.amount')}</label>
              <input
                type="number" step="0.01" required value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                data-testid="liabilities-form-input-amount"
                className="w-full bg-navy/50 border border-rose-500/30 rounded-xl px-4 py-3 text-xl font-bold text-white outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-500/50 transition-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.date')}</label>
              <input
                type="date" required value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                data-testid="liabilities-form-input-date"
                className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.note')}</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder={t('form.notePlaceholder')}
              data-testid="liabilities-form-input-note"
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all min-h-[80px] placeholder:text-slate-600"
            />
          </div>

          <button type="submit" data-testid="liabilities-form-btn-save" className="w-full bg-rose-600 text-white font-black text-sm uppercase tracking-wider py-4 rounded-xl mt-2 hover:shadow-[0_0_20px_rgba(225,29,72,0.3)] transition-all active:scale-[0.98]">
            {isEditing ? t('form.update') : t('form.save')}
          </button>
        </form>
      </GlassModal>
    </div>
  );
}


