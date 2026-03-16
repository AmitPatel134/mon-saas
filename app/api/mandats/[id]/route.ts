import { prisma } from "@/lib/prisma"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, email: _email, userId: _userId, createdAt: _c, updatedAt: _u, ...data } = body

  const mandat = await prisma.mandat.update({
    where: { id },
    data,
  })
  return Response.json(mandat)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.mandat.delete({ where: { id } })
  return Response.json({ success: true })
}
