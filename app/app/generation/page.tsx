"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const portails = ["SeLoger", "Leboncoin", "Logic-Immo"]
const LS_KEY = "cleo_mandats"

interface Mandat {
  id: string
  type: string
  adresse: string
  ville: string
  surface: number
  pieces: number
  prix: number
  statut: string
  etage?: number
  exposition?: string
  chauffage?: string
  dpe?: string
  parking: boolean
  cave: boolean
  balcon: boolean
  ascenseur: boolean
  etat?: string
  charges?: number
  anneeConstruction?: number
  description?: string
}

type HistoriqueItem = { portail: string; texte: string; date: string; type: "annonce" | "email" }

const DEMO_MANDATS: Mandat[] = [
  { id: "1", type: "Appartement", adresse: "12 rue de la Paix", ville: "Paris 75002", surface: 65, pieces: 3, prix: 580000, statut: "disponible", etage: 4, exposition: "Sud", chauffage: "Collectif gaz", dpe: "C", parking: false, cave: true, balcon: true, ascenseur: true, etat: "Bon état", charges: 320, anneeConstruction: 1975, description: "Appartement lumineux avec parquet ancien, double séjour, cuisine équipée, vue dégagée." },
  { id: "2", type: "Maison", adresse: "8 allée des Roses", ville: "Lyon 69006", surface: 120, pieces: 5, prix: 450000, statut: "sous-compromis", exposition: "Sud-Ouest", chauffage: "Pompe à chaleur", dpe: "B", parking: true, cave: false, balcon: true, ascenseur: false, etat: "Très bon état", anneeConstruction: 2005, description: "Maison avec jardin de 400m², garage double, terrasse couverte, quartier résidentiel calme." },
  { id: "3", type: "Studio", adresse: "3 place Bellecour", ville: "Lyon 69002", surface: 28, pieces: 1, prix: 145000, statut: "vendu", etage: 2, exposition: "Est", chauffage: "Électrique", dpe: "D", parking: false, cave: false, balcon: false, ascenseur: false, etat: "À rénover", charges: 80, anneeConstruction: 1960, description: "" },
]

function loadMandats(): Mandat[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : DEMO_MANDATS
  } catch { return DEMO_MANDATS }
}

export default function GenerationPage() {
  const [ready, setReady] = useState(false)
  const [mandats, setMandats] = useState<Mandat[]>([])
  const [selectedMandat, setSelectedMandat] = useState("")
  const [selectedPortail, setSelectedPortail] = useState("SeLoger")
  const [mode, setMode] = useState<"annonce" | "email">("annonce")
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const [historique, setHistorique] = useState<HistoriqueItem[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      setMandats(loadMandats())
      setReady(true)
    })
  }, [])

  if (!ready) return null

  const mandat = mandats.find(m => m.id === selectedMandat)

  async function handleGenerate() {
    if (!mandat) return
    setGenerating(true)
    setResult("")
    setError("")
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mandat, mode, portail: selectedPortail }),
      })
      if (!res.ok) throw new Error("Erreur API")
      const { texte } = await res.json()
      setResult(texte)
      setHistorique(h => [{
        portail: mode === "annonce" ? selectedPortail : "Email relance",
        texte,
        date: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        type: mode,
      }, ...h.slice(0, 9)])
    } catch {
      setError("Une erreur est survenue. Vérifie ta clé OpenAI.")
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
        <span className="text-sm font-semibold text-gray-400">/ Génération IA</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-3 gap-6">

          {/* PANNEAU GAUCHE — config */}
          <div className="flex flex-col gap-5">

            {/* Mode */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Type de génération</p>
              <div className="flex flex-col gap-2">
                {([["annonce", "Annonce portail"], ["email", "Email de relance"]] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setMode(val)}
                    className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${mode === val ? "bg-fuchsia-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mandat */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Mandat</p>
              <select
                value={selectedMandat}
                onChange={e => setSelectedMandat(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400"
              >
                <option value="">Choisir un mandat...</option>
                {mandats.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.type} — {m.adresse}, {m.ville}
                  </option>
                ))}
              </select>

              {/* Résumé du mandat sélectionné */}
              {mandat && (
                <div className="mt-3 p-3 rounded-xl bg-gray-50 text-xs text-gray-500 font-medium space-y-1">
                  <p>{mandat.surface} m² · {mandat.pieces} pièce{mandat.pieces > 1 ? "s" : ""} · {mandat.prix.toLocaleString("fr-FR")} €</p>
                  {mandat.etage != null && <p>Étage {mandat.etage === 0 ? "RDC" : mandat.etage}</p>}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mandat.dpe && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">DPE {mandat.dpe}</span>}
                    {mandat.exposition && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">{mandat.exposition}</span>}
                    {mandat.etat && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">{mandat.etat}</span>}
                    {mandat.parking && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">Parking</span>}
                    {mandat.balcon && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">Balcon</span>}
                    {mandat.cave && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">Cave</span>}
                    {mandat.ascenseur && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">Ascenseur</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Portail (si annonce) */}
            {mode === "annonce" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Portail</p>
                <div className="flex flex-col gap-2">
                  {portails.map(p => (
                    <button
                      key={p}
                      onClick={() => setSelectedPortail(p)}
                      className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${selectedPortail === p ? "bg-violet-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedMandat || generating}
              className="w-full py-4 bg-fuchsia-600 text-white font-extrabold rounded-2xl hover:bg-fuchsia-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Génération en cours...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Générer avec IA</>
              )}
            </button>
          </div>

          {/* PANNEAU CENTRAL — résultat */}
          <div className="col-span-2 flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex-1 min-h-80">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {result ? (mode === "annonce" ? `Annonce ${selectedPortail}` : "Email de relance") : "Résultat"}
                </p>
                {result && (
                  <button onClick={handleCopy} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${copied ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {copied ? "Copié ✓" : "Copier"}
                  </button>
                )}
              </div>
              {error ? (
                <div className="flex items-center justify-center h-64 text-red-400">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              ) : result ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-medium leading-relaxed font-sans">{result}</pre>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-300">
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-sm font-medium">Sélectionne un mandat et clique sur Générer</p>
                  </div>
                </div>
              )}
            </div>

            {/* Historique */}
            {historique.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Historique</p>
                <div className="flex flex-col gap-2">
                  {historique.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setResult(h.texte)}
                      className="flex items-center gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${h.type === "email" ? "bg-indigo-100 text-indigo-700" : "bg-violet-100 text-violet-700"}`}>
                        {h.portail}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">{h.date}</span>
                      <span className="text-xs text-gray-500 font-medium truncate flex-1">{h.texte.slice(0, 60)}…</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
