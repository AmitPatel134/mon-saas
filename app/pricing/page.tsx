"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function PricingPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const userEmail = session.user.email ?? null
        setEmail(userEmail)
        if (userEmail) {
          fetch(`/api/plan?email=${encodeURIComponent(userEmail)}`)
            .then(r => r.json())
            .then(d => setPlan(d.plan ?? "free"))
        }
      }
      setReady(true)
    })
  }, [])

  if (!ready) return null

  async function handleSubscribe() {
    if (!email) { window.location.href = "/login"; return }
    setLoading(true)
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: "price_1TBGrbIRxjgeiG9Aa938HZFt", email })
    })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-200 bg-white sticky top-0 z-50">
        <a href="/" className="font-extrabold text-lg tracking-tight text-gray-900">Cléo</a>
        <a href={email ? "/dashboard" : "/login"} className="bg-fuchsia-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-fuchsia-700 transition-colors">
          {email ? "Mon compte" : "Connexion"}
        </a>
      </nav>

      {/* HEADER */}
      <div className="relative overflow-hidden bg-fuchsia-700 text-white px-10 pt-20 pb-20">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-fuchsia-600/50" />
        <div className="absolute bottom-[-50px] left-[20%] w-48 h-48 rounded-full bg-fuchsia-800/40" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-4xl mx-auto">
          <p className="text-xs font-bold text-fuchsia-200 uppercase tracking-widest mb-4">Tarifs</p>
          <h1 className="text-7xl font-extrabold leading-none mb-4">Simple et<br />transparent</h1>
          <p className="text-fuchsia-200 font-medium text-lg max-w-md">Commence gratuitement. Évolue quand tu es prêt. Annule quand tu veux.</p>
        </div>
      </div>

      {/* PRICING CARDS */}
      <div className="bg-gray-100 px-10 py-16">
        <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* FREE */}
          <div className="p-8 rounded-2xl bg-white border border-gray-200 flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Free</p>
              <p className="text-5xl font-extrabold text-gray-900">0€</p>
              <p className="text-sm text-gray-400 font-medium mt-1">Pour toujours</p>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-gray-600 font-medium flex-1">
              {["3 mandats", "5 prospects", "5 générations IA / mois", "Tous les types de génération", "Matching mandats / prospects"].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-300 shrink-0"></span>{f}
                </li>
              ))}
            </ul>
            {plan !== "pro" && (
              <a href="/login" className="text-center py-3 border-2 border-gray-200 rounded-full text-sm font-bold text-gray-700 hover:border-fuchsia-400 hover:text-fuchsia-600 transition-colors">
                {email ? "Mon compte" : "Commencer gratuitement"}
              </a>
            )}
          </div>

          {/* PRO */}
          <div className="relative overflow-hidden p-8 rounded-2xl bg-fuchsia-700 text-white flex flex-col gap-6">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-fuchsia-600/50" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-fuchsia-800/50" />
            <span className="relative z-10 absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
              Le plus populaire
            </span>
            <div className="relative z-10">
              <p className="text-xs font-bold text-fuchsia-200 uppercase tracking-widest mb-3">Pro</p>
              <p className="text-5xl font-extrabold">29€</p>
              <p className="text-sm text-fuchsia-200 font-medium mt-1">par mois · sans engagement</p>
            </div>
            <ul className="relative z-10 flex flex-col gap-3 text-sm text-fuchsia-100 font-medium flex-1">
              {["Mandats illimités", "Prospects illimités", "Générations IA illimitées", "Matching mandats / prospects", "6 types de génération (annonces, emails, SMS, réseaux, visites, vendeurs)", "5 portails (SeLoger, Leboncoin, Logic-Immo, PAP, Bien'ici)", "Support prioritaire"].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></span>{f}
                </li>
              ))}
            </ul>
            {plan === "pro" ? (
              <a href="/dashboard" className="relative z-10 text-center py-3 bg-white text-fuchsia-700 font-bold rounded-full text-sm hover:bg-fuchsia-50 transition-colors">
                Mon compte
              </a>
            ) : (
              <>
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="relative z-10 py-3 bg-white text-fuchsia-700 font-bold rounded-full text-sm hover:bg-fuchsia-50 transition-colors disabled:opacity-50"
                >
                  {loading ? "Chargement..." : email ? "S'abonner maintenant →" : "Se connecter pour s'abonner →"}
                </button>
                {email && <p className="relative z-10 text-xs text-fuchsia-200 font-medium text-center -mt-3">Connecté : {email}</p>}
              </>
            )}
          </div>

        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16">
          <h3 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Questions fréquentes</h3>
          <div className="flex flex-col gap-4">
            {[
              { q: "Puis-je annuler à tout moment ?", a: "Oui, sans engagement. L'annulation prend effet à la fin de la période en cours." },
              { q: "Que se passe-t-il quand j'atteins les limites du plan gratuit ?", a: "Tu ne pourras plus créer de nouveaux mandats, prospects ou générations jusqu'à la fin du mois. Tu peux passer en Pro à tout moment pour débloquer les limites." },
              { q: "Mes données sont-elles sécurisées ?", a: "Oui. Tes données sont stockées sur des serveurs sécurisés (Supabase / PostgreSQL) et ne sont jamais partagées avec des tiers." },
            ].map(item => (
              <div key={item.q} className="p-5 bg-white border border-gray-200 rounded-2xl">
                <p className="font-bold text-sm text-gray-900 mb-2">{item.q}</p>
                <p className="text-sm text-gray-500 font-medium">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
