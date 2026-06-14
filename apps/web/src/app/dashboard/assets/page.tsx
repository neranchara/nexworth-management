'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { Edit2, Trash2, X, CheckCircle, AlertCircle, Building2, TrendingUp, Coins, Plus, Wallet, ArrowUpCircle, ArrowDownCircle, MoreHorizontal, Eye, EyeOff, Search } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Account, Bank, FinancialRecord } from '@/types/models';
import GlassCard from '@/components/ui/GlassCard';
import GlassModal from '@/components/ui/GlassModal';
import PortfolioDoughnut from '@/features/asset-allocation/PortfolioDoughnut';
import { useTranslations } from 'next-intl';

const ALLOWED_ASSET_TYPES = ['SAVING', 'GOAL', 'GOAL_SAVING', 'INVESTMENT', 'EMERGENCY', 'STOCK', 'GOLD', 'FAMILY'];
const NON_COUNTED_TYPES = ['CASHFLOW', 'BANK', 'INTERNAL'];

export default function AssetsPage() {
  const t = useTranslations('assets');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [nonCountedRecords, setNonCountedRecords] = useState<FinancialRecord[]>([]);
  const [showNonCounted, setShowNonCounted] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { hasPermission } = usePermissions();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [accountTypes, setAccountTypes] = useState<any[]>([]);

  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'categories'>('list');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [recordsRes, accountsRes, banksRes, configRes] = await Promise.all([
        api.get('/financial-records?type=ASSET'),
        api.get('/accounts'),
        api.get('/banks'),
        api.get('/configs', { params: { category: 'DROPDOWNS' } }),
      ]);

      const typesConfig = configRes.data.data.find((c: any) => c.key === 'ACCOUNT_TYPES');
      let currentAllowedAssetTypes = ALLOWED_ASSET_TYPES;
      let currentNonCountedTypes = NON_COUNTED_TYPES;

      if (typesConfig) {
        setAccountTypes(typesConfig.value);
        const types = typesConfig.value || [];
        currentAllowedAssetTypes = types.filter((t: any) => t.category === 'ASSET' && t.subCategory !== 'NONE').map((t: any) => t.value);
        currentNonCountedTypes = types.filter((t: any) => t.category === 'ASSET' && t.subCategory === 'NONE').map((t: any) => t.value);
      }

      const allFetchedRecords = recordsRes.data.records || [];
      const allFetchedAccounts = accountsRes.data.accounts || [];

      // Create a set of account IDs that already have a record
      const recordAccountIds = new Set(allFetchedRecords.map((r: any) => r.accountId));
      
      // Inject dummy 0-balance records for accounts that have no records yet
      const dummyRecords = allFetchedAccounts
        .filter((acc: any) => !recordAccountIds.has(acc.id))
        .map((acc: any) => ({
           id: `dummy-${acc.id}`,
           accountId: acc.id,
           amount: 0,
           date: acc.createdAt,
           type: 'ASSET',
           note: 'No balance recorded yet',
           account: acc
        }));

      const completeRecordsList = [...allFetchedRecords, ...dummyRecords];

      const filteredRecords = completeRecordsList.filter((r: FinancialRecord) => 
        currentAllowedAssetTypes.includes(r.account?.type || '') && (r.account?.isPersonal || r.account?.type === 'INVESTMENT')
      );
      const filteredNonCounted = completeRecordsList.filter((r: FinancialRecord) =>
        currentNonCountedTypes.includes(r.account?.type || '') && r.account?.isPersonal
      );

      const filteredAccounts = allFetchedAccounts.filter((acc: Account) => 
        currentAllowedAssetTypes.includes(acc.type) && (acc.isPersonal || acc.type === 'INVESTMENT')
      );
      const filteredNonCountedAccounts = allFetchedAccounts.filter((acc: Account) =>
        currentNonCountedTypes.includes(acc.type) && acc.isPersonal
      );

      setRecords(filteredRecords);
      setNonCountedRecords(filteredNonCounted);
      setAccounts([...filteredAccounts, ...filteredNonCountedAccounts]);
      setBanks(banksRes.data.banks);
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

  const openEditModal = (r: FinancialRecord) => {
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
    if (!window.confirm(t('confirm.delete'))) return;
    try {
      await api.delete(`/financial-records/${id}`);
      showAlert(t('alert.removed'), 'success');
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
        showAlert(t('alert.updated'), 'success');
      } else {
        await api.post('/financial-records', payload);
        showAlert(t('alert.added'), 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      const errorData = err.response?.data?.error;
      const message = (typeof errorData === 'object' && errorData?.issues?.[0]?.message)
        || (typeof errorData === 'string' ? errorData : null)
        || 'Save failed';
      showAlert(message, 'error');
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'BANK':
      case 'CASHFLOW':
      case 'SAVING':
      case 'INTERNAL': return <Building2 className="w-4 h-4" />;
      case 'STOCK':
      case 'INVESTMENT': return <TrendingUp className="w-4 h-4" />;
      case 'GOLD': return <Coins className="w-4 h-4" />;
      case 'GOAL':
      case 'GOAL_SAVING': return <CheckCircle className="w-4 h-4" />;
      case 'EMERGENCY': return <AlertCircle className="w-4 h-4" />;
      case 'FAMILY': return <CheckCircle className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    if (['BANK', 'CASHFLOW', 'INTERNAL', 'SAVING'].includes(type))
      return { iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', badge: 'bg-blue-500/10 text-blue-400' };
    if (['STOCK', 'INVESTMENT'].includes(type))
      return { iconBg: 'bg-emerald/10 text-emerald border-emerald/20', badge: 'bg-emerald/10 text-emerald' };
    if (['GOLD'].includes(type)) 
      return { iconBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', badge: 'bg-yellow-500/10 text-yellow-400' };
    if (['EMERGENCY'].includes(type)) 
      return { iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', badge: 'bg-rose-500/10 text-rose-400' };
    return { iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', badge: 'bg-purple-500/10 text-purple-400' };
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortedRecords = () => {
    if (!sortConfig) return records;
    return [...records].sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortConfig.key) {
        case 'name': aValue = (a.account?.name || '').toLowerCase(); bValue = (b.account?.name || '').toLowerCase(); break;
        case 'date': aValue = a.date ? new Date(a.date).getTime() : 0; bValue = b.date ? new Date(b.date).getTime() : 0; break;
        case 'type': aValue = (a.account?.type || '').toLowerCase(); bValue = (b.account?.type || '').toLowerCase(); break;
        case 'bank': aValue = (a.account?.bank?.name || '').toLowerCase(); bValue = (b.account?.bank?.name || '').toLowerCase(); break;
        case 'amount': aValue = a.amount; bValue = b.amount; break;
        default: return 0;
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedRecords = getSortedRecords();
  const displayRecords = showNonCounted
    ? [...sortedRecords, ...nonCountedRecords.slice().sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())]
    : sortedRecords;

  const searchedRecords = displayRecords.filter(r => 
    r.account?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.account?.bank?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const nonCountedIds = new Set(nonCountedRecords.map(r => r.id));
  const totalAssets = records.reduce((sum, r) => sum + (r.amount || 0), 0);

  const groupedRecords = searchedRecords.reduce((acc, record) => {
    const type = record.account?.type || 'OTHER';
    if (!acc[type]) acc[type] = [];
    acc[type].push(record);
    return acc;
  }, {} as Record<string, typeof searchedRecords>);

  const calculateAllocation = () => {
    let cash = 0, investments = 0, others = 0;
    records.forEach(r => {
      const type = r.account?.type || '';
      const typeMeta = accountTypes.find((t: any) => t.value === type);
      if (typeMeta) {
        if (typeMeta.subCategory === 'LIQUID') cash += r.amount;
        else if (typeMeta.subCategory === 'INVESTMENT') investments += r.amount;
        else others += r.amount;
      } else {
        if (['BANK', 'SAVING', 'CASHFLOW'].includes(type)) cash += r.amount;
        else if (['INVESTMENT', 'STOCK'].includes(type)) investments += r.amount;
        else others += r.amount;
      }
    });
    const total = totalAssets || 1;
    return {
      cash: { val: cash, pct: Math.round((cash/total)*100) },
      investments: { val: investments, pct: Math.round((investments/total)*100) },
      others: { val: others, pct: Math.round((others/total)*100) }
    };
  };

  const alloc = calculateAllocation();

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <MoreHorizontal className="w-3 h-3 ml-1 opacity-20 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUpCircle className="w-3 h-3 ml-1 text-emerald inline" /> : <ArrowDownCircle className="w-3 h-3 ml-1 text-emerald inline" />;
  };

  if (loading && records.length === 0) return <div className="p-6 text-white">{t('loadingData')}</div>;
  if (error && records.length === 0) return <div className="p-6 text-rose-500">{error}</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden w-full space-y-6">
      {alert && (
        <div className={`fixed top-4 right-4 z-[200] max-w-[400px] w-full p-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all backdrop-blur-md border ${
          alert.type === 'success' ? 'bg-emerald/10 border-emerald/20 text-emerald' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-bold text-sm tracking-wide">{alert.message}</p>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold text-white">{t('title')}</h2>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewMode === 'list' ? 'bg-emerald text-navy' : 'text-slate-400 hover:text-white'}`}
            >LIST</button>
            <button 
              onClick={() => setViewMode('categories')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewMode === 'categories' ? 'bg-emerald text-navy' : 'text-slate-400 hover:text-white'}`}
            >CATEGORIES</button>
          </div>
          {hasPermission('assets', 'canCreate') && (
            <button 
              onClick={openAddModal} 
              data-testid="assets-list-btn-add-asset"
              className="bg-emerald text-navy px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
            >
              <Plus size={14} /> {t('addNew')}
            </button>
          )}
        </div>
      </header>

      {/* Summary Area */}
      <div className="grid grid-cols-12 gap-6 shrink-0">
        <GlassCard className="col-span-12 lg:col-span-4 p-6 flex items-center justify-between bg-navy/40">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('totalAssets')}</p>
            <h3 className="text-3xl font-bold text-white mt-1">฿{totalAssets.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald/10 rounded-2xl flex items-center justify-center text-emerald shadow-lg shadow-emerald/5">
            <Wallet size={24} />
          </div>
        </GlassCard>
        
        <GlassCard className="col-span-12 lg:col-span-8 p-4 flex items-center gap-8 bg-navy/40">
          <div className="w-24 h-24 shrink-0">
            <PortfolioDoughnut data={[
              { name: t('chart.cash'), value: alloc.cash.val || 1, color: '#50C878' },
              { name: t('chart.investments'), value: alloc.investments.val || 1, color: '#60A5FA' },
              { name: t('chart.others'), value: alloc.others.val || 1, color: 'rgba(112, 128, 144, 0.4)' }
            ]} />
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t('chart.cash')}</p>
              <p className="text-sm font-bold text-emerald mt-1">{alloc.cash.pct}%</p>
              <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden"><div className="bg-emerald h-full transition-all" style={{width: `${alloc.cash.pct}%`}}></div></div>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t('chart.investments')}</p>
              <p className="text-sm font-bold text-blue-400 mt-1">{alloc.investments.pct}%</p>
              <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden"><div className="bg-blue-400 h-full transition-all" style={{width: `${alloc.investments.pct}%`}}></div></div>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t('chart.others')}</p>
              <p className="text-sm font-bold text-slate-400 mt-1">{alloc.others.pct}%</p>
              <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden"><div className="bg-slate-400 h-full transition-all" style={{width: `${alloc.others.pct}%`}}></div></div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Table Area */}
      <GlassCard className="flex-1 flex flex-col overflow-hidden bg-navy/40">
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 shrink-0">
          <div className="flex gap-4">
            <span className="text-xs font-bold text-emerald border-b-2 border-emerald pb-1">{t('allAccounts', { count: searchedRecords.length })}</span>
            <button onClick={() => setShowNonCounted(!showNonCounted)} className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              {showNonCounted ? <EyeOff size={12}/> : <Eye size={12}/>} {t('nonCounted')}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
            <input 
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-navy/50 border border-white/5 rounded-full py-1.5 pl-9 pr-4 text-[10px] text-white focus:outline-none focus:border-emerald w-48 lg:w-64 placeholder:text-slate-500 transition-all" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-0 custom-scrollbar relative">
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left text-xs border-separate border-spacing-y-2 min-w-[600px] sm:min-w-0">
              <thead className="sticky top-0 z-[60]">
                <tr>
                  <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('name')}>{t('table.account')} <SortIcon column="name" /></th>
                  <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229] hidden sm:table-cell" onClick={() => handleSort('type')}>{t('table.type')} <SortIcon column="type" /></th>
                  <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229] hidden sm:table-cell" onClick={() => handleSort('bank')}>{t('table.institution')} <SortIcon column="bank" /></th>
                  <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] text-right cursor-pointer hover:text-white transition-colors shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]" onClick={() => handleSort('amount')}>{t('table.amount')} <SortIcon column="amount" /></th>
                  <th className="px-6 py-4 bg-[#001229] text-slate-400 uppercase font-bold text-[10px] text-center shadow-[0_-16px_0_0_#001229,0_8px_0_0_#001229]">{t('table.action')}</th>
                </tr>
              </thead>
              {searchedRecords.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">{t('noData')}</td>
                  </tr>
                </tbody>
              ) : viewMode === 'list' ? (
                <tbody>
                  {searchedRecords.map((record) => {
                    const account = record.account;
                    if (!account) return null;
                    const isNonCounted = nonCountedIds.has(record.id);
                    const displayAmount = Math.abs(record.amount) < 0.005 ? 0 : record.amount;
                    const isPositive = displayAmount >= 0;
                    const styling = getTypeBadgeColor(account.type);
                    
                    return (
                      <tr key={record.id} className={`bg-white/[0.02] hover:bg-white/[0.06] transition-all group ${isNonCounted ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-3 rounded-l-xl">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${styling.iconBg}`}>
                              {getAccountIcon(account.type)}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm flex items-center gap-2">
                                {account.name}
                                {isNonCounted && <span className="px-1.5 py-0.5 rounded bg-white/10 text-[8px] uppercase tracking-wider text-slate-400">{t('hidden')}</span>}
                              </p>
                              <p className="text-[9px] text-slate-400">{t('updated')} {record.date ? new Date(record.date).toLocaleDateString() : '-'}</p>
                              {record.note && <p className="text-[10px] text-emerald/60 mt-0.5 italic line-clamp-1">"{record.note}"</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 hidden sm:table-cell">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${styling.badge}`}>
                            {accountTypes.find(t => t.value === account.type)?.label || account.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-300 hidden sm:table-cell">
                          {account.bank ? (
                            <div className="flex items-center gap-2">
                              {account.bank.color && <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: account.bank.color }} />}
                              {account.bank.name}
                            </div>
                          ) : '-'}
                        </td>
                        <td className={`px-6 py-3 text-right font-bold text-sm ${isPositive ? 'text-emerald' : 'text-rose-500'}`}>
                          {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(displayAmount)}
                        </td>
                        <td className="px-6 py-3 text-center rounded-r-xl">
                          <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {hasPermission('assets', 'canUpdate') && (
                              <button onClick={() => openEditModal(record)} className="text-slate-400 hover:text-blue-400 transition-colors" title="Edit">
                                <Edit2 size={14} />
                              </button>
                            )}
                            {hasPermission('assets', 'canDelete') && (
                              <button onClick={() => handleDelete(record.id)} className="text-slate-400 hover:text-rose-500 transition-colors" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ) : (
                Object.entries(groupedRecords).sort((a,b) => a[0].localeCompare(b[0])).map(([type, groupRecords]) => (
                  <tbody key={type}>
                    <tr>
                      <td colSpan={5} className="px-6 py-3 bg-[#001229]/60 font-black text-emerald tracking-widest text-[10px] uppercase border-y border-white/5 shadow-inner">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald shadow-[0_0_8px_rgba(80,200,120,0.8)]"></div>
                           {type} ACCOUNTS
                           <span className="text-slate-400 font-normal normal-case ml-2">- {groupRecords.length} items</span>
                        </div>
                      </td>
                    </tr>
                    {groupRecords.map((record) => {
                      const account = record.account;
                      if (!account) return null;
                      const isNonCounted = nonCountedIds.has(record.id);
                      const displayAmount = Math.abs(record.amount) < 0.005 ? 0 : record.amount;
                      const isPositive = displayAmount >= 0;
                      const styling = getTypeBadgeColor(account.type);
                      
                      return (
                        <tr key={record.id} className={`bg-white/[0.02] hover:bg-white/[0.06] transition-all group ${isNonCounted ? 'opacity-50' : ''}`}>
                          <td className="px-6 py-3 rounded-l-xl">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${styling.iconBg}`}>
                                {getAccountIcon(account.type)}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm flex items-center gap-2">
                                  {account.name}
                                  {isNonCounted && <span className="px-1.5 py-0.5 rounded bg-white/10 text-[8px] uppercase tracking-wider text-slate-400">{t('hidden')}</span>}
                                </p>
                                <p className="text-[9px] text-slate-400">{t('updated')} {record.date ? new Date(record.date).toLocaleDateString() : '-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 hidden sm:table-cell">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${styling.badge}`}>
                              {accountTypes.find(t => t.value === account.type)?.label || account.type}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-300 hidden sm:table-cell">
                            {account.bank ? (
                              <div className="flex items-center gap-2">
                                {account.bank.color && <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: account.bank.color }} />}
                                {account.bank.name}
                              </div>
                            ) : '-'}
                          </td>
                          <td className={`px-6 py-3 text-right font-bold text-sm ${isPositive ? 'text-emerald' : 'text-rose-500'}`}>
                            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(displayAmount)}
                          </td>
                          <td className="px-6 py-3 text-center rounded-r-xl">
                            <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              {hasPermission('assets', 'canUpdate') && (
                                <button onClick={() => openEditModal(record)} className="text-slate-400 hover:text-blue-400 transition-colors" title="Edit">
                                  <Edit2 size={14} />
                                </button>
                              )}
                              {hasPermission('assets', 'canDelete') && (
                                <button onClick={() => handleDelete(record.id)} className="text-slate-400 hover:text-rose-500 transition-colors" title="Delete">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                ))
              )}
            </table>
          </div>
        </div>
      </GlassCard>

      {/* GlassModal for Add/Edit */}
      <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? t('form.titleEdit') : t('form.titleAdd')}>
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.account')}</label>
            <select
              data-testid="assets-form-sel-account"
              required disabled={isEditing} value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald/50 appearance-none disabled:opacity-50"
            >
              <option value="new">{t('form.newAccount')}</option>
              {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name} ({accountTypes.find(t => t.value === acc.type)?.label || acc.type})</option>)}
            </select>
          </div>

          {formData.accountId === 'new' && !isEditing && (
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('form.name')}</label>
                <input
                  data-testid="accounts-form-input-name"
                  type="text" placeholder="e.g. SCB Saving" required={formData.accountId === 'new'}
                  value={formData.newAccountName} onChange={(e) => setFormData({ ...formData, newAccountName: e.target.value })}
                  className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-400 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('form.type')}</label>
                  <select
                    data-testid="accounts-form-sel-type"
                    value={formData.newAccountType} onChange={(e) => setFormData({ ...formData, newAccountType: e.target.value })}
                    className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-400 appearance-none"
                  >
                    {accountTypes.filter(t => ALLOWED_ASSET_TYPES.includes(t.value)).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('form.bank')}</label>
                  <select
                    data-testid="accounts-form-sel-bank"
                    value={formData.bankId} onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                    className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-400 appearance-none"
                  >
                    <option value="">{t('form.noInstitution')}</option>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-emerald uppercase tracking-widest">{t('form.amount')}</label>
              <input
                data-testid="assets-form-input-amount"
                type="number" step="0.01" required value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-navy/50 border border-emerald/30 rounded-xl px-4 py-3 text-xl font-bold text-white outline-none focus:border-emerald focus:ring-1 focus:ring-emerald/50 transition-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.date')}</label>
              <input
                data-testid="assets-form-input-date"
                type="date" required value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.note')}</label>
            <input
              type="text" placeholder="e.g. Current balance after monthly update"
              value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all placeholder:text-slate-600"
            />
          </div>

          <button type="submit" data-testid="assets-form-btn-save" className="w-full bg-emerald text-navy font-black text-sm uppercase tracking-wider py-4 rounded-xl mt-2 hover:shadow-[0_0_20px_rgba(80,200,120,0.3)] transition-all active:scale-[0.98]">
            {isEditing ? t('form.update') : t('form.save')}
          </button>
        </form>
      </GlassModal>
    </div>
  );
}
