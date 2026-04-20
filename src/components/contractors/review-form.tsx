"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitReview, type ReviewFormState } from "@/app/actions/reviews";

const initialState: ReviewFormState = { success: false };

interface ReviewFormProps {
  contractorId: string;
  businessName: string;
}

export function ReviewForm({ contractorId, businessName }: ReviewFormProps) {
  const [state, action, pending] = useActionState(submitReview, initialState);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Review submitted!", {
        description: `Thank you for reviewing ${businessName}.`,
      });
    } else if (state.error && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, businessName]);

  if (state.success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
        Your review has been submitted. Thank you!
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="contractor_id" value={contractorId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="space-y-1.5">
        <Label>Your rating *</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  star <= (hovered || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
        {state.fieldErrors?.rating && (
          <p className="text-xs text-destructive">{state.fieldErrors.rating[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input
          id="review-title"
          name="title"
          type="text"
          maxLength={100}
          placeholder="Summarize your experience"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-body">Review *</Label>
        <Textarea
          id="review-body"
          name="body"
          rows={4}
          placeholder="Describe your experience with this contractor..."
          aria-describedby={state.fieldErrors?.body ? "body-error" : undefined}
        />
        {state.fieldErrors?.body && (
          <p id="body-error" className="text-xs text-destructive">
            {state.fieldErrors.body[0]}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending || rating === 0}>
        {pending ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
