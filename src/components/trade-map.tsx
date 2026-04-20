// SETUP REQUIRED: Add NEXT_PUBLIC_MAPBOX_TOKEN=your_token to .env.local
// Get a free token at https://account.mapbox.com/
// Free tier: 50,000 map loads/month

"use client";

import { useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import "mapbox-gl/dist/mapbox-gl.css";

// TODO: replace with real Supabase data once lat/lng columns are added to contractors table
const PLACEHOLDER_PINS = [
  { id: "1", name: "Gulf Coast Electric", trade: "Electrical", lng: -86.35, lat: 30.30 },
  { id: "2", name: "30A Plumbing Co.", trade: "Plumbing", lng: -86.28, lat: 30.28 },
  { id: "3", name: "Seaside HVAC", trade: "HVAC", lng: -86.17, lat: 30.32 },
  { id: "4", name: "Rosemary Roofing", trade: "Roofing", lng: -86.06, lat: 30.29 },
  { id: "5", name: "WaterColor Landscaping", trade: "Landscaping", lng: -86.21, lat: 30.31 },
  { id: "6", name: "Inlet Beach Pools", trade: "Pool & Spa", lng: -85.87, lat: 30.26 },
  { id: "7", name: "Blue Mountain Painters", trade: "Painting", lng: -86.30, lat: 30.27 },
  { id: "8", name: "30A General Contractors", trade: "General Contractor", lng: -86.12, lat: 30.30 },
  { id: "9", name: "Grayton Flooring", trade: "Flooring", lng: -86.24, lat: 30.29 },
  { id: "10", name: "Alys Beach Cabinetry", trade: "Cabinetry & Millwork", lng: -86.10, lat: 30.28 },
];

interface Pin {
  id: string;
  name: string;
  trade: string;
  lng: number;
  lat: number;
}

export default function TradeMap() {
  const [activePin, setActivePin] = useState<Pin | null>(null);

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ longitude: -86.1, latitude: 30.28, zoom: 10 }}
      style={{ width: "100%", height: "440px" }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      scrollZoom={false}
    >
      {PLACEHOLDER_PINS.map((pin, index) => (
        <Marker key={pin.id} longitude={pin.lng} latitude={pin.lat} anchor="center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
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
            <p className="font-semibold text-zinc-900">{activePin.name}</p>
            <p className="text-zinc-500 text-xs">{activePin.trade}</p>
          </div>
        </Popup>
      )}
    </Map>
  );
}
