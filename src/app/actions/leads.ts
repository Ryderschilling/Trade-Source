"use server";

import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be 100 characters or fewer"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
  description: z.string().min(10, "Please describe your project (min 10 characters)").max(2000, "Description must be 2000 characters or fewer"),
  contractor_id: z.string().uuid("Invalid contractor"),
  category_id: z.string().uuid("Invalid category"),
});

export type LeadFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof leadSchema>, string[]>>;
};

export async function submitLead(
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in to request a quote." };

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    description: formData.get("description") as string,
    contractor_id: formData.get("contractor_id") as string,
    category_id: formData.get("category_id") as string,
  };

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Partial<
        Record<keyof z.infer<typeof leadSchema>, string[]>
      >,
    };
  }

  const supabase = await createServiceClient();

  // Get contractor info for email notification
  const { data: contractor } = await supabase
    .from("contractors")
    .select("user_id, business_name, email")
    .eq("id", parsed.data.contractor_id)
    .single();

  const { error: insertError } = await supabase.from("leads").insert({
    contractor_id: parsed.data.contractor_id,
    category_id: parsed.data.category_id,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    description: parsed.data.description,
  });

  if (insertError) {
    console.error("Lead insert error:", insertError);
    return { success: false, error: "Failed to submit request. Please try again." };
  }

  // Create in-app notification for contractor
  if (contractor?.user_id) {
    const truncated = parsed.data.description.length > 120 ? parsed.data.description.slice(0, 117) + "…" : parsed.data.description;
    await supabase.from("notifications").insert({
      user_id: contractor.user_id,
      type: "lead",
      title: `New quote request from ${parsed.data.name}`,
      body: truncated,
      link: "/dashboard",
    });
  }

  // Send email notification to contractor
  if (contractor?.email && process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: contractor.email,
        subject: `New quote request from ${parsed.data.name} — Trade Source`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2>New Quote Request</h2>
            <p>You have a new quote request on <strong>Trade Source</strong> for <strong>${contractor.business_name}</strong>.</p>
            <hr />
            <p><strong>From:</strong> ${parsed.data.name}</p>
            <p><strong>Email:</strong> ${parsed.data.email}</p>
            ${parsed.data.phone ? `<p><strong>Phone:</strong> ${parsed.data.phone}</p>` : ""}
            <p><strong>Description:</strong></p>
            <blockquote style="border-left:3px solid #e2e8f0;margin:0;padding:8px 16px;color:#64748b">
              ${parsed.data.description.replace(/\n/g, "<br/>")}
            </blockquote>
            <hr />
            <p style="color:#64748b;font-size:14px">
              Log into your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">contractor dashboard</a> to manage this lead.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      // Don't fail the whole request if email fails
      console.error("Email notification failed:", emailErr);
    }
  }

  return { success: true };
}
