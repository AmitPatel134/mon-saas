import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock @supabase/supabase-js avant l'import de authServer
const mockGetUser = vi.fn()
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}))

// Import après le mock
const { getAuthUser } = await import("@/lib/authServer")

function makeRequest(authHeader?: string): Request {
  const headers: Record<string, string> = {}
  if (authHeader) headers["Authorization"] = authHeader
  return new Request("http://localhost/api/test", { headers })
}

describe("getAuthUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retourne null si aucun header Authorization", async () => {
    const result = await getAuthUser(makeRequest())
    expect(result).toBeNull()
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it("retourne null si Authorization n'est pas un Bearer token", async () => {
    const result = await getAuthUser(makeRequest("Basic dXNlcjpwYXNz"))
    expect(result).toBeNull()
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it("retourne null si Supabase renvoie une erreur", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("JWT expired"),
    })
    const result = await getAuthUser(makeRequest("Bearer invalid_token"))
    expect(result).toBeNull()
  })

  it("retourne null si l'utilisateur Supabase n'a pas d'email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "abc", email: null } },
      error: null,
    })
    const result = await getAuthUser(makeRequest("Bearer valid_token"))
    expect(result).toBeNull()
  })

  it("retourne l'email si le token est valide", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "agent@test.com" } },
      error: null,
    })
    const result = await getAuthUser(makeRequest("Bearer valid_token"))
    expect(result).toEqual({ email: "agent@test.com" })
  })

  it("extrait bien le token du header (sans 'Bearer ')", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "x@x.com" } },
      error: null,
    })
    await getAuthUser(makeRequest("Bearer my_secret_token"))
    expect(mockGetUser).toHaveBeenCalledWith("my_secret_token")
  })
})
