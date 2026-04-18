"use client";

import { useActionState } from "react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitLead, type LeadFormState } from "@/app/actions/leads";

const initialState: LeadFormState = { success: false };

interface LeadFormProps {
  contractorId: string;
  businessName: string;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}

export function LeadForm({ contractorId, businessName, defaultName, defaultEmail, defaultPhone }: LeadFormProps) {
  const [state, action, pending] = useActionState(submitLead, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Request sent!", {
        description: `${businessName} will be in touch with you soon.`,
      });
      formRef.current?.reset();
    } else if (state.error && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, businessName]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="contractor_id" value={contractorId} />

      <div className="space-y-1.5">
        <Label htmlFor="lead-name">Your name *</Label>
        <Input
          id="lead-name"
          name="name"
          placeholder="Jane Smith"
          defaultValue={defaultName}
          required
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
        />
        {state.fieldErrors?.name && (
          <p id="name-error" className="text-xs text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lead-email">Email *</Label>
        <Input
          id="lead-email"
          name="email"
          type="email"
          placeholder="jane@example.com"
          defaultValue={defaultEmail}
          required
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
        />
        {state.fieldErrors?.email && (
          <p id="email-error" className="text-xs text-destructive">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lead-phone">Phone</Label>
        <Input
          id="lead-phone"
          name="phone"
          type="tel"
          placeholder="(850) 555-0100"
          defaultValue={defaultPhone}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lead-service">Service needed</Label>
        <Input
          id="lead-service"
          name="service_type"
          placeholder="e.g. Roof repair, new HVAC install..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lead-contact">Preferred contact</Label>
        <Select name="preferred_contact" defaultValue="either">
          <SelectTrigger id="lead-contact">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="either">Either</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lead-message">Message *</Label>
        <Textarea
          id="lead-message"
          name="message"
          placeholder="Describe your project, timeline, and any details that will help..."
          rows={4}
          required
          aria-describedby={state.fieldErrors?.message ? "message-error" : undefined}
        />
        {state.fieldErrors?.message && (
          <p id="message-error" className="text-xs text-destructive">
            {state.fieldErrors.message[0]}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending..." : "Send Request"}
      </Button>
    </form>
  );
}
