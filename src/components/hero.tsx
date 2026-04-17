"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Hero() {
  const router = useRouter();
  const [trade, setTrade] = useState("");
  const [zip, setZip] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (trade.trim()) params.set("q", trade.trim());
    if (zip.trim()) params.set("zip", zip.trim());
    router.push("/contractors?" + params.toString());
  }

  return (
    <section className="bg-white pt-32 pb-24 sm:pt-36 md:pt-40 md:pb-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <p className="mb-6 text-sm font-medium uppercase tracking-widest text-neutral-500">
            Northwest Florida · 30A
          </p>

          {/* Headline */}
          <h1
            className="text-5xl font-semibold tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl"
            style={{ lineHeight: "1.05" }}
          >
            Find a trusted local tradesman.
          </h1>

          {/* Subcopy */}
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-600 sm:text-xl">
            Vetted electricians, plumbers, HVAC pros, and handymen serving the
            30A corridor. One search. Real reviews. No lead-gen spam.
          </p>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="mt-10">
            {/* Mobile — stacked */}
            <div className="flex flex-col gap-3 sm:hidden">
              <Input
                type="text"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                placeholder="Trade or contractor name…"
                className="h-12 border-neutral-200 px-4 text-base shadow-sm"
              />
              <Input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="ZIP code"
                className="h-12 border-neutral-200 px-4 text-base shadow-sm"
                maxLength={10}
              />
              <Button
                type="submit"
                className="h-12 w-full rounded-lg bg-neutral-900 text-base font-semibold text-white hover:bg-neutral-800"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

            {/* Desktop — single pill */}
            <div className="hidden h-14 max-w-2xl items-stretch overflow-hidden rounded-full border border-neutral-200 bg-white shadow-sm sm:flex">
              {/* Trade input */}
              <label className="flex min-w-0 flex-1 cursor-text items-center gap-3 pl-6">
                <Search className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                <Input
                  type="text"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  placeholder="Trade or contractor name…"
                  className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 text-base text-neutral-900 placeholder:text-neutral-400 focus-visible:border-transparent focus-visible:ring-0"
                />
              </label>

              {/* Divider */}
              <span className="my-3 w-px shrink-0 bg-neutral-200" aria-hidden />

              {/* ZIP input */}
              <label className="flex w-36 shrink-0 cursor-text items-center px-4">
                <Input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="ZIP code"
                  className="h-full w-full rounded-none border-0 bg-transparent px-0 text-base text-neutral-900 placeholder:text-neutral-400 focus-visible:border-transparent focus-visible:ring-0"
                  maxLength={10}
                />
              </label>

              {/* Submit */}
              <span className="flex shrink-0 items-center pr-1.5">
                <Button
                  type="submit"
                  className="h-11 rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                  Search
                </Button>
              </span>
            </div>
          </form>

          {/* Tagline */}
          <p className="mt-4 text-sm text-neutral-500">
            Free to use.{" "}
            <span className="font-medium text-neutral-900">
              Pros pay nothing to list.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
