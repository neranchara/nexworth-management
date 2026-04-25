'use client';

import { useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { ResponsiveGridLayout } from 'react-grid-layout';
import type { LayoutItem, ResponsiveLayouts } from 'react-grid-layout';
import { Lock, Unlock, RotateCcw, GripVertical } from 'lucide-react';

import 'react-grid-layout/css/styles.css';

const STORAGE_KEY = 'nexworth-dashboard-layout';

export interface GridItemConfig {
  key: string;
  content: ReactNode;
  defaultLayout: {
    lg: { x: number; y: number; w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number };
    md?: { x: number; y: number; w: number; h: number };
    sm?: { x: number; y: number; w: number; h: number };
  };
}

interface DashboardGridProps {
  items: GridItemConfig[];
  isLocked?: boolean;
  setIsLocked?: (locked: boolean) => void;
}

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768 };
const COLS = { lg: 12, md: 10, sm: 6 };

function getDefaultLayouts(items: GridItemConfig[]): ResponsiveLayouts {
  const lg: LayoutItem[] = items.map(item => ({
    i: item.key,
    ...item.defaultLayout.lg,
  }));

  const md: LayoutItem[] = items.map(item => ({
    i: item.key,
    ...(item.defaultLayout.md || {
      x: 0,
      y: 0,
      w: 10,
      h: item.defaultLayout.lg.h,
    }),
  }));

  const sm: LayoutItem[] = items.map(item => ({
    i: item.key,
    ...(item.defaultLayout.sm || {
      x: 0,
      y: 0,
      w: 6,
      h: item.defaultLayout.lg.h,
    }),
  }));

  return { lg, md, sm };
}

function loadLayouts(): ResponsiveLayouts | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveLayouts(layouts: ResponsiveLayouts) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
  } catch { /* ignore quota errors */ }
}

export default function DashboardGrid({ items, isLocked: externalLocked, setIsLocked: setExternalLocked }: DashboardGridProps) {
  // --- Manual Width Tracking to prevent Infinite Loops ---
  const [width, setWidth] = useState(0);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    if (!containerRef.current) return;
    
    // Initial width
    setWidth(containerRef.current.offsetWidth);

    const observer = new ResizeObserver((entries) => {
      if (!entries || !entries.length) return;
      const newWidth = entries[0].contentRect.width;
      // Use requestAnimationFrame to debunced width updates if needed, 
      // but simple comparison is usually enough.
      setWidth(prev => Math.floor(newWidth) !== Math.floor(prev) ? newWidth : prev);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // --- Layout State ---
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(() => {
    const saved = loadLayouts();
    return saved || getDefaultLayouts(items);
  });
  
  const [internalLocked, setInternalLocked] = useState(true);
  const isLocked = externalLocked !== undefined ? externalLocked : internalLocked;
  const setIsLocked = setExternalLocked !== undefined ? setExternalLocked : setInternalLocked;

  // Sync with default layouts when items change (e.g. goals added)
  useEffect(() => {
    if (!loadLayouts()) {
      setLayouts(getDefaultLayouts(items));
    }
  }, [items]);

  const handleLayoutChange = useCallback((_currentLayout: readonly LayoutItem[], allLayouts: ResponsiveLayouts) => {
    if (!isLocked && mounted) {
      setLayouts(allLayouts);
      saveLayouts(allLayouts);
    }
  }, [isLocked, mounted]);

  const handleReset = useCallback(() => {
    const fresh = getDefaultLayouts(items);
    setLayouts(fresh);
    saveLayouts(fresh);
  }, [items]);

  return (
    <div ref={containerRef} className="w-full relative min-h-[400px]">
      {!mounted ? (
        <div className="w-full h-96 flex items-center justify-center">
           <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Dashboard Controls - Fixed Floating Bottom-Right */}
          <div className="fixed bottom-8 right-8 z-[100] pointer-events-none group/controls">
            <div className="flex flex-col-reverse items-center gap-2 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto ring-1 ring-black/5 transition-all duration-500 hover:scale-105">
              <button
                onClick={() => setIsLocked(!isLocked)}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                  isLocked 
                    ? 'text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                    : 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 ring-4 ring-blue-500/10'
                }`}
                title={isLocked ? "Unlock Layout" : "Lock Layout"}
              >
                {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </button>
              
              {!isLocked && (
                <button
                  onClick={handleReset}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-amber-500 text-white hover:bg-amber-600 shadow-xl shadow-amber-500/30 transition-all duration-300 animate-in zoom-in slide-in-from-bottom-2"
                  title="Reset Layout"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {width > 0 && (
            <ResponsiveGridLayout
              className="dashboard-grid"
              layouts={Object.keys(layouts).reduce((acc: any, key) => {
                acc[key] = (layouts as any)[key].map((item: any) => ({
                  ...item,
                  static: isLocked
                }));
                return acc;
              }, {})}
              breakpoints={BREAKPOINTS}
              cols={COLS}
              rowHeight={40}
              width={width}
              isDraggable={!isLocked}
              isResizable={!isLocked}
              draggableHandle=".grid-drag-handle"
              onLayoutChange={handleLayoutChange}
              margin={[16, 16]}
              containerPadding={[0, 0]}
              useCSSTransforms={mounted}
            >
              {items.map(item => (
                <div key={item.key} className="grid-item-wrapper bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700/50 overflow-hidden group">
                  {!isLocked && (
                    <div className="grid-drag-handle absolute top-3 right-3 p-1.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg z-20 transition-colors opacity-0 group-hover:opacity-100">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}
                  <div className="h-full w-full">
                    {item.content}
                  </div>
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </>
      )}
    </div>
  );
}
