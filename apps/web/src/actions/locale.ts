'use server';

import { cookies } from 'next/headers';

export async function setLocale(locale: 'th' | 'en') {
  (await cookies()).set('NEXT_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  });
}
