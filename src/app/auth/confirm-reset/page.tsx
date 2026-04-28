import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Props {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}

export default async function ConfirmResetPage({ searchParams }: Props) {
  const { token_hash, type } = await searchParams;

  if (!token_hash || type !== "recovery") {
    redirect("/forgot-password?error=invalid_link");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Click the button below to continue.
          </p>
        </div>
        <form action={async () => {
          "use server";
          const supabase = await createClient();
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token_hash!,
            type: "recovery",
          });
          if (error) {
            redirect("/forgot-password?error=invalid_link");
          }
          redirect("/update-password");
        }}>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Continue to reset password
          </button>
        </form>
      </div>
    </div>
  );
}