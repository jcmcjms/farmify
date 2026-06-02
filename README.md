# Farmify — Agricultural Marketplace Platform

> A full-stack marketplace connecting farmers and buyers. Farmers list products, post jobs, manage inventory, and get verified. Buyers browse the marketplace, add items to cart, checkout, and track orders. Administrators manage users, roles, and verifications.

<div align="center">

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens)](https://jwt.io)

</div>

---

## Features

- **Marketplace** — Browse, search, and filter farm products with organic badges and paginated listings.
- **Shopping Cart** — Add and remove items, update quantities, sync state with the backend API.
- **Order Management** — Place orders and track them through pending, confirmed, shipped, and delivered statuses.
- **Jobs Board** — Farmers post agricultural jobs; buyers browse, filter, and apply.
- **Inventory Management** — Track farm supplies with quantities, minimum thresholds, and in/out/adjustment transactions.
- **Farmer Verification** — Multi-step verification flow with profile submission, document upload, and admin review.
- **Admin Panel** — Manage users, assign roles, review verification requests, and monitor platform activity.
- **User Dashboard** — Personalized stats dashboard with recent orders, activity, and role-specific data.
- **Role-Based Access Control** — Three roles (farmer, buyer, admin) with protected routes and guarded API endpoints.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 with TypeScript 6.0 (strict mode) |
| **Build Tool** | Vite 8 |
| **Routing** | React Router v7 (lazy-loaded routes) |
| **Styling** | Tailwind CSS v4 via `@tailwindcss/vite` plugin |
| **UI Components** | shadcn/ui (base-maia preset) — Button, Input, Select, Badge, Card, Tabs, Dialog, DropdownMenu, Checkbox, Label, Tooltip on Radix UI primitives |
| **Icons** | Hugeicons (`@hugeicons/core-free-icons` + `@hugeicons/react`) via shadcn maia preset |
| **Utilities** | class-variance-authority, tailwind-merge, clsx |
| **State Management** | React Context for auth + cart; `useForm` hook for form state |
| **Testing** | Vitest + React Testing Library + jsdom |
| **Formatting** | Prettier + Husky pre-commit hooks with lint-staged |
| **Error Tracking** | Sentry (`@sentry/react` for frontend, `@sentry/node` for backend) |
| **Backend** | Express (REST API, port 5000) |
| **Database** | PostgreSQL with raw SQL queries |
| **Validation** | Zod (backend) + custom `useForm` hook (frontend) |
| **Authentication** | JWT (bcryptjs for password hashing), helmet security headers, rate limiting |
| **File Uploads** | Multer (verification documents) |
| **Docker** | Multi-stage Dockerfile (nginx for frontend) + Docker Compose (frontend, backend, PostgreSQL) |
| **CI/CD** | GitHub Actions — lint, type-check, and build on push/PR to main |

---

## Architecture

### Frontend Structure

```
src/
├── App.tsx                       # Root component with all routes
├── main.tsx                      # Entry point
├── index.css                     # Tailwind + global styles
├── types/index.ts                # Shared TypeScript interfaces
│
├── lib/
│   ├── api.ts                    # Barrel re-export (backward-compatible)
│   ├── api/
│   │   ├── client.ts             # Base fetch wrapper (JWT auth, 401 handling, FormData)
│   │   ├── auth.ts               # Login, register, getProfile, updateProfile
│   │   ├── products.ts           # Product CRUD, search, filter
│   │   ├── cart.ts               # Cart get, add, update, remove
│   │   ├── orders.ts             # Order CRUD, status updates
│   │   ├── jobs.ts               # Job CRUD, apply, manage applications
│   │   ├── inventory.ts          # Inventory CRUD, transactions
│   │   ├── dashboard.ts          # Stats, recent orders
│   │   ├── admin.ts              # User/role management
│   │   └── index.ts              # Barrel export
│   └── utils.ts                  # Utility functions
│
├── hooks/
│   ├── useAuth.ts                # Auth context hook
│   ├── useForm.ts                # Typed form state + validation hook
│   └── useFetchData.ts           # Safe data fetching hook
│
├── context/
│   ├── AuthContext.tsx            # Auth provider (user, login/logout, tokens)
│   └── CartContext.tsx            # Cart provider (state, sync with API)
│
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── shared/                   # Pagination, EmptyState, ErrorBanner, PageHeader, ErrorBoundary
│   └── layout/                   # Layout, Header, Footer, AdminLayout, AdminSidebar, ProtectedRoute
│
└── pages/
    ├── Landing.tsx               # Public landing page
    ├── Login.tsx                 # Login form
    ├── Register.tsx              # Registration with role selection
    ├── Profile.tsx               # User profile editing
    ├── Products.tsx              # Marketplace listing (search, filter, pagination)
    ├── ProductDetail.tsx         # Single product view
    ├── Cart.tsx                  # Shopping cart
    ├── Checkout.tsx              # Checkout flow
    ├── Orders.tsx                # Order history
    ├── OrderDetail.tsx           # Single order with items
    ├── Dashboard.tsx             # User dashboard with stats
    ├── Jobs.tsx                  # Job listings (search, filter, pagination)
    ├── JobDetail.tsx             # Single job with application
    ├── PostJob.tsx               # Job creation/editing
    ├── Inventory.tsx             # Farmer inventory management
    ├── InventoryDetail.tsx       # Inventory item + transactions
    ├── NewInventoryItem.tsx      # New inventory form
    ├── FarmerVerification.tsx    # Verification flow orchestrator
    ├── verification/             # Verification sub-components
    └── admin/                    # AdminDashboard, AdminUsers, AdminRoles, AdminVerifications
```

### Backend Structure

```
backend/
├── src/
│   ├── server.ts                 # Express app setup (CORS, routes, error handler)
│   ├── config/database.ts        # PostgreSQL pool configuration
│   ├── db/
│   │   ├── init.ts               # Database initialization script
│   │   ├── schema.sql            # Full database schema
│   │   └── seed.ts               # Seed data script
│   ├── middleware/
│   │   ├── auth.ts               # JWT authentication middleware
│   │   └── errorHandler.ts       # Global error handler
│   ├── models/                   # Database query functions per domain
│   ├── controllers/              # Route handler controllers
│   ├── routes/                   # Express route definitions
│   └── types/                    # Backend TypeScript types
```

### Route Map

All pages are **lazy-loaded** via React.lazy and Suspense for code splitting. Protected routes use a `ProtectedRoute` wrapper with optional role-based gating.

| Route | Auth Required | Role |
|-------|:---:|:----:|
| `/` | — | Public |
| `/login` | — | Public |
| `/register` | — | Public |
| `/marketplace` | — | Public |
| `/products/:id` | — | Public |
| `/jobs` | — | Public |
| `/jobs/:id` | — | Public |
| `/jobs/new` | Yes | Farmer |
| `/jobs/:id/edit` | Yes | Farmer |
| `/dashboard` | Yes | Any |
| `/cart` | Yes | Any |
| `/checkout` | Yes | Any |
| `/orders` | Yes | Any |
| `/orders/:id` | Yes | Any |
| `/profile` | Yes | Any |
| `/inventory` | Yes | Farmer |
| `/inventory/new` | Yes | Farmer |
| `/inventory/:id` | Yes | Farmer |
| `/verification` | Yes | Farmer |
| `/admin` | Yes | Admin |
| `/admin/users` | Yes | Admin |
| `/admin/roles` | Yes | Admin |
| `/admin/verifications` | Yes | Admin |

---

## API Routes

| Prefix | Routes | Auth | Description |
|--------|--------|:----:|-------------|
| `GET /api/health` | Health check | — | Server status and uptime |
| `POST /api/auth/login` | Login | — | Authenticate user, return JWT |
| `POST /api/auth/register` | Register | — | Create new user account |
| `GET /api/auth/profile` | Get profile | Yes | Current user profile |
| `PUT /api/auth/profile` | Update profile | Yes | Update user profile |
| `POST /api/auth/verification` | Submit verification | Farmer | Submit farmer verification |
| `GET /api/auth/verification/status` | Verification status | Farmer | Check verification status |
| `GET /api/products` | List products | — | Search, filter, paginate |
| `GET /api/products/:id` | Get product | — | Single product details |
| `POST /api/products` | Create product | Farmer | Add new product listing |
| `PUT /api/products/:id` | Update product | Farmer | Update product |
| `DELETE /api/products/:id` | Delete product | Farmer | Remove product |
| `GET /api/cart` | Get cart | Yes | Current user's cart |
| `POST /api/cart` | Add to cart | Yes | Add item to cart |
| `PUT /api/cart/:id` | Update cart item | Yes | Change quantity |
| `DELETE /api/cart/:id` | Remove from cart | Yes | Remove cart item |
| `GET /api/orders` | List orders | Yes | User's order history |
| `GET /api/orders/:id` | Get order | Yes | Single order with items |
| `POST /api/orders` | Create order | Yes | Place a new order |
| `PUT /api/orders/:id/status` | Update status | Farmer/Admin | Change order status |
| `GET /api/jobs` | List jobs | — | Search, filter, paginate |
| `GET /api/jobs/:id` | Get job | — | Single job details |
| `POST /api/jobs` | Create job | Farmer | Post a new job |
| `PUT /api/jobs/:id` | Update job | Farmer | Edit job listing |
| `DELETE /api/jobs/:id` | Delete job | Farmer | Remove job |
| `POST /api/jobs/:id/apply` | Apply to job | Buyer | Submit job application |
| `GET /api/jobs/:id/applications` | Get applications | Farmer | View applications |
| `PUT /api/applications/:id` | Update application | Farmer | Accept/reject applicant |
| `GET /api/inventory` | List inventory | Farmer | Farmer's inventory items |
| `GET /api/inventory/:id` | Get item | Farmer | Single inventory item |
| `POST /api/inventory` | Create item | Farmer | Add inventory item |
| `PUT /api/inventory/:id` | Update item | Farmer | Edit inventory item |
| `POST /api/inventory/:id/transactions` | Add transaction | Farmer | In/out/adjustment |
| `GET /api/dashboard` | Dashboard stats | Yes | User stats and recent orders |
| `GET /api/dashboard/recent-orders` | Recent orders | Yes | Recent order activity |
| `GET /api/admin/users` | List users | Admin | All platform users |
| `PUT /api/admin/users/:id/role` | Update user role | Admin | Change user role |
| `GET /api/admin/roles` | List roles | Admin | All defined roles |
| `POST /api/admin/roles` | Create role | Admin | New role definition |
| `PUT /api/admin/roles/:id` | Update role | Admin | Edit role permissions |
| `GET /api/admin/verifications` | List verifications | Admin | Verification queue |
| `PUT /api/admin/verifications/:id` | Review verification | Admin | Approve/reject |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **PostgreSQL** 14+ running locally or remotely

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/farmify.git
cd farmify

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd backend && npm install && cd ..

# 4. Configure environment variables
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL connection string
cd ..

# 5. Initialize the database
cd backend && npm run db:init && cd ..

# 6. Seed sample data (optional)
cd backend && npm run db:seed && cd ..

# 7. Start both servers
npm run dev:all
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## Environment Configuration

Create `backend/.env` from the example template:

```env
PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/farmify
JWT_SECRET=your-secret-key-change-in-production
```

The Vite dev server proxies `/api` and `/uploads` requests to the backend at `localhost:5000` (configured in `vite.config.ts`). CORS is pre-configured to allow `localhost:5173` and `127.0.0.1:5173`.

---

## Scripts

### Frontend (root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run dev:backend` | Start backend dev server (port 5000) |
| `npm run dev:all` | Start both frontend and backend concurrently |
| `npm run build` | TypeScript check + Vite production build |
| `npm run build:backend` | Compile backend TypeScript |
| `npm run build:all` | Build both frontend and backend |
| `npm run test` | Run Vitest unit tests (single run) |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run Vitest with coverage report |
| `npm run lint` | Run ESLint across the frontend |
| `npm run preview` | Preview the production build |

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm run start` | Run compiled server from dist/ |
| `npm run db:init` | Initialize database schema |
| `npm run db:seed` | Seed sample data |

---

## Docker

The project includes Docker support for production-like environments:

```bash
# Build and start all services
docker compose up -d --build

# Stop all services
docker compose down

# View logs
docker compose logs -f
```

Three services are defined:
- **db** — PostgreSQL 16, persistent volume for data
- **backend** — Express API built from `backend/`, port 5000
- **frontend** — Nginx serving the built SPA, port 80, with API proxy

---

## CI/CD

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR to `main`:

| Job | Description |
|-----|-------------|
| **lint** | ESLint check across frontend |
| **typecheck** | TypeScript type checking (frontend + backend) |
| **build** | Full production build (frontend + backend) — gated on lint + typecheck |

---

## Database

Farmify uses **PostgreSQL** with raw SQL queries (no ORM). The schema defines the following tables:

- `users` — Authentication and profile data
- `products` — Marketplace product listings
- `orders` / `order_items` — Customer orders and line items
- `cart_items` — Active shopping cart state
- `jobs` / `job_applications` — Job board and applications
- `inventory_items` / `inventory_transactions` — Farmer inventory management
- `farmer_profiles` / `verification_documents` — Farmer verification flow
- `roles` / `role_permissions` — Role-based access control

**Authentication**: JWT-based with bcrypt password hashing. Tokens are stored in localStorage and attached via the `Authorization: Bearer <token>` header. The base fetch client in `src/lib/api/client.ts` handles token attachment, 401 redirects, and FormData serialization automatically.

---

## Contributing

Contributions are welcome. Open an issue or submit a pull request, and the project maintainers will review it. Please follow the existing code style and include documentation for any new features.

---

## License

MIT
