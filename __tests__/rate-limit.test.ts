import { describe, it, expect } from "vitest"
import { createRateLimiter } from "@/lib/rate-limit"

function makeRequest(ip?: string): Request {
  const headers: Record<string, string> = {}
  if (ip) headers["x-forwarded-for"] = ip
  return new Request("http://localhost/test", { headers })
}

describe("createRateLimiter", () => {
  it("allows requests under the limit", () => {
    const rateLimit = createRateLimiter({ maxRequests: 3, windowMs: 60_000 })
    expect(rateLimit(makeRequest("1.2.3.4"))).toBeNull()
    expect(rateLimit(makeRequest("1.2.3.4"))).toBeNull()
    expect(rateLimit(makeRequest("1.2.3.4"))).toBeNull()
  })

  it("blocks the request that exceeds the limit", () => {
    const rateLimit = createRateLimiter({ maxRequests: 2, windowMs: 60_000 })
    rateLimit(makeRequest("5.6.7.8"))
    rateLimit(makeRequest("5.6.7.8"))
    const result = rateLimit(makeRequest("5.6.7.8"))
    expect(result).not.toBeNull()
    expect(result?.status).toBe(429)
  })

  it("counts different IPs independently", () => {
    const rateLimit = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })
    rateLimit(makeRequest("10.0.0.1"))
    expect(rateLimit(makeRequest("10.0.0.1"))).not.toBeNull() // bloqué
    expect(rateLimit(makeRequest("10.0.0.2"))).toBeNull()     // IP différente, OK
  })

  it("falls back to 'unknown' when no IP header", () => {
    const rateLimit = createRateLimiter({ maxRequests: 2, windowMs: 60_000 })
    expect(rateLimit(makeRequest())).toBeNull()
    expect(rateLimit(makeRequest())).toBeNull()
    expect(rateLimit(makeRequest())).not.toBeNull() // "unknown" atteint la limite
  })

  it("uses the first IP when x-forwarded-for has multiple", () => {
    const rateLimit = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })
    const req1 = new Request("http://localhost/", { headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" } })
    const req2 = new Request("http://localhost/", { headers: { "x-forwarded-for": "1.1.1.1, 3.3.3.3" } })
    rateLimit(req1)
    // Même IP principale → bloqué
    expect(rateLimit(req2)).not.toBeNull()
  })

  it("returns a 429 response body with an error message", async () => {
    const rateLimit = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })
    rateLimit(makeRequest("9.9.9.9"))
    const result = rateLimit(makeRequest("9.9.9.9"))
    expect(result?.status).toBe(429)
    const body = await result?.json()
    expect(body.error).toBeTruthy()
  })
})
