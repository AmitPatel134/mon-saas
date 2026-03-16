"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Mandat {
  id: string
  type: string
  adresse: string
  ville: string
  surface: number
  pieces: number
  prix: number
  statut: string
  dpe?: string
}

interface ProspectMatch {
  id: string
  nom: string
  telephone: string | null
  email: string | null
  budget: number
  criteres: string | null
  statut: string
  score: number
  reasons: string[]
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

function ScoreDots({ score }: { score: number }) {
  const max = 7
  const filled = Math.min(score, max)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < filled ? "bg-fuchsia-500" : "bg-gray-200"}`} />
      ))}
    </div>
  )
}

export default function MatchingPage() {
  const [ready, setReady] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [mandats, setMandats] = useState<Mandat[]>([])
  const [selectedMandat, setSelectedMandat] = useState<Mandat | null>(null)
  const [matches, setMatches] = useState<ProspectMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [filtre, setFiltre] = useState<"tous" | "disponible">("disponible")

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      const email = session.user.email ?? ""
      setUserEmail(email)
      fetch(`/api/mandats?email=${encodeURIComponent(email)}`)
        .then(r => r.json())
        .then(data => {
          setMandats(Array.isArray(data) ? data : [])
          setReady(true)
        })
    })
  }, [])

  async function handleSelectMandat(mandat: Mandat) {
    setSelectedMandat(mandat)
    setLoading(true)
    setMatches([])
    const data = await fetch(`/api/matching/${mandat.id}?email=${encodeURIComponent(userEmail)}`).then(r => r.json())
    setMatches(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  if (!ready) return null

  const mandatsFiltres = filtre === "disponible"
    ? mandats.filter(m => m.statut === "disponible")
    : mandats

  return (
    <div className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-4 sticky top-0 z-50">
        <a href="/app" className="text-gray-400 hover:text-gray-900 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <span className="text-gray-300">|</span>
        <a href="/" className="font-extrabold text-gray-900 text-lg tracking-tight">Cléo</a>
        <span className="text-sm font-semibold text-gray-400">/ Matching</span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Matching mandats / prospects</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Sélectionne un mandat pour voir les prospects qui correspondent.</p>
        </div>

        <div className="grid grid-cols-12 gap-6">

          {/* LISTE MANDATS */}
          <div className="col-span-5 flex flex-col gap-3">

            {/* Filtre */}
            <div className="flex gap-2">
              {([["disponible", "Disponibles"], ["tous", "Tous"]] as const).map(([val, label]) => (
                <button key={val} onClick={() => setFiltre(val)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${filtre === val ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {label}
                </button>
              ))}
            </div>

            {mandatsFiltres.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-400 font-medium">Aucun mandat{filtre === "disponible" ? " disponible" : ""}</p>
              </div>
            ) : mandatsFiltres.map(m => (
              <button key={m.id} onClick={() => handleSelectMandat(m)}
                className={`w-full text-left bg-white rounded-2xl border transition-all p-4 hover:border-fuchsia-300 hover:shadow-sm ${selectedMandat?.id === m.id ? "border-fuchsia-500 shadow-sm ring-1 ring-fuchsia-200" : "border-gray-200"}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{m.adresse}</p>
                    <p className="text-xs text-gray-500 font-medium">{m.ville}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${(statutMandat[m.statut] ?? statutMandat.disponible).classes}`}>
                    {(statutMandat[m.statut] ?? statutMandat.disponible).label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                  <span>{m.type}</span>
                  <span>·</span>
                  <span>{m.surface} m²</span>
                  <span>·</span>
                  <span>{m.pieces} p.</span>
                  <span>·</span>
                  <span className="font-bold text-gray-700">{(m.prix ?? 0).toLocaleString("fr-FR")} €</span>
                </div>
              </button>
            ))}
          </div>

          {/* RÉSULTATS MATCHING */}
          <div className="col-span-7">
            {!selectedMandat ? (
              <div className="bg-white rounded-2xl border border-gray-200 h-full flex items-center justify-center min-h-64">
                <div className="text-center text-gray-300">
                  <svg className="w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-medium">Sélectionne un mandat</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-gray-900">{selectedMandat.adresse}, {selectedMandat.ville}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {selectedMandat.type} · {selectedMandat.surface} m² · {(selectedMandat.prix ?? 0).toLocaleString("fr-FR")} €
                    </p>
                  </div>
                  {!loading && (
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-extrabold text-fuchsia-600">{matches.length}</p>
                      <p className="text-xs text-gray-400 font-medium">prospect{matches.length !== 1 ? "s" : ""} correspondant{matches.length !== 1 ? "s" : ""}</p>
                    </div>
                  )}
                </div>

                {/* Contenu */}
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-fuchsia-600 rounded-full animate-spin" />
                  </div>
                ) : matches.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <p className="text-sm font-medium text-gray-400">Aucun prospect ne correspond à ce mandat pour l&apos;instant.</p>
                    <a href="/app/prospects" className="inline-block mt-4 text-xs font-bold text-fuchsia-600 hover:text-fuchsia-700">
                      Ajouter des prospects →
                    </a>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {matches.map(p => (
                      <div key={p.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between gap-4 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{p.nom}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${(statutProspect[p.statut] ?? statutProspect.nouveau).classes}`}>
                              {(statutProspect[p.statut] ?? statutProspect.nouveau).label}
                            </span>
                          </div>
                          <ScoreDots score={p.score} />
                        </div>
                        <div className="flex items-end justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 font-medium mb-2 truncate">{p.criteres || "Aucun critère renseigné"}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {p.reasons.map((r, i) => (
                                <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-fuchsia-50 text-fuchsia-700">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 font-medium shrink-0">
                            {p.telephone || p.email || "—"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
