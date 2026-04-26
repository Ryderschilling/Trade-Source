"use client";

import { useEffect, useState, useActionState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { saveAddress } from "@/app/actions/profile";

const DISMISSED_KEY = "address_prompt_dismissed";

export function AddressPromptModal({ hasAddress }: { hasAddress: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveAddress, {});

  useEffect(() => {
    if (hasAddress) return;
    if (typeof window !== "undefined" && localStorage.getItem(DISMISSED_KEY)) return;
    const timer = setTimeout(() => setOpen(true), 60_000);
    return () => clearTimeout(timer);
  }, [hasAddress]);

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  function dismiss() {
    if (typeof window !== "undefined") localStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => { if (!isOpen) dismiss(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
            <MapPin className="h-5 w-5 text-neutral-700" />
          </div>
          <DialogTitle>Get local recommendations</DialogTitle>
          <DialogDescription>
            Add your home address to receive personalized suggestions for the best local tradesmen near you. Your address is kept private and only used to improve your results.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="address">Home address</Label>
            <Input
              id="address"
              name="address"
              placeholder="123 Main St, Santa Rosa Beach, FL"
              autoComplete="street-address"
              required
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={dismiss} disabled={pending}>
              Not now
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Add my address"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
