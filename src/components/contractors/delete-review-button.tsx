"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteReview } from "@/app/actions/reviews";

interface DeleteReviewButtonProps {
  reviewId: string;
  contractorSlug: string;
}

export function DeleteReviewButton({ reviewId, contractorSlug }: DeleteReviewButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete your review? You'll be able to submit a new one.")) return;
    setPending(true);
    const result = await deleteReview(reviewId, contractorSlug);
    if (result.error) {
      toast.error(result.error);
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
      aria-label="Delete review"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
