"use client";

import { useActionState, useState, useRef, startTransition, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { Upload, ImageIcon, Trash2, ChevronDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { joinAsContractor, type JoinFormState } from "@/app/actions/contractors";
import { signUp, type AuthFormState } from "@/app/actions/auth";
import { SERVICE_AREAS } from "@/lib/constants";
import type { Category } from "@/lib/supabase/types";

const initialJoinState: JoinFormState = {};
const initialAuthState: AuthFormState = {};

// Group structure for the multi-category picker (mirrors DB groups exactly)
const CATEGORY_GROUPS = [
  { id: "exterior-structure",   name: "Exterior & Structure",   slugs: ["general-contractor","roofing","siding","windows-doors","gutters","painting-exterior","pressure-washing","driveway-paving","foundation-structural","stucco","garage-doors","screen-enclosures"] },
  { id: "mechanical-systems",   name: "Mechanical Systems",     slugs: ["plumbing","hvac","electrical","solar","generator","water-treatment","gas-lines"] },
  { id: "interior-remodel",     name: "Interior & Remodel",     slugs: ["painting-interior","flooring","drywall","insulation","carpentry-trim","cabinetry-countertops","tile-stone","kitchen-remodel","bathroom-remodel"] },
  { id: "outdoor-landscape",    name: "Outdoor & Landscape",    slugs: ["landscaping","lawn-care","irrigation","tree-service","pool-spa","outdoor-lighting","fencing","decks-patios","outdoor-kitchen"] },
  { id: "coastal-marine",       name: "Coastal & Marine",       slugs: ["dock-boathouse","seawall-bulkhead","hurricane-shutters","flood-mitigation","beach-service"] },
  { id: "property-services",    name: "Property Services",      slugs: ["home-watch","pest-control","security-systems","locksmith","handyman","junk-removal","house-cleaning"] },
  { id: "vacation-rentals",     name: "Vacation Rentals",       slugs: ["rental-management","turnover-cleaning","linen-service","rental-photography","staging-rentals"] },
  { id: "automotive",           name: "Automotive",             slugs: ["auto-repair","auto-body-paint","oil-change","tire-shop","car-detailing","towing","golf-cart-repair"] },
  { id: "health-wellness",      name: "Health & Wellness",      slugs: ["chiropractor","massage-therapy","physical-therapist","dentist","med-spa","personal-training","primary-care","mental-health"] },
  { id: "professional-services",name: "Professional Services",  slugs: ["fractional-cfo"] },
  { id: "real-estate-property", name: "Real Estate & Property", slugs: ["real-estate-agent","real-estate-brokerage","property-management","home-inspector","title-escrow","mortgage-lending","real-estate-appraiser"] },
  { id: "legal-financial",      name: "Legal & Financial",      slugs: ["real-estate-attorney","estate-planning","business-attorney","cpa-accounting","financial-advisor","insurance-agent"] },
  { id: "design-architecture",  name: "Design & Architecture",  slugs: ["architect","interior-design","land-surveyor","photography"] },
];

const CLIENT_MAX_LOGO_BYTES = 5 * 1024 * 1024;
const CLIENT_MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const CLIENT_MAX_PHOTO_COUNT = 8;
const CLIENT_LOGO_MAX_DIMENSION = 1600;
const CLIENT_PHOTO_MAX_DIMENSION = 2200;
const MAX_PHOTO_CARDS = 6;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Couldn't read ${file.name}.`));
    };

    image.src = objectUrl;
  });
}

function getResizedDimensions(width: number, height: number, maxDimension: number) {
  const largestDimension = Math.max(width, height);

  if (largestDimension <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / largestDimension;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Image compression failed."));
      },
      type,
      quality
    );
  });
}

