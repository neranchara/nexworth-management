'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  borderAccent?: 'emerald' | 'rose' | 'navy' | 'none';
}

export default function GlassCard({ 
  children, 
  className, 
  interactive = false,
  borderAccent = 'none' 
}: GlassCardProps) {
  const accentClasses = {
    emerald: 'border-l-4 border-l-emerald',
    rose: 'border-l-4 border-l-rose',
    navy: 'border-l-4 border-l-navy',
    none: 'border border-white/5'
  };

  return (
    <div className={clsx(
      "bg-navy/40 backdrop-blur-xl rounded-[1.25rem] transition-all duration-300",
      accentClasses[borderAccent],
      interactive && "hover:bg-navy/60 hover:scale-[1.02] cursor-pointer hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:border-white/20 active:scale-[0.98]",
      className
    )}>
      {children}
    </div>
  );
}
