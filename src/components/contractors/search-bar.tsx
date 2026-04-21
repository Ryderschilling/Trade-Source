"use client";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface Props {
  defaultValue?: string;
}

export function ContractorSearchBar({ defaultValue }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(params.toString() ? `/contractors?${params}` : "/contractors");
  }

  function handleClear() {
    setValue("");
    router.push("/contractors");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-xl">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search by name, trade, or service…"
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-9 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}
