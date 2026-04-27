"use client";

import { useActionState, useEffect, useRef } from "react";
import { MessageSquare, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { submitMessage, type MessageFormState } from "@/app/actions/leads";

const initialState: MessageFormState = { success: false };

interface Props {
  contractorId: string;
  businessName: string;
  isLoggedIn: boolean;
  defaultName?: string;
  defaultEmail?: string;
}

export function MessageButton({ contractorId, businessName, isLoggedIn, defaultName, defaultEmail }: Props) {
  const [state, action, pending] = useActionState(submitMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" />
        }
      >
        <MessageSquare className="h-4 w-4" />
        Message
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message {businessName}</DialogTitle>
        </DialogHeader>

        {!isLoggedIn ? (
          <div className="rounded-lg border border-dashed border-border p-5 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Create a free account to send a message.
            </p>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Sign Up to Continue
            </Link>
          </div>
        ) : state.success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="font-semibold">Message sent!</p>
            <p className="text-sm text-muted-foreground">
              {businessName} will get back to you at your email.
            </p>
          </div>
        ) : (
          <form ref={formRef} action={action} className="space-y-4">
            <input type="hidden" name="contractor_id" value={contractorId} />

            <div className="space-y-1.5">
              <Label htmlFor="msg-name">Your name *</Label>
              <Input
                id="msg-name"
                name="name"
                placeholder="Jane Smith"
                defaultValue={defaultName}
                required
              />
              {state.fieldErrors?.name && (
                <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="msg-email">Email *</Label>
              <Input
                id="msg-email"
                name="email"
                type="email"
                placeholder="jane@example.com"
                defaultValue={defaultEmail}
                required
              />
              {state.fieldErrors?.email && (
                <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="msg-message">Message *</Label>
              <Textarea
                id="msg-message"
                name="message"
                placeholder="Hi, I had a quick question about..."
                rows={4}
                required
              />
              {state.fieldErrors?.message && (
                <p className="text-xs text-destructive">{state.fieldErrors.message[0]}</p>
              )}
            </div>

            {state.error && !state.fieldErrors && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
