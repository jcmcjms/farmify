import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { JobCard } from '@/components/shared/JobCard'
import { PageHeader, ErrorBanner, EmptyState, Pagination } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageSpinner } from '@/components/ui/spinner'
import { jobsApi } from '@/lib/api'
import type { Job } from '@/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { Briefcase01Icon, PlusSignIcon, Search01Icon } from '@hugeicons/core-free-icons'

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'planting', label: 'Planting' },
  { value: 'harvesting', label: 'Harvesting' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'livestock', label: 'Livestock Care' },
  { value: 'maintenance', label: 'Farm Maintenance' },
  { value: 'management', label: 'Farm Management' },
  { value: 'other', label: 'Other' },
]

const employmentOptions = [
  { value: '', label: 'All Types' },
  { value: 'full-time', label: 'Full-Time' },
  { value: 'part-time', label: 'Part-Time' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
]

/**
 * Jobs page — browse and search job listings.
 */
export default function Jobs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isFarmer = user?.role === 'farmer'

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' }
      if (search.trim()) params.search = search.trim()
      if (category) params.category = category
      if (employmentType) params.employment_type = employmentType
      const res = await jobsApi.getAll(params)
      if (res.data) {
        setJobs(res.data)
        setTotalPages(res.pagination?.totalPages || 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [search, category, employmentType, page])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchJobs()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <PageHeader title="Job Portal" description="Find farm work or hire skilled workers.">
        {isFarmer && (
          <Button onClick={() => navigate('/jobs/new')}>
            <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
            Post a Job
          </Button>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>
        <div className="grid grid-cols-2 gap-4 sm:flex sm:w-auto">
          <div className="sm:w-44">
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
              }}
              options={categoryOptions}
              placeholder="Category"
            />
          </div>
          <div className="sm:w-44">
            <Select
              value={employmentType}
              onChange={(e) => {
                setEmploymentType(e.target.value)
                setPage(1)
              }}
              options={employmentOptions}
              placeholder="Employment Type"
            />
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchJobs} />}

      {loading && <PageSpinner text="Loading jobs..." />}

      {!loading && !error && jobs.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description={
            search || category || employmentType
              ? 'Try different search terms or filters.'
              : 'No jobs posted yet.'
          }
          action={
            search || category || employmentType
              ? {
                  label: 'Clear Filters',
                  onClick: () => {
                    setSearch('')
                    setCategory('')
                    setEmploymentType('')
                    setPage(1)
                  },
                }
              : undefined
          }
        />
      )}

      {!loading && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} isOwner={isFarmer && job.farmer_id === user?.id} />
          ))}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} variant="simple" />
        </div>
      )}
    </div>
  )
}
