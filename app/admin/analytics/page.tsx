"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchJobAnalytics, fetchJobs, Job } from "@/lib/api"

interface TimelinePoint {
  date: string
  clicks: number
}

interface PiePoint {
  name: string
  value: number
  color: string
}

const PIE_COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f97316", "#facc15", "#f43f5e"]

export default function AnalyticsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [timeline, setTimeline] = useState<TimelinePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<"7d" | "30d">("30d")

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { jobs: jobsData } = await fetchJobs({ limit: 200 })
      setJobs(jobsData)

      const topJob = jobsData
        .filter((job) => (job.analytics?.totalClicks ?? 0) > 0)
        .sort((a, b) => (b.analytics?.totalClicks ?? 0) - (a.analytics?.totalClicks ?? 0))[0]

      if (topJob) {
        const analytics = await fetchJobAnalytics(topJob.id)
        const grouped = analytics.recentClicks.reduce<Record<string, number>>((acc, click) => {
          const date = new Date(click.timestamp)
          const key = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
          acc[key] = (acc[key] ?? 0) + 1
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
      const message = err instanceof Error ? err.message : "Gagal memuat data analytics"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const metrics = useMemo(() => {
    const totalClicks = jobs.reduce((sum, job) => sum + (job.analytics?.totalClicks ?? 0), 0)
    const uniqueUsers = jobs.reduce((sum, job) => sum + (job.analytics?.uniqueUsers ?? 0), 0)
    const avgClicks = jobs.length > 0 ? Math.round(totalClicks / jobs.length) : 0

    return {
      totalClicks,
      uniqueUsers,
      avgClicks,
      totalJobs: jobs.length,
    }
  }, [jobs])

  const jobPerformance = useMemo(() => {
    return [...jobs]
      .map((job) => ({
        name: job.title,
        clicks: job.analytics?.totalClicks ?? 0,
        uniqueUsers: job.analytics?.uniqueUsers ?? 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 8)
  }, [jobs])

  const clickDistribution = useMemo(() => {
    const topJobs = jobPerformance.slice(0, 5)
    const data: PiePoint[] = topJobs.map((job, index) => ({
      name: job.name,
      value: job.clicks,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }))

    const sumTopJobs = topJobs.reduce((sum, job) => sum + job.clicks, 0)
    const remainingClicks = metrics.totalClicks - sumTopJobs
    if (remainingClicks > 0) {
      data.push({
        name: "Lainnya",
        value: remainingClicks,
        color: PIE_COLORS[data.length % PIE_COLORS.length],
      })
    }
    return data
  }, [jobPerformance, metrics.totalClicks])

  const filteredTimeline = useMemo(() => {
    if (range === "30d") {
      return timeline
    }
    const startIndex = Math.max(timeline.length - 7, 0)
    return timeline.slice(startIndex)
  }, [range, timeline])

  const funnelData = useMemo(() => {
    const totalClicks = metrics.totalClicks
    const uniqueUsers = metrics.uniqueUsers
    const activeJobs = metrics.totalJobs
    const avgClicks = metrics.avgClicks

    return [
      { stage: "Lowongan Aktif", value: activeJobs },
      { stage: "Total Klik", value: totalClicks },
      { stage: "Pengguna Unik", value: uniqueUsers },
      { stage: "Rata-rata Klik / Job", value: avgClicks },
    ]
  }, [metrics])

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-slate-400 text-sm">
              Seluruh grafik dan metrik ini mengambil data langsung dari LintasKode BE.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["7d", "30d"] as const).map((option) => (
              <Button
                key={option}
                variant={range === option ? "default" : "outline"}
                onClick={() => setRange(option)}
                className={
                  range === option
                    ? "bg-primary text-primary-foreground"
                    : "border-slate-700 text-slate-200 hover:bg-slate-800"
                }
              >
                {option === "7d" ? "7 Hari" : "30 Hari"}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <Card className="bg-red-500/10 border border-red-500/40">
            <CardContent className="p-4 text-sm text-red-200">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/70 border-slate-800">
            <CardContent className="p-6 text-slate-200">
              <p className="text-sm text-slate-400">Total Klik</p>
              <p className="text-3xl font-bold text-white mt-1">{metrics.totalClicks.toLocaleString("id-ID")}</p>
              <p className="text-xs text-slate-500 mt-2">Akumulasi seluruh lowongan aktif</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/70 border-slate-800">
            <CardContent className="p-6 text-slate-200">
              <p className="text-sm text-slate-400">Pengguna Unik</p>
              <p className="text-3xl font-bold text-white mt-1">{metrics.uniqueUsers.toLocaleString("id-ID")}</p>
              <p className="text-xs text-slate-500 mt-2">Mengunjungi dan melakukan klik lowongan</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/70 border-slate-800">
            <CardContent className="p-6 text-slate-200">
              <p className="text-sm text-slate-400">Rata-rata Klik / Job</p>
              <p className="text-3xl font-bold text-white mt-1">{metrics.avgClicks.toLocaleString("id-ID")}</p>
              <p className="text-xs text-slate-500 mt-2">Mengukur performa keseluruhan job listing</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/70 border-slate-800">
            <CardContent className="p-6 text-slate-200">
              <p className="text-sm text-slate-400">Lowongan Aktif</p>
              <p className="text-3xl font-bold text-white mt-1">{metrics.totalJobs}</p>
              <p className="text-xs text-slate-500 mt-2">Tersedia dan tampil untuk talent</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900/70 border-slate-800 text-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Tren Klik Terbaru
                <span className="block text-xs font-normal text-slate-400">
                  Berdasarkan lowongan dengan performa tertinggi
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={filteredTimeline.length > 0 ? filteredTimeline : [{ date: "Belum ada data", clicks: 0 }]}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--color-primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--color-primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--color-muted-foreground))" />
                  <YAxis stroke="hsl(var(--color-muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--color-card))",
                      border: "1px solid hsl(var(--color-border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="hsl(var(--color-primary))"
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-slate-800 text-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-white">Distribusi Klik per Lowongan</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={clickDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toLocaleString("id-ID")} klik`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {clickDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${Number(value).toLocaleString("id-ID")} klik`}
                    contentStyle={{
                      backgroundColor: "hsl(var(--color-card))",
                      border: "1px solid hsl(var(--color-border))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/70 border-slate-800 text-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-white">Performa Lowongan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={jobPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                <XAxis dataKey="name" stroke="hsl(var(--color-muted-foreground))" />
                <YAxis stroke="hsl(var(--color-muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--color-card))",
                    border: "1px solid hsl(var(--color-border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="clicks" name="Total Klik" fill="hsl(var(--color-primary))" radius={[8, 8, 0, 0]} />
                <Bar
                  dataKey="uniqueUsers"
                  name="Pengguna Unik"
                  fill="hsl(var(--color-chart-2, 210 100% 56%))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800 text-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-white">Ringkasan Funnel Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {funnelData.map((item, index) => {
              const max = funnelData[0]?.value || 1
              const percentage = Math.min((item.value / max) * 100, 100)
              return (
                <div key={item.stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">{item.stage}</span>
                    <span className="text-sm text-slate-400">{item.value.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

