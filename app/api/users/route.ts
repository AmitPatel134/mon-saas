import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/authServer"

export async function GET(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  return Response.json(user)
}

export async function PATCH(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401 })

  const { name } = await request.json()
  if (!name) return Response.json({ error: "name requis" }, { status: 400 })

  const user = await prisma.user.update({ where: { email: authUser.email }, data: { name } })
  return Response.json(user)
}

export async function POST(request: Request) {
  const body = await request.json()
  const user = await prisma.user.upsert({
    where: { email: body.email },
    update: {},
    create: { email: body.email, name: body.name },
  })
  return Response.json(user)
}
