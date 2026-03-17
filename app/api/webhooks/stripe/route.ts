import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

async function getEmailFromCustomer(customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null
  return (customer as Stripe.Customer).email
}

async function setUserPlan(email: string, plan: "free" | "pro") {
  await prisma.user.updateMany({ where: { email }, data: { plan } })
}

async function clearSubscription(email: string) {
  await prisma.user.updateMany({ where: { email }, data: { plan: "free", planExpiresAt: null } })
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) return Response.json({ error: "Signature manquante" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return Response.json({ error: "Signature invalide" }, { status: 400 })
  }

  switch (event.type) {

    // Paiement initial réussi → passer en Pro
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const email =
        session.customer_email ??
        (session.customer ? await getEmailFromCustomer(session.customer as string) : null)
      if (email) await setUserPlan(email, "pro")
      break
    }

    // Renouvellement mensuel réussi → s'assurer que le plan reste Pro
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice
      if (!invoice.customer || invoice.billing_reason === "manual") break
      const email = await getEmailFromCustomer(invoice.customer as string)
      if (email) await setUserPlan(email, "pro")
      break
    }

    // Changement de statut d'abonnement (suspension, reprise, échec de paiement...)
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const email = await getEmailFromCustomer(sub.customer as string)
      if (!email) break
      if (["active", "trialing"].includes(sub.status)) {
        await setUserPlan(email, "pro")
      } else if (["canceled", "unpaid", "past_due", "paused"].includes(sub.status)) {
        await setUserPlan(email, "free")
      }
      break
    }

    // Abonnement résilié (fin de période après cancel_at_period_end)
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const email = await getEmailFromCustomer(sub.customer as string)
      if (email) await clearSubscription(email)
      break
    }

  }

  return Response.json({ received: true })
}
