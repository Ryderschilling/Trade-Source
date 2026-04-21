"use client";

import dynamic from "next/dynamic";
import type { MapPin } from "@/lib/map-pins";

const TradeMap = dynamic(() => import("@/components/trade-map"), { ssr: false });

export default function TradeMapClient({ pins }: { pins?: MapPin[] }) {
  return <TradeMap pins={pins} />;
}
