import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Terms of Service | ${APP_NAME}`,
  description: "Terms of Service for Trade Source.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-muted/40 border-b border-border py-12">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-3 text-muted-foreground">Last updated: April 2026</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-16">
        <div className="prose prose-neutral max-w-none space-y-10 text-muted-foreground text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Acceptance of terms</h2>
            <p>
              By accessing or using Trade Source (&ldquo;the Service&rdquo;), you agree to be bound
              by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. What Trade Source is</h2>
            <p>
              Trade Source is a local contractor directory that connects homeowners and property
              managers with tradesmen serving the 30A corridor and Northwest Florida. We are a
              directory — we do not employ contractors, guarantee their work, or act as a party to
              any transaction between a homeowner and a contractor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. User accounts</h2>
            <p>
              You must provide accurate information when creating an account. You are responsible
              for maintaining the security of your account credentials. Notify us immediately at
              hello@sourceatrade.com if you suspect unauthorized access to your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Contractor listings</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contractor listings must represent a real, active local business.</li>
              <li>Information submitted must be accurate. Misleading listings will be removed.</li>
              <li>
                Contractors are responsible for maintaining current license and insurance
                information.
              </li>
              <li>
                Trade Source reserves the right to remove or reject any listing at our discretion.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Reviews</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reviews must be based on genuine first-hand experience.</li>
              <li>Do not submit fake, incentivized, or retaliatory reviews.</li>
              <li>We reserve the right to remove reviews that violate these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Prohibited conduct</h2>
            <p>You may not:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Scrape, copy, or redistribute our contractor data</li>
              <li>Attempt to compromise the security or availability of the Service</li>
              <li>Impersonate another person or business</li>
              <li>Submit spam or unsolicited promotional content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Disclaimer of warranties</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; without warranty of any kind. Trade Source
              does not warrant that contractors listed are licensed, insured, or qualified for any
              particular job. Users are responsible for independently verifying contractor
              credentials before hiring.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Limitation of liability</h2>
            <p>
              Trade Source is not liable for any damages arising from your use of the Service or
              from interactions with contractors found through the platform. Our total liability to
              you shall not exceed the amount you paid to use the Service, if any.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Changes to these terms</h2>
            <p>
              We may update these Terms at any time. Continued use of the Service after changes
              constitutes acceptance of the updated Terms. We will note the date of last update at
              the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Contact</h2>
            <p>
              Questions about these Terms? Email us at{" "}
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
