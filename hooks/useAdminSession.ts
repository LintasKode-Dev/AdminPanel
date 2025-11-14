"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

export interface AdminSession {
  username: string
}

const STORAGE_KEY = "lintaskode-admin"

export function useAdminSession() {
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
      if (stored) {
        const parsed = JSON.parse(stored) as AdminSession
        if (parsed?.username) {
          setAdmin(parsed)
        }
      }
    } catch (error) {
      console.warn("[useAdminSession] Failed to restore admin session", error)
    } finally {
      setHydrated(true)
    }
  }, [])

  const saveSession = useCallback((session: AdminSession | null) => {
    if (typeof window === "undefined") return

    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      setAdmin(session)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
      setAdmin(null)
    }
  }, [])

  const logout = useCallback(() => {
    saveSession(null)
    router.push("/admin")
  }, [router, saveSession])

  const value = useMemo(
    () => ({
      admin,
      hydrated,
      setSession: saveSession,
      logout,
      isAuthenticated: hydrated && !!admin,
    }),
    [admin, hydrated, logout, saveSession]
  )

  return value
}

export function getAdminInitials(username?: string) {
  if (!username) return "A"
  return username
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "A"
}


