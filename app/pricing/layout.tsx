import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Commencez gratuitement avec 3 mandats, 5 prospects et 5 générations IA par mois. Passez en Pro pour lever toutes les limites à 49€/mois sans engagement.",
  openGraph: {
    title: "Tarifs — Cléo",
    description: "Commencez gratuitement. Plan Pro à 49€/mois sans engagement pour des mandats, prospects et générations illimités.",
    url: "https://tryCleo.fr/pricing",
  },
  twitter: {
    title: "Tarifs — Cléo",
    description: "Plan gratuit ou Pro à 49€/mois sans engagement.",
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
