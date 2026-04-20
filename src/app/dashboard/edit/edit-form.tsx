"use client";

import { useActionState, useState, useRef, useTransition, type ChangeEvent } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { X, Building2, CheckCircle, Trash2 } from "lucide-react";
import { updateContractor, deleteContractor, type EditListingFormState } from "@/app/actions/contractors";
import { SERVICE_AREAS } from "@/lib/constants";
import type { Category, Contractor, PortfolioPhoto } from "@/lib/supabase/types";

// ─── Image optimisation (mirrors join-form logic) ────────────────────────────

const CLIENT_MAX_LOGO_BYTES = 5 * 1024 * 1024;
const CLIENT_MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const CLIENT_MAX_PHOTO_COUNT = 8;
const CLIENT_LOGO_MAX_DIMENSION = 1600;
const CLIENT_PHOTO_MAX_DIMENSION = 2200;

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Couldn't read ${file.name}.`)); };
    img.src = url;
  });
}

function getResizedDimensions(w: number, h: number, max: number) {
  const largest = Math.max(w, h);
  if (largest <= max) return { width: w, height: h };
  const scale = max / largest;
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Image compression failed.")),
      type,
      quality
    );
  });
}

async function optimizeRasterImage(file: File, { maxBytes, maxDimension }: { maxBytes: number; maxDimension: number }) {
  let img: HTMLImageElement;
  try {
    img = await loadImageFromFile(file);
  } catch {
    if (file.size <= maxBytes) return file;
    throw new Error(`${file.name} can't be compressed. Please export it as JPEG or PNG.`);
  }

  let { width, height } = getResizedDimensions(img.naturalWidth || img.width, img.naturalHeight || img.height, maxDimension);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not prepare this image for upload.");

  const preferredType = file.type === "image/png" ? "image/webp" : file.type || "image/webp";

  for (let attempt = 0; attempt < 5; attempt++) {
    canvas.width = width; canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    for (const quality of [0.86, 0.78, 0.7, 0.62]) {
      const blob = await canvasToBlob(canvas, preferredType, quality);
      if (blob.size <= maxBytes) {
        const ext = preferredType === "image/png" ? "png" : preferredType === "image/jpeg" ? "jpg" : "webp";
        const base = file.name.replace(/\.[^.]+$/, "");
        return new File([blob], `${base}.${ext}`, { type: preferredType, lastModified: Date.now() });
      }
    }
    width = Math.max(1, Math.round(width * 0.85));
    height = Math.max(1, Math.round(height * 0.85));
  }
  throw new Error(`${file.name} is still too large after compression. Please choose a smaller image.`);
}

