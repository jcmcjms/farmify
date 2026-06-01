export const GOVERNMENT_ID_OPTIONS = [
  { value: 'PhilSys', label: 'PhilSys (National ID)' },
  { value: "Driver's License", label: "Driver's License" },
  { value: 'Passport', label: 'Passport' },
  { value: 'UMID', label: 'UMID' },
  { value: "Voter's ID", label: "Voter's ID" },
  { value: 'Other', label: 'Other' },
]

export const FILE_ACCEPT = 'image/jpeg,image/png,image/webp'
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_FARM_PHOTOS = 3

export const initialFormState = {
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
