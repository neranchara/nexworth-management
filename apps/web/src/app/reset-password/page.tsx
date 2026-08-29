'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import Logo from '@/components/common/Logo';
import { encryptPassword } from '../../lib/crypto';
import { useTranslations } from 'next-intl';

function ResetPasswordForm() {
  const t = useTranslations('auth');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError(t('resetPassword.errorInvalidToken'));
        setIsValidating(false);
        return;
      }

      try {
        const { data } = await api.get(`/auth/verify-reset-token?token=${token}`);
        setEmail(data.email);
      } catch (err: any) {
        setError(err.response?.data?.error || t('resetPassword.errorInvalidToken'));
      } finally {
        setIsValidating(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('resetPassword.errorMismatch'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { data: keyData } = await api.get('/auth/public-key');
      const { publicKey, keyId } = keyData;
      const encryptedPassword = await encryptPassword(password, publicKey);

      await api.post('/auth/reset-password', { token, encryptedPassword, keyId });

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent"></div>
        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">{t('resetPassword.verifying')}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-widest">{t('resetPassword.successHeading')}</h2>
        <p className="text-xs text-slate-400 mt-2">{t('resetPassword.successMessage')}</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-8">
        <h2 className="text-xl font-black text-white uppercase tracking-widest">{t('resetPassword.heading')}</h2>
        <p className="text-xs text-slate-400 mt-2">{t('resetPassword.subheading', { email })}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-rose-500/10 p-4 border border-rose-500/30 animate-in shake-in duration-300">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              <h3 className="text-xs font-bold text-rose-400">{error}</h3>
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-[10px] pillar-text-bold text-brand-secondary mb-2 tracking-widest">
              {t('resetPassword.newPasswordLabel')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-brand-accent transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                className="block w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] pillar-text-bold text-brand-secondary mb-2 tracking-widest">
              {t('resetPassword.confirmPasswordLabel')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-brand-accent transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all sm:text-sm"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading || !!error}
            className="w-full flex justify-center py-4 px-4 bg-brand-accent hover:bg-brand-accent/90 text-brand-primary text-[11px] pillar-text-bold rounded-xl transition-all shadow-lg emerald-glow disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
          >
            {isLoading ? t('resetPassword.processing') : t('resetPassword.updateBtn')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-primary py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 glass-card p-10 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-accent/5 rounded-full blur-3xl"></div>

        <div className="flex flex-col items-center relative z-10">
          <Logo className="mb-2" textColor="text-white" />
          <p className="mt-6 text-center text-[10px] pillar-text-bold text-brand-secondary tracking-[0.2em] uppercase">
            {t('resetPassword.pageSubtitle')}
          </p>
        </div>

        <div className="relative z-10">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent"></div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">{t('resetPassword.initializing')}</p>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
