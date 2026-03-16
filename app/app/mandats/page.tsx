"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import PlanBanner from "@/components/PlanBanner"

type Statut = "disponible" | "sous-compromis" | "vendu"

interface Mandat {
  id: string
  type: string
  adresse: string
  ville: string
  surface: number
  pieces: number
  prix: number
  statut: Statut
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

const statutConfig: Record<Statut, { label: string; classes: string }> = {
  disponible: { label: "Disponible", classes: "bg-emerald-100 text-emerald-700" },
  "sous-compromis": { label: "Sous compromis", classes: "bg-amber-100 text-amber-700" },
  vendu: { label: "Vendu", classes: "bg-gray-100 text-gray-500" },
}

const EMPTY: Mandat = {
  id: "", type: "Appartement", adresse: "", ville: "", surface: 0, pieces: 0, prix: 0, statut: "disponible",
  parking: false, cave: false, balcon: false, ascenseur: false,
}

export default function MandatsPage() {
  const [ready, setReady] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [mandats, setMandats] = useState<Mandat[]>([])
  const [filtre, setFiltre] = useState<Statut | "tous">("tous")
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Mandat>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [planLimit, setPlanLimit] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      const email = session.user.email ?? ""
      setUserEmail(email)
      Promise.all([
        fetch(`/api/mandats?email=${encodeURIComponent(email)}`).then(r => r.json()),
        fetch(`/api/plan?email=${encodeURIComponent(email)}`).then(r => r.json()),
      ]).then(([mandatsData, planData]) => {
        setMandats(Array.isArray(mandatsData) ? mandatsData : [])
        setPlanLimit(planData.limits?.mandats ?? null)
        setReady(true)
      })
    })
  }, [])

  if (!ready) return null

  const filtered = mandats.filter(m => {
    const matchFiltre = filtre === "tous" || m.statut === filtre
    const matchSearch = `${m.adresse} ${m.ville} ${m.type}`.toLowerCase().includes(search.toLowerCase())
    return matchFiltre && matchSearch
  })

  async function handleSave() {
    if (!form.adresse || !form.ville) return
    setSaving(true)
    if (form.id) {
      const res = await fetch(`/api/mandats/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const updated = await res.json()
      setMandats(prev => prev.map(m => m.id === form.id ? updated : m))
    } else {
      const res = await fetch("/api/mandats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userEmail }),
      })
      if (res.status === 403) {
        setSaving(false)
        setShowForm(false)
        window.location.href = "/pricing"
        return
      }
      const created = await res.json()
      setMandats(prev => [created, ...prev])
    }
    setSaving(false)
    setShowForm(false)
    setForm(EMPTY)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/mandats/${id}`, { method: "DELETE" })
    setMandats(prev => prev.filter(m => m.id !== id))
    setConfirmDelete(null)
  }

  const f = (field: keyof Mandat) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value
    setForm(prev => ({ ...prev, [field]: val }))
  }
  const fBool = (field: keyof Mandat) => () => setForm(prev => ({ ...prev, [field]: !prev[field] }))

  return (
    <div className="min-h-screen bg-gray-50">

      {/* TOPBAR */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-lg font-extrabold text-gray-900">Mandats</h1>
        <div>
          {planLimit !== null && mandats.length >= planLimit ? (
            <a href="/pricing" className="bg-fuchsia-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-fuchsia-700 transition-colors">
              Passer au Pro →
            </a>
          ) : (
            <button
              onClick={() => { setForm(EMPTY); setShowForm(true) }}
              className="bg-fuchsia-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-fuchsia-700 transition-colors"
            >
              + Nouveau mandat
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        <PlanBanner usage={mandats.length} limit={planLimit} label="Mandats" />

        {/* FILTRES + RECHERCHE */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <input
            placeholder="Rechercher un bien..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 transition-colors"
          />
          {(["tous", "disponible", "sous-compromis", "vendu"] as const).map(fi => (
            <button
              key={fi}
              onClick={() => setFiltre(fi)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${filtre === fi ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"}`}
            >
              {fi === "tous" ? "Tous" : statutConfig[fi]?.label ?? fi}
              <span className="ml-2 text-xs opacity-60">
                {fi === "tous" ? mandats.length : mandats.filter(m => m.statut === fi).length}
              </span>
            </button>
          ))}
        </div>

        {/* LISTE */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg font-semibold mb-2">Aucun mandat trouvé</p>
            <p className="text-sm">Ajoutez votre premier mandat avec le bouton ci-dessus.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-5 hover:border-fuchsia-200 transition-colors group">
                <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center text-gray-300">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${(statutConfig[m.statut as Statut] ?? statutConfig.disponible).classes}`}>
                      {(statutConfig[m.statut as Statut] ?? statutConfig.disponible).label}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{m.type}</span>
                    {m.dpe && <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">DPE {m.dpe}</span>}
                  </div>
                  <p className="font-bold text-gray-900 truncate">{m.adresse}</p>
                  <p className="text-sm text-gray-500 font-medium">{m.ville}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400 font-semibold flex-wrap">
                    <span>{m.surface} m²</span>
                    <span>{m.pieces} pièce{m.pieces > 1 ? "s" : ""}</span>
                    {m.etage !== undefined && m.etage > 0 && <span>Étage {m.etage}</span>}
                    {m.exposition && <span>{m.exposition}</span>}
                    {m.parking && <span>Parking</span>}
                    {m.balcon && <span>Balcon</span>}
                    {m.cave && <span>Cave</span>}
                    {m.ascenseur && <span>Ascenseur</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-extrabold text-gray-900">{(m.prix ?? 0).toLocaleString("fr-FR")} €</p>
                  {m.charges && <p className="text-xs text-gray-400 font-medium mt-1">{m.charges} €/mois de charges</p>}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => { setForm(m); setShowForm(true) }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setConfirmDelete(m.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CONFIRMATION SUPPRESSION */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Supprimer ce mandat ?</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Cette action est irréversible. Le mandat sera définitivement supprimé.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-gray-400 transition-colors">
                Annuler
              </button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-xl my-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">
              {form.id ? "Modifier le mandat" : "Nouveau mandat"}
            </h2>
            <div className="flex flex-col gap-5">

              {/* Ligne 1 — type + statut */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Type de bien</label>
                  <select value={form.type} onChange={f("type")} className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400">
                    {["Appartement", "Maison", "Studio", "Local commercial", "Terrain"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Statut</label>
                  <select value={form.statut} onChange={e => setForm(prev => ({ ...prev, statut: e.target.value as Statut }))} className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400">
                    <option value="disponible">Disponible</option>
                    <option value="sous-compromis">Sous compromis</option>
                    <option value="vendu">Vendu</option>
                  </select>
                </div>
              </div>

              {/* Adresse */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Adresse</label>
                  <input value={form.adresse} onChange={f("adresse")} placeholder="12 rue de la Paix" className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Ville / Code postal</label>
                  <input value={form.ville} onChange={f("ville")} placeholder="Paris 75002" className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400" />
                </div>
              </div>

              {/* Surface, pièces, prix */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Surface (m²)</label>
                  <input type="number" value={form.surface || ""} onChange={f("surface")} className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Pièces</label>
                  <input type="number" value={form.pieces || ""} onChange={f("pieces")} className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Prix (€)</label>
                  <input type="number" value={form.prix || ""} onChange={f("prix")} className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400" />
                </div>
              </div>

              {/* Étage, année, charges */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Étage</label>
                  <input type="number" value={form.etage ?? ""} onChange={f("etage")} placeholder="0 = RDC" className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Année construction</label>
                  <input type="number" value={form.anneeConstruction ?? ""} onChange={f("anneeConstruction")} placeholder="1990" className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Charges (€/mois)</label>
                  <input type="number" value={form.charges ?? ""} onChange={f("charges")} className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400" />
                </div>
              </div>

              {/* Exposition, chauffage, DPE, état */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Exposition</label>
                  <select value={form.exposition ?? ""} onChange={f("exposition")} className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400">
                    <option value="">Non renseigné</option>
                    {["Nord", "Sud", "Est", "Ouest", "Nord-Est", "Nord-Ouest", "Sud-Est", "Sud-Ouest"].map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Chauffage</label>
                  <select value={form.chauffage ?? ""} onChange={f("chauffage")} className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400">
                    <option value="">Non renseigné</option>
                    {["Collectif gaz", "Individuel gaz", "Électrique", "Pompe à chaleur", "Fioul", "Poêle à bois", "Autre"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">DPE</label>
                  <select value={form.dpe ?? ""} onChange={f("dpe")} className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400">
                    <option value="">Non renseigné</option>
                    {["A", "B", "C", "D", "E", "F", "G"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">État général</label>
                  <select value={form.etat ?? ""} onChange={f("etat")} className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400">
                    <option value="">Non renseigné</option>
                    {["Neuf / VEFA", "Très bon état", "Bon état", "À rafraîchir", "À rénover"].map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              {/* Options booléennes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5">Équipements & prestations</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    ["parking", "Parking / Garage"],
                    ["cave", "Cave"],
                    ["balcon", "Balcon / Terrasse"],
                    ["ascenseur", "Ascenseur"],
                  ] as [keyof Mandat, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={fBool(key)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${form[key] ? "bg-fuchsia-600 text-white border-fuchsia-600" : "bg-white text-gray-500 border-gray-200 hover:border-fuchsia-300"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description libre */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description / Notes complémentaires</label>
                <textarea
                  value={form.description ?? ""}
                  onChange={f("description")}
                  rows={3}
                  placeholder="Points forts, travaux récents, environnement, vue, prestations particulières..."
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY) }}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-gray-400 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-fuchsia-600 text-white font-bold rounded-xl text-sm hover:bg-fuchsia-700 transition-colors disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : form.id ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
