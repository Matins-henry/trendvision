# Phase 2: Room & Rate Management - Implementation Tasks

**Feature**: Room and Rate Management for Hotel Administrators  
**Status**: Ready for Implementation

---

## Task Overview

| Task | Description | Status |
|------|-------------|--------|
| 1 | Update isRoomAvailable() for status check | ⬜ Not Started |
| 2 | Write tests for status-aware availability | ⬜ Not Started |
| 3 | Create API route: POST /api/rooms (create) | ⬜ Not Started |
| 4 | Create API route: GET /api/rooms (list) | ⬜ Not Started |
| 5 | Create API route: GET /api/rooms/[id] (single) | ⬜ Not Started |
| 6 | Create API route: PUT /api/rooms/[id] (update) | ⬜ Not Started |
| 7 | Create API route: PATCH /api/rooms/[id]/status | ⬜ Not Started |
| 8 | Create /rooms page with auth guard | ⬜ Not Started |
| 9 | Build room list UI component | ⬜ Not Started |
| 10 | Build room form component (create/edit) | ⬜ Not Started |
| 11 | Implement client-side validation | ⬜ Not Started |
| 12 | Manual testing and bug fixes | ⬜ Not Started |

**Estimated Total**: ~3-4 hours implementation

---

## Task 1: Update isRoomAvailable() for Status Check

**Objective**: Modify availability checking to exclude OUT_OF_SERVICE rooms

**Files**:
- `packages/db/src/availability.ts` (modify existing function)

**Implementation Steps**:
1. Read current `isRoomAvailable()` implementation
2. Add room status check at the beginning of the function
3. Query room with `prisma.room.findUnique()` to get status
4. Return `false` if room is null or status !== 'ACTIVE'
5. Keep existing booking overlap logic unchanged

**Code Changes**:
```typescript
// At the start of isRoomAvailable() function:
const room = await prisma.room.findUnique({
  where: { id: roomId },
  select: { status: true },
});

if (!room || room.status !== 'ACTIVE') {
  return false;
}

// ... existing booking overlap logic follows
```

**Acceptance Criteria**:
- ✅ Function returns false for rooms with status OUT_OF_SERVICE
- ✅ Function returns false for non-existent room IDs
- ✅ Function still checks booking overlaps for ACTIVE rooms
- ✅ No breaking changes to function signature
- ✅ TypeScript compiles without errors

**Checkpoint**: Run `npm run build` in packages/db to verify compilation

---

## Task 2: Write Tests for Status-Aware Availability

**Objective**: Add unit tests for status checking behavior

**Files**:
- `packages/db/src/__tests__/availability.test.ts` (add new test cases)

**Test Cases to Add**:

```typescript
describe('isRoomAvailable - status checking', () => {
  it('should return false for OUT_OF_SERVICE room', async () => {
    const room = await createTestRoom({ status: 'OUT_OF_SERVICE' });
    const checkIn = new Date('2025-03-01');
    const checkOut = new Date('2025-03-05');
    
    const available = await isRoomAvailable(room.id, checkIn, checkOut);
    
    expect(available).toBe(false);
  });

  it('should return true for ACTIVE room with no bookings', async () => {
    const room = await createTestRoom({ status: 'ACTIVE' });
    const checkIn = new Date('2025-03-01');
    const checkOut = new Date('2025-03-05');
    
    const available = await isRoomAvailable(room.id, checkIn, checkOut);
    
    expect(available).toBe(true);
  });

  it('should return false for non-existent room', async () => {
    const fakeRoomId = '00000000-0000-0000-0000-000000000000';
    const checkIn = new Date('2025-03-01');
    const checkOut = new Date('2025-03-05');
    
    const available = await isRoomAvailable(fakeRoomId, checkIn, checkOut);
    
    expect(available).toBe(false);
  });

  it('should return false for OUT_OF_SERVICE room even with no bookings', async () => {
    const room = await createTestRoom({ status: 'OUT_OF_SERVICE' });
    // Explicitly verify no bookings exist
    const bookingCount = await prisma.booking.count({
      where: { roomId: room.id }
    });
    expect(bookingCount).toBe(0);
    
    const checkIn = new Date('2025-03-01');
    const checkOut = new Date('2025-03-05');
    
    const available = await isRoomAvailable(room.id, checkIn, checkOut);
    
    expect(available).toBe(false);
  });
});
```

