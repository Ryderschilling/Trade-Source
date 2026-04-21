"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Photo = { id: string; url: string; caption: string | null };

function Lightbox({
  photos,
  index,
  businessName,
  onClose,
  onPrev,
  onNext,
  onDot,
}: {
  photos: Photo[];
  index: number;
  businessName: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDot: (i: number) => void;
}) {
  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
      className="flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{ position: "fixed", top: 16, right: 16 }}
        className="rounded-full bg-white/15 p-2.5 text-white hover:bg-white/30 transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          style={{ position: "fixed", left: 16, top: "50%", transform: "translateY(-50%)" }}
          className="rounded-full bg-white/15 p-2.5 text-white hover:bg-white/30 transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          style={{ position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)" }}
          className="rounded-full bg-white/15 p-2.5 text-white hover:bg-white/30 transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center"
        style={{ maxWidth: "90vw", maxHeight: "90vh" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[index].url}
          alt={photos[index].caption ?? `${businessName} work`}
          style={{
            maxWidth: "90vw",
            maxHeight: "85vh",
            width: "auto",
            height: "auto",
            borderRadius: 10,
            display: "block",
          }}
        />
        {photos[index].caption && (
          <p className="mt-3 text-center text-sm text-white/60">
            {photos[index].caption}
          </p>
        )}
      </div>

      {/* Dots */}
      {photos.length > 1 && (
        <div
          style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)" }}
          className="flex gap-2"
        >
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onDot(i); }}
              className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-2 bg-white/35"}`}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

export function PortfolioGallery({
  photos,
  businessName,
}: {
  photos: Photo[];
  businessName: string;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const prev = useCallback(() => setIndex((i) => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prev, next]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => { setIndex(i); setOpen(true); }}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src={photo.url}
              alt={photo.caption ?? `${businessName} work`}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {mounted && open && (
        <Lightbox
          photos={photos}
          index={index}
          businessName={businessName}
          onClose={() => setOpen(false)}
          onPrev={prev}
          onNext={next}
          onDot={setIndex}
        />
      )}
    </>
  );
}
