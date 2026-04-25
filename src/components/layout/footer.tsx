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
              The trusted local directory for tradesmen serving the 30A corridor
              and Northwest Florida.
            </p>
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
            <h3 className="text-xs font-semibold mb-2 sm:text-sm sm:mb-3">For Tradesmen</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground sm:space-y-2 sm:text-sm">
              <li><Link href="/join" className="hover:text-foreground transition-colors">List Your Business</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link href="/for-tradesmen" className="hover:text-foreground transition-colors">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-2 sm:text-sm sm:mb-3">Company</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground sm:space-y-2 sm:text-sm">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-4 sm:my-8" />

        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:gap-4 sm:text-sm">
          <p>&copy; {year} {APP_NAME}. All rights reserved.</p>
          <p className="hidden sm:block">Serving the 30A corridor &amp; Northwest Florida</p>
          <Link href="/admin" className="hover:text-foreground transition-colors">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
