# Phase 2: Room & Rate Management - Design Document

**Feature**: Room and Rate Management for Hotel Administrators  
**Target Role**: MANAGER only  
**Status**: Design (Pending Approval)

---

## Architecture Overview

This feature follows a standard Next.js App Router pattern with:
- **Frontend**: React client components in `/rooms` route
- **Backend**: API routes for CRUD operations with server-side validation
- **Data Layer**: Prisma ORM via `@hotel/db` package (no schema changes needed)
- **Auth**: Page-level guards using `@hotel/auth` package (flat permission model)

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /rooms page (React Client Component)                │  │
│  │  - RoomList: displays all rooms                      │  │
│  │  - RoomForm: create/edit form                        │  │
│  │  - Auth Guard: hasRole(['MANAGER'])                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↕ fetch()
┌─────────────────────────────────────────────────────────────┐
│                  API Routes (Server-side)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST   /api/rooms          → Create room            │  │
│  │  GET    /api/rooms          → List all rooms         │  │
│  │  GET    /api/rooms/[id]     → Get single room        │  │
│  │  PUT    /api/rooms/[id]     → Update room            │  │
│  │  PATCH  /api/rooms/[id]/status → Toggle status       │  │
│  │                                                        │  │
│  │  Each route checks MANAGER role via getCurrentStaff() │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↕ Prisma
┌─────────────────────────────────────────────────────────────┐
│                      Database (Supabase)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Room table (existing, no changes needed)            │  │
│  │  - id, number, type, capacity, baseRate              │  │
│  │  - status, description, photos                       │  │
│  │  - createdAt, updatedAt                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Structure

### Page Components

```
apps/admin/app/rooms/
├── page.tsx                 # Main rooms management page (client component)
│   ├── Auth guard (MANAGER only)
│   ├── RoomList component
│   └── RoomForm modal/dialog
```

### API Routes

```
apps/admin/app/api/rooms/
├── route.ts                 # POST (create), GET (list)
└── [id]/
    ├── route.ts             # GET (single), PUT (update)
    └── status/
        └── route.ts         # PATCH (toggle status)
```

---

## Data Flow

### 1. List Rooms (Read)

```
User lands on /rooms
    ↓
Page checks: isLoading, staff, hasRole(['MANAGER'])
    ↓
Fetch GET /api/rooms
    ↓
API: getCurrentStaff() → check role → prisma.room.findMany()
    ↓
Return rooms sorted by number
    ↓
Display in table with Edit/Status buttons
```

### 2. Create Room (Write)

```
User clicks "New Room" button
    ↓
Form modal opens (empty fields)
    ↓
User fills: number, type, capacity, baseRate, description, photos
    ↓
Client-side validation (required fields, positive numbers)
    ↓
POST /api/rooms with form data
    ↓
API: getCurrentStaff() → check role → validate → prisma.room.create()
    ↓
Return new room data
    ↓
Update UI: close modal, refresh list, show success message
```

### 3. Edit Room (Update)

```
User clicks "Edit" on a room
    ↓
Form modal opens (pre-filled with room data)
    ↓
User modifies fields
    ↓
Client-side validation
    ↓
PUT /api/rooms/[id] with updated data
    ↓
API: getCurrentStaff() → check role → validate → prisma.room.update()
    ↓
Return updated room data
    ↓
Update UI: close modal, refresh list, show success message
```

### 4. Toggle Status (Soft Disable)

```
User clicks "Mark Out of Service" (or "Mark Active")
    ↓
Confirmation dialog (optional)
    ↓
PATCH /api/rooms/[id]/status with { status: "OUT_OF_SERVICE" | "ACTIVE" }
    ↓
API: getCurrentStaff() → check role → prisma.room.update({ status })
    ↓
Return updated room
    ↓
Update UI: refresh list, show badge color change, show success message
```

---

## API Specifications

### POST /api/rooms (Create Room)

**Request Body**:
```typescript
{
  number: string;        // required, unique
  type: string;          // required
  capacity: number;      // required, >= 1
  baseRate: number;      // required, > 0
  description?: string;  // optional
  photos?: string[];     // optional, array of URLs
}
```

**Response (201 Created)**:
```typescript
{
  id: string;
  number: string;
  type: string;
  capacity: number;
  baseRate: number;
  status: "ACTIVE";
  description: string | null;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}
```

**Error Responses**:
- 400: Validation error (missing fields, invalid format, duplicate number)
- 403: Forbidden (not MANAGER role)
- 500: Internal server error

---

### GET /api/rooms (List All Rooms)

**Query Parameters**: None

