import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EditListingForm } from "@/app/dashboard/edit/edit-form";
import type { Category, Contractor, ContractorPackage, PortfolioPhoto } from "@/lib/supabase/types";

export const metadata = { title: "Edit Listing" };

type PageProps = { params: Promise<{ contractorId: string }> };

export default async function EditListingPage({ params }: PageProps) {
  const { contractorId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: contractor }, { data: categories }] = await Promise.all([
    supabase
      .from("contractors")
      .select("*, categories(*), portfolio_photos(*)")
      .eq("id", contractorId)
      .eq("user_id", user.id)
      .order("sort_order", { referencedTable: "portfolio_photos", ascending: true })
      .maybeSingle(),
    supabase.from("categories").select("id, name, slug, category_group").order("name"),
  ]);

  if (!contractor) notFound();

  const c = contractor as unknown as Contractor & { categories: Category; portfolio_photos: PortfolioPhoto[] };

  const { data: packages } = await supabase
    .from("contractor_packages")
    .select("*")
    .eq("contractor_id", c.id)
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href={`/dashboard/${contractorId}`} className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-4">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Edit Listing</h1>
          <p className="mt-1 text-sm text-neutral-500">{c.business_name}</p>
        </div>
        <EditListingForm
          contractor={c}
          portfolioPhotos={c.portfolio_photos}
          categories={(categories ?? []) as Pick<Category, "id" | "name" | "slug" | "category_group">[]}
          packages={(packages ?? []) as ContractorPackage[]}
          backHref={`/dashboard/${contractorId}`}
        />
      </div>
    </main>
  );
}
