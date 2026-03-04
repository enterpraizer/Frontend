# CloudIaaS Frontend

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000000)
![React Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery)
![Zustand](https://img.shields.io/badge/Zustand-4-orange)
![Vitest](https://img.shields.io/badge/Vitest-passing-6E9F18?logo=vitest)

Multi-tenant cloud infrastructure management panel. Manage virtual machines,
networks, and quotas — with a full admin interface for platform operators.

---

## Quick Start

```bash
git clone https://github.com/your-org/Frontend.git
cd Frontend

cp .env.example .env          # configure API URL
npm install
npm run dev                   # → http://localhost:5173
```

---

## Pages & Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/login` | LoginPage | Public | Username + password login |
| `/register` | RegisterPage | Public | Create account |
| `/register/confirm` | ConfirmEmailPage | Public | Email confirmation link |
| `/onboarding` | OnboardingPage | Auth, no tenant | Create workspace |
| `/dashboard` | DashboardPage | Auth | Resource gauges, VM summary, activity |
| `/vms` | VMListPage | Auth | VM table, create/start/stop/terminate |
| `/vms/:id` | VMDetailPage | Auth | VM detail, network attach/detach |
| `/networks` | NetworkListPage | Auth | Network table, create/delete |
| `/profile` | ProfilePage | Auth | Account, workspace, security tabs |
| `/admin` | AdminDashboardPage | Admin | Platform stats & charts |
| `/admin/tenants` | TenantListPage | Admin | Tenant management + quota editing |
| `/admin/tenants/:id` | TenantDetailPage | Admin | Tenant detail, quota, VMs |
| `/admin/vms` | AdminVMListPage | Admin | All VMs across tenants |
| `/admin/audit` | AuditLogPage | Admin | Audit log with CSV export |

---

## Architecture

```
src/
├── api/                  ← Typed axios functions + React Query key factory
│   ├── client.ts         ← Axios instance, 401 refresh interceptor
│   ├── queryKeys.ts      ← Centralized query key factory
│   ├── auth.ts           ← /auth/* endpoints
│   ├── vms.ts            ← /vms/* endpoints
│   ├── networks.ts       ← /networks/* endpoints
│   ├── dashboard.ts      ← /dashboard/* endpoints
│   ├── admin.ts          ← /admin/* endpoints
│   └── users.ts          ← /users/* endpoints
│
├── components/
│   ├── ui/               ← shadcn base + custom: ResourceGauge, VMStatusBadge,
│   │                         StatCard, PageSkeleton, EmptyState, ConfirmDialog
│   ├── features/
│   │   ├── vms/          ← CreateVMModal
│   │   ├── networks/     ← CreateNetworkModal, NetworkStatusBadge
│   │   ├── quotas/       ← QuotaSummaryCard
│   │   ├── admin/        ← QuotaEditorModal
│   │   └── users/        ← UserAvatar
│   └── layout/           ← AppLayout, AdminLayout, Sidebar, Topbar
│
├── hooks/                ← React Query hooks per domain
│   ├── useVMs.ts         ← useVMList, useVM, useCreateVM, useStartVM, …
│   ├── useNetworks.ts    ← useNetworkList, useCreateNetwork, useAttachVM, …
│   ├── useDashboard.ts   ← useResourceUsage, useVMSummary, useActivityLog
│   ├── useAdmin.ts       ← useAdminStats, useTenantList, useUpdateQuota, …
│   ├── useSidebar.ts     ← Zustand sidebar state (isOpen, isCollapsed)
│   └── usePageTitle.ts   ← Route → page title mapping
│
├── lib/
│   ├── schemas/          ← Zod validation schemas (auth, vm, network, profile)
│   ├── utils.ts          ← cn(), formatDate(), getErrorMessage()
│   └── constants.ts      ← App-wide constants
│
├── pages/                ← Route-level components (all lazy-loaded)
│
├── store/
│   ├── authStore.ts      ← Zustand + persist: user, tokens, isAdmin, hasTenant
│   └── themeStore.ts     ← Zustand + persist: light/dark theme
│
├── types/
│   └── index.ts          ← User, VM, Network, Quota, AdminStats, Paginated, …
│
└── tests/
    ├── setup.ts          ← jest-dom, MSW server, localStorage mock
    ├── msw/              ← handlers.ts, server.ts
    ├── test-utils.tsx    ← renderWithProviders()
    ├── components/       ← ResourceGauge, VMStatusBadge tests
    ├── schemas/          ← vm.schema tests
    └── pages/            ← LoginPage, DashboardPage tests
```

### Data flow

```
Page/Component
  └─ useXxx() hook (React Query)
       └─ api/*.ts (axios function)
            └─ apiClient (axios instance)
                 ├─ request interceptor → attach Bearer token from authStore
                 └─ response interceptor → 401 refresh / 429 toast / 5xx toast
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |
| `VITE_APP_NAME` | `CloudIaaS` | Application display name |

Copy `.env.example` to `.env` and adjust values.

---

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (HMR) on port 5173 |
| `npm run build` | Production build to `dist/` with chunk splitting |
| `npm run preview` | Serve production build locally |
| `npm run test` | Run Vitest unit tests (watch mode) |
| `npm run test -- --run` | Run tests once (CI mode) |
| `npm run lint` | ESLint check |
| `npx tsc --noEmit` | TypeScript type-check only |

---

## Component Guide

### UI Primitives (`src/components/ui/`)

| Component | Usage |
|-----------|-------|
| `ResourceGauge` | Progress bar with green/yellow/red threshold and quota exceeded badge |
| `VMStatusBadge` | Status pill with dot indicator for VM lifecycle states |
| `StatCard` | Metric card with icon, value, optional trend arrow |
| `ConfirmDialog` | Accessible confirm dialog with danger/default variant and loading state |
| `EmptyState` | Centered placeholder with icon, heading, and optional CTA |
| `PageSkeleton` | Full-page skeleton for Suspense fallback |

### Layout (`src/components/layout/`)

The layout adapts to three breakpoints:

| Breakpoint | Sidebar | Behaviour |
|------------|---------|-----------|
| `< 768px` (mobile) | Hidden | Hamburger in Topbar opens slide-in overlay |
| `768–1279px` (tablet) | Icon-only (w-16) | Tooltips show labels on hover |
| `≥ 1280px` (desktop) | Full (w-64) | Collapse button toggles to w-16 |

### Dark Mode

Theme is toggled via the Sun/Moon button in the Topbar. The preference is
persisted to `localStorage` and applied immediately on page load (no flash).
shadcn/ui components respond to the `.dark` class on `<html>` automatically
via CSS custom properties defined in `src/index.css`.

---

## Deployment to Vercel

1. Import the repository in the Vercel dashboard.
2. Set the **Root Directory** to `/` (or the repo root).
3. Set **Framework Preset** to `Vite`.
4. Add environment variables (`VITE_API_URL`, etc.) in Vercel project settings.
5. Create `vercel.json` in the project root for SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Vercel will automatically run `npm run build` and serve the `dist/` folder.
All client-side routes are handled by the rewrite rule above.

---

## CI/CD

GitHub Actions workflow (`.github/workflows/frontend-ci.yml`) runs on every
push/PR to `main` and `dev`:

1. **Type-check** — `tsc --noEmit`
2. **Lint** — ESLint
3. **Test** — Vitest (31 tests)
4. **Build** — Vite production build
