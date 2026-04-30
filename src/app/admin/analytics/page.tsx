import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { StatCard } from '@/components/admin/stat-card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type Stripe from 'stripe';
import { DollarSign, TrendingUp, Users, BarChart2, Zap, UserMinus, AlertCircle, Package } from 'lucide-react';

const ADDON_LABEL: Record<string, string> = {
  verified_badge: 'Verified Badge',
  lead_notifications: 'Lead Notifications',
  homepage_slider: 'Homepage Slider',
  featured_email: 'Featured Email',
};

function fmtUsd(dollars: number) {
  return '$' + dollars.toLocaleString('en-US', { minimumFractionDigits: 0 });
}

/** Returns the actual monthly amount in dollars after coupons, from a Stripe subscription.
 *  Handles both the legacy `discount` field and the `discounts` array used in Stripe API 2025+.
 */
function getActualMonthlyAmount(sub: Stripe.Subscription): number {
  let totalCents = 0;
  for (const item of sub.items.data) {
    totalCents += (item.price.unit_amount ?? 0) * (item.quantity ?? 1);
  }

  // Stripe API 2025-03-31.basil uses `discounts` (array) instead of deprecated `discount` (object).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subAny = sub as any;
  const discountList: Array<{ coupon?: { percent_off?: number | null; amount_off?: number | null } }> = [];

  if (Array.isArray(subAny.discounts) && subAny.discounts.length > 0) {
    discountList.push(...subAny.discounts);
  } else if (subAny.discount) {
    discountList.push(subAny.discount);
  }

  for (const disc of discountList) {
    const coupon = disc?.coupon;
    if (!coupon) continue;
    if (coupon.percent_off != null) {
      totalCents = Math.round(totalCents * (1 - coupon.percent_off / 100));
    } else if (coupon.amount_off != null) {
      totalCents = Math.max(0, totalCents - coupon.amount_off);
    }
  }

  return totalCents / 100;
}

