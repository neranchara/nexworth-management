'use client';

import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type KpiStatus = 'good' | 'warning' | 'danger';

interface KpiCardProps {
  label: string;
  value: string;
  target: string;
  status: KpiStatus;
  icon: React.ReactNode;
  higherIsBetter?: boolean;
}

const STATUS = {
  good:    { text: 'text-emerald',    bg: 'bg-emerald/10',    border: 'border-emerald/20',    badge: 'text-emerald bg-emerald/10 border-emerald/20' },
  warning: { text: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20',  badge: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  danger:  { text: 'text-rose',       bg: 'bg-rose/10',       border: 'border-rose/20',       badge: 'text-rose bg-rose/10 border-rose/20' },
};

const TREND_ICON = {
  good:    <TrendingUp size={10} />,
  warning: <Minus size={10} />,
  danger:  <TrendingDown size={10} />,
};

export default function KpiCard({ label, value, target, status, icon, higherIsBetter = true }: KpiCardProps) {
  const s = STATUS[status];

  return (
    <div className={clsx(
      'p-4 rounded-[1.25rem] border flex flex-col gap-3 bg-navy/40 backdrop-blur-xl transition-all hover:bg-navy/60',
      s.border
    )}>
      <div className="flex items-center justify-between">
        <div className={clsx('p-2 rounded-lg', s.bg, s.text)}>
          {icon}
        </div>
        <span className={clsx('flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', s.badge)}>
          {TREND_ICON[status]}
          {status === 'good' ? 'ดี' : status === 'warning' ? 'เฝ้าระวัง' : 'ต่ำ'}
        </span>
      </div>

      <div>
        <p className="text-[9px] font-black text-slate uppercase tracking-widest mb-1">{label}</p>
        <p className={clsx('text-2xl font-black tracking-tighter', s.text)}>{value}</p>
      </div>

      <p className="text-[9px] text-slate font-bold">{target}</p>
    </div>
  );
}
