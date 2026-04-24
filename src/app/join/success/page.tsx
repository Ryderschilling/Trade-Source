import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Listing Submitted",
};

interface PageProps {
  searchParams: Promise<{ slug?: string; paid?: string; canceled?: string }>;
}

export default async function JoinSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isPaid = params.paid === "1";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className={`rounded-full p-4 ${isPaid ? "bg-green-100 dark:bg-green-950/40" : "bg-yellow-100 dark:bg-yellow-950/40"}`}>
            {isPaid
              ? <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              : <Clock className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
            }
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isPaid ? "You're live!" : "Your listing is saved!"}
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {isPaid
              ? "Payment confirmed. Your listing is now active on Source A Trade. Welcome to the directory."
              : "Your business profile is ready. Go to your dashboard to complete payment and start receiving leads."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {!isPaid && params.slug && (
            <Link href={`/join/cancel?slug=${params.slug}`}>
              <Button className="w-full">Complete Payment</Button>
            </Link>
          )}
          <Link href="/dashboard">
            <Button
              className="w-full"
              variant={isPaid ? "default" : "outline"}
            >
              Go to Dashboard
            </Button>
          </Link>
          {params.slug && isPaid && (
            <Link href={`/contractors/${params.slug}`}>
              <Button variant="outline" className="w-full">
                View Your Listing
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