async function getAnalyticsData() {
  const supabase = createAdminClient();
  const stripe = getStripe();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [{ data: contractors }, { data: addons }] = await Promise.all([
    supabase
      .from('contractors')
      .select('id, business_name, billing_plan, subscription_status, stripe_subscription_id, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('business_addons')
      .select('id, addon_type, status, started_at, cancelled_at, business_id, contractors(business_name)')
      .order('started_at', { ascending: false }),
  ]);

  const all = contractors ?? [];
  const allAddons = addons ?? [];

  // Fetch real Stripe subscription data for all active contractors that have a stripe_subscription_id
  const activeWithStripe = all.filter(
    (c) => c.subscription_status === 'active' && c.stripe_subscription_id,
  );

  // Batch-fetch subscriptions from Stripe (expand discount so we can apply coupons)
  const stripeSubMap = new Map<string, number>(); // stripe_subscription_id → actual monthly dollars
  if (activeWithStripe.length > 0) {
    await Promise.all(
      activeWithStripe.map(async (c) => {
        try {
          const sub = await stripe.subscriptions.retrieve(c.stripe_subscription_id!, {
            expand: ['discounts', 'discount'],
          });
          stripeSubMap.set(c.stripe_subscription_id!, getActualMonthlyAmount(sub));
        } catch {
          // If Stripe call fails for a sub, treat as $0 rather than crashing the page
          stripeSubMap.set(c.stripe_subscription_id!, 0);
        }
      }),
    );
  }

  const activeSubscribers = all.filter((c) => c.subscription_status === 'active');
  const cancelledSubscribers = all.filter(
    (c) => c.subscription_status === 'canceled' || c.subscription_status === 'cancelled',
  );
  const pastDue = all.filter((c) => c.subscription_status === 'past_due');

  // Plan-level MRR from real Stripe amounts
  const planMrr = activeWithStripe.reduce(
    (sum, c) => sum + (stripeSubMap.get(c.stripe_subscription_id!) ?? 0),
    0,
  );

  // Active addons (count only; no pricing inference — add Stripe amounts here if addons are also on Stripe)
  const activeAddons = allAddons.filter((a) => a.status === 'active');
  // Addon MRR: set to 0 for now since addon pricing isn't reliably synced from Stripe yet
  const addonMrr = 0;

  const mrr = planMrr + addonMrr;
  const arr = mrr * 12;

  // ARPU: only count subscribers with actual revenue
  const payingCount = activeWithStripe.filter(
    (c) => (stripeSubMap.get(c.stripe_subscription_id!) ?? 0) > 0,
  ).length;
  const arpu = payingCount > 0 ? Math.round(mrr / payingCount) : 0;

  // New subscribers this calendar month
  const newThisMonth = all.filter(
    (c) => c.subscription_status === 'active' && c.created_at >= startOfMonth,
  ).length;
  const newLastMonth = all.filter(
    (c) =>
      c.subscription_status === 'active' &&
      c.created_at >= startOfLastMonth &&
      c.created_at < startOfMonth,
  ).length;

  // Revenue by plan (using real amounts from Stripe)
  const planBreakdown: Record<string, { count: number; mrr: number }> = {};
  for (const c of activeWithStripe) {
    const plan = c.billing_plan ?? 'unknown';
    const amount = stripeSubMap.get(c.stripe_subscription_id!) ?? 0;
    if (!planBreakdown[plan]) planBreakdown[plan] = { count: 0, mrr: 0 };
    planBreakdown[plan].count++;
    planBreakdown[plan].mrr += amount;
  }

  // Addon breakdown (count only for now)
  const addonBreakdown: Record<string, { count: number; mrr: number }> = {};
  for (const a of activeAddons) {
    const type = a.addon_type;
    if (!addonBreakdown[type]) addonBreakdown[type] = { count: 0, mrr: 0 };
    addonBreakdown[type].count++;
  }

  // Past due estimated MRR at risk: sum their plan prices from the map (if available), else 0
  const pastDueMrrAtRisk = pastDue.reduce((sum, c) => {
    if (c.stripe_subscription_id && stripeSubMap.has(c.stripe_subscription_id)) {
      return sum + (stripeSubMap.get(c.stripe_subscription_id) ?? 0);
    }
    return sum;
  }, 0);

  // Recent active subscribers (last 10)
  const recentNew = activeWithStripe.slice(0, 10).map((c) => ({
    ...c,
    actualMonthlyAmount: stripeSubMap.get(c.stripe_subscription_id!) ?? 0,
  }));

  return {
    mrr,
    arr,
    arpu,
    planMrr,
    addonMrr,
    payingCount,
    activeCount: activeSubscribers.length,
    cancelledCount: cancelledSubscribers.length,
    pastDueCount: pastDue.length,
    pastDueMrrAtRisk,
    activeAddonCount: activeAddons.length,
    newThisMonth,
    newLastMonth,
    planBreakdown,
    addonBreakdown,
    recentNew,
  };
}

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData();
  const mrrGrowthPct =
    data.newLastMonth > 0
      ? Math.round(((data.newThisMonth - data.newLastMonth) / data.newLastMonth) * 100)
      : null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-800 mb-1">Revenue Analytics</h2>
      <p className="text-sm text-neutral-500 mb-5">Live data from Stripe. Discounts and coupons are applied.</p>

      {/* Primary KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="MRR" value={`$${data.mrr.toLocaleString()}`} icon={DollarSign} sub="Monthly recurring revenue" />
        <StatCard label="ARR" value={`$${data.arr.toLocaleString()}`} icon={TrendingUp} sub="Annualized run rate" />
        <StatCard label="Active Subscribers" value={data.activeCount} icon={Users} sub="All active subscriptions" />
        <StatCard label="ARPU" value={`$${data.arpu}`} icon={BarChart2} sub="Avg revenue per paying user / mo" />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Plan MRR" value={`$${data.planMrr.toLocaleString()}`} icon={DollarSign} sub="From subscriptions (after discounts)" />
        <StatCard label="Addon MRR" value={`$${data.addonMrr.toLocaleString()}`} icon={Package} sub="From add-on upgrades" />
        <StatCard label="Active Add-ons" value={data.activeAddonCount} icon={Zap} sub="Across all businesses" />
        <StatCard label="New This Month" value={data.newThisMonth} icon={TrendingUp}
          sub={
            mrrGrowthPct !== null
              ? `${mrrGrowthPct >= 0 ? '+' : ''}${mrrGrowthPct}% vs last month`
              : 'vs last month n/a'
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Revenue by plan */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-2">Revenue by Plan</h3>
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5 font-semibold">Plan</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Subscribers</th>
                  <th className="text-right px-4 py-2.5 font-semibold">MRR</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Share</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(data.planBreakdown).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-neutral-400">No active plans.</td>
                  </tr>
                ) : (
                  Object.entries(data.planBreakdown)
                    .sort((a, b) => b[1].mrr - a[1].mrr)
                    .map(([plan, { count, mrr }]) => (
                      <tr key={plan} className="border-b border-neutral-50 last:border-0">
                        <td className="px-4 py-2.5 font-medium capitalize text-neutral-800">{plan}</td>
                        <td className="px-4 py-2.5 text-right text-neutral-600">{count}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-neutral-800">{fmtUsd(mrr)}</td>
                        <td className="px-4 py-2.5 text-right text-neutral-500 text-xs">
                          {data.mrr > 0 ? Math.round((mrr / data.mrr) * 100) : 0}%
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue by addon */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-2">Revenue by Add-on</h3>
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5 font-semibold">Add-on</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Active</th>
                  <th className="text-right px-4 py-2.5 font-semibold">MRR</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Share</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(data.addonBreakdown).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-neutral-400">No active add-ons.</td>
                  </tr>
                ) : (
                  Object.entries(data.addonBreakdown)
                    .sort((a, b) => b[1].mrr - a[1].mrr)
                    .map(([type, { count, mrr }]) => (
                      <tr key={type} className="border-b border-neutral-50 last:border-0">
                        <td className="px-4 py-2.5 font-medium text-neutral-800">
                          {ADDON_LABEL[type] ?? type}
                        </td>
                        <td className="px-4 py-2.5 text-right text-neutral-600">{count}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-neutral-800">{fmtUsd(mrr)}</td>
                        <td className="px-4 py-2.5 text-right text-neutral-500 text-xs">
                          {data.mrr > 0 ? Math.round((mrr / data.mrr) * 100) : 0}%
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Health signals */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Past Due</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{data.pastDueCount}</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {fmtUsd(data.pastDueMrrAtRisk)} at risk
          </p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <UserMinus className="w-4 h-4 text-red-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Churned</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{data.cancelledCount}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Total cancelled subscriptions</p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">New Last Month</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{data.newLastMonth}</p>
          <p className="text-xs text-neutral-500 mt-0.5">New subscribers</p>
        </div>
      </div>

      {/* Recent active subscribers */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-2">Most Recent Active Subscribers</h3>
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                <th className="text-left px-4 py-2.5 font-semibold">Business</th>
                <th className="text-left px-4 py-2.5 font-semibold">Plan</th>
                <th className="text-left px-4 py-2.5 font-semibold">Actual MRR</th>
                <th className="text-left px-4 py-2.5 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.recentNew.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-400">No active subscribers yet.</td>
                </tr>
              ) : data.recentNew.map((c) => (
                <tr key={c.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/businesses/${c.id}?tab=billing`}
                      className="font-medium text-neutral-800 hover:text-blue-600 hover:underline"
                    >
                      {c.business_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary" className="text-xs capitalize">{c.billing_plan}</Badge>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-neutral-800 text-xs">
                    {c.actualMonthlyAmount === 0
                      ? <span className="text-neutral-400">$0 (discounted)</span>
                      : `${fmtUsd(c.actualMonthlyAmount)}/mo`
                    }
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500 text-xs">
                    {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
