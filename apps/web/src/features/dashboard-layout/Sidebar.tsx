'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Settings, LogOut } from 'lucide-react';
import api from '@/lib/api';
import { clsx } from 'clsx';
import Logo from '@/components/common/Logo';
import { SETUP_LINK } from './navConfig';
import { useDashboardNav } from './useDashboardNav';
import { useTranslations } from 'next-intl';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('nav');
  const { mainLinks, mgmtLinks } = useDashboardNav();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      router.push('/login');
    } catch (error) {
      // Even if API fails, clear local state and redirect
      router.push('/login');
    }
  };

  return (
    <aside
      className={clsx(
        'hidden lg:flex flex-col bg-white dark:bg-navy border-r border-slate-200 dark:border-slate/10 transition-all duration-300 relative shrink-0 z-50',
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
                data-testid={link.testId}
                className={clsx(
                  'flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-emerald/10 text-emerald border-r-2 border-emerald'
                    : 'text-slate-600 dark:text-slate hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                )}
              >
                <link.icon
                  className={clsx(
                    'w-5 h-5 shrink-0 transition-colors',
                    isActive ? 'text-emerald' : 'text-slate-500 dark:text-slate group-hover:text-slate-900 dark:group-hover:text-white'
                  )}
                />
                {!isCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden transition-opacity duration-300">
                    {t(link.labelKey as any)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {mgmtLinks.length > 0 && (
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate/40 uppercase tracking-widest mb-2">
                {t('management')}
              </p>
            )}
            {mgmtLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={isCollapsed ? link.title : ''}
                  data-testid={link.testId}
                  className={clsx(
                    'flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-emerald/10 text-emerald border-r-2 border-emerald'
                      : 'text-slate-600 dark:text-slate hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  )}
                >
                  <link.icon
                    className={clsx(
                      'w-5 h-5 shrink-0 transition-colors',
                      isActive ? 'text-emerald' : 'text-slate-500 dark:text-slate group-hover:text-slate-900 dark:group-hover:text-white'
                    )}
                  />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden transition-opacity duration-300">
                      {t(link.labelKey as any)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate/10">
        <Link
          href={SETUP_LINK.href}
          title={isCollapsed ? SETUP_LINK.title : ''}
          data-testid={SETUP_LINK.testId}
          className={clsx(
            'flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group',
            pathname === SETUP_LINK.href
              ? 'bg-emerald/10 text-emerald'
              : 'text-slate hover:text-white hover:bg-white/5'
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!isCollapsed && (
            <span className="whitespace-nowrap transition-opacity duration-300">{t('setup')}</span>
          )}
        </Link>
        
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : ''}
          data-testid="layout-nav-btn-logout"
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 group mt-1"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && (
            <span className="whitespace-nowrap transition-opacity duration-300">{t('logout')}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
