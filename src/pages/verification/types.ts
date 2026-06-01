export interface FileWithPreview {
  file: File
  preview: string
  error?: string | null
}

export interface FormDataState extends Record<string, unknown> {
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

export interface FormErrors {
  [key: string]: string
}
