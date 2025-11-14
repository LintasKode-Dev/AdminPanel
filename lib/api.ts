"use client"

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number, options?: ErrorOptions) {
    super(message, options)
    this.name = "ApiError"
    this.status = status
  }
}

const rawBase = (process.env.NEXT_PUBLIC_BACKEND_API || process.env.BACKEND_API || "").trim()
const normalizedBase = rawBase.replace(/\/+$/, "")
const API_BASE = normalizedBase.endsWith("/api") ? normalizedBase : `${normalizedBase}/api`

function resolveUrl(path: string) {
  if (!API_BASE) {
    throw new Error("Missing BACKEND_API environment variable")
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE}${normalizedPath}`
}

type ApiInit = RequestInit & {
  skipContentType?: boolean
}

async function apiFetch<T>(path: string, init?: ApiInit): Promise<T> {
  const url = resolveUrl(path)

  const headers = new Headers(init?.headers ?? {})
  if (!init?.skipContentType && init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  })

  const contentType = response.headers.get("Content-Type")
  const isJson = contentType?.includes("application/json")
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      (isJson && typeof payload === "object" && payload !== null && "error" in payload
        ? String(payload.error)
        : response.statusText) || "Unexpected API error"
    throw new ApiError(message, response.status)
  }

  return payload as T
}

export interface JobAnalytics {
  jobId: number
  totalClicks: number
  uniqueUsers: number
  lastClickAt: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface Job {
  id: number
  slug: string
  title: string
  company: string
  salary: string | null
  tech: string[]
  image: string | null
  isActive: boolean
  applyUrl: string
  markdown: string
  createdAt: string
  analytics?: JobAnalytics | null
}

export interface JobPayload {
  title: string
  company: string
  applyUrl: string
  markdown: string
  tech: string[]
  slug?: string
  salary?: string | null
  image?: string | null
  isActive?: boolean
}

export interface Article {
  id: number
  slug: string
  title: string
  content: string
  contentType: string | null
  createdAt: string
}

export interface ArticlePayload {
  title: string
  content: string
  contentType?: string | null
  slug?: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: T
  pagination?: {
    total: number
    limit: number
    offset: number
  }
  count?: number
}

export async function loginAdmin(payload: { username: string; password: string }) {
  const data = await apiFetch<{ success: boolean; admin?: { username: string }; message?: string }>(
    "/auth/admin/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )

  if (!data?.success || !data.admin?.username) {
    throw new ApiError(data?.message || "Failed to sign in", 400)
  }

  return data.admin
}

export async function fetchJobs(params: { limit?: number; offset?: number } = {}) {
  const searchParams = new URLSearchParams()
  if (params.limit) searchParams.set("limit", params.limit.toString())
  if (typeof params.offset === "number") searchParams.set("offset", params.offset.toString())

  const query = searchParams.toString()
  const endpoint = query ? `/jobs?${query}` : "/jobs"

  const payload = await apiFetch<PaginatedResponse<Job[]>>(endpoint)
  return {
    jobs: payload.data,
    pagination: payload.pagination,
  }
}

export async function updateJobStatus(jobId: number, isActive: boolean) {
  const payload = await apiFetch<PaginatedResponse<Job>>(`/jobs/${jobId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  })

  return payload.data
}

export async function deleteJob(jobId: number) {
  await apiFetch<void>(`/jobs/${jobId}`, { method: "DELETE" })
}

export async function createJob(payload: JobPayload) {
  const response = await apiFetch<PaginatedResponse<Job>>("/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function updateJob(jobId: number, payload: Partial<JobPayload>) {
  const response = await apiFetch<PaginatedResponse<Job>>(`/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function fetchArticles(params: { limit?: number; offset?: number } = {}) {
  const searchParams = new URLSearchParams()
  if (params.limit) searchParams.set("limit", params.limit.toString())
  if (typeof params.offset === "number") searchParams.set("offset", params.offset.toString())

  const query = searchParams.toString()
  const endpoint = query ? `/articles?${query}` : "/articles"

  const payload = await apiFetch<PaginatedResponse<Article[]>>(endpoint)
  return {
    articles: payload.data,
    pagination: payload.pagination,
  }
}

export async function createArticle(payload: ArticlePayload) {
  const response = await apiFetch<PaginatedResponse<Article>>("/articles", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function deleteArticle(slug: string) {
  await apiFetch<void>(`/articles/${slug}`, { method: "DELETE" })
}

export interface JobAnalyticsDetail {
  success: boolean
  data: {
    jobId: number
    totalClicks: number
    uniqueUsers: number
    lastClickAt: string | null
    recentClicks: Array<{
      id: string
      jobName: string
      timestamp: string
    }>
  }
}

export async function fetchJobAnalytics(jobId: number) {
  const payload = await apiFetch<JobAnalyticsDetail>(`/analytics/${jobId}`)
  return payload.data
}


