'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Critical Dashboard Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-12 max-w-xl w-full text-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
        <div className="w-24 h-24 bg-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-amber-500/20 ring-8 ring-amber-500/5 animate-pulse">
          <AlertTriangle className="w-12 h-12 text-white" />
        </div>
        
        <h2 className="text-3xl font-black text-white tracking-tight mb-4">Dashboard Interrupted</h2>
        
        <div className="bg-black/40 rounded-2xl p-6 mb-8 border border-white/5">
          <p className="text-rose-400 text-sm font-bold font-mono break-all leading-relaxed">
             {error.message || 'An unexpected client-side exception occurred.'}
          </p>
          {error.digest && (
             <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest mt-3">
               Error ID: {error.digest}
             </p>
          )}
        </div>

        <p className="text-slate-400 text-sm leading-relaxed mb-10">
          This usually happens due to corrupted local storage data or a temporary connection issue. 
          Try clearing your browser cache or resetting the layout.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => {
              // Try to clear specific dashboard keys that might be causing the crash
              localStorage.removeItem('nexworth-dashboard-layout');
              localStorage.removeItem('nexworth-enabled-widgets');
              reset();
            }}
            className="flex items-center justify-center gap-2 py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs shadow-xl"
          >
            <RefreshCcw className="w-4 h-4" /> Reset & Retry
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 py-4 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-700 transition-all uppercase tracking-widest text-xs border border-white/5"
          >
            <Home className="w-4 h-4" /> Back to Home
          </Link>
        </div>
        
        <p className="mt-8 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
          Nexworth Management Engine v2.1.2
        </p>
      </div>
    </div>
  );
}
