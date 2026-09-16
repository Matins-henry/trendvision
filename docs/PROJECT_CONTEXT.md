# Hotel Platform - Master Project Context & Roadmap

**Last Updated**: 2026-08-14

> **Single Source of Truth**: This document tracks the architecture, completed phases, current implementation status, design standards, and upcoming roadmap for the entire Hotel Platform monorepo.

## Project Overview

This is a **real production system** for an actual hotel business consisting of two connected applications sharing a single unified backend:

1. **Hotel Management System** (`apps/admin`) - Staff portal for room CRUD, reservations, walk-ins, check-in/out transitions, operational payments, downloadable PDF receipts, expense logging, and maintenance tracking.
2. **Customer Booking Website** (`apps/site`) - Public guest portal for room search, date availability filtering, guest reservations, booking reference generation, online payment gateway integration, and guest booking self-management.

## Architecture

### Monorepo Structure (Turborepo)

```
hotel-platform/
├── apps/
│   ├── admin/          # Hotel Management System (Next.js)
│   ├── site/           # Customer Booking Website (Next.js)
│   ├── web/            # (unused placeholder)
│   └── docs/           # (unused placeholder)
├── packages/
│   ├── db/             # Shared database package (Prisma + availability logic)
│   └── auth/           # Shared authentication package (Supabase Auth)
└── PROJECT_CONTEXT.md  # This file
```

### Key Design Principle

**Both apps (`admin` and `site`) share the same backend logic via `packages/db` and `packages/auth`**. This ensures:
- Room availability rules stay consistent across both apps
- No duplicate logic
- Single source of truth for booking rules

## Database

### Technology Stack

- **Database**: Supabase Postgres (hosted, live in production)
- **ORM**: Prisma
- **Connection**: Pooled connection via Supabase (see `packages/db/.env`)

### Schema

The database has **8 tables** (created directly via SQL, modelled in Prisma schema):

1. **StaffUser** - Hotel staff members with roles and authentication
2. **Room** - Hotel rooms with types, capacity, rates, and status
3. **Guest** - Customer information (indexed on email and phone for fast deduplication lookups)
4. **Booking** - Reservations linking guests to rooms with date ranges
5. **Payment** - Payment records linked to bookings
6. **AuditLog** - Audit trail for staff actions
7. **Expense** - Hotel operational expenses logged by staff
8. **MaintenanceIssue** - Room maintenance tracking (flagged, in-progress, resolved)

**Prisma Schema Location**: `packages/db/prisma/schema.prisma`

### Critical Database Constraint

**`no_overlapping_bookings`** - A Postgres exclusion constraint on the `Booking` table that prevents double-bookings at the database level. This is a hard constraint that will reject any INSERT/UPDATE that would create overlapping bookings for the same room.

### Roles (Enum)

Three staff roles are defined in the schema:

- **RECEPTIONIST**: Handles walk-in bookings, check-in/out, payments, receipt printing
- **MANAGER**: All receptionist features + room/rate management + reports
- **OWNER**: Simplified dashboard with revenue/occupancy metrics only (read-only style view)

### Booking Statuses (Enum)

- **PENDING**: Initial state
- **CONFIRMED**: Payment confirmed
- **CHECKED_IN**: Guest has checked in
- **CHECKED_OUT**: Guest has checked out
- **CANCELLED**: Booking cancelled

**Important**: Only bookings with status `PENDING`, `CONFIRMED`, or `CHECKED_IN` are considered "active" and block room availability.

## Key Business Logic

### Room Availability Checking

**Location**: `packages/db/src/availability.ts`

**Function**: `isRoomAvailable(roomId, checkIn, checkOut, excludeBookingId?)`

**Design Decision**: This function uses **pure overlap logic** with no date validation:
- It checks for overlapping bookings using the condition: `checkIn < existingCheckOut AND checkOut > existingCheckIn`
- It only considers bookings with "active" statuses (PENDING, CONFIRMED, CHECKED_IN)
- It does NOT validate if dates are in the past or future
- Date restrictions (if any) are enforced separately in booking creation forms/APIs

