"use server";

import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const reviewSchema = z.object({
  contractor_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Rating is required").max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(10, "Review must be at least 10 characters"),
  is_anonymous: z.enum(["true", "false"]).transform((v) => v === "true").default(false),
});

export type ReviewFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"rating" | "title" | "body", string[]>>;
};

export async function submitReview(
  _prev: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to leave a review." };
  }

  const raw = {
    contractor_id: formData.get("contractor_id") as string,
    rating: formData.get("rating") as string,
    title: (formData.get("title") as string) || undefined,
    body: formData.get("body") as string,
    is_anonymous: (formData.get("is_anonymous") as string) || "false",
  };

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Partial<Record<"rating" | "title" | "body", string[]>>,
    };
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("contractor_id", parsed.data.contractor_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "You have already reviewed this business." };
  }

  const serviceClient = await createServiceClient();

  const { error: insertError } = await serviceClient.from("reviews").insert({
    contractor_id: parsed.data.contractor_id,
    user_id: user.id,
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    body: parsed.data.body,
    is_anonymous: parsed.data.is_anonymous,
  });

  if (insertError) {
    console.error("Review insert error:", insertError);
    return { success: false, error: "Failed to submit review. Please try again." };
  }

  // Recalculate avg_rating and review_count
  const { data: allReviews } = await serviceClient
    .from("reviews")
    .select("rating")
    .eq("contractor_id", parsed.data.contractor_id);

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await serviceClient
      .from("contractors")
      .update({ avg_rating: Math.round(avg * 10) / 10, review_count: allReviews.length })
      .eq("id", parsed.data.contractor_id);
  }

  const { data: contractor } = await serviceClient
    .from("contractors")
    .select("user_id, business_name, email")
    .eq("id", parsed.data.contractor_id)
    .single();

  if (contractor?.user_id) {
    const truncated = parsed.data.body.length > 120 ? parsed.data.body.slice(0, 117) + "…" : parsed.data.body;
    await serviceClient.from("notifications").insert({
      user_id: contractor.user_id,
      type: "review",
      title: `New ${parsed.data.rating}-star review`,
      body: truncated,
      link: "/dashboard",
    });
  }

  const { data: reviewer } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const reviewerDisplayName = parsed.data.is_anonymous ? "Anonymous" : (reviewer?.full_name ?? user.email ?? "Anonymous");

  if (contractor?.email && process.env.RESEND_API_KEY) {
    const stars = "★".repeat(parsed.data.rating) + "☆".repeat(5 - parsed.data.rating);
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: contractor.email,
        subject: `New ${parsed.data.rating}-star review on Trade Source`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2>New Review for ${contractor.business_name}</h2>
            <p><strong>Rating:</strong> ${stars} (${parsed.data.rating}/5)</p>
            <p><strong>From:</strong> ${reviewerDisplayName}</p>
            ${parsed.data.title ? `<p><strong>Title:</strong> ${parsed.data.title}</p>` : ""}
            <blockquote style="border-left:3px solid #e2e8f0;margin:0;padding:8px 16px;color:#64748b">
              ${parsed.data.body.replace(/\n/g, "<br/>")}
            </blockquote>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
            <p style="color:#64748b;font-size:14px">
              View your reviews in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">dashboard</a>.
            </p>
          </div>
        `,
      });
    } catch (e) {
      console.error("Review email failed:", e);
    }
  }

  // Send confirmation to the reviewer
  const reviewerEmail = reviewer?.email ?? user.email;
  if (reviewerEmail && process.env.RESEND_API_KEY) {
    const stars = "★".repeat(parsed.data.rating) + "☆".repeat(5 - parsed.data.rating);
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: reviewerEmail,
        subject: `Your review for ${contractor?.business_name ?? "this business"} has been posted`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2>Thanks for your review!</h2>
            <p>Your ${parsed.data.rating}-star review for <strong>${contractor?.business_name ?? "this business"}</strong> has been posted on Trade Source.</p>
            <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0 0 6px 0;font-size:18px;letter-spacing:2px">${stars}</p>
              ${parsed.data.title ? `<p style="margin:0 0 6px 0;font-weight:600;color:#1e293b">${parsed.data.title}</p>` : ""}
              <p style="margin:0;color:#374151;font-size:15px">${parsed.data.body.replace(/\n/g, "<br/>")}</p>
            </div>
            <p style="color:#64748b;font-size:13px">Reviews help other homeowners make informed decisions. Thank you for contributing to the community.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
            <p style="color:#94a3b8;font-size:12px">Trade Source — sourceatrade.com</p>
          </div>
        `,
      });
    } catch (e) {
      console.error("Reviewer confirmation email failed:", e);
    }
  }

  return { success: true };
}
