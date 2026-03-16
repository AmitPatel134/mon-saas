import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")
  if (!email) return Response.json({ error: "email requis" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return Response.json({
      mandats: [],
      prospects: [],
      dernieresGenerations: [],
      rappels: [],
      stats: { mandatsDisponibles: 0, prospectsChauds: 0, generationsAujourdhui: 0 },
    })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [mandats, prospects, dernieresGenerations, generationsAujourdhui, mandatsDisponibles, prospectsChauds, rappels] = await Promise.all([
    prisma.mandat.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.prospect.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.generation.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 2 }),
    prisma.generation.count({ where: { userId: user.id, createdAt: { gte: today } } }),
    prisma.mandat.count({ where: { userId: user.id, statut: "disponible" } }),
    prisma.prospect.count({ where: { userId: user.id, statut: "chaud" } }),
    prisma.prospect.findMany({ where: { userId: user.id, rappel: { not: null, lte: tomorrow } }, orderBy: { rappel: "asc" } }),
  ])

  return Response.json({
    mandats,
    prospects,
    dernieresGenerations,
    rappels,
    stats: { mandatsDisponibles, prospectsChauds, generationsAujourdhui },
  })
}
