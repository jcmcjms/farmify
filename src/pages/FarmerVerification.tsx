import { useState, useEffect, useCallback } from 'react'
import { authApi } from '@/lib/api'
import { PageSpinner } from '@/components/ui/spinner'
import type { VerificationStatus } from '@/types'
import { VerifiedView, PendingView, RejectedView } from './verification/VerificationViews'
import { VerificationForm } from './verification/VerificationForm'

/**
 * Farmer verification page showing status and submission form.
 */
export default function FarmerVerification() {
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const fetchVerification = useCallback(async () => {
    try {
      const res = await authApi.getVerification()
      if (res.data) {
        setStatus(res.data)
      }
    } catch {
      // No verification data yet — still unverified
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVerification()
  }, [fetchVerification])

  const handleSuccess = useCallback((newStatus: VerificationStatus) => {
    setStatus(newStatus)
    setShowForm(false)
  }, [])

  // ── Loading ──
  if (loading) return <PageSpinner text="Loading verification..." />

  const currentStatus = status?.status || 'unverified'

  // ── Already Verified ──
  if (currentStatus === 'verified') {
    return <VerifiedView status={status} />
  }

  // ── Pending ──
  if (currentStatus === 'pending') {
    return <PendingView status={status} />
  }

  // ── Rejected (not showing form yet) ──
  if (currentStatus === 'rejected' && !showForm) {
    return <RejectedView status={status} onStartForm={() => setShowForm(true)} />
  }

  // ── Unverified or Rejected + Show Form ──
  const isFormView = currentStatus === 'unverified' || showForm
  if (!isFormView) return null

  return (
    <VerificationForm
      status={status}
      onSuccess={handleSuccess}
      onBack={() => setShowForm(false)}
    />
  )
}
