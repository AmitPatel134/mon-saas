"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignup, setIsSignup] = useState(false)
  const [message, setMessage] = useState("")

  async function handleAuth() {
  if (isSignup) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setMessage(error.message); return }

    // Créer aussi l'utilisateur dans ta table Prisma
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: email.split("@")[0] })
    })

    setMessage("Compte créé ! Tu peux te connecter.")
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMessage(error.message); return }
    window.location.href = "/dashboard"
  }
}

  return (
    <div className="max-w-sm mx-auto mt-20 flex flex-col gap-4 px-4">
      <h1 className="text-2xl font-medium">
        {isSignup ? "Créer un compte" : "Connexion"}
      </h1>
      <input
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        placeholder="Email"
        type="email"
        onChange={e => setEmail(e.target.value)}
      />
      <input
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        placeholder="Mot de passe"
        type="password"
        onChange={e => setPassword(e.target.value)}
      />
      <button
        onClick={handleAuth}
        className="bg-black text-white rounded-lg py-2 text-sm font-medium"
      >
        {isSignup ? "S'inscrire" : "Se connecter"}
      </button>
      {message && <p className="text-sm text-gray-500">{message}</p>}
      <p
        className="text-sm text-gray-400 cursor-pointer text-center"
        onClick={() => setIsSignup(!isSignup)}
      >
        {isSignup ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
      </p>
    </div>
  )
}
