import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ mandatId: string }> }) {
  const { mandatId } = await params
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")
  if (!email) return Response.json({ error: "email requis" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return Response.json([])

  const mandat = await prisma.mandat.findUnique({ where: { id: mandatId } })
  if (!mandat) return Response.json({ error: "mandat introuvable" }, { status: 404 })

  const prospects = await prisma.prospect.findMany({
    where: { userId: user.id },
  })

  // Score de matching pour chaque prospect
  const scored = prospects.map(p => {
    let score = 0
    const reasons: string[] = []

    // Budget : le prospect peut se permettre le bien (marge de 15%)
    const prixMin = mandat.prix * 0.85
    if (p.budget >= prixMin) {
      score += 3
      if (p.budget >= mandat.prix) {
        score += 1
        reasons.push(`Budget OK (${p.budget.toLocaleString("fr-FR")} €)`)
      } else {
        reasons.push(`Budget proche (${p.budget.toLocaleString("fr-FR")} €)`)
      }
    }

    // Critères textuels : ville et type dans les critères du prospect
    const criteres = (p.criteres ?? "").toLowerCase()
    if (criteres) {
      if (criteres.includes(mandat.ville.toLowerCase())) {
        score += 2
        reasons.push(`Cherche à ${mandat.ville}`)
      }
      if (criteres.includes(mandat.type.toLowerCase())) {
        score += 1
        reasons.push(`Cherche un ${mandat.type.toLowerCase()}`)
      }
    }

    return { ...p, score, reasons }
  })

  // Ne retourner que les prospects avec un score > 0, triés par score
  const matches = scored
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)

  return Response.json(matches)
}
