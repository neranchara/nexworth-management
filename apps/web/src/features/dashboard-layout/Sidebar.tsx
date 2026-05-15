'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import Logo from '@/components/common/Logo';
import { SETUP_LINK } from './navConfig';
import { useDashboardNav } from './useDashboardNav';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { mainLinks, mgmtLinks, setupLabel } = useDashboardNav();

  return (
    <aside
      className={clsx(
        'hidden lg:flex flex-col bg-navy border-r border-slate/10 transition-all duration-300 relative shrink-0 z-50',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-emerald rounded-full flex items-center justify-center text-navy shadow-lg z-50 hover:scale-110 transition-transform"
        data-testid="sidebar-toggle-btn"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="h-20 flex items-center px-6 shrink-0 overflow-hidden">
        <Logo showText={!isCollapsed} />
      </div>

      <nav className="flex-1 mt-4 space-y-6 px-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="space-y-1">
          {mainLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={isCollapsed ? link.title : ''}
                className={clsx(
                  'flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-emerald/10 text-emerald border-r-2 border-emerald'
                    : 'text-slate hover:text-white hover:bg-white/5'
                )}
              >
                <link.icon
                  className={clsx(
                    'w-5 h-5 shrink-0 transition-colors',
                    isActive ? 'text-emerald' : 'text-slate group-hover:text-white'
                  )}
                />
                {!isCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden transition-opacity duration-300">
                    {link.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {mgmtLinks.length > 0 && (
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-4 text-[10px] font-bold text-slate/40 uppercase tracking-widest mb-2">
                Management
              </p>
            )}
            {mgmtLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={isCollapsed ? link.title : ''}
                  className={clsx(
                    'flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-emerald/10 text-emerald border-r-2 border-emerald'
                      : 'text-slate hover:text-white hover:bg-white/5'
                  )}
                >
                  <link.icon
                    className={clsx(
                      'w-5 h-5 shrink-0 transition-colors',
                      isActive ? 'text-emerald' : 'text-slate group-hover:text-white'
                    )}
                  />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden transition-opacity duration-300">
                      {link.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate/10">
        <Link
          href={SETUP_LINK.href}
          title={isCollapsed ? SETUP_LINK.title : ''}
          className={clsx(
            'flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group',
            pathname === SETUP_LINK.href
              ? 'bg-emerald/10 text-emerald'
              : 'text-slate hover:text-white hover:bg-white/5'
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!isCollapsed && (
            <span className="whitespace-nowrap transition-opacity duration-300">{setupLabel}</span>
          )}
        </Link>
      </div>
    </aside>
  );
}
