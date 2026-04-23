'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ScrollText,
  Building2,
  Users,
  Star,
  Inbox,
  FileText,
  MessageSquare,
  Mail,
  Home,
  Tag,
  BookOpen,
  Trophy,
  Sparkles,
  Send,
  List,
  CreditCard,
  Zap,
  Package,
  Settings,
  Bell,
  BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Dashboard',
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/admin/businesses', label: 'Businesses', icon: Building2 },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
      { href: '/admin/leads', label: 'Leads', icon: Inbox },
      { href: '/admin/quote-requests', label: 'Quote requests', icon: FileText },
      { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
      { href: '/admin/contact', label: 'Contact inbox', icon: Mail },
    ],
  },
  {
    label: 'Site',
    items: [
      { href: '/admin/homepage', label: 'Homepage', icon: Home },
      { href: '/admin/categories', label: 'Categories', icon: Tag },
      { href: '/admin/pages', label: 'Static pages', icon: BookOpen },
    ],
  },
  {
    label: 'Growth',
    items: [
      { href: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
      { href: '/admin/featured', label: 'Featured placements', icon: Sparkles },
      { href: '/admin/emails/campaigns', label: 'Email campaigns', icon: Send },
      { href: '/admin/emails/lists', label: 'Email lists', icon: List },
      { href: '/admin/emails/sends', label: 'Email send log', icon: Mail },
      { href: '/admin/emails/unsubscribes', label: 'Unsubscribes', icon: Bell },
    ],
  },
  {
    label: 'Billing',
    items: [
      { href: '/admin/analytics', label: 'Revenue analytics', icon: BarChart2 },
      { href: '/admin/billing', label: 'Payments overview', icon: CreditCard },
      { href: '/admin/billing/events', label: 'Stripe events', icon: Zap },
      { href: '/admin/addon-requests', label: 'Addon requests', icon: Package },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings / flags', icon: Settings },
      { href: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

function NavLink({ href, label, icon: Icon, exact, onNavigate }: NavItem & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors',
        active
          ? 'bg-neutral-800 text-white font-medium'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
      )}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {label}
    </Link>
  );
}

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 px-2 py-3 space-y-4">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink key={item.href + item.label} {...item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <aside className="w-52 flex-shrink-0 flex flex-col bg-neutral-900 border-r border-neutral-800 overflow-y-auto">
      <div className="px-4 py-3.5 border-b border-neutral-800 flex-shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          Source A Trade
        </p>
        <p className="text-sm font-semibold text-white mt-0.5">Admin</p>
      </div>
      <NavLinks />
    </aside>
  );
}
