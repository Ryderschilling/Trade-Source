"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Star, X, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteReviewButton } from "@/components/contractors/delete-review-button";
import { submitReview } from "@/app/actions/reviews";

type ReviewWithProfile = {
  id: string;
  user_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  is_anonymous: boolean;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

interface Props {
  initialReviews: ReviewWithProfile[];
  initialReviewCount: number;
  initialAvgRating: number | null;
  contractorId: string;
  contractorSlug: string;
  businessName: string;
  userId: string | null;
  userName: string | null;
  userAvatarUrl: string | null;
  hasReviewed: boolean;
  isOwner: boolean;
  reviewOpen: boolean;
}

export function ReviewsSection({
  initialReviews,
  initialReviewCount,
  initialAvgRating,
  contractorId,
  contractorSlug,
  businessName,
  userId,
  userName,
  userAvatarUrl,
  hasReviewed: initialHasReviewed,
  isOwner,
  reviewOpen,
}: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [avgRating, setAvgRating] = useState(initialAvgRating);
  const [hasReviewed, setHasReviewed] = useState(initialHasReviewed);
  const [modalOpen, setModalOpen] = useState(false);

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"rating" | "body", string>>>({});

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (reviewOpen && userId && !isOwner && !hasReviewed) {
      setModalOpen(true);
    }
  }, []);

  function openModal() {
    setRating(0);
    setHovered(0);
    setTitle("");
    setBody("");
    setIsAnonymous(false);
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    if (reviewOpen) {
      router.replace(pathname, { scroll: false });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: typeof fieldErrors = {};
    if (rating === 0) errors.rating = "Please select a rating.";
    if (body.trim().length < 20) errors.body = "Review must be at least 20 characters.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);

    const formData = new FormData();
    formData.set("contractor_id", contractorId);
    formData.set("rating", String(rating));
    if (title.trim()) formData.set("title", title.trim());
    formData.set("body", body.trim());
    formData.set("is_anonymous", isAnonymous ? "true" : "false");

    const result = await submitReview({ success: false }, formData);
    setSubmitting(false);

    if (!result.success) {
      if (result.error === "You have already reviewed this business.") {
        setHasReviewed(true);
        setModalOpen(false);
        return;
      }
      setFormError(result.error ?? "Something went wrong.");
      return;
    }

    const newReview: ReviewWithProfile = {
      id: `opt-${Date.now()}`,
      user_id: userId,
      rating,
      title: title.trim() || null,
      body: body.trim(),
      is_anonymous: isAnonymous,
      created_at: new Date().toISOString(),
      profiles: isAnonymous ? null : { full_name: userName, avatar_url: userAvatarUrl },
    };

    setReviews((prev) => [newReview, ...prev]);
    const newCount = reviewCount + 1;
    setReviewCount(newCount);
    setAvgRating(
      avgRating === null
        ? rating
        : Math.round(((avgRating * reviewCount + rating) / newCount) * 10) / 10
    );
    setHasReviewed(true);
    setModalOpen(false);
    if (reviewOpen) router.replace(pathname, { scroll: false });
    toast.success("Thanks for your review — it's helping your community.");
  }

  const canReview = Boolean(userId && !isOwner && !hasReviewed);
  const needsLogin = Boolean(!userId && !isOwner);

  return (
    <>
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full sm:max-w-lg bg-background rounded-t-2xl sm:rounded-2xl shadow-xl overflow-y-auto max-h-[90dvh]">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div>
                <p className="font-semibold text-foreground text-base">Write a Review</p>
                <p className="text-xs text-muted-foreground mt-0.5">{businessName}</p>
              </div>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors p-1" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
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
                        className={`h-8 w-8 transition-colors ${
                          star <= (hovered || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {fieldErrors.rating && (
                  <p className="text-xs text-destructive">{fieldErrors.rating}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-review-title">Title <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="modal-review-title"
                  type="text"
                  maxLength={100}
                  placeholder="Summarize your experience"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-review-body">Review *</Label>
                <Textarea
                  id="modal-review-body"
                  rows={4}
                  placeholder="Describe your experience with this contractor..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  {fieldErrors.body
                    ? <p className="text-xs text-destructive">{fieldErrors.body}</p>
                    : <span />
                  }
                  <span className={`text-xs tabular-nums ${body.trim().length >= 20 ? "text-green-600" : "text-muted-foreground"}`}>
                    {body.trim().length}/20
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAnonymous((v) => !v)}
                className={`flex items-center gap-2.5 w-full rounded-lg border px-3 py-2.5 text-sm transition-colors text-left ${
                  isAnonymous
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <EyeOff className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{isAnonymous ? "Posting anonymously" : "Post anonymously"}</span>
                <div
                  className={`ml-auto h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                    isAnonymous ? "border-primary bg-primary" : "border-muted-foreground/40"
                  }`}
                />
              </button>

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Reviews{" "}
            {reviewCount > 0 && (
              <span className="text-muted-foreground font-normal text-base">({reviewCount})</span>
            )}
            {avgRating !== null && reviewCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-base font-normal text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {Number(avgRating).toFixed(1)}
              </span>
            )}
          </h2>
          {canReview && (
            <Button size="sm" onClick={openModal}>Write a Review</Button>
          )}
          {needsLogin && (
            <Link href={`/login?redirect=/contractors/${contractorSlug}`}>
              <Button size="sm">Write a Review</Button>
            </Link>
          )}
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {review.is_anonymous || !review.user_id ? (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">A</AvatarFallback>
                        </Avatar>
                      ) : (
                        <Link href={`/profile/${review.user_id}`}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={review.profiles?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {review.profiles?.full_name?.[0] ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      )}
                      <div>
                        {review.is_anonymous || !review.user_id ? (
                          <p className="text-sm font-medium text-muted-foreground">Anonymous</p>
                        ) : (
                          <Link
                            href={`/profile/${review.user_id}`}
                            className="text-sm font-medium hover:underline underline-offset-2"
                          >
                            {review.profiles?.full_name ?? "Anonymous"}
                          </Link>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.title && (
                    <p className="mt-2 font-medium text-sm">{review.title}</p>
                  )}
                  {review.body && (
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{review.body}</p>
                  )}
                  {userId === review.user_id && !review.id.startsWith("opt-") && (
                    <div className="mt-3 flex justify-end">
                      <DeleteReviewButton reviewId={review.id} contractorSlug={contractorSlug} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-base font-semibold text-foreground">
              Be the first to review {businessName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Help your community by sharing your experience.
            </p>
            {canReview && (
              <Button className="mt-4" onClick={openModal}>Write a Review</Button>
            )}
            {needsLogin && (
              <Link href={`/login?redirect=/contractors/${contractorSlug}`}>
                <Button className="mt-4">Write a Review</Button>
              </Link>
            )}
          </div>
        )}

        {userId && !isOwner && hasReviewed && reviews.length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            You have already reviewed this business.
          </p>
        )}
      </section>
    </>
  );
}
