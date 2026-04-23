import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
  /** Identifies the email in the send log, e.g. 'transactional:lead' */
  kind: string
  meta?: Record<string, unknown>
}

export async function sendEmail(params: SendEmailParams): Promise<{ id?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) return {}

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = params.from ?? process.env.RESEND_FROM_EMAIL!

  let resendId: string | undefined
  let sendError: string | undefined

  try {
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    })
    resendId = result.data?.id ?? undefined
  } catch (e: unknown) {
    sendError = e instanceof Error ? e.message : 'Unknown send error'
    console.error(`sendEmail [${params.kind}] failed:`, e)
  }

  // Fire-and-forget: log to email_sends (table exists after migration 023)
  void (async () => {
    try {
      const supabase = createAdminClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('email_sends').insert({
        kind: params.kind,
        to_email: params.to,
        resend_id: resendId ?? null,
        status: sendError ? 'failed' : 'sent',
        error: sendError ?? null,
        meta: params.meta ?? null,
      })
    } catch {
      // non-fatal — table may not exist until migration 023 is applied
    }
  })()

  return sendError ? { error: sendError } : { id: resendId }
}
