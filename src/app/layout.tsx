import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { IntroAnimation } from "@/components/intro-animation";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME, APP_TAGLINE, APP_URL } from "@/lib/constants";
import { headers } from "next/headers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Find trusted local tradesmen and contractors serving the 30A corridor and Northwest Florida. Roofing, electrical, plumbing, HVAC, landscaping, and more.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/admin");

  // Admin pages manage their own full-screen layout — skip Navbar, Footer, and
  // the intro animation entirely so nothing bleeds through behind the overlay.
  if (isAdmin) {
    return (
      <html
        lang="en"
        suppressHydrationWarning
        className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="h-full bg-neutral-100 text-foreground">
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    );
  }

  let userEmail: string | null = null;
  let userId: string | null = null;
  let hasBusiness = false;
  let unreadCount = 0;
  let navNotifications: Array<{ id: string; title: string; body: string | null; link: string | null; read: boolean; created_at: string }> = [];

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userEmail = user?.email ?? null;
      userId = user?.id ?? null;
      if (userId) {
        const [{ data: contractorData }, { data: unread }, { data: notifs }] = await Promise.all([
          supabase.from("contractors").select("id").eq("user_id", userId).limit(1),
          supabase.from("notifications").select("id").eq("user_id", userId).eq("read", false),
          supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
        ]);
        hasBusiness = Array.isArray(contractorData) && contractorData.length > 0;
        unreadCount = (unread ?? []).length;
        navNotifications = notifs ?? [];
      }
    } catch {
      // Keep public pages renderable even if auth is misconfigured in production.
    }
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <IntroAnimation>
            <Navbar userEmail={userEmail} userId={userId} hasBusiness={hasBusiness} unreadCount={unreadCount} notifications={navNotifications} />
            <main className="flex-1">{children}</main>
            <Footer />
          </IntroAnimation>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
