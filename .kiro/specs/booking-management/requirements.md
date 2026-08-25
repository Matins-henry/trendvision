# Requirements Document — Phase 3: Booking Management

## Introduction

Phase 3 introduces comprehensive **Booking Management** to the Hotel Management System (`apps/admin`). This feature enables **RECEPTIONIST** and **MANAGER** staff members to create, edit, view, filter, cancel, and manage guest stay lifecycles (check-in / check-out). The system mandates double-booking prevention by invoking the core `isRoomAvailable()` function prior to booking creation and modification. It includes guest search and inline creation, automated human-readable reference generation (e.g., `HTL-2026-0001`), and automatic total cost calculation. **OWNER** users receive read-only access to view bookings without direct creation or editing rights.

---

## Glossary

- **Booking_System**: The subsystem handling guest reservations, room availability validation, stay status transitions, and booking records in `apps/admin`.
- **HMS**: Hotel Management System (`apps/admin`).
- **StaffUser**: An authenticated employee record in the `StaffUser` table (`RECEPTIONIST`, `MANAGER`, `OWNER`).
- **Guest**: A customer entity in the `Guest` table with `name`, optional `email`, and optional `phone`.
- **Booking**: A reservation record connecting a `Guest` and a `Room` for a specific check-in and check-out date range.
- **isRoomAvailable()**: The core business logic function in `packages/db/src/availability.ts` that checks room `ACTIVE` status and ensures no date range overlaps exist with existing active bookings (`PENDING`, `CONFIRMED`, `CHECKED_IN`).
- **BookingReference**: A unique, human-readable identifier assigned to each booking upon creation (format: `HTL-YYYY-XXXX`, e.g., `HTL-2026-0001`).
- **BookingStatus**: Enum representing the booking lifecycle: `PENDING`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`.
- **BookingSource**: Enum identifying booking origin (`STAFF` for admin app bookings, `ONLINE` for future website bookings).

---

## Requirements

### Requirement 1: Guest Search & Creation Flow

**User Story:** As a Receptionist or Manager, I want to search for existing guests or create a new guest record seamlessly while making a booking, so that guest details are accurate and deduplicated.

#### Acceptance Criteria

1. WHEN a RECEPTIONIST or MANAGER initiates a booking, THE Booking_System SHALL provide a guest search field supporting lookup by email address or phone number.
2. WHERE matching guests exist, THE Booking_System SHALL display search results showing guest name, email, and phone number for quick selection.
3. WHEN no matching guest is found or when registering a new guest, THE Booking_System SHALL allow creating a new Guest record requiring `name`, with optional `email` and `phone`.
4. THE Booking_System SHALL validate that at least one contact method (`email` or `phone`) is provided when creating a new Guest.
5. WHEN a new Guest is saved, THE Booking_System SHALL automatically select that Guest for the active booking creation form.

---

### Requirement 2: Create New Booking with Availability & Pricing Verification

**User Story:** As a Receptionist or Manager, I want to select a room and date range, verify availability, and create a confirmed booking with automatic cost calculation, so that double-bookings are prevented and accurate rates are charged.

#### Acceptance Criteria

1. WHEN a RECEPTIONIST or MANAGER specifies a room, check-in date/time, and check-out date/time, THE Booking_System SHALL invoke `isRoomAvailable(roomId, checkIn, checkOut)`.
2. IF `isRoomAvailable()` returns `false`, THEN THE Booking_System SHALL prevent submission and display a clear alert indicating that the room is unavailable for the selected dates.
3. IF check-in date/time is equal to or after check-out date/time, THEN THE Booking_System SHALL prevent submission and display a date validation error.
4. THE Booking_System SHALL automatically calculate `totalAmount` by multiplying the selected room's `baseRate` by the number of stay nights (`Math.ceil` of check-out minus check-in date difference in days).
5. WHEN a valid booking is submitted, THE Booking_System SHALL generate a unique `BookingReference` matching the pattern `HTL-YYYY-XXXX` (e.g., `HTL-2026-0001`).
6. THE Booking_System SHALL set `status` to `CONFIRMED`, `source` to `STAFF`, and `createdById` to the authenticated `StaffUser.id`.
7. WHEN creation succeeds, THE Booking_System SHALL display a success confirmation banner with the generated `BookingReference` and redirect or update the UI list.

---

### Requirement 3: View & Filter Bookings List

**User Story:** As a Staff member (Receptionist, Manager, or Owner), I want to view a filterable list of all bookings, so that I can monitor upcoming arrivals, stay statuses, and occupancy.

#### Acceptance Criteria

1. WHEN a user accesses the `/bookings` page, THE Booking_System SHALL display a list of all bookings sorted by check-in date descending.
2. THE Booking_System SHALL display key information for each booking: reference code, guest name & contact, room number & type, check-in date, check-out date, total amount, status badge, and creation source.
3. THE Booking_System SHALL provide quick filter controls for `status` (`ALL`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`, `PENDING`).
4. THE Booking_System SHALL provide a search input matching against booking reference, guest name, guest email, or room number.
5. THE Booking_System SHALL format status badges using soft rounded badges aligned with the Phase 2 deep teal design system (`#0F766E`).
6. WHEN no bookings match the selected filters, THE Booking_System SHALL display a clear empty state message.

---

### Requirement 4: Edit Booking with Self-Exclusion Availability Check

**User Story:** As a Receptionist or Manager, I want to edit an existing booking's dates, room, or notes while excluding the booking itself from availability overlap checks, so that modifications do not trigger false conflict errors.

#### Acceptance Criteria

