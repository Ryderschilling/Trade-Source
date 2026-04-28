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
import { X, Building2, CheckCircle, Trash2, Plus, ChevronDown } from "lucide-react";
import { updateContractor, deleteContractor, type EditListingFormState } from "@/app/actions/contractors";
import { savePackages } from "@/app/actions/packages";
import { SERVICE_AREAS } from "@/lib/constants";
import type { Category, Contractor, ContractorPackage, PortfolioPhoto } from "@/lib/supabase/types";

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

// ─── Category picker ──────────────────────────────────────────────────────────

const CATEGORY_GROUPS = [
  { id: "exterior-structure",    name: "Exterior & Structure",   slugs: ["roofing","siding","windows-doors","gutters","painting-exterior","pressure-washing","driveway-paving","foundation-structural","stucco"] },
  { id: "mechanical-systems",    name: "Mechanical Systems",     slugs: ["plumbing","hvac","electrical","solar","generator","water-treatment","gas-lines"] },
  { id: "interior-remodel",      name: "Interior & Remodel",     slugs: ["painting-interior","flooring","drywall","insulation","carpentry-trim","cabinetry-countertops","tile-stone","kitchen-remodel","bathroom-remodel"] },
  { id: "outdoor-landscape",     name: "Outdoor & Landscape",    slugs: ["landscaping","lawn-care","irrigation","tree-service","pool-spa","outdoor-lighting","fencing","decks-patios","outdoor-kitchen"] },
  { id: "coastal-marine",        name: "Coastal & Marine",       slugs: ["dock-boathouse","seawall-bulkhead","hurricane-shutters","flood-mitigation"] },
  { id: "property-services",     name: "Property Services",      slugs: ["property-management","home-watch","pest-control","security-systems","locksmith","handyman","junk-removal","house-cleaning"] },
  { id: "vacation-rentals",      name: "Vacation Rentals",       slugs: ["rental-management","turnover-cleaning","linen-service","rental-photography","staging-rentals"] },
  { id: "automotive",            name: "Automotive",             slugs: ["auto-repair","auto-body-paint","oil-change","tire-shop","car-detailing","towing","golf-cart-repair"] },
  { id: "health-wellness",       name: "Health & Wellness",      slugs: ["chiropractor","massage-therapy","physical-therapy","dentist","med-spa","personal-training"] },
  { id: "professional-services", name: "Professional Services",  slugs: ["real-estate-agent","insurance-agent","financial-advisor","attorney","cpa-tax"] },
  { id: "real-estate-property",  name: "Real Estate & Property", slugs: ["real-estate-agent","real-estate-brokerage","property-management","home-inspector","title-escrow","mortgage-lending","real-estate-appraiser"] },
  { id: "legal-financial",       name: "Legal & Financial",      slugs: ["real-estate-attorney","estate-planning","business-attorney","cpa-accounting","financial-advisor","insurance-agent"] },
  { id: "design-architecture",   name: "Design & Architecture",  slugs: ["architect","interior-designer","land-surveyor","photography"] },
];

