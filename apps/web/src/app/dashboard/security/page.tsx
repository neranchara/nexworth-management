'use client';

import React from 'react';
import { SecurityLogs } from '@/components/user/SecurityLogs';
import { Shield, Lock, Smartphone, Key } from 'lucide-react';

export default function UserSecurityPage() {
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
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Security Center</h1>
            <p className="text-emerald font-black uppercase tracking-[0.4em] text-[10px] mt-2 opacity-80">Cloud Identity Protection & Audit Trails</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1 min-h-0">
        
        {/* Left Column: Logs (Major) */}
        <div className="xl:col-span-8 overflow-y-auto custom-scrollbar pr-2 pb-10">
          <SecurityLogs />
        </div>

        {/* Right Column: Active Protection (Minor) */}
        <div className="xl:col-span-4 space-y-8">
          <div className="flex items-center gap-3 px-2">
             <div className="w-1.5 h-6 bg-emerald rounded-full shadow-[0_0_15px_rgba(80,200,120,0.5)]" />
             <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Protection Status</h2>
          </div>

          <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 shadow-xl relative overflow-hidden group backdrop-blur-sm">
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-rose-500/10 rounded-full blur-[40px]" />
            <div className="flex items-center gap-5 mb-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 border border-white/10 group-hover:border-rose-500/30 transition-colors">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Multi-Factor Auth</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Shield Inactive</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
              Enhance your perimeter security with hardware-based authentication or time-based OTP codes.
            </p>
            <div className="mt-8 pt-6 border-t border-white/10">
               <button disabled className="w-full py-4 bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl cursor-not-allowed border border-white/5">
                  Deployment Pending
               </button>
            </div>
          </div>

          <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 shadow-xl relative overflow-hidden group backdrop-blur-sm">
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-emerald/10 rounded-full blur-[40px]" />
            <div className="flex items-center gap-5 mb-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-emerald border border-white/10 group-hover:border-emerald/30 transition-colors shadow-inner">
                <Key size={24} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Access Control</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 bg-emerald rounded-full shadow-[0_0_10px_rgba(80,200,120,0.5)]" />
                  <span className="text-[9px] font-black text-emerald uppercase tracking-widest">Secure Handshake</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
              Your active session is cryptographically bound to this device and monitored for anomalies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
