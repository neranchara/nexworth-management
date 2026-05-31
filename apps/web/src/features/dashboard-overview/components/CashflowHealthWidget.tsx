'use client';

import { Settings2, AlertCircle, ShieldCheck, Activity } from 'lucide-react';
import { clsx } from 'clsx';

interface CashflowAccount {
  id: string;
  name: string;
  balance: number;
  status: 'DANGER' | 'WATCH' | 'SAFE';
}

interface CashflowHealthWidgetProps {
  remaining: number;
  status: 'DANGER' | 'WATCH' | 'SAFE';
  onOpenSettings: () => void;
  accounts?: CashflowAccount[];
}

const STATUS_CONFIG = {
  DANGER: {
    label: 'ระดับอันตราย',
    color: 'text-rose',
    accentBg: 'bg-rose',
    badgeClass: 'text-rose border-rose/30 bg-rose/10',
    dot: 'bg-rose',
    emoji: '🔴',
    icon: <AlertCircle size={18} className="text-white" />,
  },
  WATCH: {
    label: 'เฝ้าระวัง',
    color: 'text-amber-500',
    accentBg: 'bg-amber-500',
    badgeClass: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    dot: 'bg-amber-500',
    emoji: '⚠',
    icon: <Activity size={18} className="text-white" />,
  },
  SAFE: {
    label: 'ปลอดภัยมาก',
    color: 'text-emerald',
    accentBg: 'bg-emerald',
    badgeClass: 'text-emerald border-emerald/30 bg-emerald/10',
    dot: 'bg-emerald',
    emoji: '✅',
    icon: <ShieldCheck size={18} className="text-white" />,
  },
};

export default function CashflowHealthWidget({
  remaining,
  status,
  onOpenSettings,
  accounts = [],
}: CashflowHealthWidgetProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.WATCH;
  const hasAccounts = accounts.length > 0;

  return (
    <div className="hidden md:flex items-center gap-3 py-1 relative group">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border border-white/5 bg-surface backdrop-blur-xl shadow-xl shadow-black/40 hover:border-white/10 transition-all">
        {/* Status icon */}
        <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ring-2 ring-white/5', config.accentBg)}>
          {config.icon}
        </div>

        {hasAccounts ? (
          /* Per-account chips — horizontal scroll */
          <div className="flex items-center gap-2 overflow-x-auto max-w-[420px] scrollbar-none">
            {accounts.map((acc) => {
              const accCfg = STATUS_CONFIG[acc.status];
              return (
                <div
                  key={acc.id}
                  className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <span className="text-[9px] font-black text-slate uppercase tracking-wide truncate max-w-[72px]">
                    {acc.name}
                  </span>
                  <span className={clsx('text-[10px] font-black', accCfg.color)}>
                    ฿{acc.balance.toLocaleString('th-TH')}
                  </span>
                  <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', accCfg.dot)} />
                </div>
              );
            })}
          </div>
        ) : (
          /* Fallback: single total value */
          <div className="flex flex-col gap-0 min-w-[120px]">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate font-black tracking-tight opacity-80">เงินสดคงเหลือ</span>
              <span className={clsx('px-1.5 py-0.5 rounded border text-[8px] font-black tracking-wider uppercase', config.badgeClass)}>
                {config.label}
              </span>
            </div>
            <span className={clsx('text-xl font-black tracking-tighter', config.color)}>
              ฿{remaining.toLocaleString('th-TH')}
            </span>
          </div>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-full text-slate hover:text-emerald hover:bg-emerald/10 transition-all group/s shrink-0"
          title="Adjust Threshold"
        >
          <Settings2 size={15} className="group-hover/s:rotate-180 transition-transform duration-700" />
        </button>
      </div>

      {/* Glow */}
      <div className={clsx(
        'absolute -bottom-8 right-10 w-40 h-10 blur-[70px] opacity-20 pointer-events-none transition-all duration-1000',
        status === 'DANGER' && 'bg-rose',
        status === 'WATCH' && 'bg-amber-500',
        status === 'SAFE' && 'bg-emerald',
      )} />
    </div>
  );
}
