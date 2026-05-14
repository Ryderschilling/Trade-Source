import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const maxDuration = 300;

function mdToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  const now = new Date().toISOString();

  // Find campaigns due to send
  const { data: due, error: fetchError } = await db
    .from('email_campaigns')
    .select('*, email_lists(name)')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now);

  if (fetchError) {
    console.error('[send-campaigns] fetch error:', fetchError.message);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!due?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let totalSent = 0;

  for (const campaign of due) {
    // Mark as sending to prevent double-send on overlap
    await db
      .from('email_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign.id)
      .eq('status', 'scheduled');

    // Get active members
    const { data: members } = await db
      .from('email_list_members')
      .select('email')
      .eq('list_id', campaign.list_id)
      .is('unsubscribed_at', null);

    const recipients = members ?? [];
    const html = mdToHtml(campaign.body_markdown);
    let delivered = 0;
    let failed = 0;

    await Promise.all(
      recipients.map(async (m) => {
        const result = await sendEmail({
          to: m.email,
          subject: campaign.subject,
          html,
          kind: `campaign:${campaign.id}`,
          meta: { campaign_id: campaign.id, list_id: campaign.list_id },
        });
        if (result.error) failed++;
        else delivered++;
      }),
    );

    await db
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipient_count: recipients.length,
        delivered_count: delivered,
        failed_count: failed,
      })
      .eq('id', campaign.id);

    totalSent += delivered;
    console.log(`[send-campaigns] campaign ${campaign.id}: ${delivered} delivered, ${failed} failed`);
  }

  return NextResponse.json({ ok: true, campaigns: due.length, sent: totalSent });
}
