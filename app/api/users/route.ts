export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  })
  return Response.json(users)
}

export async function POST(request: Request) {
  const body = await request.json()
  const user = await prisma.user.create({
    data: { email: body.email, name: body.name }
  })
  return Response.json(user)
}
