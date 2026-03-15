export const dynamic = "force-dynamic"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  const body = await request.json()

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: body.priceId, quantity: 1 }],
    customer_email: body.email,
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
  })

  return Response.json({ url: session.url })
}
