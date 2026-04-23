'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
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

export default function DashboardGrid({ items }: DashboardGridProps) {
  const defaultLayouts = getDefaultLayouts(items);
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(defaultLayouts);
  const [isLocked, setIsLocked] = useState(true);
  const { width, mounted, containerRef } = useContainerWidth({ initialWidth: 1200 });

  useEffect(() => {
    const saved = loadLayouts();
    if (saved) {
      setTimeout(() => setLayouts(saved), 0);
    }
  }, []);

  const handleLayoutChange = useCallback((_currentLayout: readonly LayoutItem[], allLayouts: ResponsiveLayouts) => {
    if (!isLocked) {
      setLayouts(allLayouts);
      saveLayouts(allLayouts);
    }
  }, [isLocked]);

  const handleReset = useCallback(() => {
    const fresh = getDefaultLayouts(items);
    setLayouts(fresh);
    saveLayouts(fresh);
  }, [items]);

  if (!mounted) {
    return <div ref={containerRef} className="min-h-screen" />;
  }

  return (
    <div ref={containerRef}>
      {/* Controls */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            isLocked 
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600' 
              : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60 ring-1 ring-blue-300 dark:ring-blue-700'
          }`}
          title={isLocked ? 'Unlock to drag cards' : 'Lock layout'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          {isLocked ? 'Locked' : 'Editing'}
        </button>
        {!isLocked && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all"
            title="Reset to default layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {width > 0 && (
        <ResponsiveGridLayout
          className="dashboard-grid"
          layouts={layouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={40}
          width={width}
          dragConfig={{ enabled: !isLocked, handle: '.grid-drag-handle' }}
          resizeConfig={{ enabled: !isLocked }}
          onLayoutChange={handleLayoutChange}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {items.map(item => (
            <div key={item.key} className="grid-item-wrapper">
              {!isLocked && (
                <div className="grid-drag-handle" title="Drag to move">
                  <GripVertical className="w-4 h-4" />
                </div>
              )}
              <div className="grid-item-content">
                {item.content}
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
