# Phase 3: Booking Management — Design Document

**Feature**: Booking Management & Stay Lifecycle  
**Target Roles**: RECEPTIONIST & MANAGER (full CRUD + check-in/out), OWNER (read-only)  
**Status**: Design (Pending User Approval)

---

## Overview

Phase 3 introduces end-to-end **Booking Management** to the Hotel Management System (`apps/admin`). It equips **RECEPTIONIST** and **MANAGER** staff with tools to search/create guests, check room availability, generate reservations with human-readable reference codes (e.g., `HTL-2026-0001`), calculate pricing automatically, edit existing bookings, and manage the complete stay lifecycle (check-in, check-out, and cancellation). **OWNER** users receive read-only view access across all bookings without direct creation or editing capabilities.

The design builds directly upon Phase 1 & 2 foundations:
- Authentication via `getServerStaff(request)` and `@hotel/auth`
- Core room availability checking using `isRoomAvailable()` from `@hotel/db`
- Data persistence with Prisma ORM (Prisma as single source of truth for business data)
- Deep Teal (`#0F766E`) design system with card-based UI, soft rounded badges, and responsive tables

---

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Client (Browser)                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ /bookings Page (React Client Component)                                   │  │
│  │ - Header Metrics Cards: Total Bookings | Active Stays | Arrivals | Revenue  │  │
│  │ - Toolbar: Search | Status Filter | Date Range | "+ New Booking" Button   │  │
│  │ - Bookings Table / Cards with Soft Status Badges                          │  │
│  │ - Action Drawer / Modals: Create | Edit | Details | Check-In | Check-Out    │  │
│  │ - Auth Guard: hasRole(['RECEPTIONIST', 'MANAGER', 'OWNER'])               │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                   ↕ authenticatedFetch()
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         API Routes (Next.js Server)                             │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ GET   /api/bookings          → Filtered list (RECEPTIONIST, MANAGER, OWNER)│  │
│  │ POST  /api/bookings          → Create booking (RECEPTIONIST, MANAGER)     │  │
│  │ GET   /api/bookings/[id]     → Detail view (RECEPTIONIST, MANAGER, OWNER)  │  │
│  │ PUT   /api/bookings/[id]     → Update booking (RECEPTIONIST, MANAGER)      │  │
│  │ PATCH /api/bookings/[id]/status → Lifecycle change (Check-In/Out/Cancel)    │  │
│  │ GET   /api/guests            → Guest search by email/phone                 │  │
│  │ POST  /api/guests            → Create guest record                         │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                   ↕ Prisma ORM
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      Database (Supabase PostgreSQL)                             │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Booking Table: reference, guestId, roomId, checkIn, checkOut, status...  │  │
│  │ Guest Table: name, email, phone                                           │  │
│  │ Room Table: number, type, baseRate, status                                │  │
│  │ StaffUser Table: id, name, role                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
apps/admin/app/bookings/
├── page.tsx                     # Main Bookings page (Auth guard + layout)
components/bookings/
├── BookingsHeaderStats.tsx      # Top metrics summary cards
├── BookingsFilterToolbar.tsx    # Search input, status dropdown, "+ New Booking" button
├── BookingsTable.tsx            # Responsive data table with sorting and rows
├── BookingStatusBadge.tsx       # Soft rounded badge component (Teal/Blue/Green/Gray/Red)
├── BookingDetailsModal.tsx      # Drawer/Modal for viewing full details & action triggers
├── CreateBookingModal.tsx       # Dual-pane create modal (Guest Search + Room & Date picker)
├── EditBookingModal.tsx         # Modal for editing dates/room with self-exclusion check
└── GuestSearchSelect.tsx        # Search existing guest or inline new guest creator
```

---

## Data Models & TypeScript Interfaces

### Booking Record Schema (Prisma)
```prisma
model Booking {
  id          String        @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  reference   String        @unique
  guestId     String        @db.Uuid
  roomId      String        @db.Uuid
  checkIn     DateTime      @db.Timestamptz(6)
  checkOut    DateTime      @db.Timestamptz(6)
  status      BookingStatus @default(PENDING)
  source      BookingSource @default(STAFF)
  totalAmount Decimal       @db.Decimal(10, 2)
  createdById String?       @db.Uuid
  notes       String?
  createdAt   DateTime      @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime      @default(now()) @updatedAt @db.Timestamptz(6)
  createdBy   StaffUser?    @relation("CreatedByStaff", fields: [createdById], references: [id])
  guest       Guest         @relation(fields: [guestId], references: [id])
  room        Room          @relation(fields: [roomId], references: [id])
}
```

### TypeScript DTO Interfaces
```typescript
export interface GuestDTO {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export interface BookingListItemDTO {
  id: string;
  reference: string;
  checkIn: string;
  checkOut: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  source: 'ONLINE' | 'STAFF';
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  guest: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  room: {
    id: string;
    number: string;
    type: string;
    baseRate: string;
  };
  createdBy?: {
    id: string;
    name: string;
  } | null;
}
```

---

## API Specifications

### 1. GET `/api/guests`
* **Auth**: `RECEPTIONIST`, `MANAGER`, `OWNER`
* **Query Parameters**: `?q=searchterm` (matches name, email, phone)
* **Response (200 OK)**:
```json
{
  "guests": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1234567890"
    }
  ]
}
```

---

### 2. POST `/api/guests`
* **Auth**: `RECEPTIONIST`, `MANAGER`
* **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890"
}
```
* **Validation**: `name` required; at least one of `email` or `phone` required.
* **Response (201 Created)**: Returns created `GuestDTO`.