**Critical Rule**: This is the **one and only** function either app should use to check availability before creating a booking. Do not write a second version of this logic.

### Data Access Pattern

**Prisma** is the single source of truth for all database operations (server-side only):
- Room queries and management
- Guest records
- Booking operations
- Payment processing
- Audit logs
- **StaffUser** queries for authentication/authorization
- **Availability checking** (`isRoomAvailable()`)

**Important**: Prisma can ONLY run server-side (Node.js). It cannot run in browser/client components.

**Supabase Client** is used ONLY for authentication operations (can run client-side):
- `signInWithPassword()` - Password authentication
- `getSession()` - Session retrieval
- `signOut()` - Sign out
- Session management and JWT token handling

**Architecture for Auth**:
- Client-side: Supabase auth operations
- Server-side API routes: Prisma StaffUser queries
- `packages/auth/src/staff-auth.ts` calls API routes instead of Prisma directly

## Authentication & Authorization

### Technology

- **Authentication Provider**: Supabase Auth
- **Session Management**: JWT tokens managed by Supabase
- **Authorization**: Page-level access control (client-side guards)

### Implementation

**Package**: `packages/auth/`

**Key Files**:
- `src/supabase.ts` - Supabase client configuration
- `src/staff-auth.ts` - Authentication service (signIn, signOut, getCurrentStaff, verifyActive)
- `src/staff-provider.tsx` - React context provider for accessing staff session

**API Routes** (Server-side):
- `/api/auth/signin` - Verifies StaffUser after Supabase authentication
- `/api/auth/me` - Gets current staff member by authId
- `/api/auth/check-access` - Checks role permissions (available but not used by middleware)

**How It Works**:
1. Staff member signs in with email/password via Supabase Auth (client-side)
2. API route verifies the staff member exists in StaffUser table and is active
3. Session stored in browser cookies
4. Protected pages use `useStaff()` hook to check authentication
5. Each page enforces its own access control based on role

### Access Control Pattern

**IMPORTANT**: This system uses **page-level auth guards**, NOT middleware.

Each protected page:
1. Calls `useStaff()` to get current staff and loading state
2. Checks `isLoading` - shows loading UI while fetching session
3. Checks `!staff` - redirects to `/login` if not authenticated
4. Checks `hasRole([...])` - shows "Access Denied" if wrong role

**Why page-level guards?**
- Simpler and more reliable than middleware in Next.js App Router
- Works consistently with client-side navigation
- No Edge runtime limitations (Prisma compatibility issues)
- Clear and explicit access control in each page component
- Standard pattern used in many production applications

**Middleware Status**: Middleware exists in `apps/admin/middleware.ts` but is intentionally disabled (empty matcher). Do not re-enable it without understanding the Edge runtime/Prisma limitations and cookie sync complexity. Page-level guards are the official access control mechanism.

### Route Permissions (Page-Level)

- `/bookings`, `/check-in`, `/check-out`, `/payments` → **RECEPTIONIST, MANAGER only**
- `/rooms`, `/rates`, `/reports` → MANAGER only
- `/dashboard` → OWNER only

**Critical**: OWNER has **no access** to `/bookings` or any operational pages. This is enforced in two places:
1. `ROUTE_EXACT_ROLES` in `packages/auth/src/role-hierarchy.ts` — allowlist that explicitly excludes OWNER
2. Page-level guard in `apps/admin/app/bookings/page.tsx` — redirects to `/access-denied`

Booking summary numbers for the OWNER role belong on the Owner Dashboard, not on the bookings page.

The route system uses **two maps** in `role-hierarchy.ts`:
- `ROUTE_MIN_ROLE` — minimum-role inheritance (OWNER inherits MANAGER routes like `/reports`)
- `ROUTE_EXACT_ROLES` — explicit allowlists where inheritance must be broken (operational pages)

