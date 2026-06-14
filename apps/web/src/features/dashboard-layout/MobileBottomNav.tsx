'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Target,
  Menu,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';

export default function MobileBottomNav({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const navLinks = [
    { href: '/dashboard', labelKey: 'home', icon: LayoutDashboard },
    { href: '/dashboard/transactions', labelKey: 'transactions', icon: Receipt },
    { href: '/dashboard/assets', labelKey: 'assets', icon: Wallet },
    { href: '/dashboard/goals', labelKey: 'goals', icon: Target },
  ];

  return (
    <nav className="lg:hidden h-16 bg-navy border-t border-slate/10 flex items-center justify-around px-2 shrink-0 z-50 fixed bottom-0 inset-x-0 backdrop-blur-xl bg-navy/80">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "flex flex-col items-center justify-center gap-1 w-1/5 transition-all relative",
              isActive ? "text-emerald" : "text-slate"
            )}
          >
            <link.icon className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">
              {t(link.labelKey as any)}
            </span>
            {isActive && <div className="w-1 h-1 bg-emerald rounded-full absolute bottom-1" />}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center gap-1 w-1/5 text-slate hover:text-emerald transition-all"
        aria-label={t('menu')}
      >
        <Menu className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-tighter">{t('menu')}</span>
      </button>
    </nav>
  );
}
