"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { createPortal } from "react-dom"
import { Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"

export interface JobFormValues {
  title: string
  slug: string
  company: string
  applyUrl: string
  salary: string
  image: string
  tech: string
  markdown: string
  isActive: boolean
}

interface JobFormModalProps {
  open: boolean
  mode: "create" | "edit"
  initialValues?: Partial<JobFormValues>
  onClose: () => void
  onSubmit: (values: JobFormValues) => Promise<void>
}

const BASE_VALUES: JobFormValues = {
  title: "",
  slug: "",
  company: "",
  applyUrl: "",
  salary: "",
  image: "",
  tech: "",
  markdown: "",
  isActive: true,
}

export function JobFormModal({ open, mode, initialValues, onClose, onSubmit }: JobFormModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [formValues, setFormValues] = useState<JobFormValues>(BASE_VALUES)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedInitialValues = useMemo(() => {
    return {
      ...BASE_VALUES,
      ...initialValues,
      tech: initialValues?.tech ?? BASE_VALUES.tech,
      isActive:
        typeof initialValues?.isActive === "boolean" ? initialValues.isActive : BASE_VALUES.isActive,
    }
  }, [initialValues])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      setFormValues(resolvedInitialValues)
      setError(null)
      setSubmitting(false)
    }
  }, [open, resolvedInitialValues])

  const handleClose = useCallback(() => {
    if (!submitting) {
      onClose()
    }
  }, [onClose, submitting])

  const handleChange = useCallback(
    (field: keyof JobFormValues) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value
        setFormValues((prev) => ({
          ...prev,
          [field]: value,
        }))
      },
    []
  )

  const handleBooleanToggle = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target
    setFormValues((prev) => ({
      ...prev,
      isActive: checked,
    }))
  }, [])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setSubmitting(true)
      setError(null)

      try {
        await onSubmit(formValues)
        onClose()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data job"
        setError(message)
        setSubmitting(false)
      }
    },
    [formValues, onClose, onSubmit]
  )

  const portalTarget = typeof document !== "undefined" ? document.body : null

  if (!open || !isMounted || !portalTarget) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {mode === "create" ? "Tambah Lowongan Baru" : "Edit Lowongan"}
            </h2>
            <p className="text-xs text-slate-400">
              Lengkapi detail lowongan. Gunakan tanda koma untuk memisahkan teknologi.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Tutup modal"
            disabled={submitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-5 overflow-y-auto px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-slate-200">
                Judul <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formValues.title}
                onChange={handleChange("title")}
                required
                placeholder="Contoh: Frontend Engineer"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium text-slate-200">
                Slug
              </label>
              <input
                id="slug"
                type="text"
                value={formValues.slug}
                onChange={handleChange("slug")}
                placeholder="Opsional, otomatis dari judul jika dikosongkan"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium text-slate-200">
                Perusahaan <span className="text-red-500">*</span>
              </label>
              <input
                id="company"
                type="text"
                value={formValues.company}
                onChange={handleChange("company")}
                required
                placeholder="Nama perusahaan"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="salary" className="text-sm font-medium text-slate-200">
                Gaji (opsional)
              </label>
              <input
                id="salary"
                type="text"
                value={formValues.salary}
                onChange={handleChange("salary")}
                placeholder="Misal: 12-18jt / bulan"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="applyUrl" className="text-sm font-medium text-slate-200">
                Link Lamar <span className="text-red-500">*</span>
              </label>
              <input
                id="applyUrl"
                type="url"
                value={formValues.applyUrl}
                onChange={handleChange("applyUrl")}
                required
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="image" className="text-sm font-medium text-slate-200">
                URL Gambar / Logo (opsional)
              </label>
              <input
                id="image"
                type="url"
                value={formValues.image}
                onChange={handleChange("image")}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="tech" className="text-sm font-medium text-slate-200">
              Teknologi / Stack <span className="text-red-500">*</span>
            </label>
            <input
              id="tech"
              type="text"
              value={formValues.tech}
              onChange={handleChange("tech")}
              required
              placeholder="Pisahkan dengan koma, misal: React, TypeScript, Tailwind"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="markdown" className="text-sm font-medium text-slate-200">
              Deskripsi (Markdown) <span className="text-red-500">*</span>
            </label>
            <textarea
              id="markdown"
              value={formValues.markdown}
              onChange={handleChange("markdown")}
              required
              rows={10}
              placeholder="Isi detail lowongan dalam format Markdown..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent leading-relaxed"
            />
            <p className="text-xs text-slate-500">
              Markdown mendukung heading, list, dan tautan untuk mempermudah pembacaan deskripsi.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-200">Status Publikasi</p>
              <p className="text-xs text-slate-500">
                Nonaktifkan untuk menyembunyikan lowongan dari halaman utama.
              </p>
            </div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={formValues.isActive}
                onChange={handleBooleanToggle}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary"
              />
              <span className="text-sm text-slate-200">
                {formValues.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
              disabled={submitting}
            >
              Batalkan
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : mode === "create" ? (
                "Simpan Lowongan"
              ) : (
                "Perbarui Lowongan"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    portalTarget
  )
}

          
          

