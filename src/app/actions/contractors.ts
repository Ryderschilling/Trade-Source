"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import slugify from "slugify";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { SERVICE_AREAS } from "@/lib/constants";
const LOGO_BUCKET = "contractor-logos";
const PORTFOLIO_BUCKET = "portfolio-photos";
const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_PHOTO_COUNT = 8;

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
  years_experience: z.coerce.number().int().min(0).max(100).optional(),
  service_areas: z.string().optional(), // comma-separated
});

export type JoinFormState = {
  error?: string;
  success?: boolean;
  slug?: string;
};

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  switch (file.type) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return "bin";
  }
}

function normalizeFile(file: FormDataEntryValue | null) {
  return file instanceof File && file.size > 0 ? file : null;
}

export async function joinAsContractor(
  _prev: JoinFormState,
  formData: FormData
): Promise<JoinFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const serviceAreasRaw = formData.get("service_areas") as string | null;
  const additionalCategoryIds = formData.getAll("additional_category_ids") as string[];
  const logoFile = normalizeFile(formData.get("logo"));
  const photoFiles = formData
    .getAll("photos")
    .map((file) => normalizeFile(file))
    .filter((file): file is File => file !== null);

  const raw = {
    business_name: formData.get("business_name") as string,
    owner_name: (formData.get("owner_name") as string) || undefined,
    category_id: formData.get("category_id") as string,
    tagline: (formData.get("tagline") as string) || undefined,
    description: (() => {
      const base = (formData.get("description") as string) || "";
      const customTrade = (formData.get("custom_trade") as string) || "";
      if (customTrade) {
        return customTrade + (base ? `\n\n${base}` : "");
      }
      return base || undefined;
    })(),
    phone: (formData.get("phone") as string) || undefined,
    email: formData.get("email") as string,
    website: (formData.get("website") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    city: (formData.get("city") as string) || "30A",
    state: (formData.get("state") as string) || "FL",
    zip: (formData.get("zip") as string) || undefined,
    license_number: (formData.get("license_number") as string) || undefined,
    is_licensed: formData.get("is_licensed") === "on" || formData.get("is_licensed") === "true",
    is_insured:  formData.get("is_insured")  === "on" || formData.get("is_insured")  === "true",
    years_in_business: formData.get("years_in_business")
      ? Number(formData.get("years_in_business"))
      : undefined,
    years_experience: formData.get("years_experience")
      ? Number(formData.get("years_experience"))
      : undefined,
    service_areas: serviceAreasRaw || undefined,
  };

  const parsed = joinSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError ?? "Please fix the form errors." };
  }

  if (logoFile) {
    if (!logoFile.type.startsWith("image/")) {
      return { error: "Logo must be an image file." };
    }
    if (logoFile.size > MAX_LOGO_BYTES) {
      return { error: "Logo must be 5MB or smaller." };
    }
  }

  if (photoFiles.length > MAX_PHOTO_COUNT) {
    return { error: `You can upload up to ${MAX_PHOTO_COUNT} photos.` };
  }

  for (const photo of photoFiles) {
    if (!photo.type.startsWith("image/")) {
      return { error: "Only image files are accepted for portfolio photos." };
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return { error: "Each photo must be 10MB or smaller." };
    }
  }

  // Generate unique slug
  const baseSlug = slugify(parsed.data.business_name, { lower: true, strict: true });
  const serviceClient = await createServiceClient();
  const contractorId = crypto.randomUUID();

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
        .filter((s) => SERVICE_AREAS.includes(s))
    : [];

  if (serviceAreasList.length === 0) {
    return { error: "Please select at least one valid service area." };
  }

  let logoUrl: string | null = null;

  if (logoFile) {
    const logoPath = `${contractorId}/${Date.now()}-logo.${getFileExtension(logoFile)}`;
    const { error: uploadError } = await serviceClient.storage
      .from(LOGO_BUCKET)
      .upload(logoPath, await logoFile.arrayBuffer(), {
        contentType: logoFile.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Logo upload error:", uploadError);
      return { error: `Logo upload failed: ${uploadError.message}` };
    }

    const { data } = serviceClient.storage.from(LOGO_BUCKET).getPublicUrl(logoPath);
    logoUrl = data.publicUrl;
  }

  const uploadedPhotoUrls: string[] = [];
  for (const [index, photo] of photoFiles.entries()) {
    const photoPath = `${contractorId}/${Date.now()}-${index + 1}.${getFileExtension(photo)}`;
    const { error: uploadError } = await serviceClient.storage
      .from(PORTFOLIO_BUCKET)
      .upload(photoPath, await photo.arrayBuffer(), {
        contentType: photo.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Portfolio photo upload error:", uploadError);
      return { error: "We couldn't upload your photos. Please try again." };
    }

    const { data } = serviceClient.storage.from(PORTFOLIO_BUCKET).getPublicUrl(photoPath);
    uploadedPhotoUrls.push(data.publicUrl);
  }

  const { data: contractor, error: insertError } = await serviceClient
    .from("contractors")
    .insert({
      id: contractorId,
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
      additional_categories: additionalCategoryIds.filter((id) => id && id !== parsed.data.category_id),
      logo_url: logoUrl,
      license_number: parsed.data.license_number ?? null,
      is_licensed: parsed.data.is_licensed,
      is_insured: parsed.data.is_insured,
      years_in_business: parsed.data.years_in_business ?? null,
      years_experience: parsed.data.years_experience ?? null,
      is_claimed: !!user,
      status: "pending",
    })
    .select("id, slug")
    .single();

  if (insertError || !contractor) {
    console.error("Contractor insert error:", insertError);
    return { error: "We couldn't save your listing. Please try again." };
  }

  if (uploadedPhotoUrls.length > 0) {
    const { error: photoInsertError } = await serviceClient
      .from("portfolio_photos")
      .insert(
        uploadedPhotoUrls.map((url, index) => ({
          contractor_id: contractorId,
          url,
          sort_order: index,
        }))
      );

    if (photoInsertError) {
      console.error("Portfolio photo insert error:", photoInsertError);
      return { error: "Your listing was created, but we couldn't save the photos." };
    }
  }

  // Insert packages if provided
  const packagesRaw = formData.get("packages_json") as string | null;
  if (packagesRaw) {
    try {
      const pkgs = JSON.parse(packagesRaw) as Array<{ name: string; description?: string; price_label?: string }>;
      const validPkgs = pkgs.filter((p) => p.name?.trim()).slice(0, 4);
      if (validPkgs.length > 0) {
        await serviceClient.from("contractor_packages").insert(
          validPkgs.map((p, i) => ({
            contractor_id: contractorId,
            name: p.name.trim(),
            description: p.description?.trim() || null,
            price_label: p.price_label?.trim() || null,
            sort_order: i,
          }))
        );
      }
    } catch {
      // Non-fatal: packages are optional
    }
  }

  // Update profile role to contractor if logged in
  if (user) {
    await serviceClient
      .from("profiles")
      .update({ role: "contractor" })
      .eq("id", user.id);
  }

  // Send confirmation email
  await sendEmail({
    to: parsed.data.email,
    subject: "Complete payment to activate your Source A Trade listing",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Almost there, ${parsed.data.business_name}!</h2>
        <p>Your listing on <strong>Source A Trade</strong> has been created. To make it live, complete your $50/month subscription payment.</p>
        <p>If you were redirected to Stripe and completed payment, your listing will go live automatically within a few seconds.</p>
        <p>Once active, your listing will be at:<br/><a href="${process.env.NEXT_PUBLIC_APP_URL}/contractors/${slug}">${process.env.NEXT_PUBLIC_APP_URL}/contractors/${slug}</a></p>
        <hr />
        <p style="color:#64748b;font-size:14px">Questions? Reply to this email or contact us at support@sourceatrade.com</p>
      </div>
    `,
    kind: "transactional:contractor:welcome",
    meta: { contractor_id: contractorId },
  });

  // Create Stripe Checkout Session
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-03-31.basil" as any,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_BASE_50!,
        quantity: 1,
      },
    ],
    customer_email: parsed.data.email,
    metadata: {
      contractor_id: contractorId,
      contractor_slug: contractor.slug,
    },
    subscription_data: {
      metadata: {
        contractor_id: contractorId,
        contractor_slug: contractor.slug,
      },
    },
    success_url: `${appUrl}/join/success?slug=${contractor.slug}&paid=1`,
    cancel_url: `${appUrl}/join/cancel?slug=${contractor.slug}`,
  });

  if (!session.url) {
    return { error: "Failed to create payment session. Please try again." };
  }

  redirect(session.url);
}

// ─── Edit / update an existing contractor listing ────────────────────────────

export type EditListingFormState = {
  error?: string;
  success?: boolean;
};

export async function updateContractor(
  _prev: EditListingFormState,
  formData: FormData
): Promise<EditListingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const contractorId = formData.get("contractor_id") as string;
  if (!contractorId) return { error: "Invalid request." };

  const serviceClient = await createServiceClient();

  // Verify ownership
  const { data: existing } = await serviceClient
    .from("contractors")
    .select("id, user_id, logo_url")
    .eq("id", contractorId)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return { error: "Listing not found." };
  }

  const logoFile = normalizeFile(formData.get("logo"));
  const photoFiles = formData
    .getAll("photos")
    .map((file) => normalizeFile(file))
    .filter((file): file is File => file !== null);
  const deletedPhotoIds = (formData.get("deleted_photo_ids") as string || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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
    is_licensed: formData.get("is_licensed") === "on" || formData.get("is_licensed") === "true",
    is_insured:  formData.get("is_insured")  === "on" || formData.get("is_insured")  === "true",
    years_in_business: formData.get("years_in_business")
      ? Number(formData.get("years_in_business"))
      : undefined,
    years_experience: formData.get("years_experience")
      ? Number(formData.get("years_experience"))
      : undefined,
    service_areas: serviceAreasRaw || undefined,
  };

  const parsed = joinSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError ?? "Please fix the form errors." };
  }

  if (logoFile) {
    if (!logoFile.type.startsWith("image/")) {
      return { error: "Logo must be an image file." };
    }
    if (logoFile.size > MAX_LOGO_BYTES) {
      return { error: "Logo must be 5MB or smaller." };
    }
  }

  if (photoFiles.length > MAX_PHOTO_COUNT) {
    return { error: `You can upload up to ${MAX_PHOTO_COUNT} new photos at a time.` };
  }

  for (const photo of photoFiles) {
    if (!photo.type.startsWith("image/")) {
      return { error: "Only image files are accepted for portfolio photos." };
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return { error: "Each photo must be 10MB or smaller." };
    }
  }

  const serviceAreasList = parsed.data.service_areas
    ? parsed.data.service_areas.split(",").map((s) => s.trim()).filter((s) => SERVICE_AREAS.includes(s))
    : [];

  if (serviceAreasList.length === 0) {
    return { error: "Please select at least one valid service area." };
  }

  // Upload new logo if provided
  let logoUrl = existing.logo_url;
  if (logoFile) {
    const logoPath = `${contractorId}/${Date.now()}-logo.${getFileExtension(logoFile)}`;
    const { error: uploadError } = await serviceClient.storage
      .from(LOGO_BUCKET)
      .upload(logoPath, await logoFile.arrayBuffer(), {
        contentType: logoFile.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) {
      return { error: `Logo upload failed: ${uploadError.message}` };
    }
    const { data } = serviceClient.storage.from(LOGO_BUCKET).getPublicUrl(logoPath);
    logoUrl = data.publicUrl;
  }

  // Delete removed portfolio photos
  if (deletedPhotoIds.length > 0) {
    await serviceClient
      .from("portfolio_photos")
      .delete()
      .in("id", deletedPhotoIds)
      .eq("contractor_id", contractorId);
  }

  // Upload and insert new portfolio photos
  if (photoFiles.length > 0) {
    const uploadedPhotoUrls: string[] = [];
    for (const [index, photo] of photoFiles.entries()) {
      const photoPath = `${contractorId}/${Date.now()}-new-${index + 1}.${getFileExtension(photo)}`;
      const { error: uploadError } = await serviceClient.storage
        .from(PORTFOLIO_BUCKET)
        .upload(photoPath, await photo.arrayBuffer(), {
          contentType: photo.type || "application/octet-stream",
          upsert: false,
        });
      if (uploadError) {
        return { error: "We couldn't upload your photos. Please try again." };
      }
      const { data } = serviceClient.storage.from(PORTFOLIO_BUCKET).getPublicUrl(photoPath);
      uploadedPhotoUrls.push(data.publicUrl);
    }

    const { data: lastPhoto } = await serviceClient
      .from("portfolio_photos")
      .select("sort_order")
      .eq("contractor_id", contractorId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const startOrder = (lastPhoto?.sort_order ?? -1) + 1;

    await serviceClient.from("portfolio_photos").insert(
      uploadedPhotoUrls.map((url, index) => ({
        contractor_id: contractorId,
        url,
        sort_order: startOrder + index,
      }))
    );
  }

  // Update the contractor record
  const { error: updateError } = await serviceClient
    .from("contractors")
    .update({
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
      logo_url: logoUrl,
      license_number: parsed.data.license_number ?? null,
      is_licensed: parsed.data.is_licensed,
      is_insured: parsed.data.is_insured,
      years_in_business: parsed.data.years_in_business ?? null,
      years_experience: parsed.data.years_experience ?? null,
    })
    .eq("id", contractorId);

  if (updateError) {
    console.error("Contractor update error:", updateError);
    return { error: "Failed to update listing. Please try again." };
  }

  return { success: true };
}

// ─── Resume checkout for an existing pending contractor ──────────────────────

export async function resumeContractorCheckout(formData: FormData): Promise<void> {
  const contractorId = formData.get("contractor_id") as string;
  if (!contractorId) redirect("/join");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, slug, email")
    .eq("id", contractorId)
    .eq("user_id", user.id)
    .single();

  if (!contractor) redirect("/join");

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-03-31.basil" as any,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_PRICE_BASE_50!, quantity: 1 }],
    customer_email: contractor.email ?? undefined,
    metadata: {
      contractor_id: contractor.id,
      contractor_slug: contractor.slug,
    },
    subscription_data: {
      metadata: {
        contractor_id: contractor.id,
        contractor_slug: contractor.slug,
      },
    },
    success_url: `${appUrl}/join/success?slug=${contractor.slug}&paid=1`,
    cancel_url: `${appUrl}/join/cancel?slug=${contractor.slug}`,
  });

  if (!session.url) redirect(`/join/cancel?slug=${contractor.slug}&error=1`);

  redirect(session.url);
}

export async function deleteContractor(contractorId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const serviceClient = await createServiceClient();

  // Verify ownership before deleting
  const { data: existing } = await serviceClient
    .from("contractors")
    .select("id, user_id")
    .eq("id", contractorId)
    .single();

  if (!existing || existing.user_id !== user.id) {
    throw new Error("Listing not found.");
  }

  const { error } = await serviceClient
    .from("contractors")
    .delete()
    .eq("id", contractorId);

  if (error) throw new Error("Failed to delete listing. Please try again.");

  redirect("/dashboard");
}
