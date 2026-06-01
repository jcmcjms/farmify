# ADR-002: Shared UI Component Library for Duplicated Patterns

**Status**: Accepted
**Date**: 2026-06-01
**Driver**: Pagination, empty state, error banner, and page header patterns were duplicated with near-identical markup across 6+ pages.

## Context

Every list page (Products, Orders, Jobs, Inventory, Cart) implemented its own pagination controls, empty state displays, and error banners with the exact same Tailwind classes copied and pasted. Adding a visual tweak meant touching 4-6 files. The 404 page's inline markup also duplicated the same patterns.

## Decision

Create reusable components in `src/components/shared/`:

| Component | Lines Saved | Used By |
|---|---|---|
| `Pagination` | ~15 lines × 4 pages | Products (full), Orders, Jobs, Inventory (simple) |
| `EmptyState` | ~12 lines × 5 pages | Products, Orders, Jobs, Inventory, Cart |
| `ErrorBanner` | ~8 lines × 6 pages | Products, Orders, Jobs, Inventory, Cart, Checkout |
| `PageHeader` | ~6 lines × 4 pages | Products, Orders, Jobs, Inventory |
| `ErrorBoundary` | Class-based React error catcher | App.tsx wrapping all Routes |

Each component accepts typed props and handles edge cases internally (e.g., Pagination returns null when `totalPages <= 1`).

## Consequences

- ✅ **Single source of truth** — Visual changes to pagination/empty/error patterns now happen in one place
- ✅ **Consistent UX** — All pages show identical error banners, empty states, and pagination
- ✅ **Smaller page files** — Pages dropped 30-50 lines each on average
- ⚠️ **New abstraction layer** — Developers must know about these components, but they're re-exported from a single barrel (`@/components/shared`)

## Compliance

- PR review checklist: "Is this a UI pattern that exists in 2+ pages? → extract to shared"
- All new list pages should import from `@/components/shared` rather than hand-rolling pagination/empty/error UI
