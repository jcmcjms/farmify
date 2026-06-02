import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useForm } from '@/hooks/useForm'

describe('useForm', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useForm({ name: '', email: '' }))
    expect(result.current.form).toEqual({ name: '', email: '' })
    expect(result.current.errors).toEqual({})
  })

  it('setField updates individual field', () => {
    const { result } = renderHook(() => useForm({ name: '', email: '' }))

    act(() => {
      result.current.setField('name', 'John')
    })

    expect(result.current.form.name).toBe('John')
    expect(result.current.form.email).toBe('')
  })

  it('validate returns true when all rules pass', () => {
    const { result } = renderHook(() => useForm({ name: 'John', email: 'john@test.com' }))
    const rules = {
      name: (v: string) => (v.length < 2 ? 'Too short' : undefined),
      email: (v: string) => (!v.includes('@') ? 'Invalid email' : undefined),
    }

    let isValid = false
    act(() => {
      isValid = result.current.validate(rules)
    })

    expect(isValid).toBe(true)
    expect(result.current.errors).toEqual({})
  })

  it('validate returns false and sets errors when rules fail', () => {
    const { result } = renderHook(() => useForm({ name: 'J', email: 'invalid' }))
    const rules = {
      name: (v: string) => (v.length < 2 ? 'Too short' : undefined),
      email: (v: string) => (!v.includes('@') ? 'Invalid email' : undefined),
    }

    let isValid = true
    act(() => {
      isValid = result.current.validate(rules)
    })

    expect(isValid).toBe(false)
    expect(result.current.errors.name).toBe('Too short')
    expect(result.current.errors.email).toBe('Invalid email')
  })

  it('errors auto-clear when field is updated', () => {
    const { result } = renderHook(() => useForm({ name: 'J', email: 'test@test.com' }))
    const rules = {
      name: (v: string) => (v.length < 2 ? 'Too short' : undefined),
    }

    act(() => {
      result.current.validate(rules)
    })
    expect(result.current.errors.name).toBe('Too short')

    act(() => {
      result.current.setField('name', 'John')
    })
    expect(result.current.errors.name).toBeUndefined()
  })

  it('validateField validates a single field', () => {
    const { result } = renderHook(() => useForm({ name: 'J', email: 'test@test.com' }))
    const rules = {
      name: (v: string) => (v.length < 2 ? 'Too short' : undefined),
      email: (v: string) => (!v.includes('@') ? 'Invalid email' : undefined),
    }

    act(() => {
      result.current.validateField(rules, 'name')
    })

    expect(result.current.errors.name).toBe('Too short')
    expect(result.current.errors.email).toBeUndefined()
  })
})
