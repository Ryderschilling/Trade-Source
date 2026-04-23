import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAdminToken } from '@/lib/admin-auth'

export interface AdminContext {
  actor: string
  ip: string
  ua: string
}

export async function requireAdmin(): Promise<AdminContext> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])

  const token = cookieStore.get('admin_token')?.value
  const secret = process.env.ADMIN_SECRET_KEY

  if (!token || !secret) redirect('/admin/login')

  const payload = await verifyAdminToken(token, secret)
  if (!payload) redirect('/admin/login')

  const ip =
    headerStore.get('x-forwarded-for')?.split(',')[0].trim() ??
    headerStore.get('x-real-ip') ??
    'unknown'
  const ua = headerStore.get('user-agent') ?? 'unknown'

  return { actor: 'admin', ip, ua }
}
