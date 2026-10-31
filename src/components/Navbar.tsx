'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';
import {
  ShoppingBag,
  LayoutDashboard,
  Package,
  CircleDollarSign,
  Receipt,
  User,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ username: string; name: string; role: 'owner' | 'kasir' } | null>(null);

  useEffect(() => {
    // Check active session
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null));
  }, [pathname]);

  // Hide Navbar completely on login page
  if (pathname === '/login') {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const allLinks = [
    { href: '/pos', label: 'Kasir POS', icon: ShoppingBag, ownerOnly: false },
    { href: '/transaksi', label: 'Transaksi', icon: Receipt, ownerOnly: false },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, ownerOnly: false },
    { href: '/batches', label: 'Batch Bal', icon: Package, ownerOnly: true },
    { href: '/keuangan', label: 'Keuangan & Laba', icon: CircleDollarSign, ownerOnly: true },
  ];

  // Kasir only sees non-owner-only links
  const visibleLinks = allLinks.filter(
    (link) => !link.ownerOnly || currentUser?.role === 'owner'
  );

  return (
    <header className="navbar-floating">
      <Link href="/pos" style={{ textDecoration: 'none' }}>
        <Logo size="md" />
      </Link>

      <nav className="nav-links-row">
        {visibleLinks.map((link) => {
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
        {/* Midtrans Sandbox Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1d4ed8',
            padding: '5px 10px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
            }}
          />
          <span>Midtrans</span>
        </div>

        {/* Current User Badge */}
        {currentUser && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: currentUser.role === 'owner' ? '#faf5ff' : '#f0fdf4',
              border: currentUser.role === 'owner' ? '1px solid #e9d5ff' : '1px solid #bbf7d0',
              color: currentUser.role === 'owner' ? '#7c3aed' : '#15803d',
              padding: '5px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'capitalize',
            }}
          >
            {currentUser.role === 'owner' ? <ShieldCheck size={13} /> : <User size={13} />}
            <span>{currentUser.role === 'owner' ? 'Owner' : 'Kasir'}</span>
          </div>
        )}

        {/* Logout Button */}
        {currentUser && (
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar / Logout"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              padding: '5px 9px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = '#fca5a5';
              e.currentTarget.style.background = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = '#f8fafc';
            }}
          >
            <LogOut size={13} />
            <span>Keluar</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