async function optimizeRasterImage(
  file: File,
  {
    maxBytes,
    maxDimension,
  }: {
    maxBytes: number;
    maxDimension: number;
  }
) {
  let image: HTMLImageElement;

  try {
    image = await loadImageFromFile(file);
  } catch {
    // Browser can't decode this format (e.g. HEIC on Chrome).
    // If it's already within the size limit, upload it as-is.
    if (file.size <= maxBytes) {
      return file;
    }
    throw new Error(
      `${file.name} can't be compressed by your browser. Please export it as JPEG or PNG and try again.`
    );
  }

  let { width, height } = getResizedDimensions(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    maxDimension
  );

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not prepare this image for upload.");
  }

  const preferredType = file.type === "image/png" ? "image/webp" : file.type || "image/webp";

  for (let attempt = 0; attempt < 5; attempt++) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.86, 0.78, 0.7, 0.62]) {
      const blob = await canvasToBlob(canvas, preferredType, quality);
      if (blob.size <= maxBytes) {
        const extension = preferredType === "image/png" ? "png" : preferredType === "image/jpeg" ? "jpg" : "webp";
        const baseName = file.name.replace(/\.[^.]+$/, "");
        return new File([blob], `${baseName}.${extension}`, {
          type: preferredType,
          lastModified: Date.now(),
        });
      }
    }

    width = Math.max(1, Math.round(width * 0.85));
    height = Math.max(1, Math.round(height * 0.85));
  }

  throw new Error(`${file.name} is still too large after compression. Please choose a smaller image.`);
}


