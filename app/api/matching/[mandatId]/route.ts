import { prisma } from "@/lib/prisma"
import { scoreMatching } from "@/lib/scoreMatching"
import { parseProspectCriteres } from "@/lib/parseProspectCriteres"
import type { CriteresParses } from "@/lib/parseProspectCriteres"
import { getAuthUser } from "@/lib/authServer"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ mandatId: string }> }) {
  const authUser = await getAuthUser(request)
  if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401 })

  const { mandatId } = await params

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  if (!user) return Response.json([])

  const mandat = await prisma.mandat.findUnique({ where: { id: mandatId } })
  if (!mandat) return Response.json({ error: "mandat introuvable" }, { status: 404 })
  if (mandat.userId !== user.id) return Response.json({ error: "Non autorisé" }, { status: 403 })

  const prospects = await prisma.prospect.findMany({ where: { userId: user.id } })

  // Score each prospect
  const scored = await Promise.all(
    prospects.map(async p => {
      // Use stored criteresParses, or parse on-the-fly and save for next time
      let parsed = p.criteresParses as CriteresParses | null
      if (!parsed && p.criteres) {
        parsed = await parseProspectCriteres(p.criteres, p.budget)
        // Persist for next time (fire-and-forget)
        prisma.prospect.update({
          where: { id: p.id },
          data: { criteresParses: parsed as object },
        }).catch(() => {})
      }

      if (!parsed) {
        // No criteria at all — score based on budget only
        const budgetScore =
          p.budget >= mandat.prix ? 30 :
          p.budget >= mandat.prix * 0.92 ? 22 :
          p.budget >= mandat.prix * 0.85 ? 12 : 0
        return { ...p, score: budgetScore, reasons: budgetScore > 0 ? [`Budget: ${p.budget.toLocaleString("fr-FR")} €`] : [] }
      }

      const { score, reasons } = scoreMatching(mandat, parsed, p.budget)
      return { ...p, score, reasons }
    })
  )

  // Return prospects with score >= 20, sorted by score desc
  const matches = scored
    .filter(p => p.score >= 20)
    .sort((a, b) => b.score - a.score)

  return Response.json(matches)
}
