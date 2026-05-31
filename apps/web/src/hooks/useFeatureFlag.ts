'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
}

let cache: Record<string, boolean> | null = null;
let fetchPromise: Promise<void> | null = null;

async function loadFlags() {
  if (cache) return;
  if (fetchPromise) return fetchPromise;

  fetchPromise = api.get('/features')
    .then(res => {
      const flags: FeatureFlag[] = res.data.features || [];
      cache = Object.fromEntries(flags.map(f => [f.name, f.enabled]));
    })
    .catch(() => {
      cache = {};
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

export function useFeatureFlag(name: string): boolean {
  const [enabled, setEnabled] = useState<boolean>(() => cache?.[name] ?? true);

  useEffect(() => {
    if (cache) {
      setEnabled(cache[name] ?? true);
      return;
    }
    loadFlags().then(() => setEnabled(cache?.[name] ?? true));
  }, [name]);

  return enabled;
}

export function useFeatureFlags(names: string[]): Record<string, boolean> {
  const [flags, setFlags] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(names.map(n => [n, cache?.[n] ?? true]))
  );

  useEffect(() => {
    if (cache) {
      setFlags(Object.fromEntries(names.map(n => [n, cache![n] ?? true])));
      return;
    }
    loadFlags().then(() =>
      setFlags(Object.fromEntries(names.map(n => [n, cache?.[n] ?? true])))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names.join(',')]);

  return flags;
}

export function invalidateFlagCache() {
  cache = null;
}
