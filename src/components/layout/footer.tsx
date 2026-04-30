import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-5 sm:py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-5 sm:gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <Image src="/logo-wordmark.svg" alt={APP_NAME} width={150} height={26} />
            </Link>
            <p className="mt-2 hidden text-sm text-muted-foreground leading-relaxed sm:block sm:mt-3">
              The trusted local directory for Businesses serving the{" "}
              <a
                href="https://www.co.walton.fl.us/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:no-underline transition-colors"
              >
                30A corridor
              </a>
              {" "}— Santa Rosa Beach, Seaside, Rosemary Beach, Alys Beach, Grayton Beach,
              Seagrove, and Inlet Beach — and Northwest Florida.
            </p>

            {/* Social profile links */}
            <div className="mt-3 hidden sm:flex items-center gap-3">
              <a
                href="https://www.instagram.com/sourceatrade/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Source A Trade on Instagram"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/source-a-trade/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Source A Trade on LinkedIn"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-2 sm:text-sm sm:mb-3">For Homeowners</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground sm:space-y-2 sm:text-sm">
              <li><Link href="/contractors" className="hover:text-foreground transition-colors">Find a Pro</Link></li>
              <li><Link href="/contractors?category=roofing" className="hover:text-foreground transition-colors">Roofing</Link></li>
              <li><Link href="/contractors?category=electrical" className="hover:text-foreground transition-colors">Electrical</Link></li>
              <li><Link href="/contractors?category=plumbing" className="hover:text-foreground transition-colors">Plumbing</Link></li>
              <li><Link href="/contractors?category=hvac" className="hover:text-foreground transition-colors">HVAC</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-2 sm:text-sm sm:mb-3">For Business Owners</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground sm:space-y-2 sm:text-sm">
              <li><Link href="/join" className="hover:text-foreground transition-colors">List Your Business</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link href="/for-tradesmen" className="hover:text-foreground transition-colors">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-2 sm:text-sm sm:mb-3">Company</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground sm:space-y-2 sm:text-sm">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About Source A Trade</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-4 sm:my-8" />

        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:gap-4 sm:text-sm">
          <p>&copy; {year} {APP_NAME}. All rights reserved.</p>
          <p className="hidden sm:block">Serving 30A, Walton County &amp; Northwest Florida — Santa Rosa Beach, Seaside, Rosemary Beach, Destin &amp; beyond</p>
          <Link href="/admin" className="hover:text-foreground transition-colors">Admin</Link>
        </div>
      </div>
      <div className="border-t border-border py-4 bg-muted/30">
        <p className="text-center text-xs text-muted-foreground px-4">
          All contractors can be verified through the{" "}
          <a
            href="https://www.myfloridalicense.com/DBPR/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:no-underline"
          >
            Florida DBPR license portal
          </a>
          {" · "}
          <a
            href="https://www.co.walton.fl.us/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:no-underline"
          >
            Walton County, FL
          </a>
          {" · "}
          <a
            href="https://floridabuilding.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:no-underline"
          >
            Florida Building Commission
          </a>
          {" · "}
          <Link href="/about" className="underline underline-offset-2 hover:no-underline">
            About Source A Trade
          </Link>
          {" · "}
          <Link href="/privacy" className="underline underline-offset-2 hover:no-underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </footer>
  );
}