function EditMultiCategoryPicker({
  categories,
  initialCategoryId,
  initialAdditionalIds,
}: {
  categories: Pick<Category, "id" | "name" | "slug" | "category_group">[];
  initialCategoryId: string;
  initialAdditionalIds: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const ids = [initialCategoryId, ...initialAdditionalIds].filter(Boolean);
    return [...new Set(ids)];
  });
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const otherCat = categories.find((c) => c.slug === "other");

  const catBySlug: Record<string, Pick<Category, "id" | "name" | "slug" | "category_group">> = {};
  for (const c of categories) catBySlug[c.slug] = c;

  const groups = CATEGORY_GROUPS.map((g) => ({
    ...g,
    items: g.slugs.map((s) => catBySlug[s]).filter(Boolean) as Pick<Category, "id" | "name" | "slug" | "category_group">[],
  })).filter((g) => g.items.length > 0);

  const knownSlugs = new Set(CATEGORY_GROUPS.flatMap((g) => g.slugs));
  const ungrouped = categories.filter((c) => !knownSlugs.has(c.slug) && c.slug !== "other");
  const ungroupedByText: Record<string, typeof ungrouped> = {};
  for (const c of ungrouped) {
    const g = c.category_group || "Other";
    if (!ungroupedByText[g]) ungroupedByText[g] = [];
    ungroupedByText[g].push(c);
  }
  const textGroups = Object.entries(ungroupedByText).map(([name, items]) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name,
    slugs: [] as string[],
    items,
  }));

  const allGroups = [...groups, ...textGroups];

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const primaryId = selectedIds[0] ?? "";
  const additionalIds = selectedIds.slice(1);
  const selectedCats = selectedIds.map((id) => categories.find((c) => c.id === id)).filter(Boolean);

  return (
    <div className="space-y-3">
      <input type="hidden" name="category_id" value={primaryId} />
      {additionalIds.map((id) => (
        <input key={id} type="hidden" name="additional_category_ids" value={id} />
      ))}

      {selectedCats.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCats.map((cat, i) => (
            <span
              key={cat!.id}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {i === 0 && <span className="opacity-70">Primary:</span>}
              {cat!.name}
              <button
                type="button"
                onClick={() => toggle(cat!.id)}
                className="opacity-60 hover:opacity-100 transition-opacity leading-none"
                aria-label={`Remove ${cat!.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="divide-y divide-border rounded-md border border-border overflow-hidden">
        {allGroups.map((group) => {
          const open = openGroups.has(group.id);
          const groupSelectedCount = group.items.filter((c) => selectedIds.includes(c.id)).length;
          return (
            <div key={group.id}>
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium text-neutral-800">{group.name}</span>
                <div className="flex items-center gap-2">
                  {groupSelectedCount > 0 && (
                    <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      {groupSelectedCount}
                    </span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                </div>
              </button>
              {open && (
                <div className="px-4 pb-3 pt-1 grid grid-cols-2 gap-1 bg-muted/20">
                  {group.items.map((cat) => {
                    const checked = selectedIds.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2 rounded-md px-2.5 py-2 cursor-pointer transition-colors text-sm ${
                          checked ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-neutral-700"
                        }`}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggle(cat.id)} />
                        <span>{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Other */}
        <div>
          <button
            type="button"
            onClick={() => otherCat && toggle(otherCat.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium text-neutral-800">Other / Not Listed</span>
            {otherCat && selectedIds.includes(otherCat.id) && (
              <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">1</span>
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Select all trades you offer. The first selected becomes your primary category.
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PackageSlot {
  name: string;
  description: string;
  price_label: string;
}

interface EditFormProps {
  contractor: Contractor & { categories: Category };
  portfolioPhotos: PortfolioPhoto[];
  categories: Pick<Category, "id" | "name" | "slug" | "category_group">[];
  packages?: ContractorPackage[];
  backHref?: string;
  savedSuccess?: boolean;
}

const initialState: EditListingFormState = {};

export function EditListingForm({ contractor, portfolioPhotos, categories, packages, backHref, savedSuccess }: EditFormProps) {
  const [state, action, pending] = useActionState(updateContractor, initialState);
  const [deletepending, startDelete] = useTransition();
  const [, startPackagesTransition] = useTransition();

  const [localPackages, setLocalPackages] = useState<PackageSlot[]>(
    (packages ?? []).map((p) => ({
      name: p.name,
      description: p.description ?? "",
      price_label: p.price_label ?? "",
    }))
  );

  function addPackage() {
    if (localPackages.length >= 4) return;
    setLocalPackages((prev) => [...prev, { name: "", description: "", price_label: "" }]);
  }

  function removePackage(i: number) {
    setLocalPackages((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updatePackageField(i: number, field: keyof PackageSlot, value: string) {
    setLocalPackages((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  function handleFormSubmit() {
    const validPackages = localPackages.filter((p) => p.name.trim());
    startPackagesTransition(async () => {
      await savePackages(contractor.id, validPackages.map((p) => ({
        name: p.name.trim(),
        description: p.description.trim() || undefined,
        price_label: p.price_label.trim() || undefined,
      })));
    });
  }

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
    <form action={action} onSubmit={handleFormSubmit} className="space-y-8">
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
      {(state.success || savedSuccess) && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Listing updated successfully. <Link href={backHref ?? "/dashboard"} className="font-medium underline underline-offset-4">Back to dashboard</Link></span>
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
          <Label>Trades / Categories *</Label>
          <EditMultiCategoryPicker
            categories={categories}
            initialCategoryId={contractor.category_id}
            initialAdditionalIds={contractor.additional_categories ?? []}
          />
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

      <Separator />

      {/* ── Packages ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Packages</h2>
          <p className="text-sm text-muted-foreground mt-1">Add up to 4 service packages visible on your profile.</p>
        </div>

        {localPackages.map((pkg, i) => (
          <div key={i} className="rounded-lg border border-neutral-200 p-4 space-y-3 relative">
            <button
              type="button"
              onClick={() => removePackage(i)}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 transition-colors"
              aria-label="Remove package"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="space-y-1.5 pr-8">
              <Label htmlFor={`pkg-name-${i}`}>Package name *</Label>
              <Input
                id={`pkg-name-${i}`}
                value={pkg.name}
                onChange={(e) => updatePackageField(i, "name", e.target.value)}
                placeholder="e.g. Full Roof Replacement"
                maxLength={100}
                required={false}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`pkg-desc-${i}`}>Description</Label>
              <Textarea
                id={`pkg-desc-${i}`}
                rows={2}
                value={pkg.description}
                onChange={(e) => updatePackageField(i, "description", e.target.value)}
                placeholder="What's included, timeline, etc."
                maxLength={500}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`pkg-price-${i}`}>Price</Label>
              <Input
                id={`pkg-price-${i}`}
                value={pkg.price_label}
                onChange={(e) => updatePackageField(i, "price_label", e.target.value)}
                placeholder="e.g. $299, Starting at $150, Free estimate"
                maxLength={100}
              />
            </div>
          </div>
        ))}

        {localPackages.length < 4 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPackage}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Package
          </Button>
        )}
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
