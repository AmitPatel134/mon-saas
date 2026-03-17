import { describe, it, expect } from "vitest"
import { scoreMatching } from "@/lib/scoreMatching"
import type { CriteresParses } from "@/lib/parseProspectCriteres"

const emptyParsed: CriteresParses = {
  typesBien: [],
  piecesMin: null,
  piecesMax: null,
  surfaceMin: null,
  surfaceMax: null,
  secteurs: [],
  parking: null,
  balcon: null,
  cave: null,
  ascenseur: null,
  jardin: null,
  dpeMax: null,
  neuf: null,
  plainPied: null,
  investissement: null,
  keywords: [],
}

const baseMandat = {
  type: "Appartement",
  ville: "Paris",
  surface: 65,
  pieces: 3,
  prix: 400_000,
  dpe: "C",
  parking: true,
  cave: false,
  balcon: true,
  ascenseur: true,
  etat: null,
}

// ── BUDGET ────────────────────────────────────────────────────────────────────

describe("Budget scoring", () => {
  it("donne 30pts si budget >= prix", () => {
    const { score, reasons } = scoreMatching(baseMandat, emptyParsed, 400_000)
    expect(reasons.some(r => r.includes("Budget OK"))).toBe(true)
    expect(score).toBeGreaterThanOrEqual(30)
  })

  it("donne 22pts si budget entre 92% et 100% du prix", () => {
    const { reasons } = scoreMatching(baseMandat, emptyParsed, 370_000) // 92.5%
    expect(reasons.some(r => r.includes("proche"))).toBe(true)
  })

  it("donne 12pts si budget entre 85% et 92% du prix", () => {
    const { reasons } = scoreMatching(baseMandat, emptyParsed, 345_000) // 86.25%
    expect(reasons.some(r => r.includes("limite"))).toBe(true)
  })

  it("donne 0pt budget si budget < 85% du prix", () => {
    const { reasons } = scoreMatching(baseMandat, emptyParsed, 300_000) // 75%
    expect(reasons.some(r => r.toLowerCase().includes("budget"))).toBe(false)
  })
})

// ── TYPE DE BIEN ──────────────────────────────────────────────────────────────

describe("Type de bien scoring", () => {
  it("donne 20pts si le type correspond exactement", () => {
    const parsed: CriteresParses = { ...emptyParsed, typesBien: ["Appartement"] }
    const { score: withType } = scoreMatching(baseMandat, parsed, 400_000)
    const { score: neutral } = scoreMatching(baseMandat, emptyParsed, 400_000)
    expect(withType).toBeGreaterThan(neutral) // 20pts > 10pts (neutre)
  })

  it("donne 0pt si le type ne correspond pas", () => {
    const parsed: CriteresParses = { ...emptyParsed, typesBien: ["Maison"] }
    const { score: wrongType } = scoreMatching(baseMandat, parsed, 400_000)
    const { score: neutral } = scoreMatching(baseMandat, emptyParsed, 400_000)
    expect(wrongType).toBeLessThan(neutral) // 0pts < 10pts (neutre)
  })

  it("accepte Studio comme équivalent Appartement 1p", () => {
    const studio = { ...baseMandat, type: "Appartement", pieces: 1 }
    const parsed: CriteresParses = { ...emptyParsed, typesBien: ["Studio"] }
    const { score } = scoreMatching(studio, parsed, 400_000)
    expect(score).toBeGreaterThanOrEqual(10) // au moins les 20pts type
  })
})

// ── SECTEUR / VILLE ───────────────────────────────────────────────────────────

describe("Secteur / ville scoring", () => {
  it("donne 20pts sur match exact de ville", () => {
    const parsed: CriteresParses = { ...emptyParsed, secteurs: ["Paris"] }
    const { reasons } = scoreMatching(baseMandat, parsed, 400_000)
    expect(reasons.some(r => r.includes("Zone"))).toBe(true)
  })

  it("donne 0pt sur ville différente", () => {
    const parsed: CriteresParses = { ...emptyParsed, secteurs: ["Lyon"] }
    const { score: wrongCity } = scoreMatching(baseMandat, parsed, 400_000)
    const { score: neutral } = scoreMatching(baseMandat, emptyParsed, 400_000)
    expect(wrongCity).toBeLessThan(neutral)
  })

  it("tolère les arrondissements (Paris 11 ↔ Paris)", () => {
    const mandat11 = { ...baseMandat, ville: "Paris 11" }
    const parsed: CriteresParses = { ...emptyParsed, secteurs: ["Paris"] }
    const { score } = scoreMatching(mandat11, parsed, 400_000)
    expect(score).toBeGreaterThan(0)
  })
})

