import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  if (email) {
    const user = await prisma.user.findUnique({ where: { email } })
    return Response.json(user)
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } })
  return Response.json(users)
}

export async function PATCH(request: Request) {
  const { email, name } = await request.json()
  if (!email || !name) return Response.json({ error: "email et name requis" }, { status: 400 })
  const user = await prisma.user.update({ where: { email }, data: { name } })
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
