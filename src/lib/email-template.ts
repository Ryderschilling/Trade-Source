const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sourceatrade.com'

export interface EmailDetail {
  label: string
  value: string
}

export interface BuildEmailOptions {
  heading: string
  intro?: string
  details?: Array<EmailDetail | null | undefined>
  messageLabel?: string
  message?: string
  ctaText?: string
  ctaUrl?: string
  footerNote?: string
}

function dividerRow(): string {
  return `<tr><td colspan="2" height="1" style="background:#e5e7eb;font-size:0;line-height:0;padding:0;mso-line-height-rule:exactly;"></td></tr>`
}

export function buildEmailHtml(opts: BuildEmailOptions): string {
  const { heading, intro, details, messageLabel, message, ctaText, ctaUrl, footerNote } = opts

  const filteredDetails = (details ?? []).filter(Boolean) as EmailDetail[]

  const detailsHtml = filteredDetails.length
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 4px;">
        ${dividerRow()}
        ${filteredDetails
          .map(
            (d) => `
          <tr>
            <td style="padding:9px 0;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:13px;color:#6b7280;width:110px;vertical-align:top;">${d.label}</td>
            <td style="padding:9px 0;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:13px;color:#111111;vertical-align:top;">${d.value}</td>
          </tr>
          ${dividerRow()}
        `
          )
          .join('')}
      </table>
    `
    : ''

  const messageHtml = message
    ? `
      <p style="font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:#9ca3af;margin:${filteredDetails.length ? '20px' : '16px'} 0 8px 0;">${messageLabel ?? 'Message'}</p>
      <p style="font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:14px;color:#374151;line-height:1.65;margin:0 0 4px 0;">${message.replace(/\n/g, '<br/>')}</p>
    `
    : ''

  const ctaHtml =
    ctaText && ctaUrl
      ? `
      <table cellpadding="0" cellspacing="0" style="margin:24px 0 4px;">
        <tr>
          <td style="background:#2563eb;border-radius:6px;">
            <a href="${ctaUrl}" style="display:inline-block;padding:11px 22px;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">${ctaText}</a>
          </td>
        </tr>
      </table>
    `
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td style="padding:0 0 18px 4px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#111111;border-radius:8px;width:28px;height:28px;text-align:center;vertical-align:middle;padding:0;line-height:0;">
                    <img src="${APP_URL}/icon-white.png" width="16" height="16" alt="" style="display:block;margin:6px auto;" onerror="this.style.display='none'">
                  </td>
                  <td style="padding-left:9px;vertical-align:middle;">
                    <span style="font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:15px;font-weight:600;color:#111111;letter-spacing:-0.4px;">Source A Trade</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:10px;border:1px solid #e5e7eb;padding:28px 32px;">

              <h1 style="font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:18px;font-weight:600;color:#111111;margin:0 0 ${intro ? '10px' : '0'} 0;letter-spacing:-0.3px;">${heading}</h1>

              ${intro ? `<p style="font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:14px;color:#374151;line-height:1.65;margin:0;">${intro}</p>` : ''}

              ${detailsHtml}

              ${messageHtml}

              ${ctaHtml}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 4px 0;">
              ${footerNote ? `<p style="font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:12px;color:#9ca3af;margin:0 0 5px 0;">${footerNote}</p>` : ''}
              <p style="font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:12px;color:#9ca3af;margin:0;">Source A Trade &middot; <a href="${APP_URL}" style="color:#9ca3af;text-decoration:none;">sourceatrade.com</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
