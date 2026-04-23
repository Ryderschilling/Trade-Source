import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil" as any,
});

export async function POST(req: NextRequest) {
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

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sourceatrade.com";

  async function sendContractorEmail(contractorId: string, subject: string, html: string) {
    if (!resend) return;
    try {
      const { data: contractor } = await supabase
        .from("contractors")
        .select("email, business_name, slug")
        .eq("id", contractorId)
        .single();
      if (contractor?.email) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: contractor.email,
          subject,
          html,
        });
      }
    } catch (e) {
      console.error("Stripe webhook email failed:", e);
    }
  }

  switch (event.type) {
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        await supabase
          .from("contractors")
          .update({ subscription_status: "active" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        await supabase
          .from("contractors")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Handle featured email one-time payment
      if (session.mode === "payment" && session.metadata?.businessId) {
        const { businessId, month } = session.metadata;
        await supabase.from("business_addons").insert({
          business_id: businessId,
          addon_type: "featured_email",
          status: "pending_review",
          stripe_subscription_item_id: null,
          reserved_month: month ?? null,
        });
        break;
      }

      if (session.mode !== "subscription") break;

      const contractorId = session.metadata?.contractor_id;
      const contractorSlug = session.metadata?.contractor_slug;
      const subscriptionId = session.subscription as string | null;
      const customerId = session.customer as string | null;

      if (!contractorId) {
        console.error("Webhook: missing contractor_id in metadata");
        break;
      }

      const { error } = await supabase
        .from("contractors")
        .update({
          status: "active",
          stripe_customer_id: customerId ?? undefined,
          stripe_subscription_id: subscriptionId ?? undefined,
        })
        .eq("id", contractorId);

      if (error) {
        console.error("Failed to activate contractor:", error);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
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
        `
      );

      console.log(`Contractor ${contractorId} activated via Stripe checkout`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      const { data: contractor, error } = await supabase
        .from("contractors")
        .update({ status: "suspended", subscription_status: "cancelled" })
        .eq("stripe_subscription_id", subscription.id)
        .select("id, email, business_name")
        .single();

      if (contractor?.id) {
        await supabase
          .from("business_addons")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("business_id", contractor.id)
          .in("status", ["active", "pending_review", "waitlisted"]);
      }

      if (error) {
        console.error("Failed to suspend contractor on subscription delete:", error);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }

      if (contractor?.id && resend && contractor.email) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
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
          });
        } catch (e) {
          console.error("Suspension email failed:", e);
        }
      }

      console.log(`Contractor suspended — subscription ${subscription.id} deleted`);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;

      if (subscription.status === "active") {
        await supabase
          .from("contractors")
          .update({ status: "active" })
          .eq("stripe_subscription_id", subscription.id);
      }

      if (subscription.status === "canceled" || subscription.status === "unpaid") {
        const { data: contractor } = await supabase
          .from("contractors")
          .update({ status: "suspended" })
          .eq("stripe_subscription_id", subscription.id)
          .select("id, email, business_name")
          .single();

        if (contractor?.email && resend) {
          try {
            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL!,
              to: contractor.email,
              subject: "Your Source A Trade listing has been suspended",
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                  <h2>Your listing has been suspended</h2>
                  <p>Your Source A Trade subscription for <strong>${contractor.business_name}</strong> has ${subscription.status === "unpaid" ? "a failed payment" : "been canceled"}. Your listing is no longer visible to homeowners.</p>
                  ${subscription.status === "unpaid" ? "<p>Please update your payment method to reactivate your listing.</p>" : ""}
                  <p><a href="${appUrl}/dashboard">Visit your dashboard</a> to manage your subscription.</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
                  <p style="color:#94a3b8;font-size:12px">Source A Trade — sourceatrade.com · Questions? Contact support@sourceatrade.com</p>
                </div>
              `,
            });
          } catch (e) {
            console.error("Subscription updated email failed:", e);
          }
        }
      }

      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

export const runtime = "nodejs";
