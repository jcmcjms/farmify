import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageSpinner } from '@/components/ui/spinner'
import type { VerificationStatus } from '@/types'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  X,
  FileImage,
  ArrowLeft,
  Save,
  Tractor,
  BadgeCheck,
  Image,
} from 'lucide-react'

const GOVERNMENT_ID_OPTIONS = [
  { value: 'PhilSys', label: 'PhilSys (National ID)' },
  { value: "Driver's License", label: "Driver's License" },
  { value: 'Passport', label: 'Passport' },
  { value: 'UMID', label: 'UMID' },
  { value: "Voter's ID", label: "Voter's ID" },
  { value: 'Other', label: 'Other' },
]

const FILE_ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FARM_PHOTOS = 3

interface FileWithPreview {
  file: File
  preview: string
  error?: string | null
}

interface FormDataState {
  farm_name: string
  farm_address: string
  farm_city: string
  farm_province: string
  farm_size_hectares: string
  years_farming: string
  crops_grown: string
  cooperative_name: string
  government_id_type: string
}

interface FormErrors {
  [key: string]: string
}

const initialFormState: FormDataState = {
  farm_name: '',
  farm_address: '',
  farm_city: '',
  farm_province: '',
  farm_size_hectares: '',
  years_farming: '',
  crops_grown: '',
  cooperative_name: '',
  government_id_type: '',
}

/**
 * Farmer verification page showing status and submission form.
 */
