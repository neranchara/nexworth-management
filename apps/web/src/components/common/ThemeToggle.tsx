'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { setTheme } from '@/actions/theme';

function getThemeCookie(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';
  const match = document.cookie.match(/(?:^|;\s*)NEXT_THEME=([^;]*)/);
  return (match?.[1] as 'dark' | 'light') ?? 'dark';
}

export default function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setThemeState(getThemeCookie());
  }, []);

  const handleSwitch = (next: 'dark' | 'light') => {
    if (next === theme || isPending) return;
    startTransition(async () => {
      await setTheme(next);
      setThemeState(next);
      router.refresh();
    });
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => handleSwitch(theme === 'dark' ? 'light' : 'dark')}
        disabled={isPending}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-slate-600 dark:text-slate hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-50"
      >
        {theme === 'dark'
          ? <Sun className="w-4 h-4 text-emerald" />
          : <Moon className="w-4 h-4 text-emerald" />}
      </button>
    );
  }

  return (
    <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-lg p-0.5 gap-0.5">
      <button
        type="button"
        onClick={() => handleSwitch('dark')}
        disabled={isPending}
        title="Dark Mode"
        className={`px-2.5 py-1 rounded-md transition-all disabled:opacity-50 flex items-center gap-1 ${
          theme === 'dark'
            ? 'bg-emerald text-midnight shadow'
            : 'text-slate-600 dark:text-slate hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Moon className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={() => handleSwitch('light')}
        disabled={isPending}
        title="Light Mode"
        className={`px-2.5 py-1 rounded-md transition-all disabled:opacity-50 flex items-center gap-1 ${
          theme === 'light'
            ? 'bg-emerald text-midnight shadow'
            : 'text-slate-600 dark:text-slate hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Sun className="w-3 h-3" />
      </button>
    </div>
  );
}
