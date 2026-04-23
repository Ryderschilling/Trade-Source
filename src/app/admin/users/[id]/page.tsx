import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteButton } from '@/components/admin/delete-button';
import { EditField } from '@/components/admin/edit-field';
import { TabBar } from '@/components/admin/tab-bar';
import { ChevronLeft, Star } from 'lucide-react';
import {
  updateUserField,
  updateUserRole,
  sendPasswordReset,
  deleteUser,
} from './actions';

const TABS = [
  { id: 'profile',  label: 'Profile'  },
  { id: 'activity', label: 'Activity' },
  { id: 'auth',     label: 'Auth'     },
  { id: 'audit',    label: 'Audit'    },
];

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-neutral-100 last:border-0 grid grid-cols-[10rem_1fr] gap-4 items-start">
      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <div className="text-sm text-neutral-800">{children}</div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest pt-4 pb-1">
      {children}
    </p>
  );
}

function Nil() {
  return <span className="text-neutral-400">—</span>;
}

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const tab = sp.tab ?? 'profile';
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !user) notFound();

  // Tab-specific data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reviews: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let leads: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let auditEvents: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let authUser: any = null;

  if (tab === 'activity') {
    const [{ data: rv }, { data: ld }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('reviews')
        .select('*, contractors(business_name, slug)')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('leads')
        .select('*, contractors(business_name)')
        .eq('contractor_id', id) // leads don't have user_id — show leads submitted via their businesses
        .order('created_at', { ascending: false })
        .limit(50),
    ]);
    reviews = rv ?? [];
    leads = ld ?? [];
  }

  if (tab === 'auth') {
    const { data } = await supabase.auth.admin.getUserById(id);
    authUser = data?.user ?? null;
  }

  if (tab === 'audit') {
    const { data } = await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('target_id', id)
      .order('created_at', { ascending: false })
      .limit(50);
    auditEvents = data ?? [];
  }

  // Bound actions
  const deleteAction = deleteUser.bind(null, id);
  const setAdmin     = updateUserRole.bind(null, id, 'admin');
  const setMember    = updateUserRole.bind(null, id, 'member');
  const resetAction  = sendPasswordReset.bind(null, id);

  function fieldAction(field: string) {
    return updateUserField.bind(null, id, field);
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            Users
          </Link>
          <h2 className="text-lg font-semibold text-neutral-800 truncate">
            {user.full_name ?? user.email}
          </h2>
          <Badge
            variant={user.role === 'admin' ? 'default' : 'secondary'}
            className="text-xs capitalize shrink-0"
          >
            {user.role}
          </Badge>
        </div>
        <DeleteButton action={deleteAction} label="User" />
      </div>

      <TabBar tabs={TABS} activeTab={tab} baseHref={`/admin/users/${id}`} />

      {/* ── PROFILE ── */}
      {tab === 'profile' && (
        <div className="bg-white rounded-lg border border-neutral-200 px-5 py-1">
          <SectionHeading>Role</SectionHeading>
          <Row label="Role">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs capitalize">
                {user.role}
              </Badge>
              {user.role !== 'admin' && (
                <form action={setAdmin} className="inline">
                  <Button type="submit" size="sm" variant="outline" className="h-6 text-xs px-2">
                    Make Admin
                  </Button>
                </form>
              )}
              {user.role !== 'member' && (
                <form action={setMember} className="inline">
                  <Button type="submit" size="sm" variant="outline" className="h-6 text-xs px-2">
                    Set Member
                  </Button>
                </form>
              )}
            </div>
          </Row>

          <SectionHeading>Info</SectionHeading>
          <Row label="Email">{user.email}</Row>
          <Row label="Full Name">
            <EditField value={user.full_name} onSave={fieldAction('full_name')} placeholder="Jane Smith" />
          </Row>
          <Row label="Phone">
            <EditField value={user.phone} onSave={fieldAction('phone')} placeholder="+1 555-000-0000" />
          </Row>
          <Row label="City">
            <EditField value={user.city} onSave={fieldAction('city')} placeholder="Los Angeles" />
          </Row>
          <Row label="Bio">
            <EditField value={user.bio} type="textarea" onSave={fieldAction('bio')} />
          </Row>
          <Row label="Public Profile">
            <EditField value={user.is_public} type="boolean" onSave={fieldAction('is_public')} />
          </Row>
          <Row label="Avatar URL">
            {user.avatar_url ? (
              <div className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar_url} alt="Avatar" className="h-10 w-10 rounded-full object-cover border border-neutral-200" />
                <p className="text-xs text-neutral-400 break-all">{user.avatar_url}</p>
              </div>
            ) : <Nil />}
          </Row>

          <SectionHeading>Meta</SectionHeading>
          <Row label="ID"><span className="font-mono text-xs">{user.id}</span></Row>
          <Row label="Created">{fmt(user.created_at)}</Row>
          <Row label="Updated">{fmt(user.updated_at)}</Row>
        </div>
      )}

      {/* ── ACTIVITY ── */}
      {tab === 'activity' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">
              Reviews ({reviews.length})
            </h3>
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              {reviews.length === 0 ? (
                <p className="text-sm text-neutral-400 p-4">No reviews.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-2.5 font-semibold">Business</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Rating</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Title</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {reviews.map((r: any) => (
                      <tr key={r.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/admin/businesses/${r.contractor_id}`}
                            className="text-neutral-700 hover:text-neutral-900 hover:underline"
                          >
                            {r.contractors?.business_name ?? r.contractor_id}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-0.5 font-medium">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {r.rating}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600 text-xs">{r.title ?? '—'}</td>
                        <td className="px-4 py-2.5 text-neutral-400 text-xs whitespace-nowrap">{fmt(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">
              Business Leads Received ({leads.length})
            </h3>
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              {leads.length === 0 ? (
                <p className="text-sm text-neutral-400 p-4">No leads.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-2.5 font-semibold">From</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Business</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {leads.map((l: any) => (
                      <tr key={l.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-neutral-800">{l.name}</p>
                          <p className="text-xs text-neutral-400">{l.email}</p>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600 text-xs">
                          {l.contractors?.business_name ?? '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="secondary" className="text-xs capitalize">{l.status}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-400 text-xs whitespace-nowrap">{fmt(l.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── AUTH ── */}
      {tab === 'auth' && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg border border-neutral-200 px-5 py-1">
            <Row label="Auth ID"><span className="font-mono text-xs">{authUser?.id ?? id}</span></Row>
            <Row label="Email">{authUser?.email ?? user.email}</Row>
            <Row label="Email Confirmed">
              {authUser?.email_confirmed_at ? (
                <Badge variant="default" className="text-xs">Confirmed</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Unconfirmed</Badge>
              )}
            </Row>
            <Row label="Last Sign In">{fmt(authUser?.last_sign_in_at)}</Row>
            <Row label="Created">{fmt(authUser?.created_at)}</Row>
            <Row label="Updated">{fmt(authUser?.updated_at)}</Row>
            <Row label="Provider">
              {authUser?.app_metadata?.provider ?? '—'}
            </Row>
          </div>

          <div className="flex gap-3">
            <form action={resetAction}>
              <Button type="submit" size="sm" variant="outline">
                Send Password Reset
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ── AUDIT ── */}
      {tab === 'audit' && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {auditEvents.length === 0 ? (
            <p className="text-sm text-neutral-400 p-5">No audit events yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5 font-semibold">Action</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Actor</th>
                  <th className="text-left px-4 py-2.5 font-semibold">IP</th>
                  <th className="text-left px-4 py-2.5 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {auditEvents.map((ev: any) => (
                  <tr key={ev.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-neutral-700">{ev.action}</td>
                    <td className="px-4 py-2.5 text-xs text-neutral-500">{ev.actor}</td>
                    <td className="px-4 py-2.5 text-xs text-neutral-400">{ev.ip ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-neutral-400 whitespace-nowrap">{fmt(ev.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
