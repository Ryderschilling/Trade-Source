import { adminLogout } from '@/app/admin/login/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function AdminTopBar() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 bg-white">
      <h1 className="text-sm font-semibold text-neutral-700">
        Trade Source Admin
      </h1>
      <form action={adminLogout}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-neutral-600 hover:text-neutral-900 gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </form>
    </header>
  );
}
