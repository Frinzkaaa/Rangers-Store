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
    <header className="navbar-container">
      <div className="navbar-inner">
        <Link href="/pos" style={{ textDecoration: 'none' }}>
          <Logo size="md" />
        </Link>

        <nav className="nav-menu">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href === '/pos' && pathname === '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="nav-badge-wrapper">
          <div className="sandbox-badge">
            <span className="badge-dot" />
            <span className="badge-text">Midtrans Sandbox</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