## Current Implementation Status

### ✅ Phase 1 — Auth & Foundation (Complete)

1. **Database Schema** (Prisma + Supabase)
   - All 8 tables created and Prisma schema synced
   - Prisma Client generated
   - Exclusion constraint `no_overlapping_bookings` active

2. **Room Availability Logic** (`packages/db/src/availability.ts`)
   - `isRoomAvailable()` — pure overlap detection, status-filtered

3. **Authentication Package** (`packages/auth`)
   - Supabase client, staff auth service, React context provider
   - Role hierarchy system (`ROUTE_MIN_ROLE` + `ROUTE_EXACT_ROLES`)
   - Unit tested with Jest (`packages/auth/src/__tests__/role-hierarchy.test.ts`)

4. **Admin App Foundation**
   - Login page, layout with StaffProvider, page-level auth guards

### ✅ Phase 4 — Payments & Receipts (Complete, 2026-08-14)

10. **Payment Recording** (`apps/admin/app/api/bookings/[id]/payments/route.ts`)
    - `GET` — list all payments for a booking with balance summary (totalAmount / totalPaid / balanceOwing)
    - `POST` — record a new COMPLETED payment (amount, method); multiple payments per booking allowed (sum approach)
    - OWNER explicitly blocked (403)

11. **PDF Receipt Generation** (`apps/admin/app/api/bookings/[id]/payments/[paymentId]/receipt/route.ts`)
    - Server-side PDF via `@react-pdf/renderer`; receipt document in `components/payments/ReceiptDocument.tsx`
    - Hotel name from `NEXT_PUBLIC_HOTEL_NAME` env var
    - Streams as `application/pdf` attachment; receipt downloaded client-side via `authenticatedFetch` + `URL.createObjectURL` (Bearer token required, not a plain anchor)

12. **BookingDetailsModal Payments Panel** (`apps/admin/components/bookings/BookingDetailsModal.tsx`)
    - Balance summary strip (Total / Paid / Owing) shown on every open booking
    - Per-payment rows: method badge, timestamp, staff name, 🧾 Receipt download button
    - "+ Record Payment" button (hidden for OWNER and CANCELLED bookings)
    - `RecordPaymentModal` rendered as a sibling fragment (z-[60]) above the booking modal (z-50)

13. **RecordPaymentModal** (`apps/admin/components/payments/RecordPaymentModal.tsx`)
    - Amount field (pre-filled with balance owing, editable for partial payments)
    - Method picker (button grid: Cash / Card / Transfer / Online)
    - Live balance preview showing new balance after payment

14. **Payments stub page** (`apps/admin/app/payments/page.tsx`)
    - RECEPTIONIST/MANAGER only; explains payments live in Bookings modal; links to /bookings
    - Prevents the `/payments` nav link from 404ing

5. **Room Management** (`apps/admin/app/rooms/`)
   - Full CRUD for rooms via `/api/rooms` and `/api/rooms/[id]`
   - Toggle ACTIVE / OUT_OF_SERVICE status
   - MANAGER-only access enforced

6. **Booking Management** (`apps/admin/app/bookings/`)
   - Full booking list with header stats (total, confirmed, checked-in, revenue)
   - Search by guest name/email/reference, filter by status
   - Create, edit, view details, and cancel bookings via modals
   - Status transitions: CONFIRMED → CHECKED_IN → CHECKED_OUT / CANCELLED
   - Booking references auto-generated (`TVL-YYYY-NNNN`)
   - Total amount calculated server-side from room base rate × nights
   - RECEPTIONIST and MANAGER access only — OWNER explicitly excluded

7. **Guest Search & Creation** (`apps/admin/components/bookings/GuestSearchSelect.tsx`)
   - Live search of existing guests by name, email, or phone (250ms debounce)
   - Create new guest inline (requires name + email or phone)
   - Server-side duplicate check on `POST /api/guests`: rejects on matching email/phone (409)
   - UI surfaces conflict with name of existing guest and one-click "Use Existing Record" button

