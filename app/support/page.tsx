"use client"
import { useState } from "react"

export default function SupportPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setSent(true)
    } catch {
      setError("Une erreur est survenue. Réessaie ou écris-nous directement.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-200 bg-white sticky top-0 z-50">
        <a href="/" className="font-extrabold text-lg tracking-tight text-gray-900">Cléo</a>
        <a href="/dashboard" className="bg-fuchsia-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-fuchsia-700 transition-colors">
          Mon compte
        </a>
      </nav>

      {/* HEADER */}
      <div className="relative overflow-hidden bg-fuchsia-700 text-white px-10 pt-20 pb-20">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-fuchsia-600/50" />
        <div className="absolute bottom-[-50px] left-[20%] w-48 h-48 rounded-full bg-fuchsia-800/40" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-4xl mx-auto">
          <p className="text-xs font-bold text-fuchsia-200 uppercase tracking-widest mb-4">Support</p>
          <h1 className="text-7xl font-extrabold leading-none mb-4">On est là<br />pour toi</h1>
          <p className="text-fuchsia-200 font-medium text-lg max-w-md">Une question, un bug, ou juste envie de discuter ? Écris-nous, on répond sous 24h.</p>
        </div>
      </div>

      <div className="bg-gray-100 px-10 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8">

          {/* INFOS CONTACT */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold text-fuchsia-600 uppercase tracking-widest mb-4">Contact</p>
              {[
                { label: "Email", value: "support@flowly.app" },
                { label: "Réponse", value: "Sous 24h ouvrées" },
                { label: "Disponibilité", value: "Lun – Ven, 9h – 18h" },
              ].map(item => (
                <div key={item.label} className="mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">FAQ rapide</p>
              <div className="flex flex-col gap-3">
                {[
                  { q: "Mon paiement n'a pas fonctionné", href: "/pricing" },
                  { q: "Comment annuler mon abonnement", href: "/dashboard" },
                  { q: "Voir les plans disponibles", href: "/pricing" },
                ].map(link => (
                  <a key={link.q} href={link.href} className="text-sm font-medium text-fuchsia-600 hover:text-fuchsia-800 transition-colors">
                    → {link.q}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* FORMULAIRE */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-200 p-8">
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-14 h-14 rounded-full bg-fuchsia-100 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-fuchsia-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">Message envoyé !</h2>
                <p className="text-sm text-gray-500 font-medium mb-6">On te répondra sous 24h à l'adresse indiquée.</p>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }) }}
                  className="text-sm font-bold text-fuchsia-600 hover:text-fuchsia-800 transition-colors"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">Envoyer un message</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nom</label>
                    <input
                      name="name"
                      required
                      placeholder="Ton nom"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="ton@email.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Sujet</label>
                  <select
                    name="subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors"
                  >
                    <option value="">Choisir un sujet...</option>
                    <option>Problème de paiement</option>
                    <option>Bug ou erreur technique</option>
                    <option>Question sur mon abonnement</option>
                    <option>Demande de fonctionnalité</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Message</label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    placeholder="Décris ton problème ou ta question..."
                    value={form.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-fuchsia-400 focus:bg-white transition-colors resize-none"
                  />
                </div>
                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-fuchsia-600 text-white font-bold rounded-xl text-sm hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Envoi en cours..." : "Envoyer →"}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-500 px-10 py-8 flex items-center justify-between">
        <span className="text-white font-extrabold">Cléo</span>
        <div className="flex gap-8 text-sm font-semibold">
          <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
          <a href="#" className="hover:text-white transition-colors">Conditions</a>
          <a href="/support" className="hover:text-white transition-colors">Contact</a>
        </div>
        <span className="text-xs font-medium">© 2026 Cléo</span>
      </footer>

    </div>
  )
}
