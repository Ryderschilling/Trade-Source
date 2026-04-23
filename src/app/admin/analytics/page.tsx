import { createAdminClient } from '@/lib/supabase/admin';
import { StatCard } from '@/components/admin/stat-card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DollarSign, TrendingUp, Users, BarChart2, Zap, UserMinus, AlertCircle, Package } from 'lucide-react';

const PLAN_PRICE: Record<string, number> = {
  standard: 50,
  pro: 100,
};

const ADDON_PRICE: Record<string, number> = {
  verified_badge: 30,
  lead_notifications: 25,
  homepage_slider: 20,
};

const ADDON_LABEL: Record<string, string> = {
  verified_badge: 'Verified Badge',
  lead_notifications: 'Lead Notifications',
  homepage_slider: 'Homepage Slider',
  featured_email: 'Featured Email',
};

function fmtUsd(cents: number) {
  return '$' + cents.toLocaleString('en-US', { minimumFractionDigits: 0 });
}

async function getAnalyticsData() {
  const supabase = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [{ data: contractors }, { data: addons }] = await Promise.all([
    supabase
      .from('contractors')
      .select('id, business_name, billing_plan, subscription_status, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('business_addons')
      .select('id, addon_type, status, started_at, cancelled_at, business_id, contractors(business_name)')
      .order('started_at', { ascending: false }),
  ]);

  const all = contractors ?? [];
  const allAddons = addons ?? [];

  // Active paying subscribers (plan-level)
  const activeSubscribers = all.filter(
    (c) => c.subscription_status === 'active' && PLAN_PRICE[c.billing_plan] != null,
  );
  const cancelledSubscribers = all.filter(
    (c) => c.subscription_status === 'canceled' || c.subscription_status === 'cancelled',
  );
  const pastDue = all.filter((c) => c.subscription_status === 'past_due');

  // Plan-level MRR
  const planMrr = activeSubscribers.reduce((sum, c) => sum + (PLAN_PRICE[c.billing_plan] ?? 0), 0);

  // Active addons (only those with a price)
  const activeAddons = allAddons.filter(
    (a) => a.status === 'active' && ADDON_PRICE[a.addon_type] != null,
  );
  const addonMrr = activeAddons.reduce((sum, a) => sum + (ADDON_PRICE[a.addon_type] ?? 0), 0);

  const mrr = planMrr + addonMrr;
  const arr = mrr * 12;
  const arpu = activeSubscribers.length > 0 ? Math.round(mrr / activeSubscribers.length) : 0;

  // New paying customers this calendar month
  const newThisMonth = all.filter(
    (c) =>
      c.subscription_status === 'active' &&
      PLAN_PRICE[c.billing_plan] != null &&
      c.created_at >= startOfMonth,
  ).length;

  const newLastMonth = all.filter(
    (c) =>
      c.subscription_status === 'active' &&
      PLAN_PRICE[c.billing_plan] != null &&
      c.created_at >= startOfLastMonth &&
      c.created_at < startOfMonth,
  ).length;

  // Revenue by plan
  const planBreakdown: Record<string, { count: number; mrr: number }> = {};
  for (const c of activeSubscribers) {
    const plan = c.billing_plan;
    if (!planBreakdown[plan]) planBreakdown[plan] = { count: 0, mrr: 0 };
    planBreakdown[plan].count++;
    planBreakdown[plan].mrr += PLAN_PRICE[plan] ?? 0;
  }

  // Revenue by addon
  const addonBreakdown: Record<string, { count: number; mrr: number }> = {};
  for (const a of activeAddons) {
    const type = a.addon_type;
    if (!addonBreakdown[type]) addonBreakdown[type] = { count: 0, mrr: 0 };
    addonBreakdown[type].count++;
    addonBreakdown[type].mrr += ADDON_PRICE[type] ?? 0;
  }

  // Recent new subscribers (last 10)
  const recentNew = all
    .filter((c) => c.subscription_status === 'active' && PLAN_PRICE[c.billing_plan] != null)
    .slice(0, 10);

  return {
    mrr,
    arr,
    arpu,
    planMrr,
    addonMrr,
    payingCount: activeSubscribers.length,
    cancelledCount: cancelledSubscribers.length,
    pastDueCount: pastDue.length,
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
      <p className="text-sm text-neutral-500 mb-5">Live snapshot from active subscriptions and add-ons.</p>

      {/* Primary KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="MRR" value={`$${data.mrr.toLocaleString()}`} icon={DollarSign} sub="Monthly recurring revenue" />
        <StatCard label="ARR" value={`$${data.arr.toLocaleString()}`} icon={TrendingUp} sub="Annualized run rate" />
        <StatCard label="Paying Customers" value={data.payingCount} icon={Users} sub="Active paid subscriptions" />
        <StatCard label="ARPU" value={`$${data.arpu}`} icon={BarChart2} sub="Avg revenue per user / mo" />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Plan MRR" value={`$${data.planMrr.toLocaleString()}`} icon={DollarSign} sub="From subscriptions" />
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
            {fmtUsd(data.pastDueCount * 50)} at risk (est.)
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
          <p className="text-xs text-neutral-500 mt-0.5">
            +{fmtUsd(data.newLastMonth * 50)} est. new MRR
          </p>
        </div>
      </div>

      {/* Recent paying signups */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-2">Most Recent Paying Customers</h3>
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                <th className="text-left px-4 py-2.5 font-semibold">Business</th>
                <th className="text-left px-4 py-2.5 font-semibold">Plan</th>
                <th className="text-left px-4 py-2.5 font-semibold">MRR</th>
                <th className="text-left px-4 py-2.5 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.recentNew.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-400">No paying customers yet.</td>
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
                    {fmtUsd(PLAN_PRICE[c.billing_plan] ?? 0)}/mo
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
