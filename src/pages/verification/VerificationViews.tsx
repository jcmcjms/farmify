import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileImage,
} from 'lucide-react'
import type { VerificationStatus } from '@/types'

interface StatusViewProps {
  status: VerificationStatus | null
}

export function VerifiedView({ status }: StatusViewProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-800">You are verified!</h1>
          <p className="mt-2 text-green-700">
            You can now sell products and post jobs on Farmify.
          </p>
        </CardContent>
      </Card>

      {status?.profile && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Your Farm Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Farm Name</dt>
                <dd className="text-sm font-medium">{status.profile.farm_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Address</dt>
                <dd className="text-sm font-medium">
                  {status.profile.farm_address}, {status.profile.farm_city}, {status.profile.farm_province}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Farm Size</dt>
                <dd className="text-sm font-medium">{status.profile.farm_size_hectares} hectares</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Years Farming</dt>
                <dd className="text-sm font-medium">{status.profile.years_farming} years</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Crops Grown</dt>
                <dd className="text-sm font-medium">{status.profile.crops_grown}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">ID Type</dt>
                <dd className="text-sm font-medium">{status.profile.government_id_type}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 text-center">
        <Link to="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

export function PendingView({ status }: StatusViewProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100">
            <Clock className="size-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-amber-800">Your verification is being reviewed</h1>
          <p className="mt-2 text-amber-700 max-w-md mx-auto">
            Your documents are being reviewed by our team. This usually takes 1-3 business
            days. You will be able to start selling once approved.
          </p>
        </CardContent>
      </Card>

      {status?.profile && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Submitted Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Farm Name</dt>
                <dd className="text-sm font-medium">{status.profile.farm_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Address</dt>
                <dd className="text-sm font-medium">
                  {status.profile.farm_address}, {status.profile.farm_city}, {status.profile.farm_province}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Farm Size</dt>
                <dd className="text-sm font-medium">{status.profile.farm_size_hectares} hectares</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Years Farming</dt>
                <dd className="text-sm font-medium">{status.profile.years_farming} years</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Crops Grown</dt>
                <dd className="text-sm font-medium">{status.profile.crops_grown}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {status?.documents && status.documents.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Submitted Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {status.documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 text-sm">
                  <FileImage className="size-4 text-muted-foreground shrink-0" />
                  <span className="flex-1">{doc.file_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {doc.document_type.replace(/_/g, ' ')}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 text-center">
        <Link to="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

interface RejectedViewProps extends StatusViewProps {
  onStartForm: () => void
}

export function RejectedView({ status, onStartForm }: RejectedViewProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="size-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-800">Your verification was not approved</h1>
          {status?.profile?.verification_notes && (
            <div className="mt-4 rounded-md bg-red-100/50 p-4 text-left text-sm text-red-700">
              <p className="font-medium">Reason:</p>
              <p className="mt-1">{status.profile.verification_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {status?.profile && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Previously Submitted Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Farm Name</dt>
                <dd className="text-sm font-medium">{status.profile.farm_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Address</dt>
                <dd className="text-sm font-medium">
                  {status.profile.farm_address}, {status.profile.farm_city}, {status.profile.farm_province}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Farm Size</dt>
                <dd className="text-sm font-medium">{status.profile.farm_size_hectares} hectares</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Years Farming</dt>
                <dd className="text-sm font-medium">{status.profile.years_farming} years</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 text-center">
        <Button onClick={onStartForm}>
          Submit Again
        </Button>
      </div>
    </div>
  )
}
