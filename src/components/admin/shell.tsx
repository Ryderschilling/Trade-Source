'use client';

import { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { adminLogout } from '@/app/admin/login/actions';
import { NavLinks, AdminSidebar } from '@/components/admin/sidebar';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-[9999] flex bg-neutral-100 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <AdminSidebar />
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 flex flex-col bg-neutral-900 overflow-y-auto md:hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-800 flex-shrink-0">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  Source A Trade
                </p>
                <p className="text-sm font-semibold text-white mt-0.5">Admin</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </aside>
        </>
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="text-neutral-600 hover:text-neutral-900 p-1 -ml-1 rounded"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-neutral-800">Admin</span>
          <form action={adminLogout}>
            <button
              type="submit"
              className="text-neutral-500 hover:text-neutral-900 p-1 -mr-1 rounded flex items-center gap-1.5 text-xs"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </header>

        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-neutral-200 bg-white flex-shrink-0">
          <h1 className="text-sm font-semibold text-neutral-700">Source A Trade Admin</h1>
          <form action={adminLogout}>
            <button
              type="submit"
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </form>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
