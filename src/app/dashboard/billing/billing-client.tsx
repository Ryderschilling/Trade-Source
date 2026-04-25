"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Bell, Layout, Mail, CreditCard, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import {
  pauseListing,
  resumeListing,
  requestVerification,
  enableLeadNotifications,
  joinHomepageSlider,
} from "@/app/actions/billing";
import {
  cancelSubscription,
  removeAddon as stripeRemoveAddon,
  createFeaturedEmailCheckout,
} from "@/lib/stripe/actions";
import type { BusinessAddon } from "@/lib/supabase/types";

type AddonType = BusinessAddon["addon_type"];

interface Contractor {
  id: string;
  business_name: string;
  billing_plan: string;
  billing_status: string;
  subscription_status: string;
  stripe_subscription_id: string | null;
  listing_status: string;
  next_billing_date: string | null;
  payment_last4: string | null;
}

interface BillingClientProps {
  contractor: Contractor;
  addons: BusinessAddon[];
  purchaseHistory: BusinessAddon[];
  sliderWaitlistCount: number;
  sliderSlotTaken: boolean;
  reservedMonths: string[];
  contractorCount: number;
}

const PLAN_INFO: Record<string, { name: string; price: number | null }> = {
  free:     { name: "Free",     price: null },
  standard: { name: "Standard", price: 50 },
  pro:      { name: "Pro",      price: 100 },
};

const ADDON_META: Record<
  AddonType,
  { name: string; price: number | null; priceLabel: string; pitch: string; icon: React.ReactNode; oneTime?: boolean }
> = {
  verified_badge: {
    name: "Verified Badge",
    price: 30,
    priceLabel: "$30/mo",
    pitch: "Build instant trust — stand out from [STAT]+ local businesses with a verified badge.",
    icon: <Shield className="h-5 w-5" />,
  },
  lead_notifications: {
    name: "Lead Notifications",
    price: 25,
    priceLabel: "$25/mo",
    pitch: "Beat [STAT]+ other pros — be first to respond with instant email and SMS lead alerts.",
    icon: <Bell className="h-5 w-5" />,
  },
  homepage_slider: {
    name: "Homepage Slider",
    price: 20,
    priceLabel: "$20/mo",
    pitch: "Prime homepage placement seen by homeowners browsing all [STAT]+ local contractors.",
    icon: <Layout className="h-5 w-5" />,
  },
  featured_email: {
    name: "Featured Email",
    price: 250,
    priceLabel: "$250 one-time",
    oneTime: true,
    pitch: "The only contractor featured in our monthly email — reaching homeowners across [STAT]+ listings.",
    icon: <Mail className="h-5 w-5" />,
  },
};

// Add-ons where activation is a request submitted for review, not an immediate charge.
const REVIEW_ADDONS: Set<AddonType> = new Set(["verified_badge", "featured_email"]);

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusBadge(status: BusinessAddon["status"]) {
  switch (status) {
    case "active":
      return <Badge variant="default" className="bg-green-100 text-green-700 border-0">Active</Badge>;
    case "pending_review":
      return <Badge variant="outline" className="border-amber-300 text-amber-700">Pending Review</Badge>;
    case "waitlisted":
      return <Badge variant="outline" className="border-neutral-300 text-neutral-500">Waitlisted</Badge>;
    case "paused":
    case "cancelled":
      return null;
    default:
      // Exhaustive guard — never render raw DB state values as badge text.
      return null;
  }
}

function getNextMonths(count: number): Array<{ value: string; label: string }> {
  const months = [];
  const now = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    });
  }
  return months;
}

