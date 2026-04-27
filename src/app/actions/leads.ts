"use server";

import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

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

  const { data: contractor } = await supabase
    .from("contractors")
    .select("user_id, business_name, email")
    .eq("id", parsed.data.contractor_id)
    .single();

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
    await supabase.from("notifications").insert({
      user_id: contractor.user_id,
      type: "lead",
      title: `New quote request from ${parsed.data.name}`,
      body: truncated,
      link: "/dashboard",
    });
  }

  if (contractor?.email) {
    await sendEmail({
      to: contractor.email,
      subject: `New quote request from ${parsed.data.name} — Source A Trade`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>New Quote Request</h2>
          <p>You have a new quote request on <strong>Source A Trade</strong> for <strong>${contractor.business_name}</strong>.</p>
          <hr />
          <p><strong>From:</strong> ${parsed.data.name}</p>
          <p><strong>Email:</strong> ${parsed.data.email}</p>
          ${parsed.data.phone ? `<p><strong>Phone:</strong> ${parsed.data.phone}</p>` : ""}
          <p><strong>Description:</strong></p>
          <blockquote style="border-left:3px solid #e2e8f0;margin:0;padding:8px 16px;color:#64748b">
            ${parsed.data.message.replace(/\n/g, "<br/>")}
          </blockquote>
          <hr />
          <p style="color:#64748b;font-size:14px">
            Log into your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">contractor dashboard</a> to manage this lead.
          </p>
        </div>
      `,
      kind: "transactional:lead",
      meta: { contractor_id: parsed.data.contractor_id },
    });
  }

  await sendEmail({
    to: parsed.data.email,
    replyTo: contractor?.email ?? undefined,
    subject: `Quote request sent to ${contractor?.business_name ?? "contractor"} — Source A Trade`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Request received, ${parsed.data.name}!</h2>
        <p>Your quote request has been sent to <strong>${contractor?.business_name ?? "the contractor"}</strong> on Source A Trade.</p>
        <p>They will review your project and reach out to you directly at <strong>${parsed.data.email}</strong>${parsed.data.phone ? ` or <strong>${parsed.data.phone}</strong>` : ""}.</p>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Your message</p>
          <p style="margin:0;color:#374151;font-size:15px">${parsed.data.message.replace(/\n/g, "<br/>")}</p>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#94a3b8;font-size:12px">Source A Trade — sourceatrade.com</p>
      </div>
    `,
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

  const { data: contractor } = await supabase
    .from("contractors")
    .select("user_id, business_name, email")
    .eq("id", parsed.data.contractor_id)
    .single();

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
    await supabase.from("notifications").insert({
      user_id: contractor.user_id,
      type: "lead",
      title: `New message from ${parsed.data.name}`,
      body: truncated,
      link: "/dashboard",
    });
  }

  if (contractor?.email) {
    await sendEmail({
      to: contractor.email,
      subject: `New message from ${parsed.data.name} — Source A Trade`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>New Message</h2>
          <p>Someone reached out to <strong>${contractor.business_name}</strong> on Source A Trade.</p>
          <hr />
          <p><strong>From:</strong> ${parsed.data.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${parsed.data.email}">${parsed.data.email}</a></p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left:3px solid #e2e8f0;margin:0;padding:8px 16px;color:#64748b">
            ${parsed.data.message.replace(/\n/g, "<br/>")}
          </blockquote>
          <hr />
          <p style="color:#64748b;font-size:14px">
            Reply directly to <a href="mailto:${parsed.data.email}">${parsed.data.email}</a> or log into your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">dashboard</a>.
          </p>
        </div>
      `,
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

  const { data: contractor } = await supabase
    .from("contractors")
    .select("user_id, business_name, email")
    .eq("id", contractor_id)
    .single();

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
    await supabase.from("notifications").insert({
      user_id: contractor.user_id,
      type: "lead",
      title: `New service request: ${package_name} from ${name}`,
      body: truncated,
      link: "/dashboard",
    });
  }

  if (contractor?.email) {
    await sendEmail({
      to: contractor.email,
      subject: `New service request: ${package_name} — Source A Trade`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>New Service Request</h2>
          <p>You have a new service request on <strong>Source A Trade</strong> for <strong>${contractor.business_name}</strong>.</p>
          <p><strong>Package:</strong> ${package_name}</p>
          <hr />
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          <p><strong>Description:</strong></p>
          <blockquote style="border-left:3px solid #e2e8f0;margin:0;padding:8px 16px;color:#64748b">
            ${message.replace(/\n/g, "<br/>")}
          </blockquote>
          <hr />
          <p style="color:#64748b;font-size:14px">
            Log into your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">contractor dashboard</a> to manage this lead.
          </p>
        </div>
      `,
      kind: "transactional:package_request",
      meta: { contractor_id },
    });
  }

  return { success: true };
}
