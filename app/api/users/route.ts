import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

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

export async function POST(request: Request) {
  const body = await request.json()
  const user = await prisma.user.upsert({
    where: { email: body.email },
    update: {},
    create: { email: body.email, name: body.name },
  })
  return Response.json(user)
}
