"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import slugify from "slugify";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const joinSchema = z.object({
  business_name: z.string().min(2, "Business name is required"),
  owner_name: z.string().optional(),
  category_id: z.string().uuid("Please select a category"),
  tagline: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  phone: z.string().optional(),
  email: z.string().email("Valid email required"),
  website: z.string().url("Enter a valid URL (include https://)").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().default("FL"),
  zip: z.string().optional(),
  license_number: z.string().optional(),
  is_licensed: z.boolean().default(false),
  is_insured: z.boolean().default(false),
  years_in_business: z.coerce.number().int().min(0).max(100).optional(),
  service_areas: z.string().optional(), // comma-separated
});

export type JoinFormState = {
  error?: string;
  success?: boolean;
  slug?: string;
};

export async function joinAsContractor(
  _prev: JoinFormState,
  formData: FormData
): Promise<JoinFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const serviceAreasRaw = formData.get("service_areas") as string | null;

  const raw = {
    business_name: formData.get("business_name") as string,
    owner_name: (formData.get("owner_name") as string) || undefined,
    category_id: formData.get("category_id") as string,
    tagline: (formData.get("tagline") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    email: formData.get("email") as string,
    website: (formData.get("website") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    city: (formData.get("city") as string) || "30A",
    state: (formData.get("state") as string) || "FL",
    zip: (formData.get("zip") as string) || undefined,
    license_number: (formData.get("license_number") as string) || undefined,
    is_licensed: formData.get("is_licensed") === "on",
    is_insured: formData.get("is_insured") === "on",
    years_in_business: formData.get("years_in_business")
      ? Number(formData.get("years_in_business"))
      : undefined,
    service_areas: serviceAreasRaw || undefined,
  };

  const parsed = joinSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError ?? "Please fix the form errors." };
  }

  // Generate unique slug
  const baseSlug = slugify(parsed.data.business_name, { lower: true, strict: true });
  const serviceClient = await createServiceClient();

  let slug = baseSlug;
  let attempt = 0;
  while (attempt < 10) {
    const { data: existing } = await serviceClient
      .from("contractors")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const serviceAreasList = parsed.data.service_areas
    ? parsed.data.service_areas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const { data: contractor, error: insertError } = await serviceClient
    .from("contractors")
    .insert({
      user_id: user?.id ?? null,
      slug,
      business_name: parsed.data.business_name,
      owner_name: parsed.data.owner_name ?? null,
      category_id: parsed.data.category_id,
      tagline: parsed.data.tagline ?? null,
      description: parsed.data.description ?? null,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email,
      website: parsed.data.website || null,
      address: parsed.data.address ?? null,
      city: parsed.data.city,
      state: parsed.data.state,
      zip: parsed.data.zip ?? null,
      service_areas: serviceAreasList,
      license_number: parsed.data.license_number ?? null,
      is_licensed: parsed.data.is_licensed,
      is_insured: parsed.data.is_insured,
      years_in_business: parsed.data.years_in_business ?? null,
      is_claimed: !!user,
      status: "pending",
    })
    .select("slug")
    .single();

  if (insertError || !contractor) {
    console.error("Contractor insert error:", insertError);
    return { error: "Failed to submit listing. Please try again." };
  }

  // Update profile role to contractor if logged in
  if (user) {
    await serviceClient
      .from("profiles")
      .update({ role: "contractor" })
      .eq("id", user.id);
  }

  // Send confirmation email
  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: parsed.data.email,
        subject: "Your Trade Source listing is pending review",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2>Thanks for listing ${parsed.data.business_name}!</h2>
            <p>We received your listing on <strong>Trade Source</strong> and it's currently under review.</p>
            <p>You'll hear back from us within 1 business day. Once approved, your listing will be live at:</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/contractors/${slug}">${process.env.NEXT_PUBLIC_APP_URL}/contractors/${slug}</a></p>
            <hr />
            <p style="color:#64748b;font-size:14px">Questions? Reply to this email or contact us at hello@sourceatrade.com</p>
          </div>
        `,
      });
    } catch (e) {
      console.error("Welcome email failed:", e);
    }
  }

  redirect(`/join/success?slug=${slug}`);
}
