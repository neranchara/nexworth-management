'use client';

import { Settings2, AlertCircle, ShieldCheck, Activity } from 'lucide-react';
import { clsx } from 'clsx';

interface CashflowHealthWidgetProps {
  remaining: number;
  status: 'DANGER' | 'WATCH' | 'SAFE';
  onOpenSettings: () => void;
}

export default function CashflowHealthWidget({ 
  remaining, 
  status, 
  onOpenSettings 
}: CashflowHealthWidgetProps) {
  
  const statusConfig = {
    DANGER: {
      label: 'ระดับอันตราย',
      color: 'text-rose',
      bgColor: 'bg-rose/10',
      borderColor: 'border-rose/30',
      icon: <AlertCircle size={24} className="text-white" />,
      badgeColor: 'text-rose border-rose/30',
      accentBg: 'bg-rose'
    },
    WATCH: {
      label: 'เฝ้าระวัง',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      icon: <Activity size={24} className="text-white" />,
      badgeColor: 'text-amber-500 border-amber-500/30',
      accentBg: 'bg-amber-500'
    },
    SAFE: {
      label: 'ปลอดภัยมาก',
      color: 'text-emerald',
      bgColor: 'bg-emerald/10',
      borderColor: 'border-emerald/30',
      icon: <ShieldCheck size={24} className="text-white" />,
      badgeColor: 'text-emerald border-emerald/30',
      accentBg: 'bg-emerald'
    }
  };

  const config = statusConfig[status] || statusConfig.WATCH;

  return (
    <div className="hidden md:flex flex-col items-end justify-center py-2 relative group">
      <div 
        className={clsx(
          "flex items-center gap-5 px-5 py-3 rounded-full border transition-all duration-700 backdrop-blur-xl",
          "bg-surface border-white/5 hover:border-white/10 shadow-xl shadow-black/40",
          status === 'SAFE' && "emerald-glow"
        )}
      >
        {/* Icon Circle */}
        <div className={clsx(
          "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500",
          config.accentBg,
          "shadow-lg shadow-black/40 ring-2 ring-white/5"
        )}>
          {config.icon}
        </div>

        {/* Data Center */}
        <div className="flex flex-col gap-0 min-w-[130px]">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-text-secondary font-black tracking-tight opacity-80">เงินสดคงเหลือ</span>
            <div className={clsx(
              "px-2 py-0.5 rounded-md border text-[8px] font-black tracking-wider uppercase",
              config.badgeColor,
              "bg-white/5 backdrop-blur-sm"
            )}>
              {config.label}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={clsx(
              "text-2xl font-black tracking-tighter transition-all duration-500",
              status === 'SAFE' ? 'text-emerald' : config.color
            )}>
              ฿{remaining.toLocaleString()}
            </span>
            
            <button 
              onClick={onOpenSettings}
              className="p-1.5 rounded-full text-text-secondary hover:text-emerald hover:bg-emerald/10 transition-all group/settings"
              title="Adjust Threshold"
            >
              <Settings2 size={16} className="group-hover/settings:rotate-180 transition-transform duration-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Hint Text */}
      <span className="mt-2 text-[10px] text-text-secondary italic font-bold opacity-30 hover:opacity-100 transition-opacity cursor-default pr-4">
        คลิกที่ไอคอนเพื่อปรับ &quot;เกณฑ์ความปลอดภัย&quot;
      </span>

      {/* Decorative Glow based on status */}
      <div className={clsx(
        "absolute -bottom-8 right-10 w-48 h-12 blur-[80px] opacity-20 pointer-events-none transition-all duration-1000",
        status === 'DANGER' && "bg-rose",
        status === 'WATCH' && "bg-amber-500",
        status === 'SAFE' && "bg-emerald"
      )} />
    </div>
  );
}
