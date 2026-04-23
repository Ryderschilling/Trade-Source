import { createAdminClient } from '@/lib/supabase/admin';
import { StatCard } from '@/components/admin/stat-card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { CreditCard, TrendingUp, XCircle, Clock } from 'lucide-react';

async function getBillingData() {
  const supabase = createAdminClient();

  const [
    { data: contractors },
    { data: addons },
  ] = await Promise.all([
    supabase
      .from('contractors')
      .select('id, business_name, slug, billing_plan, billing_status, subscription_status, stripe_subscription_id, next_billing_date')
      .order('business_name', { ascending: true }),
    supabase
      .from('business_addons')
      .select('*, contractors(business_name)')
      .order('started_at', { ascending: false })
      .limit(50),
  ]);

  const all = contractors ?? [];
  const byPlan: Record<string, number> = {};
  let active = 0, cancelled = 0, pastDue = 0;

  for (const c of all) {
    byPlan[c.billing_plan] = (byPlan[c.billing_plan] ?? 0) + 1;
    if (c.subscription_status === 'active') active++;
    else if (c.subscription_status === 'canceled' || c.subscription_status === 'cancelled') cancelled++;
    else if (c.subscription_status === 'past_due') pastDue++;
  }

  return { contractors: all, byPlan, active, cancelled, pastDue, addons: addons ?? [] };
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const subVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  past_due: 'destructive',
  canceled: 'secondary',
  cancelled: 'secondary',
};

export default async function AdminBillingPage() {
  const { contractors, byPlan, active, cancelled, pastDue, addons } = await getBillingData();

  const withSub = contractors.filter((c) => c.stripe_subscription_id);

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-800 mb-5">Payments Overview</h2>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Subs" value={active} icon={CreditCard} />
        <StatCard label="Past Due" value={pastDue} icon={TrendingUp} />
        <StatCard label="Cancelled" value={cancelled} icon={XCircle} />
        <StatCard label="With Stripe" value={withSub.length} icon={Clock} sub="Linked subscriptions" />
      </div>

      {/* By plan */}
      {Object.keys(byPlan).length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-2">By Plan</h3>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(byPlan).sort((a, b) => b[1] - a[1]).map(([plan, count]) => (
              <div key={plan} className="bg-white border border-neutral-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
                <span className="text-sm font-medium capitalize text-neutral-800">{plan}</span>
                <Badge variant="secondary" className="text-xs">{count}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscriptions table */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 mb-2">
          All Subscriptions ({withSub.length})
        </h3>
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                <th className="text-left px-4 py-2.5 font-semibold">Business</th>
                <th className="text-left px-4 py-2.5 font-semibold">Plan</th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold">Next Billing</th>
              </tr>
            </thead>
            <tbody>
              {withSub.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-400">No subscriptions yet.</td>
                </tr>
              ) : withSub.map((c) => (
                <tr key={c.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/businesses/${c.id}?tab=billing`}
                      className="font-medium text-neutral-800 hover:text-blue-600 hover:underline"
                    >
                      {c.business_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600 text-xs capitalize">{c.billing_plan}</td>
                  <td className="px-4 py-2.5">
                    <Badge
                      variant={subVariant[c.subscription_status] ?? 'secondary'}
                      className="text-xs capitalize"
                    >
                      {c.subscription_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500 text-xs">{fmt(c.next_billing_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Addons */}
      {addons.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-2">Recent Addons</h3>
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5 font-semibold">Business</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Type</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Started</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {addons.map((a: any) => (
                  <tr key={a.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                    <td className="px-4 py-2.5 font-medium text-neutral-800">
                      {a.contractors?.business_name ?? a.business_id}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600 text-xs capitalize">{a.addon_type}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={a.status === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500 text-xs">{fmt(a.started_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
