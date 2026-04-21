"use client";

import { useEffect, useRef } from "react";
import { trackView } from "@/app/actions/trackView";

interface ViewTrackerProps {
  contractorId: string;
}

export function ViewTracker({ contractorId }: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackView(contractorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
