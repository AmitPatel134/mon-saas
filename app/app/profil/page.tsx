"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import LoadingScreen from "@/components/LoadingScreen"
import Toast from "@/components/Toast"

export default function ProfilPage() {
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [plan, setPlan] = useState("free")
  const [toast, setToast] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      const userEmail = session.user.email ?? ""
      setEmail(userEmail)
      const user = await fetch(`/api/users?email=${encodeURIComponent(userEmail)}`).then(r => r.json())
      if (user?.name) setName(user.name)
      if (user?.plan) setPlan(user.plan)
      setReady(true)
    })
  }, [])

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSavingName(true)
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: name.trim() }),
    })
    setSavingName(false)
    if (res.ok) showToast("Nom mis à jour ✓")
    else showToast("Erreur lors de la mise à jour")
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { showToast("Les mots de passe ne correspondent pas"); return }
    if (newPassword.length < 6) { showToast("Mot de passe trop court (6 caractères min)"); return }
    setSavingPassword(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (signInError) { showToast("Mot de passe actuel incorrect"); setSavingPassword(false); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    if (error) showToast("Erreur : " + error.message)
    else {
      showToast("Mot de passe mis à jour ✓")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  async function handleBillingPortal() {
    setBillingLoading(true)
    const res = await fetch("/api/billing-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const { url, error } = await res.json()
    setBillingLoading(false)
    if (error) { showToast(error); return }
    window.location.href = url
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  if (!ready) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-40">
        <h1 className="text-lg font-extrabold text-gray-900">Mon profil</h1>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-10 flex flex-col gap-6">

        {/* Plan */}
        <div className={`relative overflow-hidden p-6 rounded-2xl border ${plan === "pro" ? "bg-fuchsia-700 text-white border-fuchsia-700" : "bg-white border-gray-200"}`}>
          {plan === "pro" && (
            <>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-fuchsia-600/50" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-fuchsia-800/50" />
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </>
          )}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan === "pro" ? "text-fuchsia-200" : "text-gray-400"}`}>Plan actuel</p>
                <p className={`text-2xl font-extrabold ${plan === "pro" ? "text-white" : "text-gray-900"}`}>{plan === "pro" ? "Pro" : "Free"}</p>
              </div>
              <span className={`text-3xl font-extrabold ${plan === "pro" ? "text-fuchsia-200" : "text-gray-200"}`}>{plan === "pro" ? "49€" : "0€"}</span>
            </div>
            {plan === "free" ? (
              <a href="/pricing" className="inline-block px-4 py-2.5 bg-fuchsia-600 text-white text-sm font-bold rounded-xl hover:bg-fuchsia-700 transition-colors">
                Passer au plan Pro — 49€/mois →
              </a>
            ) : (
              <button
                onClick={handleBillingPortal}
                disabled={billingLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {billingLoading ? "Chargement..." : "Consulter l'abonnement"}
              </button>
            )}
          </div>
        </div>

        {/* Infos générales */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Informations</p>
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Adresse email</label>
            <p className="text-sm font-medium text-gray-400 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200">{email}</p>
          </div>
          <form onSubmit={handleSaveName} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Prénom et nom</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex : Jean Dupont"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors"
              />
            </div>
            <button type="submit" disabled={savingName || !name.trim()} className="self-start px-5 py-2.5 bg-fuchsia-600 text-white text-sm font-bold rounded-xl hover:bg-fuchsia-700 transition-colors disabled:opacity-50">
              {savingName ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </div>

        {/* Mot de passe */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Changer le mot de passe</p>
          <form onSubmit={handleSavePassword} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Mot de passe actuel</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Nouveau mot de passe</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Confirmer le nouveau mot de passe</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors" />
            </div>
            <button type="submit" disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="self-start px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50">
              {savingPassword ? "Mise à jour..." : "Changer le mot de passe"}
            </button>
          </form>
        </div>

        {/* Déconnexion */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Session</p>
          <button onClick={handleLogout} className="px-5 py-2.5 border-2 border-gray-200 text-sm font-bold text-gray-600 rounded-xl hover:border-gray-400 hover:text-gray-900 transition-colors">
            Se déconnecter
          </button>
        </div>

      </div>

      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
    </div>
  )
}
