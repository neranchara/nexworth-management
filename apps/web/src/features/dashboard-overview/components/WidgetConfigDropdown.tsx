'use client';

import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useDashboardStore, WIDGET_LIST, WidgetKey } from '@/store/dashboardStore';

export default function WidgetConfigDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { widgetConfig, setWidgetConfig } = useDashboardStore();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visibleCount = WIDGET_LIST.filter(w => widgetConfig[w.key]).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all',
          open
            ? 'bg-emerald/20 text-emerald border-emerald/30'
            : 'bg-white/5 text-slate border-white/5 hover:text-white hover:bg-white/10'
        )}
        title="Configure Widgets"
      >
        <SlidersHorizontal size={12} />
        <span>Widgets</span>
        <span className={clsx(
          'w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-black',
          visibleCount === WIDGET_LIST.length ? 'bg-emerald/20 text-emerald' : 'bg-amber-500/20 text-amber-400'
        )}>
          {visibleCount}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-navy/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[9px] font-black text-slate uppercase tracking-widest">แสดง / ซ่อน Widget</p>
          </div>

          <div className="py-2">
            {WIDGET_LIST.map((widget) => {
              const isVisible = widgetConfig[widget.key as WidgetKey];
              return (
                <button
                  key={widget.key}
                  onClick={() => setWidgetConfig(widget.key as WidgetKey, !isVisible)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors group"
                >
                  <span className={clsx(
                    'text-xs font-bold transition-colors',
                    isVisible ? 'text-white' : 'text-slate'
                  )}>
                    {widget.label}
                  </span>
                  <div className={clsx(
                    'w-4 h-4 rounded border flex items-center justify-center transition-all',
                    isVisible
                      ? 'bg-emerald border-emerald'
                      : 'border-white/20 bg-white/5 group-hover:border-white/40'
                  )}>
                    {isVisible && <Check size={10} className="text-navy" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2 border-t border-white/5">
            <button
              onClick={() => WIDGET_LIST.forEach(w => setWidgetConfig(w.key as WidgetKey, true))}
              className="text-[9px] font-black text-emerald/60 hover:text-emerald uppercase tracking-widest transition-colors"
            >
              แสดงทั้งหมด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
