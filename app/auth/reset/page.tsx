"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase handles the token from the URL hash automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleReset() {
    if (!password) { setMessage("Saisis un nouveau mot de passe."); return }
    if (password !== confirm) { setMessage("Les mots de passe ne correspondent pas."); return }
    if (password.length < 6) { setMessage("Le mot de passe doit faire au moins 6 caractères."); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setMessage(error.message); return }
    setDone(true)
    setTimeout(() => { window.location.href = "/app" }, 2000)
  }

  return (
    <div className="relative min-h-screen bg-fuchsia-700 flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-fuchsia-600/50" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-fuchsia-800/50" />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative w-full max-w-sm">
        <a href="/" className="block text-center text-white font-extrabold text-2xl mb-10 tracking-tight">CleoAI</a>
        <div className="bg-white rounded-3xl p-8 shadow-xl">

          {done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Mot de passe mis à jour !</h1>
              <p className="text-sm text-gray-500 font-medium">Tu vas être redirigé vers ton espace...</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-fuchsia-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-500 font-medium">Vérification du lien...</p>
              <p className="text-xs text-gray-400 mt-2">Si cette page reste bloquée, le lien est peut-être expiré.</p>
              <a href="/login" className="text-xs text-fuchsia-600 font-semibold hover:text-fuchsia-700 mt-4 block">
                ← Retour à la connexion
              </a>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Nouveau mot de passe</h1>
              <p className="text-sm text-gray-500 font-medium mb-6">Choisis un nouveau mot de passe pour ton compte.</p>
              <div className="flex flex-col gap-3">
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors"
                />
                <input
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors"
                />
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="w-full py-3 bg-fuchsia-600 text-white font-bold rounded-xl text-sm hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Mise à jour..." : "Mettre à jour →"}
                </button>
              </div>
              {message && <p className="text-xs text-center mt-4 text-red-500 font-medium">{message}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
