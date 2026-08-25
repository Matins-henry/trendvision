# Phase 2: Room & Rate Management - Requirements

**Feature**: Room and Rate Management for Hotel Administrators  
**Target Role**: MANAGER only  
**Status**: Requirements (Pending Approval)

---

## Overview

This feature enables hotel managers to create, view, edit, and manage rooms and their rates through the admin interface. The feature builds on the existing Room model in the database without requiring schema changes.

---

## Business Context

Managers need a centralized interface to:
- Add new rooms to the hotel's inventory
- Update room details and pricing as needed
- Temporarily disable rooms for maintenance without losing booking history
- View all rooms and their current operational status at a glance

This feature is foundational for subsequent booking and inventory management features.

---

## Requirements

### R1: Create New Room

**As a** Manager  
**I want to** create a new room with complete details  
**So that** the room becomes available in the system for bookings

**Acceptance Criteria**:
- Manager can input the following fields:
  - Room number (required, unique, string)
  - Room type (required, string - e.g., "Standard", "Deluxe", "Suite")
  - Capacity (required, positive integer - number of guests)
  - Base rate (required, positive decimal - price per night)
  - Description (optional, text - room amenities and features)
  - Photos (optional, array of URLs - room images)
- Room number must be unique across all rooms (validation error if duplicate)
- Capacity must be at least 1
- Base rate must be greater than 0
- On successful creation, room is saved with status "ACTIVE"
- Manager sees success confirmation and is redirected to the rooms list
- New room immediately appears in the rooms list

**Database Fields Used**:
- `number`, `type`, `capacity`, `baseRate`, `description`, `photos`
- `status` defaults to "ACTIVE"
- `id`, `createdAt`, `updatedAt` auto-generated

---

### R2: View Room List

**As a** Manager  
**I want to** view a list of all rooms with their key details  
**So that** I can see the current inventory and status at a glance

**Acceptance Criteria**:
- Manager can access a rooms list page at `/rooms`
- List displays all rooms (both ACTIVE and OUT_OF_SERVICE)
- Each room displays:
  - Room number
  - Room type
  - Capacity
  - Base rate (formatted as currency)
  - Status (ACTIVE or OUT_OF_SERVICE)
- Visual distinction between ACTIVE and OUT_OF_SERVICE rooms (e.g., badge color)
- List is sorted by room number (ascending)
- Empty state shown if no rooms exist yet
- Action buttons visible for each room: "Edit", "Mark Out of Service" / "Mark Active"

---

### R3: Edit Existing Room

**As a** Manager  
**I want to** edit an existing room's details  
**So that** I can update pricing, descriptions, or other information without recreating the room

**Acceptance Criteria**:
- Manager can click "Edit" on any room in the list
- Edit form pre-populates with current room data
- Manager can update any field except:
  - Room ID (immutable, system-generated)
  - Created/Updated timestamps (system-managed)
- Room number uniqueness is validated on save (excluding current room)
- Capacity must be at least 1
- Base rate must be greater than 0
- On successful update, manager sees success confirmation
- Updated room data immediately reflects in the rooms list
- Booking history is preserved (existing bookings still reference this room)

**Database Fields Editable**:
- `number`, `type`, `capacity`, `baseRate`, `description`, `photos`
- `updatedAt` automatically updated by Prisma

---

### R4: Mark Room Out of Service

**As a** Manager  
**I want to** mark a room as "out of service"  
**So that** it stops appearing as available for new bookings without deleting the room or breaking booking history

**Acceptance Criteria**:
- Manager can click "Mark Out of Service" on any ACTIVE room
- Room status changes from "ACTIVE" to "OUT_OF_SERVICE"
- Room remains visible in the rooms list with OUT_OF_SERVICE badge
- Room stops appearing as available in availability checks for new bookings
- Existing bookings for this room are not affected or cancelled
- Manager sees confirmation message after status change
- Manager can reverse this by clicking "Mark Active" to restore to ACTIVE status

**Database Changes**:
- `status` field updated to "OUT_OF_SERVICE"
- All other fields remain unchanged
- Room ID and relationships preserved

**Integration Note**:
- Future availability checking must filter out rooms with status "OUT_OF_SERVICE"
- Existing `isRoomAvailable()` function may need minor updates to check status field

---

### R5: Role-Based Access Control

**As a** system administrator  
**I want to** restrict room management to MANAGER role only  
**So that** only authorized staff can modify room inventory and pricing

**Acceptance Criteria**:
- `/rooms` page is accessible by MANAGER role only
- RECEPTIONIST attempting to access `/rooms` sees "Access denied" message
- OWNER attempting to access `/rooms` sees "Access denied" message
- All room management API routes require MANAGER role (enforced server-side)
- API routes return 403 Forbidden if accessed by non-MANAGER roles
- Page-level auth guard checks role before rendering content
- Follows existing flat permission model (exact role match, no hierarchy)

**Implementation Notes**:
- Use existing `hasRole(['MANAGER'])` pattern from Phase 1
- Add page-level guard like reports/bookings pages
- Create API routes with role checking middleware or inline checks

---

## Non-Functional Requirements

### NF1: Data Validation
- All form inputs must be validated client-side and server-side
- Server-side validation prevents invalid data from reaching database
- User-friendly error messages for validation failures

### NF2: User Experience
- Loading states shown during API calls
- Success/error feedback after operations
- Responsive design works on desktop and tablet
- Forms are intuitive with clear labels and placeholders

### NF3: Performance
- Room list loads in < 2 seconds under normal conditions
- Form submissions complete in < 1 second
- No full page reloads on CRUD operations (use client-side state updates)

### NF4: Data Integrity
- Room number uniqueness enforced at database level (already exists in schema)
- Changing room status does not cascade delete or modify bookings
- Audit trail maintained via `updatedAt` timestamp

---

## Out of Scope (Future Phases)

The following are explicitly **not** included in Phase 2:
- Room photo upload functionality (photos use URLs only for now)
- Bulk room creation/import
- Room amenities as structured data (use description field as free text)
- Rate variations (seasonal pricing, weekend rates, etc.)
- Room availability calendar view
- Integration with booking creation flow (Phase 3)
- Room performance analytics or occupancy reports
- Soft delete / archive functionality (use OUT_OF_SERVICE instead)

---

## Dependencies

- **Phase 1 Complete**: Authentication and role-based access control working
- **Database Schema**: Room model already exists (no migrations needed)
- **Auth Package**: `@hotel/auth` with `useStaff()` and `hasRole()` available
- **Prisma Client**: Available in `@hotel/db` package

---

## Success Criteria

Phase 2 is complete when:
1. Manager can create a new room with all required fields
2. Manager can view a list of all rooms with their status
3. Manager can edit any room's details and rates
4. Manager can toggle room status between ACTIVE and OUT_OF_SERVICE
5. Only MANAGER role can access the room management interface
6. All CRUD operations persist correctly to the database
7. UI provides clear feedback for success and error states
8. Existing bookings are unaffected by room edits or status changes

---

## Technical Notes

**Existing Room Model Schema**:
```prisma
model Room {
  id          String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  number      String    @unique
  type        String
  capacity    Int
  baseRate    Decimal   @db.Decimal(10, 2)
  status      String    @default("ACTIVE")
  description String?
  photos      String[]
  createdAt   DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime  @default(now()) @updatedAt @db.Timestamptz(6)
  bookings    Booking[]
}
```

**Status Values**:
- "ACTIVE" - Room is operational and available for booking
- "OUT_OF_SERVICE" - Room is temporarily unavailable (maintenance, renovation, etc.)

No schema changes or migrations required - model already supports all needed functionality.
