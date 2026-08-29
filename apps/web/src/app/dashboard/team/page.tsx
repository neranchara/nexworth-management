'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Users, UserPlus, Mail, Shield, CheckCircle, AlertCircle, Loader2, Clock, Trash2, ShieldCheck, MailWarning, Construction } from 'lucide-react';
import { clsx } from 'clsx';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  role: { name: string } | null;
  organization: { name: string } | null;
}

interface Invitation {
  id: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
  role: { name: string } | null;
  invitedBy: { firstName: string | null; lastName: string | null; email: string } | null;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

export default function TeamPage() {
  const t = useTranslations('team');
  const { user } = useAuthStore();
  const [members, setMembers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  
  const [alert, setAlert] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const canManageTeam = user?.role === 'Admin' || user?.role === 'Owner' || user?.isSystemAdmin;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, invitesRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/invitations'),
        api.get('/roles')
      ]);
      setMembers(usersRes.data.users || []);
      setInvitations(invitesRes.data || []);
      setRoles(rolesRes.data.roles || []);
      
      // Auto-select first role for convenience
      if (rolesRes.data.roles?.length > 0) {
        setInviteRoleId(rolesRes.data.roles[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteRoleId) return;

    try {
      setIsInviting(true);
      await api.post('/invitations', { email: inviteEmail, roleId: inviteRoleId });
      setAlert({ message: t('alert.invited'), type: 'success' });
      setInviteEmail('');
      fetchData();
    } catch (err: any) {
      setAlert({ message: err.response?.data?.error || t('alert.inviteFailed'), type: 'error' });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm(t('confirm.revoke'))) return;
    try {
      await api.delete(`/invitations/${id}`);
      setAlert({ message: t('alert.revoked'), type: 'success' });
      fetchData();
    } catch (err: any) {
      setAlert({ message: err.response?.data?.error || t('alert.revokeFailed'), type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-80 h-80 bg-emerald/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-emerald/20 to-emerald/5 border border-emerald/20 flex items-center justify-center text-emerald shadow-2xl">
              <Users size={36} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter">{t('title')}</h1>
              <p className="text-emerald font-black uppercase tracking-[0.3em] text-[10px] mt-2 opacity-80">{t('subtitle')}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
             <div className="text-3xl font-black text-white">{members.length}</div>
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('memberCount')}</div>
          </div>
        </div>
      </div>

      {alert && (
        <div className={clsx(
          "p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 border",
          alert.type === 'success' 
            ? "bg-emerald/10 text-emerald border-emerald/20" 
            : "bg-rose/10 text-rose border-rose/20"
        )}>
          {alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-xs font-black uppercase tracking-widest">{alert.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Member List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">{t('activeMembers')}</h2>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{t('activeMembersDesc')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-white text-sm">
                      {member.firstName ? member.firstName[0].toUpperCase() : member.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {member.firstName} {member.lastName}
                        {member.id === user?.id && <span className="text-[9px] px-2 py-0.5 bg-emerald/20 text-emerald rounded-full uppercase tracking-widest">{t('you')}</span>}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 text-slate-300 rounded-lg border border-white/10">
                       {member.role?.name || 'User'}
                     </span>
                  </div>
                </div>
              ))}
              
              {members.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm font-bold uppercase tracking-widest">{t('noMembers')}</div>
              )}
            </div>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                  <MailWarning size={20} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">{t('pendingInvitations')}</h2>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{t('pendingInvitationsDesc')}</p>
                </div>
              </div>

              <div className="space-y-4">
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                        <Mail size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{inv.email}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                           <Clock size={10} /> Exp: {new Date(inv.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={clsx(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border",
                        inv.status === 'PENDING' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                        inv.status === 'ACCEPTED' ? "bg-emerald/10 text-emerald border-emerald/20" :
                        inv.status === 'REVOKED' ? "bg-rose-500/10 text-rose border-rose-500/20" :
                        "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      )}>
                        {inv.status}
                      </span>
                      {canManageTeam && inv.status === 'PENDING' && (
                        <button 
                          onClick={() => handleRevoke(inv.id)}
                          className="p-2 text-rose hover:bg-rose/10 rounded-lg transition-colors border border-transparent hover:border-rose/20"
                          title="Revoke Invitation"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Invite Form */}
        <div className="lg:col-span-1">
          <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-xl backdrop-blur-sm sticky top-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald border border-emerald/20">
                <UserPlus size={20} />
              </div>
              <div>
                <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">{t('invite')}</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{t('inviteDesc')}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 text-slate">
                <Construction size={24} />
              </div>
              <h3 className="text-sm font-black text-white mb-2 uppercase tracking-widest">{t('comingSoon')}</h3>
              <p className="text-[10px] text-slate leading-relaxed uppercase tracking-widest">
                {t('comingSoonDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
