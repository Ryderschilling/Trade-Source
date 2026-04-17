"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import slugify from "slugify";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
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
        .filter(Boolean)
    : [];

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
      logo_url: logoUrl,
      license_number: parsed.data.license_number ?? null,
      is_licensed: parsed.data.is_licensed,
      is_insured: parsed.data.is_insured,
      years_in_business: parsed.data.years_in_business ?? null,
      is_claimed: !!user,
      status: "active",
    })
    .select("slug")
    .single();

  if (insertError || !contractor) {
    console.error("Contractor insert error:", insertError);
    return { error: "Failed to submit listing. Please try again." };
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
    ? parsed.data.service_areas.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

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
    })
    .eq("id", contractorId);

  if (updateError) {
    console.error("Contractor update error:", updateError);
    return { error: "Failed to update listing. Please try again." };
  }

  return { success: true };
}
