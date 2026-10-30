'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { ShoppingBag, LayoutDashboard, Package, CircleDollarSign, Zap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const links = [
    { href: '/pos', label: 'Kasir POS', icon: ShoppingBag },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/batches', label: 'Batch Bal', icon: Package },
    { href: '/keuangan', label: 'Keuangan & Laba', icon: CircleDollarSign },
  ];

  return (
    <header className="navbar-floating">
      <Link href="/pos" style={{ textDecoration: 'none' }}>
        <Logo size="md" />
      </Link>

      <nav className="nav-links-row">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href === '/pos' && pathname === '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-pill ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1d4ed8',
            padding: '6px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
            }}
          />
          <span>Midtrans Sandbox</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