export function BillingClient({
  contractor,
  addons,
  purchaseHistory,
  sliderWaitlistCount,
  sliderSlotTaken,
  reservedMonths,
  contractorCount,
}: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("email_reserved") === "true") {
      toast.success("Your featured email month has been reserved. We'll be in touch to build your campaign.");
    }
  }, [searchParams]);

  // Dialog state
  const [cancelOpen, setCancelOpen] = useState(false);
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [featuredEmailOpen, setFeaturedEmailOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  // Confirmation modal shown before any add-on is activated.
  const [confirmAddon, setConfirmAddon] = useState<AddonType | null>(null);

  const subscriptionStatus = contractor.subscription_status;
  const plan = subscriptionStatus === "active"
    ? { name: "Standard", price: 50 }
    : subscriptionStatus === "cancelled"
    ? { name: "Free", price: null }
    : PLAN_INFO[contractor.billing_plan] ?? { name: contractor.billing_plan, price: null };
  const billingStatus = contractor.listing_status || contractor.billing_status;

  const activeAddonTypes = new Set(addons.map((a) => a.addon_type));
  const availableUpgrades = (Object.keys(ADDON_META) as AddonType[]).filter(
    (type) => !activeAddonTypes.has(type)
  );

  const upcomingMonths = getNextMonths(12);
  const removeTarget = addons.find((a) => a.id === removeTargetId);

  // Bug 3: monthly total — excludes one-time addons like Featured Email
  const activeAddonTotal = addons
    .filter((a) => a.status === "active" && ADDON_META[a.addon_type].price != null && !ADDON_META[a.addon_type].oneTime)
    .reduce((sum, a) => sum + (ADDON_META[a.addon_type].price ?? 0), 0);
  const monthlyTotal = (plan.price ?? 0) + activeAddonTotal;
  const hasOneTimeAddon = addons.some(
    (a) => (a.status === "active" || a.status === "pending_review" || a.status === "reserved") && ADDON_META[a.addon_type].oneTime
  );

  function run<T>(action: () => Promise<{ error?: string | null; success?: boolean } | T>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action() as { error?: string | null; success?: boolean };
      if (result?.error) {
        toast.error(result.error);
      } else {
        onSuccess?.();
      }
    });
  }

  function handleConfirmAddon() {
    if (!confirmAddon) return;
    const type = confirmAddon;
    setConfirmAddon(null);

    switch (type) {
      case "lead_notifications":
        run(enableLeadNotifications, () => toast.success("Lead notifications enabled!"));
        break;
      case "homepage_slider":
        run(
          () => joinHomepageSlider(sliderSlotTaken),
          () =>
            toast.success(
              sliderSlotTaken ? "You've been added to the waitlist." : "Homepage Slider added!"
            )
        );
        break;
      case "verified_badge":
        setVerifyOpen(true);
        break;
      case "featured_email":
        setFeaturedEmailOpen(true);
        break;
    }
  }

  const confirmMeta = confirmAddon ? ADDON_META[confirmAddon] : null;
  const confirmIsReview = confirmAddon ? REVIEW_ADDONS.has(confirmAddon) : false;

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Billing &amp; Add-ons</h1>
        <p className="mt-1 text-sm text-neutral-500">{contractor.business_name}</p>
      </div>

      {/* ── Section 1: Current Plan ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Current Plan</h2>
        <Card>
          <CardHeader className="border-b border-neutral-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {billingStatus === "paused" && (
                    <Badge variant="outline" className="border-amber-300 text-amber-700">Paused</Badge>
                  )}
                  {billingStatus === "cancelled" && (
                    <Badge variant="destructive">Cancelled</Badge>
                  )}
                </div>
                <CardDescription className="mt-0.5">
                  {plan.price != null ? `$${plan.price}/month` : "Free listing"}
                </CardDescription>
              </div>
              {billingStatus !== "cancelled" && (
                <div className="flex gap-2">
                  {billingStatus === "paused" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => run(resumeListing)}
                    >
                      Resume Listing
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => run(pauseListing)}
                    >
                      Pause Listing
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-xs text-neutral-500">Next Billing Date</p>
                <p className="mt-0.5 font-medium text-neutral-900">
                  {contractor.next_billing_date ? formatDate(contractor.next_billing_date) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Payment Method</p>
                <p className="mt-0.5 font-medium text-neutral-900 flex items-center gap-1.5">
                  {contractor.payment_last4 ? (
                    <>
                      <CreditCard className="h-3.5 w-3.5 text-neutral-400" />
                      •••• {contractor.payment_last4}
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
            {/* Monthly total — itemized */}
            <div className="border-t border-neutral-100 pt-4 space-y-1.5 text-sm">
              {plan.price != null && (
                <div className="flex justify-between text-neutral-500">
                  <span>{plan.name} Plan</span>
                  <span>${plan.price}/mo</span>
                </div>
              )}
              {addons
                .filter((a) => a.status === "active" && ADDON_META[a.addon_type].price != null && !ADDON_META[a.addon_type].oneTime)
                .map((a) => (
                  <div key={a.id} className="flex justify-between text-neutral-500">
                    <span>{ADDON_META[a.addon_type].name}</span>
                    <span>{ADDON_META[a.addon_type].priceLabel}</span>
                  </div>
                ))}
              <div className="flex items-baseline justify-between border-t border-neutral-100 pt-2 mt-1">
                <p className="text-xs text-neutral-500">Monthly Total</p>
                <p className="text-lg font-semibold text-neutral-900">${monthlyTotal}/mo</p>
              </div>
              {hasOneTimeAddon && (
                <p className="text-xs text-neutral-400">
                  * Excludes Featured Email ($250 one-time, not a recurring charge)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Section 2: Active Add-ons ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Active Add-ons</h2>
        {addons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
            <p className="text-sm text-neutral-500">No add-ons yet — browse upgrades below.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {addons.map((addon) => {
              const meta = ADDON_META[addon.addon_type];
              return (
                <Card key={addon.id} size="sm">
                  <CardContent className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                        {meta.icon}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">{meta.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {meta.priceLabel}
                          {" · "}
                          {addon.reserved_month
                            ? (() => {
                                const [y, m] = addon.reserved_month.split("-").map(Number);
                                const reservedDate = new Date(y, m - 1, 1);
                                const reservedLabel = reservedDate.toLocaleDateString(undefined, { month: "short", year: "numeric" });
                                return `Reserved: ${reservedLabel}`;
                              })()
                            : `Since ${formatDate(addon.started_at)}`}
                        </p>
                        <div className="mt-1.5">{statusBadge(addon.status)}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={isPending}
                      onClick={() => setRemoveTargetId(addon.id)}
                    >
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Section 3: Available Upgrades ── */}
      {availableUpgrades.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Available Upgrades</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {availableUpgrades.map((type) => {
              const meta = ADDON_META[type];
              return (
                <Card key={type}>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                        {meta.icon}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{meta.name}</p>
                        <p className="text-sm text-neutral-500">
                          {meta.priceLabel}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {meta.pitch.replace("[STAT]", contractorCount.toLocaleString())}
                    </p>

                    {type === "verified_badge" && (
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={isPending}
                        onClick={() => setConfirmAddon("verified_badge")}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Request Verification
                      </Button>
                    )}

                    {type === "lead_notifications" && (
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={isPending}
                        onClick={() => setConfirmAddon("lead_notifications")}
                      >
                        <Bell className="h-4 w-4" />
                        Enable
                      </Button>
                    )}

                    {type === "homepage_slider" && (
                      <div className="space-y-1.5">
                        {sliderSlotTaken && (
                          <p className="text-xs text-neutral-500 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {sliderWaitlistCount} business{sliderWaitlistCount !== 1 ? "es" : ""} ahead in the waitlist
                          </p>
                        )}
                        <Button
                          size="sm"
                          className="w-full"
                          variant={sliderSlotTaken ? "outline" : "default"}
                          disabled={isPending}
                          onClick={() => setConfirmAddon("homepage_slider")}
                        >
                          <Layout className="h-4 w-4" />
                          {sliderSlotTaken ? "Join Waitlist" : "Add to Plan"}
                        </Button>
                      </div>
                    )}

                    {type === "featured_email" && (
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={isPending}
                        onClick={() => setConfirmAddon("featured_email")}
                      >
                        <Mail className="h-4 w-4" />
                        Reserve a Month
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Section 4: Purchase History ── */}
      {purchaseHistory.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Purchase History</h2>
          <div className="overflow-hidden rounded-xl border border-neutral-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-xs text-neutral-500">
                  <th className="px-4 py-2.5 text-left font-medium">Add-on</th>
                  <th className="px-4 py-2.5 text-left font-medium">Started</th>
                  <th className="px-4 py-2.5 text-left font-medium">Cancelled</th>
                  <th className="px-4 py-2.5 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {purchaseHistory.map((item) => {
                  const meta = ADDON_META[item.addon_type];
                  return (
                    <tr key={item.id} className="text-neutral-600">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400">{meta.icon}</span>
                          <span className="font-medium text-neutral-700">{meta.name}</span>
                          {item.reserved_month && (
                            <span className="text-xs text-neutral-400">
                              {(() => {
                                const [y, m] = item.reserved_month.split("-").map(Number);
                                const reservedDate = new Date(y, m - 1, 1);
                                return `(${reservedDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })})`;
                              })()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{formatDate(item.started_at)}</td>
                      <td className="px-4 py-3 text-neutral-500">
                        {item.cancelled_at ? formatDate(item.cancelled_at) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-500">
                        {meta.priceLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Add-on Confirmation Dialog ── */}
      <Dialog open={confirmAddon !== null} onOpenChange={(open) => { if (!open) setConfirmAddon(null); }}>
        <DialogContent>
          <DialogHeader>
            {confirmMeta && (
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                {confirmMeta.icon}
              </div>
            )}
            <DialogTitle>{confirmMeta?.name}</DialogTitle>
            <DialogDescription>
              {confirmMeta ? `${confirmMeta.priceLabel} · ` : ""}
              {confirmIsReview
                ? "Your request will be submitted for review."
                : confirmMeta?.oneTime
                ? "You will be redirected to complete a one-time payment."
                : "This will be added to your monthly bill starting today."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" size="sm" />}
              disabled={isPending}
            >
              Cancel
            </DialogClose>
            <Button
              size="sm"
              disabled={isPending}
              onClick={handleConfirmAddon}
            >
              Confirm &amp; Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Subscription Dialog ── */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Your listing will be deactivated at the end of the current billing period. All your
              data — reviews, portfolio, and leads — will be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" size="sm" />}
              disabled={isPending}
            >
              Keep Subscription
            </DialogClose>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                run(() => cancelSubscription(contractor.id), () => {
                  setCancelOpen(false);
                  toast.success("Subscription cancelled. Your listing will deactivate at period end.");
                })
              }
            >
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove Add-on Dialog ── */}
      <Dialog
        open={removeTargetId !== null}
        onOpenChange={(open) => { if (!open) setRemoveTargetId(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Add-on</DialogTitle>
            <DialogDescription>
              Remove <strong>{removeTarget ? ADDON_META[removeTarget.addon_type].name : "this add-on"}</strong> from
              your plan? It will be deactivated immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" size="sm" />}
              disabled={isPending}
            >
              Cancel
            </DialogClose>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending || !removeTargetId}
              onClick={() => {
                if (!removeTargetId || !removeTarget) return;
                const addonType = removeTarget.addon_type;
                run(
                  () => stripeRemoveAddon(contractor.id, addonType),
                  () => {
                    setRemoveTargetId(null);
                    toast.success("Add-on removed.");
                  }
                );
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Request Verification Dialog ── */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Verified Badge</DialogTitle>
            <DialogDescription>
              Enter your contractor license number. Our team will verify it within 1–2 business days.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-neutral-700" htmlFor="license-number">
              License Number
            </label>
            <Textarea
              id="license-number"
              className="mt-1.5"
              placeholder="e.g. CBC1234567"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" size="sm" />}
              disabled={isPending}
            >
              Cancel
            </DialogClose>
            <Button
              size="sm"
              disabled={isPending || !licenseNumber.trim()}
              onClick={() =>
                run(
                  () => requestVerification(licenseNumber),
                  () => {
                    setVerifyOpen(false);
                    setLicenseNumber("");
                    toast.success("Verification request submitted! We'll review within 1–2 business days.");
                  }
                )
              }
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Featured Email Month Picker Dialog ── */}
      <Dialog open={featuredEmailOpen} onOpenChange={(open) => { setFeaturedEmailOpen(open); if (!open) setSelectedMonth(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reserve a Featured Email Month</DialogTitle>
            <DialogDescription>
              Select an available month. Green months are open; grey months are already reserved.
              Our team will reach out to confirm details.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {upcomingMonths.map(({ value, label }) => {
                const isReserved = reservedMonths.includes(value);
                const isSelected = selectedMonth === value;
                return (
                  <button
                    key={value}
                    disabled={isReserved}
                    onClick={() => setSelectedMonth(isReserved ? null : value)}
                    className={[
                      "rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-colors",
                      isReserved
                        ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
                        : isSelected
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {selectedMonth && (
              <p className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                <span className="font-medium">
                  {upcomingMonths.find((m) => m.value === selectedMonth)?.label}
                </span>{" "}
                — $250 one-time · You will be redirected to complete payment.
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" size="sm" />}
              disabled={isPending}
            >
              Cancel
            </DialogClose>
            <Button
              size="sm"
              disabled={isPending || !selectedMonth}
              onClick={() => {
                if (!selectedMonth) return;
                const month = selectedMonth;
                startTransition(async () => {
                  const result = await createFeaturedEmailCheckout(contractor.id, month);
                  if ("error" in result && result.error) {
                    toast.error(result.error);
                  } else if ("url" in result && result.url) {
                    window.location.href = result.url;
                  }
                });
              }}
            >
              Confirm Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
