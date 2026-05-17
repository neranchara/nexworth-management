'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, User as UserIcon, Lock, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '../../lib/api';
import Logo from '@/components/common/Logo';
import { encryptPassword } from '../../lib/crypto';
import { APP_CONFIG } from '@/config/app.config';

function RegisterForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Fetch RSA Public Key
      const { data: keyData } = await api.get('/auth/public-key');
      const { publicKey, keyId } = keyData;

      // 2. Encrypt password
      const encryptedPassword = await encryptPassword(password, publicKey);

      // 3. Send registration payload
      const payload = { 
        email, 
        encryptedPassword, 
        firstName,
        lastName,
        keyId 
      };
      
      await api.post('/auth/register', payload);
      setIsSuccess(true);
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.push(redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login');
      }, 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-primary py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-md w-full space-y-8 glass-card p-10 rounded-2xl shadow-2xl text-center">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 animate-bounce">
            <UserIcon className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">Welcome to Nexworth</h2>
          <p className="text-sm text-slate-400 mt-4">
            Your account and organization have been successfully created.
          </p>
          <div className="mt-8 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-primary py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 glass-card p-10 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center">
          <Logo className="mb-2" textColor="text-white" />
          <p className="mt-6 text-center text-[10px] pillar-text-bold text-brand-secondary tracking-[0.2em]">
            Join Nexworth Financial Ecosystem
          </p>
          <p className="mt-1 text-center text-xs text-slate-400 font-medium">
            เริ่มต้นจัดการความมั่งคั่งอย่างโปร่งใส
          </p>
        </div>
        
        <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-rose-500/10 p-4 border border-rose-500/30 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-500" />
                <h3 className="text-xs font-bold text-rose-400">{error}</h3>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] pillar-text-bold text-brand-secondary mb-2 tracking-widest">
                First Name
              </label>
              <input
                type="text"
                required
                className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all sm:text-sm"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] pillar-text-bold text-brand-secondary mb-2 tracking-widest">
                Last Name
              </label>
              <input
                type="text"
                required
                className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all sm:text-sm"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] pillar-text-bold text-brand-secondary mb-2 tracking-widest">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-500 group-focus-within:text-brand-accent transition-colors" />
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
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-brand-accent hover:bg-brand-accent/90 text-brand-primary text-[11px] pillar-text-bold rounded-xl transition-all shadow-lg emerald-glow disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : (
                <>
                  CREATE ACCOUNT
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <Link 
              href={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
              className="text-[10px] font-bold text-slate-400 hover:text-brand-accent transition-colors uppercase tracking-widest border-b border-transparent hover:border-brand-accent/20 pb-1"
            >
              Already have an account? Login
            </Link>
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-primary font-sans text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent"></div>
          <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Loading Secure Portal...</p>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
