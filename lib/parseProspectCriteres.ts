import Groq from "groq-sdk"

export interface CriteresParses {
  typesBien: string[]       // ["appartement","maison","studio","loft","local commercial","terrain"]
  piecesMin: number | null
  piecesMax: number | null
  surfaceMin: number | null
  surfaceMax: number | null
  secteurs: string[]        // villes, arrondissements, quartiers
  parking: boolean | null
  balcon: boolean | null
  cave: boolean | null
  ascenseur: boolean | null
  jardin: boolean | null
  dpeMax: string | null     // lettre DPE max acceptable (ex: "C" = A,B,C OK)
  neuf: boolean | null      // cherche du neuf/VEFA
  plainPied: boolean | null // rez-de-chaussée, plain-pied
  investissement: boolean   // achat pour investissement locatif
  keywords: string[]        // autres critères libres importants
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM = `Tu es un assistant immobilier expert français. Tu analyses les critères de recherche d'acheteurs immobiliers et tu extrais des données structurées. Sois exhaustif dans l'interprétation des abréviations et du langage courant immobilier français : "appt"/"appart" = appartement, "2p"/"F2"/"T2" = 2 pièces (type appartement), "3p"/"F3"/"T3" = 3 pièces, "immo"/"investissement locatif"/"rendement"/"locatif" = investissement, "RP" = résidence principale (pas investissement), "pdc" ou "plain-pied" = plain-pied, etc. Pour les secteurs, inclus tout ce qui est mentionné (villes, arrondissements, quartiers, banlieues).`

const SCHEMA = `{
  "typesBien": [],
  "piecesMin": null,
  "piecesMax": null,
  "surfaceMin": null,
  "surfaceMax": null,
  "secteurs": [],
  "parking": null,
  "balcon": null,
  "cave": null,
  "ascenseur": null,
  "jardin": null,
  "dpeMax": null,
  "neuf": null,
  "plainPied": null,
  "investissement": false,
  "keywords": []
}`

export async function parseProspectCriteres(criteres: string, budget: number): Promise<CriteresParses> {
  if (!criteres?.trim()) return emptyParse()
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Analyse ces critères de recherche immobilière et retourne UNIQUEMENT un JSON valide avec cette structure (null si non mentionné) :\n${SCHEMA}\n\nCritères : "${criteres}"\nBudget : ${budget} €`,
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: "json_object" },
    })
    return JSON.parse(res.choices[0]?.message?.content ?? "{}") as CriteresParses
  } catch {
    return emptyParse()
  }
}

export async function parseBatchCriteres(
  items: { criteres: string; budget: number }[]
): Promise<CriteresParses[]> {
  if (!items.length) return []
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Analyse ces ${items.length} critères de recherche immobilière. Retourne un JSON avec une clé "results" contenant un tableau de ${items.length} objets dans le même ordre que les entrées.\n\nChaque objet suit cette structure (null si non mentionné) :\n${SCHEMA}\n\nCritères à analyser :\n${items.map((it, i) => `[${i}] Budget ${it.budget}€ — "${it.criteres ?? ""}"`).join("\n")}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 6000,
      response_format: { type: "json_object" },
    })
    const data = JSON.parse(res.choices[0]?.message?.content ?? "{}")
    const results: CriteresParses[] = data.results ?? []
    return items.map((_, i) => results[i] ?? emptyParse())
  } catch {
    return items.map(() => emptyParse())
  }
}

function emptyParse(): CriteresParses {
  return {
    typesBien: [], piecesMin: null, piecesMax: null, surfaceMin: null, surfaceMax: null,
    secteurs: [], parking: null, balcon: null, cave: null, ascenseur: null, jardin: null,
    dpeMax: null, neuf: null, plainPied: null, investissement: false, keywords: [],
  }
}
