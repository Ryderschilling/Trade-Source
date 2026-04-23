import { createAdminClient } from '@/lib/supabase/admin'
import { audit } from './audit'
import type { AdminContext } from './guard'

export async function adminUpdate<T extends Record<string, unknown>>(
  table: string,
  id: string,
  patch: Partial<T>,
  ctx: Partial<AdminContext> = {}
): Promise<T> {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: before, error: readError } = await db
    .from(table)
    .select('*')
    .eq('id', id)
    .single()
  if (readError) throw new Error(readError.message)

  const { data: after, error: updateError } = await db
    .from(table)
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (updateError) throw new Error(updateError.message)

  void audit({
    action: `${table}.update`,
    targetTable: table,
    targetId: id,
    before,
    after,
    actor: ctx.actor,
    ip: ctx.ip,
    ua: ctx.ua,
  })

  return after as T
}
