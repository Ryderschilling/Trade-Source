import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { priceIdToPlan, getBasePriceId, getNextBillingDate, getCardLast4 } from "@/lib/stripe/mapping";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-03-31.basil" as any,
  });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sourceatrade.com";

  // --- stripe_events log + idempotency (requires migration 023) ---
  let shouldProcess = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error: insertErr } = await db.from("stripe_events").insert({
      id: event.id,
      type: event.type,
      payload: event.data.object,
      created_at: new Date(event.created * 1000).toISOString(),
    });

    if (insertErr?.code === "23505") {
      // Duplicate event — check if already successfully processed
      const { data: existing } = await db
        .from("stripe_events")
        .select("processed_at")
        .eq("id", event.id)
        .single();
      if (existing?.processed_at) {
        shouldProcess = false;
      }
    }
  } catch {
    // Table may not exist before migration 023 — continue without logging
  }

  if (!shouldProcess) {
    return NextResponse.json({ received: true });
  }

  // Helper: fetch contractor email and send via unified logger
  async function sendContractorEmail(contractorId: string, subject: string, html: string, kind: string) {
    try {
      const { data: contractor } = await supabase
        .from("contractors")
        .select("email")
        .eq("id", contractorId)
        .single();
      if (contractor?.email) {
        await sendEmail({ to: contractor.email, subject, html, kind, meta: { contractor_id: contractorId } });
      }
    } catch (e) {
      console.error("Stripe webhook email failed:", e);
    }
  }

  let dbError: string | null = null;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "subscription") {
        try {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const contractorId = session.metadata?.contractor_id ?? session.metadata?.businessId;
          const contractorSlug = session.metadata?.contractor_slug;
          if (!contractorId || !subscriptionId) break;

          const sub = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["default_payment_method"],
          });

          const { error } = await supabase
            .from("contractors")
            .update({
              status: "active",
              stripe_customer_id: customerId ?? undefined,
              stripe_subscription_id: subscriptionId,
              billing_plan: priceIdToPlan(getBasePriceId(sub)),
              subscription_status: sub.status === "trialing" ? "active" : sub.status,
              next_billing_date: getNextBillingDate(sub),
              payment_last4: getCardLast4(sub),
            })
            .eq("id", contractorId);

          if (error) {
            dbError = error.message;
            break;
          }

          await sendContractorEmail(
            contractorId,
            "Your Source A Trade listing is now live!",
            `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                <h2>You're live on Source A Trade!</h2>
                <p>Payment confirmed. Your business listing is now active and visible to homeowners searching for contractors in your area.</p>
                ${contractorSlug ? `<p>View your listing: <a href="${appUrl}/contractors/${contractorSlug}">${appUrl}/contractors/${contractorSlug}</a></p>` : ""}
                <p>Manage your leads and messages from your <a href="${appUrl}/dashboard">dashboard</a>.</p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
                <p style="color:#94a3b8;font-size:12px">Source A Trade — sourceatrade.com · Questions? Reply to this email or contact support@sourceatrade.com</p>
              </div>
            `,
            "transactional:stripe:activated"
          );

          console.log(`Contractor ${contractorId} activated via Stripe checkout`);
        } catch (err: any) {
          dbError = err?.message ?? "checkout.session.completed subscription handler error";
        }
        break;
      }

      if (session.mode === "payment") {
        const businessId = session.metadata?.businessId;
        const month = session.metadata?.month;
        if (!businessId || !month) break;

        try {
          const { error: insertError } = await (supabase as any).from("business_addons").insert({
            business_id: businessId,
            addon_type: "featured_email",
            status: "reserved",
            reserved_month: month,
            stripe_payment_intent_id: session.payment_intent as string,
            amount_paid_cents: session.amount_total,
          });

          if (insertError) {
            if (insertError.code === "23505") {
              // Idempotency dupe — safe to 200
              break;
            }
            // Unexpected DB error — log orphan and return 500 so Stripe retries
            await (supabase as any).from("stripe_orphans").insert({
              business_id: businessId,
              stripe_object_type: "checkout_session",
              stripe_object_id: session.payment_intent as string,
              source: "webhook:featured_email",
              reason: insertError.message,
              metadata: { session },
            });
            return NextResponse.json({ error: "db_error" }, { status: 500 });
          }
        } catch (err: any) {
          await (supabase as any).from("stripe_orphans").insert({
            business_id: businessId,
            stripe_object_type: "checkout_session",
            stripe_object_id: session.payment_intent as string,
            source: "webhook:featured_email",
            reason: err?.message ?? "unknown",
            metadata: { session },
          });
          return NextResponse.json({ error: "unexpected" }, { status: 500 });
        }
        break;
      }

      break;
    }

    case "invoice.payment_succeeded": {
      try {
        const invoice = event.data.object as Stripe.Invoice;
        const rawSub = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = rawSub ? (typeof rawSub === "string" ? rawSub : rawSub.id) : null;
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["default_payment_method"],
        });

        const { error } = await supabase
          .from("contractors")
          .update({
            subscription_status: "active",
            billing_plan: priceIdToPlan(getBasePriceId(sub)),
            next_billing_date: getNextBillingDate(sub),
            payment_last4: getCardLast4(sub),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) dbError = error.message;
      } catch (err: any) {
        dbError = err?.message ?? "invoice.payment_succeeded handler error";
      }
      break;
    }

    case "invoice.payment_failed": {
      try {
        const invoice = event.data.object as Stripe.Invoice;
        const rawSub = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = rawSub ? (typeof rawSub === "string" ? rawSub : rawSub.id) : null;
        if (!subscriptionId) break;

        const { error } = await supabase
          .from("contractors")
          .update({ subscription_status: "past_due" })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) dbError = error.message;
      } catch (err: any) {
        dbError = err?.message ?? "invoice.payment_failed handler error";
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      try {
        const sub = event.data.object as Stripe.Subscription;
        const fullSub = await stripe.subscriptions.retrieve(sub.id, {
          expand: ["default_payment_method"],
        });

        const { error } = await supabase
          .from("contractors")
          .update({
            subscription_status: fullSub.status === "trialing" ? "active" : fullSub.status,
            billing_plan: priceIdToPlan(getBasePriceId(fullSub)),
            next_billing_date: getNextBillingDate(fullSub),
            payment_last4: getCardLast4(fullSub),
          })
          .eq("stripe_subscription_id", sub.id);

        if (error) dbError = error.message;
      } catch (err: any) {
        dbError = err?.message ?? "customer.subscription.updated handler error";
      }
      break;
    }

    case "customer.subscription.deleted": {
      try {
        const sub = event.data.object as Stripe.Subscription;

        const { error } = await supabase
          .from("contractors")
          .update({
            subscription_status: "cancelled",
            billing_plan: "free",
            next_billing_date: null,
            cancel_pending: false,
            cancel_at: null,
          })
          .eq("stripe_subscription_id", sub.id);

        if (error) {
          dbError = error.message;
          break;
        }

        const { data: affectedContractors } = await supabase
          .from("contractors")
          .select("id")
          .eq("stripe_subscription_id", sub.id);

        const ids = affectedContractors?.map((c) => c.id) ?? [];

        if (ids.length > 0) {
          await supabase
            .from("business_addons")
            .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
            .in("status", ["active", "waitlisted", "pending_review"])
            .in("business_id", ids);
        }

        // Send cancellation email
        try {
          const { data: contractor } = await supabase
            .from("contractors")
            .select("id, email, business_name")
            .eq("stripe_subscription_id", sub.id)
            .single();

          if (contractor?.email) {
            await sendEmail({
              to: contractor.email,
              subject: "Your Source A Trade listing has been suspended",
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                  <h2>Your listing has been suspended</h2>
                  <p>Your Source A Trade subscription for <strong>${contractor.business_name}</strong> has been canceled and your listing is no longer visible to homeowners.</p>
                  <p>To reactivate your listing, <a href="${appUrl}/dashboard">visit your dashboard</a> and renew your subscription.</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
                  <p style="color:#94a3b8;font-size:12px">Source A Trade — sourceatrade.com · Questions? Contact support@sourceatrade.com</p>
                </div>
              `,
              kind: "transactional:stripe:suspended",
              meta: { subscription_id: sub.id },
            });
          }
        } catch (e) {
          console.error("Stripe webhook cancellation email failed:", e);
        }

        console.log(`Contractor subscription deleted — ${sub.id}`);
      } catch (err: any) {
        dbError = err?.message ?? "customer.subscription.deleted handler error";
      }
      break;
    }

    default:
      break;
  }

  // --- update stripe_events record ---
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("stripe_events")
      .update({
        processed_at: dbError ? null : new Date().toISOString(),
        processing_error: dbError,
      })
      .eq("id", event.id);
  } catch {
    // table may not exist before migration 023
  }

  // Always return 200 so Stripe doesn't retry
  return NextResponse.json({ received: true });
}

export const runtime = "nodejs";
