import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

export async function POST(request: Request) {
  const { sessionId } = await request.json()
  if (!sessionId) return Response.json({ error: "sessionId requis" }, { status: 400 })

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.payment_status !== "paid") {
    return Response.json({ error: "Paiement non confirmé" }, { status: 400 })
  }

  let email = session.customer_email
  if (!email && session.customer) {
    const customer = await stripe.customers.retrieve(session.customer as string)
    if (!customer.deleted) email = (customer as Stripe.Customer).email
  }
  if (!email) return Response.json({ error: "Email introuvable" }, { status: 400 })

  await prisma.user.upsert({
    where: { email },
    update: { plan: "pro" },
    create: { email, plan: "pro" },
  })

  return Response.json({ success: true, plan: "pro" })
}
