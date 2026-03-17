import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendRappelEmail({
  to,
  agentName,
  rappels,
}: {
  to: string
  agentName: string
  rappels: { nom: string; telephone: string | null; statut: string; criteres: string | null }[]
}) {
  const listHtml = rappels
    .map(
      r => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
          <p style="margin:0;font-weight:700;font-size:14px;color:#111827;">${r.nom}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${r.criteres ?? "Aucun critère"}</p>
        </td>
        <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f3f4f6;white-space:nowrap;">
          <span style="font-size:12px;font-weight:700;color:#374151;">${r.telephone ?? "—"}</span>
        </td>
        <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f3f4f6;">
          <span style="font-size:12px;font-weight:700;background:#ede9fe;color:#7c3aed;padding:2px 8px;border-radius:9999px;">${r.statut}</span>
        </td>
      </tr>`
    )
    .join("")

  await resend.emails.send({
    from: "Cléo <noreply@cleoai.fr>",
    to,
    subject: `🔔 ${rappels.length} rappel${rappels.length > 1 ? "s" : ""} prospect${rappels.length > 1 ? "s" : ""} aujourd'hui`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#a21caf;padding:32px 32px 24px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#f0abfc;letter-spacing:.1em;text-transform:uppercase;">Cléo · Rappels du jour</p>
          <h1 style="margin:0;font-size:24px;font-weight:900;color:#fff;">
            ${rappels.length} prospect${rappels.length > 1 ? "s" : ""} à rappeler aujourd'hui
          </h1>
        </div>
        <div style="padding:32px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;padding-bottom:8px;">Prospect</th>
                <th style="text-align:left;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;padding-bottom:8px;padding-left:16px;">Téléphone</th>
                <th style="text-align:left;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;padding-bottom:8px;padding-left:16px;">Statut</th>
              </tr>
            </thead>
            <tbody>${listHtml}</tbody>
          </table>
          <div style="margin-top:28px;text-align:center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://cleoai.fr"}/app/prospects"
              style="display:inline-block;background:#a21caf;color:#fff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:9999px;text-decoration:none;">
              Ouvrir mes prospects →
            </a>
          </div>
        </div>
        <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
            Cléo · cleoai.fr — Vous recevez cet email car vous avez des rappels planifiés.
          </p>
        </div>
      </div>
    `,
  })
}