**Acceptance Criteria**:
- ✅ All 4 new tests pass
- ✅ All existing tests still pass (no regressions)
- ✅ Test database cleanup works correctly
- ✅ Tests run in < 30 seconds total

**Checkpoint**: Run `npm test` in packages/db - all tests must pass

---

## Task 3: Create API Route - POST /api/rooms (Create)

**Objective**: Implement room creation endpoint with validation

**Files**:
- `apps/admin/app/api/rooms/route.ts` (create new file)

**Implementation Steps**:
1. Create file and import dependencies (Next.js, Prisma, auth)
2. Implement `POST` handler function
3. Call `getCurrentStaff()` for authentication
4. Check role === 'MANAGER' (403 if not)
5. Parse and validate request body
6. Check room number uniqueness with Prisma
7. Create room with `prisma.room.create()`
8. Return 201 with created room data

**Request Body Validation**:
- `number`: required, string, trim whitespace, non-empty
- `type`: required, string, non-empty
- `capacity`: required, number, integer, >= 1
- `baseRate`: required, number, > 0
- `description`: optional, string or null
- `photos`: optional, array of strings or empty array

**Error Responses**:
- 400: Missing/invalid fields, duplicate room number
- 401: Not authenticated
- 403: Not MANAGER role
- 500: Database or unexpected errors

**Acceptance Criteria**:
- ✅ Authenticated MANAGER can create room
- ✅ Room number uniqueness enforced
- ✅ Validation rejects invalid capacity/baseRate
- ✅ Non-MANAGER receives 403
- ✅ Created room has status 'ACTIVE' by default

**Checkpoint**: Test with curl or Postman - create a test room successfully

---

## Task 4: Create API Route - GET /api/rooms (List)

**Objective**: Implement endpoint to list all rooms

**Files**:
- `apps/admin/app/api/rooms/route.ts` (add to existing file)

**Implementation Steps**:
1. Implement `GET` handler function
2. Call `getCurrentStaff()` for authentication
3. Check role === 'MANAGER' (403 if not)
4. Query all rooms with `prisma.room.findMany()`
5. Order by `number` ascending
6. Return 200 with rooms array

**Query Specification**:
```typescript
const rooms = await prisma.room.findMany({
  orderBy: {
    number: 'asc',
  },
});
```

**Response Format**:
```typescript
{
  rooms: Room[]  // Array of room objects
}
```

**Acceptance Criteria**:
- ✅ Authenticated MANAGER can list all rooms
- ✅ Rooms sorted by number (ascending)
- ✅ Both ACTIVE and OUT_OF_SERVICE rooms included
- ✅ Non-MANAGER receives 403
- ✅ Empty array returned if no rooms exist

**Checkpoint**: Verify rooms list returns the test room from Task 3

---

## Task 5: Create API Route - GET /api/rooms/[id] (Single)

**Objective**: Implement endpoint to fetch a single room by ID

**Files**:
- `apps/admin/app/api/rooms/[id]/route.ts` (create new file)

**Implementation Steps**:
1. Create file and import dependencies
2. Implement `GET` handler with `id` parameter
3. Call `getCurrentStaff()` for authentication
4. Check role === 'MANAGER' (403 if not)
5. Query room with `prisma.room.findUnique({ where: { id } })`
6. Return 404 if room not found
7. Return 200 with room data

**Acceptance Criteria**:
- ✅ Authenticated MANAGER can fetch room by ID
- ✅ Returns 404 for non-existent room ID
- ✅ Returns complete room object with all fields
- ✅ Non-MANAGER receives 403

**Checkpoint**: Fetch the test room by ID - verify all fields returned

---

## Task 6: Create API Route - PUT /api/rooms/[id] (Update)

**Objective**: Implement endpoint to update room details

**Files**:
- `apps/admin/app/api/rooms/[id]/route.ts` (add to existing file)

**Implementation Steps**:
1. Implement `PUT` handler with `id` parameter
2. Call `getCurrentStaff()` for authentication
3. Check role === 'MANAGER' (403 if not)
4. Parse and validate request body (same as POST)
5. Check room exists with `findUnique`
6. Check room number uniqueness (excluding current room)
7. Update room with `prisma.room.update()`
8. Return 200 with updated room

