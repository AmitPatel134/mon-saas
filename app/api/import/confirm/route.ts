import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const { email, entityType, rows } = await request.json()
  if (!email || !entityType || !rows?.length) {
    return Response.json({ error: "email, entityType et rows requis" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 })

  if (entityType === "mandats") {
    await prisma.mandat.createMany({
      data: rows.map((r: Record<string, unknown>) => ({
        userId: user.id,
        type: String(r.type ?? "Autre"),
        adresse: String(r.adresse ?? ""),
        ville: String(r.ville ?? ""),
        surface: Number(r.surface) || 0,
        pieces: Number(r.pieces) || 1,
        prix: Number(r.prix) || 0,
        statut: String(r.statut ?? "disponible"),
        etage: r.etage != null ? Number(r.etage) : null,
        exposition: r.exposition ? String(r.exposition) : null,
        chauffage: r.chauffage ? String(r.chauffage) : null,
        dpe: r.dpe ? String(r.dpe) : null,
        etat: r.etat ? String(r.etat) : null,
        charges: r.charges != null ? Number(r.charges) : null,
        anneeConstruction: r.anneeConstruction != null ? Number(r.anneeConstruction) : null,
        parking: Boolean(r.parking),
        cave: Boolean(r.cave),
        balcon: Boolean(r.balcon),
        ascenseur: Boolean(r.ascenseur),
        description: r.description ? String(r.description) : null,
      })),
    })
  } else {
    await prisma.prospect.createMany({
      data: rows.map((r: Record<string, unknown>) => ({
        userId: user.id,
        nom: String(r.nom ?? ""),
        telephone: r.telephone ? String(r.telephone) : null,
        email: r.email ? String(r.email) : null,
        budget: Number(r.budget) || 0,
        criteres: r.criteres ? String(r.criteres) : null,
        statut: String(r.statut ?? "nouveau"),
      })),
    })
  }

  return Response.json({ success: true, count: rows.length })
}
