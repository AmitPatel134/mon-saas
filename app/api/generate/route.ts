import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: Request) {
  const { mandat, mode, portail } = await request.json()

  const details = [
    `Type de bien : ${mandat.type}`,
    `Adresse : ${mandat.adresse}, ${mandat.ville}`,
    `Surface habitable : ${mandat.surface} m²`,
    `Nombre de pièces : ${mandat.pieces}`,
    `Prix de vente : ${mandat.prix.toLocaleString("fr-FR")} €`,
    mandat.etage != null ? `Étage : ${mandat.etage === 0 ? "Rez-de-chaussée" : `${mandat.etage}ème étage`}` : null,
    mandat.anneeConstruction ? `Année de construction : ${mandat.anneeConstruction}` : null,
    mandat.exposition ? `Exposition : ${mandat.exposition}` : null,
    mandat.chauffage ? `Chauffage : ${mandat.chauffage}` : null,
    mandat.dpe ? `Classe DPE : ${mandat.dpe}` : null,
    mandat.etat ? `État général : ${mandat.etat}` : null,
    mandat.charges ? `Charges mensuelles : ${mandat.charges} €/mois` : null,
    mandat.parking ? "Parking / Garage : Oui" : null,
    mandat.cave ? "Cave : Oui" : null,
    mandat.balcon ? "Balcon / Terrasse : Oui" : null,
    mandat.ascenseur ? "Ascenseur : Oui" : null,
    mandat.description ? `Notes complémentaires de l'agent : ${mandat.description}` : null,
  ].filter(Boolean).join("\n")

  let systemPrompt: string
  let userPrompt: string

  if (mode === "annonce") {
    const reglesParPortail: Record<string, string> = {
      SeLoger: `
- Ton professionnel mais chaleureux, orienté acheteur cadre/famille
- Commence par une phrase d'accroche percutante mettant en valeur le point fort principal du bien
- Structure : accroche → description narrative du bien → liste à puces des caractéristiques clés → prix → appel à l'action
- Utilise des emojis avec modération (🏠 💡 ✅ 💰) pour aérer
- Longueur : 200 à 280 mots
- Mentionne l'environnement du quartier si possible`,
      Leboncoin: `
- Ton direct, factuel, sans fioriture — l'acheteur cherche l'essentiel rapidement
- Titre court et percutant incluant type + pièces + surface + prix
- Description courte et dense : 120 à 180 mots maximum
- Liste les points clés en tirets
- Termine par "Contactez-nous pour visiter"
- Pas d'emojis`,
      "Logic-Immo": `
- Format structuré et professionnel, style agence premium
- Commence par une référence bien (ex: Réf. CLO-XXXX)
- Utilise des majuscules pour les titres de section (DESCRIPTION, CARACTÉRISTIQUES, INFORMATIONS PRATIQUES)
- Ton neutre et informatif
- Longueur : 180 à 250 mots
- Mentionne les honoraires d'agence inclus dans le prix`,
    }

    systemPrompt = `Tu es un expert en rédaction d'annonces immobilières pour agents professionnels en France. Tu rédiges des annonces parfaitement adaptées au style et aux codes de chaque portail immobilier. Tes annonces sont persuasives, précises et mettent en valeur les points forts du bien.`

    userPrompt = `Rédige une annonce immobilière pour le portail ${portail} avec les informations suivantes :

${details}

Règles spécifiques pour ${portail} :${reglesParPortail[portail] ?? "Ton professionnel, 200 mots environ."}

Utilise uniquement les informations fournies. Ne mets pas de crochets ou de placeholders comme [nom de l'agent]. Rédige directement le texte final prêt à publier.`
  } else {
    systemPrompt = `Tu es un expert en relation client pour agents immobiliers en France. Tu rédiges des emails de relance courts, personnalisés et efficaces qui donnent envie de répondre. Le ton est professionnel mais humain.`

    userPrompt = `Rédige un email de relance destiné à un prospect acheteur pour lui présenter ce bien immobilier :

${details}

Consignes :
- Objet de l'email inclus en première ligne (format "Objet : ...")
- Commence par "Bonjour," sans prénom (l'agent le personnalisera)
- Rappelle brièvement le projet du prospect (utilise une formule générique comme "votre recherche")
- Présente le bien de manière attrayante en 3-4 phrases maximum
- Insiste sur 2-3 points forts du bien les plus saillants
- Propose concrètement une visite avec urgence douce
- Termine par "Bien cordialement," suivi de "[Votre prénom]" sur une nouvelle ligne, puis "Agent immobilier" en dessous
- Longueur totale : 150 à 200 mots maximum
- Ton : professionnel mais chaleureux, jamais agressif commercialement`
  }

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 800,
  })

  const texte = completion.choices[0].message.content ?? ""
  return Response.json({ texte })
}
