"use client";

import { useEffect } from "react";
import { trackView } from "@/app/actions/trackView";

interface ViewTrackerProps {
  contractorId: string;
}

export function ViewTracker({ contractorId }: ViewTrackerProps) {
  useEffect(() => {
    trackView(contractorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
