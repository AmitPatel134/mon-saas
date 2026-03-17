export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 px-10 py-5 flex items-center justify-between">
        <a href="/" className="text-lg font-extrabold tracking-tight text-gray-900">Cléo</a>
        <a href="/" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">← Retour</a>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs font-bold text-fuchsia-600 uppercase tracking-widest mb-4">Légal</p>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-gray-400 font-medium mb-12">Dernière mise à jour : mars 2026</p>

        <div className="flex flex-col gap-10 text-gray-700">

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">1. Qui sommes-nous ?</h2>
            <p className="text-sm font-medium leading-relaxed">
              Cléo est un outil SaaS destiné aux agents immobiliers, édité par Cléo SAS. Nous collectons et traitons des données personnelles dans le cadre de la fourniture de nos services. Pour toute question relative à vos données, contactez-nous à <a href="mailto:patelamit134@gmail.com" className="text-fuchsia-600 hover:underline">patelamit134@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">2. Données collectées</h2>
            <p className="text-sm font-medium leading-relaxed mb-3">Nous collectons les données suivantes :</p>
            <ul className="flex flex-col gap-2 text-sm font-medium">
              {[
                "Adresse e-mail et mot de passe (lors de la création de compte)",
                "Informations de facturation (traitées par Stripe, nous n'avons pas accès à vos données bancaires)",
                "Données immobilières saisies dans l'outil (mandats, prospects)",
                "Données de connexion et d'utilisation (logs, adresse IP)",
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">3. Utilisation des données</h2>
            <p className="text-sm font-medium leading-relaxed mb-3">Vos données sont utilisées pour :</p>
            <ul className="flex flex-col gap-2 text-sm font-medium">
              {[
                "Fournir et améliorer nos services",
                "Gérer votre compte et votre abonnement",
                "Envoyer des communications relatives au service (mises à jour, facturation)",
                "Générer des annonces via l'IA (les données sont transmises à Groq de manière sécurisée)",
                "Assurer la sécurité et prévenir les abus",
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">4. Partage des données</h2>
            <p className="text-sm font-medium leading-relaxed">
              Nous ne vendons jamais vos données. Nous faisons appel à des sous-traitants de confiance : <strong>Supabase</strong> (hébergement et authentification), <strong>Stripe</strong> (paiement), <strong>Groq</strong> (génération IA), <strong>Resend</strong> (emails). Chacun est soumis à des obligations strictes de confidentialité.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">5. Conservation des données</h2>
            <p className="text-sm font-medium leading-relaxed">
              Vos données sont conservées pendant toute la durée de votre abonnement, puis supprimées dans un délai de 30 jours suivant la résiliation de votre compte, sauf obligation légale contraire.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">6. Vos droits (RGPD)</h2>
            <p className="text-sm font-medium leading-relaxed mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="flex flex-col gap-2 text-sm font-medium">
              {[
                "Droit d'accès à vos données personnelles",
                "Droit de rectification des données inexactes",
                "Droit à l'effacement (« droit à l'oubli »)",
                "Droit à la portabilité de vos données",
                "Droit d'opposition au traitement",
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium leading-relaxed mt-3">
              Pour exercer ces droits, contactez-nous à <a href="mailto:patelamit134@gmail.com" className="text-fuchsia-600 hover:underline">patelamit134@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">7. Cookies</h2>
            <p className="text-sm font-medium leading-relaxed">
              Nous utilisons uniquement les cookies strictement nécessaires au fonctionnement du service (session d'authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">8. Modifications</h2>
            <p className="text-sm font-medium leading-relaxed">
              Nous pouvons mettre à jour cette politique à tout moment. En cas de modification substantielle, vous serez notifié par e-mail. La date de dernière mise à jour est indiquée en haut de cette page.
            </p>
          </section>

        </div>
      </div>

      <footer className="border-t border-gray-100 px-10 py-6 flex items-center justify-between mt-8">
        <span className="font-extrabold text-gray-900">Cléo</span>
        <div className="flex gap-6 text-sm font-semibold text-gray-400">
          <a href="/confidentialite" className="text-fuchsia-600">Confidentialité</a>
          <a href="/conditions" className="hover:text-gray-900 transition-colors">Conditions</a>
          <a href="/support" className="hover:text-gray-900 transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  )
}
