"use client";

import { useState } from "react";
import Link from "next/link";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapPin } from "@/lib/map-pins";

export default function TradeMap({ pins = [] }: { pins?: MapPin[] }) {
  const [activePin, setActivePin] = useState<MapPin | null>(null);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ longitude: -86.18, latitude: 30.3, zoom: isMobile ? 8.0 : 8.5 }}
      style={{ width: "100%", height: "440px" }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      scrollZoom={false}
    >
      {pins.map((pin, index) => (
        <Marker key={pin.id} longitude={pin.lng} latitude={pin.lat} anchor="center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 1.5), duration: 0.4, ease: "easeOut" }}
            onClick={() => setActivePin(activePin?.id === pin.id ? null : pin)}
            className="cursor-pointer w-3 h-3 rounded-full bg-blue-400"
            style={{ boxShadow: "0 0 0 3px rgba(96,165,250,0.3)" }}
          />
        </Marker>
      ))}

      {activePin && (
        <Popup
          longitude={activePin.lng}
          latitude={activePin.lat}
          anchor="top"
          onClose={() => setActivePin(null)}
          closeButton={false}
          className="rounded-lg"
        >
          <div className="px-2 py-1 text-sm">
            <Link href={`/contractors/${activePin.slug}`} className="font-semibold text-zinc-900 hover:text-blue-600">
              {activePin.name}
            </Link>
            <p className="text-zinc-500 text-xs">{activePin.trade}</p>
          </div>
        </Popup>
      )}
    </Map>
  );
}
