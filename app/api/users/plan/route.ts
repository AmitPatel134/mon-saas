// app/api/users/plan/route.ts
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    const user = await prisma.user.update({
      where: { email: body.email },
      data: { plan: body.plan }
    })

    return Response.json(user)
  } catch (error) {
    return Response.json({ error: "Erreur" }, { status: 500 })
  }
}