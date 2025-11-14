"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Briefcase, FileText, TrendingUp, Users } from "lucide-react"
import { BarChart, Bar, CartesianGrid, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchArticles, fetchJobAnalytics, fetchJobs, Job } from "@/lib/api"

interface TimelinePoint {
  date: string
  clicks: number
}

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: typeof Briefcase
  title: string
  value: string | number
  subtitle?: string
}) => (
  <Card className="bg-slate-900/70 border-slate-800 text-slate-200">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-emerald-400 font-semibold">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [articlesCount, setArticlesCount] = useState(0)
  const [timeline, setTimeline] = useState<TimelinePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [{ jobs: jobsData }, { articles, pagination: articlesPagination }] = await Promise.all([
        fetchJobs({ limit: 100 }),
        fetchArticles({ limit: 100 }),
      ])

      setJobs(jobsData)
      setArticlesCount(articlesPagination?.total ?? articles.length ?? 0)

      const topJob = [...jobsData]
        .filter((job) => (job.analytics?.totalClicks ?? 0) > 0)
        .sort((a, b) => (b.analytics?.totalClicks ?? 0) - (a.analytics?.totalClicks ?? 0))[0]

      if (topJob) {
        const analytics = await fetchJobAnalytics(topJob.id)
        const grouped = analytics.recentClicks.reduce<Record<string, number>>((acc, item) => {
          const date = new Date(item.timestamp).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
          acc[date] = (acc[date] ?? 0) + 1
          return acc
        }, {})

        const ordered = Object.entries(grouped)
          .map(([date, clicks]) => ({ date, clicks }))
          .sort((a, b) => {
            const parse = (value: string) => {
              const [day, month] = value.split(" ")
              return new Date(`${month} ${day}, ${new Date().getFullYear()}`)
            }
            return parse(a.date).getTime() - parse(b.date).getTime()
          })

        setTimeline(ordered)
      } else {
        setTimeline([])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard data"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const stats = useMemo(() => {
    const totalJobs = jobs.length
    const activeJobs = jobs.filter((job) => job.isActive).length
    const totalClicks = jobs.reduce((sum, job) => sum + (job.analytics?.totalClicks ?? 0), 0)

    return {
      totalJobs,
      activeJobs,
      totalArticles: articlesCount,
      totalClicks,
    }
  }, [articlesCount, jobs])

  const topJobsData = useMemo(() => {
    return [...jobs]
      .map((job) => ({
        name: job.title,
        clicks: job.analytics?.totalClicks ?? 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)
  }, [jobs])

  const recentActivity = useMemo(() => {
    return [...jobs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [jobs])

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">
            Ringkasan performa platform LintasKode berdasarkan data backend terbaru.
          </p>
        </div>

        {error && (
          <Card className="bg-red-500/10 border border-red-500/40">
            <CardContent className="p-4 text-sm text-red-200">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} title="Total Jobs Aktif" value={stats.totalJobs} subtitle="Data dari API /jobs" />
          <StatCard icon={TrendingUp} title="Status Aktif" value={stats.activeJobs} subtitle="Jumlah job yang tampil" />
          <StatCard icon={FileText} title="Total Artikel" value={stats.totalArticles} subtitle="Konten terbaru publik" />
          <StatCard
            icon={Users}
            title="Total Clicks"
            value={stats.totalClicks}
            subtitle="Akumulasi seluruh lowongan"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900/70 border-slate-800 text-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Klik Terbaru
                <span className="block text-xs font-normal text-slate-400">
                  Berdasarkan aktivitas lowongan dengan performa terbaik
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeline.length > 0 ? timeline : [{ date: "Belum ada data", clicks: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--color-muted-foreground))" />
                  <YAxis stroke="hsl(var(--color-muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--color-card))",
                      border: "1px solid hsl(var(--color-border))",
                      borderRadius: "8px",
                      color: "hsl(var(--color-foreground))",
                    }}
                  />
                  <Line type="monotone" dataKey="clicks" stroke="hsl(var(--color-primary))" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-slate-800 text-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-white">Top Jobs berdasarkan Klik</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topJobsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--color-muted-foreground))" />
                  <YAxis stroke="hsl(var(--color-muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--color-card))",
                      border: "1px solid hsl(var(--color-border))",
                      borderRadius: "8px",
                      color: "hsl(var(--color-foreground))",
                    }}
                  />
                  <Bar dataKey="clicks" fill="hsl(var(--color-primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/70 border-slate-800 text-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-white">Aktivitas Lowongan Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-6 text-center text-slate-400">Memuat data jobs...</div>
            ) : recentActivity.length === 0 ? (
              <div className="p-6 text-center text-slate-400">Belum ada lowongan yang tercatat.</div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between gap-4 py-3 border-b border-slate-800 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-white">{job.title}</p>
                      <p className="text-sm text-slate-400">{job.company}</p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p>{new Date(job.createdAt).toLocaleDateString("id-ID")}</p>
                      <span>{job.analytics?.totalClicks ?? 0} klik</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
