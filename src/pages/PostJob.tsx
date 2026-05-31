import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageSpinner } from '@/components/ui/spinner'
import { jobsApi } from '@/lib/api'
import type { Job } from '@/types'
import { ArrowLeft, Briefcase } from 'lucide-react'

const categoryOptions = [
  { value: 'planting', label: 'Planting' },
  { value: 'harvesting', label: 'Harvesting' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'livestock', label: 'Livestock Care' },
  { value: 'maintenance', label: 'Farm Maintenance' },
  { value: 'management', label: 'Farm Management' },
  { value: 'other', label: 'Other' },
]

const salaryTypeOptions = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'daily', label: 'Daily' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'negotiable', label: 'Negotiable' },
]

const employmentTypeOptions = [
  { value: 'full-time', label: 'Full-Time' },
  { value: 'part-time', label: 'Part-Time' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
]

/**
 * Post/Edit job form.
 */
export default function PostJob() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [validation, setValidation] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    salary_min: '',
    salary_max: '',
    salary_type: 'fixed' as string,
    employment_type: 'full-time' as string,
    requirements: '',
    is_active: true,
  })

  // Load existing job data if editing
  useEffect(() => {
    if (!id) return
    const fetchJob = async () => {
      try {
        const res = await jobsApi.getById(Number(id))
        if (res.data) {
          const job = res.data
          setForm({
            title: job.title,
            description: job.description,
            category: job.category,
            location: job.location || '',
            salary_min: job.salary_min?.toString() || '',
            salary_max: job.salary_max?.toString() || '',
            salary_type: job.salary_type,
            employment_type: job.employment_type,
            requirements: job.requirements || '',
            is_active: job.is_active,
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job')
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [id])

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (validation[field]) {
      setValidation((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Job title is required'
    if (!form.description.trim()) errs.description = 'Job description is required'
    if (!form.category) errs.category = 'Category is required'
    if (!form.employment_type) errs.employment_type = 'Employment type is required'
    setValidation(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location || undefined,
        salary_min: form.salary_min ? Number(form.salary_min) : undefined,
        salary_max: form.salary_max ? Number(form.salary_max) : undefined,
        salary_type: form.salary_type as Job['salary_type'],
        employment_type: form.employment_type as Job['employment_type'],
        requirements: form.requirements || undefined,
        is_active: form.is_active,
      }

      if (isEditing) {
        await jobsApi.update(Number(id), payload)
      } else {
        await jobsApi.create(payload)
      }

      navigate('/jobs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save job')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageSpinner text="Loading job..." />

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <button
        onClick={() => navigate('/jobs')}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Jobs
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="size-5" />
            {isEditing ? 'Edit Job' : 'Post a New Job'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Input
              label="Job Title *"
              placeholder="e.g., Farm Worker for Rice Harvest"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              error={validation.title}
            />

            <Textarea
              label="Job Description *"
              placeholder="Describe the job responsibilities, working conditions, etc."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              error={validation.description}
              rows={5}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Category *"
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                options={categoryOptions}
                placeholder="Select category"
                error={validation.category}
              />
              <Select
                label="Employment Type *"
                value={form.employment_type}
                onChange={(e) => updateField('employment_type', e.target.value)}
                options={employmentTypeOptions}
                error={validation.employment_type}
              />
            </div>

            <Input
              label="Location"
              placeholder="e.g., Nueva Ecija"
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Salary Min"
                type="number"
                placeholder="Min"
                value={form.salary_min}
                onChange={(e) => updateField('salary_min', e.target.value)}
              />
              <Input
                label="Salary Max"
                type="number"
                placeholder="Max"
                value={form.salary_max}
                onChange={(e) => updateField('salary_max', e.target.value)}
              />
              <Select
                label="Salary Type"
                value={form.salary_type}
                onChange={(e) => updateField('salary_type', e.target.value)}
                options={salaryTypeOptions}
              />
            </div>

            <Textarea
              label="Requirements"
              placeholder="List the qualifications and requirements for this job..."
              value={form.requirements}
              onChange={(e) => updateField('requirements', e.target.value)}
              rows={4}
            />

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => updateField('is_active', e.target.checked)}
                className="size-4 rounded border-input text-primary focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Active &mdash; accept applications
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting
                  ? 'Saving...'
                  : isEditing
                    ? 'Update Job'
                    : 'Post Job'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate('/jobs')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
