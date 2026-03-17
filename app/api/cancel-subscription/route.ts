import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const { email } = await request.json()
  if (!email) return Response.json({ error: "email requis" }, { status: 400 })

  const customers = await stripe.customers.list({ email, limit: 1 })
  if (customers.data.length === 0) {
    return Response.json({ error: "Aucun abonnement trouvé" }, { status: 404 })
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customers.data[0].id,
    status: "active",
    limit: 1,
  })
  if (subscriptions.data.length === 0) {
    return Response.json({ error: "Aucun abonnement actif trouvé" }, { status: 404 })
  }

  const sub = await stripe.subscriptions.update(subscriptions.data[0].id, {
    cancel_at_period_end: true,
  })

  const periodEnd = sub.items.data[0]?.current_period_end
  if (!periodEnd) return Response.json({ error: "Impossible de récupérer la date de fin" }, { status: 500 })
  const expiresAt = new Date(periodEnd * 1000)

  await prisma.user.updateMany({
    where: { email },
    data: { planExpiresAt: expiresAt },
  })

  return Response.json({ success: true, expiresAt })
}