export default function FarmerVerification() {
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Form state
  const [form, setForm] = useState<FormDataState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})

  // File states
  const [governmentId, setGovernmentId] = useState<FileWithPreview | null>(null)
  const [barangayCertificate, setBarangayCertificate] = useState<FileWithPreview | null>(null)
  const [farmPhotos, setFarmPhotos] = useState<FileWithPreview[]>([])
  const [selfieWithId, setSelfieWithId] = useState<FileWithPreview | null>(null)

  // Refs for file inputs
  const govIdRef = useRef<HTMLInputElement>(null)
  const barangayRef = useRef<HTMLInputElement>(null)
  const farmPhotosRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  const fetchVerification = useCallback(async () => {
    try {
      const res = await authApi.getVerification()
      if (res.data) {
        setStatus(res.data)

        // Pre-fill form if rejected (for resubmission)
        if (res.data.profile && res.data.status === 'rejected') {
          const p = res.data.profile
          setForm({
            farm_name: p.farm_name || '',
            farm_address: p.farm_address || '',
            farm_city: p.farm_city || '',
            farm_province: p.farm_province || '',
            farm_size_hectares: p.farm_size_hectares?.toString() || '',
            years_farming: p.years_farming?.toString() || '',
            crops_grown: p.crops_grown || '',
            cooperative_name: p.cooperative_name || '',
            government_id_type: p.government_id_type || '',
          })
        }
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

  // Cleanup file previews on unmount
  useEffect(() => {
    return () => {
      if (governmentId) URL.revokeObjectURL(governmentId.preview)
      if (barangayCertificate) URL.revokeObjectURL(barangayCertificate.preview)
      if (selfieWithId) URL.revokeObjectURL(selfieWithId.preview)
      farmPhotos.forEach((fp) => URL.revokeObjectURL(fp.preview))
    }
  }, [governmentId, barangayCertificate, selfieWithId, farmPhotos])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const validateFile = (file: File): string | null => {
    if (!FILE_ACCEPT.includes(file.type)) {
      return 'Only JPG, PNG, and WebP images are accepted.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File must be under 5MB.'
    }
    return null
  }

  const handleFileSelect = (
    fileList: FileList | null,
    setter: (fwp: FileWithPreview | null) => void,
    current: FileWithPreview | null
  ) => {
    if (!fileList || fileList.length === 0) return
    const file = fileList[0]
    const error = validateFile(file)
    if (current) URL.revokeObjectURL(current.preview)
    setter({ file, preview: URL.createObjectURL(file), error })
  }

  const handleFarmPhotosSelect = (fileList: FileList | null) => {
    if (!fileList) return
    const newFiles: FileWithPreview[] = []
    const remaining = MAX_FARM_PHOTOS - farmPhotos.length

    for (let i = 0; i < Math.min(fileList.length, remaining); i++) {
      const file = fileList[i]
      const error = validateFile(file)
      newFiles.push({ file, preview: URL.createObjectURL(file), error })
    }

    setFarmPhotos((prev) => [...prev, ...newFiles].slice(0, MAX_FARM_PHOTOS))
  }

  const removeFarmPhoto = (index: number) => {
    setFarmPhotos((prev) => {
      const fp = prev[index]
      if (fp) URL.revokeObjectURL(fp.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!form.farm_name.trim()) newErrors.farm_name = 'Farm name is required'
    if (!form.farm_address.trim()) newErrors.farm_address = 'Farm address is required'
    if (!form.farm_city.trim()) newErrors.farm_city = 'City/Municipality is required'
    if (!form.farm_province.trim()) newErrors.farm_province = 'Province is required'

    const hectares = parseFloat(form.farm_size_hectares)
    if (!form.farm_size_hectares || isNaN(hectares) || hectares <= 0) {
      newErrors.farm_size_hectares = 'Enter a valid farm size'
    }

    const years = parseInt(form.years_farming)
    if (!form.years_farming || isNaN(years) || years < 0) {
      newErrors.years_farming = 'Enter valid years of farming experience'
    }

    if (!form.crops_grown.trim()) newErrors.crops_grown = 'Crops grown is required'
    if (!form.government_id_type) newErrors.government_id_type = 'Select your ID type'

    if (!governmentId || governmentId.error) {
      newErrors.government_id = 'Government ID is required'
    }
    if (!barangayCertificate || barangayCertificate.error) {
      newErrors.barangay_certificate = 'Barangay Certificate is required'
    }
    if (farmPhotos.length === 0) {
      newErrors.farm_photos = 'At least 1 farm photo is required'
    }
    if (!selfieWithId || selfieWithId.error) {
      newErrors.selfie_with_id = 'Selfie with ID is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildFormData = (): FormData => {
    const fd = new FormData()
    fd.append('farm_name', form.farm_name)
    fd.append('farm_address', form.farm_address)
    fd.append('farm_city', form.farm_city)
    fd.append('farm_province', form.farm_province)
    fd.append('farm_size_hectares', form.farm_size_hectares)
    fd.append('years_farming', form.years_farming)
    fd.append('crops_grown', form.crops_grown)
    fd.append('government_id_type', form.government_id_type)
    if (form.cooperative_name.trim()) {
      fd.append('cooperative_name', form.cooperative_name.trim())
    }
    if (governmentId) fd.append('government_id', governmentId.file)
    if (barangayCertificate) fd.append('barangay_certificate', barangayCertificate.file)
    farmPhotos.forEach((fp) => fd.append('farm_photos', fp.file))
    if (selfieWithId) fd.append('selfie_with_id', selfieWithId.file)
    return fd
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    setSuccessMessage('')

    if (!validateForm()) return

    setSubmitting(true)
    try {
      const formData = buildFormData()
      const isResubmit = status?.status === 'rejected'
      const res = isResubmit
        ? await authApi.resubmitVerification(formData)
        : await authApi.submitVerification(formData)

      if (res.data) {
        setStatus(res.data)
        setShowForm(false)
        setSuccessMessage('Your verification has been submitted successfully!')
        // Reset file states
        setGovernmentId(null)
        setBarangayCertificate(null)
        setFarmPhotos([])
        setSelfieWithId(null)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed. Please try again.'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──
  if (loading) return <PageSpinner text="Loading verification..." />

  const currentStatus = status?.status || 'unverified'

  // ── Already Verified ──
  if (currentStatus === 'verified') {
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

  // ── Pending ──
  if (currentStatus === 'pending') {
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

  // ── Rejected (not showing form yet) ──
  if (currentStatus === 'rejected' && !showForm) {
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
          <Button onClick={() => setShowForm(true)}>
            Submit Again
          </Button>
        </div>
      </div>
    )
  }

  // ── Unverified or Rejected + Show Form ──
  const isFormView = currentStatus === 'unverified' || showForm
  if (!isFormView) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Farmer Verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your profile and upload the required documents to become a verified farmer.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {submitError && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Farm Profile */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tractor className="size-5 text-muted-foreground" />
              Farm Profile
            </CardTitle>
            <CardDescription>Tell us about your farm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Farm Name"
                name="farm_name"
                value={form.farm_name}
                onChange={handleInputChange}
                error={errors.farm_name}
                placeholder="e.g. Juan's Rice Farm"
                required
              />
              <Input
                label="Farm Size (Hectares)"
                name="farm_size_hectares"
                type="number"
                step="0.01"
                min="0"
                value={form.farm_size_hectares}
                onChange={handleInputChange}
                error={errors.farm_size_hectares}
                placeholder="e.g. 2.5"
                required
              />
            </div>

            <Input
              label="Farm Address"
              name="farm_address"
              value={form.farm_address}
              onChange={handleInputChange}
              error={errors.farm_address}
              placeholder="e.g. Barangay San Jose, Lot 123"
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="City/Municipality"
                name="farm_city"
                value={form.farm_city}
                onChange={handleInputChange}
                error={errors.farm_city}
                placeholder="e.g. San Jose"
                required
              />
              <Input
                label="Province"
                name="farm_province"
                value={form.farm_province}
                onChange={handleInputChange}
                error={errors.farm_province}
                placeholder="e.g. Batangas"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Years Farming"
                name="years_farming"
                type="number"
                min="0"
                value={form.years_farming}
                onChange={handleInputChange}
                error={errors.years_farming}
                placeholder="e.g. 5"
                required
              />
              <Select
                label="Government ID Type"
                name="government_id_type"
                value={form.government_id_type}
                onChange={handleInputChange}
                options={GOVERNMENT_ID_OPTIONS}
                placeholder="Select ID type"
                error={errors.government_id_type}
              />
            </div>

            <Textarea
              label="Crops Grown"
              name="crops_grown"
              value={form.crops_grown}
              onChange={handleInputChange}
              error={errors.crops_grown}
              placeholder="e.g. Rice, Corn, Vegetables, Fruits"
              required
            />

            <Input
              label="Cooperative Name (Optional)"
              name="cooperative_name"
              value={form.cooperative_name}
              onChange={handleInputChange}
              placeholder="e.g. Samahang Magsasaka ng San Jose"
            />
          </CardContent>
        </Card>

        {/* Section 2: Upload Documents */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="size-5 text-muted-foreground" />
              Upload Documents
            </CardTitle>
            <CardDescription>
              Upload clear, readable photos of the following documents. Accepted formats: JPG, PNG, WebP. Max 5MB per file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Government ID */}
            <FileUploadField
              label="Government-issued ID"
              description="Upload a clear photo of your government-issued ID"
              accept={FILE_ACCEPT}
              error={errors.government_id}
              currentFile={governmentId}
              onSelect={(files) => handleFileSelect(files, setGovernmentId, governmentId)}
              onRemove={() => {
                if (governmentId) URL.revokeObjectURL(governmentId.preview)
                setGovernmentId(null)
                if (govIdRef.current) govIdRef.current.value = ''
                const next = { ...errors }
                delete next.government_id
                setErrors(next)
              }}
              inputRef={govIdRef}
            />

            {/* Barangay Certificate */}
            <FileUploadField
              label="Barangay Certificate"
              description="Upload your Barangay Certificate or Barangay Clearance"
              accept={FILE_ACCEPT}
              error={errors.barangay_certificate}
              currentFile={barangayCertificate}
              onSelect={(files) => handleFileSelect(files, setBarangayCertificate, barangayCertificate)}
              onRemove={() => {
                if (barangayCertificate) URL.revokeObjectURL(barangayCertificate.preview)
                setBarangayCertificate(null)
                if (barangayRef.current) barangayRef.current.value = ''
                const next = { ...errors }
                delete next.barangay_certificate
                setErrors(next)
              }}
              inputRef={barangayRef}
            />

            {/* Farm Photos */}
            <div>
              <label className="text-sm font-medium text-foreground">Farm Photos ({farmPhotos.length}/{MAX_FARM_PHOTOS})</label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">Upload photos of your farm. At least 1 required.</p>
              {errors.farm_photos && (
                <p className="text-xs text-destructive mb-2">{errors.farm_photos}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {farmPhotos.map((fp, index) => (
                  <div key={index} className="relative size-24 rounded-md border border-border overflow-hidden group">
                    <img
                      src={fp.preview}
                      alt={`Farm photo ${index + 1}`}
                      className="size-full object-cover"
                    />
                    {fp.error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-1">
                        <p className="text-[10px] text-white text-center leading-tight">{fp.error}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFarmPhoto(index)}
                      className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                {farmPhotos.length < MAX_FARM_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => farmPhotosRef.current?.click()}
                    className="flex size-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <Image className="size-6" />
                    <span className="mt-1 text-[10px]">Add Photo</span>
                  </button>
                )}
              </div>
              <input
                ref={farmPhotosRef}
                type="file"
                accept={FILE_ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => handleFarmPhotosSelect(e.target.files)}
              />
            </div>

            {/* Selfie with ID */}
            <FileUploadField
              label="Selfie with ID"
              description="Take a selfie holding your ID next to your face"
              accept={FILE_ACCEPT}
              error={errors.selfie_with_id}
              currentFile={selfieWithId}
              onSelect={(files) => handleFileSelect(files, setSelfieWithId, selfieWithId)}
              onRemove={() => {
                if (selfieWithId) URL.revokeObjectURL(selfieWithId.preview)
                setSelfieWithId(null)
                if (selfieRef.current) selfieRef.current.value = ''
                const next = { ...errors }
                delete next.selfie_with_id
                setErrors(next)
              }}
              inputRef={selfieRef}
            />
          </CardContent>
        </Card>

        {/* Section 3: Submit */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BadgeCheck className="size-5 text-muted-foreground" />
              Review & Submit
            </CardTitle>
            <CardDescription>
              Please review your information before submitting. You will not be able to edit after submission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-muted p-4 text-sm space-y-1">
              <p><span className="font-medium">Farm:</span> {form.farm_name || '(not set)'}</p>
              <p><span className="font-medium">Location:</span> {form.farm_city || '(not set)'}, {form.farm_province || '(not set)'}</p>
              <p><span className="font-medium">Size:</span> {form.farm_size_hectares || '0'} hectares</p>
              <p><span className="font-medium">Documents:</span> {
                [governmentId && 'Government ID', barangayCertificate && 'Barangay Certificate', farmPhotos.length > 0 && `${farmPhotos.length} Farm Photo(s)`, selfieWithId && 'Selfie with ID']
                  .filter(Boolean)
                  .join(', ') || 'None'
              }</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          {currentStatus === 'rejected' && (
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
          <Button type="submit" disabled={submitting} className="ml-auto">
            <Save className="size-4" />
            {submitting ? 'Submitting...' : 'Submit Verification'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ── File Upload Field Sub-component ──

interface FileUploadFieldProps {
  label: string
  description: string
  accept: string
  error?: string
  currentFile: FileWithPreview | null
  onSelect: (files: FileList | null) => void
  onRemove: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

function FileUploadField({
  label,
  description,
  accept,
  error,
  currentFile,
  onSelect,
  onRemove,
  inputRef,
}: FileUploadFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <p className="text-xs text-muted-foreground mt-0.5 mb-2">{description}</p>
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      {currentFile ? (
        <div className="flex items-center gap-3 rounded-md border border-border p-3">
          <div className="size-14 shrink-0 overflow-hidden rounded-md border border-border">
            <img
              src={currentFile.preview}
              alt={currentFile.file.name}
              className="size-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentFile.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(currentFile.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            {currentFile.error && (
              <p className="text-xs text-destructive mt-0.5">{currentFile.error}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-dashed border-border py-6 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          <Upload className="size-6" />
          <span className="text-sm font-medium">Click to upload</span>
          <span className="text-xs">{accept}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onSelect(e.target.files)}
      />
    </div>
  )
}
