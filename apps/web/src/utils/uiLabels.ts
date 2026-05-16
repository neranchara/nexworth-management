/** Detect mojibake / missing-glyph placeholders from bad DB encoding or latin-only fonts */
export function hasCorruptedText(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (value.includes('\uFFFD')) return true;
  if (/\?{2,}/.test(value)) return true;
  return false;
}

export function pickLabel(apiLabel: unknown, fallback: string): string {
  if (typeof apiLabel !== 'string' || hasCorruptedText(apiLabel)) return fallback;
  return apiLabel;
}

/** Merge API sidebar rows with built-in defaults (keeps icons + Thai fallbacks) */
export function mergeSidebarLinks<T extends { href: string; label: string; title?: string }>(
  defaults: T[],
  fromApi: unknown
): T[] {
  if (!Array.isArray(fromApi) || fromApi.length === 0) return defaults;

  return defaults.map((def) => {
    const row = fromApi.find((c: { href?: string }) => c?.href === def.href);
    if (!row) return def;
    return {
      ...def,
      ...row,
      label: pickLabel(row.label, def.label),
      title: pickLabel(row.title, def.title ?? def.label),
    };
  });
}

/** Shallow merge for page label objects; skips corrupted string fields */
export function mergePageLabels<T extends Record<string, unknown>>(defaults: T, fromApi: unknown): T {
  if (!fromApi || typeof fromApi !== 'object' || Array.isArray(fromApi)) return defaults;

  const merged = { ...defaults } as Record<string, unknown>;
  for (const [key, val] of Object.entries(fromApi as Record<string, unknown>)) {
    if (val === null || val === undefined) continue;
    if (typeof val === 'string') {
      if (!hasCorruptedText(val)) merged[key] = val;
    } else if (typeof val === 'object' && !Array.isArray(val) && typeof defaults[key] === 'object') {
      merged[key] = mergePageLabels(
        defaults[key] as Record<string, unknown>,
        val
      );
    } else if (typeof val !== 'object') {
      merged[key] = val;
    }
  }
  return merged as T;
}
