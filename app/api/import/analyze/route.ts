import Groq from "groq-sdk"
import { createRateLimiter } from "@/lib/rate-limit"
import { getAuthUser } from "@/lib/authServer"
import { NextRequest } from "next/server"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const rateLimit = createRateLimiter({ maxRequests: 5, windowMs: 60_000 })

const MANDAT_PROMPT = `Tu reçois des données brutes exportées depuis le logiciel d'un agent immobilier français. Transforme chaque ligne en objet JSON selon ce schéma exact.

Schéma mandat :
- type (string, obligatoire) : "Appartement" | "Maison" | "Studio" | "Loft" | "Terrain" | "Local commercial" | "Autre"
- adresse (string, obligatoire)
- ville (string, obligatoire)
- surface (number, obligatoire) : en m², sans unité
- pieces (number, obligatoire) : nombre entier
- prix (number, obligatoire) : en euros, sans symbole ni espace
- statut (string) : "disponible" | "sous-compromis" | "vendu" — défaut "disponible"
- etage (number | null)
- exposition (string | null) : ex "Sud", "Sud-Ouest"
- chauffage (string | null)
- dpe (string | null) : lettre A-G uniquement
- etat (string | null)
- charges (number | null) : en euros/mois
- anneeConstruction (number | null)
- parking (boolean) : défaut false
- cave (boolean) : défaut false
- balcon (boolean) : défaut false
- ascenseur (boolean) : défaut false
- description (string | null)

Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown ni explication. Omets les lignes vides ou sans données essentielles.`

const PROSPECT_PROMPT = `Tu reçois des données brutes exportées depuis le logiciel d'un agent immobilier français. Transforme chaque ligne en objet JSON selon ce schéma exact.

Schéma prospect :
- nom (string, obligatoire) : nom complet
- telephone (string | null)
- email (string | null)
- budget (number) : en euros, défaut 0
- criteres (string | null) : critères de recherche résumés en une phrase
- statut (string) : "nouveau" | "en-recherche" | "chaud" | "signé" — défaut "nouveau"

Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown ni explication. Omets les lignes vides ou sans données essentielles.`

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser) return Response.json({ error: "Non autorisé" }, { status: 401 })

  const limited = rateLimit(request)
  if (limited) return limited

  const { rows, entityType } = await request.json()
  if (!rows?.length || !entityType) {
    return Response.json({ error: "rows et entityType requis" }, { status: 400 })
  }

  // Traiter par batch de 50 lignes max pour respecter les limites de tokens
  const batchSize = 50
  const batches = []
  for (let i = 0; i < Math.min(rows.length, 200); i += batchSize) {
    batches.push(rows.slice(i, i + batchSize))
  }

  const systemPrompt = entityType === "mandats" ? MANDAT_PROMPT : PROSPECT_PROMPT
  const allResults: unknown[] = []

  for (const batch of batches) {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Données à transformer (${batch.length} lignes) :\n${JSON.stringify(batch)}` },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    })

    const text = completion.choices[0].message.content ?? "[]"
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim())
      if (Array.isArray(parsed)) allResults.push(...parsed)
    } catch {
      // batch ignoré si JSON invalide
    }
  }

  return Response.json({ results: allResults })
}
