'use server';

import { cookies } from 'next/headers';

export async function setTheme(theme: 'dark' | 'light') {
  (await cookies()).set('NEXT_THEME', theme, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  });
}
