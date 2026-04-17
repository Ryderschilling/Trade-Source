"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push("/contractors?q=" + encodeURIComponent(value));
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl rounded-lg overflow-hidden shadow-lg">
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Plumber, electrician, roofing, Mike's HVAC..."
        className="flex-1 rounded-none rounded-l-lg border-0 bg-white text-slate-900 placeholder:text-slate-400 h-14 px-5 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <Button
        type="submit"
        size="lg"
        className="rounded-none rounded-r-lg h-14 px-6 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white"
      >
        <Search className="mr-2 h-4 w-4" />
        Search
      </Button>
    </form>
  );
}
