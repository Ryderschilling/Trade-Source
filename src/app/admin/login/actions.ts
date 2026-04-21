'use server';

import { timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { signAdminToken } from '@/lib/admin-auth';

export type LoginState = { error?: string };

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  // timingSafeEqual requires equal lengths; compare lengths separately so we
  // don't short-circuit on length mismatch before the constant-time check.
  if (aBuf.length !== bBuf.length) {
    timingSafeEqual(aBuf, aBuf); // dummy op to normalize timing
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export async function adminLogin(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get('username') ?? '',
    password: formData.get('password') ?? '',
  });
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError ?? 'Please fill in all fields.' };
  }

  const { username, password } = parsed.data;

  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET_KEY) {
    console.error('Server misconfiguration: missing required ADMIN_* env vars');
    return { error: 'Login failed' };
  }

  const expectedUsername = process.env.ADMIN_USERNAME!;
  const expectedPassword = process.env.ADMIN_PASSWORD!;
  const secretKey = process.env.ADMIN_SECRET_KEY!;

  const usernameOk = safeCompare(username, expectedUsername);
  const passwordOk = safeCompare(password, expectedPassword);

  // Evaluate both comparisons before branching to prevent short-circuit leaks
  if (!usernameOk || !passwordOk) {
    return { error: 'Invalid credentials' };
  }

  const token = await signAdminToken(secretKey);

  const cookieStore = await cookies();
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours — matches JWT expiry
  });

  redirect('/admin');
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  redirect('/admin/login');
}
