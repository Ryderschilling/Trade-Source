"use client";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useState } from "react";

export function ContractorSearchBar({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q) {
      router.push(`/contractors?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/contractors");
    }
  }

  function handleClear() {
    setValue("");
    router.push("/contractors");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by name or service area (e.g. 30A, Destin)..."
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
    </form>
  );
}
