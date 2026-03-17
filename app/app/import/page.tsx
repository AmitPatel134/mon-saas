"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { authFetch } from "@/lib/authFetch"
import * as XLSX from "xlsx"
import LoadingScreen from "@/components/LoadingScreen"
import Toast from "@/components/Toast"

type EntityType = "mandats" | "prospects"
type Step = "upload" | "analyzing" | "preview" | "importing" | "done"

export default function ImportPage() {
  const [ready, setReady] = useState(false)
  const [step, setStep] = useState<Step>("upload")
  const [entityType, setEntityType] = useState<EntityType>("mandats")
  const [fileName, setFileName] = useState("")
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([])
  const [mappedRows, setMappedRows] = useState<Record<string, unknown>[]>([])
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      setReady(true)
    })
  }, [])

  function handleFile(file: File) {
    setFileName(file.name)
    const reader = new FileReader()
    const isCsv = file.name.toLowerCase().endsWith(".csv")

    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = isCsv
        ? XLSX.read(data, { type: "string" })
        : XLSX.read(data, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[]
      setRawRows(rows)
    }

    if (isCsv) reader.readAsText(file, "UTF-8")
    else reader.readAsArrayBuffer(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleAnalyze() {
    if (!rawRows.length) { showToast("Aucune donnée dans le fichier"); return }
    setStep("analyzing")
    try {
      const res = await authFetch("/api/import/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: rawRows.slice(0, 200), entityType }),
      })
      if (!res.ok) throw new Error()
      const { results } = await res.json()
      if (!results?.length) throw new Error()
      setMappedRows(results)
      setSelectedRows(new Set(results.map((_: unknown, i: number) => i)))
      setStep("preview")
    } catch {
      showToast("Erreur lors de l'analyse. Vérifie le format du fichier.")
      setStep("upload")
    }
  }

  async function handleConfirm() {
    const rows = mappedRows.filter((_, i) => selectedRows.has(i))
    if (!rows.length) { showToast("Aucune ligne sélectionnée"); return }
    setStep("importing")
    const res = await authFetch("/api/import/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, rows }),
    })
    if (res.ok) setStep("done")
    else { showToast("Erreur lors de l'import"); setStep("preview") }
  }

  function toggleRow(i: number) {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const MANDAT_FIELDS = ["type", "adresse", "ville", "surface", "pieces", "prix", "statut", "dpe", "parking", "balcon", "cave"]
  const PROSPECT_FIELDS = ["nom", "telephone", "email", "budget", "criteres", "statut"]
  const fields = entityType === "mandats" ? MANDAT_FIELDS : PROSPECT_FIELDS

  if (!ready) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-40">
        <h1 className="text-lg font-extrabold text-gray-900">Importer des données</h1>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Étape 1 : Upload */}
        {step === "upload" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Type de données</p>
              <div className="flex gap-3">
                {(["mandats", "prospects"] as EntityType[]).map(t => (
                  <button key={t} onClick={() => setEntityType(t)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${entityType === t ? "bg-fuchsia-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {t === "mandats" ? "Mandats" : "Prospects"}
                  </button>
                ))}
              </div>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-fuchsia-400 p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-fuchsia-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              {fileName ? (
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">{fileName}</p>
                  <p className="text-xs text-gray-400 mt-1">{rawRows.length} lignes détectées</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">Glisse ton fichier ici ou clique pour choisir</p>
                  <p className="text-xs text-gray-400 mt-1">CSV ou Excel (.xlsx) · 200 lignes max</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>

            {rawRows.length > 0 && (
              <button onClick={handleAnalyze}
                className="w-full py-4 bg-fuchsia-600 text-white font-extrabold rounded-2xl hover:bg-fuchsia-700 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analyser avec l&apos;IA →
              </button>
            )}
          </div>
        )}

        {/* Étape 2 : Analyse en cours */}
        {step === "analyzing" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 flex flex-col items-center gap-5">
            <div className="w-12 h-12 border-4 border-fuchsia-200 border-t-fuchsia-600 rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-lg font-extrabold text-gray-900">Analyse en cours...</p>
              <p className="text-sm text-gray-500 mt-1">L&apos;IA mappe tes colonnes vers le schéma CleoAI</p>
            </div>
          </div>
        )}

        {/* Étape 3 : Preview */}
        {step === "preview" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-extrabold text-gray-900">
                  {selectedRows.size} / {mappedRows.length} lignes sélectionnées
                </p>
                <p className="text-sm text-gray-500 mt-0.5">Décoche les lignes incorrectes avant d&apos;importer</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setStep("upload"); setMappedRows([]); setRawRows([]); setFileName("") }}
                  className="px-4 py-2.5 border-2 border-gray-200 text-sm font-bold text-gray-600 rounded-xl hover:border-gray-400 transition-colors">
                  Recommencer
                </button>
                <button onClick={handleConfirm} disabled={selectedRows.size === 0}
                  className="px-5 py-2.5 bg-fuchsia-600 text-white text-sm font-bold rounded-xl hover:bg-fuchsia-700 transition-colors disabled:opacity-50">
                  Importer {selectedRows.size} {entityType === "mandats" ? "mandats" : "prospects"} →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input type="checkbox" checked={selectedRows.size === mappedRows.length}
                          onChange={e => setSelectedRows(e.target.checked ? new Set(mappedRows.map((_, i) => i)) : new Set())}
                          className="rounded" />
                      </th>
                      {fields.map(f => (
                        <th key={f} className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {mappedRows.map((row, i) => (
                      <tr key={i} onClick={() => toggleRow(i)}
                        className={`cursor-pointer transition-colors ${selectedRows.has(i) ? "bg-white hover:bg-gray-50" : "bg-gray-50 opacity-40 hover:opacity-60"}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selectedRows.has(i)} onChange={() => toggleRow(i)} className="rounded" onClick={e => e.stopPropagation()} />
                        </td>
                        {fields.map(f => (
                          <td key={f} className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap max-w-32 truncate">
                            {row[f] === null || row[f] === undefined ? (
                              <span className="text-gray-300">—</span>
                            ) : typeof row[f] === "boolean" ? (
                              <span className={row[f] ? "text-emerald-600" : "text-gray-300"}>{row[f] ? "Oui" : "Non"}</span>
                            ) : (
                              String(row[f])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Étape 4 : Import en cours */}
        {step === "importing" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 flex flex-col items-center gap-5">
            <div className="w-12 h-12 border-4 border-fuchsia-200 border-t-fuchsia-600 rounded-full animate-spin" />
            <p className="text-lg font-extrabold text-gray-900">Import en cours...</p>
          </div>
        )}

        {/* Étape 5 : Succès */}
        {step === "done" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-gray-900">Import réussi !</p>
              <p className="text-sm text-gray-500 mt-1">{selectedRows.size} {entityType === "mandats" ? "mandats" : "prospects"} ajoutés</p>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => { setStep("upload"); setMappedRows([]); setRawRows([]); setFileName("") }}
                className="px-5 py-2.5 border-2 border-gray-200 text-sm font-bold text-gray-600 rounded-xl hover:border-gray-400 transition-colors">
                Nouvel import
              </button>
              <a href={entityType === "mandats" ? "/app/mandats" : "/app/prospects"}
                className="px-5 py-2.5 bg-fuchsia-600 text-white text-sm font-bold rounded-xl hover:bg-fuchsia-700 transition-colors">
                Voir les {entityType} →
              </a>
            </div>
          </div>
        )}

      </div>

      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
    </div>
  )
}