**Uniqueness Check** (different from create):
```typescript
const existing = await prisma.room.findFirst({
  where: {
    number: body.number,
    NOT: { id: params.id },
  },
});
if (existing) {
  return Response.json({ error: 'Room number already exists' }, { status: 400 });
}
```

**Acceptance Criteria**:
- ✅ Authenticated MANAGER can update room
- ✅ Can change room number to unique value
- ✅ Cannot change room number to duplicate
- ✅ All fields updatable except id, createdAt
- ✅ updatedAt timestamp auto-updates
- ✅ Returns 404 for non-existent room
- ✅ Non-MANAGER receives 403

**Checkpoint**: Update test room's baseRate - verify change persists

---

## Task 7: Create API Route - PATCH /api/rooms/[id]/status

**Objective**: Implement endpoint to toggle room status

**Files**:
- `apps/admin/app/api/rooms/[id]/status/route.ts` (create new file)

**Implementation Steps**:
1. Create file and import dependencies
2. Implement `PATCH` handler with `id` parameter
3. Call `getCurrentStaff()` for authentication
4. Check role === 'MANAGER' (403 if not)
5. Parse request body: `{ status: "ACTIVE" | "OUT_OF_SERVICE" }`
6. Validate status value
7. Check room exists
8. Update room status with `prisma.room.update()`
9. Return 200 with updated room

**Status Validation**:
```typescript
if (!['ACTIVE', 'OUT_OF_SERVICE'].includes(body.status)) {
  return Response.json({ error: 'Invalid status' }, { status: 400 });
}
```

**Acceptance Criteria**:
- ✅ Authenticated MANAGER can change status
- ✅ Can toggle ACTIVE → OUT_OF_SERVICE
- ✅ Can toggle OUT_OF_SERVICE → ACTIVE
- ✅ Rejects invalid status values
- ✅ Returns 404 for non-existent room
- ✅ Non-MANAGER receives 403

**Checkpoint**: Toggle test room status - verify it updates and isRoomAvailable() respects it

---

## Task 8: Create /rooms Page with Auth Guard

**Objective**: Create main rooms management page with role check

**Files**:
- `apps/admin/app/rooms/page.tsx` (create new file)

**Implementation Steps**:
1. Create file with 'use client' directive
2. Import useStaff, useRouter, useEffect from necessary packages
3. Implement auth guard logic (redirect if not logged in)
4. Check `hasRole(['MANAGER'])` - show access denied if false
5. Create basic page structure with header
6. Add placeholder for room list component
7. Add "New Room" button (onClick handler placeholder)

**Page Structure**:
```typescript
'use client';

export default function RoomsPage() {
  const { staff, isLoading, hasRole } = useStaff();
  const router = useRouter();

  // Auth guard logic
  useEffect(() => {
    if (!isLoading && !staff) {
      router.push('/login');
    }
  }, [staff, isLoading, router]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!hasRole(['MANAGER'])) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* Room list placeholder */}
      {/* New Room button */}
    </div>
  );
}
```

**Acceptance Criteria**:
- ✅ MANAGER can access /rooms page
- ✅ RECEPTIONIST redirected to access denied
- ✅ OWNER redirected to access denied
- ✅ Unauthenticated redirected to /login
- ✅ Loading state shows while checking auth

**Checkpoint**: Login as MANAGER - verify /rooms page loads and shows UI

---

## Task 9: Build Room List UI Component

**Objective**: Display all rooms in a table with status badges

**Files**:
- `apps/admin/app/rooms/page.tsx` (update existing file)

**Implementation Steps**:
1. Add state: `rooms`, `isLoading`, `error`
2. Add `useEffect` to fetch rooms on mount
3. Call `GET /api/rooms` with fetch
4. Render loading state during fetch
5. Render error state if fetch fails
6. Render table with room data
7. Add status badges (green for ACTIVE, red for OUT_OF_SERVICE)
8. Add "Edit" and status toggle buttons (onClick placeholders)
9. Handle empty state (no rooms)

**Table Columns**:
- Room Number
- Type
- Capacity
- Base Rate (formatted as currency: $120.00)
- Status (badge)
- Actions (Edit, Toggle Status buttons)

