"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = {};

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
