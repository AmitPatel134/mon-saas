import { describe, it, expect } from "vitest"

// Test que la config next.config.ts définit bien les headers de sécurité attendus
describe("Security headers (next.config)", () => {
  it("définit X-Frame-Options: DENY", async () => {
    const { default: nextConfig } = await import("@/next.config")
    const headersList = await nextConfig.headers?.()
    const headers = headersList?.[0]?.headers ?? []
    const found = headers.find(h => h.key === "X-Frame-Options")
    expect(found?.value).toBe("DENY")
  })

  it("définit X-Content-Type-Options: nosniff", async () => {
    const { default: nextConfig } = await import("@/next.config")
    const headersList = await nextConfig.headers?.()
    const headers = headersList?.[0]?.headers ?? []
    const found = headers.find(h => h.key === "X-Content-Type-Options")
    expect(found?.value).toBe("nosniff")
  })

  it("définit Referrer-Policy", async () => {
    const { default: nextConfig } = await import("@/next.config")
    const headersList = await nextConfig.headers?.()
    const headers = headersList?.[0]?.headers ?? []
    const found = headers.find(h => h.key === "Referrer-Policy")
    expect(found?.value).toBeTruthy()
  })

  it("définit X-XSS-Protection", async () => {
    const { default: nextConfig } = await import("@/next.config")
    const headersList = await nextConfig.headers?.()
    const headers = headersList?.[0]?.headers ?? []
    const found = headers.find(h => h.key === "X-XSS-Protection")
    expect(found?.value).toBeTruthy()
  })

  it("applique les headers sur toutes les routes (source: /(.*))", async () => {
    const { default: nextConfig } = await import("@/next.config")
    const headersList = await nextConfig.headers?.()
    expect(headersList?.[0]?.source).toBe("/(.*)")
  })
})
