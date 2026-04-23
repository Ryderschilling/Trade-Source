import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteButton } from '@/components/admin/delete-button';
import { EditField } from '@/components/admin/edit-field';
import { TabBar } from '@/components/admin/tab-bar';
import { PackagesTab } from './packages-tab';
import { ChevronLeft, Star } from 'lucide-react';
import {
  updateContractorField,
  updateContractorStatus,
  deleteBusiness,
  syncFromStripe,
  cancelSub,
  adminDeleteReview,
  toggleReviewVerified,
  toggleReviewAnonymous,
} from './actions';

const TABS = [
  { id: 'profile',  label: 'Profile'  },
  { id: 'media',    label: 'Media'    },
  { id: 'packages', label: 'Packages' },
  { id: 'leads',    label: 'Leads'    },
  { id: 'reviews',  label: 'Reviews'  },
  { id: 'billing',  label: 'Billing'  },
  { id: 'audit',    label: 'Audit'    },
];

function fmt(iso: string | null) {
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

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  pending: 'secondary',
  suspended: 'destructive',
};

export default async function AdminBusinessDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const tab = sp.tab ?? 'profile';
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biz, error } = await (supabase as any)
    .from('contractors')
    .select('*, categories(name), profiles(email, full_name)')
    .eq('id', id)
    .single();

  if (error || !biz) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = biz as any;
  const categoryName: string | null = b.categories?.name ?? null;
  const ownerEmail: string | null = b.profiles?.email ?? null;
  const ownerName: string | null = b.profiles?.full_name ?? null;

  // Tab-specific data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let packages: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let leads: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reviews: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let auditEvents: any[] = [];

  if (tab === 'packages') {
    const { data } = await supabase
      .from('contractor_packages')
      .select('*')
      .eq('contractor_id', id)
      .order('sort_order', { ascending: true });
    packages = data ?? [];
  }

  if (tab === 'leads') {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('contractor_id', id)
      .order('created_at', { ascending: false })
      .limit(100);
    leads = data ?? [];
  }

  if (tab === 'reviews') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('reviews')
      .select('*, profiles(full_name, email)')
      .eq('contractor_id', id)
      .order('created_at', { ascending: false });
    reviews = data ?? [];
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
  const deleteAction = deleteBusiness.bind(null, id);
  const setActive    = updateContractorStatus.bind(null, id, 'active');
  const setPending   = updateContractorStatus.bind(null, id, 'pending');
  const setSuspended = updateContractorStatus.bind(null, id, 'suspended');
  const syncAction   = syncFromStripe.bind(null, id);
  const cancelAction = cancelSub.bind(null, id);

  function fieldAction(field: string) {
    return updateContractorField.bind(null, id, field);
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/businesses"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            Businesses
          </Link>
          <h2 className="text-lg font-semibold text-neutral-800 truncate">{b.business_name}</h2>
          <Badge
            variant={statusVariant[b.status] ?? 'secondary'}
            className="text-xs capitalize shrink-0"
          >
            {b.status}
          </Badge>
        </div>
        <DeleteButton action={deleteAction} label="Business" />
      </div>

      <TabBar tabs={TABS} activeTab={tab} baseHref={`/admin/businesses/${id}`} />

      {/* ── PROFILE ── */}
      {tab === 'profile' && (
        <div className="bg-white rounded-lg border border-neutral-200 px-5 py-1">
          <SectionHeading>Status</SectionHeading>
          <Row label="Status">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusVariant[b.status] ?? 'secondary'} className="text-xs capitalize">
                {b.status}
              </Badge>
              {b.status !== 'active' && (
                <form action={setActive} className="inline">
                  <Button type="submit" size="sm" variant="outline" className="h-6 text-xs px-2">
                    Activate
                  </Button>
                </form>
              )}
              {b.status !== 'pending' && (
                <form action={setPending} className="inline">
                  <Button type="submit" size="sm" variant="outline" className="h-6 text-xs px-2">
                    Set Pending
                  </Button>
                </form>
              )}
              {b.status !== 'suspended' && (
                <form action={setSuspended} className="inline">
                  <Button type="submit" size="sm" variant="destructive" className="h-6 text-xs px-2">
                    Suspend
                  </Button>
                </form>
              )}
            </div>
          </Row>
          <Row label="Listing Status">
            <EditField
              value={b.listing_status}
              onSave={fieldAction('listing_status')}
              placeholder="published / draft / hidden"
            />
          </Row>

          <SectionHeading>Basic Info</SectionHeading>
          <Row label="Business Name">
            <EditField value={b.business_name} onSave={fieldAction('business_name')} />
          </Row>
          <Row label="Slug">
            <EditField value={b.slug} onSave={fieldAction('slug')} placeholder="url-slug" />
          </Row>
          <Row label="Owner Name">
            <EditField value={b.owner_name} onSave={fieldAction('owner_name')} />
          </Row>
          <Row label="Category">
            {categoryName ?? <Nil />}
          </Row>
          <Row label="Tagline">
            <EditField value={b.tagline} onSave={fieldAction('tagline')} />
          </Row>
          <Row label="Description">
            <EditField value={b.description} type="textarea" onSave={fieldAction('description')} />
          </Row>

          <SectionHeading>Contact</SectionHeading>
          <Row label="Phone">
            <EditField value={b.phone} onSave={fieldAction('phone')} placeholder="+1 555-000-0000" />
          </Row>
          <Row label="Email">
            <EditField value={b.email} onSave={fieldAction('email')} placeholder="contact@example.com" />
          </Row>
          <Row label="Website">
            <EditField value={b.website} onSave={fieldAction('website')} placeholder="https://…" />
          </Row>
          <Row label="Owner Email">{ownerEmail ?? <Nil />}</Row>
          <Row label="Owner Profile">{ownerName ?? <Nil />}</Row>

          <SectionHeading>Location</SectionHeading>
          <Row label="Address">
            <EditField value={b.address} onSave={fieldAction('address')} />
          </Row>
          <Row label="City">
            <EditField value={b.city} onSave={fieldAction('city')} />
          </Row>
          <Row label="State">
            <EditField value={b.state} onSave={fieldAction('state')} placeholder="CA" />
          </Row>
          <Row label="ZIP">
            <EditField value={b.zip} onSave={fieldAction('zip')} placeholder="90210" />
          </Row>
          <Row label="Service Areas">
            {b.service_areas?.length ? b.service_areas.join(', ') : <Nil />}
          </Row>

          <SectionHeading>Credentials</SectionHeading>
          <Row label="Licensed">
            <EditField value={b.is_licensed} type="boolean" onSave={fieldAction('is_licensed')} />
          </Row>
          <Row label="License #">
            <EditField value={b.license_number} onSave={fieldAction('license_number')} />
          </Row>
          <Row label="Insured">
            <EditField value={b.is_insured} type="boolean" onSave={fieldAction('is_insured')} />
          </Row>
          <Row label="Yrs Experience">
            <EditField value={b.years_experience} type="number" onSave={fieldAction('years_experience')} />
          </Row>
          <Row label="Yrs in Business">
            <EditField value={b.years_in_business} type="number" onSave={fieldAction('years_in_business')} />
          </Row>

          <SectionHeading>Flags</SectionHeading>
          <Row label="Featured">
            <EditField value={b.is_featured} type="boolean" onSave={fieldAction('is_featured')} />
          </Row>
          <Row label="Claimed">
            <EditField value={b.is_claimed} type="boolean" onSave={fieldAction('is_claimed')} />
          </Row>

          <SectionHeading>Stats</SectionHeading>
          <Row label="Avg Rating">
            {b.avg_rating != null ? (
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {Number(b.avg_rating).toFixed(1)}
              </span>
            ) : <Nil />}
          </Row>
          <Row label="Review Count">{String(b.review_count)}</Row>
          <Row label="View Count">{String(b.view_count)}</Row>
          <Row label="ID"><span className="font-mono text-xs">{b.id}</span></Row>
          <Row label="Created">{fmt(b.created_at)}</Row>
          <Row label="Updated">{fmt(b.updated_at)}</Row>
        </div>
      )}

      {/* ── MEDIA ── */}
      {tab === 'media' && (
        <div className="bg-white rounded-lg border border-neutral-200 px-5 py-1">
          <Row label="Logo URL">
            {b.logo_url ? (
              <div className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.logo_url} alt="Logo" className="h-16 w-16 rounded object-cover border border-neutral-200" />
                <p className="text-xs text-neutral-400 break-all">{b.logo_url}</p>
              </div>
            ) : <Nil />}
          </Row>
          <Row label="Cover URL">
            {b.cover_url ? (
              <div className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.cover_url} alt="Cover" className="h-24 rounded object-cover border border-neutral-200 max-w-sm" />
                <p className="text-xs text-neutral-400 break-all">{b.cover_url}</p>
              </div>
            ) : <Nil />}
          </Row>
        </div>
      )}

      {/* ── PACKAGES ── */}
      {tab === 'packages' && (
        <PackagesTab contractorId={id} packages={packages} />
      )}

      {/* ── LEADS ── */}
      {tab === 'leads' && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {leads.length === 0 ? (
            <p className="text-sm text-neutral-400 p-5">No leads yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5 font-semibold">Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Email</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Type</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {leads.map((lead: any) => (
                  <tr key={lead.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-neutral-800">{lead.name}</p>
                      {lead.phone && <p className="text-xs text-neutral-400">{lead.phone}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">{lead.email}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary" className="text-xs capitalize">{lead.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500 text-xs">{lead.service_type ?? lead.package_name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-neutral-400 text-xs whitespace-nowrap">{fmt(lead.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── REVIEWS ── */}
      {tab === 'reviews' && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {reviews.length === 0 ? (
            <p className="text-sm text-neutral-400 p-5">No reviews yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5 font-semibold">Rating</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Review</th>
                  <th className="text-left px-4 py-2.5 font-semibold">User</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Flags</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {reviews.map((review: any) => {
                  const verifyAction = toggleReviewVerified.bind(null, review.id, id, !review.is_verified);
                  const anonAction = toggleReviewAnonymous.bind(null, review.id, id, !review.is_anonymous);
                  const delAction = adminDeleteReview.bind(null, review.id, id);
                  return (
                    <tr key={review.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 align-top">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-0.5 font-medium">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          {review.rating}
                        </span>
                        <p className="text-xs text-neutral-400 mt-0.5 whitespace-nowrap">{fmt(review.created_at)}</p>
                      </td>
                      <td className="px-4 py-2.5 max-w-xs">
                        {review.title && <p className="font-medium text-neutral-800 text-xs">{review.title}</p>}
                        {review.body && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{review.body}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-neutral-500">
                        {review.is_anonymous
                          ? <span className="text-neutral-400 italic">Anonymous</span>
                          : (review.profiles?.full_name ?? review.profiles?.email ?? '—')
                        }
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-1">
                          {review.is_verified && (
                            <Badge variant="default" className="text-xs w-fit">Verified</Badge>
                          )}
                          {review.is_anonymous && (
                            <Badge variant="secondary" className="text-xs w-fit">Anon</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1.5">
                          <form action={verifyAction}>
                            <Button type="submit" size="sm" variant="outline" className="h-6 text-xs px-2">
                              {review.is_verified ? 'Unverify' : 'Verify'}
                            </Button>
                          </form>
                          <form action={anonAction}>
                            <Button type="submit" size="sm" variant="outline" className="h-6 text-xs px-2">
                              {review.is_anonymous ? 'Deanon' : 'Anon'}
                            </Button>
                          </form>
                          <form action={delAction}>
                            <Button type="submit" size="sm" variant="outline" className="h-6 text-xs px-2 text-red-600 hover:text-red-700 hover:border-red-300">
                              Delete
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── BILLING ── */}
      {tab === 'billing' && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg border border-neutral-200 px-5 py-1">
            <Row label="Billing Plan">
              <span className="capitalize">{b.billing_plan}</span>
            </Row>
            <Row label="Billing Status">
              <Badge
                variant={b.billing_status === 'active' ? 'default' : 'secondary'}
                className="text-xs capitalize"
              >
                {b.billing_status}
              </Badge>
            </Row>
            <Row label="Subscription">
              <Badge
                variant={b.subscription_status === 'active' ? 'default' : 'secondary'}
                className="text-xs capitalize"
              >
                {b.subscription_status}
              </Badge>
            </Row>
            <Row label="Next Billing">{fmt(b.next_billing_date)}</Row>
            <Row label="Last 4">
              {b.payment_last4
                ? <span className="font-mono">•••• {b.payment_last4}</span>
                : <Nil />}
            </Row>
            <Row label="Stripe Customer">
              <span className="font-mono text-xs">{b.stripe_customer_id ?? '—'}</span>
            </Row>
            <Row label="Stripe Sub">
              <span className="font-mono text-xs">{b.stripe_subscription_id ?? '—'}</span>
            </Row>
          </div>

          <div className="flex gap-3">
            {b.stripe_subscription_id && (
              <form action={syncAction}>
                <Button type="submit" size="sm" variant="outline">
                  Sync from Stripe
                </Button>
              </form>
            )}
            {b.stripe_subscription_id && b.subscription_status === 'active' && (
              <form action={cancelAction}>
                <Button type="submit" size="sm" variant="destructive">
                  Cancel Subscription
                </Button>
              </form>
            )}
            {!b.stripe_subscription_id && (
              <p className="text-sm text-neutral-400">No Stripe subscription linked.</p>
            )}
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
