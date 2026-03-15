"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const portails = ["SeLoger", "Leboncoin", "Logic-Immo"]

const mandatsDemo = [
  { id: "1", label: "Appartement — 12 rue de la Paix, Paris 75002", surface: 65, pieces: 3, prix: 580000, type: "Appartement", adresse: "12 rue de la Paix, Paris 75002" },
  { id: "2", label: "Maison — 8 allée des Roses, Lyon 69006", surface: 120, pieces: 5, prix: 450000, type: "Maison", adresse: "8 allée des Roses, Lyon 69006" },
  { id: "3", label: "Studio — 3 place Bellecour, Lyon 69002", surface: 28, pieces: 1, prix: 145000, type: "Studio", adresse: "3 place Bellecour, Lyon 69002" },
]

type HistoriqueItem = { portail: string; texte: string; date: string; type: "annonce" | "email" }

function genererAnnonce(mandat: typeof mandatsDemo[0], portail: string): string {
  const templates: Record<string, string> = {
    SeLoger: `🏠 ${mandat.type} ${mandat.surface}m² — ${mandat.pieces} pièce${mandat.pieces > 1 ? "s" : ""}\n\n📍 ${mandat.adresse}\n\nBien rare sur le marché ! Découvrez ce magnifique ${mandat.type.toLowerCase()} de ${mandat.surface}m² idéalement situé. Composé de ${mandat.pieces} pièce${mandat.pieces > 1 ? "s" : ""} lumineuses, il saura séduire les amateurs d'espaces bien agencés.\n\n✅ Surface habitable : ${mandat.surface} m²\n✅ Nombre de pièces : ${mandat.pieces}\n✅ Exposition optimale\n✅ Charges réduites\n\n💰 Prix : ${mandat.prix.toLocaleString("fr-FR")} €\n\nContactez-nous pour organiser une visite. Disponibilité immédiate.`,
    Leboncoin: `${mandat.type} ${mandat.pieces} pièces ${mandat.surface}m² - ${mandat.prix.toLocaleString("fr-FR")}€\n\nSitué à ${mandat.adresse}, ce ${mandat.type.toLowerCase()} de ${mandat.surface}m² dispose de ${mandat.pieces} pièce${mandat.pieces > 1 ? "s" : ""}.\n\nCaractéristiques :\n- Surface : ${mandat.surface} m²\n- Pièces : ${mandat.pieces}\n- Prix : ${mandat.prix.toLocaleString("fr-FR")} €\n\nBien entretenu, idéal pour habitation principale ou investissement locatif. Visitez sans attendre !\n\nContact : disponible sur annonce.`,
    "Logic-Immo": `Réf. FL${mandat.id}${Date.now().toString().slice(-4)} | ${mandat.type.toUpperCase()} ${mandat.surface}M² | ${mandat.pieces} PIÈCES\n\nLocalisation : ${mandat.adresse}\nPrix de vente : ${mandat.prix.toLocaleString("fr-FR")} €\n\nDescription :\nNous vous proposons en exclusivité ce ${mandat.type.toLowerCase()} de ${mandat.surface} m² offrant ${mandat.pieces} pièce${mandat.pieces > 1 ? "s" : ""} au calme. Prestation de qualité, environnement agréable.\n\nHonoraires d'agence inclus dans le prix affiché.\n\nPour tout renseignement ou visite, contactez notre agence.`,
  }
  return templates[portail] ?? ""
}

function genererEmail(mandat: typeof mandatsDemo[0]): string {
  return `Objet : Votre recherche — Un bien correspond à vos critères\n\nBonjour,\n\nJ'espère que vous allez bien. Je me permets de vous recontacter car un bien vient de correspondre parfaitement à votre projet.\n\nIl s'agit d'un ${mandat.type.toLowerCase()} de ${mandat.surface}m² situé ${mandat.adresse}, proposé à ${mandat.prix.toLocaleString("fr-FR")} €.\n\nAvec ${mandat.pieces} pièce${mandat.pieces > 1 ? "s" : ""}, ce bien coche de nombreuses cases de votre recherche. Les visites démarrent cette semaine et les créneaux se remplissent vite.\n\nSouhaitez-vous que je vous réserve un créneau ?\n\nBien cordialement,\n[Votre prénom]\nAgent immobilier`
}

export default function GenerationPage() {
  const [ready, setReady] = useState(false)
  const [selectedMandat, setSelectedMandat] = useState("")
  const [selectedPortail, setSelectedPortail] = useState("SeLoger")
  const [mode, setMode] = useState<"annonce" | "email">("annonce")
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState("")
  const [historique, setHistorique] = useState<HistoriqueItem[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      setReady(true)
    })
  }, [])

  if (!ready) return null

  const mandat = mandatsDemo.find(m => m.id === selectedMandat)

  async function handleGenerate() {
    if (!mandat) return
    setGenerating(true)
    setResult("")
    await new Promise(r => setTimeout(r, 900))
    const texte = mode === "annonce" ? genererAnnonce(mandat, selectedPortail) : genererEmail(mandat)
    setResult(texte)
    setHistorique(h => [{
      portail: mode === "annonce" ? selectedPortail : "Email relance",
      texte,
      date: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      type: mode,
    }, ...h.slice(0, 9)])
    setGenerating(false)
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
                {mandatsDemo.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
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
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Génération...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Générer</>
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
              {result ? (
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
