import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { JoinForm } from "./join-form";
import type { Category } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "List Your Business",
  description:
    "Add your contracting business to the Source A Trade directory. List today to get leads instantly. — reach homeowners across 30A and Northwest Florida.",
};

export default async function JoinPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("sort_order");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-muted/40 border-b border-border py-12">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight">
            List Your Business
          </h1>
          <p className="mt-3 text-muted-foreground text-lg leading-relaxed max-w-xl">
            Join the only hyper-local trade directory built for the 30A
            community. List today to get leads instantly.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <JoinForm
          categories={(categories ?? []) as Pick<Category, "id" | "name" | "slug">[]}
          userEmail={user?.email}
          userId={user?.id}
        />
      </div>
    </div>
  );
}
