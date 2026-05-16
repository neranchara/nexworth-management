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
      <div className="relative flex items-center justify-center shrink-0 pr-1">
        <svg 
          width="38" 
          height="38" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          {/* Middle Chart Bar (Behind) */}
          <rect x="45" y="24" width="10" height="56" fill="#0A1428" stroke="currentColor" strokeWidth="2.5" className={textColor} />
          
          {/* The Hollow N Shape (Front) */}
          <path 
            d="M 24 80 V 36 H 34 L 66 68 V 14 H 76 V 80 M 66 80 L 34 48 V 80" 
            fill="#0A1428" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinejoin="round"
            className={textColor}
          />

          {/* Hollow Base Line (Front) */}
          <rect x="16" y="80" width="68" height="6" fill="#0A1428" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" className={textColor} />
          
          {/* Hollow Emerald Accent Circle with Glow */}
          <circle 
            cx="93" 
            cy="83" 
            r="4" 
            fill="none" 
            stroke="#50C878" 
            strokeWidth="2.5" 
            style={{ filter: 'drop-shadow(0px 0px 4px rgba(80,200,120,0.8))' }}
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={clsx(
            "text-xl font-bold tracking-widest uppercase",
            textColor
          )}>
            Nexworth<span className="text-emerald">.</span>
          </span>
          <span className="text-[7.5px] text-brand-secondary font-bold tracking-[0.2em] uppercase mt-1">
            Stability & Growth
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