**Response (200 OK)**:
```typescript
{
  rooms: Array<{
    id: string;
    number: string;
    type: string;
    capacity: number;
    baseRate: number;
    status: "ACTIVE" | "OUT_OF_SERVICE";
    description: string | null;
    photos: string[];
    createdAt: string;
    updatedAt: string;
  }>
}
```

**Sorting**: Rooms sorted by `number` field (ascending, alphanumeric)

**Error Responses**:
- 403: Forbidden (not MANAGER role)
- 500: Internal server error

---

### GET /api/rooms/[id] (Get Single Room)

**URL Parameters**: `id` (UUID)

**Response (200 OK)**:
```typescript
{
  id: string;
  number: string;
  type: string;
  capacity: number;
  baseRate: number;
  status: "ACTIVE" | "OUT_OF_SERVICE";
  description: string | null;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}
```

**Error Responses**:
- 403: Forbidden (not MANAGER role)
- 404: Room not found
- 500: Internal server error

---

### PUT /api/rooms/[id] (Update Room)

**URL Parameters**: `id` (UUID)

**Request Body** (same as POST, all fields updatable except id/timestamps):
```typescript
{
  number: string;        // required, unique (excluding current room)
  type: string;          // required
  capacity: number;      // required, >= 1
  baseRate: number;      // required, > 0
  description?: string;  // optional
  photos?: string[];     // optional
}
```

**Response (200 OK)**:
```typescript
{
  id: string;
  number: string;
  type: string;
  capacity: number;
  baseRate: number;
  status: string;        // unchanged
  description: string | null;
  photos: string[];
  createdAt: string;
  updatedAt: string;     // auto-updated by Prisma
}
```

**Error Responses**:
- 400: Validation error
- 403: Forbidden (not MANAGER role)
- 404: Room not found
- 500: Internal server error

---

### PATCH /api/rooms/[id]/status (Toggle Room Status)

**URL Parameters**: `id` (UUID)

**Request Body**:
```typescript
{
  status: "ACTIVE" | "OUT_OF_SERVICE"
}
```

**Response (200 OK)**:
```typescript
{
  id: string;
  number: string;
  status: "ACTIVE" | "OUT_OF_SERVICE";
  // ... other fields unchanged
}
```

**Error Responses**:
- 400: Invalid status value
- 403: Forbidden (not MANAGER role)
- 404: Room not found
- 500: Internal server error

---

## Validation Rules

### Client-Side (React Form)

- **Room number**: Required, non-empty string, trim whitespace
- **Type**: Required, non-empty string
- **Capacity**: Required, integer >= 1
- **Base rate**: Required, number > 0, max 2 decimal places
- **Description**: Optional, string
- **Photos**: Optional, array of valid URLs

Display inline error messages on blur and on submit attempt.

### Server-Side (API Routes)

All client-side validations **plus**:
- **Room number uniqueness**: Check database before create/update
  - On create: `prisma.room.findUnique({ where: { number } })` must return null
  - On update: `prisma.room.findUnique({ where: { number, NOT: { id } } })` must return null
- **Type safety**: Ensure all fields match expected types
- **SQL injection prevention**: Use Prisma parameterized queries (automatic)
- **Status enum**: Must be exactly "ACTIVE" or "OUT_OF_SERVICE"

Return structured error responses:
```typescript
{
  error: string;           // User-friendly message
  field?: string;          // Which field failed (if applicable)
  code?: string;           // Machine-readable error code
}
```

---

## UI/UX Design

### Rooms List Page (`/rooms`)

**Layout**:
```
┌────────────────────────────────────────────────────────────┐
│  Hotel Management System         Manager Name (MANAGER)    │
└────────────────────────────────────────────────────────────┘

  Rooms                                          [+ New Room]

┌────────────────────────────────────────────────────────────┐
│ Number │ Type      │ Capacity │ Rate    │ Status  │ Actions│
├────────┼───────────┼──────────┼─────────┼─────────┼────────┤
│ 101    │ Standard  │ 2        │ $120.00 │ Active  │ Edit   │
│        │           │          │         │         │ Out    │
├────────┼───────────┼──────────┼─────────┼─────────┼────────┤
│ 102    │ Deluxe    │ 2        │ $180.00 │ Active  │ Edit   │
│        │           │          │         │         │ Out    │
├────────┼───────────┼──────────┼─────────┼─────────┼────────┤
│ 201    │ Suite     │ 4        │ $350.00 │ Out of  │ Edit   │
│        │           │          │         │ Service │ Active │
└────────────────────────────────────────────────────────────┘
```

**Visual Design**:
- Status badge colors:
  - ACTIVE: Green badge
  - OUT_OF_SERVICE: Red/orange badge
- Hover states on table rows
- Loading skeleton during fetch
- Empty state: "No rooms yet. Create your first room."

---

### Room Form (Modal/Dialog)

