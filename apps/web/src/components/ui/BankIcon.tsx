'use client';

// Mapping: bank code (uppercase) → simple-icons slug
// Only global banks that exist in the simple-icons library
const SIMPLE_ICONS_MAP: Record<string, string> = {
  HSBC: 'hsbc',
  CITI: 'citibank',
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  PAYPAL: 'paypal',
  ALIPAY: 'alipay',
  GOOGLEPAY: 'googlepay',
  APPLEPAY: 'applepay',
  STRIPE: 'stripe',
};

function loadSimpleIcon(slug: string): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const si = require('simple-icons');
    const key = 'si' + slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
    return (si[key]?.svg as string) ?? null;
  } catch {
    return null;
  }
}

interface BankIconProps {
  code: string;
  name: string;
  color?: string;
  size?: number;
  className?: string;
}

export default function BankIcon({ code, name, color = '#3B82F6', size = 36, className = '' }: BankIconProps) {
  const slug = SIMPLE_ICONS_MAP[code.toUpperCase()];
  const svgRaw = slug ? loadSimpleIcon(slug) : null;

  const abbr = code.slice(0, 3).toUpperCase();

  if (svgRaw) {
    const filled = svgRaw.replace(
      '<svg ',
      `<svg fill="${color}" width="${size}" height="${size}" `
    );
    return (
      <div
        className={`flex items-center justify-center rounded-xl ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: `${color}15`,
          border: `1px solid ${color}25`,
          padding: Math.floor(size * 0.18),
        }}
        title={name}
        dangerouslySetInnerHTML={{ __html: filled }}
      />
    );
  }

  // Fallback: colored badge with abbreviation
  return (
    <div
      className={`flex items-center justify-center rounded-xl font-black tracking-tighter select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}35`,
        fontSize: Math.floor(size * 0.32),
        letterSpacing: '-0.04em',
      }}
      title={name}
    >
      {abbr}
    </div>
  );
}
