'use client';

import React from 'react';
import { SecurityLogs } from '@/components/user/SecurityLogs';

export default function UserSecurityPage() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Account Security</h1>
        <p className="text-slate-500 mt-2">Manage your security settings and view transparency logs.</p>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <SecurityLogs />
        
        {/* Placeholder for other security settings like 2FA, Password Change */}
        <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center opacity-50 grayscale">
          <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full mb-4"></div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Multi-Factor Authentication</h3>
          <p className="text-slate-500 text-sm max-w-xs mt-2">Future update: Secure your account with hardware keys or app-based 2FA.</p>
        </div>
      </div>
    </div>
  );
}
