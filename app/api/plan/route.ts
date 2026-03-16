import { prisma } from "@/lib/prisma"
import { PLANS, isPro } from "@/lib/plans"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")
  if (!email) return Response.json({ error: "email requis" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return Response.json({
      plan: "free",
      limits: PLANS.free,
      usage: { mandats: 0, prospects: 0, generationsThisMonth: 0 },
    })
  }

  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)
  firstOfMonth.setHours(0, 0, 0, 0)

  const [mandatsCount, prospectsCount, generationsCount] = await Promise.all([
    prisma.mandat.count({ where: { userId: user.id } }),
    prisma.prospect.count({ where: { userId: user.id } }),
    prisma.generation.count({ where: { userId: user.id, createdAt: { gte: firstOfMonth } } }),
  ])

  const plan = user.plan ?? "free"
  const limits = isPro(plan) ? PLANS.pro : PLANS.free

  return Response.json({
    plan,
    limits: {
      mandats: limits.mandats === Infinity ? null : limits.mandats,
      prospects: limits.prospects === Infinity ? null : limits.prospects,
      generationsPerMonth: limits.generationsPerMonth === Infinity ? null : limits.generationsPerMonth,
    },
    usage: {
      mandats: mandatsCount,
      prospects: prospectsCount,
      generationsThisMonth: generationsCount,
    },
  })
}
