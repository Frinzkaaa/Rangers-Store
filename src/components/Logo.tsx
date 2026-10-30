import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const iconSizes = {
    sm: 28,
    md: 36,
    lg: 48,
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const px = iconSizes[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      {/* Minimalist Geometric Monogram RS */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect width="100" height="100" rx="22" fill="#0f172a" />
        {/* Modern RS monogram path */}
        <path
          d="M28 26H52C61 26 66 31 66 38C66 45 61 50 52 50H38"
          stroke="#10b981"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M38 26V74"
          stroke="#ffffff"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M48 50L68 74"
          stroke="#ffffff"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M72 44C72 38 68 34 62 34"
          stroke="#6366f1"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
      <div>
        <div style={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#0f172a', fontSize: size === 'sm' ? '15px' : size === 'md' ? '18px' : '22px' }}>
          RANGERS <span style={{ color: '#059669' }}>STORE</span>
        </div>
        {showSubtitle && (
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
            Thrift & Vintage POS
          </div>
        )}
      </div>
    </div>
  );
};

export default Logo;
