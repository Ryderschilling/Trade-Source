"use server";

import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { buildEmailHtml } from "@/lib/email-template";
import { redis } from "@/lib/upstash";

const leadContactLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 d"), prefix: "rl:lead:contact" })
  : null;

type ContractorContactRow = { user_id: string | null; business_name: string | null; email: string | null };

async function loadActiveContractor(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  contractorId: string,
): Promise<ContractorContactRow | null> {
  const { data } = await service
    .from("contractors")
    .select("user_id, business_name, email, status")
    .eq("id", contractorId)
    .maybeSingle();
  if (!data || data.status !== "active") return null;
  return { user_id: data.user_id, business_name: data.business_name, email: data.email };
}

async function checkContactRateLimit(userId: string, contractorId: string): Promise<boolean> {
  if (!leadContactLimit) return true;
  const { success } = await leadContactLimit.limit(`${userId}:${contractorId}`);
  return success;
}

const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be 100 characters or fewer"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
  message: z.string().min(10, "Please describe your project (min 10 characters)").max(2000, "Message must be 2000 characters or fewer"),
  contractor_id: z.string().uuid("Invalid contractor"),
  service_type: z.string().optional(),
  preferred_contact: z.enum(["email", "phone", "either"]).optional(),
});

export type LeadFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof leadSchema>, string[]>>;
};

export async function submitLead(
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in to request a quote." };

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    message: formData.get("message") as string,
    contractor_id: formData.get("contractor_id") as string,
    service_type: (formData.get("service_type") as string) || undefined,
    preferred_contact: (formData.get("preferred_contact") as string) || undefined,
  };

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Partial<
        Record<keyof z.infer<typeof leadSchema>, string[]>
      >,
    };
  }

  const supabase = await createServiceClient();

  const contractor = await loadActiveContractor(supabase, parsed.data.contractor_id);
  if (!contractor) {
    return { success: false, error: "This contractor isn't accepting requests right now." };
  }

  if (!(await checkContactRateLimit(user.id, parsed.data.contractor_id))) {
    return { success: false, error: "You've contacted this contractor recently. Please wait a day before sending another request." };
  }

  const { error: insertError } = await supabase.from("leads").insert({
    contractor_id: parsed.data.contractor_id,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    message: parsed.data.message,
    service_type: parsed.data.service_type ?? null,
    preferred_contact: parsed.data.preferred_contact ?? "either",
  });

  if (insertError) {
    console.error("Lead insert error:", insertError);
    return { success: false, error: "Failed to submit request. Please try again." };
  }

  if (contractor?.user_id) {
    const truncated = parsed.data.message.length > 120 ? parsed.data.message.slice(0, 117) + "…" : parsed.data.message;

    let conversationId: string | null = null;
    if (contractor.user_id !== user.id) {
      const { data: submitterParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (submitterParticipations && submitterParticipations.length > 0) {
        const myIds = submitterParticipations.map((p: { conversation_id: string }) => p.conversation_id);
        const { data: shared } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", contractor.user_id)
          .in("conversation_id", myIds);

        if (shared && shared.length > 0) {
          const sharedIds = shared.map((p: { conversation_id: string }) => p.conversation_id);
          const { data: direct } = await supabase
            .from("conversations")
            .select("id")
            .is("quote_request_id", null)
            .in("id", sharedIds)
            .limit(1)
            .maybeSingle();
          if (direct) conversationId = direct.id;
        }
      }

      if (!conversationId) {
        const { data: convo } = await supabase
          .from("conversations")
          .insert({ quote_request_id: null })
          .select("id")
          .single();
        if (convo) {
          await supabase.from("conversation_participants").insert([
            { conversation_id: convo.id, user_id: user.id },
            { conversation_id: convo.id, user_id: contractor.user_id },
          ]);
          conversationId = convo.id;
        }
      }

      if (conversationId) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: parsed.data.message,
        });
      }
    }

    await supabase.from("notifications").insert({
      user_id: contractor.user_id,
      type: "lead",
      title: `New quote request from ${parsed.data.name}`,
      body: truncated,
      link: conversationId ? `/messages?c=${conversationId}` : "/dashboard",
    });
  }

  if (contractor?.email) {
    await sendEmail({
      to: contractor.email,
      subject: `New quote request from ${parsed.data.name} — Source A Trade`,
      html: buildEmailHtml({
        heading: "New quote request",
        intro: `You have a new quote request on Source A Trade for <strong>${contractor.business_name}</strong>.`,
        details: [
          { label: "From", value: parsed.data.name },
          { label: "Email", value: parsed.data.email },
          parsed.data.phone ? { label: "Phone", value: parsed.data.phone } : null,
          parsed.data.service_type ? { label: "Service", value: parsed.data.service_type } : null,
        ],
        messageLabel: "Project description",
        message: parsed.data.message,
        ctaText: "View in dashboard",
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      }),
      kind: "transactional:lead",
      meta: { contractor_id: parsed.data.contractor_id },
    });
  }

  await sendEmail({
    to: parsed.data.email,
    replyTo: contractor?.email ?? undefined,
    subject: `Quote request sent to ${contractor?.business_name ?? "contractor"} — Source A Trade`,
    html: buildEmailHtml({
      heading: `Request received, ${parsed.data.name}!`,
      intro: `Your quote request has been sent to <strong>${contractor?.business_name ?? "the contractor"}</strong>. They'll review your project and reach out at <strong>${parsed.data.email}</strong>${parsed.data.phone ? ` or <strong>${parsed.data.phone}</strong>` : ""}.`,
      messageLabel: "Your message",
      message: parsed.data.message,
    }),
    kind: "transactional:lead:confirmation",
    meta: { contractor_id: parsed.data.contractor_id },
  });

  return { success: true };
}

