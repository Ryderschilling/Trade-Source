"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const DISMISSED_KEY = "guest_signup_dismissed_until";
const DISMISS_DAYS = 7;
const DELAY_MS = 45_000;

const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/auth"];

export function GuestSignupModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (AUTH_PATHS.some((p) => pathname.startsWith(p))) return;

    const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  function dismiss() {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(until));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) dismiss(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <Sparkles className="h-5 w-5 text-amber-600" />
          </div>
          <DialogTitle>Get a better experience</DialogTitle>
          <DialogDescription className="space-y-1">
            Create a free account to save your searches, get personalized contractor recommendations, and message tradesmen directly.
            <span className="mt-2 block font-medium text-foreground">
              100% free — no credit card required.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-1">
          <Button asChild className="w-full">
            <a href="/signup">Create free account</a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href="/login">Sign in</a>
          </Button>
          <button
            onClick={dismiss}
            className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
