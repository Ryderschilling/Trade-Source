"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as Record<string, any>)[name];
  if (!Icon) return null;
  return <Icon className={className ?? "h-4 w-4"} />;
}

interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

interface SidebarGroup {
  id: string;
  name: string;
  icon: string;
  categories: CategoryItem[];
}

interface Props {
  sidebarGroups: SidebarGroup[];
  categorySlug?: string;
  activeGroupId?: string;
  activeCategory?: CategoryItem | null;
  countByCategory: Record<string, number>;
}

export function MobileCategoryNav({
  sidebarGroups,
  categorySlug,
  activeGroupId,
  activeCategory,
  countByCategory,
}: Props) {
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(activeGroupId ? [activeGroupId] : [])
  );

  function toggleGroup(groupId: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  const activeGroup = sidebarGroups.find((g) => g.id === activeGroupId);

  return (
    <div className="lg:hidden w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full rounded-xl border border-border bg-background px-4 py-3.5 select-none"
      >
        <div className="flex items-center gap-2.5">
          {activeCategory ? (
            <>
              <CategoryIcon name={activeGroup?.icon ?? ""} className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-neutral-900">{activeCategory.name}</span>
            </>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">Browse categories</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-border bg-background overflow-hidden shadow-sm">
          {sidebarGroups.map((group, i) => (
            <div key={group.id} className={i > 0 ? "border-t border-border" : ""}>
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <CategoryIcon name={group.icon} className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 text-sm font-semibold text-neutral-800">{group.name}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${openGroups.has(group.id) ? "rotate-180" : ""}`}
                />
              </button>

              {openGroups.has(group.id) && (
                <div className="border-t border-border/60 bg-muted/20 px-3 py-2 space-y-0.5">
                  {group.categories.map((cat) => {
                    const count = countByCategory[cat.id] ?? 0;
                    const isActive = cat.slug === categorySlug;
                    return (
                      <Link
                        key={cat.id}
                        href={`/contractors?category=${cat.slug}`}
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-neutral-700 hover:bg-muted hover:text-neutral-900 active:bg-muted"
                        }`}
                      >
                        <span className="flex flex-col min-w-0">
                          <span className="truncate">{cat.name}</span>
                          {group.id === "other" && cat.description && (
                            <span className={`truncate text-xs ${isActive ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {cat.description}
                            </span>
                          )}
                        </span>
                        {count > 0 && (
                          <span
                            className={`ml-2 shrink-0 text-xs tabular-nums ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                          >
                            {count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
