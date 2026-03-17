import { prisma } from "@/lib/prisma"
import { getLimit, isPro } from "@/lib/plans"
import { parseProspectCriteres } from "@/lib/parseProspectCriteres"
import { getAuthUser } from "@/lib/authServer"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  if (!user) return Response.json([])

  const prospects = await prisma.prospect.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })
  return Response.json(prospects)
}

export async function POST(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401 })

  const body = await request.json()
  const { nom, telephone, email: prospectEmail, budget, criteres, statut, rappel, biensVisites } = body

  const user = await prisma.user.upsert({
    where: { email: authUser.email },
    update: {},
    create: { email: authUser.email },
  })

  if (!isPro(user.plan)) {
    const count = await prisma.prospect.count({ where: { userId: user.id } })
    const limit = getLimit(user.plan, "prospects")
    if (count >= limit) {
      return Response.json({ error: "LIMIT_REACHED", limit }, { status: 403 })
    }
  }

  try {
    const prospect = await prisma.prospect.create({
      data: { userId: user.id, nom, telephone, email: prospectEmail, budget, criteres, statut, rappel, biensVisites },
    })

    // Parse criteria in background (don't block response)
    if (prospect.criteres) {
      parseProspectCriteres(prospect.criteres, prospect.budget).then(parsed => {
        prisma.prospect.update({
          where: { id: prospect.id },
          data: { criteresParses: parsed as object },
        }).catch(() => {})
      }).catch(() => {})
    }

    return Response.json(prospect, { status: 201 })
  } catch (e) {
    console.error("prospect create error", e)
    return Response.json({ error: "Erreur lors de la création" }, { status: 500 })
  }
}
