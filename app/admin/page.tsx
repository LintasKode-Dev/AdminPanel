"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { loginAdmin } from "@/lib/api"
import { useAdminSession } from "@/hooks/useAdminSession"

export default function AdminLoginPage() {
  const router = useRouter()
  const { setSession, isAuthenticated, hydrated } = useAdminSession()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/admin/dashboard")
    }
  }, [hydrated, isAuthenticated, router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!username || !password) return

    setLoading(true)
    setError(null)

    try {
      const admin = await loginAdmin({ username, password })
      setSession(admin)
      router.push("/admin/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg shadow-primary/30">
            <span className="text-2xl font-bold text-primary-foreground">LK</span>
          </div>
          <h1 className="text-3xl font-bold text-white">LintasKode Admin</h1>
          <p className="text-sm text-slate-300">Masuk untuk mengelola lowongan dan konten platform</p>
        </div>

        <Card className="bg-slate-900/70 border-slate-800 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-white">Selamat datang kembali</CardTitle>
            <CardDescription className="text-slate-300">
              Gunakan akun admin resmi untuk mengakses panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-slate-200">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-200">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent transition-colors"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {loading ? "Memproses..." : "Masuk"}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-4">
              Hubungi tim LintasKode jika membutuhkan akses admin.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
