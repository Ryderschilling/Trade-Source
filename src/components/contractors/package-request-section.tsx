"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitPackageRequest } from "@/app/actions/leads";
import type { ContractorPackage } from "@/lib/supabase/types";

interface Props {
  packages: ContractorPackage[];
  contractorId: string;
  userEmail: string | null;
  userPhone: string | null;
  userName: string | null;
  userAddress: string | null;
  isOwner?: boolean;
}

export function PackageRequestSection({ packages, contractorId, userEmail, userPhone, userName, userAddress, isOwner }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState(userName ?? "");
  const [email, setEmail] = useState(userEmail ?? "");
  const [address, setAddress] = useState(userAddress ?? "");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState(userPhone ?? "");
  const [pending, startTransition] = useTransition();
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function toggleForm(id: string) {
    if (openId === id) {
      setOpenId(null);
    } else {
      setOpenId(id);
      setName(userName ?? "");
      setEmail(userEmail ?? "");
      setAddress(userAddress ?? "");
      setMessage("");
      setPhone(userPhone ?? "");
      setError(null);
    }
  }

  function handleSubmit(pkg: ContractorPackage) {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("A valid email address is required.");
      return;
    }
    if (!address.trim()) {
      setError("Address is required.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Please describe your project (at least 10 characters).");
      return;
    }
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("contractor_id", contractorId);
      formData.set("package_name", pkg.name);
      formData.set("name", name.trim());
      formData.set("email", email.trim());
      formData.set("address", address.trim());
      formData.set("message", message.trim());
      if (phone.trim()) formData.set("phone", phone.trim());

      const result = await submitPackageRequest({ success: false }, formData);
      if (result.success) {
        setSuccessIds((prev) => new Set([...prev, pkg.id]));
        setOpenId(null);
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Services &amp; Packages</h2>
      <div className="space-y-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="rounded-xl border border-border p-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{pkg.name}</h3>
                {pkg.description && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{pkg.description}</p>
                )}
                {pkg.price_label && (
                  <p className="text-sm font-medium mt-2">{pkg.price_label}</p>
                )}
              </div>
              <div className="shrink-0">
                {isOwner ? (
                  <span className="text-sm text-muted-foreground">Visible to homeowners only</span>
                ) : successIds.has(pkg.id) ? (
                  <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Request sent!
                  </div>
                ) : userEmail ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={openId === pkg.id ? "outline" : "default"}
                    onClick={() => toggleForm(pkg.id)}
                    disabled={pending}
                  >
                    {openId === pkg.id ? "Cancel" : "Request This Package"}
                  </Button>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                  >
                    Request This Package
                  </Link>
                )}
              </div>
            </div>

            {openId === pkg.id && userEmail && (
              <div className="mt-4 border-t border-border pt-4 space-y-3">
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor={`name-${pkg.id}`}>Name *</Label>
                  <Input
                    id={`name-${pkg.id}`}
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`email-${pkg.id}`}>Email *</Label>
                  <Input
                    id={`email-${pkg.id}`}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`address-${pkg.id}`}>Address *</Label>
                  <Input
                    id={`address-${pkg.id}`}
                    type="text"
                    placeholder="123 Main St, City, State"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`msg-${pkg.id}`}>Message *</Label>
                  <Textarea
                    id={`msg-${pkg.id}`}
                    rows={3}
                    placeholder="Describe your project or ask a question..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`phone-${pkg.id}`}>Phone (optional)</Label>
                  <Input
                    id={`phone-${pkg.id}`}
                    type="tel"
                    placeholder="(850) 555-0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={pending}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSubmit(pkg)}
                  disabled={pending}
                >
                  {pending ? "Sending..." : "Send Request"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
