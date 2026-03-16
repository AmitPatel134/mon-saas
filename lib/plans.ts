export const PLANS = {
  free: {
    label: "Free",
    mandats: 3,
    prospects: 5,
    generationsPerMonth: 5,
  },
  pro: {
    label: "Pro",
    mandats: Infinity,
    prospects: Infinity,
    generationsPerMonth: Infinity,
  },
} as const

export type PlanName = keyof typeof PLANS

export function isPro(plan: string): boolean {
  return plan === "pro"
}

export function getLimit(plan: string, resource: "mandats" | "prospects" | "generationsPerMonth"): number {
  const p = plan in PLANS ? (plan as PlanName) : "free"
  const limit = PLANS[p][resource]
  return limit === Infinity ? 999999 : limit
}