8. **Expenses Module** (`apps/admin/app/expenses/`)
   - Log and view hotel operational expenses with categories
   - MANAGER-only access

9. **Maintenance Module** (`apps/admin/app/maintenance/`)
   - Flag, track, and resolve room maintenance issues
   - Status lifecycle: NEEDS_ATTENTION → IN_PROGRESS → RESOLVED
   - MANAGER-only access

### ✅ Phase 5 — Reporting & Owner Dashboard (Complete, 2026-08-14)

15. **Owner Dashboard** (`apps/admin/app/dashboard/page.tsx`)
    - Live executive overview: Total Revenue, Total Expenses, Net Profit (`Revenue - Expenses`), Live Occupancy Rate %, Active Bookings count, Open Maintenance Issues count.
    - Financial Breakdown: Revenue by payment method (`CASH`, `CARD`, `TRANSFER`, `ONLINE`) vs Expenses by category.
    - Recent Reservations overview table.
    - Accessible to `OWNER` & `MANAGER` roles.

16. **Manager & Owner Reports** (`apps/admin/app/reports/page.tsx`)
    - Time-period filtering toolbar (`Today`, `Last 7 Days`, `Last 30 Days`, `All Time`).
    - Staff Performance Breakdown table: Bookings Created, Payments Processed, Revenue Handled, Expenses Logged, and Maintenance Flagged per staff user.
    - Financial Reconciliation summary: Total Payments Received vs Total Expenses = Net Operating Income.
    - Accessible to `MANAGER` & `OWNER` roles.

17. **Dedicated Check-In Queue Page** (`apps/admin/app/check-in/page.tsx`)
    - Dedicated arrivals queue listing expected arrivals (`CONFIRMED` / `PENDING` due today or earlier).
    - Guest contact info, assigned room, and balance owing indicator.
    - 1-click **"✅ Complete Check-In"** button (triggers `PATCH /api/bookings/[id]/status` to `CHECKED_IN`).
    - `RECEPTIONIST` & `MANAGER` access (`OWNER` explicitly excluded).

18. **Dedicated Check-Out Queue Page** (`apps/admin/app/check-out/page.tsx`)
    - Dedicated departures queue listing checked-in guests due for departure.
    - Guest info, stay duration, and unpaid balance warning alerts.
    - 1-click **"🚪 Complete Check-Out"** button (triggers `PATCH /api/bookings/[id]/status` to `CHECKED_OUT`).
    - `RECEPTIONIST` & `MANAGER` access (`OWNER` explicitly excluded).

19. **Backend Reporting & Queue APIs**
    - `GET /api/reports/dashboard`: Returns aggregate revenue, expense, occupancy, and room metrics.
    - `GET /api/reports/staff-activity`: Returns staff performance and financial reconciliation by date filter.
    - `GET /api/bookings/queue`: Returns filtered check-in/out queue items with calculated balance owing.

### 🧹 Clean Database Baseline & Staff Sync (2026-08-16)

- **Database Clean Slate**: All scratch test bookings, payments, audit logs, expenses, maintenance, and test guests wiped.
- **Strict 3 Core Staff Accounts**:
  - `owner@hotel.com` / `Owner123!` (`OWNER` role)
  - `manager@hotel.com` / `Manager123!` (`MANAGER` role)
  - `receptionist@hotel.com` / `Receptionist123!` (`RECEPTIONIST` role)
- **Supabase Auth & Postgres Sync**: Synced auth UUIDs with `StaffUser` Postgres table to guarantee zero 404/403 sync issues across all 3 roles.
- **Production Initial Rooms**: Seeded 4 clean initial rooms (101, 102, 201, 301) with descriptions, rates, and luxury photos.

---

