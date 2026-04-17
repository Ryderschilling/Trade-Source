import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EditListingForm } from "./edit-form";
import type { Category, Contractor, PortfolioPhoto } from "@/lib/supabase/types";

export const metadata = { title: "Edit Listing" };

export default async function EditListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: contractor }, { data: categories }] = await Promise.all([
    supabase
      .from("contractors")
      .select("*, categories(*), portfolio_photos(*)")
      .eq("user_id", user.id)
      .order("sort_order", { referencedTable: "portfolio_photos", ascending: true })
      .maybeSingle(),
    supabase.from("categories").select("id, name, slug").order("name"),
  ]);

  if (!contractor) notFound();

  const c = contractor as unknown as Contractor & { categories: Category; portfolio_photos: PortfolioPhoto[] };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-4">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Edit Listing</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Changes are applied immediately to your public profile.
          </p>
        </div>

        <EditListingForm
          contractor={c}
          portfolioPhotos={c.portfolio_photos}
          categories={(categories ?? []) as Pick<Category, "id" | "name" | "slug">[]}
        />
      </div>
    </main>
  );
}
