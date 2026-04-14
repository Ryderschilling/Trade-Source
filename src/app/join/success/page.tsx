import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Listing Submitted",
};

interface PageProps {
  searchParams: Promise<{ slug?: string }>;
}

export default async function JoinSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-4 dark:bg-green-950/40">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Listing submitted!
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Thanks for joining Trade Source. Your listing is under review and
            will typically go live within 1 business day. We&apos;ll email you
            when it&apos;s approved.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard">
            <Button className="w-full">Go to Dashboard</Button>
          </Link>
          {params.slug && (
            <Link href={`/contractors/${params.slug}`}>
              <Button variant="outline" className="w-full">
                Preview Your Listing
              </Button>
            </Link>
          )}
          <Link href="/">
            <Button variant="ghost" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