**Layout** (Create mode):
```
┌─────────────────────────────────────────┐
│  Create New Room                    [×] │
├─────────────────────────────────────────┤
│                                          │
│  Room Number *                           │
│  ┌────────────────────────────────────┐ │
│  │ 101                                │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Type *                                  │
│  ┌────────────────────────────────────┐ │
│  │ Standard                           │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Capacity * (guests)                     │
│  ┌────────────────────────────────────┐ │
│  │ 2                                  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Base Rate * (per night)                 │
│  ┌────────────────────────────────────┐ │
│  │ 120.00                             │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Description                             │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Photos (URLs, one per line)             │
│  ┌────────────────────────────────────┐ │
│  │ https://example.com/room101-1.jpg  │ │
│  │ https://example.com/room101-2.jpg  │ │
│  └────────────────────────────────────┘ │
│                                          │
│             [Cancel]  [Create Room]      │
└─────────────────────────────────────────┘
```

**Edit mode**: Same layout, title changes to "Edit Room [number]", button says "Save Changes"

**Interaction**:
- Validation on blur for each field
- Inline error messages below fields
- Submit button disabled during API call
- Success: Close modal, show toast notification, refresh list
- Error: Show error message in modal, keep modal open

---

## Security & Authorization

### Page-Level Guard

```typescript
// apps/admin/app/rooms/page.tsx
export default function RoomsPage() {
  const { staff, isLoading, hasRole } = useStaff();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !staff) {
      router.push('/login');
    }
  }, [staff, isLoading, router]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!hasRole(['MANAGER'])) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Access denied. Manager role required.</div>
      </div>
    );
  }

  // ... rest of component
}
```

### API Route Guard (Pattern for all routes)

```typescript
// apps/admin/app/api/rooms/route.ts
import { getCurrentStaff } from '@hotel/auth';

export async function POST(request: Request) {
  try {
    // Check authentication and role
    const staff = await getCurrentStaff();
    
    if (!staff) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (staff.role !== 'MANAGER') {
      return Response.json(
        { error: 'Forbidden. Manager role required.' },
        { status: 403 }
      );
    }

    // Proceed with operation...
    // ...
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Authorization Pattern**:
- Every API route checks `getCurrentStaff()` first
- Rejects if `staff` is null (401 Unauthorized)
- Rejects if `staff.role !== 'MANAGER'` (403 Forbidden)
- Uses exact role match (flat permission model, no hierarchy)

---

## Error Handling

### Client-Side

**Types of Errors**:
1. **Validation errors**: Show inline below form fields
2. **Network errors**: Show toast notification "Unable to connect. Please try again."
3. **API errors (4xx/5xx)**: Parse error message from response, show in modal or toast

**Error Display Strategy**:
```typescript
try {
  const response = await fetch('/api/rooms', { method: 'POST', body: ... });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Operation failed');
  }
  
  // Success handling...
} catch (error) {
  setErrorMessage(error.message);
  // Show toast or inline error
}
```

### Server-Side

**Error Response Format**:
```typescript
// Validation error
{ error: 'Room number already exists', field: 'number', code: 'DUPLICATE' }

// Auth error
{ error: 'Forbidden. Manager role required.' }

// Not found
{ error: 'Room not found', code: 'NOT_FOUND' }

// Generic
{ error: 'Internal server error' }
```

**Error Logging**:
- Log all 500 errors to console with stack trace
- Include request context (method, path, user role)
- Do NOT expose sensitive data in error messages sent to client

---

## State Management

### Client State (React)

```typescript
// Main page state
const [rooms, setRooms] = useState<Room[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingRoom, setEditingRoom] = useState<Room | null>(null);

