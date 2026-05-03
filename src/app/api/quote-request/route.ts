import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { buildEmailHtml } from "@/lib/email-template";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "rl:quote-request",
});

const schema = z.object({
  category_id: z.string().uuid(),
  contractor_ids: z.array(z.string().uuid()).min(1),
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  description: z.string().min(1).max(2000),
  timeline: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
      ?? req.headers.get("x-real-ip")
      ?? "anonymous";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const raw = await req.json();

    // Honeypot: real users leave this empty; silently discard bot submissions
    if (raw.referral_source) {
      return NextResponse.json({ success: true, request_id: null });
    }

    const result = schema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { category_id, contractor_ids, name, email, phone, description, timeline } = result.data;

    const supabase = await createServiceClient();

    const { data: category } = await supabase
      .from("categories")
      .select("name, group_id")
      .eq("id", category_id)
      .single();

    const { data: quoteRequest, error: qrError } = await supabase
      .from("quote_requests")
      .insert({
        category_id,
        group_id: category?.group_id ?? null,
        name,
        email,
        phone: phone ?? null,
        description,
        timeline: timeline ?? null,
      })
      .select("id")
      .single();

    if (qrError || !quoteRequest) {
      console.error("quote_request insert error:", qrError);
      return NextResponse.json({ error: "Failed to create quote request." }, { status: 500 });
    }

    const recipientRows = contractor_ids.map((contractor_id: string) => ({
      quote_request_id: quoteRequest.id,
      contractor_id,
    }));

    const { error: recipientError } = await supabase
      .from("quote_request_recipients")
      .insert(recipientRows);

    if (recipientError) {
      console.error("recipient insert error:", recipientError);
    }

    const leadRows = contractor_ids.map((contractor_id: string) => ({
      contractor_id,
      name,
      email,
      phone: phone ?? null,
      message: description,
      service_type: category?.name ?? null,
      preferred_contact: phone ? "either" : "email",
      status: "new",
    }));

    const { error: leadError } = await supabase.from("leads").insert(leadRows as any);
    if (leadError) {
      console.error("lead insert error:", leadError);
    }

    const { data: contractors } = await supabase
      .from("contractors")
      .select("id, user_id, business_name, email")
      .in("id", contractor_ids);

    const categoryName = category?.name ?? "your trade";
    const truncatedDesc = description.length > 117 ? description.slice(0, 114) + "…" : description;
    const timelineLabel = timeline ?? "Not specified";

    await Promise.all(
      (contractors ?? []).map(async (contractor) => {
        if (contractor.user_id) {
          await supabase.from("notifications").insert({
            user_id: contractor.user_id,
            type: "quote_request",
            title: `New quote request from ${name}`,
            body: truncatedDesc,
            link: "/dashboard",
          });
        }

        if (contractor.email) {
          await sendEmail({
            to: contractor.email,
            replyTo: email,
            subject: `New quote request — ${categoryName}`,
            html: buildEmailHtml({
              heading: `New quote request — ${categoryName}`,
              intro: `A homeowner is looking for a <strong>${categoryName}</strong> contractor.`,
              details: [
                { label: "Name", value: name },
                { label: "Email", value: email },
                phone ? { label: "Phone", value: phone } : null,
                { label: "Timeline", value: timelineLabel },
              ],
              messageLabel: "Project description",
              message: description,
              footerNote: `Reply directly to this email to respond to ${name}.`,
            }),
            kind: "transactional:quote_request",
            meta: { contractor_id: contractor.id, quote_request_id: quoteRequest.id },
          });
        }
      })
    );

    const businessNames = (contractors ?? []).map((c) => c.business_name).filter(Boolean);
    const contractorListHtml = businessNames.length
      ? businessNames.join(", ")
      : "your selected contractors"

    await sendEmail({
      to: email,
      subject: `Your quote request has been sent — Source A Trade`,
      html: buildEmailHtml({
        heading: `Quote request received, ${name}!`,
        intro: `Your request for <strong>${categoryName}</strong> work has been sent to ${contractorListHtml}. Each contractor will review and reach out to you directly at <strong>${email}</strong>${phone ? ` or <strong>${phone}</strong>` : ""}.`,
        messageLabel: "Your project description",
        message: description,
        footerNote: `Timeline: ${timelineLabel}`,
      }),
      kind: "transactional:quote_request:confirmation",
      meta: { quote_request_id: quoteRequest.id },
    });

    return NextResponse.json({ success: true, request_id: quoteRequest.id });
  } catch (e) {
    console.error("quote-request route error:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
