"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCcw, Search, Trash2, Loader2, Plus, FileText } from "lucide-react"

import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Article,
  createArticle as createArticleRequest,
  deleteArticle as deleteArticleRequest,
  fetchArticles,
} from "@/lib/api"

interface ArticleFormState {
  title: string
  content: string
  contentType: string
  slug: string
}

const initialForm: ArticleFormState = {
  title: "",
  content: "",
  contentType: "insight",
  slug: "",
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [form, setForm] = useState<ArticleFormState>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { articles: data } = await fetchArticles({ limit: 100 })
      setArticles(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data artikel"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return articles

    return articles.filter((article) => {
      return (
        article.title.toLowerCase().includes(query) ||
        (article.contentType ?? "").toLowerCase().includes(query) ||
        article.slug.toLowerCase().includes(query)
      )
    })
  }, [articles, searchQuery])

  const handleInputChange = (field: keyof ArticleFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleMarkdownChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, content: value }))
  }

  const resetForm = () => setForm(initialForm)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title || !form.content) {
      setError("Judul dan konten markdown wajib diisi")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        title: form.title,
        content: form.content,
        contentType: form.contentType || null,
        slug: form.slug || undefined,
      }

      const newArticle = await createArticleRequest(payload)
      setArticles((prev) => [newArticle, ...prev])
      resetForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menambahkan artikel"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (slug: string, title: string) => {
    const confirmDelete = window.confirm(`Hapus artikel "${title}"?`)
    if (!confirmDelete) return

    setDeletingSlug(slug)
    setError(null)

    try {
      await deleteArticleRequest(slug)
      setArticles((prev) => prev.filter((article) => article.slug !== slug))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus artikel"
      setError(message)
    } finally {
      setDeletingSlug(null)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Manajemen Artikel</h1>
            <p className="text-sm text-slate-400">
              Tambah, kelola, dan hapus konten artikel yang ditampilkan di platform LintasKode.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadArticles}
              disabled={loading}
              className="border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Muat Ulang
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 hover:cursor-pointer"
              onClick={() => {
                const formCard = document.getElementById("article-form-card")
                if (formCard) {
                  formCard.scrollIntoView({ behavior: "smooth", block: "start" })
                  formCard.focus()
                }
              }}
            >
              <Plus className="w-5 h-5" />
              Tambah Artikel
            </Button>
          </div>
        </div>

        {error && (
          <Card className="bg-red-500/10 border border-red-500/40">
            <CardContent className="p-4 text-sm text-red-200">{error}</CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card id="article-form-card" className="bg-slate-900/70 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Plus className="h-5 w-5" />
                Tambah Artikel Baru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-slate-200">
                    Judul
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={form.title}
                    onChange={handleInputChange("title")}
                    placeholder="Misal: Strategi Hiring Tech Talent"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="slug" className="text-sm font-medium text-slate-200">
                    Slug (opsional)
                  </label>
                  <input
                    id="slug"
                    type="text"
                    value={form.slug}
                    onChange={handleInputChange("slug")}
                    placeholder="otomatis dibentuk dari judul jika dikosongkan"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="contentType" className="text-sm font-medium text-slate-200">
                    Kategori / Content Type
                  </label>
                  <input
                    id="contentType"
                    type="text"
                    value={form.contentType}
                    onChange={handleInputChange("contentType")}
                    placeholder="misal: insight, community, product-update"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium text-slate-200">
                    Konten (Markdown)
                  </label>
                  <textarea
                    id="content"
                    value={form.content}
                    onChange={handleMarkdownChange}
                    placeholder="Tulis konten artikel dalam format Markdown..."
                    rows={12}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent leading-relaxed"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetForm}
                    className="text-slate-300 hover:text-white hover:bg-slate-800"
                    disabled={submitting}
                  >
                    Reset
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
                    ) : (
                      "Simpan Artikel"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-slate-800">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5" />
                Daftar Artikel
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari judul / slug..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memuat data artikel...
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 py-12 text-center text-sm text-slate-400">
                  Tidak ada artikel yang ditemukan. Tambahkan artikel baru melalui form di samping.
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <div
                    key={article.slug}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-inner shadow-black/10"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-primary">
                          {article.contentType ?? "tanpa-kategori"}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">{article.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">Slug: {article.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          className="p-2 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDelete(article.slug, article.title)}
                          disabled={deletingSlug === article.slug}
                        >
                          {deletingSlug === article.slug ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-300 whitespace-pre-line">
                      {article.content.length > 400
                        ? `${article.content.slice(0, 400)}…`
                        : article.content}
                    </p>
                    <p className="mt-4 text-xs text-slate-500">
                      {new Date(article.createdAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}


