"use client"
import { useState } from "react"

const steps = [
  {
    icon: (
      <svg className="w-8 h-8 text-fuchsia-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: "Bienvenue sur Cléo !",
    description: "Votre assistant IA pour agents immobiliers. En quelques étapes, vous serez prêt à gérer vos mandats et prospects efficacement.",
    cta: "Commencer",
  },
  {
    icon: (
      <svg className="w-8 h-8 text-fuchsia-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    title: "Ajoutez vos mandats",
    description: "Enregistrez vos biens immobiliers : adresse, surface, prix, type… Cléo s'en charge pour trouver les acheteurs qui correspondent.",
    cta: "Suivant",
    link: { href: "/app/mandats", label: "Ajouter un mandat maintenant →" },
  },
  {
    icon: (
      <svg className="w-8 h-8 text-fuchsia-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: "Ajoutez vos prospects",
    description: "Renseignez les acheteurs potentiels avec leur budget et critères. L'IA fera le matching automatiquement avec vos mandats.",
    cta: "C'est parti !",
    link: { href: "/app/prospects", label: "Ajouter un prospect maintenant →" },
  },
]

export default function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const current = steps[step]
  const isLast = step === steps.length - 1

  function handleNext() {
    if (isLast) {
      onClose()
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-fuchsia-600 transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-fuchsia-600" : i < step ? "w-3 bg-fuchsia-200" : "w-3 bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-gray-500 transition-colors text-xs font-medium"
            >
              Passer
            </button>
          </div>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 flex items-center justify-center mb-6">
            {current.icon}
          </div>

          {/* Content */}
          <h2 className="text-xl font-extrabold text-gray-900 mb-3">{current.title}</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">{current.description}</p>

          {/* Optional link */}
          {"link" in current && current.link && (
            <a
              href={current.link.href}
              className="block text-sm font-bold text-fuchsia-600 hover:text-fuchsia-700 mb-6 transition-colors"
            >
              {current.link.label}
            </a>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-fuchsia-600 text-white text-sm font-bold rounded-xl hover:bg-fuchsia-700 transition-colors"
            >
              {current.cta}
            </button>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="py-3 px-4 border border-gray-200 text-sm font-bold text-gray-500 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