### 🎨 Trend Vision Branding & Dark/Light Theme Engine (2026-08-16)

- **Trend Vision Color Palette**:
  - Onyx Black (`#0B0F19` / `#000000`)
  - Metallic Champagne Gold (`#D4AF37` / `#C5A059`)
  - Luxury Champagne Cream (`#FDFBF7` / `#F8FAFC`)
- **Global Theme Provider & Toggle**:
  - `ThemeProvider` context managing persistent `'dark'` | `'light'` mode state via `localStorage`.
  - Embedded `ThemeToggle` (☀️ Light / 🌙 Dark) button in navigation header bars across both `apps/admin` and `apps/site`.

---

### 🎨 Trend Vision Luxury Design System & Global Theme Engine (2026-08-16)

- **Unified Theme Engine**: `ThemeProvider` mounted in root `layout.tsx` for both `apps/site` and `apps/admin`. Supports seamless toggle between Dark mode (`#0B0F19` Onyx & Champagne Gold) and Light mode (`#FAF8F3` Cream & Warm Gold).
- **CSS Custom Properties**: Clean `--tv-*` design tokens in `globals.css` driving backgrounds, cards, typography, borders, badges, buttons, and tables.
- **Phase 7 — Paystack Payment Gateway & Nigerian Naira (NGN / ₦) Integration (Completed)**:
  - Central `formatNaira(amount)` utility formatting amounts to `₦150,000.00` across guest & admin portals.
  - Paystack Inline Checkout integration supporting Debit/Credit Cards, Bank Transfer, USSD, and Apple Pay on `/checkout`.
  - Payment Verification API (`/api/public/payments/paystack/verify`) and Webhook Handler (`/api/webhooks/paystack`) verifying HMAC SHA512 signatures.
  - Staff Admin Ledger updated to display Naira ₦ across revenue metrics, P&L reports, and check-in/out queues.
- **Dynamic Brand Logo Engine**:
  - `trend_logo_dark.png` (White & Gold lettermark) for Dark Mode surfaces.
  - `trend_logo_light.png` (Black & Gold lettermark) for Light Mode surfaces.
  - Seamless transparent PNG integration across Navigation headers, Footers, and Login pages with zero white background boxes.
- **Hotel Admin Portal (`apps/admin`)**:
  - Ultra-clean single-card luxury login page (`/login`) featuring centered dynamic transparent logo, email/password fields, theme switcher, and no demo preset clutter.
  - Complete theme alignment for Bookings, Check-In, Check-Out, Owner Dashboard, and Reports pages.
  - Removed deprecated `middleware.ts` causing Turbopack compiler delays and Edge deprecation warnings.
  - Role-based header navigation with quick theme switcher.

---

### 🔑 Check-In Workflow & Security

- **Check-In Arrivals Queue** (`apps/admin/app/check-in/page.tsx`): Clean, 1-click Check-In workflow for receptionist staff. Keycard assignment requirements held until team integration rules are finalized.

---

### ⚠️ Known Tech Debt (Non-Blocking)

- **Duplicate `next` package type clash**: `NextURL`/`NextRequest` TypeScript errors appear across some API routes due to `next` being resolved from both `apps/admin/node_modules` and root `node_modules`. This does not affect runtime behaviour. A cleanup pass (deduplicating `next` in the dependency tree) is scheduled for a future phase.

### ⏳ Not Started Yet

- Online payment gateway integration (Stripe/Paystack) — Phase 7
- Rate management UI
- Testing, Hardening & Launch Prep — Phase 8

## Development Conventions & Rules

### Golden Rules (enforced by project owner)

1. **Don't restructure the repo** without explicit approval
   - Don't rename existing files or directories
   - Don't move existing packages or apps
   - Additive changes (new packages, new files) are fine

2. **Read existing code before writing new code**
   - Check if functionality already exists
   - Match the project's style, conventions, and libraries
   - Don't introduce new patterns or libraries without discussing first

