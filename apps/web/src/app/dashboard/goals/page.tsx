'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Target, TrendingUp, AlertTriangle, CheckCircle, 
  Plus, Search, Info, ShieldAlert, Clock, Home, Plane, Settings
} from 'lucide-react';
import api from '@/lib/api';
import GlassCard from '@/components/ui/GlassCard';
import GlassModal from '@/components/ui/GlassModal';
import GoalForecastChart from '@/features/goals/GoalForecastChart';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  color: 'Emerald' | 'Rose' | 'Blue' | 'Orange';
  priority: 'SECURITY' | 'SHORT_TERM' | 'LONG_TERM' | 'NORMAL';
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  deadline: string | null;
}

interface GoalsSummary {
  totalGoalsValue: number;
  totalCollected: number;
  overallProgress: number;
  goalCount: number;
  forecastMonths: number;
  avgMonthlySavings: number;
  insightMessage: string;
  behindSchedule: boolean;
}

export default function GoalsPage() {
  const t = useTranslations('goals');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<GoalsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'SHORT_TERM' | 'LONG_TERM' | 'SECURITY'>('ALL');
  
  const [goalConfigs, setGoalConfigs] = useState<{
    priorities: {label: string, value: string}[],
    colors: {label: string, value: string}[],
    statuses: {label: string, value: string}[]
  }>({ priorities: [], colors: [], statuses: [] });
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [newGoalForm, setNewGoalForm] = useState({
    name: '', targetAmount: '', color: 'Emerald', priority: 'NORMAL', deadline: '', accountId: ''
  });
  const [editGoalForm, setEditGoalForm] = useState({
    name: '', targetAmount: '', color: 'Emerald', priority: 'NORMAL', deadline: '', status: 'ACTIVE'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [goalsRes, summaryRes, accountsRes, configRes] = await Promise.all([
        api.get('/goals'),
        api.get('/goals/summary'),
        api.get('/accounts'),
        api.get('/configs', { params: { category: 'DROPDOWNS' } })
      ]);
      setGoals(goalsRes.data.goals);
      setSummary(summaryRes.data.summary);
      setAccounts(accountsRes.data.accounts?.filter((a: any) => a.type !== 'LIABILITY') || []);
      
      const configs = configRes.data.data;
      setGoalConfigs({
        priorities: configs.find((c: any) => c.key === 'GOAL_PRIORITIES')?.value || [],
        colors: configs.find((c: any) => c.key === 'GOAL_COLORS')?.value || [],
        statuses: configs.find((c: any) => c.key === 'GOAL_STATUSES')?.value || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/goals', {
        name: newGoalForm.name,
        targetAmount: parseFloat(newGoalForm.targetAmount),
        color: newGoalForm.color,
        priority: newGoalForm.priority,
        accountId: newGoalForm.accountId || undefined,
        deadline: newGoalForm.deadline ? new Date(newGoalForm.deadline).toISOString() : undefined
      });
      setShowCreateModal(false);
      setNewGoalForm({ name: '', targetAmount: '', color: 'Emerald', priority: 'NORMAL', deadline: '', accountId: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm(t('confirm.delete'))) return;
    try {
      await api.delete(`/goals/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredGoals = goals.filter(g => {
    if (filter === 'ALL') return true;
    return g.priority === filter;
  });

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    try {
      await api.put(`/goals/${selectedGoal.id}`, {
        ...editGoalForm,
        targetAmount: parseFloat(editGoalForm.targetAmount as any),
        deadline: editGoalForm.deadline ? new Date(editGoalForm.deadline).toISOString() : null
      });
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setEditGoalForm({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      color: goal.color,
      priority: goal.priority,
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
      status: goal.status
    } as any);
    setShowEditModal(true);
  };

  const getColorClass = (colorName: string) => {
    switch(colorName) {
      case 'Rose': return 'text-rose-500 border-rose-500 bg-rose-500 shadow-rose/40';
      case 'Blue': return 'text-blue-400 border-blue-400 bg-blue-400 shadow-blue-400/40';
      case 'Orange': return 'text-orange-400 border-orange-400 bg-orange-400 shadow-orange-400/40';
      default: return 'text-emerald border-emerald bg-emerald shadow-emerald/40';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'SECURITY': return <ShieldAlert className="w-6 h-6" />;
      case 'SHORT_TERM': return <Plane className="w-6 h-6" />;
      case 'LONG_TERM': return <Home className="w-6 h-6" />;
      default: return <Target className="w-6 h-6" />;
    }
  };

  // SVG Doughnut Chart logic
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = summary ? circumference - (summary.overallProgress / 100) * circumference : circumference;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-end mb-4 shrink-0 px-6 pt-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{t('subtitle')}</p>
        </div>
        <button 
          data-testid="goals-btn-add"
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald text-navy px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(80,200,120,0.3)] hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] hover:-translate-y-0.5 active:scale-95"
        >
          <Plus className="w-4 h-4" /> {t('addNew')}
        </button>
      </header>

      <div className="px-6 pb-6 flex-1 flex flex-col overflow-hidden">
        <p className="text-xs text-slate-300 mb-6 shrink-0 bg-white/5 p-3 rounded-lg border border-white/10 leading-relaxed flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald" /> 
          {t('purpose')}
        </p>

        {/* Top Summary Pillars */}
        <div className="grid grid-cols-12 gap-6 shrink-0 mb-6">
          <GlassCard className="col-span-12 lg:col-span-3 p-5 flex flex-col justify-between h-36">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{t('summary.total')}</span>
            <h3 className="text-3xl font-bold text-white">
              ฿{summary?.totalGoalsValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || 0}
            </h3>
            <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold">
              <Target className="w-3 h-3" /> {t('summary.activeGoals', { count: summary?.goalCount || 0 })}
            </div>
          </GlassCard>

          <GlassCard className="col-span-12 lg:col-span-3 p-5 flex flex-col justify-between h-36 border-l-4 border-emerald">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{t('summary.collected')}</span>
            <h3 className="text-3xl font-bold text-emerald">
              ฿{summary?.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || 0}
            </h3>
            <div className="w-full bg-navy/50 h-1.5 rounded-full mt-1 overflow-hidden">
              <div 
                className="bg-emerald h-full shadow-[0_0_10px_rgba(80,200,120,0.5)] transition-all duration-1000" 
                style={{ width: `${Math.min(summary?.overallProgress || 0, 100)}%` }}
              ></div>
            </div>
          </GlassCard>

          <GlassCard className="col-span-12 lg:col-span-6 p-5 flex items-center gap-8 h-36">
            <div className="w-20 h-20 shrink-0 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
                <circle 
                  cx="50" cy="50" r={radius} 
                  stroke="#50C878" strokeWidth="12" fill="none" strokeLinecap="round"
                  style={{ strokeDasharray: circumference, strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }} 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-white">{Math.round(summary?.overallProgress || 0)}%</span>
              </div>
            </div>
            <div className="flex-1 h-full min-h-0 pt-2">
              {summary && summary.avgMonthlySavings > 0 ? (
                <GoalForecastChart 
                  currentAmount={summary.totalCollected}
                  targetAmount={summary.totalGoalsValue}
                  monthlySavings={summary.avgMonthlySavings}
                  goalName="Overall Progress"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {summary?.insightMessage || "ต้องการข้อมูลการออมเพิ่มเพื่อพยากรณ์"}
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Goal Cards Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex gap-4 mb-4 shrink-0">
            <button onClick={() => setFilter('ALL')} className={`px-4 py-1.5 text-[10px] font-bold rounded-full border transition-all ${filter === 'ALL' ? 'bg-emerald/10 text-emerald border-emerald/20' : 'bg-white/5 text-slate-400 border-white/5'}`}>{t('filter.all')}</button>
            <button onClick={() => setFilter('SECURITY')} className={`px-4 py-1.5 text-[10px] font-bold rounded-full border transition-all ${filter === 'SECURITY' ? 'bg-emerald/10 text-emerald border-emerald/20' : 'bg-white/5 text-slate-400 border-white/5'}`}>Security</button>
            <button onClick={() => setFilter('SHORT_TERM')} className={`px-4 py-1.5 text-[10px] font-bold rounded-full border transition-all ${filter === 'SHORT_TERM' ? 'bg-emerald/10 text-emerald border-emerald/20' : 'bg-white/5 text-slate-400 border-white/5'}`}>{t('filter.shortTerm')}</button>
            <button onClick={() => setFilter('LONG_TERM')} className={`px-4 py-1.5 text-[10px] font-bold rounded-full border transition-all ${filter === 'LONG_TERM' ? 'bg-emerald/10 text-emerald border-emerald/20' : 'bg-white/5 text-slate-400 border-white/5'}`}>{t('filter.longTerm')}</button>
          </div>
          
          <div className="flex-1 overflow-y-auto scroll-area pr-2 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGoals.map(goal => {
                const colorBase = getColorClass(goal.color);
                const bgClass = goal.color === 'Rose' ? 'bg-rose-500' : goal.color === 'Blue' ? 'bg-blue-400' : goal.color === 'Orange' ? 'bg-orange-400' : 'bg-emerald';
                const textClass = goal.color === 'Rose' ? 'text-rose-500' : goal.color === 'Blue' ? 'text-blue-400' : goal.color === 'Orange' ? 'text-orange-400' : 'text-emerald';
                const borderClass = goal.color === 'Rose' ? 'border-rose-500' : goal.color === 'Blue' ? 'border-blue-400' : goal.color === 'Orange' ? 'border-orange-400' : 'border-emerald';

                return (
                  <GlassCard key={goal.id} className={`p-5 flex flex-col justify-between relative group overflow-hidden border-t-4 ${borderClass} hover:scale-[1.02] transition-transform`}>
                    <div className="flex justify-between items-start">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 ${textClass}`}>
                        {getPriorityIcon(goal.priority)}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-slate-300 uppercase bg-white/5 px-2 py-1 rounded tracking-widest">
                          {goal.priority.replace('_', ' ')}
                        </span>
                        <div className="flex gap-1.5 mt-1.5">
                          <button 
                            onClick={() => openEditModal(goal)}
                            className="text-slate-400 hover:text-emerald transition-colors p-1"
                            title="แก้ไขเป้าหมาย"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="text-rose-500/50 hover:text-rose-500 transition-colors p-1"
                            title="ลบเป้าหมาย"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex-1">
                      <h4 className="text-base font-bold text-white leading-tight">{goal.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{t('card.target')} ฿{goal.targetAmount.toLocaleString()}</p>
                      {goal.deadline && (
                        <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due: {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-xl font-bold text-white leading-none">
                          {Math.floor(goal.progressPercentage)}<span className="text-[10px] ml-0.5">%</span>
                        </span>
                        <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">
                          ฿{(goal.currentAmount / 1000).toFixed(1)}k / ฿{(goal.targetAmount / 1000).toFixed(1)}k
                        </span>
                      </div>
                      <div className="w-full bg-navy/50 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${bgClass} transition-all duration-1000 shadow-[0_0_8px_rgba(255,255,255,0.2)]`}
                          style={{ 
                            width: `${Math.min(goal.progressPercentage, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
              {filteredGoals.length === 0 && !loading && (
                <div className="col-span-full py-12 text-center text-slate-500">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('empty')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <GlassModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={t('modal.createTitle')}>
        <form onSubmit={handleCreateGoal} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.name')}</label>
            <input
              type="text" required
              name="title"
              data-testid="goals-input-title"
              placeholder={t('form.namePlaceholder')}
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all"
              value={newGoalForm.name} onChange={e => setNewGoalForm({...newGoalForm, name: e.target.value})}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.targetAmount')}</label>
            <input 
              type="number" required min="0" step="0.01"
              name="targetAmount"
              data-testid="goals-input-targetAmount"
              placeholder="100000"
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all"
              value={newGoalForm.targetAmount} onChange={e => setNewGoalForm({...newGoalForm, targetAmount: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.priority')}</label>
              <select 
                className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald appearance-none transition-all"
                value={newGoalForm.priority} onChange={e => setNewGoalForm({...newGoalForm, priority: e.target.value as any})}
              >
                {goalConfigs.priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.color')}</label>
              <select 
                className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald appearance-none transition-all"
                value={newGoalForm.color} onChange={e => setNewGoalForm({...newGoalForm, color: e.target.value as any})}
              >
                {goalConfigs.colors.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.linkedAsset')}</label>
            <select 
              name="linkedAssetId"
              data-testid="goals-select-linkedAssetId"
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald appearance-none transition-all"
              value={newGoalForm.accountId} onChange={e => setNewGoalForm({...newGoalForm, accountId: e.target.value})}
            >
              <option value="">{t('form.selectAccount')}</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} (฿{acc.balance?.toLocaleString()})</option>
              ))}
            </select>
            <p className="text-[9px] text-slate-500 italic">{t('form.linkedDesc')}</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.deadline')}</label>
            <input 
              type="date" 
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all [color-scheme:dark]"
              value={newGoalForm.deadline} onChange={e => setNewGoalForm({...newGoalForm, deadline: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white/5 text-slate-300 hover:bg-white/10 transition-all">
              {t('form.cancel')}
            </button>
            <button type="submit" data-testid="goals-btn-submit" className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald text-navy btn-glow">
              {t('form.submit')}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Edit Modal */}
      <GlassModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={t('modal.editTitle')}>
        <form onSubmit={handleUpdateGoal} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.name')}</label>
            <input 
              type="text" required 
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all"
              value={editGoalForm.name} onChange={e => setEditGoalForm({...editGoalForm, name: e.target.value})}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.targetAmount')}</label>
            <input 
              type="number" required min="0" step="0.01"
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all"
              value={editGoalForm.targetAmount} onChange={e => setEditGoalForm({...editGoalForm, targetAmount: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.status')}</label>
              <select 
                className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald appearance-none transition-all"
                value={editGoalForm.status} onChange={e => setEditGoalForm({...editGoalForm, status: e.target.value as any})}
              >
                {goalConfigs.statuses.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.priority')}</label>
              <select 
                className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald appearance-none transition-all"
                value={editGoalForm.priority} onChange={e => setEditGoalForm({...editGoalForm, priority: e.target.value as any})}
              >
                {goalConfigs.priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('form.deadline')}</label>
            <input
              type="date"
              className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald transition-all [color-scheme:dark]"
              value={editGoalForm.deadline} onChange={e => setEditGoalForm({...editGoalForm, deadline: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white/5 text-slate-300 hover:bg-white/10 transition-all">
              {t('form.cancel')}
            </button>
            <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald text-navy btn-glow">
              {t('form.update')}
            </button>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
