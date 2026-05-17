'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Logo from '@/components/common/Logo';
import { CheckCircle2, XCircle, Loader2, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { APP_CONFIG } from '@/config/app.config';

function InviteAcceptContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing invitation token.');
      return;
    }

    if (isAuthenticated) {
      handleAcceptInvitation(token);
    }
  }, [token, isAuthenticated]);

  const handleAcceptInvitation = async (inviteToken: string) => {
    setStatus('loading');
    try {
      await api.post('/invitations/accept', { token: inviteToken });
      setStatus('success');
      setMessage('You have successfully joined the organization!');
      
      // Optionally update user data here if needed, or rely on next /auth/me fetch.
      // We'll just provide a button to go to dashboard.
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Failed to accept invitation. It may have expired or been processed already.');
    }
  };

  const currentUrl = `/invite/accept?token=${token}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-primary py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 glass-card p-10 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-accent/20 rounded-full blur-3xl opacity-50" />

        <div className="relative z-10 flex flex-col items-center">
          <Logo className="mb-2" textColor="text-white" />
          <p className="mt-6 text-center text-[10px] pillar-text-bold text-brand-secondary tracking-[0.2em] uppercase">
            Team Invitation
          </p>
        </div>

        <div className="relative z-10 mt-8">
          {!token ? (
             <div className="text-center animate-in fade-in zoom-in-95 duration-500">
               <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                 <XCircle className="w-8 h-8 text-rose-500" />
               </div>
               <h2 className="text-lg font-black text-white uppercase tracking-widest">Invalid Link</h2>
               <p className="text-xs text-slate-400 mt-2">{message}</p>
             </div>
          ) : !isAuthenticated ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
              <h2 className="text-xl font-black text-white tracking-wide">
                You've been invited!
              </h2>
              <p className="text-sm text-slate-400">
                Please log in or create an account to accept the invitation and join the workspace.
              </p>
              
              <div className="space-y-3 pt-4">
                <Link
                  href={`/login?redirect=${encodeURIComponent(currentUrl)}`}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-brand-accent hover:bg-brand-accent/90 text-brand-primary text-[11px] pillar-text-bold rounded-xl transition-all shadow-lg emerald-glow"
                >
                  <LogIn className="w-4 h-4" />
                  LOGIN TO ACCEPT
                </Link>
                <Link
                  href={`/register?redirect=${encodeURIComponent(currentUrl)}`}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white text-[11px] pillar-text-bold rounded-xl transition-all border border-white/10"
                >
                  <UserPlus className="w-4 h-4" />
                  CREATE ACCOUNT
                </Link>
              </div>
            </div>
          ) : status === 'loading' ? (
             <div className="text-center animate-in fade-in duration-500 py-8">
               <Loader2 className="w-12 h-12 text-brand-accent animate-spin mx-auto mb-4" />
               <p className="text-xs text-brand-secondary pillar-text-bold tracking-widest animate-pulse">
                 Processing Invitation...
               </p>
             </div>
          ) : status === 'success' ? (
             <div className="text-center animate-in fade-in zoom-in-95 duration-500">
               <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                 <CheckCircle2 className="w-10 h-10 text-emerald-500" />
               </div>
               <h2 className="text-lg font-black text-white uppercase tracking-widest mb-2">Welcome Aboard</h2>
               <p className="text-xs text-slate-400">{message}</p>
               
               <div className="pt-8">
                 <button
                   onClick={() => router.push('/dashboard')}
                   className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-brand-accent hover:bg-brand-accent/90 text-brand-primary text-[11px] pillar-text-bold rounded-xl transition-all shadow-lg emerald-glow"
                 >
                   GO TO DASHBOARD
                   <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
             </div>
          ) : (
             <div className="text-center animate-in fade-in zoom-in-95 duration-500">
               <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                 <XCircle className="w-8 h-8 text-rose-500" />
               </div>
               <h2 className="text-lg font-black text-white uppercase tracking-widest">Action Failed</h2>
               <p className="text-xs text-rose-400/80 mt-2 font-medium bg-rose-500/10 py-3 px-4 rounded-lg border border-rose-500/20">
                 {message}
               </p>
               <div className="pt-6">
                 <button
                   onClick={() => router.push('/dashboard')}
                   className="w-full flex justify-center py-3 px-4 bg-white/5 hover:bg-white/10 text-white text-[11px] pillar-text-bold rounded-xl transition-all border border-white/10"
                 >
                   RETURN TO DASHBOARD
                 </button>
               </div>
             </div>
          )}
        </div>

        <div className="relative z-10 pt-6 border-t border-white/5 flex flex-col items-center gap-2 mt-8">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-40">
            {APP_CONFIG.FULL_VERSION_STRING}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-primary">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    }>
      <InviteAcceptContent />
    </Suspense>
  );
}
