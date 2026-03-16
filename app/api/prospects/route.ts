import { prisma } from "@/lib/prisma"
import { getLimit, isPro } from "@/lib/plans"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")
  if (!email) return Response.json({ error: "email requis" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return Response.json([])

  const prospects = await prisma.prospect.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })
  return Response.json(prospects)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { userEmail, id: _id, ...data } = body
  if (!userEmail) return Response.json({ error: "userEmail requis" }, { status: 400 })

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: { email: userEmail },
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
      data: { ...data, userId: user.id },
    })
    return Response.json(prospect, { status: 201 })
  } catch (e) {
    console.error("prospect create error", e)
    return Response.json({ error: "Erreur lors de la création" }, { status: 500 })
  }
}
