"use client"
import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

type View = "login" | "signup" | "forgot" | "forgot-sent" | "signup-sent"

export default function LoginPage() {
  const [view, setView] = useState<View>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [fading, setFading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  function switchView(next: View) {
    setFading(true)
    setTimeout(() => {
      setView(next)
      setEmail("")
      setPassword("")
      setMessage("")
      if (emailRef.current) emailRef.current.value = ""
      if (passwordRef.current) passwordRef.current.value = ""
      setFading(false)
    }, 180)
  }

  async function handleAuth() {
    setLoading(true)
    if (view === "signup") {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setMessage(error.message); setLoading(false); return }
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: email.split("@")[0] })
      })
      switchView("signup-sent")
      setLoading(false)
      return
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMessage(error.message); setLoading(false); return }
      window.location.href = "/dashboard"
    }
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) { setMessage("Saisis ton adresse email."); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    setLoading(false)
    if (error) { setMessage(error.message); return }
    switchView("forgot-sent")
  }

  async function handleOAuth(provider: "google" | "github") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div className="relative min-h-screen bg-fuchsia-700 flex items-center justify-center px-4 overflow-hidden">
      {/* Décorations */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-fuchsia-600/50" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-fuchsia-800/50" />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative w-full max-w-sm">
        <a href="/" className="block text-center text-white font-extrabold text-2xl mb-10 tracking-tight">Cléo</a>
        <div className="bg-white rounded-3xl p-8 shadow-xl">

          {/* Vue: Inscription — confirmation email */}
          {view === "signup-sent" ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-fuchsia-600 flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Vérifie ta boîte mail</h1>
              <p className="text-sm text-gray-500 font-medium mb-1">Un email de confirmation a été envoyé à</p>
              <p className="text-sm font-bold text-gray-900 mb-6">{email}</p>
              <p className="text-xs text-gray-400 font-medium mb-8">Clique sur le lien dans l&apos;email pour activer ton compte, puis reviens te connecter.</p>
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-fuchsia-600 text-white font-bold rounded-xl text-sm hover:bg-fuchsia-700 transition-colors mb-3"
              >
                Ouvrir ma boîte mail →
              </a>
              <button
                onClick={() => switchView("login")}
                className="text-xs text-gray-400 font-semibold hover:text-fuchsia-600 transition-colors"
              >
                Retour à la connexion
              </button>
            </div>
          ) : view === "forgot-sent" ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-fuchsia-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Email envoyé !</h1>
              <p className="text-sm text-gray-500 font-medium mb-6">Vérifie ta boîte mail et clique sur le lien pour réinitialiser ton mot de passe.</p>
              <button onClick={() => switchView("login")} className="text-xs text-fuchsia-600 font-semibold hover:text-fuchsia-700">
                ← Retour à la connexion
              </button>
            </div>
          ) : view === "forgot" ? (
            /* Vue: Mot de passe oublié */
            <div
              className="transition-all duration-200 ease-in-out"
              style={{ opacity: fading ? 0 : 1, transform: fading ? 'translateY(6px)' : 'translateY(0)' }}
            >
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Mot de passe oublié</h1>
              <p className="text-sm text-gray-500 font-medium mb-6">On t&apos;envoie un lien pour le réinitialiser.</p>
              <div className="flex flex-col gap-3">
                <input
                  ref={emailRef}
                  type="email"
                  placeholder="ton@email.com"
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleForgotPassword()}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors"
                />
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="w-full py-3 bg-fuchsia-600 text-white font-bold rounded-xl text-sm hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Envoi..." : "Envoyer le lien →"}
                </button>
              </div>
              {message && <p className="text-xs text-center mt-4 text-red-500 font-medium">{message}</p>}
              <p
                onClick={() => switchView("login")}
                className="text-xs text-center mt-5 text-gray-400 font-semibold cursor-pointer hover:text-fuchsia-600 transition-colors"
              >
                ← Retour à la connexion
              </p>
            </div>
          ) : (
            /* Vue: Login / Signup */
            <>
              <div
                className="transition-all duration-200 ease-in-out"
                style={{ opacity: fading ? 0 : 1, transform: fading ? 'translateY(6px)' : 'translateY(0)' }}
              >
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
                  {view === "signup" ? "Créer un compte" : "Se connecter"}
                </h1>
                <p className="text-sm text-gray-500 font-medium mb-6">
                  {view === "signup" ? "Commence gratuitement, sans carte bancaire." : "Connecte-toi à ton espace Cléo."}
                </p>
              </div>

              {/* Boutons OAuth */}
              <div className="flex flex-col gap-2 mb-5">
                <button
                  onClick={() => handleOAuth("google")}
                  className="flex items-center justify-center gap-3 w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.4l-6.5-5.5C29.7 35 27 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.5 5.5C37.2 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/>
                  </svg>
                  Continuer avec Google
                </button>
              </div>

              {/* Séparateur */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">ou avec un email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Champs email/password */}
              <div
                className="flex flex-col gap-3 transition-all duration-200 ease-in-out"
                style={{ opacity: fading ? 0 : 1, transform: fading ? 'translateY(6px)' : 'translateY(0)' }}
              >
                <input
                  ref={emailRef}
                  type="email"
                  placeholder="ton@email.com"
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && passwordRef.current?.focus()}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors"
                />
                <input
                  ref={passwordRef}
                  type="password"
                  placeholder="Mot de passe"
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAuth()}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors"
                />
                <button
                  onClick={handleAuth}
                  disabled={loading}
                  className="w-full py-3 bg-fuchsia-600 text-white font-bold rounded-xl text-sm hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Chargement..." : view === "signup" ? "Créer mon compte →" : "Se connecter →"}
                </button>
              </div>

              {view === "login" && (
                <p
                  onClick={() => switchView("forgot")}
                  className="text-xs text-center mt-3 text-gray-400 font-semibold cursor-pointer hover:text-fuchsia-600 transition-colors"
                >
                  Mot de passe oublié ?
                </p>
              )}

              {message && (
                <p className="text-xs text-center mt-4 text-gray-600 font-medium">{message}</p>
              )}

              <p
                onClick={() => switchView(view === "signup" ? "login" : "signup")}
                className="text-xs text-center mt-5 text-gray-400 font-semibold cursor-pointer hover:text-fuchsia-600 transition-colors"
              >
                {view === "signup" ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire gratuitement"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
