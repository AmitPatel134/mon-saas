"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { authFetch } from "@/lib/authFetch"
import LoadingScreen from "@/components/LoadingScreen"
import PlanBanner from "@/components/PlanBanner"
import Toast from "@/components/Toast"
import jsPDF from "jspdf"

const PORTAILS_ANNONCE = ["SeLoger", "Leboncoin", "Logic-Immo", "PAP", "Bien'ici"]
const RESEAUX_SOCIAL = ["Instagram", "LinkedIn", "Facebook"]

type GenerationType = "annonce" | "email" | "sms" | "social" | "visite" | "vendeur"
type Ton = "professionnel" | "chaleureux" | "luxe" | "percutant"
type Longueur = "court" | "standard" | "long"

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

interface Generation {
  id: string
  texte: string
  portail: string | null
  type: string
  createdAt: string
}

const TYPES: { value: GenerationType; label: string; desc: string }[] = [
  { value: "annonce", label: "Annonce", desc: "Portail immo" },
  { value: "email", label: "Email", desc: "Prospect acheteur" },
  { value: "sms", label: "SMS", desc: "160 caractères" },
  { value: "social", label: "Réseaux sociaux", desc: "Insta · LinkedIn · FB" },
  { value: "visite", label: "Compte-rendu", desc: "Fiche visite" },
  { value: "vendeur", label: "Email vendeur", desc: "Suivi propriétaire" },
]

const TONS: { value: Ton; label: string }[] = [
  { value: "professionnel", label: "Professionnel" },
  { value: "chaleureux", label: "Chaleureux" },
  { value: "luxe", label: "Luxe" },
  { value: "percutant", label: "Percutant" },
]

interface VisiteForm {
  date: string
  visiteurs: string
  deroulement: string
  reactions: string
  impressionGlobale: string
  impressionGlobaleNotes: string
  suiteADonner: string
}

const VISITE_FORM_DEFAULT: VisiteForm = {
  date: "",
  visiteurs: "",
  deroulement: "",
  reactions: "",
  impressionGlobale: "positive",
  impressionGlobaleNotes: "",
  suiteADonner: "",
}

const TYPE_BADGE: Record<string, { label: string; classes: string }> = {
  annonce: { label: "Annonce", classes: "bg-violet-100 text-violet-700" },
  email: { label: "Email", classes: "bg-indigo-100 text-indigo-700" },
  sms: { label: "SMS", classes: "bg-emerald-100 text-emerald-700" },
  social: { label: "Social", classes: "bg-pink-100 text-pink-700" },
  visite: { label: "Visite", classes: "bg-amber-100 text-amber-700" },
  vendeur: { label: "Vendeur", classes: "bg-orange-100 text-orange-700" },
}

const FILTRES = [
  { value: "tous", label: "Tout" },
  { value: "annonce", label: "Annonces" },
  { value: "emails", label: "Emails" },
  { value: "social", label: "Réseaux" },
  { value: "sms", label: "SMS" },
  { value: "visite", label: "Visites" },
]

