'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '../../components/Logo';
import {
  User,
  ShieldCheck,
  KeyRound,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Delete,
  Eye,
  EyeOff,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get('from') || '/pos';

  const [role, setRole] = useState<'kasir' | 'owner'>('kasir');
  const [authMode, setAuthMode] = useState<'pin' | 'password'>('pin');
  const [pin, setPin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Clear inputs when switching role or mode
  useEffect(() => {
    setPin('');
    setPassword('');
    setErrorMsg('');
  }, [role, authMode]);

  const handleLogin = async (overrideRole?: 'kasir' | 'owner', overrideSecret?: string) => {
    const activeRole = overrideRole || role;
    const activeSecret = overrideSecret || (authMode === 'pin' ? pin : password);

    if (!activeSecret) {
      setErrorMsg(authMode === 'pin' ? 'Masukkan PIN 4-digit' : 'Masukkan kata sandi');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: activeRole,
          secret: activeSecret,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Login gagal, periksa PIN atau Password Anda');
        setLoading(false);
        return;
      }

      // Successful login -> redirect to destination
      router.push(fromPath);
      router.refresh();
    } catch (err) {
      setErrorMsg('Terjadi kesalahan jaringan: ' + String(err));
      setLoading(false);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (loading) return;
    if (val === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
    } else if (val === 'clear') {
      setPin('');
    } else if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      // Auto-submit when 4th digit entered in PIN mode
      if (newPin.length === 4) {
        handleLogin(role, newPin);
      }
    }
  };

  const quickLogin = (targetRole: 'kasir' | 'owner', targetPin: string) => {
    setRole(targetRole);
    setPin(targetPin);
    handleLogin(targetRole, targetPin);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background glows */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '15%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '15%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(168, 85, 247, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '28px',
          padding: '32px 28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(16px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-block', marginBottom: '8px' }}>
            <Logo size="lg" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
            Masuk ke Aplikasi
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            POS Kasir & Manajemen Toko Thrifting
          </p>
        </div>

        {/* Notice from redirection */}
        {searchParams.get('from') && (
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#1e40af',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>Silakan login untuk mengakses halaman yang dituju.</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#b91c1c',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Role Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '16px',
            marginBottom: '20px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setRole('kasir')}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              background: role === 'kasir' ? '#ffffff' : 'transparent',
              color: role === 'kasir' ? '#0f172a' : '#64748b',
              fontWeight: role === 'kasir' ? 800 : 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: role === 'kasir' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <User size={16} color={role === 'kasir' ? '#2563eb' : '#64748b'} />
            <span>Kasir POS</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('owner')}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              background: role === 'owner' ? '#ffffff' : 'transparent',
              color: role === 'owner' ? '#0f172a' : '#64748b',
              fontWeight: role === 'owner' ? 800 : 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: role === 'owner' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldCheck size={16} color={role === 'owner' ? '#7c3aed' : '#64748b'} />
            <span>Owner / Admin</span>
          </button>
        </div>

        {/* Input Method Switcher (PIN vs Password) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Metode Otentikasi
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setAuthMode('pin')}
              style={{
                background: authMode === 'pin' ? '#eff6ff' : '#f8fafc',
                border: authMode === 'pin' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                color: authMode === 'pin' ? '#2563eb' : '#64748b',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              PIN Cepat
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('password')}
              style={{
                background: authMode === 'password' ? '#eff6ff' : '#f8fafc',
                border: authMode === 'password' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                color: authMode === 'password' ? '#2563eb' : '#64748b',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Password
            </button>
          </div>
        </div>

        {/* PIN Mode */}
        {authMode === 'pin' ? (
          <div>
            {/* PIN Display Indicator */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '14px',
                margin: '18px 0 24px',
              }}
            >
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: filled ? (role === 'owner' ? '#7c3aed' : '#2563eb') : '#e2e8f0',
                      transition: 'all 0.15s ease',
                      transform: filled ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                );
              })}
            </div>

            {/* On-screen Touch Keypad */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => {
                const isAction = key === 'clear' || key === 'backspace';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      background: isAction ? '#f8fafc' : '#ffffff',
                      color: isAction ? '#64748b' : '#0f172a',
                      fontSize: isAction ? '12px' : '18px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'background 0.15s',
                    }}
                  >
                    {key === 'clear' ? (
                      'RESET'
                    ) : key === 'backspace' ? (
                      <Delete size={18} />
                    ) : (
                      key
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Password Mode */
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={`Masukkan sandi ${role}...`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin();
                }}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 14px',
                  borderRadius: '14px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleLogin()}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '12px',
                borderRadius: '14px',
                border: 'none',
                background: role === 'owner' ? '#7c3aed' : '#2563eb',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow:
                  role === 'owner'
                    ? '0 4px 12px rgba(124, 58, 237, 0.3)'
                    : '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Fast Store Presets / Demo Logins */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '10px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Sparkles size={13} color="#f59e0b" />
            <span>Akses Cepat Toko (1-Klik)</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => quickLogin('kasir', '1234')}
              style={{
                flex: 1,
                padding: '9px 10px',
                borderRadius: '10px',
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>Kasir Cepat</div>
              <div style={{ fontSize: '10px', fontWeight: 500, color: '#3b82f6', marginTop: '2px' }}>
                PIN: 1234
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('owner', '8888')}
              style={{
                flex: 1,
                padding: '9px 10px',
                borderRadius: '10px',
                border: '1px solid #e9d5ff',
                background: '#faf5ff',
                color: '#7c3aed',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>Owner Cepat</div>
              <div style={{ fontSize: '10px', fontWeight: 500, color: '#9333ea', marginTop: '2px' }}>
                PIN: 8888
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            color: '#94a3b8',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <span>Memuat halaman login...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
