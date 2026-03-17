import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/email", () => ({
  sendRappelEmail: vi.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}))

const mockGetUser = vi.fn()
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: mockGetUser } }),
}))

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  mandat: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  prospect: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

vi.mock("@/lib/parseProspectCriteres", () => ({
  parseProspectCriteres: vi.fn().mockResolvedValue({}),
}))

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(opts: {
  method?: string
  body?: unknown
  token?: string
  ip?: string
}): Request {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (opts.token) headers["authorization"] = `Bearer ${opts.token}`
  if (opts.ip) headers["x-forwarded-for"] = opts.ip
  return new Request("http://localhost/api/test", {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
}

function authedUser(email = "agent@test.com") {
  mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email } }, error: null })
  mockPrisma.user.findUnique.mockResolvedValue({ id: "db-user-1", email, plan: "free" })
  mockPrisma.user.upsert.mockResolvedValue({ id: "db-user-1", email, plan: "free" })
}

// ── /api/mandats ─────────────────────────────────────────────────────────────

describe("GET /api/mandats", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("retourne 401 sans token", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no token") })
    const { GET } = await import("@/app/api/mandats/route")
    const res = await GET(makeRequest({}))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("Non autorisé")
  })

  it("retourne [] si l'utilisateur n'existe pas en base", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "new@test.com" } }, error: null })
    mockPrisma.user.findUnique.mockResolvedValue(null)
    const { GET } = await import("@/app/api/mandats/route")
    const res = await GET(makeRequest({ token: "valid" }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it("retourne les mandats de l'utilisateur", async () => {
    authedUser()
    const fakeMandats = [{ id: "m1", adresse: "12 rue de la Paix", userId: "db-user-1" }]
    mockPrisma.mandat.findMany.mockResolvedValue(fakeMandats)
    const { GET } = await import("@/app/api/mandats/route")
    const res = await GET(makeRequest({ token: "valid" }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(fakeMandats)
  })
})

describe("POST /api/mandats", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("retourne 401 sans token", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no token") })
    const { POST } = await import("@/app/api/mandats/route")
    const res = await POST(makeRequest({ method: "POST", body: { adresse: "Test" }, ip: "1.2.3.4" }))
    expect(res.status).toBe(401)
  })

  it("retourne 403 si limite plan atteinte", async () => {
    authedUser()
    mockPrisma.mandat.count.mockResolvedValue(3) // plan free = 3 max
    const { POST } = await import("@/app/api/mandats/route")
    const res = await POST(makeRequest({ method: "POST", token: "valid", ip: "1.2.3.5", body: { adresse: "Test", ville: "Paris" } }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe("LIMIT_REACHED")
  })

  it("crée un mandat et retourne 201", async () => {
    authedUser()
    mockPrisma.mandat.count.mockResolvedValue(0)
    const created = { id: "m1", adresse: "12 rue Test", ville: "Paris", userId: "db-user-1" }
    mockPrisma.mandat.create.mockResolvedValue(created)
    const { POST } = await import("@/app/api/mandats/route")
    const res = await POST(makeRequest({
      method: "POST", token: "valid", ip: "1.2.3.6",
      body: { type: "Appartement", adresse: "12 rue Test", ville: "Paris", surface: 50, pieces: 2, prix: 200000, statut: "disponible" },
    }))
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ adresse: "12 rue Test" })
  })
})

// ── /api/prospects ────────────────────────────────────────────────────────────

describe("GET /api/prospects", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("retourne 401 sans token", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no token") })
    const { GET } = await import("@/app/api/prospects/route")
    const res = await GET(makeRequest({}))
    expect(res.status).toBe(401)
  })

  it("retourne [] si l'utilisateur n'existe pas", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "x@x.com" } }, error: null })
    mockPrisma.user.findUnique.mockResolvedValue(null)
    const { GET } = await import("@/app/api/prospects/route")
    const res = await GET(makeRequest({ token: "valid" }))
    expect(await res.json()).toEqual([])
  })

  it("retourne les prospects de l'utilisateur", async () => {
    authedUser()
    const fakeProspects = [{ id: "p1", nom: "Julie Martin", userId: "db-user-1" }]
    mockPrisma.prospect.findMany.mockResolvedValue(fakeProspects)
    const { GET } = await import("@/app/api/prospects/route")
    const res = await GET(makeRequest({ token: "valid" }))
    expect(await res.json()).toEqual(fakeProspects)
  })
})

describe("POST /api/prospects", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("retourne 401 sans token", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no token") })
    const { POST } = await import("@/app/api/prospects/route")
    const res = await POST(makeRequest({ method: "POST", body: { nom: "Test" }, ip: "2.2.2.2" }))
    expect(res.status).toBe(401)
  })

  it("retourne 403 si limite plan atteinte", async () => {
    authedUser()
    mockPrisma.prospect.count.mockResolvedValue(5) // plan free = 5 max
    const { POST } = await import("@/app/api/prospects/route")
    const res = await POST(makeRequest({ method: "POST", token: "valid", ip: "2.2.2.3", body: { nom: "Julie" } }))
    expect(res.status).toBe(403)
  })

  it("crée un prospect et retourne 201", async () => {
    authedUser()
    mockPrisma.prospect.count.mockResolvedValue(0)
    const created = { id: "p1", nom: "Julie Martin", userId: "db-user-1", criteres: null }
    mockPrisma.prospect.create.mockResolvedValue(created)
    const { POST } = await import("@/app/api/prospects/route")
    const res = await POST(makeRequest({
      method: "POST", token: "valid", ip: "2.2.2.4",
      body: { nom: "Julie Martin", budget: 300000, statut: "nouveau" },
    }))
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ nom: "Julie Martin" })
  })
})

// ── /api/rappels/notify ───────────────────────────────────────────────────────

describe("GET /api/rappels/notify", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("retourne 401 sans secret", async () => {
    const { GET } = await import("@/app/api/rappels/notify/route")
    const res = await GET(new Request("http://localhost/api/rappels/notify"))
    expect(res.status).toBe(401)
  })
})
