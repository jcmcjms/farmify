import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { PageSpinner } from '@/components/ui/spinner'
import { jobsApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Job, JobApplication } from '@/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, Briefcase01Icon, CancelCircleIcon, CheckmarkCircle01Icon, Clock01Icon, EyeIcon, Forward01Icon, MapPinIcon, UserMultipleIcon } from '@hugeicons/core-free-icons'

/**
 * Job detail page — full job info, apply form, and applications management.
 */
export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const isFarmer = user?.role === 'farmer'

  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [appError, setAppError] = useState('')

  const isOwner = isFarmer && job?.farmer_id === user?.id

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await jobsApi.getById(Number(id))
        if (res.data) {
          setJob(res.data)
        }

        // Fetch applications if owner
        if (isOwner) {
          try {
            const appRes = await jobsApi.getApplications(Number(id))
            if (appRes.data) {
              setApplications(appRes.data)
            }
          } catch {
            // Applications fetch is optional
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, isOwner])

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setApplying(true)
    setAppError('')
    try {
      await jobsApi.apply(Number(id), { cover_letter: coverLetter || undefined })
      setApplied(true)
      setShowApplyForm(false)
    } catch (err) {
      setAppError(err instanceof Error ? err.message : 'Failed to submit application')
    } finally {
      setApplying(false)
    }
  }

  const handleUpdateApplicationStatus = async (applicationId: number, status: string) => {
    try {
      const res = await jobsApi.updateApplicationStatus(Number(id), applicationId, {
        status: status as JobApplication['status'],
      })
      if (res.data) {
        setApplications((prev) =>
          prev.map((a) => (a.id === applicationId ? { ...a, status: status as JobApplication['status'] } : a))
        )
      }
    } catch {
      // Handle error
    }
  }

  if (loading) return <PageSpinner text="Loading job details..." />

  if (error || !job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <HugeiconsIcon icon={Briefcase01Icon} className="size-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Job Not Found</h2>
        <p className="text-muted-foreground mt-1">{error || 'This job posting does not exist.'}</p>
        <Button className="mt-4" onClick={() => navigate('/jobs')}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          Back to Jobs
        </Button>
      </div>
    )
  }

  const displaySalary = () => {
    if (job.salary_min && job.salary_max) {
      return `₱${job.salary_min.toLocaleString()} - ₱${job.salary_max.toLocaleString()}`
    }
    if (job.salary_min) {
      return `From ₱${job.salary_min.toLocaleString()}`
    }
    return 'Negotiable'
  }

  const statusBadgeVariant = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'secondary'> = {
      pending: 'warning',
      reviewed: 'secondary',
      shortlisted: 'success',
      accepted: 'success',
      rejected: 'danger',
    }
    return map[status] || 'default'
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <button
        onClick={() => navigate('/jobs')}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
        Back to Jobs
      </button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="secondary" className="capitalize">{job.category}</Badge>
              <Badge variant="outline" className="capitalize">{job.employment_type}</Badge>
              {!job.is_active && <Badge variant="danger">Inactive</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
            <p className="text-muted-foreground mt-1">
              Posted by {job.farmer_name || `Farmer #${job.farmer_id}`} &middot; {formatDate(job.created_at)}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={MapPinIcon} className="size-4 text-muted-foreground" />
              <span>{job.location || 'Location not specified'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={Clock01Icon} className="size-4 text-muted-foreground" />
              <span>{displaySalary()} / {job.salary_type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={Briefcase01Icon} className="size-4 text-muted-foreground" />
              <span className="capitalize">{job.employment_type.replace('-', ' ')}</span>
            </div>
            {job.applications_count !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <HugeiconsIcon icon={UserMultipleIcon} className="size-4 text-muted-foreground" />
                <span>{job.applications_count} applicant{job.applications_count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {job.description}
              </p>
            </CardContent>
          </Card>

          {/* Requirements */}
          {job.requirements && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {job.requirements}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Apply Form */}
          {!isOwner && job.is_active && !applied && showApplyForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Apply for this Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appError && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {appError}
                  </div>
                )}
                <Textarea
                  label="Cover Letter (optional)"
                  placeholder="Tell the farmer why you're a good fit for this job..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-3">
                  <Button onClick={handleApply} disabled={applying}>
                    {applying ? 'Submitting...' : <><HugeiconsIcon icon={Forward01Icon} className="size-4" /> Submit Application</>}
                  </Button>
                  <Button variant="outline" onClick={() => setShowApplyForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Applied confirmation */}
          {!isOwner && applied && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 flex items-center gap-3">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-6 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">Application Submitted!</p>
                  <p className="text-sm text-green-600">The farmer will review your application and get back to you.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Apply button */}
          {!isOwner && job.is_active && !applied && !showApplyForm && (
            <Button size="lg" onClick={() => {
              if (!isAuthenticated) {
                navigate('/login')
                return
              }
              setShowApplyForm(true)
            }}>
              <HugeiconsIcon icon={Forward01Icon} className="size-4" />
              Apply for this Job
            </Button>
          )}

          {/* Inactive notice */}
          {!job.is_active && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
              This job posting is no longer accepting applications.
            </div>
          )}
        </div>

        {/* Sidebar — Applications (Farmer only) */}
        <div className="lg:col-span-1">
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HugeiconsIcon icon={UserMultipleIcon} className="size-5" />
                  Applications ({applications.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {applications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No applications yet.
                  </p>
                ) : (
                  applications.map((app) => (
                    <div key={app.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{app.applicant_name || `Applicant #${app.applicant_id}`}</p>
                        <Badge variant={statusBadgeVariant(app.status)} className="text-[10px] capitalize">
                          {app.status}
                        </Badge>
                      </div>
                      {app.cover_letter && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{app.cover_letter}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">{formatDate(app.created_at)}</p>

                      {/* Action buttons */}
                      <div className="flex gap-1 pt-1">
                        {app.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => handleUpdateApplicationStatus(app.id, 'reviewed')}
                            >
                              <HugeiconsIcon icon={EyeIcon} className="size-3 mr-1" /> Review
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2 text-green-600"
                              onClick={() => handleUpdateApplicationStatus(app.id, 'shortlisted')}
                            >
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3 mr-1" /> Shortlist
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2 text-destructive"
                              onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                            >
                              <HugeiconsIcon icon={CancelCircleIcon} className="size-3 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {app.status === 'reviewed' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2 text-green-600"
                              onClick={() => handleUpdateApplicationStatus(app.id, 'shortlisted')}
                            >
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3 mr-1" /> Shortlist
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2 text-destructive"
                              onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                            >
                              <HugeiconsIcon icon={CancelCircleIcon} className="size-3 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {app.status === 'shortlisted' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2 text-green-600"
                              onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                            >
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3 mr-1" /> Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2 text-destructive"
                              onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                            >
                              <HugeiconsIcon icon={CancelCircleIcon} className="size-3 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
