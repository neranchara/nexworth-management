'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useEffect, useState } from 'react';
import { setLocale } from '@/actions/locale';

function getLocaleCookie(): 'th' | 'en' {
  if (typeof document === 'undefined') return 'th';
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  return (match?.[1] as 'th' | 'en') ?? 'th';
}

export default function LanguageToggle({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [locale, setLocaleState] = useState<'th' | 'en'>('th');

  useEffect(() => {
    setLocaleState(getLocaleCookie());
  }, []);

  const handleSwitch = (next: 'th' | 'en') => {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocale(next);
      setLocaleState(next);
      router.refresh();
    });
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => handleSwitch(locale === 'th' ? 'en' : 'th')}
        disabled={isPending}
        title={locale === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
        className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-50"
      >
        <span className="text-emerald">{locale.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-lg p-0.5 gap-0.5">
        <button
          type="button"
          onClick={() => handleSwitch('th')}
          disabled={isPending}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all disabled:opacity-50 ${
            locale === 'th'
              ? 'bg-emerald text-midnight shadow'
              : 'text-slate-600 dark:text-slate hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          TH
        </button>
        <button
          type="button"
          onClick={() => handleSwitch('en')}
          disabled={isPending}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all disabled:opacity-50 ${
            locale === 'en'
              ? 'bg-emerald text-midnight shadow'
              : 'text-slate-600 dark:text-slate hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          EN
        </button>
      </div>
      {isPending && (
        <span className="w-3 h-3 border border-emerald border-t-transparent rounded-full animate-spin shrink-0" />
      )}
    </div>
  );
}
