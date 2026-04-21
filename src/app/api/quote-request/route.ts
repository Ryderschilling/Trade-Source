import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

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
    const raw = await req.json();

    // Honeypot: real users leave this empty; silently discard bot submissions
    if (raw.website) {
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

    // Fetch category for email subject
    const { data: category } = await supabase
      .from("categories")
      .select("name, group_id")
      .eq("id", category_id)
      .single();

    // Insert quote request
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

    // Insert recipients
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

    // Fetch contractor details for notifications + emails
    const { data: contractors } = await supabase
      .from("contractors")
      .select("id, user_id, business_name, email")
      .in("id", contractor_ids);

    const categoryName = category?.name ?? "your trade";
    const truncatedDesc = description.length > 120 ? description.slice(0, 117) + "…" : description;
    const timelineLabel = timeline ?? "Not specified";

    // Insert notifications + send emails
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

        if (contractor.email && process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          try {
            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL!,
              to: contractor.email,
              replyTo: email,
              subject: `New quote request — ${categoryName}`,
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                  <h2>New quote request on Trade Source</h2>
                  <p>A homeowner is looking for a <strong>${categoryName}</strong> contractor.</p>
                  <table style="width:100%;border-collapse:collapse;margin:16px 0">
                    <tr><td style="padding:6px 0;color:#64748b;width:120px">Name</td><td style="padding:6px 0;font-weight:500">${name}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0"><a href="mailto:${email}">${email}</a></td></tr>
                    ${phone ? `<tr><td style="padding:6px 0;color:#64748b">Phone</td><td style="padding:6px 0">${phone}</td></tr>` : ""}
                    <tr><td style="padding:6px 0;color:#64748b">Timeline</td><td style="padding:6px 0">${timelineLabel}</td></tr>
                  </table>
                  <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0">
                    <p style="margin:0;color:#374151;font-size:15px">${description}</p>
                  </div>
                  <p style="color:#64748b;font-size:13px">Reply directly to this email to respond to ${name}.</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
                  <p style="color:#94a3b8;font-size:12px">Trade Source — sourceatrade.com</p>
                </div>
              `,
            });
          } catch (e) {
            console.error("Email send failed for contractor", contractor.id, e);
          }
        }
      })
    );

    return NextResponse.json({ success: true, request_id: quoteRequest.id });
  } catch (e) {
    console.error("quote-request route error:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
