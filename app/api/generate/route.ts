import Groq from "groq-sdk"
import { prisma } from "@/lib/prisma"
import { getLimit, isPro } from "@/lib/plans"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: Request) {
  const { mandat, mode, portail, email, ton = "professionnel", longueur = "standard", instructions = "", visiteData, userName } = await request.json()

  if (email) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (user && !isPro(user.plan)) {
      const firstOfMonth = new Date()
      firstOfMonth.setDate(1)
      firstOfMonth.setHours(0, 0, 0, 0)
      const count = await prisma.generation.count({ where: { userId: user.id, createdAt: { gte: firstOfMonth } } })
      const limit = getLimit(user.plan, "generationsPerMonth")
      if (count >= limit) {
        return Response.json({ error: "LIMIT_REACHED", limit }, { status: 403 })
      }
    }
  }

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

  const tonMap: Record<string, string> = {
    professionnel: "Adopte un ton professionnel et soigné.",
    chaleureux: "Adopte un ton chaleureux et humain, proche du lecteur, comme si tu parlais à quelqu'un de proche.",
    luxe: "Adopte un ton premium et haut de gamme. Vocabulaire élégant, phrases raffinées, discret. Comme un bien d'exception.",
    percutant: "Adopte un ton direct et percutant. Phrases courtes, mots forts, rythme rapide. Donne envie d'agir immédiatement.",
  }

  const longueurMap: Record<string, string> = {
    court: "CONTRAINTE DE LONGUEUR : Texte très court, 80 à 120 mots maximum. Va à l'essentiel.",
    standard: "",
    long: "CONTRAINTE DE LONGUEUR : Texte développé, 280 à 380 mots. Enrichis chaque détail, contextualise, développe.",
  }

  const tonInstruction = tonMap[ton] ?? tonMap.professionnel
  const longueurInstruction = longueur !== "standard" ? longueurMap[longueur] : ""
  const customInstruction = instructions ? `Instructions spécifiques de l'agent : ${instructions}` : ""

  let systemPrompt: string
  let userPrompt: string

  if (mode === "annonce") {
    const reglesParPortail: Record<string, string> = {
      SeLoger: `- Ton professionnel mais chaleureux, orienté acheteur cadre/famille
- Commence par une phrase d'accroche percutante mettant en valeur le point fort principal
- Structure : accroche → description narrative → liste à puces des caractéristiques → prix → appel à l'action
- Utilise des emojis avec modération (🏠 💡 ✅) pour aérer
- Longueur par défaut : 220 à 280 mots
- Mentionne l'environnement du quartier si possible`,
      Leboncoin: `- Ton direct, factuel, sans fioriture
- Titre court et percutant : type + pièces + surface + prix
- Description courte et dense : 120 à 180 mots par défaut
- Liste les points clés en tirets
- Termine par "Contactez-nous pour visiter"
- Pas d'emojis`,
      "Logic-Immo": `- Format structuré et professionnel, style agence premium
- Commence par une référence bien (ex: Réf. CLO-XXXX)
- Titres de sections en majuscules : DESCRIPTION, CARACTÉRISTIQUES, INFORMATIONS PRATIQUES
- Ton neutre et informatif
- Longueur par défaut : 200 à 260 mots
- Mentionne les honoraires d'agence inclus dans le prix`,
      PAP: `- Ton vendeur particulier, direct et factuel
- Pas de mention d'agence, pas d'honoraires
- Titre avec type + surface + ville + prix
- Liste les caractéristiques clés clairement en tirets
- Longueur par défaut : 120 à 180 mots`,
      "Bien'ici": `- Format moderne et aéré, style nouvelle génération
- Accroche forte en première phrase, met en valeur l'émotion (luminosité, volumes, emplacement)
- Utilise des emojis pour structurer (🌟 📍 ✨ 🔑)
- Mentionne le quartier, transports, écoles si pertinent
- Longueur par défaut : 180 à 240 mots`,
    }

    systemPrompt = `Tu es un expert en rédaction d'annonces immobilières pour agents professionnels en France. Tu rédiges des annonces parfaitement adaptées au style et aux codes de chaque portail. Tes annonces sont persuasives, précises et mettent en valeur les points forts du bien.`

    userPrompt = `Rédige une annonce immobilière pour le portail ${portail} avec les informations suivantes :

${details}

Règles spécifiques ${portail} :
${reglesParPortail[portail] ?? "Ton professionnel, 200 mots environ."}

${tonInstruction} ${longueurInstruction}
${customInstruction}

Utilise uniquement les informations fournies. Ne mets pas de crochets ou placeholders. Rédige directement le texte final prêt à publier.`

  } else if (mode === "email") {
    systemPrompt = `Tu es un expert en relation client pour agents immobiliers en France. Tu rédiges des emails de relance courts, personnalisés et efficaces qui donnent envie de répondre.`

    userPrompt = `Rédige un email de relance destiné à un prospect acheteur pour lui présenter ce bien :

${details}

Consignes :
- Objet de l'email en première ligne (format "Objet : ...")
- Commence par "Bonjour," sans prénom
- Rappelle brièvement le projet du prospect (formule générique "votre recherche")
- Présente le bien de manière attrayante en 3-4 phrases
- Insiste sur 2-3 points forts saillants
- Propose une visite avec urgence douce
- Termine par "Bien cordialement," [Votre prénom] / Agent immobilier
- Longueur par défaut : 150 à 200 mots

${tonInstruction} ${longueurInstruction}
${customInstruction}`

  } else if (mode === "sms") {
    // Only use the essential info for SMS
    const mainDetails = [
      `Type : ${mandat.type}`,
      `Surface : ${mandat.surface} m²`,
      `Pièces : ${mandat.pieces}`,
      `Ville : ${mandat.ville}`,
      `Prix : ${mandat.prix.toLocaleString("fr-FR")} €`,
      // One standout feature only
      mandat.balcon ? "Balcon/Terrasse" : mandat.parking ? "Parking" : mandat.cave ? "Cave" : null,
    ].filter(Boolean).join(" | ")

    systemPrompt = `Tu es un expert en communication immobilière SMS. Tu rédiges des SMS ultra-concis pour présenter un bien à un prospect.`

    userPrompt = `Rédige un SMS de présentation de bien immobilier pour un prospect acheteur.

Informations du bien (uniquement les essentielles) :
${mainDetails}

Consignes STRICTES :
- Maximum 160 caractères au total (compte précisément)
- Inclure uniquement : type + surface + pièces + ville + prix + 1 seul point fort si disponible
- Commence par "Bonjour,"
- Termine par une question courte, correctement formulée en français, pour inviter à la visite. Exemples corrects : "Seriez-vous disponible pour une visite ?", "Cela correspond-il à votre recherche ?", "Souhaitez-vous en savoir plus ?", "Une visite vous tente ?"
- La question doit avoir un sujet explicite — ne jamais écrire "Vous intéresse ?" ou toute formulation sans sujet
- Pas d'emojis excessifs, 1 maximum
- Ne pas mentionner : DPE, charges, étage, exposition, année de construction, ascenseur
${customInstruction}

Format attendu : "Bonjour, [type] [surface]m² [pièces]p [ville] à [prix]€[. Point fort si dispo]. [Question polie complète] ?"`

  } else if (mode === "social") {
    const reglesParReseau: Record<string, string> = {
      Instagram: `- Première ligne : accroche visuelle en MAJUSCULES ou avec emoji fort
- 3-5 courtes phrases descriptives axées émotions et style de vie
- 3-5 points forts avec emojis (🌟 🛁 🌿 🏙️ 💫)
- Prix et contact en fin de post
- 15-20 hashtags pertinents en bloc séparé (#immobilier #appartement #maison #vente + hashtags ville)
- Longueur texte (sans hashtags) : 120 à 180 mots`,
      LinkedIn: `- Commence par une question engageante ou une observation de marché
- Présente le bien comme une opportunité d'investissement ou de vie
- Ton expert et professionnel, pas trop commercial
- Mentionne la disponibilité pour les acheteurs qualifiés
- CTA discret : "N'hésitez pas à me contacter"
- 5-8 hashtags professionnels en fin
- 100 à 150 mots`,
      Facebook: `- Ton convivial et accessible, comme une publication de voisinage
- Description complète avec tous les points clés
- Emojis modérés pour aérer (🏠 ✅ 📍)
- Prix visible et mis en avant
- CTA clair avec numéro ou "Contactez-moi en message privé"
- 150 à 200 mots`,
    }

    systemPrompt = `Tu es un expert en communication immobilière sur les réseaux sociaux. Tu rédiges des posts engageants, adaptés à chaque plateforme, pour présenter des biens immobiliers de manière attrayante.`

    userPrompt = `Rédige un post ${portail} pour présenter ce bien immobilier :

${details}

Règles spécifiques ${portail} :
${reglesParReseau[portail] ?? "Ton engageant, 150 mots environ."}

${tonInstruction} ${longueurInstruction}
${customInstruction}

Rédige directement le texte final prêt à publier, sans placeholders.`

  } else if (mode === "visite") {
    const vd = visiteData ?? {}
    const dateFormatted = vd.date ? new Date(vd.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "[non renseignée]"
    const redacteur = userName || "[Votre prénom]"
    const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

    systemPrompt = `Tu es un expert immobilier qui rédige des comptes-rendus de visite professionnels pour les agents immobiliers français. Tu transformes des mots-clés fournis par l'agent en texte rédigé, fluide et professionnel. Tu ne dois jamais inventer d'informations qui ne sont pas dans les données fournies.`

    userPrompt = `Rédige un compte-rendu de visite professionnel en t'appuyant sur les données ci-dessous.

BIEN VISITÉ :
${details}

DONNÉES DE LA VISITE SAISIES PAR L'AGENT :
- Date : ${dateFormatted}
- Visiteur(s) : ${vd.visiteurs || "[non renseigné]"}
- Déroulement (mots-clés agent) : ${vd.deroulement || "[non renseigné]"}
- Réactions / Points soulevés (mots-clés agent) : ${vd.reactions || "[non renseigné]"}
- Impression globale (fin de visite) : ${vd.impressionGlobale || "positive"}
- Notes impression globale (mots-clés agent) : ${vd.impressionGlobaleNotes || "[non renseigné]"}
- Suite à donner (mots-clés agent) : ${vd.suiteADonner || "[non renseigné]"}

Rédige le compte-rendu en respectant EXACTEMENT cette structure et ce formatage :

COMPTE-RENDU DE VISITE
══════════════════════════════════════════
Bien             : ${mandat.adresse}, ${mandat.ville}
Date             : ${dateFormatted}
Visiteur(s)      : ${vd.visiteurs || "[non renseigné]"}
Agent            : ${redacteur}
Impression globale : ${vd.impressionGlobale ? vd.impressionGlobale.charAt(0).toUpperCase() + vd.impressionGlobale.slice(1) : "Positive"}
══════════════════════════════════════════

DÉROULEMENT DE LA VISITE
[À partir des mots-clés "${vd.deroulement || ""}", rédige 2-3 phrases narratives fluides décrivant comment s'est déroulée la visite. Si aucun mot-clé, écris une description neutre et professionnelle basée sur l'impression globale "${vd.impressionGlobale || "positive"}". Ne commence pas par "La visite".]

RÉACTIONS ET POINTS SOULEVÉS
[À partir des mots-clés "${vd.reactions || ""}", rédige 3-4 points sous forme de tirets (—), chacun en 1-2 phrases. Chaque tiret doit décrire une réaction ou remarque concrète. Si aucun mot-clé, liste des remarques habituelles pour ce type de bien sans inventer.]

SYNTHÈSE
[À partir de "${vd.impressionGlobaleNotes || ""}" et de l'impression globale "${vd.impressionGlobale || "positive"}", rédige 1-2 phrases synthétisant le ressenti final du ou des visiteur(s). Sois factuel et professionnel.]

SUITE À DONNER
[À partir des mots-clés "${vd.suiteADonner || ""}", rédige 2-3 actions concrètes sous forme de tirets (—). Si aucun mot-clé, propose des actions cohérentes avec l'impression globale "${vd.impressionGlobale || "positive"}". Chaque action commence par un verbe à l'infinitif.]

Notes complémentaires : ________________________________________________

══════════════════════════════════════════
Rédigé par : ${redacteur} · Agent immobilier · ${today}

RÈGLES ABSOLUES :
- Transforme les mots-clés en texte rédigé, ne les recopie pas tels quels
- Ne mets jamais de crochets dans le résultat final
- N'invente aucune information absente des données fournies
- Utilise un français impeccable, sans fautes`

  } else if (mode === "vendeur") {
    systemPrompt = `Tu es un expert en relation client pour agents immobiliers. Tu rédiges des emails de suivi professionnels et rassurants destinés aux propriétaires vendeurs.`

    userPrompt = `Rédige un email de compte-rendu destiné au propriétaire vendeur de ce bien :

${details}

Consignes :
- Objet en première ligne (format "Objet : Suivi de votre bien — [adresse courte]")
- Commence par "Bonjour," sans prénom
- Rappelle brièvement le bien concerné en 1 phrase
- Section "Ce que nous avons fait" : 2-3 actions menées (diffusion portails, contacts prospects, visites)
- Section "Retours du marché" : 1-2 phrases sur les retours des visiteurs/prospects
- Section "Prochaines étapes" : 2-3 actions planifiées
- Formule rassurante et professionnelle tout au long
- Termine par "Bien cordialement," [Votre prénom] / Agent immobilier
- Longueur par défaut : 180 à 240 mots

${tonInstruction} ${longueurInstruction}
${customInstruction}`

  } else {
    return Response.json({ error: "Mode invalide" }, { status: 400 })
  }

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.72,
    max_tokens: 1200,
  })

  const texte = completion.choices[0].message.content ?? ""

  if (email) {
    const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email } })
    await prisma.generation.create({
      data: {
        userId: user.id,
        texte,
        portail: ["annonce", "social"].includes(mode) ? portail : mode,
        type: mode,
      },
    })
  }

  return Response.json({ texte })
}
