"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

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
  photo?: string
}

const statutConfig: Record<Statut, { label: string; classes: string }> = {
  disponible: { label: "Disponible", classes: "bg-emerald-100 text-emerald-700" },
  "sous-compromis": { label: "Sous compromis", classes: "bg-amber-100 text-amber-700" },
  vendu: { label: "Vendu", classes: "bg-gray-100 text-gray-500" },
}

const DEMO: Mandat[] = [
  { id: "1", type: "Appartement", adresse: "12 rue de la Paix", ville: "Paris 75002", surface: 65, pieces: 3, prix: 580000, statut: "disponible" },
  { id: "2", type: "Maison", adresse: "8 allée des Roses", ville: "Lyon 69006", surface: 120, pieces: 5, prix: 450000, statut: "sous-compromis" },
  { id: "3", type: "Studio", adresse: "3 place Bellecour", ville: "Lyon 69002", surface: 28, pieces: 1, prix: 145000, statut: "vendu" },
]

const EMPTY: Mandat = { id: "", type: "Appartement", adresse: "", ville: "", surface: 0, pieces: 0, prix: 0, statut: "disponible" }

export default function MandatsPage() {
  const [ready, setReady] = useState(false)
  const [mandats, setMandats] = useState<Mandat[]>(DEMO)
  const [filtre, setFiltre] = useState<Statut | "tous">("tous")
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Mandat>(EMPTY)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      setReady(true)
    })
  }, [])

  if (!ready) return null

  const filtered = mandats.filter(m => {
    const matchFiltre = filtre === "tous" || m.statut === filtre
    const matchSearch = `${m.adresse} ${m.ville} ${m.type}`.toLowerCase().includes(search.toLowerCase())
    return matchFiltre && matchSearch
  })

  function handleSave() {
    if (!form.adresse || !form.ville) return
    if (form.id) {
      setMandats(ms => ms.map(m => m.id === form.id ? form : m))
    } else {
      setMandats(ms => [...ms, { ...form, id: Date.now().toString() }])
    }
    setShowForm(false)
    setForm(EMPTY)
  }

  function handleDelete(id: string) {
    setMandats(ms => ms.filter(m => m.id !== id))
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
        <a href="/" className="font-extrabold text-gray-900 text-lg tracking-tight">Flowly</a>
        <span className="text-sm font-semibold text-gray-400">/ Mandats</span>
        <div className="ml-auto">
          <button
            onClick={() => { setForm(EMPTY); setShowForm(true) }}
            className="bg-fuchsia-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-fuchsia-700 transition-colors"
          >
            + Nouveau mandat
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* FILTRES + RECHERCHE */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <input
            placeholder="Rechercher un bien..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 transition-colors"
          />
          {(["tous", "disponible", "sous-compromis", "vendu"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${filtre === f ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"}`}
            >
              {f === "tous" ? "Tous" : statutConfig[f]?.label ?? f}
              <span className="ml-2 text-xs opacity-60">
                {f === "tous" ? mandats.length : mandats.filter(m => m.statut === f).length}
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
                {/* Photo placeholder */}
                <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center text-gray-300">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
                  </svg>
                </div>
                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statutConfig[m.statut].classes}`}>
                      {statutConfig[m.statut].label}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{m.type}</span>
                  </div>
                  <p className="font-bold text-gray-900 truncate">{m.adresse}</p>
                  <p className="text-sm text-gray-500 font-medium">{m.ville}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400 font-semibold">
                    <span>{m.surface} m²</span>
                    <span>{m.pieces} pièces</span>
                  </div>
                </div>
                {/* Prix */}
                <div className="text-right shrink-0">
                  <p className="text-xl font-extrabold text-gray-900">{m.prix.toLocaleString("fr-FR")} €</p>
                </div>
                {/* Actions */}
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
                    onClick={() => handleDelete(m.id)}
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

      {/* MODAL FORM */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-xl">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">
              {form.id ? "Modifier le mandat" : "Nouveau mandat"}
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400"
                  >
                    {["Appartement", "Maison", "Studio", "Local commercial", "Terrain"].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Statut</label>
                  <select
                    value={form.statut}
                    onChange={e => setForm(f => ({ ...f, statut: e.target.value as Statut }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="sous-compromis">Sous compromis</option>
                    <option value="vendu">Vendu</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Adresse</label>
                <input
                  value={form.adresse}
                  onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                  placeholder="12 rue de la Paix"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Ville</label>
                <input
                  value={form.ville}
                  onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
                  placeholder="Paris 75002"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Surface (m²)</label>
                  <input
                    type="number"
                    value={form.surface || ""}
                    onChange={e => setForm(f => ({ ...f, surface: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Pièces</label>
                  <input
                    type="number"
                    value={form.pieces || ""}
                    onChange={e => setForm(f => ({ ...f, pieces: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Prix (€)</label>
                  <input
                    type="number"
                    value={form.prix || ""}
                    onChange={e => setForm(f => ({ ...f, prix: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400"
                  />
                </div>
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
                className="flex-1 py-3 bg-fuchsia-600 text-white font-bold rounded-xl text-sm hover:bg-fuchsia-700 transition-colors"
              >
                {form.id ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
