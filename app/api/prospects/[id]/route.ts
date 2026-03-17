import { prisma } from "@/lib/prisma"
import { parseProspectCriteres } from "@/lib/parseProspectCriteres"
import { getAuthUser } from "@/lib/authServer"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request)
  if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { nom, telephone, email: prospectEmail, budget, criteres, statut, rappel, biensVisites } = body

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  if (!user) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 })

  const existing = await prisma.prospect.findUnique({ where: { id } })
  if (!existing || existing.userId !== user.id) {
    return Response.json({ error: "Non autorisé" }, { status: 403 })
  }

  const data = { nom, telephone, email: prospectEmail, budget, criteres, statut, rappel, biensVisites }

  try {
    const criteresChanged = existing.criteres !== criteres
    const prospect = await prisma.prospect.update({ where: { id }, data })

    // Re-parse if criteres changed
    if (criteresChanged && prospect.criteres) {
      parseProspectCriteres(prospect.criteres, prospect.budget).then(parsed => {
        prisma.prospect.update({
          where: { id },
          data: { criteresParses: parsed as object },
        }).catch(() => {})
      }).catch(() => {})
    }

    return Response.json(prospect)
  } catch (e) {
    console.error("prospect update error", e)
    return Response.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request)
  if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  if (!user) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 })

  const prospect = await prisma.prospect.findUnique({ where: { id } })
  if (!prospect || prospect.userId !== user.id) {
    return Response.json({ error: "Non autorisé" }, { status: 403 })
  }

  await prisma.prospect.delete({ where: { id } })
  return Response.json({ success: true })
}
