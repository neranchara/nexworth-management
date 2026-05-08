import React from 'react';
import { clsx } from 'clsx';

interface LogoProps {
  className?: string;
  showText?: boolean;
  textColor?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  className, 
  showText = true,
  textColor = 'text-white'
}) => {
  return (
    <div className={clsx("flex items-center gap-3 select-none", className)}>
      {/* N-Pillar Icon Construction */}
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Stable Foundation (Audit Trail Base) */}
        <rect x="4" y="34" width="32" height="3" fill="#708090" rx="1.5" />
        
        {/* The Three Upward Bars (Value Growth) */}
        {/* Bar 1 - Small */}
        <rect x="22" y="18" width="4" height="14" fill="#708090" rx="1" />
        {/* Bar 2 - Medium */}
        <rect x="28" y="12" width="4" height="20" fill="#708090" rx="1" />
        {/* Bar 3 - Large */}
        <rect x="34" y="4" width="4" height="28" fill="#708090" rx="1" />

        {/* Solid Connecting Archature (The "N" Structure) */}
        <path 
          d="M8 32V10L18 32V10" 
          stroke="#708090" 
          strokeWidth="5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Emerald Accent Dot (Success Metrics) */}
        <circle cx="36" cy="36" r="2.5" fill="#50C878" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={clsx(
            "text-xl font-bold tracking-widest uppercase pillar-text-bold",
            textColor
          )}>
            Nexworth<span className="text-brand-accent">.</span>
          </span>
          <span className="text-[7px] text-brand-secondary font-medium tracking-[0.2em] uppercase mt-1">
            Stability & Growth
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
