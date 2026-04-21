import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { HardHat } from "lucide-react";

export default function ContractorNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-6">
        <HardHat className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Contractor not found
      </h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        This contractor profile doesn&apos;t exist or may have been removed.
        Browse the directory to find a trusted tradesman near you.
      </p>
      <Link href="/contractors" className={buttonVariants({ className: "mt-8" })}>Browse the directory</Link>
    </div>
  );
}
