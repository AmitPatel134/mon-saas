import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">

      {/* Logo */}
      <Link href="/" className="font-extrabold text-xl tracking-tight text-white mb-16">
        CleoAI
      </Link>

      {/* 404 */}
      <div className="text-center max-w-md">
        <p className="text-[clamp(6rem,20vw,10rem)] font-extrabold leading-none text-white/5 select-none">
          404
        </p>
        <h1 className="text-2xl font-extrabold text-white -mt-6 mb-3">
          Page introuvable
        </h1>
        <p className="text-sm text-gray-500 font-medium mb-10">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="bg-fuchsia-600 text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-fuchsia-700 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/app"
            className="border border-white/10 text-gray-300 font-semibold text-sm px-6 py-3 rounded-full hover:border-white/30 hover:text-white transition-colors"
          >
            Mon espace
          </Link>
        </div>
      </div>

    </div>
  )
}
