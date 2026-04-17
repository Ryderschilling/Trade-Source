"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { updateProfile, type ProfileFormState } from "@/app/actions/profile";
import type { Profile } from "@/lib/supabase/types";

const initialState: ProfileFormState = {};

interface EditFormProps {
  profile: Profile;
}

export function EditProfileForm({ profile }: EditFormProps) {
  const [state, action, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={action} className="space-y-6">
      {state.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400">
          Profile updated successfully.
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name *</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name ?? ""}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ""}
          placeholder="(850) 555-0100"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          name="city"
          defaultValue={profile.city ?? ""}
          placeholder="Santa Rosa Beach"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          placeholder="Tell others a bit about yourself..."
          rows={4}
          maxLength={500}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="avatar_url">Avatar URL</Label>
        <Input
          id="avatar_url"
          name="avatar_url"
          type="url"
          defaultValue={profile.avatar_url ?? ""}
          placeholder="https://example.com/avatar.jpg"
        />
        <p className="text-xs text-muted-foreground">
          Paste a direct link to an image. File upload coming soon.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="is_public"
          name="is_public"
          defaultChecked={profile.is_public}
        />
        <div>
          <Label htmlFor="is_public" className="cursor-pointer font-medium">
            Public profile
          </Label>
          <p className="text-xs text-muted-foreground">
            When enabled, your profile is visible to other users.
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
