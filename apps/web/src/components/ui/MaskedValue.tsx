'use client';

import React from 'react';
import { useImpersonation } from '@/context/ImpersonationContext';
import { EyeOff } from 'lucide-react';

interface MaskedValueProps {
  value: string;
  type: 'email' | 'account' | 'phone' | 'name' | 'general';
  alwaysVisible?: boolean;
}

export const MaskedValue: React.FC<MaskedValueProps> = ({ value, type, alwaysVisible = false }) => {
  const { isImpersonating } = useImpersonation();

  // If not impersonating or alwaysVisible is true, show the raw value
  if (!isImpersonating || alwaysVisible) {
    return <span>{value}</span>;
  }

  // Masking Logic based on type
  const getMaskedValue = () => {
    if (!value) return '---';

    switch (type) {
      case 'email': {
        const [user, domain] = value.split('@');
        if (!domain) return '***@***';
        const visiblePart = user.slice(0, 3);
        return `${visiblePart}***@${domain}`;
      }
      case 'account': {
        const lastFour = value.slice(-4);
        return `****-****-${lastFour}`;
      }
      case 'phone': {
        const lastFour = value.slice(-4);
        return `08*-***-${lastFour}`;
      }
      case 'name': {
        const parts = value.split(' ');
        if (parts.length > 1) {
          return `${parts[0]} ${parts[1][0]}.***`;
        }
        return `${value.slice(0, 3)}***`;
      }
      default:
        return '********';
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-slate-400 font-mono italic">
      <EyeOff className="w-3.5 h-3.5 opacity-50" />
      {getMaskedValue()}
    </span>
  );
};
