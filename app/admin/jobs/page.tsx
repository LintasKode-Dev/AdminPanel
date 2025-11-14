"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Edit2, Eye, EyeOff, Plus, RefreshCcw, Search, Trash2 } from "lucide-react"

import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createJob, deleteJob, fetchJobs, Job, updateJob, updateJobStatus } from "@/lib/api"
import { JobFormModal, type JobFormValues } from "./job-form-modal"

type FilterStatus = "all" | "active" | "inactive"

const STATUS_FILTERS: FilterStatus[] = ["all", "active", "inactive"]

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionJobId, setActionJobId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { jobs: jobsData } = await fetchJobs({ limit: 100 })
      setJobs(jobsData)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data jobs"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return jobs.filter((job) => {
      const matchesSearch =
        query.length === 0 ||
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.tech.some((tag) => tag.toLowerCase().includes(query))

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && job.isActive) ||
        (filterStatus === "inactive" && !job.isActive)

      return matchesSearch && matchesStatus
    })
  }, [jobs, searchQuery, filterStatus])

  const handleToggleStatus = async (job: Job) => {
    setActionJobId(job.id)
    try {
      const updated = await updateJobStatus(job.id, !job.isActive)
      setJobs((prev) =>
        prev.map((item) => (item.id === job.id ? { ...item, isActive: updated.isActive ?? !item.isActive } : item))
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memperbarui status job"
      setError(message)
    } finally {
      setActionJobId(null)
    }
  }

  const handleDelete = async (job: Job) => {
    const confirmed = window.confirm(`Hapus lowongan "${job.title}"?`)
    if (!confirmed) return

    setActionJobId(job.id)
    try {
      await deleteJob(job.id)
      setJobs((prev) => prev.filter((item) => item.id !== job.id))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus lowongan"
      setError(message)
    } finally {
      setActionJobId(null)
    }
  }

  const handleOpenCreateModal = () => {
    setModalMode("create")
    setSelectedJob(null)
    setModalOpen(true)
  }

  const handleOpenEditModal = (job: Job) => {
    setModalMode("edit")
    setSelectedJob(job)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedJob(null)
  }

  const handleSubmitJob = async (values: JobFormValues) => {
    const techArray = values.tech
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const payload = {
      title: values.title,
      company: values.company,
      applyUrl: values.applyUrl,
      markdown: values.markdown,
      tech: techArray,
      slug: values.slug || undefined,
      salary: values.salary || null,
      image: values.image || null,
      isActive: values.isActive,
    }

    try {
      if (modalMode === "create") {
        const newJob = await createJob(payload)
        setJobs((prev) => [newJob, ...prev])
      } else if (selectedJob) {
        const updatedJob = await updateJob(selectedJob.id, payload)
        setJobs((prev) => prev.map((item) => (item.id === selectedJob.id ? updatedJob : item)))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan lowongan"
      throw new Error(message)
    }
  }

  const getInitialValues = (): Partial<JobFormValues> | undefined => {
    if (modalMode === "edit" && selectedJob) {
      return {
        title: selectedJob.title,
        slug: selectedJob.slug,
        company: selectedJob.company,
        applyUrl: selectedJob.applyUrl,
        salary: selectedJob.salary || "",
        image: selectedJob.image || "",
        tech: selectedJob.tech.join(", "),
        markdown: selectedJob.markdown,
        isActive: selectedJob.isActive,
      }
    }
    return undefined
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Manajemen Lowongan</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:cursor-pointer"
              onClick={loadJobs}
              disabled={loading}
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Segarkan
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 hover:cursor-pointer"
              onClick={handleOpenCreateModal}
            >
              <Plus className="w-5 h-5" />
              Tambah Job
            </Button>
          </div>
        </div>

        {error && (
          <Card className="bg-red-500/10 border border-red-500/40">
            <CardContent className="p-4 text-sm text-red-200">{error}</CardContent>
          </Card>
        )}

        <Card className="bg-slate-900/70 border-slate-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan judul, perusahaan, atau teknis..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full pl-11 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                {STATUS_FILTERS.map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? "default" : "outline"}
                    onClick={() => setFilterStatus(status)}
                    className={
                      filterStatus === status
                        ? "bg-primary text-primary-foreground"
                        : "border-slate-700 text-slate-200 hover:bg-slate-800"
                    }
                  >
                    {status === "all" ? "Semua" : status === "active" ? "Aktif" : "Nonaktif"}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800 overflow-hidden">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-lg text-white">Daftar Lowongan ({filteredJobs.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-3 text-left">Judul</th>
                    <th className="px-6 py-3 text-left">Perusahaan</th>
                    <th className="px-6 py-3 text-left">Teknologi</th>
                    <th className="px-6 py-3 text-left">Klik</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        Memuat data lowongan...
                      </td>
                    </tr>
                  ) : filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        Tidak ada data yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr key={job.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-white">{job.title}</p>
                            <p className="text-xs text-slate-400">{job.slug}</p>
                            {job.salary && <p className="text-xs text-slate-500 mt-1">{job.salary}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-200">{job.company}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {job.tech.map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-200 font-semibold">
                          {job.analytics?.totalClicks ?? 0}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleStatus(job)}
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              job.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                            }`}
                            disabled={actionJobId === job.id}
                          >
                            {job.isActive ? (
                              <>
                                <Eye className="w-3 h-3" /> Aktif
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" /> Nonaktif
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2 text-primary hover:bg-primary/10"
                              onClick={() => handleOpenEditModal(job)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2 text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDelete(job)}
                              disabled={actionJobId === job.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <JobFormModal
          open={modalOpen}
          mode={modalMode}
          initialValues={getInitialValues()}
          onClose={handleCloseModal}
          onSubmit={handleSubmitJob}
        />
      </div>
    </AdminLayout>
  )
}

