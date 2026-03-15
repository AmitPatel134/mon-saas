"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const modules = [
  {
    href: "/app/mandats",
    label: "Mandats",
    description: "Votre base de données de biens. Fiches complètes, statuts, photos et filtres.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    color: "bg-fuchsia-600",
    tag: "Module 1",
  },
  {
    href: "/app/generation",
    label: "Génération IA",
    description: "Annonces optimisées pour SeLoger, Leboncoin et Logic-Immo. Emails de relance en 1 clic.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: "bg-violet-600",
    tag: "Module 2",
  },
  {
    href: "/app/prospects",
    label: "Pipeline Prospects",
    description: "Suivez vos contacts, leurs critères, les biens visités et leur statut d'avancement.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: "bg-indigo-600",
    tag: "Module 3",
  },
]

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
      <nav className="border-b border-white/10 px-10 py-4 flex items-center justify-between sticky top-0 z-50 bg-gray-950">
        <a href="/" className="font-extrabold text-lg tracking-tight text-white">Flowly</a>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500">{email}</span>
          <a href="/dashboard" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Dashboard</a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20">

        {/* HEADER */}
        <div className="mb-16 text-center">
          <div className="w-2 h-2 rounded-full bg-fuchsia-500 mx-auto mb-6 animate-pulse" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Espace de travail</p>
          <h1 className="text-5xl font-extrabold text-white mb-4">Quel outil veux-tu utiliser ?</h1>
          <p className="text-gray-400 font-medium text-lg">Sélectionne un module pour commencer.</p>
        </div>

        {/* MODULE CARDS */}
        <div className="flex flex-col gap-4">
          {modules.map(m => (
            <a
              key={m.href}
              href={m.href}
              className="group flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/8 transition-all"
            >
              <div className={`${m.color} w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                {m.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-lg font-extrabold text-white">{m.label}</p>
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{m.tag}</span>
                </div>
                <p className="text-sm text-gray-400 font-medium">{m.description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}
