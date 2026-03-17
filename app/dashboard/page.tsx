"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import LoadingScreen from "@/components/LoadingScreen"

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [plan, setPlan] = useState<string>("free")
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [confirm, setConfirm] = useState<"logout" | "downgrade" | null>(null)

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = "/login"; return }
      const userEmail = session.user.email ?? ""
      setEmail(userEmail)

      // Vérification post-paiement Stripe
      const params = new URLSearchParams(window.location.search)
      const sessionId = params.get("session_id")
      if (sessionId) {
        await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
        window.history.replaceState({}, "", "/dashboard")
      }

      const res = await fetch(`/api/users?email=${encodeURIComponent(userEmail)}`)
      const data = await res.json()
      const user = Array.isArray(data) ? data[0] : data
      if (user?.plan) setPlan(user.plan)
      if (user?.planExpiresAt) setPlanExpiresAt(user.planExpiresAt)
      setReady(true)
    }
    getUser()
  }, [])

  if (!ready) return <LoadingScreen />

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

  async function handleBillingPortal() {
    if (!email) return
    setBillingLoading(true)
    const res = await fetch("/api/billing-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const { url, error } = await res.json()
    setBillingLoading(false)
    if (error) { alert(error); return }
    window.location.href = url
  }

  async function handleDowngrade() {
    if (!email) return
    setConfirm(null)
    setLoading(true)
    const res = await fetch("/api/cancel-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (data.expiresAt) setPlanExpiresAt(data.expiresAt)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-10 py-4 flex items-center justify-between">
        <a href="/" className="text-gray-900 font-extrabold text-lg tracking-tight">Cléo</a>

        {/* Centre */}
        <div className="flex items-center gap-6 text-sm font-semibold text-gray-500">
          <a href="/pricing" className="hover:text-gray-900 transition-colors">Tarifs</a>
          <a href="/" className="hover:text-gray-900 transition-colors">Accueil</a>
          <a href="/support" className="hover:text-gray-900 transition-colors">Support</a>
        </div>

        {/* Droite */}
        <div className="flex items-center gap-3">
          <button onClick={() => setConfirm("logout")} className="text-sm font-bold text-gray-600 px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 hover:text-gray-900 transition-colors">
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
                {planExpiresAt ? (
                  <p className="text-sm text-fuchsia-100 font-medium mb-5">
                    Abonnement annulé. Tu gardes l&apos;accès Pro jusqu&apos;au{" "}
                    <span className="font-bold text-white">
                      {new Date(planExpiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>.
                  </p>
                ) : (
                  <p className="text-sm text-fuchsia-100 font-medium mb-5">
                    Tu as accès à toutes les fonctionnalités. Merci de ta confiance !
                  </p>
                )}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBillingPortal}
                    disabled={billingLoading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {billingLoading ? "Chargement..." : "Mes factures"}
                  </button>
                  {!planExpiresAt && (
                    <button
                      onClick={() => setConfirm("downgrade")}
                      disabled={loading}
                      className="text-sm text-fuchsia-200 hover:text-white font-semibold underline transition-colors disabled:opacity-50"
                    >
                      {loading ? "Chargement..." : "Annuler l'abonnement"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>


      </div>

      {/* MODAL CONFIRMATION */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl">
            {confirm === "logout" ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">Se déconnecter ?</h3>
                <p className="text-sm text-gray-500 font-medium mb-6">Tu seras redirigé vers la page de connexion.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirm(null)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-gray-400 transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleLogout} className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-gray-700 transition-colors">
                    Se déconnecter
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">Annuler l&apos;abonnement Pro ?</h3>
                <p className="text-sm text-gray-500 font-medium mb-6">
                  Ton abonnement ne sera pas renouvelé. Tu gardes l&apos;accès Pro jusqu&apos;à la fin de ta période en cours, puis tu retourneras au plan Free.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirm(null)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-gray-400 transition-colors">
                    Garder le Pro
                  </button>
                  <button onClick={handleDowngrade} disabled={loading} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition-colors disabled:opacity-50">
                    {loading ? "Chargement..." : "Confirmer l'annulation"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
