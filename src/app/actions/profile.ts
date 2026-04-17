"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateProfileSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  is_public: z.boolean().default(true),
});

export type ProfileFormState = {
  error?: string;
  success?: boolean;
};

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const parsed = updateProfileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: (formData.get("phone") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    bio: (formData.get("bio") as string) || undefined,
    avatar_url: (formData.get("avatar_url") as string) || undefined,
    is_public: formData.get("is_public") === "on",
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError ?? "Please fix the errors above." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone ?? null,
      city: parsed.data.city ?? null,
      bio: parsed.data.bio ?? null,
      avatar_url: parsed.data.avatar_url || null,
      is_public: parsed.data.is_public,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
