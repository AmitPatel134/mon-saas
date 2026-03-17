import { prisma } from "@/lib/prisma"
import { getLimit, isPro } from "@/lib/plans"
import { getAuthUser } from "@/lib/authServer"
import { createRateLimiter } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const rateLimit = createRateLimiter({ maxRequests: 30, windowMs: 60_000 })

export async function GET(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  if (!user) return Response.json([])

  const mandats = await prisma.mandat.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })
  return Response.json(mandats)
}

export async function POST(request: Request) {
  const limited = rateLimit(request)
  if (limited) return limited

  const authUser = await getAuthUser(request)
  if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401 })

  const body = await request.json()
  const { type, adresse, ville, surface, pieces, prix, statut, etage, exposition, chauffage, dpe, etat, charges, anneeConstruction, parking, cave, balcon, ascenseur, description } = body

  const user = await prisma.user.upsert({
    where: { email: authUser.email },
    update: {},
    create: { email: authUser.email },
  })

  if (!isPro(user.plan)) {
    const count = await prisma.mandat.count({ where: { userId: user.id } })
    const limit = getLimit(user.plan, "mandats")
    if (count >= limit) {
      return Response.json({ error: "LIMIT_REACHED", limit }, { status: 403 })
    }
  }

  try {
    const mandat = await prisma.mandat.create({
      data: { userId: user.id, type, adresse, ville, surface, pieces, prix, statut, etage, exposition, chauffage, dpe, etat, charges, anneeConstruction, parking, cave, balcon, ascenseur, description },
    })
    return Response.json(mandat, { status: 201 })
  } catch (e) {
    console.error("mandat create error", e)
    return Response.json({ error: "Erreur lors de la création" }, { status: 500 })
  }
}