function MultiCategoryPicker({
  categories,
}: {
  categories: Pick<Category, "id" | "name" | "slug" | "category_group">[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [showOtherForm, setShowOtherForm] = useState(false);
  const [customTradeName, setCustomTradeName] = useState("");
  const [customTradeDesc, setCustomTradeDesc] = useState("");

  const otherCat = categories.find((c) => c.slug === "other");

  const catBySlug: Record<string, Pick<Category, "id" | "name" | "slug" | "category_group">> = {};
  for (const c of categories) catBySlug[c.slug] = c;

  const groups = CATEGORY_GROUPS.map((g) => ({
    ...g,
    items: g.slugs.map((s) => catBySlug[s]).filter(Boolean) as Pick<Category, "id" | "name" | "slug" | "category_group">[],
  })).filter((g) => g.items.length > 0);

  const knownSlugs = new Set(CATEGORY_GROUPS.flatMap((g) => g.slugs));
  const ungrouped = categories.filter((c) => !knownSlugs.has(c.slug) && c.slug !== "other");

  // Group unknown categories by their category_group text from the DB
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

  const existingGroupIds = new Set(groups.map((g) => g.id));
  const allGroups = [...groups, ...textGroups.filter((g) => !existingGroupIds.has(g.id))];

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

  function toggleOther() {
    const nextShow = !showOtherForm;
    setShowOtherForm(nextShow);
    if (otherCat) {
      setSelectedIds((prev) =>
        nextShow
          ? prev.includes(otherCat.id) ? prev : [...prev, otherCat.id]
          : prev.filter((id) => id !== otherCat.id)
      );
    }
    if (!nextShow) {
      setCustomTradeName("");
      setCustomTradeDesc("");
    }
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
      {showOtherForm && (
        <>
          <input type="hidden" name="custom_trade_name" value={customTradeName} />
          <input type="hidden" name="custom_trade_description" value={customTradeDesc} />
        </>
      )}

      {/* Selected tags */}
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

      {/* Accordion groups */}
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
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  />
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
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggle(cat.id)}
                        />
                        <span>{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Other / Not Listed */}
        <div>
          <button
            type="button"
            onClick={toggleOther}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium text-neutral-800">Other / Not Listed</span>
            <div className="flex items-center gap-2">
              {showOtherForm && (
                <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  1
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showOtherForm ? "rotate-180" : ""}`}
              />
            </div>
          </button>
          {showOtherForm && (
            <div className="px-4 pb-4 pt-2 space-y-3 bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Don&apos;t see your trade? Tell us what you do and we&apos;ll add you to the right category.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="other_trade_name">Your trade / category *</Label>
                <Input
                  id="other_trade_name"
                  placeholder="e.g. Dog Training, Boat Detailing, Aerial Photography"
                  value={customTradeName}
                  onChange={(e) => setCustomTradeName(e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="other_trade_desc">Describe your services</Label>
                <Textarea
                  id="other_trade_desc"
                  placeholder="What do you offer? Any specialties or details that help homeowners understand your work..."
                  rows={3}
                  value={customTradeDesc}
                  onChange={(e) => setCustomTradeDesc(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Select all trades you offer. The first selected becomes your primary category shown on your listing.
      </p>
    </div>
  );
}

interface PackageEntry {
  name: string;
  description: string;
  price_label: string;
}

function PackagesEditor({ onChange }: { onChange: (pkgs: PackageEntry[]) => void }) {
  const [packages, setPackages] = useState<PackageEntry[]>([]);

  function update(index: number, field: keyof PackageEntry, value: string) {
    setPackages((prev) => {
      const next = prev.map((p, i) => (i === index ? { ...p, [field]: value } : p));
      onChange(next);
      return next;
    });
  }

  function addPackage() {
    if (packages.length >= 4) return;
    setPackages((prev) => {
      const next = [...prev, { name: "", description: "", price_label: "" }];
      onChange(next);
      return next;
    });
  }

  function removePackage(index: number) {
    setPackages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      onChange(next);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {packages.map((pkg, i) => (
        <div key={i} className="rounded-lg border border-border p-4 space-y-3 relative">
          <button
            type="button"
            onClick={() => removePackage(i)}
            aria-label="Remove package"
            className="absolute top-3 right-3 h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="space-y-1.5 pr-8">
            <Label htmlFor={`pkg_name_${i}`}>Package name *</Label>
            <Input
              id={`pkg_name_${i}`}
              placeholder="e.g. Full Roof Replacement"
              value={pkg.name}
              onChange={(e) => update(i, "name", e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`pkg_desc_${i}`}>Description</Label>
            <Textarea
              id={`pkg_desc_${i}`}
              placeholder="What's included, timeline, any details..."
              rows={2}
              value={pkg.description}
              onChange={(e) => update(i, "description", e.target.value)}
              maxLength={500}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`pkg_price_${i}`}>Price / label</Label>
            <Input
              id={`pkg_price_${i}`}
              placeholder="e.g. Starting at $5,000 or Free estimate"
              value={pkg.price_label}
              onChange={(e) => update(i, "price_label", e.target.value)}
              maxLength={100}
            />
          </div>
        </div>
      ))}

      {packages.length < 4 && (
        <button
          type="button"
          onClick={addPackage}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors w-full"
        >
          <Plus className="h-4 w-4" />
          Add a service or package {packages.length > 0 && `(${packages.length}/4)`}
        </button>
      )}

      {packages.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Optional. Add up to 4 services or packages — homeowners can request them directly from your listing.
        </p>
      )}
    </div>
  );
}

interface JoinFormProps {
  categories: Pick<Category, "id" | "name" | "slug" | "category_group">[];
  userEmail?: string;
  userId?: string;
}

function AccountStep({ onComplete }: { onComplete: () => void }) {
  const [state, action, pending] = useActionState(
    async (prev: AuthFormState, formData: FormData) => {
      const result = await signUp(prev, formData);
      if (result.success) {
        onComplete();
      }
      return result;
    },
    initialAuthState
  );

  if (state.success) {
    return (
      <div className="rounded-md bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400">
        <p className="font-medium">Account created — check your email to confirm.</p>
        <p className="mt-1 text-muted-foreground">
          After confirming your email, your business listing will be submitted.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="role" value="contractor" />

      <div>
        <h2 className="text-lg font-semibold">Create your personal account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your business listing will be managed under this account. Use your own name and email — you can add your business details in the next step.
        </p>
      </div>

      {state.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name *</Label>
        <Input
          id="full_name"
          name="full_name"
          placeholder="Jane Smith"
          required
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Min. 8 characters"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account..." : "Create account & continue"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login?redirect=/join" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}

interface PhotoSlot {
  id: number;
  file: File | null;
  previewUrl: string | null;
}

function BusinessDetailsStep({
  categories,
  userEmail,
}: {
  categories: Pick<Category, "id" | "name" | "slug" | "category_group">[];
  userEmail?: string;
}) {
  const [state, formAction, pending] = useActionState(joinAsContractor, initialJoinState);
  const [clientUploadError, setClientUploadError] = useState<string | null>(null);
  const [isPreparingUploads, setIsPreparingUploads] = useState(false);
  const [packagesJson, setPackagesJson] = useState("");

  // Logo
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [businessName, setBusinessName] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Photo slots
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>([{ id: 0, file: null, previewUrl: null }]);
  const nextSlotId = useRef(1);
  const photoPickerRef = useRef<HTMLInputElement>(null);
  const pendingSlotIdRef = useRef<number | null>(null);

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    setClientUploadError(null);

    if (!file) {
      return;
    }

    if (file.type === "image/svg+xml") {
      setClientUploadError("SVG logos aren't supported. Please use JPEG, PNG, or WebP.");
      input.value = "";
      return;
    }

    setIsPreparingUploads(true);

    try {
      const optimizedLogo = await optimizeRasterImage(file, {
        maxBytes: CLIENT_MAX_LOGO_BYTES,
        maxDimension: CLIENT_LOGO_MAX_DIMENSION,
      });

      const url = URL.createObjectURL(optimizedLogo);
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(url);
      setLogoFile(optimizedLogo);
    } catch (error) {
      input.value = "";
      setClientUploadError(
        error instanceof Error ? error.message : "We couldn't prepare the logo for upload."
      );
    } finally {
      setIsPreparingUploads(false);
    }
  }

  function handleLogoRemove() {
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(null);
    }
    setLogoFile(null);
  }

  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Replace logo with the File object stored in state (bypasses hidden input unreliability)
    fd.delete("logo");
    if (logoFile) {
      fd.set("logo", logoFile);
    }

    // Replace photos with File objects stored in slot state
    fd.delete("photos");
    for (const slot of photoSlots) {
      if (slot.file) {
        fd.append("photos", slot.file);
      }
    }

    startTransition(() => formAction(fd));
  }

  function openPhotoFilePicker(slotId: number) {
    pendingSlotIdRef.current = slotId;
    if (photoPickerRef.current) {
      photoPickerRef.current.value = "";
      photoPickerRef.current.click();
    }
  }

  async function handlePhotoPickerChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    const slotId = pendingSlotIdRef.current;
    if (!file || slotId === null) return;

    setIsPreparingUploads(true);
    setClientUploadError(null);

    try {
      const optimized = await optimizeRasterImage(file, {
        maxBytes: CLIENT_MAX_PHOTO_BYTES,
        maxDimension: CLIENT_PHOTO_MAX_DIMENSION,
      });

      const previewUrl = URL.createObjectURL(optimized);
      const newSlotId = nextSlotId.current++;

      setPhotoSlots((prev) => {
        const idx = prev.findIndex((s) => s.id === slotId);
        if (idx === -1) return prev;
        const next = [...prev];
        if (next[idx].previewUrl) URL.revokeObjectURL(next[idx].previewUrl!);
        next[idx] = { id: slotId, file: optimized, previewUrl };
        // Add a new empty slot only if this was the last slot and we're under the max
        const isLastSlot = idx === prev.length - 1;
        if (isLastSlot && prev.length < MAX_PHOTO_CARDS) {
          next.push({ id: newSlotId, file: null, previewUrl: null });
        }
        return next;
      });
    } catch (error) {
      setClientUploadError(
        error instanceof Error ? error.message : "We couldn't prepare the photo for upload."
      );
    } finally {
      setIsPreparingUploads(false);
    }
  }

  function handlePhotoSlotRemove(slotId: number) {
    setPhotoSlots((prev) => {
      const idx = prev.findIndex((s) => s.id === slotId);
      if (idx === -1) return prev;
      const slot = prev[idx];
      if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8">
      {clientUploadError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {clientUploadError}
        </div>
      )}

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
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
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
          <Label>Trades / Categories *</Label>
          <MultiCategoryPicker categories={categories} />
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
            type="text"
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
        </div>
      </section>

      <Separator />

      {/* Branding & Photos */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Branding & Photos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add your logo and a few project photos to make your listing stand out.
          </p>
        </div>

        {/* Logo upload */}
        <div className="space-y-2">
          <Label>Business logo</Label>

          {/* Hidden file input — keeps the existing upload/optimization logic intact */}
          <input
            ref={logoInputRef}
            id="logo"
            name="logo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleLogoChange}
            disabled={isPreparingUploads}
            className="sr-only"
          />

          {/* Polaroid card */}
          <div className="w-40 rounded-xl bg-white shadow-md overflow-hidden border border-gray-100">
            {/* Square preview area */}
            <div className="w-full aspect-square bg-[#dbeafe] flex items-center justify-center overflow-hidden">
              {logoPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreviewUrl}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold text-blue-300 select-none leading-none">
                  {businessName ? businessName[0].toUpperCase() : ""}
                </span>
              )}
            </div>

            {/* Button row */}
            <div className="p-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isPreparingUploads}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-blue-400 px-2 py-1.5 text-xs text-blue-600 font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <Upload className="h-3 w-3" />
                {logoPreviewUrl ? "Replace" : "Upload Photo"}
              </button>
              {logoPreviewUrl && (
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  disabled={isPreparingUploads}
                  aria-label="Remove logo"
                  className="flex-shrink-0 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Optional. Any image format up to 5MB. Automatically optimized before upload.
          </p>
        </div>

        {/* Business photos */}
        <div className="space-y-2">
          <Label>Business photos</Label>

          {/* Single reusable file picker — opened programmatically per slot */}
          <input
            ref={photoPickerRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoPickerChange}
            disabled={isPreparingUploads}
            className="sr-only"
          />

          <div className="flex flex-wrap gap-3">
            {photoSlots.map((slot) => (
              <div
                key={slot.id}
                className="w-36 rounded-xl bg-white shadow-md overflow-hidden border border-gray-100 animate-in fade-in duration-200"
              >
                {/* Square preview area */}
                <div className="w-full aspect-square bg-[#dbeafe] flex items-center justify-center overflow-hidden">
                  {slot.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slot.previewUrl}
                      alt="Photo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-blue-300" />
                  )}
                </div>

                {/* Button row */}
                <div className="p-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openPhotoFilePicker(slot.id)}
                    disabled={isPreparingUploads}
                    className="flex-1 flex items-center justify-center gap-1 rounded-full border border-blue-400 px-2 py-1.5 text-xs text-blue-600 font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    <Upload className="h-3 w-3" />
                    {slot.previewUrl ? "Replace" : "Upload"}
                  </button>
                  {slot.previewUrl && (
                    <button
                      type="button"
                      onClick={() => handlePhotoSlotRemove(slot.id)}
                      disabled={isPreparingUploads}
                      aria-label="Remove photo"
                      className="flex-shrink-0 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Optional. Up to {MAX_PHOTO_CARDS} photos. Large images are resized automatically before upload.
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

        <div className="grid gap-4 sm:grid-cols-3">
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
              placeholder="2"
            />
            <p className="text-xs text-muted-foreground">Since officially founded</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="years_experience">Years of experience</Label>
            <Input
              id="years_experience"
              name="years_experience"
              type="number"
              min={0}
              max={100}
              placeholder="10"
            />
            <p className="text-xs text-muted-foreground">Your total hands-on experience</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Services & Packages */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Services &amp; Packages</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add your offerings so homeowners can request specific services from your listing.
          </p>
        </div>
        <input type="hidden" name="packages_json" value={packagesJson} />
        <PackagesEditor
          onChange={(pkgs) => setPackagesJson(pkgs.length > 0 ? JSON.stringify(pkgs) : "")}
        />
      </section>

      <Separator />

      {isPreparingUploads && (
        <p className="text-sm text-muted-foreground">
          Preparing your images for upload...
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || isPreparingUploads}
      >
        {isPreparingUploads ? "Preparing photos..." : pending ? "Submitting..." : "Submit Your Listing"}
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

export function JoinForm({ categories, userEmail, userId }: JoinFormProps) {
  // If user is already logged in, skip account creation step
  const [step, setStep] = useState<"account" | "business">(
    userEmail ? "business" : "account"
  );

  return (
    <div>
      {!userEmail && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${step === "account" ? "bg-primary text-primary-foreground" : "bg-green-500 text-white"}`}>
              {step === "business" ? "✓" : "1"}
            </div>
            <span className={`text-sm font-medium ${step === "account" ? "text-foreground" : "text-muted-foreground"}`}>
              Create account
            </span>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${step === "business" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              2
            </div>
            <span className={`text-sm font-medium ${step === "business" ? "text-foreground" : "text-muted-foreground"}`}>
              Business details
            </span>
          </div>
        </div>
      )}

      {step === "account" && (
        <AccountStep onComplete={() => setStep("business")} />
      )}

      {step === "business" && (
        <BusinessDetailsStep categories={categories} userEmail={userEmail} />
      )}
    </div>
  );
}
