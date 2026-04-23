import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel cron jobs send Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Resend not configured" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sourceatrade.com";
  const supabase = await createServiceClient();

  // Find quote requests created 13–15 days ago that haven't had a follow-up sent
  const now = new Date();
  const windowStart = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString();

  const { data: quotes, error } = await supabase
    .from("quote_requests")
    .select("id, name, email, categories(name)")
    .is("followup_sent_at", null)
    .gte("created_at", windowStart)
    .lte("created_at", windowEnd);

  if (error) {
    console.error("quote-followup cron: fetch error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!quotes || quotes.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  const sentIds: string[] = [];

  for (const quote of quotes) {
    const categoryName = quote.categories?.name ?? "your project";

    const { data: recipients } = await supabase
      .from("quote_request_recipients")
      .select("contractors(id, business_name, slug)")
      .eq("quote_request_id", quote.id);

    const contractors = (recipients ?? [])
      .map((r) => r.contractors)
      .filter((c): c is NonNullable<typeof c> => c !== null);

    const contractorListHtml = contractors.length
      ? contractors
          .map(
            (c) =>
              `<li style="margin-bottom:8px">
                <strong>${c.business_name}</strong> —
                <a href="${appUrl}/contractors/${c.slug}#reviews">Leave a review</a>
              </li>`
          )
          .join("")
      : `<li>the contractor(s) you selected</li>`;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: quote.email,
        subject: `How did your ${categoryName} project go? — Source A Trade`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2>Hey ${quote.name}, how did it go?</h2>
            <p>A couple of weeks ago you requested quotes for <strong>${categoryName}</strong> work on Source A Trade.</p>
            <p>If you hired one of these businesses, a quick review helps other homeowners in your area make great decisions:</p>
            <ul style="padding-left:20px;line-height:1.8">
              ${contractorListHtml}
            </ul>
            <p style="color:#64748b;font-size:14px">Reviews take less than 2 minutes and make a big difference for local contractors.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
            <p style="color:#94a3b8;font-size:12px">
              You received this because you submitted a quote request for ${categoryName} on Source A Trade.
              <br/>Source A Trade — sourceatrade.com
            </p>
          </div>
        `,
      });
      sentIds.push(quote.id);
      sent++;
    } catch (e) {
      console.error(`quote-followup: email failed for quote ${quote.id}`, e);
    }
  }

  // Mark follow-ups as sent
  if (sentIds.length > 0) {
    await supabase
      .from("quote_requests")
      .update({ followup_sent_at: new Date().toISOString() })
      .in("id", sentIds);
  }

  console.log(`quote-followup cron: sent ${sent} follow-up emails`);
  return NextResponse.json({ sent });
}
