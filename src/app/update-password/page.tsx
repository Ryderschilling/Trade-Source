import type { Metadata } from "next";
import { UpdatePasswordForm } from "./update-password-form";

export const metadata: Metadata = {
  title: "Update Password",
};

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a new password for your account.
          </p>
        </div>

        <UpdatePasswordForm />
      </div>
    </div>
  );
}
