"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AppPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      setEmail(session.user.email ?? null)
      setReady(true)
    })
  }, [])

  if (!ready) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* NAVBAR */}
      <nav className="border-b border-white/10 px-10 py-4 flex items-center justify-between">
        <a href="/" className="font-extrabold text-lg tracking-tight text-white">Flowly</a>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-400">{email}</span>
          <a href="/dashboard" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Dashboard</a>
        </div>
      </nav>

      {/* CONTENU */}
      <div className="flex items-center justify-center h-[calc(100vh-65px)]">
        <div className="text-center">
          <div className="w-2 h-2 rounded-full bg-fuchsia-500 mx-auto mb-6 animate-pulse" />
          <p className="text-gray-500 font-medium text-sm uppercase tracking-widest">Ici Outil IA</p>
        </div>
      </div>

    </div>
  )
}