export type MessageFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string[]>>;
};

const messageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address"),
  message: z.string().min(5, "Message must be at least 5 characters").max(2000),
  contractor_id: z.string().uuid("Invalid contractor"),
});

export async function submitMessage(
  _prev: MessageFormState,
  formData: FormData
): Promise<MessageFormState> {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in to send a message." };

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    message: formData.get("message") as string,
    contractor_id: formData.get("contractor_id") as string,
  };

  const parsed = messageSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Partial<Record<"name" | "email" | "message", string[]>>,
    };
  }

  const supabase = await createServiceClient();

  const contractor = await loadActiveContractor(supabase, parsed.data.contractor_id);
  if (!contractor) {
    return { success: false, error: "This contractor isn't accepting messages right now." };
  }

  if (!(await checkContactRateLimit(user.id, parsed.data.contractor_id))) {
    return { success: false, error: "You've messaged this contractor recently. Please wait a day before sending another message." };
  }

  const { error: insertError } = await supabase.from("leads").insert({
    contractor_id: parsed.data.contractor_id,
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    service_type: "general_inquiry",
    preferred_contact: "either",
  });

  if (insertError) {
    console.error("Message insert error:", insertError);
    return { success: false, error: "Failed to send message. Please try again." };
  }

  if (contractor?.user_id) {
    const truncated = parsed.data.message.length > 120 ? parsed.data.message.slice(0, 117) + "…" : parsed.data.message;

    // Find or create a direct conversation so the lead message is accessible in-app
    let conversationId: string | null = null;
    if (contractor.user_id !== user.id) {
      const { data: submitterParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (submitterParticipations && submitterParticipations.length > 0) {
        const myIds = submitterParticipations.map((p: { conversation_id: string }) => p.conversation_id);
        const { data: shared } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", contractor.user_id)
          .in("conversation_id", myIds);

        if (shared && shared.length > 0) {
          const sharedIds = shared.map((p: { conversation_id: string }) => p.conversation_id);
          const { data: direct } = await supabase
            .from("conversations")
            .select("id")
            .is("quote_request_id", null)
            .in("id", sharedIds)
            .limit(1)
            .maybeSingle();
          if (direct) conversationId = direct.id;
        }
      }

      if (!conversationId) {
        const { data: convo } = await supabase
          .from("conversations")
          .insert({ quote_request_id: null })
          .select("id")
          .single();
        if (convo) {
          await supabase.from("conversation_participants").insert([
            { conversation_id: convo.id, user_id: user.id },
            { conversation_id: convo.id, user_id: contractor.user_id },
          ]);
          conversationId = convo.id;
        }
      }

      if (conversationId) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: parsed.data.message,
        });
      }
    }

    await supabase.from("notifications").insert({
      user_id: contractor.user_id,
      type: "lead",
      title: `New message from ${parsed.data.name}`,
      body: truncated,
      link: conversationId ? `/messages?c=${conversationId}` : "/dashboard",
    });
  }

  if (contractor?.email) {
    await sendEmail({
      to: contractor.email,
      subject: `New message from ${parsed.data.name} — Source A Trade`,
      html: buildEmailHtml({
        heading: "New message",
        intro: `Someone reached out to <strong>${contractor.business_name}</strong> on Source A Trade.`,
        details: [
          { label: "From", value: parsed.data.name },
          { label: "Email", value: parsed.data.email },
        ],
        messageLabel: "Message",
        message: parsed.data.message,
        footerNote: `Reply directly to ${parsed.data.email} to respond.`,
      }),
      kind: "transactional:lead",
      meta: { contractor_id: parsed.data.contractor_id },
    });
  }

  return { success: true };
}

