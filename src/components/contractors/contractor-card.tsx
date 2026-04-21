import Link from "next/link";
import { Star, MapPin, Shield, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ContractorWithCategory } from "@/lib/supabase/types";

export function ContractorCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex gap-4">
          <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

interface ContractorCardProps {
  contractor: ContractorWithCategory;
}

export function ContractorCard({ contractor }: ContractorCardProps) {
  const initials = contractor.business_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link href={`/contractors/${contractor.slug}`}>
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/40 cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex gap-4">
            <Avatar className="h-14 w-14 rounded-xl flex-shrink-0">
              <AvatarImage
                src={contractor.logo_url ?? undefined}
                alt={contractor.business_name}
              />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold text-base">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                  {contractor.business_name}
                </h3>
                {contractor.is_featured && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    Featured
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground mt-0.5">
                {contractor.categories?.name ?? ""}
              </p>

              {contractor.tagline && (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                  {contractor.tagline}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* Rating */}
            {contractor.avg_rating !== null && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{contractor.avg_rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({contractor.review_count})
                </span>
              </div>
            )}

            {/* Location */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{contractor.city}, {contractor.state}</span>
            </div>

            {/* Verified badges */}
            {contractor.is_licensed && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Shield className="h-3.5 w-3.5" />
                <span>Licensed</span>
              </div>
            )}

            {contractor.phone && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{contractor.phone}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
