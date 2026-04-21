"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  description: z.string().min(20, "Please describe your project (at least 20 characters)"),
  timeline: z.string().min(1, "Please select a timeline"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  contractorId: string;
  categoryId: string;
  businessName: string;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}

export function QuoteRequestForm({
  contractorId,
  categoryId,
  businessName,
  defaultName,
  defaultEmail,
  defaultPhone,
}: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const referralSourceRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultName ?? "",
      email: defaultEmail ?? "",
      phone: defaultPhone ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setStatus("loading");
    try {
      const res = await fetch("/api/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          contractor_ids: [contractorId],
          ...values,
          referral_source: referralSourceRef.current?.value ?? "",
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("idle");
      alert("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <p className="font-semibold text-neutral-900">Request sent!</p>
        <p className="text-sm text-neutral-500">
          {businessName} will be in touch with you soon.
        </p>
        <Button variant="outline" size="sm" onClick={() => { reset(); setStatus("idle"); }}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* honeypot — invisible to users, bots will fill it */}
      <input
        ref={referralSourceRef}
        type="text"
        name="referral_source"
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0, border: 0, padding: 0 }}
      />
      <div className="space-y-1.5">
        <Label htmlFor="qrf-name">Your name *</Label>
        <Input id="qrf-name" {...register("name")} placeholder="Jane Smith" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="qrf-email">Email *</Label>
        <Input id="qrf-email" type="email" {...register("email")} placeholder="jane@example.com" />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="qrf-phone">Phone</Label>
        <Input id="qrf-phone" type="tel" {...register("phone")} placeholder="(850) 555-0100" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="qrf-desc">Project description *</Label>
        <Textarea
          id="qrf-desc"
          {...register("description")}
          rows={4}
          placeholder="Describe your project — what needs to be done, any relevant details..."
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Timeline *</Label>
        <Select onValueChange={(v) => setValue("timeline", (v as string | null) ?? "", { shouldValidate: true })}>
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
        {errors.timeline && <p className="text-xs text-destructive">{errors.timeline.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
        ) : (
          "Send Request"
        )}
      </Button>
    </form>
  );
}
