'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { SecurityLogs } from '@/components/user/SecurityLogs';
import { Shield, Smartphone } from 'lucide-react';

export default function UserSecurityPage() {
  const t = useTranslations('security');
  return (
    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Page Header */}
      <header className="mb-12 relative overflow-hidden p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl">
        <div className="absolute -right-24 -top-24 w-64 h-64 bg-emerald/10 rounded-full blur-[80px]" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald blur-2xl opacity-20" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center text-emerald shadow-2xl relative z-10">
              <Shield size={32} />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t('title')}</h1>
            <p className="text-emerald font-black uppercase tracking-[0.4em] text-[10px] mt-2 opacity-80">{t('subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1 min-h-0">
        
        {/* Left Column: Logs (Major) */}
        <div className="xl:col-span-8 overflow-y-auto custom-scrollbar pr-2 pb-10">
          <SecurityLogs />
        </div>

        {/* Right Column: Protection Status */}
        <div className="xl:col-span-4">
          <div className="flex items-center gap-3 px-1 mb-6">
            <div className="w-1 h-5 bg-emerald rounded-full" />
            <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">{t('protectionStatus')}</h2>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate border border-white/10">
                <Smartphone size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('mfa')}</h3>
                <span className="text-[9px] font-black text-slate uppercase tracking-widest">{t('comingSoon')}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate leading-relaxed">
              {t('mfaDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