---

### 3. GET `/api/bookings`
* **Auth**: `RECEPTIONIST`, `MANAGER`, `OWNER`
* **Query Parameters**:
  * `?status=CONFIRMED` (optional filter)
  * `?search=HTL-2026` (optional search across reference, guest name, email, room number)
* **Response (200 OK)**:
```json
{
  "bookings": [
    {
      "id": "uuid",
      "reference": "HTL-2026-0001",
      "checkIn": "2026-08-15T14:00:00Z",
      "checkOut": "2026-08-18T10:00:00Z",
      "status": "CONFIRMED",
      "source": "STAFF",
      "totalAmount": "360.00",
      "notes": "Late check-in requested",
      "guest": {
        "id": "uuid",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "+1234567890"
      },
      "room": {
        "id": "uuid",
        "number": "101",
        "type": "Standard",
        "baseRate": "120.00"
      }
    }
  ],
  "stats": {
    "total": 42,
    "confirmed": 15,
    "checkedIn": 8,
    "checkedOut": 16,
    "cancelled": 3
  }
}
```

---

### 4. POST `/api/bookings`
* **Auth**: `RECEPTIONIST`, `MANAGER` (403 for `OWNER`)
* **Request Body**:
```json
{
  "guestId": "uuid",
  "roomId": "uuid",
  "checkIn": "2026-08-15T14:00:00.000Z",
  "checkOut": "2026-08-18T10:00:00.000Z",
  "notes": "Optional notes"
}
```
* **Server Logic**:
  1. Validate date order (`checkIn < checkOut`).
  2. Invoke `isRoomAvailable(roomId, checkIn, checkOut)`. Return `400 Bad Request` if `false`.
  3. Fetch Room record to obtain `baseRate`.
  4. Compute `nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))`.
  5. Compute `totalAmount = room.baseRate * nights`.
  6. Generate reference `HTL-YYYY-XXXX`.
  7. Save booking record with `status: 'CONFIRMED'`, `source: 'STAFF'`, `createdById: staff.id`.
* **Response (201 Created)**: Returns full created `BookingListItemDTO`.

---

### 5. PUT `/api/bookings/[id]`
* **Auth**: `RECEPTIONIST`, `MANAGER` (403 for `OWNER`)
* **Request Body**:
```json
{
  "roomId": "uuid",
  "checkIn": "2026-08-16T14:00:00.000Z",
  "checkOut": "2026-08-19T10:00:00.000Z",
  "notes": "Updated notes"
}
```
* **Server Logic**:
  1. Verify booking existence.
  2. Invoke `isRoomAvailable(roomId, checkIn, checkOut, booking.id)` (passing `excludeBookingId`).
  3. Return `400 Bad Request` if unavailable.
  4. Recalculate `totalAmount` based on updated room rate & stay nights.
  5. Update booking record.
* **Response (200 OK)**: Returns updated `BookingListItemDTO`.

---

### 6. PATCH `/api/bookings/[id]/status`
* **Auth**: `RECEPTIONIST`, `MANAGER` (403 for `OWNER`)
* **Request Body**:
```json
{
  "status": "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED"
}
```
* **Status Transition Rules**:
  * `CONFIRMED` → `CHECKED_IN`
  * `CHECKED_IN` → `CHECKED_OUT`
  * `CONFIRMED` or `PENDING` → `CANCELLED`
* **Response (200 OK)**: Returns updated booking object with new status.

---

## Key Utility Algorithms

