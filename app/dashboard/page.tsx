"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [plan, setPlan] = useState<string>("free")
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = "/login"; return }
      setEmail(session.user.email ?? null)
      const res = await fetch(`/api/users?email=${session.user.email}`)
      const data = await res.json()
      const user = Array.isArray(data) ? data[0] : data
      if (user?.plan) setPlan(user.plan)
      setReady(true)
    }
    getUser()
  }, [])

  if (!ready) return null

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  async function handleUpgrade() {
    if (!email) return
    setLoading(true)
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: "price_1TBGrbIRxjgeiG9Aa938HZFt", email })
    })
    const { url } = await res.json()
    window.location.href = url
  }

  async function handleDowngrade() {
    if (!email) return
    setLoading(true)
    await fetch("/api/users/plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, plan: "free" })
    })
    setPlan("free")
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-10 py-4 flex items-center justify-between">
        <a href="/" className="text-gray-900 font-extrabold text-lg tracking-tight">Cléo</a>
        <a href="/app" className="bg-gray-950 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
          Outil IA
        </a>
        <div className="flex items-center gap-4">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${plan === "pro" ? "bg-fuchsia-600 text-white" : "bg-gray-100 text-gray-600"}`}>
            {plan === "pro" ? "Pro" : "Free"}
          </span>
          <button onClick={handleLogout} className="text-gray-500 hover:text-gray-900 font-semibold text-sm transition-colors">
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900">Mon espace</h1>
          <p className="text-gray-500 font-medium mt-1 text-sm">{email}</p>
        </div>

        {/* PLAN CARD */}
        <div className={`relative overflow-hidden p-8 rounded-3xl mb-6 border ${plan === "pro" ? "bg-fuchsia-700 text-white border-fuchsia-700" : "bg-white border-gray-200"}`}>
          {plan === "pro" && (
            <>
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-fuchsia-600/50" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-fuchsia-800/50" />
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </>
          )}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan === "pro" ? "text-fuchsia-200" : "text-gray-400"}`}>
                  Plan actuel
                </p>
                <p className={`text-3xl font-extrabold ${plan === "pro" ? "text-white" : "text-gray-900"}`}>
                  {plan === "pro" ? "Pro" : "Free"}
                </p>
              </div>
              <span className={`text-4xl font-extrabold ${plan === "pro" ? "text-fuchsia-200" : "text-gray-200"}`}>
                {plan === "pro" ? "29€" : "0€"}
              </span>
            </div>

            {plan === "free" ? (
              <div>
                <p className="text-sm text-gray-500 font-medium mb-5">
                  Tu es sur le plan gratuit. Passe au Pro pour accéder à toutes les fonctionnalités.
                </p>
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full py-3 bg-fuchsia-600 text-white font-bold rounded-xl text-sm hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Chargement..." : "Passer au plan Pro — 29€/mois →"}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-fuchsia-100 font-medium mb-5">
                  Tu as accès à toutes les fonctionnalités. Merci de ta confiance !
                </p>
                <button
                  onClick={handleDowngrade}
                  disabled={loading}
                  className="text-sm text-fuchsia-200 hover:text-white font-semibold underline transition-colors disabled:opacity-50"
                >
                  {loading ? "Chargement..." : "Annuler l'abonnement"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ACCÈS OUTIL */}
        <a href="/app" className="relative overflow-hidden flex items-center justify-between p-8 rounded-3xl bg-gray-950 text-white mb-6 group hover:bg-gray-900 transition-colors">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-fuchsia-900/40" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(232,121,249,0.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10">
            <div className="w-2 h-2 rounded-full bg-fuchsia-500 mb-3 animate-pulse" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Outil IA</p>
            <p className="text-2xl font-extrabold">Accéder à l'outil →</p>
          </div>
          <div className="relative z-10 w-14 h-14 rounded-2xl bg-fuchsia-600 flex items-center justify-center group-hover:bg-fuchsia-500 transition-colors shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </a>

        {/* QUICK LINKS */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { href: "/pricing", title: "Tarifs", desc: "Voir les plans disponibles" },
            { href: "/", title: "Accueil", desc: "Retour à la landing page" },
          ].map(link => (
            <a key={link.href} href={link.href} className="p-5 bg-white rounded-2xl border border-gray-200 hover:border-fuchsia-300 transition-colors">
              <p className="text-sm font-bold text-gray-900 mb-1">{link.title}</p>
              <p className="text-xs text-gray-500 font-medium">{link.desc}</p>
            </a>
          ))}
          <a href="/support" className="p-5 bg-white rounded-2xl border border-gray-200 hover:border-fuchsia-300 transition-colors">
            <p className="text-sm font-bold text-gray-900 mb-1">Support</p>
            <p className="text-xs text-gray-500 font-medium">Contacter l'équipe</p>
          </a>
        </div>

      </div>
    </div>
  )
}