**Status Badge Styling**:
```typescript
<span className={`px-2 py-1 rounded text-sm ${
  room.status === 'ACTIVE' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800'
}`}>
  {room.status === 'ACTIVE' ? 'Active' : 'Out of Service'}
</span>
```

**Acceptance Criteria**:
- ✅ Rooms display in table sorted by number
- ✅ Status badges show correct colors
- ✅ Base rate formatted as currency
- ✅ Empty state shows "No rooms yet" message
- ✅ Loading state shows skeleton or spinner
- ✅ Error state shows error message

**Checkpoint**: Verify test room from API appears in table with correct data

---

## Task 10: Build Room Form Component (Create/Edit)

**Objective**: Create modal form for adding and editing rooms

**Files**:
- `apps/admin/app/rooms/page.tsx` (add form to existing file)

**Implementation Steps**:
1. Add state for modal: `isModalOpen`, `editingRoom`, `formData`, `formErrors`, `isSubmitting`
2. Create form component (inline or separate)
3. Add controlled inputs for all fields
4. Wire up "New Room" button to open modal (editingRoom = null)
5. Wire up "Edit" buttons to open modal (editingRoom = room)
6. Implement form submit handler:
   - Determine POST vs PUT based on editingRoom
   - Call appropriate API endpoint
   - Handle success: close modal, refresh list, show toast
   - Handle error: show error message
7. Add form close/cancel handler
8. Style form with Tailwind

**Form Fields**:
- Room Number (text input, required)
- Type (text input, required)
- Capacity (number input, min=1, required)
- Base Rate (number input, min=0.01, step=0.01, required)
- Description (textarea, optional)
- Photos (textarea for URLs, one per line, optional)

**Submit Logic**:
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    const url = editingRoom 
      ? `/api/rooms/${editingRoom.id}` 
      : '/api/rooms';
    const method = editingRoom ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Operation failed');
    }
    
    // Success: close modal, refresh, toast
    setIsModalOpen(false);
    await fetchRooms(); // Refresh list
    // Show success toast
  } catch (error) {
    setFormErrors({ general: error.message });
  } finally {
    setIsSubmitting(false);
  }
};
```

**Acceptance Criteria**:
- ✅ "New Room" opens empty form
- ✅ "Edit" opens pre-filled form
- ✅ Form submission creates new room (POST)
- ✅ Form submission updates existing room (PUT)
- ✅ Modal closes on successful submit
- ✅ Room list refreshes after create/update
- ✅ Submit button disabled during API call
- ✅ Cancel button closes modal without saving

**Checkpoint**: Create a new room via form - verify it appears in list immediately

---

## Task 11: Implement Client-Side Validation

**Objective**: Add form validation with inline error messages

**Files**:
- `apps/admin/app/rooms/page.tsx` (update form component)

**Implementation Steps**:
1. Create validation function for each field
2. Add `onBlur` handlers to inputs for real-time validation
3. Add validation on submit (before API call)
4. Display error messages below each field
5. Prevent submit if validation fails
6. Style error states (red border, red text)

**Validation Rules**:
```typescript
const validateForm = () => {
  const errors: Record<string, string> = {};
  
  if (!formData.number.trim()) {
    errors.number = 'Room number is required';
  }
  
  if (!formData.type.trim()) {
    errors.type = 'Room type is required';
  }
  
  if (!formData.capacity || formData.capacity < 1) {
    errors.capacity = 'Capacity must be at least 1';
  }
  
  if (!formData.baseRate || formData.baseRate <= 0) {
    errors.baseRate = 'Base rate must be greater than 0';
  }
  
  return errors;
};
```

**Error Display**:
```typescript
<input
  className={`border rounded px-3 py-2 ${
    formErrors.number ? 'border-red-500' : 'border-gray-300'
  }`}
  onBlur={() => validateField('number')}
