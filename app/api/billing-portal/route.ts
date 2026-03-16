import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const { email } = await request.json()
  if (!email) return Response.json({ error: "email requis" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return Response.json({ error: "utilisateur introuvable" }, { status: 404 })

  // Find the Stripe customer by email
  const customers = await stripe.customers.list({ email, limit: 1 })
  if (customers.data.length === 0) {
    return Response.json({ error: "Aucun abonnement trouvé." }, { status: 404 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customers.data[0].id,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
  })

  return Response.json({ url: session.url })
}
