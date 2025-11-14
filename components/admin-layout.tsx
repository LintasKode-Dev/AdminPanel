"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, LogOut, BarChart3, FileText, Briefcase, Settings, BookAIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getAdminInitials, useAdminSession } from "@/hooks/useAdminSession"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { admin, hydrated, isAuthenticated, logout } = useAdminSession()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/admin")
    }
  }, [hydrated, isAuthenticated, router])

  const navItems = useMemo(
    () => [
      { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
      { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
      { href: "/admin/analytics", label: "Analytics", icon: FileText },
      { href: "/admin/articles", label: "Articles", icon: BookAIcon },
    ],
    []
  )

  const isActive = (href: string) => pathname === href

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Memuat panel admin...
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-slate-900/80 backdrop-blur border-r border-slate-800 transition-all duration-300 z-40 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="p-6 border-b border-slate-800">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold text-primary-foreground shadow-lg shadow-primary/20">
              LK
            </div>
            {sidebarOpen && <span className="font-semibold text-lg text-white tracking-wide">LintasKode Admin</span>}
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? "bg-primary/20 border border-primary/40 text-white shadow-inner shadow-primary/30"
                    : "text-slate-300 hover:bg-slate-800/80 hover:border hover:border-slate-700"
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-primary-foreground" : "text-slate-400"}`} />
                {sidebarOpen && <span className="font-medium text-sm uppercase tracking-wide">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-red-500/10"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Keluar</span>}
          </Button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        <header className="sticky top-0 z-30 bg-slate-900/70 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-2 rounded-lg hover:bg-slate-800/80 transition-colors text-slate-300"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Masuk sebagai</p>
              <p className="text-sm font-semibold text-white">{admin?.username}</p>
            </div>
            <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold shadow-lg shadow-primary/40">
              {getAdminInitials(admin?.username)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-950/60">{children}</main>
      </div>
    </div>
  )
}
