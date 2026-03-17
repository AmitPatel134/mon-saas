"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { authFetch } from "@/lib/authFetch"
import * as XLSX from "xlsx"
import LoadingScreen from "@/components/LoadingScreen"
import PlanBanner from "@/components/PlanBanner"
import Toast from "@/components/Toast"

type StatutProspect = "nouveau" | "en-recherche" | "chaud" | "signé"

interface Prospect {
  id: string
  nom: string
  telephone: string | null
  email: string | null
  budget: number
  criteres: string | null
  statut: StatutProspect
  rappel?: string | null
  biensVisites: string[]
}

const statutConfig: Record<StatutProspect, { label: string; classes: string }> = {
  nouveau: { label: "Nouveau", classes: "bg-blue-100 text-blue-700" },
  "en-recherche": { label: "En recherche", classes: "bg-amber-100 text-amber-700" },
  chaud: { label: "Chaud 🔥", classes: "bg-orange-100 text-orange-700" },
  "signé": { label: "Signé ✓", classes: "bg-emerald-100 text-emerald-700" },
}

const EMPTY_NEW = { nom: "", telephone: "", email: "", budget: 0, criteres: "", statut: "nouveau" as StatutProspect, rappel: "" }

function normalize(p: Prospect & { rappel?: string | null }) {
  return { ...p, rappel: p.rappel ? p.rappel.slice(0, 10) : "", biensVisites: p.biensVisites ?? [] }
}

