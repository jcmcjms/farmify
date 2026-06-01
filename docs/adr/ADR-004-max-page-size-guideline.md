# ADR-004: Maximum Page Size and Feature Folder Extraction

**Status**: Accepted
**Date**: 2026-06-01
**Driver**: `FarmerVerification.tsx` was 870 lines handling data fetching, status views, form state, file uploads, and sub-components in a single file.

## Context

The FarmerVerification page displayed 4 different UI states (verified, pending, rejected, form) plus managed complex form state with file uploads, validation, and preview management. At 870 lines, it was the largest file in the project and a maintenance hazard: any change risked collateral damage, and understanding the full flow required reading the entire file.

## Decision

Establish a guideline: **page components should not exceed ~200 lines**. When a page grows beyond this, extract related concerns into a **feature subdirectory**:

```
src/pages/verification/
  constants.ts           — File size limits, ID options, initial form state
  types.ts               — FileWithPreview, FormDataState, FormErrors
  FileUploadField.tsx    — Reusable file upload with preview and validation
  VerificationViews.tsx  — VerifiedView, PendingView, RejectedView components
  VerificationForm.tsx   — Full verification submission form (~480 lines, still large but focused)
```

The orchestrator (`FarmerVerification.tsx`) became a thin 69-line component that:
1. Fetches verification status
2. Routes to the correct view component based on status
3. Manages show/hide flags

## Consequences

- ✅ **Single responsibility** — Each file does one thing
- ✅ **Navigability** — Engineers can find and modify specific views without touching form logic
- ✅ **Reusability** — `FileUploadField` and `VerificationViews` can be reused elsewhere
- ⚠️ **More files** — 1 file became 6, but total lines dropped from 870 to 801 (net removal of duplicated code)
- ⚠️ **VerificationForm is still 480 lines** — Could be further split into sections (farm profile section, document upload section, review section) if it grows more

## Compliance

- CI lint rule (future): flag files over 400 lines for manual review
- When adding a new page, extract shared sub-components early rather than after reaching 800 lines
- Use feature folders under `src/pages/<page-name>/` for page-specific sub-components
