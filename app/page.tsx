"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setEmail(session.user.email ?? null)
      setReady(true)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setEmail(null)
  }

  if (!ready) return null

  const ctaHref = email ? "/dashboard" : "/login"
  const ctaLabel = email ? "Mon compte" : "Commencer →"

  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-200 bg-white sticky top-0 z-50">
        <a href={email ? "/dashboard" : "/"} className="text-lg font-extrabold tracking-tight text-gray-900">Flowly</a>
        <div className="flex gap-8 text-sm font-semibold text-gray-500">
          <a href="#features" className="hover:text-gray-900 transition-colors">Fonctionnalités</a>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">Tarifs</a>
          <a href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</a>
        </div>
        <div className="flex items-center gap-3">
          {email && (
            <>
              <a href="/app" className="bg-gray-950 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
                Outil IA
              </a>
              <button onClick={handleLogout} className="text-gray-500 hover:text-gray-900 font-semibold text-sm transition-colors">
                Déconnexion
              </button>
            </>
          )}
          <a href={ctaHref} className="bg-fuchsia-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-fuchsia-700 transition-colors">
            {ctaLabel}
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-fuchsia-700 text-white px-10 pt-20 pb-28">
        {/* Décorations */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-fuchsia-600/50" />
        <div className="absolute bottom-[-80px] left-[15%] w-72 h-72 rounded-full bg-fuchsia-800/50" />
        <div className="absolute top-20 left-[40%] w-32 h-32 rounded-full bg-fuchsia-500/30" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative max-w-5xl mx-auto">
          <p className="text-xs font-bold text-fuchsia-200 uppercase tracking-widest mb-6">Automatisation de workflows</p>
          <h1 className="text-[clamp(3rem,8vw,7rem)] font-extrabold leading-none tracking-tight mb-8">
            Automatise tes<br />workflows,<br />
            <span className="text-fuchsia-200">vends plus vite</span>
          </h1>
          <div className="flex items-start justify-between gap-12">
            <p className="text-xl font-medium text-fuchsia-100 max-w-md leading-relaxed">
              Connecte tous tes outils SaaS et automatise les tâches répétitives. Zéro code, déployé en 5 minutes.
            </p>
            <div className="flex flex-col gap-3 items-end shrink-0">
              {!email && (
                <a href="/login" className="bg-white text-fuchsia-700 font-bold text-sm px-8 py-4 rounded-full hover:bg-fuchsia-50 transition-colors">
                  Démarrer gratuitement →
                </a>
              )}
              <a href="#features" className="border border-white/30 text-white font-semibold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition-colors">
                En savoir plus
              </a>
              {!email && <p className="text-fuchsia-200 text-xs font-medium">Aucune carte bancaire · Gratuit 14 jours</p>}
            </div>
          </div>

          {/* STATS */}
          <div className="flex gap-12 mt-20 pt-8 border-t border-white/20">
            {[
              { value: "3 000+", label: "équipes actives" },
              { value: "200+", label: "intégrations" },
              { value: "99.9%", label: "uptime garanti" },
              { value: "10M+", label: "workflows exécutés" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-4xl font-extrabold">{s.value}</p>
                <p className="text-fuchsia-200 font-medium text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-gray-100 px-10 py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-fuchsia-600 font-bold uppercase tracking-widest mb-4">Fonctionnalités</p>
          <h2 className="text-5xl font-extrabold leading-tight mb-16 text-gray-900 max-w-lg">
            Tout ce dont tu as besoin
          </h2>
          <div className="grid grid-cols-3 gap-5">
            {[
              { num: "01", title: "Automatisation visuelle", desc: "Éditeur drag-and-drop pour créer des workflows complexes sans une ligne de code." },
              { num: "02", title: "200+ intégrations", desc: "Connecte Slack, Notion, GitHub, Stripe et tous tes outils en quelques secondes." },
              { num: "03", title: "Analytics temps réel", desc: "Visualise l'exécution de chaque workflow avec des métriques détaillées." },
              { num: "04", title: "Gestion des erreurs", desc: "Retry automatique, alertes Slack, et logs détaillés pour chaque échec." },
              { num: "05", title: "API & Webhooks", desc: "Déclenche n'importe quel workflow via une simple requête HTTP." },
              { num: "06", title: "Équipes & permissions", desc: "Invite ton équipe avec des rôles granulaires par workspace." },
            ].map(f => (
              <div key={f.num} className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-fuchsia-300 hover:shadow-sm transition-all group">
                <p className="text-xs font-bold text-fuchsia-500 mb-4 group-hover:text-fuchsia-600">{f.num}</p>
                <p className="text-base font-bold text-gray-900 mb-2">{f.title}</p>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative overflow-hidden bg-gray-950 text-white px-10 py-24">
        {/* Décorations */}
        <div className="absolute top-[-60px] right-[-60px] w-80 h-80 rounded-full bg-fuchsia-900/40" />
        <div className="absolute bottom-[-40px] left-[10%] w-48 h-48 rounded-full bg-fuchsia-900/30" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(232,121,249,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-5xl mx-auto">
          <p className="text-xs text-fuchsia-400 font-bold uppercase tracking-widest mb-4">Témoignages</p>
          <h2 className="text-5xl font-extrabold mb-16">Ce qu'ils en disent</h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              { quote: "Flowly nous a économisé 10h de travail par semaine. Le setup a pris moins d'une heure.", name: "Sophie L.", role: "CTO, Bricko" },
              { quote: "On a remplacé Zapier avec Flowly. Plus simple, moins cher, et beaucoup plus fiable.", name: "Thomas M.", role: "Founder, Paird" },
              { quote: "Le support est incroyable. Ils ont répondu en 2h et m'ont aidé à tout configurer.", name: "Alice C.", role: "Head of Ops, Kerno" },
            ].map(t => (
              <div key={t.name} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-fuchsia-800/60 transition-colors">
                <div className="w-8 h-1 rounded-full bg-fuchsia-500 mb-4" />
                <p className="text-sm text-gray-300 font-medium leading-relaxed mb-6">"{t.quote}"</p>
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
      <section id="pricing" className="bg-gray-100 px-10 py-24">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-fuchsia-600 font-bold uppercase tracking-widest mb-4">Tarifs</p>
          <h2 className="text-5xl font-extrabold text-gray-900 mb-16">Simple et transparent</h2>
          <div className="grid grid-cols-3 gap-6">

            <div className="p-8 rounded-2xl bg-white border border-gray-200 flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Free</p>
                <p className="text-5xl font-extrabold text-gray-900">0€</p>
                <p className="text-sm text-gray-400 font-medium mt-1">Pour toujours</p>
              </div>
              <ul className="flex flex-col gap-3 text-sm text-gray-600 font-medium flex-1">
                {["100 exécutions / mois", "3 workflows actifs", "Intégrations de base"].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0"></span>{f}
                  </li>
                ))}
              </ul>
              <a href={ctaHref} className="text-center py-3 border-2 border-gray-200 rounded-full text-sm font-bold text-gray-700 hover:border-fuchsia-400 hover:text-fuchsia-600 transition-colors">
                {email ? "Mon compte" : "Commencer"}
              </a>
            </div>

            <div className="relative overflow-hidden p-8 rounded-2xl bg-fuchsia-700 text-white flex flex-col gap-6">
              {/* Déco carte Pro */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-fuchsia-600/50" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-fuchsia-800/50" />
              <div className="relative z-10">
                <span className="inline-block bg-white text-fuchsia-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  Le plus populaire
                </span>
                <p className="text-xs font-bold text-fuchsia-200 uppercase tracking-widest mb-3">Pro</p>
                <p className="text-5xl font-extrabold">29€</p>
                <p className="text-sm text-fuchsia-200 font-medium mt-1">par mois</p>
              </div>
              <ul className="relative z-10 flex flex-col gap-3 text-sm text-fuchsia-100 font-medium flex-1">
                {["10 000 exécutions / mois", "Workflows illimités", "200+ intégrations", "Support prioritaire"].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></span>{f}
                  </li>
                ))}
              </ul>
              <a href="/pricing" className="relative z-10 text-center py-3 bg-white text-fuchsia-700 rounded-full text-sm font-bold hover:bg-fuchsia-50 transition-colors">
                {email ? "Passer au Pro →" : "Essai gratuit 14 jours →"}
              </a>
            </div>

            <div className="p-8 rounded-2xl bg-gray-900 text-white flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Enterprise</p>
                <p className="text-5xl font-extrabold">Sur devis</p>
                <p className="text-sm text-gray-500 font-medium mt-1">Volume custom</p>
              </div>
              <ul className="flex flex-col gap-3 text-sm text-gray-300 font-medium flex-1">
                {["Exécutions illimitées", "SLA 99.99%", "SSO / SAML", "Account manager dédié"].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0"></span>{f}
                  </li>
                ))}
              </ul>
              <button className="py-3 border-2 border-white/20 text-white rounded-full text-sm font-bold hover:border-white/50 transition-colors">
                Contacter les ventes
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-fuchsia-700 px-10 py-24 text-center text-white">
        <div className="absolute -top-20 left-[10%] w-64 h-64 rounded-full bg-fuchsia-600/40" />
        <div className="absolute -bottom-20 right-[10%] w-80 h-80 rounded-full bg-fuchsia-800/40" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative">
          <h2 className="text-6xl font-extrabold mb-6">Prêt à automatiser ?</h2>
          <p className="text-fuchsia-200 font-medium text-lg mb-10">Rejoins 3 000+ équipes qui utilisent Flowly chaque jour.</p>
          <a href={ctaHref} className="inline-block bg-white text-fuchsia-700 font-bold text-base px-10 py-4 rounded-full hover:bg-fuchsia-50 transition-colors">
            {email ? "Aller sur mon compte →" : "Commencer gratuitement →"}
          </a>
          {!email && <p className="text-fuchsia-300 font-medium text-xs mt-4">Aucune carte bancaire · Annulation à tout moment</p>}
        </div>
      </section>

      {/* OUTIL IA — visible quand connecté */}
      {email && (
        <section className="bg-gray-950 px-10 py-16">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-8">
            <div>
              <div className="w-2 h-2 rounded-full bg-fuchsia-500 mb-4 animate-pulse" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Outil IA</p>
              <h2 className="text-4xl font-extrabold text-white mb-3">Prêt à utiliser l'outil ?</h2>
              <p className="text-gray-400 font-medium text-base">Lance l'outil IA et automatise tes premiers workflows dès maintenant.</p>
            </div>
            <a href="/app" className="shrink-0 bg-fuchsia-600 text-white font-bold text-base px-10 py-5 rounded-2xl hover:bg-fuchsia-500 transition-colors flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Accéder à l'outil
            </a>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-500 px-10 py-8 flex items-center justify-between">
        <span className="text-white font-extrabold">Flowly</span>
        <div className="flex gap-8 text-sm font-semibold">
          <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
          <a href="#" className="hover:text-white transition-colors">Conditions</a>
          <a href="/support" className="hover:text-white transition-colors">Contact</a>
        </div>
        <span className="text-xs font-medium">© 2026 Flowly</span>
      </footer>

    </main>
  )
}
