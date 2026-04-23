import { createAdminClient } from '@/lib/supabase/admin'

export async function audit(params: {
  action: string
  actor?: string
  targetTable?: string
  targetId?: string
  before?: unknown
  after?: unknown
  ip?: string
  ua?: string
}): Promise<void> {
  void (async () => {
    try {
      const supabase = createAdminClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_audit_log').insert({
        actor: params.actor ?? 'admin',
        action: params.action,
        target_table: params.targetTable ?? null,
        target_id: params.targetId ?? null,
        diff:
          params.before !== undefined || params.after !== undefined
            ? { before: params.before ?? null, after: params.after ?? null }
            : null,
        ip: params.ip ?? null,
        user_agent: params.ua ?? null,
      })
    } catch {
      // fire-and-forget — never throws
    }
  })()
}
