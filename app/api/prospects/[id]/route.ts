import { prisma } from "@/lib/prisma"
import { parseProspectCriteres } from "@/lib/parseProspectCriteres"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, userId: _userId, createdAt: _c, updatedAt: _u, criteresParses: _cp, ...data } = body

  try {
    const existing = await prisma.prospect.findUnique({ where: { id }, select: { criteres: true } })
    const criteresChanged = existing?.criteres !== data.criteres

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

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.prospect.delete({ where: { id } })
  return Response.json({ success: true })
}
