import { NextResponse } from 'next/server';
import { authenticateUser, signSessionToken, AUTH_COOKIE_NAME } from '../../../../lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body.username || '';
    const secret = body.secret || body.passwordOrPin || body.pin || body.password || '';

    if (!username || !secret) {
      return NextResponse.json(
        { success: false, error: 'Username dan PIN / Password wajib diisi' },
        { status: 400 }
      );
    }

    const user = authenticateUser(username, secret);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Username atau PIN / Password salah' },
        { status: 401 }
      );
    }

    const token = await signSessionToken({
      username: user.username,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });

    // Set HTTP-only session cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600, // 7 days
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
