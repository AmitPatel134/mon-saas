import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/authServer"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request)
  if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { type, adresse, ville, surface, pieces, prix, statut, etage, exposition, chauffage, dpe, etat, charges, anneeConstruction, parking, cave, balcon, ascenseur, description } = body

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  if (!user) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 })

  const mandat = await prisma.mandat.findUnique({ where: { id } })
  if (!mandat || mandat.userId !== user.id) {
    return Response.json({ error: "Non autorisé" }, { status: 403 })
  }

  const updated = await prisma.mandat.update({
    where: { id },
    data: { type, adresse, ville, surface, pieces, prix, statut, etage, exposition, chauffage, dpe, etat, charges, anneeConstruction, parking, cave, balcon, ascenseur, description },
  })
  return Response.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request)
  if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  if (!user) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 })

  const mandat = await prisma.mandat.findUnique({ where: { id } })
  if (!mandat || mandat.userId !== user.id) {
    return Response.json({ error: "Non autorisé" }, { status: 403 })
  }

  await prisma.mandat.delete({ where: { id } })
  return Response.json({ success: true })
}
