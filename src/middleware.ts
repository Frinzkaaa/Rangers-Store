import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, AUTH_COOKIE_NAME } from './lib/auth';

const PROTECTED_PAGES = ['/pos', '/transaksi', '/dashboard', '/batches', '/keuangan'];
const OWNER_ONLY_PAGES = ['/batches', '/keuangan'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/midtrans/webhook') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Root path handling
  if (pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/pos', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Already logged in and visiting login page
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/pos', request.url));
    }
    return NextResponse.next();
  }

  // Check protected pages
  const isProtected = PROTECTED_PAGES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (isProtected) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role check: kasir restricted from /batches and /keuangan
    const isOwnerOnly = OWNER_ONLY_PAGES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
    );

    if (isOwnerOnly && session.role === 'kasir') {
      const posUrl = new URL('/pos', request.url);
      posUrl.searchParams.set('unauthorized', '1');
      return NextResponse.redirect(posUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
