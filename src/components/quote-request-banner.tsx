"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageSquarePlus, Loader2, CheckCircle2, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  description: z.string().min(20, "Please describe your project (at least 20 characters)"),
  timeline: z.string().min(1, "Please select a timeline"),
});

type FormValues = z.infer<typeof schema>;

interface Contractor {
  id: string;
  business_name: string;
  is_active: boolean;
}

interface Props {
  categoryId: string;
  categoryName: string;
  contractors: Contractor[];
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}

export function QuoteRequestBanner({
  categoryId,
  categoryName,
  contractors,
  defaultName,
  defaultEmail,
  defaultPhone,
}: Props) {
  const [open, setOpen] = useState(false);
  const websiteRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(contractors.map((c) => c.id))
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultName ?? "",
      email: defaultEmail ?? "",
      phone: defaultPhone ?? "",
    },
  });

  function toggleContractor(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(values: FormValues) {
    if (selected.size === 0) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          contractor_ids: Array.from(selected),
          ...values,
          website: websiteRef.current?.value ?? "",
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("idle");
      alert("Something went wrong. Please try again.");
    }
  }

  function handleClose() {
    reset({
      name: defaultName ?? "",
      email: defaultEmail ?? "",
      phone: defaultPhone ?? "",
    });
    setStatus("idle");
    setSelected(new Set(contractors.map((c) => c.id)));
    setOpen(false);
  }

  return (
    <>
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900">
            Get quotes from all {categoryName} pros at once
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Fill out one form and we&apos;ll send your project details to every contractor on this page — or pick and choose who hears from you.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0 gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          Request Quotes
        </Button>
      </div>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-background shadow-xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <DialogPrimitive.Title className="text-lg font-semibold text-neutral-900 pr-6">
                    Request quotes from {categoryName} contractors
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Close
                    onClick={handleClose}
                    className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </DialogPrimitive.Close>
                </div>

                {status === "success" ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                    <p className="text-lg font-semibold text-neutral-900">Sent!</p>
                    <p className="text-sm text-neutral-500">
                      You&apos;ll hear back from the contractors directly.
                    </p>
                    <Button variant="outline" onClick={handleClose}>
                      Dismiss
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* honeypot — invisible to users, bots will fill it */}
                    <input
                      ref={websiteRef}
                      type="text"
                      name="website"
                      tabIndex={-1}
                      aria-hidden="true"
                      autoComplete="off"
                      style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0, border: 0, padding: 0 }}
                    />
                    {/* Contractor checklist */}
                    <div>
                      <p className="text-sm font-medium text-neutral-700 mb-2">
                        Send to ({selected.size} of {contractors.length} selected)
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border border-neutral-200 p-3">
                        {contractors.map((c) => (
                          <label key={c.id} className="flex items-center gap-2.5 cursor-pointer">
                            <Checkbox
                              checked={selected.has(c.id)}
                              onCheckedChange={() => toggleContractor(c.id)}
                            />
                            <span className="text-sm text-neutral-800">{c.business_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                      <Label htmlFor="qr-name">Your name</Label>
                      <Input id="qr-name" {...register("name")} placeholder="Jane Smith" />
                      {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <Label htmlFor="qr-email">Email</Label>
                      <Input id="qr-email" type="email" {...register("email")} placeholder="jane@example.com" />
                      {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <Label htmlFor="qr-phone">Phone <span className="text-neutral-400">(optional)</span></Label>
                      <Input id="qr-phone" type="tel" {...register("phone")} placeholder="(850) 555-0100" />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <Label htmlFor="qr-desc">Project description</Label>
                      <Textarea
                        id="qr-desc"
                        {...register("description")}
                        rows={4}
                        placeholder="Describe your project — what needs to be done, any relevant details..."
                      />
                      {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                    </div>

                    {/* Timeline */}
                    <div className="space-y-1">
                      <Label>Timeline</Label>
                      <Select onValueChange={(v) => setValue("timeline", v as string, { shouldValidate: true })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a timeline..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asap">ASAP</SelectItem>
                          <SelectItem value="within-1-month">Within 1 month</SelectItem>
                          <SelectItem value="1-3-months">1–3 months</SelectItem>
                          <SelectItem value="just-planning">Just planning</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.timeline && <p className="text-xs text-red-500">{errors.timeline.message}</p>}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={status === "loading" || selected.size === 0}
                    >
                      {status === "loading" ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                      ) : (
                        `Send to ${selected.size} contractor${selected.size !== 1 ? "s" : ""}`
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
