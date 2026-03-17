"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import LoadingScreen from "@/components/LoadingScreen"

const StarIcon = () => (
  <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

const FeatureIcons: Record<string, JSX.Element> = {
  "01": (
    <svg className="w-5 h-5 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  "02": (
    <svg className="w-5 h-5 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  "03": (
    <svg className="w-5 h-5 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  "04": (
    <svg className="w-5 h-5 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  "05": (
    <svg className="w-5 h-5 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
    </svg>
  ),
  "06": (
    <svg className="w-5 h-5 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
}

const FAQ_ITEMS = [
  {
    q: "Est-ce que Cléo est gratuit ?",
    a: "Oui, Cléo propose un plan Free pour toujours. Il inclut 3 mandats, 5 prospects et 5 générations IA par mois. Aucune carte bancaire requise pour commencer.",
  },
  {
    q: "Quelle IA est utilisée ?",
    a: "Cléo utilise Groq avec le modèle Llama. C'est une IA ultra-rapide : chaque génération prend moins de 10 secondes, même pour des documents longs.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Vos données sont hébergées sur Supabase (serveurs en Europe), chiffrées au repos et en transit. Elles ne sont jamais revendues ni partagées avec des tiers.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui, sans engagement. Vous pouvez annuler votre abonnement Pro directement depuis le portail Stripe, accessible depuis votre compte. Aucune démarche compliquée.",
  },
  {
    q: "Y a-t-il un engagement minimum ?",
    a: "Non. L'abonnement Pro est mois par mois. Vous payez pour le mois en cours et vous pouvez arrêter quand vous le souhaitez.",
  },
  {
    q: "Cléo fonctionne-t-il sur mobile ?",
    a: "Oui. L'interface est 100% responsive et conçue pour fonctionner aussi bien sur smartphone que sur ordinateur.",
  },
]

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const userEmail = session.user.email ?? null
        setEmail(userEmail)
        if (userEmail) {
          fetch(`/api/plan?email=${encodeURIComponent(userEmail)}`)
            .then(r => r.json())
            .then(d => setPlan(d.plan ?? "free"))
        }
      }
      setReady(true)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setEmail(null)
    setConfirm(false)
  }

  if (!ready) return <LoadingScreen />

  const ctaHref = email ? "/app" : "/login"

  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-4 md:px-10 py-5 border-b border-gray-200 bg-white sticky top-0 z-50">
        <a href={email ? "/app" : "/"} className="text-lg font-extrabold tracking-tight text-gray-900">Cléo</a>
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-500">
          {email && (
            <a href="/app" className="bg-gray-950 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
              Outil IA
            </a>
          )}
          <a href="#generation" className="hover:text-gray-900 transition-colors">Génération IA</a>
          <a href="#features" className="hover:text-gray-900 transition-colors">Fonctionnalités</a>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">Tarifs</a>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {email ? (
            <button onClick={() => setConfirm(true)} className="text-sm font-bold text-gray-600 px-3 md:px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 hover:text-gray-900 transition-colors">
              Déconnexion
            </button>
          ) : (
            <a href="/login" className="text-sm font-bold text-gray-600 px-3 md:px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 transition-colors">
              Se connecter
            </a>
          )}
          <a href={ctaHref} className="bg-fuchsia-600 text-white font-bold text-sm px-4 md:px-5 py-2.5 rounded-full hover:bg-fuchsia-700 transition-colors">
            {email ? "Mon compte" : "Essai gratuit →"}
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-fuchsia-700 text-white px-4 md:px-10 pt-20 pb-28">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-fuchsia-600/50" />
        <div className="absolute bottom-[-80px] left-[15%] w-72 h-72 rounded-full bg-fuchsia-800/50" />
        <div className="absolute top-20 left-[40%] w-32 h-32 rounded-full bg-fuchsia-500/30" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative max-w-5xl mx-auto">
          <p className="text-xs font-bold text-fuchsia-200 uppercase tracking-widest mb-6">CRM IA pour agents immobiliers</p>
          <h1 className="text-[clamp(2.5rem,7vw,6.5rem)] font-extrabold leading-none tracking-tight mb-8">
            Rédigez.<br />Prospectez.<br />
            <span className="text-fuchsia-200">Vendez plus vite.</span>
          </h1>
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <p className="text-xl font-medium text-fuchsia-100 max-w-md leading-relaxed">
              Cléo génère vos annonces, emails, SMS et comptes-rendus en quelques secondes. Gérez mandats et prospects depuis un seul outil.
            </p>
            <div className="flex flex-col gap-3 md:items-end shrink-0">
              <a href={ctaHref} className="bg-white text-fuchsia-700 font-bold text-sm px-8 py-4 rounded-full hover:bg-fuchsia-50 transition-colors text-center">
                {email ? "Accéder à l'outil →" : "Commencer gratuitement →"}
              </a>
              <a href="#generation" className="border border-white/30 text-white font-semibold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition-colors text-center">
                Voir la génération IA
              </a>
              {!email && <p className="text-fuchsia-200 text-xs font-medium text-center md:text-right">Sans carte bancaire · Gratuit pour toujours</p>}
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 gap-6 md:flex md:gap-12 mt-20 pt-8 border-t border-white/20">
            {[
              { value: "6", label: "types de documents générés" },
              { value: "5 portails", label: "SeLoger, LBC, Logic-Immo, PAP, Bien'ici" },
              { value: "3 réseaux", label: "Instagram, LinkedIn, Facebook" },
              { value: "< 10 sec", label: "par génération" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-4xl font-extrabold">{s.value}</p>
                <p className="text-fuchsia-200 font-medium text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="bg-white px-4 md:px-10 py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-fuchsia-600 font-bold uppercase tracking-widest mb-4">Comment ça marche</p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-16 max-w-lg">
            Prêt en 3 étapes simples
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Ajoutez vos mandats",
                desc: "Saisissez les informations du bien : adresse, surface, pièces, prix, DPE, chauffage, exposition. Vos mandats sont centralisés et réutilisables.",
              },
              {
                step: "2",
                title: "Choisissez votre document",
                desc: "Annonce portail, email prospect, SMS de relance, post réseaux sociaux, compte-rendu de visite ou email vendeur. Un format pour chaque besoin.",
              },
              {
                step: "3",
                title: "L'IA rédige en 10 secondes",
                desc: "Cléo génère un texte professionnel prêt à copier-coller. Ajustez le ton, la longueur, et guidez l'IA avec vos propres mots-clés.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-fuchsia-100 flex items-center justify-center shrink-0">
                  <span className="text-xl font-extrabold text-fuchsia-600">{item.step}</span>
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900 mb-2">{item.title}</p>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GÉNÉRATION IA — section principale */}
      <section id="generation" className="bg-gray-950 px-4 md:px-10 py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-fuchsia-400 font-bold uppercase tracking-widest mb-4">Génération IA</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight max-w-lg">
              6 types de documents,<br />générés en 1 clic
            </h2>
            <p className="text-gray-400 font-medium text-sm max-w-xs md:text-right">
              L'IA utilise les données de votre mandat et vos mots-clés pour rédiger des textes prêts à l'emploi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              {
                label: "Annonce portail",
                desc: "SeLoger · Leboncoin · Logic-Immo · PAP · Bien'ici",
                detail: "Chaque portail a ses propres règles de rédaction. Cléo les connaît.",
              },
              {
                label: "Email prospect",
                desc: "Relance acheteur personnalisée",
                detail: "Email de relance avec points forts du bien, proposition de visite et appel à l'action.",
              },
              {
                label: "SMS de relance",
                desc: "160 caractères, infos essentielles",
                detail: "Type, surface, prix, ville et un point fort. Termine par une question polie.",
              },
              {
                label: "Post réseaux sociaux",
                desc: "Instagram · LinkedIn · Facebook",
                detail: "Format adapté à chaque réseau : hashtags Instagram, ton expert LinkedIn, convivial Facebook.",
              },
              {
                label: "Compte-rendu de visite",
                desc: "Fiche visite complète",
                detail: "Entrez vos mots-clés, l'IA rédige un compte-rendu professionnel structuré.",
              },
              {
                label: "Email vendeur",
                desc: "Suivi propriétaire",
                detail: "Tenez votre vendeur informé avec un email de suivi : actions menées, retours marché, prochaines étapes.",
              },
            ].map(t => (
              <div key={t.label} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-fuchsia-700/60 hover:bg-white/[0.08] transition-all group">
                <div className="w-8 h-1 rounded-full bg-fuchsia-500 mb-4 group-hover:w-12 transition-all" />
                <p className="text-base font-bold text-white mb-1">{t.label}</p>
                <p className="text-xs font-semibold text-fuchsia-400 mb-3">{t.desc}</p>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">{t.detail}</p>
              </div>
            ))}
          </div>

          {/* Options de style */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Options de personnalisation disponibles</p>
            <div className="flex flex-wrap gap-6">
              {[
                { label: "Ton", options: "Professionnel · Chaleureux · Luxe · Percutant" },
                { label: "Longueur", options: "Court · Standard · Long" },
                { label: "Instructions libres", options: "Guidez l'IA avec vos mots-clés" },
              ].map(o => (
                <div key={o.label} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-full">{o.label}</span>
                  <span className="text-xs text-gray-400 font-medium">{o.options}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-gray-100 px-4 md:px-10 py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-fuchsia-600 font-bold uppercase tracking-widest mb-4">Fonctionnalités</p>
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-16 text-gray-900 max-w-lg">
            Tout ce dont un agent a besoin
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                num: "01",
                title: "Fiches mandats enrichies",
                desc: "Adresse, surface, pièces, prix, DPE, exposition, chauffage, statut… Tous vos mandats centralisés, accessibles en un coup d'œil.",
              },
              {
                num: "02",
                title: "Génération IA multiformat",
                desc: "6 types de documents générés à partir de vos données : annonces, emails, SMS, posts réseaux, comptes-rendus, emails vendeur.",
              },
              {
                num: "03",
                title: "CRM prospects intégré",
                desc: "Suivez chaque contact, ses critères, son budget, ses biens visités, son statut et programmez des rappels.",
              },
              {
                num: "04",
                title: "Historique des générations",
                desc: "Retrouvez, filtrez et réutilisez toutes vos générations passées. Copiez en un clic, supprimez ce dont vous n'avez plus besoin.",
              },
              {
                num: "05",
                title: "5 portails, 3 réseaux",
                desc: "SeLoger, Leboncoin, Logic-Immo, PAP, Bien'ici — chacun avec ses règles de rédaction. Instagram, LinkedIn et Facebook pour les réseaux.",
              },
              {
                num: "06",
                title: "Restriction par plan",
                desc: "Le plan Free vous donne accès à 3 mandats, 5 prospects et 5 générations par mois. Le plan Pro lève toutes les limites.",
              },
            ].map(f => (
              <div key={f.num} className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-fuchsia-300 hover:shadow-sm transition-all group">
                <div className="mb-4 group-hover:scale-110 transition-transform inline-block">
                  {FeatureIcons[f.num]}
                </div>
                <p className="text-base font-bold text-gray-900 mb-2">{f.title}</p>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative overflow-hidden bg-gray-950 text-white px-4 md:px-10 py-24">
        <div className="absolute top-[-60px] right-[-60px] w-80 h-80 rounded-full bg-fuchsia-900/40" />
        <div className="absolute bottom-[-40px] left-[10%] w-48 h-48 rounded-full bg-fuchsia-900/30" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(232,121,249,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-5xl mx-auto">
          <p className="text-xs text-fuchsia-400 font-bold uppercase tracking-widest mb-4">Témoignages</p>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-16">Ce qu'ils en disent</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                quote: "Je génère mes annonces SeLoger en 15 secondes au lieu de 20 minutes. Et elles sont meilleures que ce que j'écrivais moi-même.",
                name: "Marc D.",
                role: "Agent immobilier, Paris 15e",
              },
              {
                quote: "Le compte-rendu de visite IA m'a bluffée. Je rentre mes mots-clés dans la voiture et le document est prêt avant même d'arriver au bureau.",
                name: "Sophie L.",
                role: "Négociatrice, Lyon",
              },
              {
                quote: "Les posts Instagram générés cartonnent. Je n'aurais jamais pensé utiliser les réseaux sociaux pour vendre mes mandats avant Cléo.",
                name: "Thomas R.",
                role: "Agent indépendant, Bordeaux",
              },
            ].map(t => (
              <div key={t.name} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-fuchsia-800/60 transition-colors">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} />)}
                </div>
                <p className="text-sm text-gray-300 font-medium leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-gray-100 px-4 md:px-10 py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-fuchsia-600 font-bold uppercase tracking-widest mb-4">Tarifs</p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-16">Simple et transparent</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="p-8 rounded-2xl bg-white border border-gray-200 flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Free</p>
                <p className="text-5xl font-extrabold text-gray-900">0€</p>
                <p className="text-sm text-gray-400 font-medium mt-1">Pour toujours</p>
              </div>
              <ul className="flex flex-col gap-3 text-sm text-gray-600 font-medium flex-1">
                {[
                  "3 mandats",
                  "5 prospects",
                  "5 générations IA / mois",
                  "Tous les types de documents",
                  "Historique des générations",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {plan !== "pro" && (
                <a href={ctaHref} className="text-center py-3 border-2 border-gray-200 rounded-full text-sm font-bold text-gray-700 hover:border-fuchsia-400 hover:text-fuchsia-600 transition-colors">
                  {email ? "Mon compte" : "Commencer gratuitement"}
                </a>
              )}
            </div>

            <div className="relative overflow-hidden p-8 rounded-2xl bg-fuchsia-700 text-white flex flex-col gap-6">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-fuchsia-600/50" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-fuchsia-800/50" />
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative z-10">
                <span className="inline-block bg-white text-fuchsia-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  Le plus populaire
                </span>
                <p className="text-xs font-bold text-fuchsia-200 uppercase tracking-widest mb-3">Pro</p>
                <p className="text-5xl font-extrabold">49€</p>
                <p className="text-sm text-fuchsia-200 font-medium mt-1">par mois · sans engagement</p>
              </div>
              <ul className="relative z-10 flex flex-col gap-3 text-sm text-fuchsia-100 font-medium flex-1">
                {[
                  "Mandats illimités",
                  "Prospects illimités",
                  "Générations IA illimitées",
                  "Tous les types de documents",
                  "Accès aux factures Stripe",
                  "Support prioritaire",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {plan === "pro" ? (
                <a href="/app/profil" className="relative z-10 text-center py-3 bg-white text-fuchsia-700 rounded-full text-sm font-bold hover:bg-fuchsia-50 transition-colors">
                  Mon compte
                </a>
              ) : (
                <a href="/pricing" className="relative z-10 text-center py-3 bg-white text-fuchsia-700 rounded-full text-sm font-bold hover:bg-fuchsia-50 transition-colors">
                  {email ? "Passer au Pro →" : "Essayer le Pro →"}
                </a>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-100 px-4 md:px-10 py-24 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-fuchsia-600 font-bold uppercase tracking-widest mb-4">FAQ</p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-16">Questions fréquentes</h2>
          <div className="flex flex-col gap-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                >
                  <span className="text-sm font-bold text-gray-900">{item.q}</span>
                  <span className="shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center transition-transform" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-fuchsia-700 px-4 md:px-10 py-24 text-center text-white">
        <div className="absolute -top-20 left-[10%] w-64 h-64 rounded-full bg-fuchsia-600/40" />
        <div className="absolute -bottom-20 right-[10%] w-80 h-80 rounded-full bg-fuchsia-800/40" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6">Prêt à aller plus vite ?</h2>
          <p className="text-fuchsia-200 font-medium text-lg mb-10 max-w-xl mx-auto">
            Vos annonces, emails, SMS et comptes-rendus rédigés en quelques secondes. Commencez gratuitement, sans carte bancaire.
          </p>
          <a href={ctaHref} className="inline-block bg-white text-fuchsia-700 font-bold text-base px-10 py-4 rounded-full hover:bg-fuchsia-50 transition-colors">
            {email ? "Accéder à mes outils →" : "Commencer gratuitement →"}
          </a>
          {!email && <p className="text-fuchsia-300 font-medium text-xs mt-4">Sans carte bancaire · Annulation à tout moment</p>}
        </div>
      </section>

      {/* ACCÈS RAPIDE — visible quand connecté */}
      {email && (
        <section className="bg-gray-950 px-4 md:px-10 py-16">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <div className="w-2 h-2 rounded-full bg-fuchsia-500 mb-4 animate-pulse" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Outil IA</p>
              <h2 className="text-4xl font-extrabold text-white mb-3">Générer un document</h2>
              <p className="text-gray-400 font-medium text-base">Annonce, email, SMS, réseaux sociaux, compte-rendu ou email vendeur.</p>
            </div>
            <a href="/app/generation" className="shrink-0 bg-fuchsia-600 text-white font-bold text-base px-10 py-5 rounded-2xl hover:bg-fuchsia-500 transition-colors flex items-center gap-3 justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Générer maintenant
            </a>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-500 px-4 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5">
        <span className="text-white font-extrabold">Cléo</span>
        <div className="flex gap-8 text-sm font-semibold">
          <a href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</a>
          <a href="/conditions" className="hover:text-white transition-colors">Conditions</a>
          <a href="/support" className="hover:text-white transition-colors">Support</a>
        </div>
        <span className="text-xs font-medium">© 2026 Cléo</span>
      </footer>

      {/* MODAL CONFIRMATION DÉCONNEXION */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Se déconnecter ?</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Tu seras redirigé vers la page de connexion.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-gray-400 transition-colors">
                Annuler
              </button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-gray-700 transition-colors">
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
