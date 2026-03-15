"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type StatutProspect = "nouveau" | "en-recherche" | "chaud" | "signé"

interface Prospect {
  id: string
  nom: string
  telephone: string
  email: string
  budget: number
  criteres: string
  statut: StatutProspect
  rappel?: string
  biensVisites: string[]
}

const statutConfig: Record<StatutProspect, { label: string; classes: string }> = {
  nouveau: { label: "Nouveau", classes: "bg-blue-100 text-blue-700" },
  "en-recherche": { label: "En recherche", classes: "bg-amber-100 text-amber-700" },
  chaud: { label: "Chaud 🔥", classes: "bg-orange-100 text-orange-700" },
  "signé": { label: "Signé ✓", classes: "bg-emerald-100 text-emerald-700" },
}

const DEMO: Prospect[] = [
  { id: "1", nom: "Julie Martin", telephone: "06 12 34 56 78", email: "julie.martin@email.fr", budget: 400000, criteres: "Appartement 3 pièces, Paris ou proche banlieue, lumineux", statut: "chaud", rappel: "2026-03-20", biensVisites: ["12 rue de la Paix"] },
  { id: "2", nom: "Pierre Dubois", telephone: "07 98 76 54 32", email: "pierre.d@gmail.com", budget: 550000, criteres: "Maison avec jardin, Lyon, 4-5 pièces", statut: "en-recherche", biensVisites: ["8 allée des Roses"] },
  { id: "3", nom: "Camille Leroy", telephone: "06 55 44 33 22", email: "camille.leroy@pro.com", budget: 160000, criteres: "Studio ou T2, investissement locatif, centre-ville", statut: "nouveau", biensVisites: [] },
]

const EMPTY: Prospect = { id: "", nom: "", telephone: "", email: "", budget: 0, criteres: "", statut: "nouveau", rappel: "", biensVisites: [] }

export default function ProspectsPage() {
  const [ready, setReady] = useState(false)
  const [prospects, setProspects] = useState<Prospect[]>(DEMO)
  const [filtre, setFiltre] = useState<StatutProspect | "tous">("tous")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Prospect>(EMPTY)
  const [detail, setDetail] = useState<Prospect | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      setReady(true)
    })
  }, [])

  if (!ready) return null

  const filtered = prospects.filter(p => filtre === "tous" || p.statut === filtre)

  function handleSave() {
    if (!form.nom) return
    if (form.id) {
      setProspects(ps => ps.map(p => p.id === form.id ? form : p))
    } else {
      setProspects(ps => [...ps, { ...form, id: Date.now().toString() }])
    }
    setShowForm(false)
    setForm(EMPTY)
  }

  function handleDelete(id: string) {
    setProspects(ps => ps.filter(p => p.id !== id))
    if (detail?.id === id) setDetail(null)
  }

  function updateStatut(id: string, statut: StatutProspect) {
    setProspects(ps => ps.map(p => p.id === id ? { ...p, statut } : p))
    if (detail?.id === id) setDetail(d => d ? { ...d, statut } : d)
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
        <span className="text-sm font-semibold text-gray-400">/ Prospects</span>
        <div className="ml-auto">
          <button
            onClick={() => { setForm(EMPTY); setShowForm(true) }}
            className="bg-indigo-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-colors"
          >
            + Nouveau prospect
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* FILTRES */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          {(["tous", "nouveau", "en-recherche", "chaud", "signé"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${filtre === f ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"}`}
            >
              {f === "tous" ? "Tous" : statutConfig[f].label}
              <span className="ml-2 text-xs opacity-60">
                {f === "tous" ? prospects.length : prospects.filter(p => p.statut === f).length}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-4">

          {/* LISTE */}
          <div className="col-span-2 flex flex-col gap-3">
            {filtered.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <p className="text-sm font-medium">Aucun prospect dans cette catégorie.</p>
              </div>
            )}
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => setDetail(p)}
                className={`text-left p-4 rounded-2xl border transition-all ${detail?.id === p.id ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-200 hover:border-indigo-200"}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className={`font-bold text-sm ${detail?.id === p.id ? "text-white" : "text-gray-900"}`}>{p.nom}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${detail?.id === p.id ? "bg-white/20 text-white" : statutConfig[p.statut].classes}`}>
                    {statutConfig[p.statut].label}
                  </span>
                </div>
                <p className={`text-xs font-medium truncate ${detail?.id === p.id ? "text-indigo-200" : "text-gray-500"}`}>{p.criteres}</p>
                <p className={`text-xs font-bold mt-1 ${detail?.id === p.id ? "text-indigo-200" : "text-indigo-600"}`}>{p.budget.toLocaleString("fr-FR")} €</p>
                {p.rappel && (
                  <p className={`text-xs mt-2 font-medium ${detail?.id === p.id ? "text-indigo-200" : "text-amber-600"}`}>
                    🔔 Rappel : {new Date(p.rappel).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* DÉTAIL */}
          <div className="col-span-3">
            {detail ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">{detail.nom}</h2>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full mt-2 inline-block ${statutConfig[detail.statut].classes}`}>
                      {statutConfig[detail.statut].label}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setForm(detail); setShowForm(true) }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(detail.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: "Téléphone", value: detail.telephone },
                    { label: "Email", value: detail.email },
                    { label: "Budget max", value: `${detail.budget.toLocaleString("fr-FR")} €` },
                    { label: "Rappel", value: detail.rappel ? new Date(detail.rappel).toLocaleDateString("fr-FR") : "—" },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Critères de recherche</p>
                  <p className="text-sm font-medium text-gray-700 bg-gray-50 rounded-xl p-3">{detail.criteres}</p>
                </div>

                {detail.biensVisites.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Biens visités</p>
                    <div className="flex flex-col gap-1">
                      {detail.biensVisites.map(b => (
                        <span key={b} className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-2">📍 {b}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Changer le statut</p>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(statutConfig) as StatutProspect[]).map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatut(detail.id, s)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${detail.statut === s ? statutConfig[s].classes + " ring-2 ring-offset-1 ring-indigo-400" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      >
                        {statutConfig[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 flex items-center justify-center h-64 text-gray-300">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-medium">Sélectionne un prospect pour voir sa fiche</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">
              {form.id ? "Modifier le prospect" : "Nouveau prospect"}
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nom complet</label>
                  <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Julie Martin"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Statut</label>
                  <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value as StatutProspect }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400">
                    <option value="nouveau">Nouveau</option>
                    <option value="en-recherche">En recherche</option>
                    <option value="chaud">Chaud</option>
                    <option value="signé">Signé</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Téléphone</label>
                  <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="06 12 34 56 78"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@email.fr"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Budget max (€)</label>
                  <input type="number" value={form.budget || ""} onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date de rappel</label>
                  <input type="date" value={form.rappel} onChange={e => setForm(f => ({ ...f, rappel: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Critères de recherche</label>
                <textarea rows={3} value={form.criteres} onChange={e => setForm(f => ({ ...f, criteres: e.target.value }))}
                  placeholder="Appartement 3 pièces, lumineux, Paris intramuros..."
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setForm(EMPTY) }}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-gray-400 transition-colors">
                Annuler
              </button>
              <button onClick={handleSave}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-colors">
                {form.id ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
