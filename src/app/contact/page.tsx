import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Contact | ${APP_NAME}`,
  description: "Get in touch with the Trade Source team.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/40 border-b border-border py-12">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
          <p className="mt-3 text-muted-foreground text-lg">
            We&apos;re a small local team. We actually respond.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-16 space-y-12">

        <section>
          <p className="text-muted-foreground leading-relaxed text-base">
            Have a question, want to report an issue with a listing, or interested in partnering
            with us? Reach out directly — we&apos;re not a faceless platform.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-muted/20 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Email us</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Best for general questions, listing support, and feedback.
              </p>
              <a
                href="mailto:hello@sourceatrade.com"
                className="mt-2 inline-block text-sm text-primary hover:underline font-medium"
              >
                hello@sourceatrade.com
              </a>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Common questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-sm">How do I list my business?</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                It&apos;s free. Head to our{" "}
                <Link href="/join" className="text-primary hover:underline">
                  contractor listing page
                </Link>{" "}
                and fill out the form. We&apos;ll review your submission within 1–2 business days.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-sm">How do I report a bad listing or review?</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Email us at hello@sourceatrade.com with the business name and what you&apos;re
                reporting. We investigate every complaint.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-sm">I&apos;m a homeowner — is this free?</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Yes. Finding and contacting contractors on Trade Source is completely free for
                homeowners and property managers.
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col sm:flex-row gap-3">
          <Link href="/contractors">
            <Button className="w-full sm:w-auto">
              Browse Contractors
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/join">
            <Button variant="outline" className="w-full sm:w-auto">
              List Your Business
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
