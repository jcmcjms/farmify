import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageSpinner } from '@/components/ui/spinner'
import type { VerificationListItem, FarmerProfile, VerificationDocument, User } from '@/types'
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  Mail,
  Shield,
  FileImage,
} from 'lucide-react'

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
] as const

function statusBadge(status: string) {
  const map: Record<string, { variant: 'warning' | 'success' | 'danger' | 'secondary'; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    verified: { variant: 'success', label: 'Verified' },
    rejected: { variant: 'danger', label: 'Rejected' },
    unverified: { variant: 'secondary', label: 'Unverified' },
  }
  const s = map[status] || { variant: 'secondary' as const, label: status }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

interface DetailData {
  farmer: User
  profile: FarmerProfile
  documents: VerificationDocument[]
}

/**
 * Admin verification queue page.
 */
export default function AdminVerifications() {
  const [verifications, setVerifications] = useState<VerificationListItem[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Detail view
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  // Reject modal
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectSubmitting, setRejectSubmitting] = useState(false)

  const fetchVerifications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = {
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      const res = await adminApi.getVerifications(params)
      if (res.data) {
        setVerifications(res.data)
      }
      if (res.pagination) {
        setPagination(res.pagination)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load verifications.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, pagination.page, pagination.limit])

  useEffect(() => {
    fetchVerifications()
  }, [fetchVerifications])

  const openDetail = async (id: number) => {
    setDetailLoading(true)
    setDetailError('')
    setActionMsg('')
    try {
      const res = await adminApi.getVerificationDetail(id)
      if (res.data) {
        setDetail(res.data)
      }
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load details.')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetail(null)
    setActionMsg('')
  }

  const handleApprove = async (id: number) => {
    setActionMsg('')
    try {
      await adminApi.approveVerification(id)
      setActionMsg('Farmer approved successfully!')
      // Refresh detail and list
      openDetail(id)
      fetchVerifications()
    } catch (err: unknown) {
      setActionMsg(err instanceof Error ? err.message : 'Failed to approve.')
    }
  }

  const handleReject = async () => {
    if (!detail || rejectReason.trim().length < 10) return
    setRejectSubmitting(true)
    try {
      await adminApi.rejectVerification(detail.farmer.id, rejectReason.trim())
      setActionMsg('Verification rejected.')
      setRejectModal(false)
      setRejectReason('')
      openDetail(detail.farmer.id)
      fetchVerifications()
    } catch (err: unknown) {
      setActionMsg(err instanceof Error ? err.message : 'Failed to reject.')
    } finally {
      setRejectSubmitting(false)
    }
  }

  if (loading && verifications.length === 0) {
    return <PageSpinner text="Loading verifications..." />
  }

  // ── Detail View ──
  if (detail) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <button
          onClick={closeDetail}
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to verifications
        </button>

        {detailError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {detailError}
          </div>
        )}

        {actionMsg && (
          <div
            className={`mb-4 rounded-md border p-3 text-sm ${
              actionMsg.includes('successfully') || actionMsg.includes('approved') || actionMsg.includes('rejected')
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {actionMsg}
          </div>
        )}

        {/* Farmer Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserIcon className="size-5 text-muted-foreground" />
              Farmer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <UserIcon className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{detail.farmer.name}</h3>
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="size-3.5" />
                    {detail.farmer.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="size-3.5" />
                    {detail.farmer.role}
                  </span>
                </div>
              </div>
              {statusBadge(detail.profile ? 'pending' : 'unverified')}
            </div>
          </CardContent>
        </Card>

        {/* Farm Profile */}
        {detail.profile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Farm Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Farm Name</dt>
                  <dd className="text-sm font-medium">{detail.profile.farm_name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Farm Size</dt>
                  <dd className="text-sm font-medium">{detail.profile.farm_size_hectares} hectares</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Address</dt>
                  <dd className="text-sm font-medium">
                    {detail.profile.farm_address}, {detail.profile.farm_city}, {detail.profile.farm_province}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Years Farming</dt>
                  <dd className="text-sm font-medium">{detail.profile.years_farming} years</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Crops Grown</dt>
                  <dd className="text-sm font-medium">{detail.profile.crops_grown}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">ID Type</dt>
                  <dd className="text-sm font-medium">{detail.profile.government_id_type}</dd>
                </div>
                {detail.profile.cooperative_name && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Cooperative</dt>
                    <dd className="text-sm font-medium">{detail.profile.cooperative_name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Submitted</dt>
                  <dd className="text-sm font-medium">
                    {new Date(detail.profile.submitted_at).toLocaleDateString('en-PH', {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Documents Gallery */}
        {detail.documents.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileImage className="size-5 text-muted-foreground" />
                Submitted Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {detail.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-md border border-border overflow-hidden"
                  >
                    <a
                      href={`/${doc.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="aspect-video bg-muted relative group">
                        {doc.mime_type?.startsWith('image/') ? (
                          <img
                            src={`/${doc.file_path}`}
                            alt={doc.file_name}
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground">
                            <FileImage className="size-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                          <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium flex items-center gap-1">
                            <FileImage className="size-4" />
                            View
                          </span>
                        </div>
                      </div>
                    </a>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{doc.file_name}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {doc.document_type.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {detail.profile && (
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleApprove(detail.farmer.id)}
            >
              <CheckCircle2 className="size-4" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => setRejectModal(true)}
            >
              <XCircle className="size-4" />
              Reject
            </Button>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
              <h3 className="text-lg font-semibold">Reject Verification</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Provide a reason for rejection (minimum 10 characters).
              </p>
              <div className="mt-4">
                <Input
                  label="Rejection Reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Blurry ID photo, please resubmit with a clearer image."
                />
                {rejectReason.trim().length > 0 && rejectReason.trim().length < 10 && (
                  <p className="text-xs text-destructive mt-1">
                    Reason must be at least 10 characters.
                  </p>
                )}
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectModal(false)
                    setRejectReason('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={rejectReason.trim().length < 10 || rejectSubmitting}
                  onClick={handleReject}
                >
                  {rejectSubmitting ? 'Rejecting...' : 'Confirm Reject'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── List View ──
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Farmer Verifications</h1>
        <p className="mt-1 text-muted-foreground">
          Review and manage farmer verification submissions.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value)
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            className={`relative rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.label}
            {tab.value === 'pending' && (
              <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800">
                {verifications.filter((v) => v.verification_status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {verifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
              <Search className="size-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">No verifications found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusFilter === 'all'
                ? 'No farmers have submitted verifications yet.'
                : `No ${statusFilter} verifications at the moment.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Farm</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Province</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Submitted</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {verifications.map((v) => (
                <tr
                  key={v.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => openDetail(v.id)}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{v.name}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {v.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {v.farm_name || '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {v.farm_province || '\u2014'}
                  </td>
                  <td className="px-4 py-3">
                    {statusBadge(v.verification_status)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {v.submitted_at
                      ? new Date(v.submitted_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
                      : '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm">
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
