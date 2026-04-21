"use client";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface Props {
  defaultValue?: string;
  defaultZip?: string;
}

export function ContractorSearchBar({ defaultValue, defaultZip }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");
  const [zip, setZip] = useState(defaultZip ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    if (zip.trim()) params.set("zip", zip.trim());
    router.push(params.toString() ? `/contractors?${params}` : "/contractors");
  }

  function handleClear() {
    setValue("");
    setZip("");
    router.push("/contractors");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-xl">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search by name, trade, or service…"
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-9 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {(value || zip) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="ZIP"
          maxLength={10}
          className="w-24 rounded-lg border border-border bg-background py-2.5 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
    </form>
  );
}