/>
{formErrors.number && (
  <p className="text-red-600 text-sm mt-1">{formErrors.number}</p>
)}
```

**Acceptance Criteria**:
- ✅ Required fields show error when empty
- ✅ Capacity shows error if < 1
- ✅ Base rate shows error if <= 0
- ✅ Errors clear when field becomes valid
- ✅ Submit prevented if validation fails
- ✅ Validation runs on blur and on submit

**Checkpoint**: Try to submit invalid data - verify errors show and submit blocked

---

## Task 12: Manual Testing and Bug Fixes

**Objective**: Test all functionality end-to-end and fix any issues

**Test Checklist**:

**Authentication & Authorization**:
- [ ] Login as MANAGER → Can access /rooms
- [ ] Login as RECEPTIONIST → Cannot access /rooms (403)
- [ ] Login as OWNER → Cannot access /rooms (403)
- [ ] Access /rooms without login → Redirected to /login
- [ ] Make API call as RECEPTIONIST → Returns 403

**Create Room**:
- [ ] Click "New Room" → Form opens empty
- [ ] Submit empty form → Validation errors show
- [ ] Enter invalid capacity (0) → Error shows
- [ ] Enter invalid baseRate (0) → Error shows
- [ ] Create room with all valid fields → Success, room appears in list
- [ ] Try to create room with duplicate number → API error shows
- [ ] Create room with description and photos → Saved correctly

**List Rooms**:
- [ ] Page loads → Rooms fetch and display
- [ ] Multiple rooms → Sorted by number ascending
- [ ] Room status badges → Correct colors (green/red)
- [ ] Base rate → Formatted as currency
- [ ] No rooms → Empty state shows
- [ ] API error → Error message shows

**Edit Room**:
- [ ] Click "Edit" on a room → Form opens with room data
- [ ] Change room number to unique value → Success
- [ ] Change room number to duplicate → API error shows
- [ ] Update baseRate → Change persists
- [ ] Update description → Change persists
- [ ] Cancel edit → No changes saved

**Toggle Status**:
- [ ] Click "Mark Out of Service" on ACTIVE room → Status changes
- [ ] Badge updates to red "Out of Service"
- [ ] Click "Mark Active" on OUT_OF_SERVICE room → Status changes
- [ ] Badge updates to green "Active"
- [ ] Verify isRoomAvailable() returns false for OUT_OF_SERVICE room

**Data Integrity**:
- [ ] Room number uniqueness enforced
- [ ] Capacity must be >= 1
- [ ] Base rate must be > 0
- [ ] updatedAt timestamp updates on edit
- [ ] Room status persists across page refresh

**UI/UX**:
- [ ] Loading states show during API calls
- [ ] Success messages show after operations
- [ ] Error messages show when operations fail
- [ ] Modal closes on successful submit
- [ ] Submit button disabled during API call
- [ ] Form validation gives clear feedback

**Bug Fixes**:
- Document any bugs found during testing
- Fix bugs before marking task complete
- Retest after fixes

**Acceptance Criteria**:
- ✅ All test checklist items pass
- ✅ No console errors in browser
- ✅ No TypeScript compilation errors
- ✅ All API routes return appropriate status codes
- ✅ UI is responsive and user-friendly

**Checkpoint**: Complete full test pass - all items checked off

---

## Completion Checklist

Before marking Phase 2 complete, verify:

- [ ] Task 1: isRoomAvailable() updated for status check
- [ ] Task 2: Status tests written and passing
- [ ] Task 3: POST /api/rooms works correctly
- [ ] Task 4: GET /api/rooms works correctly
- [ ] Task 5: GET /api/rooms/[id] works correctly
- [ ] Task 6: PUT /api/rooms/[id] works correctly
- [ ] Task 7: PATCH /api/rooms/[id]/status works correctly
- [ ] Task 8: /rooms page auth guard working
- [ ] Task 9: Room list displays correctly
- [ ] Task 10: Room form creates and edits rooms
- [ ] Task 11: Client-side validation working
- [ ] Task 12: All manual tests pass

**Final Verification**:
- [ ] npm run build succeeds in all packages
- [ ] No TypeScript errors
- [ ] All unit tests pass (npm test in packages/db)
- [ ] Three test users (MANAGER, RECEPTIONIST, OWNER) can login
- [ ] MANAGER can fully manage rooms
- [ ] Non-MANAGER roles blocked from /rooms and API

---

## Notes

**Implementation Order**: Tasks should be completed in sequence (1-12) as they build on each other.

**Testing Between Tasks**: Run checkpoints after each task before proceeding to the next.

**Error Handling**: Pay special attention to error states - both expected (validation) and unexpected (network/database).

**Code Style**: Follow existing patterns from Phase 1 (auth guards, API route structure, Tailwind styling).

---

Phase 2 implementation ready to begin.
