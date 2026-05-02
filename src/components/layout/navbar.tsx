"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown, User, LayoutDashboard, LogOut, Building2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME, NAV_LINKS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/dashboard/notification-bell";

interface NavNotification {
  id: string;
  user_id: string;
  type: string | null;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

interface NavbarProps {
  userEmail?: string | null;
  userId?: string | null;
  hasBusiness?: boolean;
  unreadCount?: number;
  unreadMessages?: number;
  notifications?: NavNotification[];
}

function AvatarInitials({ email }: { email: string }) {
  const letter = email[0]?.toUpperCase() ?? "?";
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
      {letter}
    </div>
  );
}

function UserMenu({ userEmail, userId, hasBusiness, unreadMessages, onSignOut }: { userEmail: string; userId: string | null | undefined; hasBusiness: boolean; unreadMessages: number; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 hover:ring-primary/30 transition-all"
        aria-label="User menu"
        aria-expanded={open}
      >
        <AvatarInitials email={userEmail} />
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-lg border border-border bg-background shadow-md py-1 z-50">
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          {hasBusiness && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              Business Dashboard
            </Link>
          )}
          {userId && (
            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Messages
              {unreadMessages > 0 && (
                <span className="ml-auto h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </Link>
          )}
          {userId && (
            <Link
              href={`/profile/${userId}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              My Profile
            </Link>
          )}
          {!hasBusiness && (
            <Link
              href="/join"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <Building2 className="h-4 w-4 text-muted-foreground" />
              List Your Business
            </Link>
          )}
          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar({ userEmail, userId, hasBusiness = false, unreadCount = 0, unreadMessages = 0, notifications = [] }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image src="/logo-wordmark.svg" alt="Source A Trade" width={175} height={30} priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.filter((link) => {
            if (link.href === "/how-it-works" && userEmail) return false;
            if (link.href === "/join" && hasBusiness) return false;
            return true;
          }).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground",
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          {userEmail ? (
            <>
              <NotificationBell userId={userId!} initialCount={unreadCount} initialNotifications={notifications} />
              {userId && (
                <Link
                  href="/messages"
                  className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent transition-colors"
                  aria-label="Messages"
                >
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </Link>
              )}
              <UserMenu userEmail={userEmail} userId={userId} hasBusiness={hasBusiness} unreadMessages={unreadMessages} onSignOut={handleSignOut} />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Sign Up
                </Button>
              </Link>
              <Link href="/join">
                <Button size="sm">List Your Business</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: sign up button (unauthenticated only) + menu toggle */}
        <div className="md:hidden flex items-center gap-2">
          {!userEmail && (
            <Link href="/signup">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Sign Up
              </Button>
            </Link>
          )}
          <button
            className="p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.filter((link) => {
              if (link.href === "/how-it-works" && userEmail) return false;
              if (link.href === "/join" && hasBusiness) return false;
              return true;
            }).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                  pathname === link.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-border">
              {userEmail ? (
                <>
                  {hasBusiness && (
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Business Dashboard
                      </Button>
                    </Link>
                  )}
                  {userId && (
                    <Link href="/messages" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Messages
                        {unreadMessages > 0 && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </Button>
                    </Link>
                  )}
                  {userId && (
                    <Link href={`/profile/${userId}`} onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <User className="mr-2 h-4 w-4" />
                        My Profile
                      </Button>
                    </Link>
                  )}
                  {!hasBusiness && (
                    <Link href="/join" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Building2 className="mr-2 h-4 w-4" />
                        List Your Business
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Sign Up
                    </Button>
                  </Link>
                  <Link href="/join" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full">
                      List Your Business
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