// Form state (controlled components)
const [formData, setFormData] = useState({
  number: '',
  type: '',
  capacity: 1,
  baseRate: 0,
  description: '',
  photos: []
});
const [formErrors, setFormErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

**State Update Strategy**:
- Optimistic updates: Update local state immediately on user action
- Revalidate: Refetch list after successful create/update/delete
- Rollback: Restore previous state if API call fails

---

## Performance Considerations

### Database Queries

**List All Rooms**:
```typescript
// Efficient: fetch only needed fields, add ordering
const rooms = await prisma.room.findMany({
  select: {
    id: true,
    number: true,
    type: true,
    capacity: true,
    baseRate: true,
    status: true,
    description: true,
    photos: true,
    createdAt: true,
    updatedAt: true,
  },
  orderBy: {
    number: 'asc',  // Alphanumeric sort
  },
});
```

**Check Uniqueness** (on create):
```typescript
const existing = await prisma.room.findUnique({
  where: { number: formData.number },
  select: { id: true },  // Only fetch id, not all fields
});
```

**Check Uniqueness** (on update):
```typescript
const existing = await prisma.room.findFirst({
  where: {
    number: formData.number,
    NOT: { id: roomId },
  },
  select: { id: true },
});
```

### Frontend Optimizations

- Debounce form validation (300ms delay on input)
- Lazy load modal component (only render when needed)
- Use React key prop correctly in list rendering
- Memoize expensive calculations (room count, total capacity, etc.)

---

## Testing Strategy

### Unit Tests (Phase 2 Scope)

Not included in Phase 2 implementation but documented for future:
- API route handlers (mock Prisma calls)
- Validation functions
- Form submission logic

### Manual Testing Checklist

**Create Room**:
- [ ] Create room with all required fields → Success
- [ ] Create room with duplicate number → Error
- [ ] Create room with capacity = 0 → Error
- [ ] Create room with baseRate = 0 → Error
- [ ] Create room with missing required field → Error
- [ ] Create room with valid photos array → Success

**List Rooms**:
- [ ] View empty list (no rooms) → Show empty state
- [ ] View list with multiple rooms → Sorted by number
- [ ] View list with ACTIVE and OUT_OF_SERVICE rooms → Different badges

**Edit Room**:
- [ ] Edit room, change all fields → Success
- [ ] Edit room, change number to duplicate → Error
- [ ] Edit room, change to invalid capacity → Error
- [ ] Edit room, keep same number → Success

**Toggle Status**:
- [ ] Mark ACTIVE room out of service → Status changes
- [ ] Mark OUT_OF_SERVICE room active → Status changes
- [ ] Verify bookings unaffected by status change

**Access Control**:
- [ ] Login as MANAGER → Can access /rooms
- [ ] Login as RECEPTIONIST → Cannot access /rooms (403)
- [ ] Login as OWNER → Cannot access /rooms (403)
- [ ] API calls as non-MANAGER → Return 403

---

## Integration: Update isRoomAvailable() for Status Check

The `isRoomAvailable()` function from Phase 1 must be updated in Phase 2 to respect the `status` field. Without this, marking a room OUT_OF_SERVICE has no effect.

**Updated Implementation**:

```typescript
// packages/db/src/availability.ts
export async function isRoomAvailable(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<boolean> {
  // NEW: Check room status first
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { status: true },
  });

  if (!room || room.status !== 'ACTIVE') {
    return false;  // OUT_OF_SERVICE rooms are never available
  }

  // Existing logic: check for overlapping bookings
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      roomId,
      status: { notIn: ['CANCELLED'] },
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
      OR: [
        { checkIn: { lt: checkOut }, checkOut: { gt: checkIn } },
      ],
    },
    select: { id: true },
  });

  return overlappingBookings.length === 0;
}
```

**Test Coverage Required**:
- Unit test: Room with status OUT_OF_SERVICE returns false (not available)
- Unit test: Room with status ACTIVE with no bookings returns true (available)
- Unit test: Non-existent room returns false
- Integration with existing booking overlap tests

**This change is part of Phase 2 implementation** - the status feature is incomplete without enforcement in availability checking.

---

## Out of Scope (Phase 2)

The following are **not** included in this phase:
- Photo upload functionality (URLs only)
- Image preview/gallery in room list
- Room amenities as structured fields
- Rate variations or pricing rules
- Room availability calendar
- Bulk operations (import/export)
- Audit logging for room changes (use updatedAt timestamp instead)
- Soft delete (use OUT_OF_SERVICE status instead)

---

## Success Metrics

Phase 2 implementation is complete when:
1. ✅ Manager can create rooms via form with validation
2. ✅ Manager can view list of all rooms sorted by number
3. ✅ Manager can edit any room's details
4. ✅ Manager can toggle room status (ACTIVE ↔ OUT_OF_SERVICE)
5. ✅ Only MANAGER role can access `/rooms` page
6. ✅ All API routes enforce MANAGER-only access
7. ✅ Form validation works client-side and server-side
8. ✅ Room number uniqueness is enforced
9. ✅ UI shows loading, success, and error states correctly
10. ✅ Manual testing checklist passes 100%

---

## File Structure Summary

```
hotel-platform/
├── apps/admin/
│   ├── app/
│   │   ├── rooms/
│   │   │   └── page.tsx              # Main rooms page (NEW)
│   │   └── api/
│   │       └── rooms/
│   │           ├── route.ts          # POST, GET (NEW)
│   │           └── [id]/
│   │               ├── route.ts      # GET, PUT (NEW)
│   │               └── status/
│   │                   └── route.ts  # PATCH (NEW)
│   └── ...
└── packages/
    └── db/
        └── src/
            └── availability.ts       # Future update for status check
```

**New files**: 4 files total (1 page, 3 API route files)

---

This design is ready for implementation once approved.
