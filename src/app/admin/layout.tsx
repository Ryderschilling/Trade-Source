import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken } from '@/lib/admin-auth';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminTopBar } from '@/components/admin/top-bar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get('x-pathname') ?? '';
  const isLoginPage = pathname.startsWith('/admin/login');

  if (!isLoginPage) {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    const secret = process.env.ADMIN_SECRET_KEY;
    const valid = token && secret ? await verifyAdminToken(token, secret) : null;
    if (!valid) redirect('/admin/login');
  }

  return (
    <div className="fixed inset-0 z-[9999] flex bg-neutral-100 overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminTopBar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
