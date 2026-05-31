import { Link } from 'react-router-dom'
import type { Job } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Briefcase, Clock, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface JobCardProps {
  job: Job
  isOwner?: boolean
}

/**
 * Job card for listings display.
 */
export function JobCard({ job, isOwner }: JobCardProps) {
  const employmentTypeColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'outline'> = {
    'full-time': 'default',
    'part-time': 'secondary',
    'seasonal': 'warning',
    'contract': 'outline',
    'temporary': 'outline',
  }

  const salaryDisplay = () => {
    if (job.salary_min && job.salary_max) {
      return `₱${job.salary_min.toLocaleString()} - ₱${job.salary_max.toLocaleString()}`
    }
    if (job.salary_min) {
      return `From ₱${job.salary_min.toLocaleString()}`
    }
    return 'Negotiable'
  }

  return (
    <Card className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <Link
              to={`/jobs/${job.id}`}
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {job.title}
            </Link>

            {/* Farmer */}
            <p className="text-sm text-muted-foreground mt-0.5">
              {job.farmer_name || `Farmer #${job.farmer_id}`}
            </p>
          </div>

          {/* Employment type badge */}
          <Badge variant={employmentTypeColors[job.employment_type] || 'outline'} className="shrink-0 capitalize">
            {job.employment_type}
          </Badge>
        </div>

        {/* Details */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {job.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Briefcase className="size-3.5" />
            {salaryDisplay()}/{job.salary_type === 'fixed' ? 'fixed' : job.salary_type}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            Posted {formatDate(job.created_at)}
          </span>
          {job.applications_count !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {job.applications_count} applicant{job.applications_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Category and action */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <Badge variant="secondary" className="capitalize">
            {job.category}
          </Badge>
          <div className="flex gap-2">
            {isOwner ? (
              <Link to={`/jobs/${job.id}`}>
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            ) : (
              <Link to={`/jobs/${job.id}`}>
                <Button size="sm">View Details</Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