3. **Check in before major decisions**
   - If something about the existing setup seems wrong, ask first
   - Don't "work around" existing code—understand it or ask about it

4. **Use existing shared packages**
   - Use `packages/db` for all database operations
   - Use `packages/auth` for all authentication
   - Don't duplicate availability logic or auth logic in apps

5. **Respect the single source of truth**
   - `isRoomAvailable()` is the only availability checker
   - StaffUser table is the source of truth for roles/permissions
   - The database exclusion constraint is the ultimate double-booking prevention

### TypeScript & Code Quality

- All code must compile with zero TypeScript errors
- Run `npx tsc --noEmit` in each package/app before considering work complete
- Use strict TypeScript settings
- Prefer explicit types over `any`

### Testing Philosophy

- **Unit tests**: Specific scenarios and edge cases
- **Property-based tests**: Universal correctness properties across generated inputs
- Use Jest as test runner
- Use `fast-check` for property-based testing (minimum 100 iterations per property)
- Tests should be comprehensive for business-critical logic (like availability checking)

### Environment Variables

- Supabase credentials are stored in `.env` files (not committed to git)
- Use placeholder comments in code examples
- Project owner adds real credentials manually

## How to Work with This Project

### For AI Agents

1. **Always read this file first** to understand the project context
2. **Check the "Current Implementation Status" section** to see what's already done
3. **Follow the conventions and rules** - don't deviate without asking
4. **Read existing code** in `packages/db` and `packages/auth` before writing new code
5. **Ask before making structural changes** - the project owner has strong preferences

### For Human Developers

1. Read this file to understand the project
2. Check `.kiro/specs/` for detailed specifications of features
3. Run `npm install` at the root to install all dependencies
4. Add Supabase credentials to `packages/db/.env` and `apps/admin/.env.local`
5. Run `npx prisma generate` in `packages/db` to generate Prisma Client
6. Start development with `npm run dev` in the app you're working on

## Important File Locations

- **Database schema**: `packages/db/prisma/schema.prisma`
- **Availability logic**: `packages/db/src/availability.ts`
- **Booking utilities**: `packages/db/src/bookingUtils.ts` (reference generator, total calculator)
- **Auth service**: `packages/auth/src/staff-auth.ts`
- **Role hierarchy & routes**: `packages/auth/src/role-hierarchy.ts`
- **Role hierarchy tests**: `packages/auth/src/__tests__/role-hierarchy.test.ts`
- **Admin middleware**: `apps/admin/middleware.ts` (intentionally disabled — page-level guards are the official pattern)
- **Admin login**: `apps/admin/app/login/page.tsx`
- **Bookings page**: `apps/admin/app/bookings/page.tsx`
- **Bookings API**: `apps/admin/app/api/bookings/route.ts`
- **Guests API**: `apps/admin/app/api/guests/route.ts`
- **Rooms page**: `apps/admin/app/rooms/page.tsx`
- **Rooms API**: `apps/admin/app/api/rooms/route.ts`
- **Payments API**: `apps/admin/app/api/bookings/[id]/payments/route.ts`
- **Receipt API**: `apps/admin/app/api/bookings/[id]/payments/[paymentId]/receipt/route.ts`
- **Receipt PDF document**: `apps/admin/components/payments/ReceiptDocument.tsx`
- **RecordPaymentModal**: `apps/admin/components/payments/RecordPaymentModal.tsx`
- **PaymentMethodBadge**: `apps/admin/components/payments/PaymentMethodBadge.tsx`
- **Specs**: `.kiro/specs/`

## Questions?

This is a real business application being built step-by-step with careful planning and testing. If you're an AI agent working on this project and something is unclear:

1. Read the relevant spec files in `.kiro/specs/`
2. Check the existing implementation in `packages/`
3. Ask the project owner before making assumptions

---

**Note**: This file should be updated as the project progresses. Keep it current as new features are completed.
