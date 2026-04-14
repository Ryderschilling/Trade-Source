"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { joinAsContractor, type JoinFormState } from "@/app/actions/contractors";
import { SERVICE_AREAS } from "@/lib/constants";
import type { Category } from "@/lib/supabase/types";

const initialState: JoinFormState = {};

interface JoinFormProps {
  categories: Pick<Category, "id" | "name" | "slug">[];
  userEmail?: string;
}

export function JoinForm({ categories, userEmail }: JoinFormProps) {
  const [state, action, pending] = useActionState(joinAsContractor, initialState);

  return (
    <form action={action} className="space-y-8">
      {state.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Business Info */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Business Information</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tell homeowners about your business.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="business_name">Business name *</Label>
            <Input
              id="business_name"
              name="business_name"
              placeholder="Smith Roofing LLC"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="owner_name">Owner name</Label>
            <Input
              id="owner_name"
              name="owner_name"
              placeholder="John Smith"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category_id">Trade / Category *</Label>
          <Select name="category_id" required>
            <SelectTrigger id="category_id">
              <SelectValue placeholder="Select your trade..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            name="tagline"
            placeholder="e.g. 30A's most trusted roofer since 2005"
            maxLength={120}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">About your business</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe your services, specialties, and what makes you different..."
            rows={5}
            maxLength={2000}
          />
        </div>
      </section>

      <Separator />

      {/* Contact */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Contact Details</h2>
          <p className="text-sm text-muted-foreground mt-1">
            How homeowners will reach you.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(850) 555-0100"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Business email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={userEmail}
              placeholder="info@yourcompany.com"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            placeholder="https://yourwebsite.com"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              placeholder="123 Main St"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" name="zip" placeholder="32461" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              name="city"
              defaultValue="Santa Rosa Beach"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" defaultValue="FL" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="service_areas">Service areas</Label>
          <p className="text-xs text-muted-foreground">
            Comma-separated list of areas you serve (e.g. 30A, Destin, Panama City Beach)
          </p>
          <Input
            id="service_areas"
            name="service_areas"
            placeholder="30A, Rosemary Beach, WaterColor, Seaside, Destin"
          />
          <p className="text-xs text-muted-foreground">
            Common areas: {SERVICE_AREAS.slice(0, 5).join(", ")}...
          </p>
        </div>
      </section>

      <Separator />

      {/* Credentials */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Credentials</h2>
          <p className="text-sm text-muted-foreground mt-1">
            These build trust with homeowners.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox id="is_licensed" name="is_licensed" />
            <div>
              <p className="text-sm font-medium group-hover:text-foreground">
                Licensed
              </p>
              <p className="text-xs text-muted-foreground">
                My business holds a valid contractor&apos;s license
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox id="is_insured" name="is_insured" />
            <div>
              <p className="text-sm font-medium group-hover:text-foreground">
                Insured
              </p>
              <p className="text-xs text-muted-foreground">
                My business carries general liability insurance
              </p>
            </div>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="license_number">License number</Label>
            <Input
              id="license_number"
              name="license_number"
              placeholder="CGC1234567"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="years_in_business">Years in business</Label>
            <Input
              id="years_in_business"
              name="years_in_business"
              type="number"
              min={0}
              max={100}
              placeholder="5"
            />
          </div>
        </div>
      </section>

      <Separator />

      {!userEmail && (
        <p className="text-sm text-muted-foreground rounded-md bg-muted px-4 py-3">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Create one
          </Link>{" "}
          to claim your listing and manage leads from a dashboard. You can also
          submit without an account and claim it later.
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Submitting..." : "Submit Your Listing"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By submitting you agree to our{" "}
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>
        . Listings are reviewed before going live (usually within 1 business day).
      </p>
    </form>
  );
}
