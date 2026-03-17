"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import LoadingScreen from "@/components/LoadingScreen"
import Toast from "@/components/Toast"

export default function ProfilPage() {
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [toast, setToast] = useState<string | null>(null)

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      const userEmail = session.user.email ?? ""
      setEmail(userEmail)
      const res = await fetch(`/api/users?email=${encodeURIComponent(userEmail)}`)
      const user = await res.json()
      if (user?.name) setName(user.name)
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
    // Vérifier le mot de passe actuel en se reconnectant
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

  if (!ready) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-40">
        <h1 className="text-lg font-extrabold text-gray-900">Mon profil</h1>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-10 flex flex-col gap-6">

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
            <button
              type="submit"
              disabled={savingName || !name.trim()}
              className="self-start px-5 py-2.5 bg-fuchsia-600 text-white text-sm font-bold rounded-xl hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
            >
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
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="self-start px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {savingPassword ? "Mise à jour..." : "Changer le mot de passe"}
            </button>
          </form>
        </div>

      </div>

      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
    </div>
  )
}
