"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function PricingPage() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setEmail(user.email ?? null)
    }
    getUser()
  }, [])

  async function handleSubscribe() {
    if (!email) { window.location.href = "/login"; return }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId: "price_1TBGrbIRxjgeiG9Aa938HZFt",
        email
      })
    })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div className="max-w-4xl mx-auto py-20 px-4">
      <h1 className="text-4xl font-medium text-center mb-12">Tarifs</h1>
      <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">

        <div className="p-8 border border-gray-200 rounded-xl flex flex-col gap-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Free</p>
          <p className="text-4xl font-medium">0€</p>
          <ul className="flex flex-col gap-2 text-sm text-gray-600 flex-1">
            <li>100 exécutions / mois</li>
            <li>3 workflows</li>
            <li>Support email</li>
          </ul>
          <a href="/login" className="text-center py-2 border border-gray-200 rounded-lg text-sm font-medium">
            Commencer
          </a>
        </div>

        <div className="p-8 border-2 border-black rounded-xl flex flex-col gap-4 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
            Populaire
          </span>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Pro</p>
          <p className="text-4xl font-medium">29€<span className="text-lg text-gray-400">/mois</span></p>
          <ul className="flex flex-col gap-2 text-sm text-gray-600 flex-1">
            <li>Illimité</li>
            <li>Workflows illimités</li>
            <li>Support prioritaire</li>
          </ul>
          <button
            onClick={handleSubscribe}
            className="py-2 bg-black text-white rounded-lg text-sm font-medium"
          >
            {email ? "S'abonner" : "Se connecter pour s'abonner"}
          </button>
        </div>

      </div>
    </div>
  )
}