export default function ProspectsPage() {
  const [ready, setReady] = useState(false)
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [planLimit, setPlanLimit] = useState<number | null>(null)
  const [filtre, setFiltre] = useState<StatutProspect | "tous">("tous")
  const [search, setSearch] = useState("")
  const [detail, setDetail] = useState<Prospect | null>(null)

  // Modal création
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ ...EMPTY_NEW })
  const [creating, setCreating] = useState(false)

  // Modal édition
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState<Prospect | null>(null)
  const [editing, setEditing] = useState(false)

  // Confirmation suppression
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set())
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      setConfirmDelete(null)
      setShowCreate(false)
      setShowEdit(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      Promise.all([
        authFetch("/api/prospects").then(r => r.json()),
        authFetch("/api/plan").then(r => r.json()),
      ]).then(([prospectsData, planData]) => {
        setProspects(Array.isArray(prospectsData) ? prospectsData.map(normalize) : [])
        setPlanLimit(planData.limits?.prospects ?? null)
        setReady(true)
      })
    })
  }, [])

  if (!ready) return <LoadingScreen />

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  function getRappelStatus(rappel?: string | null): "overdue" | "today" | null {
    if (!rappel) return null
    const d = new Date(rappel)
    if (d < todayStart) return "overdue"
    if (d < tomorrowStart) return "today"
    return null
  }

  const filtered = prospects
    .filter(p => {
      const matchFiltre = filtre === "tous" || p.statut === filtre
      const q = search.toLowerCase()
      const matchSearch = !q || `${p.nom} ${p.criteres ?? ""} ${p.telephone ?? ""} ${p.email ?? ""}`.toLowerCase().includes(q)
      return matchFiltre && matchSearch
    })
    .sort((a, b) => {
      const ra = getRappelStatus(a.rappel)
      const rb = getRappelStatus(b.rappel)
      const priority = (r: "overdue" | "today" | null) => r === "overdue" ? 0 : r === "today" ? 1 : 2
      return priority(ra) - priority(rb)
    })

  // --- CRÉATION ---
  async function handleCreate() {
    if (!createForm.nom) return
    setCreating(true)
    const res = await authFetch("/api/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...createForm,
        rappel: createForm.rappel ? new Date(createForm.rappel).toISOString() : null,
        biensVisites: [],
      }),
    })
    if (res.status === 403) {
      setCreating(false)
      setShowCreate(false)
      window.location.href = "/pricing"
      return
    }
    const created = await res.json()
    setProspects(ps => [normalize(created), ...ps])
    setCreating(false)
    setShowCreate(false)
    setCreateForm({ ...EMPTY_NEW })
    showToast("Prospect ajouté ✓")
  }

  // --- ÉDITION ---
  function openEdit(p: Prospect) {
    setEditForm({ ...p })
    setShowEdit(true)
  }

  async function handleEdit() {
    if (!editForm || !editForm.nom) return
    setEditing(true)
    const res = await authFetch(`/api/prospects/${editForm.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        rappel: editForm.rappel ? new Date(editForm.rappel).toISOString() : null,
      }),
    })
    const updated = await res.json()
    const norm = normalize(updated)
    setProspects(ps => ps.map(p => p.id === editForm.id ? norm : p))
    if (detail?.id === editForm.id) setDetail(norm)
    setEditing(false)
    setShowEdit(false)
    setEditForm(null)
    showToast("Prospect mis à jour ✓")
  }

  // --- SUPPRESSION ---
  async function handleDelete(id: string) {
    await authFetch(`/api/prospects/${id}`, { method: "DELETE" })
    setProspects(ps => ps.filter(p => p.id !== id))
    setConfirmDelete(null)
    if (detail?.id === id) setDetail(null)
    showToast("Prospect supprimé")
  }

  async function handleBulkDelete() {
    await Promise.all([...selectedProspects].map(id => authFetch(`/api/prospects/${id}`, { method: "DELETE" })))
    setProspects(ps => ps.filter(p => !selectedProspects.has(p.id)))
    if (detail && selectedProspects.has(detail.id)) setDetail(null)
    showToast(`${selectedProspects.size} prospect${selectedProspects.size > 1 ? "s" : ""} supprimé${selectedProspects.size > 1 ? "s" : ""}`)
    setSelectedProspects(new Set())
    setConfirmBulk(false)
  }

  function toggleSelectProspect(id: string) {
    setSelectedProspects(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // --- STATUT ---
  async function updateStatut(id: string, statut: StatutProspect) {
    const prospect = prospects.find(p => p.id === id)
    if (!prospect) return
    const res = await authFetch(`/api/prospects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...prospect, statut, rappel: prospect.rappel ? new Date(prospect.rappel).toISOString() : null }),
    })
    const updated = await res.json()
    const norm = normalize(updated)
    setProspects(ps => ps.map(p => p.id === id ? norm : p))
    if (detail?.id === id) setDetail(norm)
  }

  function handleExport() {
    const exportData = filtered.map(p => ({
      Nom: p.nom,
      Téléphone: p.telephone ?? "",
      Email: p.email ?? "",
      "Budget (€)": p.budget,
      Critères: p.criteres ?? "",
      Statut: p.statut,
      Rappel: p.rappel ? new Date(p.rappel).toLocaleDateString("fr-FR") : "",
      "Biens visités": p.biensVisites?.join(", ") ?? "",
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Prospects")
    XLSX.writeFile(wb, `prospects_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* TOPBAR */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-lg font-extrabold text-gray-900">Prospects</h1>
        <div className="flex items-center gap-3">
          {prospects.length > 0 && (
            <button onClick={handleExport}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-full hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exporter
            </button>
          )}
          {selectedProspects.size > 0 && (
            <button onClick={() => setConfirmBulk(true)}
              className="bg-red-500 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-red-600 transition-colors">
              Supprimer ({selectedProspects.size})
            </button>
          )}
          {planLimit !== null && prospects.length >= planLimit ? (
            <a href="/pricing" className="bg-indigo-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-colors">
              Passer au Pro →
            </a>
          ) : (
            <button
              onClick={() => { setCreateForm({ ...EMPTY_NEW }); setShowCreate(true) }}
              className="bg-indigo-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-colors"
            >
              + Nouveau prospect
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        <PlanBanner usage={prospects.length} limit={planLimit} label="Prospects" />

        {/* FILTRES + RECHERCHE */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <input
            placeholder="Rechercher un prospect..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
          />
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

        {/* LISTE ACCORDÉON */}
        {filtered.length === 0 ? (
          prospects.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-base font-extrabold text-gray-900 mb-1">Aucun prospect pour l&apos;instant</p>
              <p className="text-sm text-gray-400 font-medium mb-5">Ajoute ton premier contact acheteur.</p>
              <button
                onClick={() => { setCreateForm({ ...EMPTY_NEW }); setShowCreate(true) }}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-colors"
              >
                + Ajouter mon premier prospect
              </button>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm font-medium">Aucun prospect dans cette catégorie.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(p => {
              const isOpen = detail?.id === p.id
              const isChecked = selectedProspects.has(p.id)
              const rs = getRappelStatus(p.rappel)
              return (
                <div key={p.id} className={`bg-white rounded-2xl border transition-all ${isChecked ? "border-red-300 bg-red-50" : isOpen ? "border-indigo-300" : "border-gray-200 hover:border-indigo-200"}`}>

                  {/* EN-TÊTE — toujours visible */}
                  <div
                    className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                    onClick={() => setDetail(isOpen ? null : p)}
                  >
                    <input type="checkbox" checked={isChecked}
                      onChange={() => toggleSelectProspect(p.id)}
                      onClick={e => e.stopPropagation()}
                      className={`w-4 h-4 rounded accent-red-500 shrink-0 cursor-pointer transition-opacity ${isChecked ? "opacity-100" : "opacity-30"}`} />

                    {/* Nom */}
                    <p className="font-bold text-sm text-gray-900 flex-1 min-w-0 truncate">{p.nom}</p>

                    {/* Rappel indicator */}
                    {rs && (
                      <span className={`text-xs font-bold shrink-0 ${rs === "overdue" ? "text-red-500" : "text-amber-500"}`}>
                        {rs === "overdue" ? "🔴 En retard" : "🔔 Aujourd'hui"}
                      </span>
                    )}

                    {/* Budget */}
                    <span className="text-sm font-extrabold text-indigo-600 shrink-0">{p.budget.toLocaleString("fr-FR")} €</span>

                    {/* Statut */}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${statutConfig[p.statut].classes}`}>
                      {statutConfig[p.statut].label}
                    </span>

                    {/* Chevron */}
                    <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* DÉTAIL — visible si ouvert */}
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      {/* Actions */}
                      <div className="flex gap-2 justify-end pt-3 mb-4">
                        <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-colors text-xs font-bold">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Modifier
                        </button>
                        <button onClick={() => setConfirmDelete(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors text-xs font-bold">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Supprimer
                        </button>
                      </div>

                      {/* Infos en grille */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        {[
                          { label: "Téléphone", value: p.telephone || "—" },
                          { label: "Email", value: p.email || "—" },
                          { label: "Budget max", value: `${p.budget.toLocaleString("fr-FR")} €` },
                          { label: "Rappel", value: p.rappel ? new Date(p.rappel).toLocaleDateString("fr-FR") : "—" },
                        ].map(item => (
                          <div key={item.label}>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {p.criteres && (
                        <div className="mb-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Critères</p>
                          <p className="text-sm font-medium text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5">{p.criteres}</p>
                        </div>
                      )}

                      {p.biensVisites.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Biens visités</p>
                          <div className="flex flex-col gap-1">
                            {p.biensVisites.map(b => (
                              <span key={b} className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-2">📍 {b}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Changer statut */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Statut</p>
                        <div className="flex gap-2 flex-wrap">
                          {(Object.keys(statutConfig) as StatutProspect[]).map(s => (
                            <button key={s} onClick={() => updateStatut(p.id, s)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${p.statut === s ? statutConfig[s].classes + " ring-2 ring-offset-1 ring-indigo-400" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                              {statutConfig[s].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Supprimer ce prospect ?</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Cette action est irréversible. Le prospect sera définitivement supprimé.</p>
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

      {/* ── MODAL CRÉATION ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">Nouveau prospect</h2>
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nom complet *</label>
                  <input value={createForm.nom} onChange={e => setCreateForm(f => ({ ...f, nom: e.target.value }))} placeholder="Julie Martin"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Statut initial</label>
                  <select value={createForm.statut} onChange={e => setCreateForm(f => ({ ...f, statut: e.target.value as StatutProspect }))}
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
                  <input value={createForm.telephone} onChange={e => setCreateForm(f => ({ ...f, telephone: e.target.value }))} placeholder="06 12 34 56 78"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
                  <input value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@email.fr"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Budget max (€)</label>
                  <input type="number" value={createForm.budget || ""} onChange={e => setCreateForm(f => ({ ...f, budget: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date de rappel</label>
                  <input type="date" value={createForm.rappel} onChange={e => setCreateForm(f => ({ ...f, rappel: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Critères de recherche</label>
                <textarea rows={3} value={createForm.criteres} onChange={e => setCreateForm(f => ({ ...f, criteres: e.target.value }))}
                  placeholder="Appartement 3 pièces, lumineux, Paris intramuros..."
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowCreate(false); setCreateForm({ ...EMPTY_NEW }) }}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-gray-400 transition-colors">
                Annuler
              </button>
              <button onClick={handleCreate} disabled={creating || !createForm.nom}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60">
                {creating ? "Enregistrement..." : "Ajouter le prospect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ÉDITION ── */}
      {showEdit && editForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header coloré */}
            <div className="bg-indigo-600 rounded-t-3xl px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Modifier le prospect</p>
                  <h2 className="text-xl font-extrabold text-white">{editForm.nom}</h2>
                </div>
                <button onClick={() => { setShowEdit(false); setEditForm(null) }} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-8 py-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nom complet</label>
                  <input value={editForm.nom} onChange={e => setEditForm(f => f ? { ...f, nom: e.target.value } : f)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Statut</label>
                  <select value={editForm.statut} onChange={e => setEditForm(f => f ? { ...f, statut: e.target.value as StatutProspect } : f)}
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
                  <input value={editForm.telephone ?? ""} onChange={e => setEditForm(f => f ? { ...f, telephone: e.target.value } : f)} placeholder="06 12 34 56 78"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
                  <input value={editForm.email ?? ""} onChange={e => setEditForm(f => f ? { ...f, email: e.target.value } : f)} placeholder="contact@email.fr"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Budget max (€)</label>
                  <input type="number" value={editForm.budget || ""} onChange={e => setEditForm(f => f ? { ...f, budget: Number(e.target.value) } : f)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date de rappel</label>
                  <input type="date" value={editForm.rappel ?? ""} onChange={e => setEditForm(f => f ? { ...f, rappel: e.target.value } : f)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Critères de recherche</label>
                <textarea rows={3} value={editForm.criteres ?? ""} onChange={e => setEditForm(f => f ? { ...f, criteres: e.target.value } : f)}
                  placeholder="Appartement 3 pièces, lumineux, Paris intramuros..."
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-400 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowEdit(false); setEditForm(null) }}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-gray-400 transition-colors">
                  Annuler
                </button>
                <button onClick={handleEdit} disabled={editing || !editForm.nom}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {editing ? "Enregistrement..." : "Sauvegarder les modifications"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION BULK DELETE */}
      {confirmBulk && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Supprimer {selectedProspects.size} prospect{selectedProspects.size > 1 ? "s" : ""} ?</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Cette action est irréversible. Les prospects sélectionnés seront définitivement supprimés.</p>
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
