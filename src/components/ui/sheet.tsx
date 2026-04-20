"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

function SheetBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: DialogPrimitive.Popup.Props & { side?: "right" | "left" }) {
  return (
    <SheetPortal>
      <SheetBackdrop />
      <DialogPrimitive.Popup
        className={cn(
          "fixed z-50 top-0 bottom-0 flex flex-col bg-background shadow-xl",
          "w-full sm:max-w-lg",
          "data-open:animate-in data-open:duration-300",
          "data-closed:animate-out data-closed:duration-200",
          side === "right"
            ? "right-0 data-open:slide-in-from-right data-closed:slide-out-to-right"
            : "left-0 data-open:slide-in-from-left data-closed:slide-out-to-left",
          className
        )}
        {...props}
      >
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 pb-4", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-semibold text-neutral-900", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-neutral-500", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
