import { useState, useCallback, useRef } from 'react'

/**
 * Validation rule for a single field.
 * Returns an error string if invalid, or `undefined` if valid.
 */
type ValidationRule<T, K extends keyof T> = (
  value: T[K],
  form: T,
) => string | undefined

/**
 * Map of field keys to their validation rules.
 */
type ValidationRules<T extends Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T, K>
}

/** @internal */
type RulesRef<T extends Record<string, unknown>> = ValidationRules<T> | null

/**
 * Return type of the `useForm` hook.
 */
interface UseFormReturn<T extends Record<string, unknown>> {
  /** Current form values. */
  form: T
  /** Map of field keys to error messages. */
  errors: Record<string, string>
  /** Update a single field value and clear its error. */
  setField: (field: keyof T, value: T[keyof T]) => void
  /** Update multiple fields at once and clear their errors. */
  setFields: (fields: Partial<T>) => void
  /** Replace the entire form state. */
  setForm: (form: T) => void
  /** Run all validation rules. Returns `true` if the form passes. */
  validate: (rules: ValidationRules<T>) => boolean
  /** Validate a single field (useful for onBlur). Requires rules to have been passed to validate() first. */
  validateField: (rules: ValidationRules<T>, field: keyof T) => string | undefined
  /** Clear all validation errors. */
  clearErrors: () => void
  /** Clear the error for a single field. */
  clearFieldError: (field: keyof T) => void
  /** Reset form to its initial values (or provided defaults) and clear all errors. */
  resetForm: (defaults?: T) => void
}

/**
 * A reusable form state and validation hook.
 *
 * Features:
 * - Generic typed form state
 * - Per-field error tracking
 * - Auto-clears field error on change
 * - Supports string and boolean fields
 * - Bulk field updates
 * - Form reset to initial or custom defaults
 *
 * @example
 * ```ts
 * const { form, errors, setField, validate } = useForm({
 *   name: '',
 *   email: '',
 *   password: '',
 * })
 *
 * const handleSubmit = () => {
 *   if (!validate({
 *     name: (v) => !v ? 'Name is required' : undefined,
 *     email: (v) => !/\S+@\S+\.\S+/.test(v) ? 'Invalid email' : undefined,
 *   })) return
 *   // submit form…
 * }
 * ```
 */
export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
): UseFormReturn<T> {
  const [form, setFormState] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const rulesRef = useRef<RulesRef>(null)

  // Keep a ref of initial values so resetForm can restore them
  const initialRef = useRef<T>(initialValues)

  /** Update a single field and clear its error. */
  const setField = useCallback((field: keyof T, value: T[keyof T]) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field if it exists
    setErrors((prev) => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field as string]
      return next
    })
  }, [])

  /** Update multiple fields at once and clear their errors. */
  const setFields = useCallback((fields: Partial<T>) => {
    setFormState((prev) => ({ ...prev, ...fields }))
    // Clear errors for all updated fields
    setErrors((prev) => {
      const keys = Object.keys(fields)
      const hasAny = keys.some((k) => k in prev)
      if (!hasAny) return prev
      const next = { ...prev }
      for (const key of keys) {
        delete next[key]
      }
      return next
    })
  }, [])

  /** Replace the entire form state and clear all errors. */
  const setForm = useCallback((newForm: T) => {
    setFormState(newForm)
    setErrors({})
  }, [])

  /**
   * Validate a single field against the given rules.
   * Returns the error string if invalid, or undefined if valid.
   */
  const validateField = useCallback(
    (rules: ValidationRules<T>, field: keyof T): string | undefined => {
      const rule = rules[field]
      if (!rule) return undefined
      const error = rule(form[field], form)
      setErrors((prev) => {
        const next = { ...prev }
        if (error !== undefined) {
          next[field as string] = error
        } else {
          delete next[field as string]
        }
        return next
      })
      return error
    },
    [form]
  )

  /**
   * Run all validation rules.
   * Returns `true` if all rules pass (no errors).
   */
  const validate = useCallback((rules: ValidationRules<T>): boolean => {
    const errs: Record<string, string> = {}

    for (const field of Object.keys(rules) as Array<keyof T>) {
      const rule = rules[field]
      if (rule) {
        const error = rule(form[field], form)
        if (error !== undefined) {
          errs[field as string] = error
        }
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [form])

  /** Clear all validation errors. */
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  /** Clear the error for a single field. */
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field as string]
      return next
    })
  }, [])

  /**
   * Reset form to its initial values (or provided defaults) and clear all errors.
   */
  const resetForm = useCallback((defaults?: T) => {
    setFormState(defaults ?? initialRef.current)
    setErrors({})
  }, [])

  return {
    form,
    errors,
    setField,
    setFields,
    setForm,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    resetForm,
  }
}
