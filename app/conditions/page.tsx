export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 px-10 py-5 flex items-center justify-between">
        <a href="/" className="text-lg font-extrabold tracking-tight text-gray-900">Cléo</a>
        <a href="/" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">← Retour</a>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs font-bold text-fuchsia-600 uppercase tracking-widest mb-4">Légal</p>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Conditions générales d'utilisation</h1>
        <p className="text-sm text-gray-400 font-medium mb-12">Dernière mise à jour : mars 2026</p>

        <div className="flex flex-col gap-10 text-gray-700">

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">1. Objet</h2>
            <p className="text-sm font-medium leading-relaxed">
              Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Cléo, outil SaaS destiné aux agents immobiliers professionnels. En créant un compte, vous acceptez l'intégralité de ces conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">2. Accès au service</h2>
            <p className="text-sm font-medium leading-relaxed">
              L'accès à Cléo est réservé aux professionnels de l'immobilier. Vous devez être majeur et disposer de la capacité juridique pour accepter ces CGU. Un compte est personnel et non transférable. Vous êtes responsable de la confidentialité de vos identifiants.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">3. Plans et facturation</h2>
            <p className="text-sm font-medium leading-relaxed mb-3">Cléo propose deux formules :</p>
            <ul className="flex flex-col gap-2 text-sm font-medium mb-3">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0 mt-1.5" />
                <span><strong>Plan Free</strong> — accès limité, sans engagement, gratuit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0 mt-1.5" />
                <span><strong>Plan Pro</strong> — 29 € HT/mois, accès complet, résiliable à tout moment</span>
              </li>
            </ul>
            <p className="text-sm font-medium leading-relaxed">
              La facturation est mensuelle et automatique via Stripe. En cas de non-paiement, l'accès Pro est suspendu et le compte repasse en Free. Aucun remboursement n'est effectué pour les périodes entamées.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">4. Résiliation</h2>
            <p className="text-sm font-medium leading-relaxed">
              Vous pouvez résilier votre abonnement à tout moment depuis votre tableau de bord. La résiliation prend effet à la fin de la période de facturation en cours. Vos données sont conservées 30 jours après résiliation puis supprimées définitivement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">5. Utilisation acceptable</h2>
            <p className="text-sm font-medium leading-relaxed mb-3">Il est interdit d'utiliser Cléo pour :</p>
            <ul className="flex flex-col gap-2 text-sm font-medium">
              {[
                "Publier des contenus illicites, trompeurs ou discriminatoires",
                "Tenter de contourner les mesures de sécurité",
                "Revendre ou redistribuer l'accès à des tiers",
                "Utiliser l'outil à des fins autres que professionnelles immobilières",
                "Générer un volume abusif de requêtes susceptible de nuire au service",
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">6. Propriété intellectuelle</h2>
            <p className="text-sm font-medium leading-relaxed">
              La plateforme Cléo, son interface, son code et ses contenus sont la propriété exclusive de Cléo SAS. Les contenus générés par l'IA à partir de vos données vous appartiennent. Vous nous accordez une licence limitée pour traiter vos données dans le cadre du service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">7. Limitation de responsabilité</h2>
            <p className="text-sm font-medium leading-relaxed">
              Cléo est fourni "en l'état". Les textes générés par l'IA sont des suggestions — vous êtes responsable de leur relecture et de leur publication. Nous ne garantissons pas l'exactitude ou la pertinence des contenus générés. Notre responsabilité est limitée au montant des sommes versées au cours des 3 derniers mois.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">8. Disponibilité du service</h2>
            <p className="text-sm font-medium leading-relaxed">
              Nous nous efforçons de maintenir une disponibilité maximale du service. Des interruptions ponctuelles pour maintenance peuvent survenir. Nous ne sommes pas responsables des interruptions dues à des tiers (hébergeur, fournisseur IA, opérateur réseau).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">9. Droit applicable</h2>
            <p className="text-sm font-medium leading-relaxed">
              Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">10. Contact</h2>
            <p className="text-sm font-medium leading-relaxed">
              Pour toute question relative aux présentes CGU, contactez-nous à <a href="mailto:patelamit134@gmail.com" className="text-fuchsia-600 hover:underline">patelamit134@gmail.com</a>.
            </p>
          </section>

        </div>
      </div>

      <footer className="border-t border-gray-100 px-10 py-6 flex items-center justify-between mt-8">
        <span className="font-extrabold text-gray-900">Cléo</span>
        <div className="flex gap-6 text-sm font-semibold text-gray-400">
          <a href="/confidentialite" className="hover:text-gray-900 transition-colors">Confidentialité</a>
          <a href="/conditions" className="text-fuchsia-600">Conditions</a>
          <a href="/support" className="hover:text-gray-900 transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  )
}
