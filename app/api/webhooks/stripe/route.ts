export const dynamic = "force-dynamic"

import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  const event = stripe.webhooks.constructEvent(
    body, sig, process.env.STRIPE_WEBHOOK_SECRET!
  )

  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    await prisma.user.update({
      where: { email: session.customer_email! },
      data: { plan: "pro" }
    })
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object
    const customer = await stripe.customers.retrieve(
      subscription.customer as string
    ) as any
    await prisma.user.update({
      where: { email: customer.email },
      data: { plan: "free" }
    })
  }

  return Response.json({ received: true })
}
