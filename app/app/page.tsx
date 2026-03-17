"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import LoadingScreen from "@/components/LoadingScreen"

interface Mandat {
  id: string
  type: string
  adresse: string
  ville: string
  surface: number
  prix: number
  statut: string
}

interface Prospect {
  id: string
  nom: string
  budget: number
  statut: string
  rappel?: string | null
  criteres?: string
}

interface Generation {
  texte: string
  portail: string | null
  type: string
}

interface DashboardData {
  mandats: Mandat[]
  prospects: Prospect[]
  dernieresGenerations: Generation[]
  rappels: Prospect[]
  stats: { mandatsDisponibles: number; prospectsChauds: number; generationsAujourdhui: number }
}

const statutMandat: Record<string, { label: string; classes: string }> = {
  disponible: { label: "Disponible", classes: "bg-emerald-100 text-emerald-700" },
  "sous-compromis": { label: "Sous compromis", classes: "bg-amber-100 text-amber-700" },
  vendu: { label: "Vendu", classes: "bg-gray-100 text-gray-500" },
}

const statutProspect: Record<string, { label: string; classes: string }> = {
  nouveau: { label: "Nouveau", classes: "bg-blue-100 text-blue-700" },
  "en-recherche": { label: "En recherche", classes: "bg-amber-100 text-amber-700" },
  chaud: { label: "Chaud 🔥", classes: "bg-orange-100 text-orange-700" },
  "signé": { label: "Signé ✓", classes: "bg-emerald-100 text-emerald-700" },
}

export default function AppPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [data, setData] = useState<DashboardData>({
    mandats: [],
    prospects: [],
    dernieresGenerations: [],
    rappels: [],
    stats: { mandatsDisponibles: 0, prospectsChauds: 0, generationsAujourdhui: 0 },
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      setEmail(session.user.email ?? "")
      const token = session.access_token
      fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { setData(d); setReady(true) })
    })
  }, [])

  if (!ready) return <LoadingScreen />

  const { mandats, prospects, dernieresGenerations, rappels, stats } = data

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {rappels.length > 0 && (
        <a href="/app/prospects" className="flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-10 py-3 hover:bg-amber-100 transition-colors">
          <span className="text-base">🔔</span>
          <p className="text-sm font-bold text-amber-800">
            {rappels.length === 1
              ? `${rappels[0].nom} — rappel prévu aujourd'hui`
              : `${rappels.length} prospects à rappeler — ${rappels.slice(0, 3).map(r => r.nom).join(", ")}${rappels.length > 3 ? "…" : ""}`
            }
          </p>
          <span className="ml-auto text-xs font-bold text-amber-600">Voir →</span>
        </a>
      )}

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* MATCHING BANNER */}
        <a href="/app/matching" className="group flex items-center justify-between bg-fuchsia-950/40 border border-fuchsia-500/20 rounded-2xl px-6 py-4 mb-4 hover:border-fuchsia-500/50 hover:bg-fuchsia-950/60 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-fuchsia-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">Matching mandats / prospects</p>
              <p className="text-xs text-fuchsia-300/60 font-medium">Trouve automatiquement les acheteurs qui correspondent à chaque bien</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors shrink-0">
            Lancer le matching
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </a>

        <div className="grid grid-cols-3 gap-4">

          {/* MANDATS */}
          <a href="/app/mandats" className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-fuchsia-500/40 hover:bg-white/[0.07] transition-all flex flex-col min-h-[520px]">
            {/* Header stat */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-fuchsia-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <p className="text-sm font-extrabold text-white">Mandats</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-fuchsia-400 leading-none">{stats.mandatsDisponibles}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">disponible{stats.mandatsDisponibles !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {/* Liste */}
            <div className="flex flex-col gap-2 p-4 flex-1">
              {mandats.length === 0 ? (
                <p className="text-xs text-gray-600 font-medium py-6 text-center">Aucun mandat enregistré</p>
              ) : mandats.map(m => (
                <div key={m.id} className="bg-white/5 rounded-2xl px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-white truncate">{m.adresse}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${(statutMandat[m.statut] ?? statutMandat.disponible).classes}`}>
                      {(statutMandat[m.statut] ?? statutMandat.disponible).label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{m.surface}m² · {m.prix.toLocaleString("fr-FR")} €</p>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-gray-600 font-semibold group-hover:text-fuchsia-400 transition-colors">Gérer mes mandats</p>
              <svg className="w-4 h-4 text-gray-600 group-hover:text-fuchsia-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          {/* PROSPECTS */}
          <a href="/app/prospects" className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-indigo-500/40 hover:bg-white/[0.07] transition-all flex flex-col min-h-[520px]">
            {/* Header stat */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm font-extrabold text-white">Prospects</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-orange-400 leading-none">{stats.prospectsChauds}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">chaud{stats.prospectsChauds !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {/* Liste */}
            <div className="flex flex-col gap-2 p-4 flex-1">
              {prospects.length === 0 ? (
                <p className="text-xs text-gray-600 font-medium py-6 text-center">Aucun prospect enregistré</p>
              ) : prospects.map(p => (
                <div key={p.id} className="bg-white/5 rounded-2xl px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-white">{p.nom}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${(statutProspect[p.statut] ?? statutProspect.nouveau).classes}`}>
                      {(statutProspect[p.statut] ?? statutProspect.nouveau).label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{p.criteres}</p>
                  {p.rappel && (
                    <p className="text-xs text-amber-500 font-medium mt-0.5">🔔 {new Date(p.rappel).toLocaleDateString("fr-FR")}</p>
                  )}
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-gray-600 font-semibold group-hover:text-indigo-400 transition-colors">Voir mon pipeline</p>
              <svg className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          {/* GÉNÉRATION */}
          <a href="/app/generation" className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-violet-500/40 hover:bg-white/[0.07] transition-all flex flex-col min-h-[520px]">
            {/* Header stat */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm font-extrabold text-white">Génération IA</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-violet-400 leading-none">{stats.generationsAujourdhui}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">aujourd&apos;hui</p>
              </div>
            </div>
            {/* Dernières générations */}
            <div className="p-4 flex-1 flex flex-col gap-3">
              {dernieresGenerations.length === 0 ? (
                <div className="flex items-center justify-center flex-1 py-6">
                  <p className="text-xs text-gray-600 font-medium text-center">Aucune génération pour l&apos;instant</p>
                </div>
              ) : dernieresGenerations.map((g, i) => (
                <div key={i} className="bg-white/5 rounded-2xl px-3 py-2.5 flex-1 min-h-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-violet-900/60 text-violet-300">
                      {g.portail && !["email", "sms", "visite", "vendeur"].includes(g.portail) ? g.portail : g.type}
                    </span>
                    {i === 0 && <span className="text-xs text-gray-600 font-medium">dernière</span>}
                  </div>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed line-clamp-4 overflow-hidden">{g.texte}</p>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-gray-600 font-semibold group-hover:text-violet-400 transition-colors">Générer un document</p>
              <svg className="w-4 h-4 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

        </div>
      </div>
    </div>
  )
}
