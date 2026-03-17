import type { CriteresParses } from "./parseProspectCriteres"

/**
 * Barème sur 100 :
 *   Budget          30 pts   (seuil : < 80% du prix → score faible)
 *   Type de bien    20 pts   (10 si aucune préférence exprimée)
 *   Secteur/ville   20 pts   (10 si aucun secteur exprimé)
 *   Nombre pièces   15 pts   (8 si aucun critère)
 *   Surface          5 pts   (3 si aucun critère)
 *   Équipements      5 pts
 *   DPE              3 pts
 *   Investissement   2 pts
 *   ─────────────────────
 *   Total          100 pts
 */

interface MandatForScore {
  type: string
  ville: string
  surface: number
  pieces: number
  prix: number
  dpe?: string | null
  parking: boolean
  cave: boolean
  balcon: boolean
  ascenseur: boolean
  etat?: string | null
}

const DPE_ORDER = ["A", "B", "C", "D", "E", "F", "G"]

export function scoreMatching(
  mandat: MandatForScore,
  parsed: CriteresParses,
  budget: number
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // ── BUDGET (30 pts) ──────────────────────────────────────────────────
  if (budget >= mandat.prix) {
    score += 30
    reasons.push(`Budget OK (${budget.toLocaleString("fr-FR")} €)`)
  } else if (budget >= mandat.prix * 0.92) {
    score += 22
    reasons.push(`Budget proche (${budget.toLocaleString("fr-FR")} €)`)
  } else if (budget >= mandat.prix * 0.85) {
    score += 12
    reasons.push(`Budget limite (${budget.toLocaleString("fr-FR")} €)`)
  }
  // < 85% : 0 pts budget — le prospect reste dans les résultats mais avec un score faible

  // ── TYPE DE BIEN (20 pts) ────────────────────────────────────────────
  if (parsed.typesBien.length > 0) {
    const mandatType = mandat.type.toLowerCase()
    const match = parsed.typesBien.some(t => {
      const tl = t.toLowerCase()
      if (tl === mandatType) return true
      // Studio ↔ appartement 1 pièce
      if (tl === "studio" && mandatType === "appartement" && mandat.pieces <= 1) return true
      if (tl === "appartement" && mandatType === "studio") return true
      return false
    })
    if (match) {
      score += 20
      reasons.push(mandat.type)
    }
    // Pas de points si type ne correspond pas
  } else {
    score += 10 // pas de préférence exprimée → neutre
  }

  // ── SECTEUR / VILLE (20 pts) ─────────────────────────────────────────
  if (parsed.secteurs.length > 0) {
    const mandatVille = mandat.ville.toLowerCase()
    let best = 0
    let bestLabel = ""
    for (const s of parsed.secteurs) {
      const sl = s.toLowerCase()
      // Match exact ou inclusion
      if (mandatVille === sl || mandatVille.includes(sl) || sl.includes(mandatVille)) {
        best = 20; bestLabel = mandat.ville; break
      }
      // Même ville de base (ex : "Paris 11" ↔ "Paris")
      const baseMandat = mandatVille.replace(/\s+\d+$/, "").trim()
      const baseSecteur = sl.replace(/\s+\d+$/, "").trim()
      if (baseMandat === baseSecteur && best < 12) {
        best = 12; bestLabel = mandat.ville
      }
    }
    if (best > 0) {
      score += best
      reasons.push(`Zone: ${bestLabel}`)
    }
  } else {
    score += 10 // pas de secteur → neutre
  }

  // ── NOMBRE DE PIÈCES (15 pts) ────────────────────────────────────────
  if (parsed.piecesMin !== null || parsed.piecesMax !== null) {
    const min = parsed.piecesMin ?? 0
    const max = parsed.piecesMax ?? 99
    if (mandat.pieces >= min && mandat.pieces <= max) {
      score += 15
      reasons.push(`${mandat.pieces} pièce${mandat.pieces > 1 ? "s" : ""}`)
    } else if (mandat.pieces >= min - 1 && mandat.pieces <= max + 1) {
      score += 7
      reasons.push(`${mandat.pieces}p (proche)`)
    }
  } else {
    score += 8 // neutre
  }

  // ── SURFACE (5 pts) ──────────────────────────────────────────────────
  if (parsed.surfaceMin !== null) {
    if (mandat.surface >= parsed.surfaceMin) {
      score += 5
      reasons.push(`${mandat.surface} m²`)
    } else if (mandat.surface >= parsed.surfaceMin * 0.9) {
      score += 3 // un peu en dessous
    }
  } else {
    score += 3 // neutre
  }

  // ── ÉQUIPEMENTS (5 pts) ──────────────────────────────────────────────
  const equips: [boolean | null, boolean, string][] = [
    [parsed.parking, mandat.parking, "Parking"],
    [parsed.balcon, mandat.balcon, "Balcon"],
    [parsed.cave, mandat.cave, "Cave"],
    [parsed.ascenseur, mandat.ascenseur, "Ascenseur"],
    [parsed.jardin, false, "Jardin"],
  ]
  let equipPts = 0
  const equipMatches: string[] = []
  for (const [voulu, dispo, label] of equips) {
    if (voulu === true && dispo) { equipPts += 1.25; equipMatches.push(label) }
  }
  if (equipPts > 0) {
    score += Math.min(Math.round(equipPts), 5)
    reasons.push(equipMatches.join(" + "))
  }

  // ── DPE (3 pts) ───────────────────────────────────────────────────────
  if (parsed.dpeMax && mandat.dpe) {
    const mandatIdx = DPE_ORDER.indexOf(mandat.dpe.toUpperCase())
    const maxIdx = DPE_ORDER.indexOf(parsed.dpeMax.toUpperCase())
    if (mandatIdx !== -1 && maxIdx !== -1 && mandatIdx <= maxIdx) {
      score += 3
      reasons.push(`DPE ${mandat.dpe}`)
    }
  }

  // ── INVESTISSEMENT (2 pts) ───────────────────────────────────────────
  if (
    parsed.investissement &&
    mandat.surface < 50 &&
    ["appartement", "studio"].includes(mandat.type.toLowerCase())
  ) {
    score += 2
    reasons.push("Profil investisseur")
  }

  return { score: Math.min(Math.round(score), 100), reasons }
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent"
  if (score >= 60) return "Très bon"
  if (score >= 40) return "Bon"
  if (score >= 20) return "Moyen"
  return "Faible"
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 bg-emerald-50"
  if (score >= 60) return "text-blue-600 bg-blue-50"
  if (score >= 40) return "text-amber-600 bg-amber-50"
  return "text-gray-400 bg-gray-50"
}
