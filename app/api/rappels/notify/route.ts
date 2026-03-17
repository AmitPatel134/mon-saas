import { prisma } from "@/lib/prisma"
import { sendRappelEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

// Called by a daily cron (e.g. Vercel Cron or external scheduler).
// Requires Authorization: Bearer <CRON_SECRET>
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get("authorization")
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 })
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  // Find all prospects with a rappel today, grouped by user
  const prospects = await prisma.prospect.findMany({
    where: {
      rappel: { gte: todayStart, lt: todayEnd },
    },
    include: { user: true },
  })

  if (prospects.length === 0) return Response.json({ sent: 0 })

  // Group by userId
  const byUser = new Map<string, typeof prospects>()
  for (const p of prospects) {
    const arr = byUser.get(p.userId) ?? []
    arr.push(p)
    byUser.set(p.userId, arr)
  }

  let sent = 0
  for (const [, userProspects] of byUser) {
    const user = userProspects[0].user
    if (!user?.email) continue
    try {
      await sendRappelEmail({
        to: user.email,
        agentName: user.name ?? user.email,
        rappels: userProspects.map(p => ({
          nom: p.nom,
          telephone: p.telephone,
          statut: p.statut,
          criteres: p.criteres,
        })),
      })
      sent++
    } catch (e) {
      console.error(`Failed to send rappel email to ${user.email}:`, e)
    }
  }

  return Response.json({ sent, total: byUser.size })
}
