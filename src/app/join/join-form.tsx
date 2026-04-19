"use client";

import { useActionState, useState, useRef, type ChangeEvent } from "react";
import Link from "next/link";
import { Upload, ImageIcon, Trash2 } from "lucide-react";
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

// Popular categories shown at the top of the picker (by slug)
const POPULAR_SLUGS = [
  "general-contractor",
  "roofing",
  "electrical",
  "plumbing",
  "hvac",
  "painting",
  "landscaping",
  "pool-spa",
  "flooring",
  "cleaning",
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

function setInputFiles(input: HTMLInputElement, files: File[]) {
  const dataTransfer = new DataTransfer();

  for (const file of files) {
    dataTransfer.items.add(file);
  }

  input.files = dataTransfer.files;
}

function CategoryPicker({
  categories,
}: {
  categories: Pick<Category, "id" | "name" | "slug">[];
}) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const popular = POPULAR_SLUGS
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean) as Pick<Category, "id" | "name" | "slug">[];

  const otherCategory = categories.find((c) => c.slug === "other");

  const allNonOther = categories.filter((c) => c.slug !== "other");

  const filtered = search.trim()
    ? allNonOther.filter((c) =>
        c.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : allNonOther;

  const selected = categories.find((c) => c.id === selectedId);
  const isOther = selected?.slug === "other";

  function pick(cat: Pick<Category, "id" | "name" | "slug">) {
    setSelectedId(cat.id);
    setShowOtherInput(cat.slug === "other");
    setOpen(false);
    setSearch("");
  }

  function clear() {
    setSelectedId("");
    setShowOtherInput(false);
    setSearch("");
  }

  return (
    <div className="space-y-2">
      {/* Hidden input for form submission */}
      <input type="hidden" name="category_id" value={selectedId} />

      {/* Trigger / selected display */}
      {selected ? (
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
          <span className="font-medium">{selected.name}</span>
          <button
            type="button"
            onClick={clear}
            className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear selection"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            setTimeout(() => searchRef.current?.focus(), 50);
          }}
          className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
        >
          <span>Select your trade...</span>
          <span className="text-xs opacity-60">▼</span>
        </button>
      )}

      {/* Dropdown panel */}
      {open && !selected && (
        <div className="rounded-md border border-border bg-background shadow-md">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <Input
              ref={searchRef}
              placeholder="Search trades..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-2 space-y-3">
            {/* Popular section — only shown when not searching */}
            {!search.trim() && popular.length > 0 && (
              <div>
                <p className="px-1 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Popular
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {popular.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => pick(cat)}
                      className="text-left rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All / filtered results */}
            {search.trim() && (
              <div>
                {filtered.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground text-center">
                    No match — try &quot;Other&quot; below
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-1">
                    {filtered.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => pick(cat)}
                        className="text-left rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Other — always shown at bottom */}
            {otherCategory && (
              <div className="border-t border-border pt-2">
                <button
                  type="button"
                  onClick={() => pick(otherCategory)}
                  className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors text-muted-foreground"
                >
                  Other (not listed)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Free-text field when "Other" is selected */}
      {isOther && (
        <div className="space-y-1.5">
          <Label htmlFor="custom_trade">Describe your trade *</Label>
          <Input
            id="custom_trade"
            name="custom_trade"
            placeholder="e.g. Irrigation, Fence Installation, Solar..."
            required
          />
          <p className="text-xs text-muted-foreground">
            We&apos;ll add your trade to the directory.
          </p>
        </div>
      )}
    </div>
  );
}

interface JoinFormProps {
  categories: Pick<Category, "id" | "name" | "slug">[];
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
  categories: Pick<Category, "id" | "name" | "slug">[];
  userEmail?: string;
}) {
  const [state, action, pending] = useActionState(joinAsContractor, initialJoinState);
  const [clientUploadError, setClientUploadError] = useState<string | null>(null);
  const [isPreparingUploads, setIsPreparingUploads] = useState(false);

  // Logo
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Photo slots
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>([{ id: 0, file: null, previewUrl: null }]);
  const nextSlotId = useRef(1);
  const photosHiddenRef = useRef<HTMLInputElement>(null);
  const photoPickerRef = useRef<HTMLInputElement>(null);
  const pendingSlotIdRef = useRef<number | null>(null);

  // Sync filled photo slots into the hidden form input so the server action sees them
  useEffect(() => {
    if (photosHiddenRef.current) {
      const files = photoSlots.map((s) => s.file).filter((f): f is File => f !== null);
      setInputFiles(photosHiddenRef.current, files);
    }
  }, [photoSlots]);

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    setClientUploadError(null);

    if (!file) {
      return;
    }

    if (file.type === "image/svg+xml") {
      if (file.size > CLIENT_MAX_LOGO_BYTES) {
        setClientUploadError("SVG logos must be 5MB or smaller.");
        input.value = "";
        return;
      }

      const url = URL.createObjectURL(file);
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(url);
      return;
    }

    setIsPreparingUploads(true);

    try {
      const optimizedLogo = await optimizeRasterImage(file, {
        maxBytes: CLIENT_MAX_LOGO_BYTES,
        maxDimension: CLIENT_LOGO_MAX_DIMENSION,
      });

      setInputFiles(input, [optimizedLogo]);

      const url = URL.createObjectURL(optimizedLogo);
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(url);
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
      setInputFiles(logoInputRef.current, []);
    }
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(null);
    }
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
    <form action={action} className="space-y-8">
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
          <Label>Trade / Category *</Label>
          <CategoryPicker categories={categories} />
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
            accept="image/*"
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
            accept="image/*"
            onChange={handlePhotoPickerChange}
            disabled={isPreparingUploads}
            className="sr-only"
          />

          {/* Hidden multi-file input that the server action reads */}
          <input
            ref={photosHiddenRef}
            name="photos"
            type="file"
            accept="image/*"
            multiple
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