### 1. Booking Reference Generator (`generateBookingReference`)
```typescript
export async function generateBookingReference(prismaClient: PrismaClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `HTL-${year}-`;
  
  // Find highest existing reference for current year
  const lastBooking = await prismaClient.booking.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });

  let nextSequence = 1;
  if (lastBooking) {
    const parts = lastBooking.reference.split('-');
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) nextSequence = lastNum + 1;
  }

  const paddedSeq = nextSequence.toString().padStart(4, '0');
  return `${prefix}${paddedSeq}`;
}
```

---

## User Interface & Design Language

### Aesthetic & Styling Standards
Following the Phase 2 deep teal aesthetic (`#0F766E`):
- **Primary Color**: `#0F766E` (Deep Teal), hover `#0D655D`
- **Backgrounds**: Soft off-white `#F9FAFB` with white `#FFFFFF` glass-morphism cards
- **Border & Shadows**: Border `#E5E7EB`, subtle card shadows `shadow-sm` and hover `shadow-md`
- **Status Badges**:
  - `CONFIRMED`: `#EFF6FF` bg, `#1D4ED8` text (Blue)
  - `CHECKED_IN`: `#ECFDF5` bg, `#047857` text (Emerald Green)
  - `CHECKED_OUT`: `#F3F4F6` bg, `#4B5563` text (Gray)
  - `CANCELLED`: `#FEF2F2` bg, `#B91C1C` text (Red)
  - `PENDING`: `#FFFBEB` bg, `#B45309` text (Amber)

### Page Layout Breakdown (`/bookings`)
1. **Header Section**: Page Title ("Booking Management"), subtitle, role badge, and "+ New Booking" action button (hidden for OWNER).
2. **Key Metric Summary Cards**:
   * Total Bookings Count
   * Active Checked-In Guests
   * Confirmed Upcoming Stays
   * Total Revenue Summary
3. **Filter & Search Toolbar**:
   * Instant search input (Reference, Guest, Room)
   * Status filter tab bar (`All`, `Confirmed`, `Checked In`, `Checked Out`, `Cancelled`)
4. **Interactive Data Table**:
   * Columns: Reference, Guest, Room, Dates & Duration, Amount, Status, Actions
   * Row hover effects with action buttons (View, Edit, Check-In, Check-Out, Cancel)

---

## Correctness Properties

1. **Property 1: Date Order Validation**
   * *For any* booking attempt, if `checkIn` date/time is $\ge$ `checkOut` date/time, the system MUST reject submission with a validation error.
2. **Property 2: Room Availability Enforcement**
   * *For any* booking creation, `isRoomAvailable()` MUST return `true` for the specified room and dates, or submission is blocked.
3. **Property 3: Update Self-Exclusion**
   * *For any* booking edit, `isRoomAvailable()` MUST be called with `excludeBookingId` equal to the target booking ID to prevent self-conflict.
4. **Property 4: Total Price Calculation**
   * *For any* booking, `totalAmount` MUST equal `room.baseRate` $\times$ `nights` (where `nights` = $\lceil(\text{checkOut} - \text{checkIn}) / 86400000\rceil$).
5. **Property 5: Reference Format Guarantee**
   * *For any* generated booking reference, it MUST match the regex `^HTL-\d{4}-\d{4}$`.
6. **Property 6: Status Transition Validity**
   * *For any* status update request, only valid lifecycle transitions (`CONFIRMED` $\to$ `CHECKED_IN`, `CHECKED_IN` $\to$ `CHECKED_OUT`, `CONFIRMED`/`PENDING` $\to$ `CANCELLED`) are permitted.
7. **Property 7: Role Authorization Enforcement**
   * `RECEPTIONIST` and `MANAGER` can execute all write endpoints. `OWNER` receives 403 Forbidden on all write endpoints (POST, PUT, PATCH, DELETE).

---

## Verification Plan

### Automated Tests
1. **Unit & API Integration Tests** in `packages/db/src/__tests__/booking.test.ts` (or `apps/admin/__tests__/booking.api.test.ts`):
   * Test `generateBookingReference()` sequence generation.
   * Test booking creation with availability validation.
   * Test booking edit with `excludeBookingId`.
   * Test status transition rules (`CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`).
   * Test role-based authorization (403 for `OWNER` on write routes).

### Manual Verification
* Log in as `receptionist@hotel.com` → Create guest, create booking, verify reference generation, check-in, and check-out.
* Log in as `manager@hotel.com` → Edit booking dates and verify price recalculation.
* Log in as `owner@hotel.com` → Navigate to `/bookings`, verify read-only view, ensure action buttons are hidden.