1. WHEN a RECEPTIONIST or MANAGER opens the edit modal for an existing booking, THE Booking_System SHALL pre-fill current booking details (room, guest, check-in, check-out, notes).
2. WHEN dates or room are modified, THE Booking_System SHALL invoke `isRoomAvailable(newRoomId, newCheckIn, newCheckOut, booking.id)` passing the current `booking.id` as the `excludeBookingId` argument.
3. IF `isRoomAvailable()` returns `false`, THEN THE Booking_System SHALL block saving and display an availability conflict message.
4. WHEN room or dates change, THE Booking_System SHALL automatically recalculate `totalAmount` based on the updated stay duration and room base rate.
5. THE Booking_System SHALL record `updatedAt` automatically upon saving edits.

---

### Requirement 5: Check-in & Check-out Lifecycle Workflow

**User Story:** As a Receptionist or Manager, I want to transition bookings through check-in and check-out states, so that real-time guest occupancy is accurately reflected.

#### Acceptance Criteria

1. WHEN a booking is in `CONFIRMED` status, THE Booking_System SHALL display a prominent **Check-In** action button for RECEPTIONIST and MANAGER users.
2. WHEN **Check-In** is confirmed, THE Booking_System SHALL update `status` from `CONFIRMED` to `CHECKED_IN`.
3. WHEN a booking is in `CHECKED_IN` status, THE Booking_System SHALL display a prominent **Check-Out** action button for RECEPTIONIST and MANAGER users.
4. WHEN **Check-Out** is confirmed, THE Booking_System SHALL update `status` from `CHECKED_IN` to `CHECKED_OUT`.
5. THE Booking_System SHALL reflect updated statuses immediately across all list views without page reloads.

---

### Requirement 6: Cancel Booking Workflow

**User Story:** As a Receptionist or Manager, I want to cancel a booking, so that the room becomes immediately available for other reservations.

#### Acceptance Criteria

1. WHEN a booking has `status` `CONFIRMED` or `PENDING`, THE Booking_System SHALL allow RECEPTIONIST and MANAGER users to trigger a cancellation.
2. THE Booking_System SHALL request confirmation prior to executing cancellation.
3. WHEN cancellation is confirmed, THE Booking_System SHALL update `status` to `CANCELLED`.
4. THE Booking_System SHALL verify that updating to `CANCELLED` immediately frees up room availability for that date range when queried by `isRoomAvailable()`.
5. THE Booking_System SHALL disable check-in/check-out actions for `CANCELLED` bookings.

---

### Requirement 7: Role-Based Access Control

**User Story:** As a system administrator, I want to grant booking management access to Receptionists and Managers while providing Owners with read-only view access, so that operational roles are maintained.

#### Acceptance Criteria

1. THE HMS SHALL allow RECEPTIONIST and MANAGER roles full access to create, view, edit, cancel, check-in, and check-out bookings.
2. THE HMS SHALL allow OWNER role to access `/bookings` in read-only mode (viewing list and detail modals), with all creation, editing, cancellation, and status action buttons hidden or disabled.
3. IF an OWNER or unauthorized client attempts POST, PUT, PATCH, or DELETE operations on `/api/bookings`, THEN THE HMS SHALL return HTTP 403 Forbidden.
4. THE HMS SHALL enforce page-level role authorization on `/bookings` allowing `RECEPTIONIST`, `MANAGER`, and `OWNER`.

---

## Non-Functional Requirements

### NF1: Data Validation & Integrity
- Client-side and server-side validation on check-in/check-out dates (check-in must be before check-out).
- Total amount calculated on server-side to prevent client price tampering.
- Database foreign key integrity maintained: `guestId`, `roomId`, and `createdById` link valid entities.

### NF2: User Experience & Design System
- Deep Teal (`#0F766E`) primary visual styling consistent with Phase 2.
- Card-based layouts, clean tables, and soft rounded status badges:
  - `CONFIRMED`: Soft blue badge
  - `CHECKED_IN`: Soft green badge
  - `CHECKED_OUT`: Soft gray badge
  - `CANCELLED`: Soft red badge
  - `PENDING`: Soft yellow badge
- Loading spinners during availability checks and submission states.

### NF3: Concurrency & Performance
- Re-run `isRoomAvailable()` server-side inside API routes right before transaction execution to prevent race condition double-bookings.
- Bookings list query response under 500ms under standard loads.

---

## Out of Scope (Future Phases)

- Payment processing / gateway integration (e.g. Stripe)
- Customer-facing online booking site (`apps/site`) integration
- Multi-room reservations in a single booking reference
- Automated email/SMS reservation confirmation senders
- Dynamic seasonal or holiday rate adjustments

---

## Dependencies

- **Phase 1 Complete**: Supabase Auth, `StaffUser` roles (`RECEPTIONIST`, `MANAGER`, `OWNER`), and `isRoomAvailable()` in `packages/db`.
- **Phase 2 Complete**: Room management with `Room` records and `baseRate`.
- **Database Schema**: `Booking` and `Guest` models exist in Prisma schema.

---

## Success Criteria

1. RECEPTIONIST and MANAGER can search existing guests or create new guests inline.
2. Booking creation validates availability via `isRoomAvailable()`, calculates total price, generates `HTL-YYYY-XXXX` reference, and sets `CONFIRMED` status.
3. Editing a booking re-runs `isRoomAvailable()` with self-exclusion (`excludeBookingId`).
4. Check-in (`CONFIRMED` → `CHECKED_IN`), Check-out (`CHECKED_IN` → `CHECKED_OUT`), and Cancel (`CANCELLED`) workflows operate smoothly.
5. OWNER role can view all bookings in read-only mode, with write/action buttons strictly disabled.
6. API routes enforce role checks and return 403 for unauthorized write attempts.
7. UI strictly adheres to the established deep teal design system.
