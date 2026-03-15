"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const mandatsDemo = [
  { id: "1", type: "Appartement", adresse: "12 rue de la Paix", ville: "Paris 75002", surface: 65, prix: 580000, statut: "disponible" as const },
  { id: "2", type: "Maison", adresse: "8 allée des Roses", ville: "Lyon 69006", surface: 120, prix: 450000, statut: "sous-compromis" as const },
  { id: "3", type: "Studio", adresse: "3 place Bellecour", ville: "Lyon 69002", surface: 28, prix: 145000, statut: "vendu" as const },
]

const prospectsDemo = [
  { id: "1", nom: "Julie Martin", budget: 400000, statut: "chaud" as const, rappel: "2026-03-20", criteres: "Appt 3p, Paris" },
  { id: "2", nom: "Pierre Dubois", budget: 550000, statut: "en-recherche" as const, rappel: "", criteres: "Maison jardin, Lyon" },
  { id: "3", nom: "Camille Leroy", budget: 160000, statut: "nouveau" as const, rappel: "", criteres: "Studio, investissement" },
]

const dernierGenere = `🏠 Appartement 65m² — 3 pièces\n\n📍 12 rue de la Paix, Paris 75002\n\nBien rare sur le marché ! Découvrez ce magnifique appartement de 65m² idéalement situé...`

const statutMandat = {
  disponible: { label: "Disponible", classes: "bg-emerald-100 text-emerald-700" },
  "sous-compromis": { label: "Sous compromis", classes: "bg-amber-100 text-amber-700" },
  vendu: { label: "Vendu", classes: "bg-gray-100 text-gray-500" },
}

const statutProspect = {
  nouveau: { label: "Nouveau", classes: "bg-blue-100 text-blue-700" },
  "en-recherche": { label: "En recherche", classes: "bg-amber-100 text-amber-700" },
  chaud: { label: "Chaud 🔥", classes: "bg-orange-100 text-orange-700" },
  "signé": { label: "Signé ✓", classes: "bg-emerald-100 text-emerald-700" },
}

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

  const prospectsChauds = prospectsDemo.filter(p => p.statut === "chaud").length
  const mandatsActifs = mandatsDemo.filter(m => m.statut === "disponible").length

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* NAVBAR */}
      <nav className="border-b border-white/10 px-10 py-4 flex items-center justify-between sticky top-0 z-50 bg-gray-950">
        <a href="/" className="font-extrabold text-lg tracking-tight text-white">Cléo</a>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500">{email}</span>
          <a href="/dashboard" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Dashboard</a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { value: mandatsActifs, label: "mandats disponibles", color: "text-fuchsia-400" },
            { value: prospectsChauds, label: "prospects chauds", color: "text-orange-400" },
            { value: 1, label: "annonce générée aujourd'hui", color: "text-violet-400" },
          ].map(k => (
            <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5">
              <p className={`text-4xl font-extrabold ${k.color}`}>{k.value}</p>
              <p className="text-sm text-gray-400 font-medium mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* COCKPIT — 3 colonnes */}
        <div className="grid grid-cols-3 gap-4">

          {/* MANDATS */}
          <a href="/app/mandats" className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-fuchsia-500/50 hover:bg-white/8 transition-all flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-fuchsia-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <p className="text-sm font-extrabold text-white">Mandats</p>
              </div>
              <svg className="w-4 h-4 text-gray-600 group-hover:text-fuchsia-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {mandatsDemo.map(m => (
                <div key={m.id} className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-white truncate">{m.adresse}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${statutMandat[m.statut].classes}`}>
                      {statutMandat[m.statut].label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{m.surface}m² · {m.prix.toLocaleString("fr-FR")} €</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 font-semibold mt-4 group-hover:text-fuchsia-400 transition-colors">Gérer mes mandats →</p>
          </a>

          {/* PROSPECTS */}
          <a href="/app/prospects" className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-white/8 transition-all flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm font-extrabold text-white">Prospects</p>
              </div>
              <svg className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {prospectsDemo.map(p => (
                <div key={p.id} className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-white">{p.nom}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${statutProspect[p.statut].classes}`}>
                      {statutProspect[p.statut].label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{p.criteres}</p>
                  {p.rappel && (
                    <p className="text-xs text-amber-500 font-medium mt-1">🔔 {new Date(p.rappel).toLocaleDateString("fr-FR")}</p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 font-semibold mt-4 group-hover:text-indigo-400 transition-colors">Voir mon pipeline →</p>
          </a>

          {/* GÉNÉRATION */}
          <a href="/app/generation" className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-violet-500/50 hover:bg-white/8 transition-all flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm font-extrabold text-white">Génération IA</p>
              </div>
              <svg className="w-4 h-4 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex-1 bg-white/5 rounded-xl p-3 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-violet-900/60 text-violet-300">SeLoger</span>
                <span className="text-xs text-gray-600 font-medium">dernière génération</span>
              </div>
              <p className="text-xs text-gray-400 font-medium leading-relaxed line-clamp-5 whitespace-pre-line">{dernierGenere}</p>
            </div>
            <p className="text-xs text-gray-600 font-semibold mt-2 group-hover:text-violet-400 transition-colors">Générer une annonce →</p>
          </a>

        </div>

        {/* Label discret */}
        <p className="text-center text-xs text-gray-700 font-medium mt-8">Sélectionne un outil pour continuer</p>

      </div>
    </div>
  )
}
