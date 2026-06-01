# ADR-001: Domain-Split API Modules

**Status**: Accepted
**Date**: 2026-06-01
**Driver**: Monolithic 328-line `src/lib/api.ts` file was difficult to navigate, maintain, and tree-shake.

## Context

The entire API layer lived in a single file (`src/lib/api.ts`) at 328 lines. All API calls — auth, products, cart, orders, jobs, inventory, dashboard, admin — were grouped into plain objects within that file. Adding a new endpoint required scrolling through hundreds of lines, and the file imported every type from `@/types` regardless of which domain actually used it.

## Decision

Split `src/lib/api.ts` into a directory of domain-specific modules:

```
src/lib/api/
  client.ts       — shared `request<T>()` fetch wrapper + `getToken()`
  auth.ts         — authApi (login, register, getMe, verification)
  products.ts     — productsApi (CRUD, paginated list)
  cart.ts         — cartApi (get, add, update, remove, clear)
  orders.ts       — ordersApi (CRUD, status updates)
  jobs.ts         — jobsApi (CRUD, apply, applications)
  inventory.ts    — inventoryApi (CRUD, transactions)
  dashboard.ts    — dashboardApi (stats)
  admin.ts        — adminApi (users, roles, verifications)
  index.ts        — barrel re-export of all modules
```

The original `src/lib/api.ts` was converted to a lightweight re-export barrel pointing to the new modules, ensuring zero import breakage across the 20+ files that import from `@/lib/api`.

## Consequences

- ✅ **Discoverability** — Each domain has its own file; finding the right endpoint is instant
- ✅ **Tree-shaking** — Bundlers can now eliminate unused API modules from client chunks
- ✅ **Maintainability** — Adding an endpoint only touches one domain file
- ✅ **Backward compatible** — All existing imports continue to work
- ⚠️ **More files** — 1 file became 10, but each is small and focused

## Compliance

- All new API endpoints must be added to the appropriate domain file in `src/lib/api/`
- Shared request logic (headers, auth, 401 handling) belongs in `client.ts`