export default function GenerationPage() {
  const [ready, setReady] = useState(false)
  const [userName, setUserName] = useState("")
  const [mandats, setMandats] = useState<Mandat[]>([])
  const [planLimit, setPlanLimit] = useState<number | null>(null)
  const [genCount, setGenCount] = useState(0)

  // Config
  const [selectedMandat, setSelectedMandat] = useState("")
  const [mode, setMode] = useState<GenerationType>("annonce")
  const [selectedPortail, setSelectedPortail] = useState("SeLoger")
  const [selectedReseau, setSelectedReseau] = useState("Instagram")
  const [ton, setTon] = useState<Ton>("professionnel")
  const [longueur, setLongueur] = useState<Longueur>("standard")
  const [instructions, setInstructions] = useState("")
  const [visiteForm, setVisiteForm] = useState<VisiteForm>(VISITE_FORM_DEFAULT)

  // Result
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState("")
  const [resultLabel, setResultLabel] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  // History
  const [historique, setHistorique] = useState<Generation[]>([])
  const [filtreHisto, setFiltreHisto] = useState("tous")
  const [selected, setSelected] = useState<Generation | null>(null)
  const [selectedGens, setSelectedGens] = useState<Set<string>>(new Set())
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // Persist config dans localStorage
  useEffect(() => { localStorage.setItem("cleo_gen_mode", mode) }, [mode])
  useEffect(() => { if (selectedMandat) localStorage.setItem("cleo_gen_mandat", selectedMandat) }, [selectedMandat])
  useEffect(() => { localStorage.setItem("cleo_gen_ton", ton) }, [ton])
  useEffect(() => { localStorage.setItem("cleo_gen_longueur", longueur) }, [longueur])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      Promise.all([
        authFetch("/api/mandats").then(r => r.json()),
        authFetch("/api/plan").then(r => r.json()),
        authFetch("/api/generations").then(r => r.json()),
        authFetch("/api/users").then(r => r.json()),
      ]).then(([mandatsData, planData, genData, userData]) => {
        const mList = Array.isArray(mandatsData) ? mandatsData : []
        setMandats(mList)
        setPlanLimit(planData.limits?.generationsPerMonth ?? null)
        setGenCount(planData.usage?.generationsThisMonth ?? 0)
        setHistorique(Array.isArray(genData) ? genData : [])
        if (userData?.name) setUserName(userData.name)
        // Restaurer config depuis localStorage
        const savedMandat = localStorage.getItem("cleo_gen_mandat")
        if (savedMandat && mList.some((m: { id: string }) => m.id === savedMandat)) setSelectedMandat(savedMandat)
        const savedMode = localStorage.getItem("cleo_gen_mode") as GenerationType
        if (savedMode) setMode(savedMode)
        const savedTon = localStorage.getItem("cleo_gen_ton") as Ton
        if (savedTon) setTon(savedTon)
        const savedLongueur = localStorage.getItem("cleo_gen_longueur") as Longueur
        if (savedLongueur) setLongueur(savedLongueur)
        setReady(true)
      })
    })
  }, [])

  if (!ready) return <LoadingScreen />

  const mandat = mandats.find(m => m.id === selectedMandat)
  const portailForMode = mode === "annonce" ? selectedPortail : mode === "social" ? selectedReseau : null

  const filteredHisto = historique.filter(h => {
    if (filtreHisto === "tous") return true
    if (filtreHisto === "emails") return h.type === "email" || h.type === "vendeur"
    return h.type === filtreHisto
  })

  async function handleGenerate() {
    if (!mandat) return
    setGenerating(true)
    setResult("")
    setError("")
    setSelected(null)
    try {
      const res = await authFetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mandat,
          mode,
          portail: portailForMode,
          ton,
          longueur,
          instructions: instructions.trim(),
          visiteData: mode === "visite" ? visiteForm : undefined,
          userName: mode === "visite" ? userName : undefined,
        }),
      })
      if (res.status === 403) {
        setError("Limite de générations atteinte ce mois-ci. Passez au plan Pro pour continuer.")
        return
      }
      if (!res.ok) throw new Error("Erreur API")
      const { texte } = await res.json()
      setResult(texte)
      showToast("Texte généré ✓")
      const modeLabel = TYPES.find(t => t.value === mode)?.label ?? mode
      const portailLabel = portailForMode ? ` · ${portailForMode}` : ""
      setResultLabel(`${modeLabel}${portailLabel}`)
      setGenCount(c => c + 1)
      const updated = await authFetch("/api/generations").then(r => r.json())
      setHistorique(Array.isArray(updated) ? updated : [])
    } catch {
      setError("Une erreur est survenue.")
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete(id: string) {
    await authFetch(`/api/generations/${id}`, { method: "DELETE" })
    setHistorique(prev => prev.filter(h => h.id !== id))
    if (selected?.id === id) { setSelected(null); setResult(""); setResultLabel("") }
  }

  async function handleBulkDelete() {
    await Promise.all([...selectedGens].map(id => authFetch(`/api/generations/${id}`, { method: "DELETE" })))
    setHistorique(prev => prev.filter(h => !selectedGens.has(h.id)))
    if (selected && selectedGens.has(selected.id)) { setSelected(null); setResult(""); setResultLabel("") }
    showToast(`${selectedGens.size} génération${selectedGens.size > 1 ? "s" : ""} supprimée${selectedGens.size > 1 ? "s" : ""}`)
    setSelectedGens(new Set())
    setConfirmBulk(false)
  }

  function toggleSelectGen(id: string) {
    setSelectedGens(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleExportPDF() {
    const doc = new jsPDF()
    const margin = 20
    const pageWidth = doc.internal.pageSize.getWidth()
    const maxWidth = pageWidth - margin * 2

    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.setTextColor(162, 28, 175) // fuchsia
    doc.text("Cléo — Document généré", margin, margin)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.setTextColor(30, 30, 30)

    const lines = doc.splitTextToSize(result, maxWidth)
    doc.text(lines, margin, margin + 14)

    doc.save(`cleo-${mode ?? "document"}-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  function handleSelectHisto(h: Generation) {
    setSelected(h)
    setResult(h.texte)
    const badge = TYPE_BADGE[h.type]
    const portailLabel = h.portail && !["email", "sms", "visite", "vendeur"].includes(h.portail) ? ` · ${h.portail}` : ""
    setResultLabel(`${badge?.label ?? h.type}${portailLabel}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* TOPBAR */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-40">
        <h1 className="text-lg font-extrabold text-gray-900">Génération IA</h1>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-6">

        {/* GÉNÉRATEUR */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

          {/* PANNEAU CONFIG */}
          <div className="col-span-1 md:col-span-4 flex flex-col gap-4">

            {/* Type de génération */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Type de génération</p>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map(t => (
                  <button key={t.value} onClick={() => setMode(t.value)}
                    className={`text-left px-3 py-2.5 rounded-xl transition-colors ${mode === t.value ? "bg-fuchsia-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                    <p className={`text-xs font-bold leading-tight ${mode === t.value ? "text-white" : "text-gray-900"}`}>{t.label}</p>
                    <p className={`text-xs mt-0.5 ${mode === t.value ? "text-fuchsia-200" : "text-gray-400"}`}>{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Mandat */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Mandat</p>
              <select value={selectedMandat} onChange={e => setSelectedMandat(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400">
                <option value="">Choisir un mandat...</option>
                {mandats.map(m => (
                  <option key={m.id} value={m.id}>{m.type} — {m.adresse}, {m.ville}</option>
                ))}
              </select>
              {mandat && (
                <div className="mt-3 p-3 rounded-xl bg-gray-50 text-xs text-gray-500 font-medium space-y-1">
                  <p>{mandat.surface} m² · {mandat.pieces} pièce{mandat.pieces > 1 ? "s" : ""} · {(mandat.prix ?? 0).toLocaleString("fr-FR")} €</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mandat.dpe && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">DPE {mandat.dpe}</span>}
                    {mandat.exposition && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">{mandat.exposition}</span>}
                    {mandat.parking && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">Parking</span>}
                    {mandat.balcon && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">Balcon</span>}
                    {mandat.cave && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">Cave</span>}
                    {mandat.ascenseur && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">Ascenseur</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Portail (annonce) */}
            {mode === "annonce" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Portail</p>
                <div className="flex flex-col gap-1.5">
                  {PORTAILS_ANNONCE.map(p => (
                    <button key={p} onClick={() => setSelectedPortail(p)}
                      className={`text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${selectedPortail === p ? "bg-violet-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Réseau social */}
            {mode === "social" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Réseau social</p>
                <div className="flex flex-col gap-1.5">
                  {RESEAUX_SOCIAL.map(r => (
                    <button key={r} onClick={() => setSelectedReseau(r)}
                      className={`text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${selectedReseau === r ? "bg-pink-500 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Formulaire compte-rendu de visite */}
            {mode === "visite" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Informations de visite</p>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Date de visite</label>
                  <input type="date" value={visiteForm.date} onChange={e => setVisiteForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Visiteur(s)</label>
                  <input type="text" value={visiteForm.visiteurs} onChange={e => setVisiteForm(f => ({ ...f, visiteurs: e.target.value }))}
                    placeholder="Ex : M. et Mme Dupont"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Déroulement de la visite
                    <span className="ml-2 text-gray-400 font-normal normal-case">— mots-clés, l&apos;IA rédige le texte</span>
                  </label>
                  <textarea value={visiteForm.deroulement} onChange={e => setVisiteForm(f => ({ ...f, deroulement: e.target.value }))}
                    rows={3} placeholder="Ex : bonne ambiance, ont visité toutes les pièces, intéressés par la terrasse, ont mesuré le salon..."
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors resize-none" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Réactions / Points soulevés
                    <span className="ml-2 text-gray-400 font-normal normal-case">— mots-clés, l&apos;IA rédige le texte</span>
                  </label>
                  <textarea value={visiteForm.reactions} onChange={e => setVisiteForm(f => ({ ...f, reactions: e.target.value }))}
                    rows={3} placeholder="Ex : prix trop élevé, ont aimé la luminosité, inquiets par le DPE, question sur les charges, voisinage calme apprécié..."
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors resize-none" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Impression globale</label>
                  <select value={visiteForm.impressionGlobale} onChange={e => setVisiteForm(f => ({ ...f, impressionGlobale: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-fuchsia-400 mb-2">
                    <option value="très positive">Très positive — coup de cœur</option>
                    <option value="positive">Positive — bien reçu</option>
                    <option value="mitigée">Mitigée — hésitant(e)</option>
                    <option value="négative">Négative — ne correspond pas</option>
                  </select>
                  <textarea value={visiteForm.impressionGlobaleNotes} onChange={e => setVisiteForm(f => ({ ...f, impressionGlobaleNotes: e.target.value }))}
                    rows={2} placeholder="Ex : correspond à leur budget mais surface insuffisante, coup de cœur pour la vue..."
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors resize-none" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Suite à donner
                    <span className="ml-2 text-gray-400 font-normal normal-case">— mots-clés, l&apos;IA rédige le texte</span>
                  </label>
                  <textarea value={visiteForm.suiteADonner} onChange={e => setVisiteForm(f => ({ ...f, suiteADonner: e.target.value }))}
                    rows={2} placeholder="Ex : 2ème visite avec architecte, envoi du DPE, contre-offre à 280k, relance dans 1 semaine..."
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors resize-none" />
                </div>

                <div className="pt-1 border-t border-gray-100">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Rédigé par</label>
                  <input type="text" value={userName} onChange={e => setUserName(e.target.value)}
                    placeholder="Votre prénom et nom"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors" />
                </div>
              </div>
            )}

            {/* Style (ton / longueur / instructions) — masqué pour visite et SMS */}
            {mode !== "visite" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-4">
                {mode !== "sms" && (
                  <>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ton</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {TONS.map(t => (
                          <button key={t.value} onClick={() => setTon(t.value)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${ton === t.value ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Longueur</p>
                      <div className="flex gap-1.5">
                        {(["court", "standard", "long"] as Longueur[]).map(l => (
                          <button key={l} onClick={() => setLongueur(l)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${longueur === l ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                            {l === "court" ? "Court" : l === "standard" ? "Standard" : "Long"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {mode === "sms" ? "Précisions" : "Instructions libres"}
                  </p>
                  <textarea
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    rows={2}
                    placeholder={mode === "sms" ? "Ex : mentionne l'école à proximité..." : "Ex : insiste sur la luminosité, mets en avant le quartier..."}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors resize-none"
                  />
                </div>
              </div>
            )}

            <PlanBanner usage={genCount} limit={planLimit} label="Générations ce mois" />

            {planLimit !== null && genCount >= planLimit ? (
              <a href="/pricing" className="w-full py-4 bg-fuchsia-600 text-white font-extrabold rounded-2xl hover:bg-fuchsia-700 transition-colors flex items-center justify-center gap-2">
                Passer au Pro pour continuer →
              </a>
            ) : (
              <button onClick={handleGenerate} disabled={!selectedMandat || generating}
                className="w-full py-4 bg-fuchsia-600 text-white font-extrabold rounded-2xl hover:bg-fuchsia-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {generating ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Génération en cours...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Générer avec IA</>
                )}
              </button>
            )}
          </div>

          {/* PANNEAU RÉSULTAT */}
          <div className="col-span-1 md:col-span-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-96 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {resultLabel || "Résultat"}
                </p>
                <div className="flex items-center gap-2">
                  {result && mode === "sms" && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${result.length > 160 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                      {result.length} / 160 car.
                    </span>
                  )}
                  {result && (
                    <>
                      <button
                        onClick={handleGenerate}
                        disabled={!selectedMandat || generating}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-40"
                      >
                        Regénérer
                      </button>
                      <button
                        onClick={() => handleCopy(result, "current")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${copied === "current" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {copied === "current" ? "Copié ✓" : "Copier"}
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                        Télécharger PDF
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1">
                {error ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-sm font-medium text-red-400">{error}</p>
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
            </div>
          </div>
        </div>

        {/* HISTORIQUE */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <p className="text-sm font-extrabold text-gray-900">Historique</p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{historique.length}</span>
              {selectedGens.size > 0 && (
                <button onClick={() => setConfirmBulk(true)}
                  className="bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
                  Supprimer ({selectedGens.size})
                </button>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {FILTRES.map(f => (
                <button key={f.value} onClick={() => setFiltreHisto(f.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${filtreHisto === f.value ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredHisto.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <p className="text-sm font-medium">Aucune génération{filtreHisto !== "tous" ? " dans cette catégorie" : ""}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredHisto.map(h => {
                const badge = TYPE_BADGE[h.type] ?? { label: h.type, classes: "bg-gray-100 text-gray-600" }
                const badgeLabel = h.portail && !["email", "sms", "visite", "vendeur"].includes(h.portail) ? h.portail : badge.label
                return (
                  <div key={h.id}
                    className={`flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group ${selectedGens.has(h.id) ? "bg-red-50" : selected?.id === h.id ? "bg-fuchsia-50" : ""}`}
                    onClick={() => handleSelectHisto(h)}
                  >
                    <input type="checkbox" checked={selectedGens.has(h.id)}
                      onChange={() => toggleSelectGen(h.id)}
                      onClick={e => e.stopPropagation()}
                      className={`mt-1 w-4 h-4 rounded accent-red-500 shrink-0 cursor-pointer transition-opacity ${selectedGens.has(h.id) ? "opacity-100" : "opacity-30"}`} />
                    <div className="shrink-0 pt-0.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${badge.classes}`}>
                        {badgeLabel}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 font-medium leading-relaxed line-clamp-2">{h.texte}</p>
                      <p className="text-xs text-gray-400 font-medium mt-1">
                        {new Date(h.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); handleCopy(h.texte, h.id) }}
                        className={`p-1.5 rounded-lg transition-colors ${copied === h.id ? "bg-emerald-100 text-emerald-600" : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"}`}
                        title="Copier"
                      >
                        {copied === h.id ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(h.id) }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* MODAL CONFIRMATION BULK DELETE */}
      {confirmBulk && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Supprimer {selectedGens.size} génération{selectedGens.size > 1 ? "s" : ""} ?</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Cette action est irréversible. Les textes sélectionnés seront définitivement supprimés.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBulk(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-gray-400 transition-colors">
                Annuler
              </button>
              <button onClick={handleBulkDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
    </div>
  )
}
