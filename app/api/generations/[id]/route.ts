import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/authServer"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request)
  if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  if (!user) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 })

  const generation = await prisma.generation.findUnique({ where: { id } })
  if (!generation || generation.userId !== user.id) {
    return Response.json({ error: "Non autorisé" }, { status: 403 })
  }

  await prisma.generation.delete({ where: { id } })
  return Response.json({ success: true })
}
