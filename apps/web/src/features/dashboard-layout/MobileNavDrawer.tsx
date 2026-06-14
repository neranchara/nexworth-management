'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import Logo from '@/components/common/Logo';
import { SETUP_LINK, type NavLinkItem } from './navConfig';
import { useTranslations } from 'next-intl';

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  mainLinks: NavLinkItem[];
  mgmtLinks: NavLinkItem[];
}

function DrawerLinks({
  links,
  onNavigate,
}: {
  links: NavLinkItem[];
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            data-testid={link.testId}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-emerald/10 text-emerald'
                : 'text-slate hover:text-white hover:bg-white/5'
            )}
          >
            <link.icon className="w-5 h-5 shrink-0" />
            {t(link.labelKey as any)}
          </Link>
        );
      })}
    </>
  );
}

export default function MobileNavDrawer({
  open,
  onClose,
  mainLinks,
  mgmtLinks,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] lg:hidden transition-opacity',
          open ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 w-72 bg-navy border-r border-slate/10 z-[200] flex flex-col shadow-2xl lg:hidden transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
        aria-hidden={!open}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate/10 shrink-0">
          <Logo showText />
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 text-slate hover:text-white"
            aria-label={t('closeMenu')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-slate/40 uppercase tracking-widest mb-2">{t('mainMenu')}</p>
            <DrawerLinks links={mainLinks} onNavigate={onClose} />
          </div>
          {mgmtLinks.length > 0 && (
            <div className="space-y-1">
              <p className="px-4 text-[10px] font-bold text-slate/40 uppercase tracking-widest mb-2">{t('management')}</p>
              <DrawerLinks links={mgmtLinks} onNavigate={onClose} />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate/10">
          <Link
            href={SETUP_LINK.href}
            onClick={onClose}
            data-testid={SETUP_LINK.testId}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
              pathname === SETUP_LINK.href
                ? 'bg-emerald/10 text-emerald'
                : 'text-slate hover:text-white hover:bg-white/5'
            )}
          >
            <SETUP_LINK.icon className="w-5 h-5 shrink-0" />
            {t('setup')}
          </Link>
        </div>
      </aside>
    </>
  );
}
