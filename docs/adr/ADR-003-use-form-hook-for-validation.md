# ADR-003: Custom `useForm` Hook for Form State and Validation

**Status**: Accepted
**Date**: 2026-06-01
**Driver**: Every form page duplicated `Record<string, string>` validation state, `validate()` functions, and manual error-clearing logic.

## Context

Eight form pages (Login, Register, Profile, Checkout, PostJob, NewInventoryItem, FarmerVerification, AdminUsers modals) each maintained:
- A `validation` state variable typed `Record<string, string>`
- A `validate()` function that built an errors object, set state, and returned a boolean
- In several cases, a separate `updateField()` function that cleared individual field errors on change
- Inline `setValidation` manipulation scattered through onChange handlers

## Decision

Create a reusable `useForm<T>()` hook in `src/hooks/useForm.ts`:

```typescript
const { form, errors, setField, validate, resetForm } = useForm({
  name: '',
  email: '',
  password: '',
})

validate({
  name: (v) => !v ? 'Name is required' : undefined,
  email: (v) => !/\S+@\S+\.\S+/.test(v) ? 'Invalid email' : undefined,
})
```

Key features:
- Generic type parameter infers form shape from initial values
- `setField` auto-clears the corresponding field error
- `validate` accepts typed rules and returns boolean
- Supports `string` and `boolean` field types
- `resetForm` restores initial values and clears errors
- Bundle impact: 0.90 kB (0.42 kB gzip)

## Consequences

- ✅ **Eliminated duplication** — ~400 lines of repeated validation logic removed across 8+ pages
- ✅ **Type safety** — Field keys and values are checked at compile time
- ✅ **Auto-clear behavior** — Consistent across all forms (some pages had it, some didn't)
- ⚠️ **Existing page patterns** — Pages using raw `useState` for forms still exist; migration is opt-in

## Compliance

- New form pages should default to `useForm` from `@/hooks/useForm`
- Exceptions only if the form has unusual requirements (multi-step wizards, conditional fields)
- `src/hooks/useForm.ts` is the single source of truth for form state management
