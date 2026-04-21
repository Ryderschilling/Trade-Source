"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function LeadMessageButton({ leadId }: { leadId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations/from-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      });

      const data = await res.json();

      if (data.error === "no_account") {
        const c = data.contact;
        toast.info(
          `No in-app account linked to this lead. Contact ${c.name} at ${c.email}${c.phone ? ` or ${c.phone}` : ""}.`,
          { duration: 8000 }
        );
        return;
      }

      if (!res.ok || !data.conversation_id) {
        toast.error(data.error ?? "Could not open conversation");
        return;
      }

      window.location.href = `/messages?c=${data.conversation_id}`;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 gap-1.5 text-xs"
      disabled={loading}
      onClick={handleClick}
    >
      <MessageSquare className="h-3.5 w-3.5" />
      {loading ? "Opening…" : "Message"}
    </Button>
  );
}
