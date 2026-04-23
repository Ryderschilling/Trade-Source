import { createAdminClient } from '@/lib/supabase/admin';
import { ReviewsTable, type ReviewRow } from '@/components/admin/review-columns';

async function getReviews(): Promise<ReviewRow[]> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('reviews')
    .select('*, contractors(id, business_name), profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    is_verified: r.is_verified,
    is_anonymous: r.is_anonymous,
    contractor_id: r.contractor_id,
    business_name: r.contractors?.business_name ?? '—',
    user_display: r.is_anonymous
      ? 'Anonymous'
      : (r.profiles?.full_name ?? r.profiles?.email ?? '—'),
    created_at: r.created_at,
  }));
}

export default async function AdminReviewsPage() {
  const reviews = await getReviews();

  const byRating = [5, 4, 3, 2, 1].map((n) => ({
    stars: n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Reviews</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {reviews.length.toLocaleString()} total
          {' · '}
          {byRating.map(({ stars, count }) => `${count} × ${stars}★`).join(', ')}
        </p>
      </div>

      <ReviewsTable data={reviews} />
    </div>
  );
}
