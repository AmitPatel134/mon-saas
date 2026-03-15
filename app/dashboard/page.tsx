"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [plan, setPlan] = useState<string>("free")

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/login"; return }
      setEmail(user.email ?? null)

      const res = await fetch(`/api/users?email=${user.email}`)
      const data = await res.json()
      if (data.plan) setPlan(data.plan)
    }
    getUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-2 border border-gray-200 rounded-lg"
        >
          Déconnexion
        </button>
      </div>
      <div className="p-6 border border-gray-200 rounded-xl flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Connecté en tant que</p>
          <p className="font-medium">{email}</p>
        </div>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
          {plan}
        </span>
      </div>
      {plan === "free" && (
        <div className="mt-6 p-6 border border-blue-200 bg-blue-50 rounded-xl">
          <p className="font-medium text-blue-800 mb-2">Passe au plan Pro</p>
          <p className="text-sm text-blue-600 mb-4">Accès illimité à toutes les fonctionnalités</p>
          <a href="/pricing" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg">
            Voir les tarifs
          </a>
        </div>
      )}
    </div>
  )
}
