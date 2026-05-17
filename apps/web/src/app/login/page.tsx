'use client';

import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, User as UserIcon, Lock } from 'lucide-react';
import api from '../../lib/api';
import Logo from '@/components/common/Logo';
import { encryptPassword } from '../../lib/crypto';
import { APP_CONFIG } from '@/config/app.config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [viewMode, setViewMode] = useState<'login' | 'forgot_password' | 'otp'>('login');
  
  const login = useAuthStore((state) => state.login);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const handleForgotPassword = async () => {
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/request-password-reset', { email });
      setViewMode('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Fetch RSA Public Key for this session
      const { data: keyData } = await api.get('/auth/public-key');
      const { publicKey, keyId } = keyData;

      // 2. Encrypt password using Web Crypto API
      const encryptedPassword = await encryptPassword(password, publicKey);

      // 3. Send encrypted payload to login
      const payload = { 
        email, 
        encryptedPassword, 
        keyId 
      };
      const { data } = await api.post('/auth/login', payload);
      login(data.token, data.user);
      
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (data.user.isSystemAdmin) {
        router.push('/dashboard/organizations');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      setError(errorResponse.response?.data?.error || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-primary py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 glass-card p-10 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center">
          <Logo className="mb-2" textColor="text-white" />
          <p className="mt-6 text-center text-[10px] pillar-text-bold text-brand-secondary tracking-[0.2em]">
            Login to your secure financial portal
          </p>
          <p className="mt-1 text-center text-xs text-slate-400 font-medium">
            สื่อถึงความโปร่งใส ความชัดเจน
          </p>
        </div>
        
        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-rose-500/10 p-4 border border-rose-500/30">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-500" />
                <h3 className="text-xs font-bold text-rose-400">{error}</h3>
              </div>
            </div>
          )}
          
          {viewMode === 'login' ? (
            <>
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] pillar-text-bold text-brand-secondary mb-2 tracking-widest">
                    Username / Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-slate-500 group-focus-within:text-brand-accent transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all sm:text-sm"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] pillar-text-bold text-brand-secondary mb-2 tracking-widest">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-brand-accent transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="block w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all sm:text-sm"
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
                  <div className="mt-2 text-right">
                    <button type="button" onClick={() => setViewMode('forgot_password')} className="text-[10px] font-bold text-slate-400 hover:text-brand-accent transition-colors uppercase tracking-tight">
                      Forgot Password?
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full flex justify-center py-3.5 px-4 bg-brand-accent hover:bg-brand-accent/90 text-brand-primary text-[11px] pillar-text-bold rounded-xl transition-all shadow-lg emerald-glow disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'LOGIN'}
                </button>
              </div>
            </>
          ) : viewMode === 'forgot_password' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-6">
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Reset Security Key</h2>
                <p className="text-xs text-slate-400 mt-2">Enter your email address to receive reset instructions.</p>
              </div>
              
              <div>
                <label className="block text-[10px] pillar-text-bold text-brand-secondary mb-2 tracking-widest">
                  Registered Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-slate-500 group-focus-within:text-brand-accent transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all sm:text-sm"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading || !email}
                  className="w-full flex justify-center py-3.5 px-4 bg-brand-accent hover:bg-brand-accent/90 text-brand-primary text-[11px] pillar-text-bold rounded-xl transition-all shadow-lg emerald-glow disabled:opacity-50"
                >
                  {isLoading ? 'Sending Request...' : 'SEND RESET LINK'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="w-full flex justify-center py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white text-[11px] pillar-text-bold rounded-xl transition-all border border-white/10"
                >
                  BACK TO LOGIN
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <Lock className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-widest">Check Your Inbox</h2>
              <p className="text-xs text-slate-400 mt-2">
                We have sent a secure link to reset your password to <br/><span className="text-white font-bold">{email}</span>.
              </p>
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="w-full flex justify-center py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white text-[11px] pillar-text-bold rounded-xl transition-all border border-white/10"
                >
                  RETURN TO LOGIN
                </button>
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <button 
              type="button" 
              onClick={() => router.push(redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register')}
              className="text-[10px] font-bold text-slate-400 hover:text-brand-accent transition-colors uppercase tracking-widest border-b border-transparent hover:border-brand-accent/20 pb-1"
            >
              Don't have an account? Create one
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-2">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-40">
            {APP_CONFIG.FULL_VERSION_STRING}
          </p>
        </div>
      </div>
    </div>
  );
}