function setInputFiles(input: HTMLInputElement, files: File[]) {
  const dt = new DataTransfer();
  for (const f of files) dt.items.add(f);
  input.files = dt.files;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EditFormProps {
  contractor: Contractor & { categories: Category };
  portfolioPhotos: PortfolioPhoto[];
  categories: Pick<Category, "id" | "name" | "slug">[];
}

const initialState: EditListingFormState = {};

export function EditListingForm({ contractor, portfolioPhotos, categories }: EditFormProps) {
  const [state, action, pending] = useActionState(updateContractor, initialState);
  const [deletepending, startDelete] = useTransition();

  function handleDeleteListing() {
    if (!confirm("Are you sure you want to permanently delete this listing? This cannot be undone.")) return;
    startDelete(() => deleteContractor(contractor.id));
  }

  // Photo deletion state
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const visiblePhotos = portfolioPhotos.filter((p) => !deletedIds.has(p.id));

  function markDeleted(id: string) {
    setDeletedIds((prev) => new Set([...prev, id]));
  }

  // Image optimisation state
  const [clientError, setClientError] = useState<string | null>(null);
  const [logoStatus, setLogoStatus] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    setClientError(null); setLogoStatus(null);
    if (!file) return;
    if (file.type === "image/svg+xml") {
      if (file.size > CLIENT_MAX_LOGO_BYTES) { setClientError("SVG logos must be 5MB or smaller."); input.value = ""; return; }
      setLogoStatus(`Logo ready: ${file.name} (${formatBytes(file.size)})`);
      return;
    }
    setPreparing(true);
    try {
      const opt = await optimizeRasterImage(file, { maxBytes: CLIENT_MAX_LOGO_BYTES, maxDimension: CLIENT_LOGO_MAX_DIMENSION });
      setInputFiles(input, [opt]);
      setLogoStatus(opt.size < file.size
        ? `Logo optimized: ${formatBytes(file.size)} → ${formatBytes(opt.size)}`
        : `Logo ready: ${opt.name} (${formatBytes(opt.size)})`
      );
    } catch (err) {
      input.value = "";
      setClientError(err instanceof Error ? err.message : "Couldn't prepare the logo.");
    } finally {
      setPreparing(false);
    }
  }

  async function handlePhotosChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const files = Array.from(input.files ?? []);
    setClientError(null); setPhotoStatus(null);
    if (!files.length) return;
    if (files.length > CLIENT_MAX_PHOTO_COUNT) {
      setClientError(`You can upload up to ${CLIENT_MAX_PHOTO_COUNT} photos at a time.`);
      input.value = ""; return;
    }
    setPreparing(true);
    try {
      const optimized = await Promise.all(
        files.map((f) => optimizeRasterImage(f, { maxBytes: CLIENT_MAX_PHOTO_BYTES, maxDimension: CLIENT_PHOTO_MAX_DIMENSION }))
      );
      setInputFiles(input, optimized);
      const origBytes = files.reduce((t, f) => t + f.size, 0);
      const optBytes = optimized.reduce((t, f) => t + f.size, 0);
      setPhotoStatus(optBytes < origBytes
        ? `${optimized.length} photo${optimized.length > 1 ? "s" : ""} optimized: ${formatBytes(origBytes)} → ${formatBytes(optBytes)}`
        : `${optimized.length} photo${optimized.length > 1 ? "s" : ""} ready (${formatBytes(optBytes)} total)`
      );
    } catch (err) {
      input.value = "";
      setClientError(err instanceof Error ? err.message : "Couldn't prepare the photos.");
    } finally {
      setPreparing(false);
    }
  }

  return (
    <form action={action} className="space-y-8">
      {/* Hidden fields */}
      <input type="hidden" name="contractor_id" value={contractor.id} />
      <input type="hidden" name="deleted_photo_ids" value={[...deletedIds].join(",")} />

      {/* Error / success banners */}
      {clientError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {clientError}
        </div>
      )}
      {state.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Listing updated successfully. <Link href="/dashboard" className="font-medium underline underline-offset-4">Back to dashboard</Link></span>
        </div>
      )}

      {/* ── Business Information ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Business Information</h2>
          <p className="text-sm text-muted-foreground mt-1">Your public-facing business details.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="business_name">Business name *</Label>
            <Input id="business_name" name="business_name" defaultValue={contractor.business_name} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner_name">Owner name</Label>
            <Input id="owner_name" name="owner_name" defaultValue={contractor.owner_name ?? ""} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category_id">Trade / Category *</Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={contractor.category_id}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" name="tagline" defaultValue={contractor.tagline ?? ""} maxLength={120} placeholder="e.g. 30A's most trusted roofer since 2005" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">About your business</Label>
          <Textarea id="description" name="description" defaultValue={contractor.description ?? ""} rows={5} maxLength={2000} placeholder="Describe your services, specialties, and what makes you different..." />
        </div>
      </section>

      <Separator />

      {/* ── Contact Details ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Contact Details</h2>
          <p className="text-sm text-muted-foreground mt-1">How homeowners will reach you.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={contractor.phone ?? ""} placeholder="(850) 555-0100" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Business email *</Label>
            <Input id="email" name="email" type="email" defaultValue={contractor.email ?? ""} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" type="url" defaultValue={contractor.website ?? ""} placeholder="https://yourwebsite.com" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={contractor.address ?? ""} placeholder="123 Main St" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" name="zip" defaultValue={contractor.zip ?? ""} placeholder="32461" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="city">City *</Label>
            <Input id="city" name="city" defaultValue={contractor.city} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" defaultValue={contractor.state} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="service_areas">Service areas</Label>
          <p className="text-xs text-muted-foreground">Comma-separated areas you serve</p>
          <Input
            id="service_areas"
            name="service_areas"
            defaultValue={contractor.service_areas?.join(", ") ?? ""}
            placeholder="30A, Rosemary Beach, WaterColor, Seaside, Destin"
          />
                 </div>
      </section>

      <Separator />

      {/* ── Branding & Photos ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Branding & Photos</h2>
          <p className="text-sm text-muted-foreground mt-1">Your logo and portfolio photos.</p>
        </div>

        {/* Logo */}
        <div className="space-y-3">
          <Label>Logo</Label>
          <div className="flex items-center gap-4">
            {contractor.logo_url ? (
              <img src={contractor.logo_url} alt="Current logo" className="h-16 w-16 rounded-lg object-cover border border-neutral-200" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50">
                <Building2 className="h-6 w-6 text-neutral-400" />
              </div>
            )}
            <div className="flex-1 space-y-1.5">
              <Input
                ref={logoRef}
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={preparing}
              />
              <p className="text-xs text-muted-foreground">
                {contractor.logo_url ? "Upload a new image to replace your current logo." : "Optional. Any image format up to 5MB."}
              </p>
              {logoStatus && <p className="text-xs text-emerald-700">{logoStatus}</p>}
            </div>
          </div>
        </div>

        {/* Existing portfolio photos */}
        {portfolioPhotos.length > 0 && (
          <div className="space-y-3">
            <Label>Current Portfolio Photos</Label>
            <p className="text-xs text-muted-foreground">Click the × to remove a photo.</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {visiblePhotos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden bg-neutral-100">
                  <NextImage src={photo.url} alt={photo.caption ?? "Portfolio photo"} fill className="object-cover" sizes="(max-width: 640px) 33vw, 25vw" />
                  <button
                    type="button"
                    onClick={() => markDeleted(photo.id)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {deletedIds.size > 0 && (
                <p className="col-span-full text-xs text-amber-600">
                  {deletedIds.size} photo{deletedIds.size > 1 ? "s" : ""} will be removed on save.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Add new photos */}
        <div className="space-y-1.5">
          <Label htmlFor="photos">Add Photos</Label>
          <Input
            ref={photosRef}
            id="photos"
            name="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotosChange}
            disabled={preparing}
          />
          <p className="text-xs text-muted-foreground">
            Upload up to {CLIENT_MAX_PHOTO_COUNT} photos, 10MB each. Images are automatically optimized.
          </p>
          {photoStatus && <p className="text-xs text-emerald-700">{photoStatus}</p>}
        </div>
      </section>

      <Separator />

      {/* ── Credentials ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Credentials</h2>
          <p className="text-sm text-muted-foreground mt-1">These build trust with homeowners.</p>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox id="is_licensed" name="is_licensed" defaultChecked={contractor.is_licensed} />
            <div>
              <p className="text-sm font-medium">Licensed</p>
              <p className="text-xs text-muted-foreground">My business holds a valid contractor&apos;s license</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox id="is_insured" name="is_insured" defaultChecked={contractor.is_insured} />
            <div>
              <p className="text-sm font-medium">Insured</p>
              <p className="text-xs text-muted-foreground">My business carries general liability insurance</p>
            </div>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="license_number">License number</Label>
            <Input id="license_number" name="license_number" defaultValue={contractor.license_number ?? ""} placeholder="CGC1234567" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="years_in_business">Years in business</Label>
            <Input id="years_in_business" name="years_in_business" type="number" min={0} max={100} defaultValue={contractor.years_in_business ?? ""} placeholder="2" />
            <p className="text-xs text-muted-foreground">Since officially founded</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="years_experience">Years of experience</Label>
            <Input id="years_experience" name="years_experience" type="number" min={0} max={100} defaultValue={contractor.years_experience ?? ""} placeholder="10" />
            <p className="text-xs text-muted-foreground">Your total hands-on experience</p>
          </div>
        </div>
      </section>

      <Separator />

      {preparing && <p className="text-sm text-muted-foreground">Preparing images for upload...</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || preparing || deletepending} className="flex-1 sm:flex-none sm:min-w-36">
          {preparing ? "Preparing..." : pending ? "Saving..." : "Save Changes"}
        </Button>
        <Link href="/dashboard">
          <Button type="button" variant="outline" disabled={pending || preparing || deletepending}>Cancel</Button>
        </Link>
        <Button
          type="button"
          variant="destructive"
          disabled={pending || preparing || deletepending}
          onClick={handleDeleteListing}
          className="gap-2 sm:ml-auto"
        >
          <Trash2 className="w-4 h-4" />
          {deletepending ? "Deleting..." : "Delete Listing"}
        </Button>
      </div>
    </form>
  );
}