export type PackageRequestFormState = {
  success: boolean;
  error?: string;
};

export async function submitPackageRequest(
  _prev: PackageRequestFormState,
  formData: FormData
): Promise<PackageRequestFormState> {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const contractor_id = formData.get("contractor_id") as string;
  const package_name = formData.get("package_name") as string;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();
  const phone = (formData.get("phone") as string) || undefined;

  if (!contractor_id || !package_name) {
    return { success: false, error: "Missing required fields." };
  }
  if (!name) return { success: false, error: "Name is required." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "A valid email address is required." };
  }
  if (!address) return { success: false, error: "Address is required." };
  if (!message || message.length < 10) {
    return { success: false, error: "Please describe your project (min 10 characters)." };
  }

  const supabase = await createServiceClient();

  const contractor = await loadActiveContractor(supabase, contractor_id);
  if (!contractor) {
    return { success: false, error: "This contractor isn't accepting requests right now." };
  }

  if (!(await checkContactRateLimit(user.id, contractor_id))) {
    return { success: false, error: "You've already requested a package from this contractor recently. Please wait a day before sending another." };
  }

  const { error: insertError } = await supabase.from("leads").insert({
    contractor_id,
    name,
    email,
    phone: phone ?? null,
    address: address ?? null,
    message,
    service_type: package_name,
    package_name,
  });

  if (insertError) {
    console.error("Package request insert error:", insertError);
    return { success: false, error: "Failed to submit request. Please try again." };
  }

  if (contractor?.user_id) {
    const truncated = message.length > 120 ? message.slice(0, 117) + "…" : message;

    let conversationId: string | null = null;
    if (contractor.user_id !== user.id) {
      const { data: submitterParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (submitterParticipations && submitterParticipations.length > 0) {
        const myIds = submitterParticipations.map((p: { conversation_id: string }) => p.conversation_id);
        const { data: shared } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", contractor.user_id)
          .in("conversation_id", myIds);

        if (shared && shared.length > 0) {
          const sharedIds = shared.map((p: { conversation_id: string }) => p.conversation_id);
          const { data: direct } = await supabase
            .from("conversations")
            .select("id")
            .is("quote_request_id", null)
            .in("id", sharedIds)
            .limit(1)
            .maybeSingle();
          if (direct) conversationId = direct.id;
        }
      }

      if (!conversationId) {
        const { data: convo } = await supabase
          .from("conversations")
          .insert({ quote_request_id: null })
          .select("id")
          .single();
        if (convo) {
          await supabase.from("conversation_participants").insert([
            { conversation_id: convo.id, user_id: user.id },
            { conversation_id: convo.id, user_id: contractor.user_id },
          ]);
          conversationId = convo.id;
        }
      }

      if (conversationId) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: message,
        });
      }
    }

    await supabase.from("notifications").insert({
      user_id: contractor.user_id,
      type: "lead",
      title: `New service request: ${package_name} from ${name}`,
      body: truncated,
      link: conversationId ? `/messages?c=${conversationId}` : "/dashboard",
    });
  }

  if (contractor?.email) {
    await sendEmail({
      to: contractor.email,
      subject: `New service request: ${package_name} — Source A Trade`,
      html: buildEmailHtml({
        heading: "New service request",
        intro: `You have a new service request on Source A Trade for <strong>${contractor.business_name}</strong>.`,
        details: [
          { label: "Package", value: package_name },
          { label: "From", value: name },
          { label: "Email", value: email },
          phone ? { label: "Phone", value: phone } : null,
        ],
        messageLabel: "Project description",
        message,
        ctaText: "View in dashboard",
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      }),
      kind: "transactional:package_request",
      meta: { contractor_id },
    });
  }

  return { success: true };
}
