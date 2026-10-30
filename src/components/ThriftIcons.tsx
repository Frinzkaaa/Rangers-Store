import React from 'react';

interface ThriftIconProps {
  type: 'tshirt' | 'shirt' | 'sweater' | 'hoodie' | 'jacket' | 'star' | 'all';
  size?: number;
  color?: string;
}

export const ThriftIcon: React.FC<ThriftIconProps> = ({ type, size = 32, color = '#2563eb' }) => {
  switch (type) {
    case 'tshirt':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
        </svg>
      );
    case 'shirt':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
          <path d="M12 6v14"/>
          <path d="M12 10h.01"/>
          <path d="M12 14h.01"/>
        </svg>
      );
    case 'sweater':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 2a4 4 0 0 1-8 0"/>
          <path d="M21 8l-3-5-2 1-3-2-3 2-2-1-3 5v3h3v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-9h3V8z"/>
          <path d="M8 12h8"/>
          <path d="M8 16h8"/>
        </svg>
      );
    case 'hoodie':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0-6 6v1h12V9a6 6 0 0 0-6-6z"/>
          <path d="M4 10v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10"/>
          <path d="M9 16h6v4H9z"/>
        </svg>
      );
    case 'jacket':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h4l4 4 4-4h4v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z"/>
          <path d="M12 8v14"/>
          <path d="M4 8l4 3"/>
          <path d="M20 8l-4 3"/>
        </svg>
      );
    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      );
    case 'all':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="7" x="3" y="3" rx="2" />
          <rect width="7" height="7" x="14" y="3" rx="2" />
          <rect width="7" height="7" x="14" y="14" rx="2" />
          <rect width="7" height="7" x="3" y="14" rx="2" />
        </svg>
      );
  }
};

export default ThriftIcon;
