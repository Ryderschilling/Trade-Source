import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Privacy Policy | ${APP_NAME}`,
  description: "Privacy Policy for Trade Source.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-muted/40 border-b border-border py-12">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-3 text-muted-foreground">Last updated: April 2026</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-16">
        <div className="prose prose-neutral max-w-none space-y-10 text-muted-foreground text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Who we are</h2>
            <p>
              Trade Source (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the
              website sourceatrade.com, a local contractor directory serving the 30A corridor and
              Northwest Florida. We take your privacy seriously and are committed to being transparent
              about how we collect and use data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Information we collect</h2>
            <p className="mb-3">We collect information in the following ways:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Account registration:</strong> When you create
                an account, we collect your name and email address.
              </li>
              <li>
                <strong className="text-foreground">Contractor listings:</strong> When you submit a
                business listing, we collect your business name, trade category, contact information,
                service area, and any photos or descriptions you provide.
              </li>
              <li>
                <strong className="text-foreground">Reviews:</strong> When you submit a review, we
                associate it with your registered account.
              </li>
              <li>
                <strong className="text-foreground">Usage data:</strong> We collect standard web
                analytics data (pages visited, time on site, referring URLs) to understand how the
                site is used.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. How we use your information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To operate and maintain the Trade Source directory</li>
              <li>To display contractor listings and reviews to users</li>
              <li>To facilitate contact between homeowners and contractors</li>
              <li>To send transactional emails (account confirmations, listing approvals)</li>
              <li>To improve the platform based on how it is used</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information to third parties. We do not share your data
              with advertising networks.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Data storage</h2>
            <p>
              Your data is stored securely using Supabase, a cloud database platform. Data is stored
              in the United States. We use industry-standard security practices to protect your
              information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Cookies</h2>
            <p>
              We use session cookies required for authentication. We do not use advertising or
              tracking cookies. You can disable cookies in your browser settings, though this may
              affect the functionality of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Your rights</h2>
            <p>
              You may request deletion of your account and associated data at any time by emailing
              us at hello@sourceatrade.com. We will process deletion requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Contact</h2>
            <p>
              If you have questions about this policy, contact us at{" "}
              <a href="mailto:support@sourceatrade.com" className="text-primary hover:underline">
                support@sourceatrade.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