// ── PIÈCES ────────────────────────────────────────────────────────────────────

describe("Pièces scoring", () => {
  it("donne 15pts quand le mandat est dans la fourchette", () => {
    const parsed: CriteresParses = { ...emptyParsed, piecesMin: 2, piecesMax: 4 }
    const { reasons } = scoreMatching(baseMandat, parsed, 400_000) // 3p dans [2,4]
    expect(reasons.some(r => r.includes("pièce"))).toBe(true)
  })

  it("donne 7pts si mandat est à ±1 pièce de la fourchette", () => {
    const parsed: CriteresParses = { ...emptyParsed, piecesMin: 4, piecesMax: 5 }
    const { score } = scoreMatching(baseMandat, parsed, 400_000) // 3p vs min 4 → proche
    expect(score).toBeGreaterThan(0)
  })

  it("donne 0pt si le mandat est hors fourchette et pas proche", () => {
    const parsed: CriteresParses = { ...emptyParsed, piecesMin: 6, piecesMax: 8 }
    const { reasons } = scoreMatching(baseMandat, parsed, 400_000)
    expect(reasons.some(r => r.includes("pièce"))).toBe(false)
  })
})

// ── SURFACE ───────────────────────────────────────────────────────────────────

describe("Surface scoring", () => {
  it("donne 5pts si surface >= surfaceMin", () => {
    const parsed: CriteresParses = { ...emptyParsed, surfaceMin: 60 }
    const { reasons } = scoreMatching(baseMandat, parsed, 400_000) // 65 >= 60
    expect(reasons.some(r => r.includes("m²"))).toBe(true)
  })

  it("donne 0pt si surface bien en dessous du minimum", () => {
    const parsed: CriteresParses = { ...emptyParsed, surfaceMin: 80 }
    const { reasons } = scoreMatching(baseMandat, parsed, 400_000) // 65 << 80
    expect(reasons.some(r => r.includes("m²"))).toBe(false)
  })
})

// ── ÉQUIPEMENTS ───────────────────────────────────────────────────────────────

describe("Équipements scoring", () => {
  it("donne des points pour parking + balcon disponibles", () => {
    const parsed: CriteresParses = { ...emptyParsed, parking: true, balcon: true }
    const { reasons } = scoreMatching(baseMandat, parsed, 400_000)
    expect(reasons.some(r => r.includes("Parking") || r.includes("Balcon"))).toBe(true)
  })

  it("ne donne pas de points pour cave voulue mais absente", () => {
    const parsed: CriteresParses = { ...emptyParsed, cave: true }
    const { reasons } = scoreMatching(baseMandat, parsed, 400_000) // cave: false
    expect(reasons.some(r => r.includes("Cave"))).toBe(false)
  })
})

// ── DPE ───────────────────────────────────────────────────────────────────────

describe("DPE scoring", () => {
  it("donne 3pts si DPE mandat <= dpeMax prospect", () => {
    const parsed: CriteresParses = { ...emptyParsed, dpeMax: "D" }
    const { reasons } = scoreMatching(baseMandat, parsed, 400_000) // C <= D ✓
    expect(reasons.some(r => r.includes("DPE"))).toBe(true)
  })

  it("ne donne pas de points si DPE mandat > dpeMax prospect", () => {
    const parsed: CriteresParses = { ...emptyParsed, dpeMax: "B" }
    const { reasons } = scoreMatching(baseMandat, parsed, 400_000) // C > B ✗
    expect(reasons.some(r => r.includes("DPE"))).toBe(false)
  })
})

// ── GLOBAL ────────────────────────────────────────────────────────────────────

describe("Score global", () => {
  it("ne dépasse jamais 100", () => {
    const perfect: CriteresParses = {
      ...emptyParsed,
      typesBien: ["Appartement"],
      secteurs: ["Paris"],
      piecesMin: 3,
      piecesMax: 3,
      surfaceMin: 60,
      parking: true,
      balcon: true,
      dpeMax: "D",
    }
    const { score } = scoreMatching(baseMandat, perfect, 400_000)
    expect(score).toBeLessThanOrEqual(100)
  })

  it("score de 0 si budget très insuffisant et aucun critère ne correspond", () => {
    const noMatch: CriteresParses = {
      ...emptyParsed,
      typesBien: ["Maison"],
      secteurs: ["Lyon"],
      piecesMin: 6,
      piecesMax: 8,
      surfaceMin: 150, // bien au-dessus des 65m² du mandat → 0pt surface
    }
    const { score } = scoreMatching(baseMandat, noMatch, 200_000) // budget à 50%
    expect(score).toBe(0)
  })
})
