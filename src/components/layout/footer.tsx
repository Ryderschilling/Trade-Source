import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                TS
              </div>
              <span className="font-semibold">{APP_NAME}</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              The trusted local directory for tradesmen serving the 30A corridor
              and Northwest Florida.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">For Homeowners</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/contractors" className="hover:text-foreground transition-colors">Find a Pro</Link></li>
              <li><Link href="/contractors?category=roofing" className="hover:text-foreground transition-colors">Roofing</Link></li>
              <li><Link href="/contractors?category=electrical" className="hover:text-foreground transition-colors">Electrical</Link></li>
              <li><Link href="/contractors?category=plumbing" className="hover:text-foreground transition-colors">Plumbing</Link></li>
              <li><Link href="/contractors?category=hvac" className="hover:text-foreground transition-colors">HVAC</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">For Tradesmen</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/join" className="hover:text-foreground transition-colors">List Your Business</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Contractor Dashboard</Link></li>
              <li><Link href="/for-tradesmen" className="hover:text-foreground transition-colors">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {year} {APP_NAME}. All rights reserved.</p>
          <p>Serving the 30A corridor &amp; Northwest Florida</p>
        </div>
      </div>
    </footer>
  );
}
