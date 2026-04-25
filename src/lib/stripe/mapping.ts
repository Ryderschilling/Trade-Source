import type Stripe from "stripe";

export function priceIdToPlan(priceId: string | null | undefined): "free" | "standard" | "pro" {
  if (!priceId) return "free";
  if (priceId === process.env.STRIPE_PRICE_BASE_50) return "standard";
  if (priceId === process.env.STRIPE_PRICE_BASE_100) return "pro";
  return "free";
}

export function unixToISO(unix: number | null | undefined): string | null {
  return unix ? new Date(unix * 1000).toISOString() : null;
}

export function getBasePriceId(sub: Stripe.Subscription): string | null {
  const baseIds = [
    process.env.STRIPE_PRICE_BASE_50,
    process.env.STRIPE_PRICE_BASE_100,
  ].filter(Boolean) as string[];
  for (const item of sub.items.data) {
    if (baseIds.includes(item.price.id)) return item.price.id;
  }
  return sub.items.data[0]?.price.id ?? null;
}

export function getNextBillingDate(sub: Stripe.Subscription): string | null {
  const item = sub.items.data[0];
  return unixToISO(item?.current_period_end);
}

export function getCardLast4(sub: Stripe.Subscription): string | null {
  const pm = sub.default_payment_method;
  if (pm && typeof pm === "object" && "card" in pm) {
    return (pm as Stripe.PaymentMethod).card?.last4 ?? null;
  }
  return null;
}
