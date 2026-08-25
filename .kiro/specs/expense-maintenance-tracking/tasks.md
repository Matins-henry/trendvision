# Phase 2.5: Expense & Maintenance Tracking - Implementation Tasks

**Feature**: Expense Logging and Maintenance Issue Tracking  
**Status**: Ready for Implementation

---

## Task Overview

| Task | Description | Status |
|------|-------------|--------|
| 1 | Create API route: POST /api/expenses (create) | ⬜ Not Started |
| 2 | Create API route: GET /api/expenses (list) | ⬜ Not Started |
| 3 | Create API route: POST /api/maintenance (create) | ⬜ Not Started |
| 4 | Create API route: GET /api/maintenance (list) | ⬜ Not Started |
| 5 | Create API route: PATCH /api/maintenance/[id]/status | ⬜ Not Started |
| 6 | Create /expenses page with auth guard | ⬜ Not Started |
| 7 | Build expense list UI (MANAGER view) | ⬜ Not Started |
| 8 | Build expense summary UI (OWNER view) | ⬜ Not Started |
| 9 | Build expense form modal (MANAGER) | ⬜ Not Started |
| 10 | Create /maintenance page with auth guard | ⬜ Not Started |
| 11 | Build maintenance list UI (MANAGER view) | ⬜ Not Started |
| 12 | Build active maintenance UI (OWNER view) | ⬜ Not Started |
| 13 | Build maintenance form modal (MANAGER) | ⬜ Not Started |
| 14 | Implement status update UI (MANAGER) | ⬜ Not Started |
| 15 | Manual testing and bug fixes | ⬜ Not Started |

**Estimated Total**: ~4-5 hours implementation

---

## Task 1: Create API Route - POST /api/expenses (Create)

**Objective**: Implement expense creation endpoint with validation

**Files**:
- `apps/admin/app/api/expenses/route.ts` (create new file)

**Implementation Steps**:
1. Create file and import dependencies (Next.js, Prisma, auth)
2. Implement `POST` handler function
3. Call `getServerStaff(request)` for authentication
4. Check `staff.role === 'MANAGER'` (403 if not)
5. Parse and validate request body
6. Validate amount > 0 with 2 decimal precision
7. Create expense with `prisma.expense.create()`
8. Return 201 with created expense data

**Request Body Validation**:
- `description`: required, string, trim whitespace, non-empty, max 255 chars
- `category`: required, string, non-empty
- `amount`: required, number, > 0, max 2 decimal places
- `date`: required, valid ISO 8601 date string
- `notes`: optional, string or null, max 1000 chars
- `loggedById`: auto-populated from `staff.id`

**Amount Validation**:
```typescript
const amountStr = body.amount.toFixed(2);
const decimalPlaces = (amountStr.split('.')[1] || '').length;
if (body.amount <= 0 || decimalPlaces > 2) {
  return Response.json({ error: 'Amount must be > 0 with max 2 decimals' }, { status: 400 });
}
```

**Error Responses**:
- 400: Missing/invalid fields, invalid amount
- 401: Not authenticated
- 403: Not MANAGER role
- 500: Database or unexpected errors

**Acceptance Criteria**:
- ✅ Authenticated MANAGER can create expense
- ✅ Validation rejects amount <= 0
- ✅ Validation rejects more than 2 decimal places
- ✅ loggedById auto-populated from authenticated staff
- ✅ Non-MANAGER receives 403
- ✅ createdAt timestamp set automatically

**Checkpoint**: Test with browser console - create expense, verify it saves

---

## Task 2: Create API Route - GET /api/expenses (List)

**Objective**: Implement endpoint to list expenses with filtering and totals

**Files**:
- `apps/admin/app/api/expenses/route.ts` (add to existing file)

**Implementation Steps**:
1. Implement `GET` handler function
2. Call `getServerStaff(request)` for authentication
3. Check `hasRole(staff, ['MANAGER', 'OWNER'])` (403 if not)
4. Parse query parameters (category filter)
5. Query expenses with optional category filter
6. Include `loggedBy` relation (staff name)
7. Calculate total with `prisma.expense.aggregate()`
8. Order by `date` descending
9. Return 200 with expenses array and total

**Query Specification**:
```typescript
const { searchParams } = new URL(request.url);
const category = searchParams.get('category');

const whereClause = category ? { category } : {};

const expenses = await prisma.expense.findMany({
  where: whereClause,
  include: {
    loggedBy: {
      select: { id: true, name: true },
    },
  },
  orderBy: { date: 'desc' },
});

const aggregateResult = await prisma.expense.aggregate({
  where: whereClause,
  _sum: { amount: true },
});

const total = aggregateResult._sum.amount?.toString() || '0.00';
```

**Response Format**:
```typescript
{
  expenses: Array<{
    id: string;
    description: string;
    category: string;
    amount: string;  // Decimal as string
    date: string;
    notes: string | null;
    createdAt: string;
    loggedBy: {
      id: string;
      name: string;
    };
  }>;
  total: string;  // Sum of all filtered expenses
}
```

**Acceptance Criteria**:
- ✅ MANAGER and OWNER can list expenses
- ✅ Expenses sorted by date descending
- ✅ Category filter works correctly
- ✅ Total calculated accurately
- ✅ loggedBy staff name included
- ✅ Non-MANAGER/OWNER receives 403

**Checkpoint**: Fetch expenses - verify test expense appears with correct total

---
Create maintenance issue - verify it saves with correct defaults

---
enticated MANAGER can create maintenance issue
- ✅ flaggedById auto-populated from authenticated staff
- ✅ status defaults to "NEEDS_ATTENTION"
- ✅ roomId validation works (404 if invalid)
- ✅ Non-MANAGER receives 403
- ✅ createdAt timestamp set automatically

**Checkpoint**: Responses**:
- 400: Missing/invalid fields
- 401: Not authenticated
- 403: Not MANAGER role
- 404: Room not found (if roomId provided)
- 500: Database or unexpected errors

**Acceptance Criteria**:
- ✅ Authired, string, trim whitespace, non-empty, max 255 chars
- `description`: required, string, non-empty
- `roomId`: optional, UUID string or null
- `status`: optional, defaults to "NEEDS_ATTENTION"
- `flaggedById`: auto-populated from `staff.id`

**Room Validation** (if roomId provided):
```typescript
if (body.roomId) {
  const room = await prisma.room.findUnique({
    where: { id: body.roomId },
  });
  
  if (!room) {
    return Response.json({ error: 'Room not found' }, { status: 404 });
  }
}
```

**Error title`: requ- `apps/admin/app/api/maintenance/route.ts` (create new file)

**Implementation Steps**:
1. Create file and import dependencies
2. Implement `POST` handler function
3. Call `getServerStaff(request)` for authentication
4. Check `staff.role === 'MANAGER'` (403 if not)
5. Parse and validate request body
6. If roomId provided, verify room exists with `prisma.room.findUnique()`
7. Create maintenance issue with `prisma.maintenanceIssue.create()`
8. Return 201 with created issue data

**Request Body Validation**:
- `
## Task 3: Create API Route - POST /api/maintenance (Create)

**Objective**: Implement maintenance issue creation endpoint

**Files**:

## Task 3: Create API Route - POST /api/maintenance (Create)

**Objective**: Implement maintenance issue creation endpoint

**Files**:
- `apps/admin/app/api/maintenance/route.ts` (create new file)

**Implementation Steps**:
1. Create file and import dependencies
2. Implement `POST` handler function
3. Call `getServerStaff(request)` for authentication
4. Check `staff.role === 'MANAGER'` (403 if not)
5. Parse and validate request body
6. If roomId provided, verify room exists
7. Create maintenance issue with `prisma.maintenanceIssue.create()`
8. Return 201 with created issue data

**Request Body Validation**:
- `title`: required, string, max 255 chars
- `description`: required, string
- `roomId`: optional, UUID or null
- `status`: optional, defaults to "NEEDS_ATTENTION"
- `flaggedById`: auto-populated from `staff.id`

**Acceptance Criteria**:
- ✅ Authenticated MANAGER can create maintenance issue
- ✅ flaggedById auto-populated
- ✅ status defaults to "NEEDS_ATTENTION"
- ✅ roomId validation works (404 if invalid)
- ✅ Non-MANAGER receives 403

**Checkpoint**: Create maintenance issue, verify it saves

---

## Task 4: Create API Route - GET /api/maintenance (List)

**Objective**: Implement endpoint to list maintenance issues with filtering

**Files**:
- `apps/admin/app/api/maintenance/route.ts` (add to existing file)

**Implementation Steps**:
1. Implement `GET` handler function
2. Call `getServerStaff(request)` for authentication
3. Check `hasRole(staff, ['MANAGER', 'OWNER'])` (403 if not)
4. Parse query parameters (status, activeOnly)
5. Build where clause based on role and filters
6. Include `room` and `flaggedBy` relations
7. Order by createdAt (desc for MANAGER, asc for OWNER)
8. Return 200 with issues array

**Query Specification**:
```typescript
const { searchParams } = new URL(request.url);
const status = searchParams.get('status');
const activeOnly = searchParams.get('activeOnly') === 'true';

let whereClause: any = {};

// OWNER sees only active issues by default
if (staff.role === 'OWNER' || activeOnly) {
  whereClause.status = { in: ['NEEDS_ATTENTION', 'IN_PROGRESS'] };
}

if (status && staff.role === 'MANAGER') {
  whereClause.status = status;
}

const issues = await prisma.maintenanceIssue.findMany({
  where: whereClause,
  include: {
    room: {
      select: { id: true, number: true },
    },
    flaggedBy: {
      select: { id: true, name: true },
    },
  },
  orderBy: { 
    createdAt: staff.role === 'OWNER' ? 'asc' : 'desc'
  },
});
```

**Acceptance Criteria**:
- ✅ MANAGER sees all issues or filtered by status
- ✅ OWNER sees only active issues (NEEDS_ATTENTION, IN_PROGRESS)
- ✅ MANAGER view: sorted newest first
- ✅ OWNER view: sorted oldest first
- ✅ Includes room number and flagged by staff name
- ✅ Non-MANAGER/OWNER receives 403

**Checkpoint**: Fetch maintenance issues, verify filtering and sorting

---

## Task 5: Create API Route - PATCH /api/maintenance/[id]/status

**Objective**: Implement endpoint to update maintenance issue status

**Files**:
- `apps/admin/app/api/maintenance/[id]/status/route.ts` (create new file)

**Implementation Steps**:
1. Create file and import dependencies
2. Implement `PATCH` handler with `id` parameter
3. Call `getServerStaff(request)` for authentication
4. Check `staff.role === 'MANAGER'` (403 if not)
5. Parse request body for new status
6. Validate status value
7. Fetch current issue to get old status
8. Build update data (set/clear resolvedAt)
9. Update with `prisma.maintenanceIssue.update()`
10. Return 200 with updated issue

**Status Update Logic**:
```typescript
const validStatuses = ['NEEDS_ATTENTION', 'IN_PROGRESS', 'RESOLVED'];
if (!validStatuses.includes(body.status)) {
  return Response.json({ error: 'Invalid status' }, { status: 400 });
}

const currentIssue = await prisma.maintenanceIssue.findUnique({
  where: { id: params.id },
});

if (!currentIssue) {
  return Response.json({ error: 'Maintenance issue not found' }, { status: 404 });
}

const updateData: any = { status: body.status };

if (body.status === 'RESOLVED') {
  updateData.resolvedAt = new Date();
} else if (currentIssue.status === 'RESOLVED') {
  updateData.resolvedAt = null;
}
```

**Acceptance Criteria**:
- ✅ MANAGER can update status
- ✅ Status changing to RESOLVED sets resolvedAt
- ✅ Status changing from RESOLVED clears resolvedAt
- ✅ Invalid status returns 400
- ✅ Non-existent ID returns 404
- ✅ Non-MANAGER receives 403

**Checkpoint**: Update issue status, verify resolvedAt behavior

---

## Task 6: Create /expenses Page with Auth Guard

**Objective**: Create expenses page with role-based views

**Files**:
- `apps/admin/app/expenses/page.tsx` (create new file)

**Implementation Steps**:
1. Create file with 'use client' directive
2. Import useStaff, useRouter, useEffect
3. Implement auth guard (redirect if not logged in)
4. Check `hasRole(['MANAGER', 'OWNER'])` - access denied if false
5. Detect role and conditionally render views
6. Add page header and navigation
7. Add placeholders for MANAGER/OWNER-specific content

**Page Structure**:
```typescript
'use client';

export default function ExpensesPage() {
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

  if (!hasRole(['MANAGER', 'OWNER'])) {
    return <AccessDenied />;
  }

  // Render MANAGER or OWNER view based on role
  return (
    <div className="min-h-screen bg-stone-50">
      <Navigation />
      {staff.role === 'MANAGER' ? (
        <ManagerExpensesView />
      ) : (
        <OwnerExpenseSummaryView />
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- ✅ MANAGER can access /expenses
- ✅ OWNER can access /expenses
- ✅ RECEPTIONIST sees access denied
- ✅ Unauthenticated redirected to /login
- ✅ Role-specific views render correctly

**Checkpoint**: Login as MANAGER and OWNER, verify both can access page

---

## Task 7: Build Expense List UI (MANAGER View)

**Objective**: Display expense list with filtering for MANAGER

**Files**:
- `apps/admin/app/expenses/page.tsx` (update existing)

**Implementation Steps**:
1. Add state: `expenses`, `total`, `category Filter`, `isLoading`, `error`
2. Add useEffect to fetch expenses on mount/filter change
3. Call GET /api/expenses with authenticatedFetch()
4. Add category filter dropdown
5. Render table with expense data
6. Display total at top
7. Add "Log Expense" button
8. Handle loading/error/empty states

**UI Components**:
- Header with "Log Expense" button (deep teal #0F766E)
- Category filter dropdown (All, Utilities, Supplies, Maintenance, etc.)
- Total display (large, prominent)
- Expense table with columns:
  - Date
  - Description
  - Category
  - Amount (formatted as currency)
  - Logged By
  - Notes

**Styling**:
- Deep teal primary color
- Card-based layout with subtle shadows
- Soft off-white backgrounds (stone-50)
- Rounded buttons with hover transitions
- Table rows with zebra striping

**Acceptance Criteria**:
- ✅ Expenses display in table sorted by date
- ✅ Category filter updates list
- ✅ Total updates with filtered expenses
- ✅ Amount formatted as currency ($120.50)
- ✅ Empty state shows "No expenses yet"
- ✅ Loading state shows during fetch

**Checkpoint**: Verify test expense appears in table with correct formatting

---

## Task 8: Build Expense Summary UI (OWNER View)

**Objective**: Display expense breakdown by category for OWNER

**Files**:
- `apps/admin/app/expenses/page.tsx` (update existing)

**Implementation Steps**:
1. Add state: `expenses`, `totalAmount`, `isLoading`, `error`
2. Fetch all expenses on mount
3. Group expenses by category client-side
4. Calculate category totals
5. Sort categories by total descending
6. Render category cards with totals
7. Display overall total at top
8. Handle loading/error/empty states

**Category Grouping Logic**:
```typescript
const groupedExpenses = expenses.reduce((acc, expense) => {
  if (!acc[expense.category]) {
    acc[expense.category] = {
      category: expense.category,
      total: 0,
      count: 0,
    };
  }
  acc[expense.category].total += parseFloat(expense.amount);
  acc[expense.category].count += 1;
  return acc;
}, {} as Record<string, { category: string; total: number; count: number }>);

const categorySummaries = Object.values(groupedExpenses)
  .sort((a, b) => b.total - a.total);
```

**UI Components**:
- Header "Expense Overview"
- Overall total card (large, prominent)
- Category summary cards grid
  - Category name
  - Total amount (currency formatted)
  - Expense count

**Styling**:
- Card-based grid layout
- Deep teal accents
- Soft shadows and rounded corners
- Clear typography hierarchy

**Acceptance Criteria**:
- ✅ Expenses grouped by category
- ✅ Category totals accurate
- ✅ Categories sorted by total (highest first)
- ✅ Overall total matches sum of categories
- ✅ Empty state shows "No expenses recorded"
- ✅ Read-only view (no edit buttons)

**Checkpoint**: Verify expense summary displays correctly for OWNER

---

## Task 9: Build Expense Form Modal (MANAGER)

**Objective**: Create modal form for logging expenses

**Files**:
- `apps/admin/app/expenses/page.tsx` (add to existing)

**Implementation Steps**:
1. Add state for modal: `isModalOpen`, `formData`, `formErrors`, `isSubmitting`
2. Create form component (inline or separate)
3. Add controlled inputs for all fields
4. Wire up "Log Expense" button to open modal
5. Implement form submit handler (POST /api/expenses)
6. Add form close/cancel handler
7. Style form with deep teal design system
8. Add client-side validation

**Form Fields**:
- Description (text input, required, max 255 chars)
- Category (dropdown, required)
  - Options: Utilities, Supplies, Maintenance, Payroll, Marketing, Insurance, Other
- Amount (number input, required, min 0.01, step 0.01)
- Date (date picker, required)
- Notes (textarea, optional, max 1000 chars)

**Submit Logic**:
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    const response = await authenticatedFetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to log expense');
    }
    
    setIsModalOpen(false);
    await fetchExpenses(); // Refresh list
    // Show success toast
  } catch (error) {
    setFormErrors({ general: error.message });
  } finally {
    setIsSubmitting(false);
  }
};
```

**Acceptance Criteria**:
- ✅ "Log Expense" opens empty form
- ✅ Form submission creates expense (POST)
- ✅ Modal closes on successful submit
- ✅ Expense list refreshes after create
- ✅ Submit button disabled during API call
- ✅ Cancel button closes modal
- ✅ Validation prevents invalid submissions
- ✅ Blurred backdrop effect

**Checkpoint**: Create expense via form, verify it appears in list

---

## Task 10: Create /maintenance Page with Auth Guard

**Objective**: Create maintenance page with role-based views

**Files**:
- `apps/admin/app/maintenance/page.tsx` (create new file)

**Implementation Steps**:
1. Create file with 'use client' directive
2. Import useStaff, useRouter, useEffect
3. Implement auth guard (redirect if not logged in)
4. Check `hasRole(['MANAGER', 'OWNER'])` - access denied if false
5. Detect role and conditionally render views
6. Add page header and navigation
7. Add placeholders for MANAGER/OWNER-specific content

**Page Structure**:
```typescript
'use client';

export default function MaintenancePage() {
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

  if (!hasRole(['MANAGER', 'OWNER'])) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navigation />
      {staff.role === 'MANAGER' ? (
        <ManagerMaintenanceView />
      ) : (
        <OwnerMaintenanceView />
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- ✅ MANAGER can access /maintenance
- ✅ OWNER can access /maintenance
- ✅ RECEPTIONIST sees access denied
- ✅ Unauthenticated redirected to /login
- ✅ Role-specific views render correctly

**Checkpoint**: Login as MANAGER and OWNER, verify access

---

## Task 11: Build Maintenance List UI (MANAGER View)

**Objective**: Display maintenance issues with filtering for MANAGER

**Files**:
- `apps/admin/app/maintenance/page.tsx` (update existing)

**Implementation Steps**:
1. Add state: `issues`, `statusFilter`, `isLoading`, `error`
2. Add useEffect to fetch issues on mount/filter change
3. Call GET /api/maintenance with authenticatedFetch()
4. Add status filter dropdown (All, Needs Attention, In Progress, Resolved)
5. Render card-based grid
6. Add "Flag Issue" button
7. Display issue count
8. Handle loading/error/empty states

**UI Components**:
- Header with "Flag Issue" button (deep teal)
- Status filter dropdown
- Issue count badge
- Maintenance issue cards:
  - Status badge (soft rounded pill)
    - Green: NEEDS_ATTENTION
    - Amber: IN_PROGRESS
    - Gray: RESOLVED
  - Title (prominent)
  - Description
  - Room number (if assigned)
  - Flagged by staff name
  - Flagged date
  - Status update dropdown (inline)

**Card Styling**:
- White background with subtle shadow
- Rounded corners
- Hover effect (slight lift)
- Status badges as colored pills
- Clear visual hierarchy

**Acceptance Criteria**:
- ✅ Issues display in cards sorted by date
- ✅ Status filter updates list
- ✅ Status badges show correct colors
- ✅ Room number displays when assigned
- ✅ Empty state shows "No maintenance issues"
- ✅ Loading state shows during fetch

**Checkpoint**: Verify test issue appears with correct status badge

---

## Task 12: Build Active Maintenance UI (OWNER View)

**Objective**: Display only active maintenance issues for OWNER

**Files**:
- `apps/admin/app/maintenance/page.tsx` (update existing)

**Implementation Steps**:
1. Add state: `activeIssues`, `isLoading`, `error`
2. Fetch issues with `activeOnly=true` parameter
3. Display issue count at top
4. Render read-only card-based grid
5. Sort by createdAt ascending (oldest first)
6. Handle loading/error/empty states

**UI Components**:
- Header "Active Maintenance Issues"
- Active issue count badge
- Read-only maintenance cards:
  - Status badge (green/amber only)
  - Title
  - Description
  - Room number (if assigned)
  - Flagged by staff name
  - Flagged date (with age indicator like "3 days ago")

**Card Styling**:
- Similar to MANAGER view but read-only
- No status update dropdown
- Clear "read-only" visual cues
- Oldest issues visually prominent (top of list)

**Acceptance Criteria**:
- ✅ Shows only NEEDS_ATTENTION and IN_PROGRESS issues
- ✅ RESOLVED issues excluded
- ✅ Sorted oldest first (highlights issues needing attention)
- ✅ Active count accurate
- ✅ Empty state shows "No active maintenance issues"
- ✅ Read-only (no edit capability)

**Checkpoint**: Verify OWNER sees only active issues, oldest first

---

## Task 13: Build Maintenance Form Modal (MANAGER)

**Objective**: Create modal form for flagging maintenance issues

**Files**:
- `apps/admin/app/maintenance/page.tsx` (add to existing)

**Implementation Steps**:
1. Add state for modal: `isModalOpen`, `formData`, `formErrors`, `isSubmitting`
2. Fetch room list for dropdown (GET /api/rooms)
3. Create form component
4. Add controlled inputs for all fields
5. Wire up "Flag Issue" button to open modal
6. Implement form submit handler (POST /api/maintenance)
7. Add form close/cancel handler
8. Style form with deep teal design system

**Form Fields**:
- Title (text input, required, max 255 chars)
- Description (textarea, required)
- Room (dropdown, optional)
  - Options: "No room assigned" + list of rooms by number
- Status (dropdown, defaults to "NEEDS_ATTENTION")
  - Options: Needs Attention, In Progress

**Submit Logic**:
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    const response = await authenticatedFetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        roomId: formData.roomId || null,
        status: formData.status || 'NEEDS_ATTENTION',
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to flag issue');
    }
    
    setIsModalOpen(false);
    await fetchIssues(); // Refresh list
    // Show success toast
  } catch (error) {
    setFormErrors({ general: error.message });
  } finally {
    setIsSubmitting(false);
  }
};
```

**Acceptance Criteria**:
- ✅ "Flag Issue" opens empty form
- ✅ Form submission creates issue (POST)
- ✅ Room dropdown populated from API
- ✅ Modal closes on successful submit
- ✅ Issue list refreshes after create
- ✅ Submit button disabled during API call
- ✅ Cancel button closes modal
- ✅ Validation prevents invalid submissions

**Checkpoint**: Create maintenance issue via form, verify it appears

---

## Task 14: Implement Status Update UI (MANAGER)

**Objective**: Add inline status update dropdown for MANAGER

**Files**:
- `apps/admin/app/maintenance/page.tsx` (update existing)

**Implementation Steps**:
1. Add status dropdown to each maintenance card
2. Add change handler to call PATCH /api/maintenance/[id]/status
3. Show loading state during update
4. Update UI optimistically or refresh list
5. Handle errors with toast notification

**Status Update Handler**:
```typescript
const handleStatusChange = async (issueId: string, newStatus: string) => {
  try {
    const response = await authenticatedFetch(
      `/api/maintenance/${issueId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update status');
    }
    
    await fetchIssues(); // Refresh list
    // Show success toast
  } catch (error) {
    // Show error toast
    console.error('Status update failed:', error);
  }
};
```

**Status Dropdown**:
- Dropdown with three options:
  - Needs Attention
  - In Progress
  - Resolved
- Current status pre-selected
- Styled to match card design
- Shows loading spinner during update

**Acceptance Criteria**:
- ✅ Status dropdown on each card (MANAGER only)
- ✅ Current status pre-selected
- ✅ Changing status updates via API
- ✅ List refreshes after update
- ✅ Success feedback shown
- ✅ Errors handled gracefully

**Checkpoint**: Change issue status, verify resolvedAt behavior

---

## Task 15: Manual Testing and Bug Fixes

**Objective**: Test all functionality end-to-end and fix any issues

**Test Checklist**:

### Authentication & Authorization

**Expenses**:
- [ ] Login as MANAGER → Can access /expenses with full CRUD
- [ ] Login as OWNER → Can access /expenses (read-only summary)
- [ ] Login as RECEPTIONIST → Cannot access /expenses (403)
- [ ] Access /expenses without login → Redirected to /login
- [ ] API call as RECEPTIONIST → Returns 403
- [ ] API call as OWNER to POST /api/expenses → Returns 403

**Maintenance**:
- [ ] Login as MANAGER → Can access /maintenance with full CRUD
- [ ] Login as OWNER → Can access /maintenance (read-only active issues)
- [ ] Login as RECEPTIONIST → Cannot access /maintenance (403)
- [ ] Access /maintenance without login → Redirected to /login
- [ ] API call as RECEPTIONIST → Returns 403
- [ ] API call as OWNER to POST /api/maintenance → Returns 403

### Expense Management (MANAGER)

**Create Expense**:
- [ ] Click "Log Expense" → Form opens empty
- [ ] Submit empty form → Validation errors show
- [ ] Enter amount = 0 → Error shows
- [ ] Enter amount with 3 decimals → Error shows
- [ ] Create expense with all valid fields → Success, expense appears
- [ ] Created expense has correct loggedById (current staff)
- [ ] createdAt timestamp is accurate

**List Expenses**:
- [ ] Page loads → Expenses fetch and display
- [ ] Multiple expenses → Sorted by date descending
- [ ] Category filter → Shows only matching expenses
- [ ] Total updates with filtered expenses
- [ ] No expenses → Empty state shows
- [ ] API error → Error message shows

### Expense Overview (OWNER)

- [ ] Page loads → Expense summary displays
- [ ] Expenses grouped by category
- [ ] Category totals calculated correctly
- [ ] Categories sorted by total descending
- [ ] Overall total matches sum of categories
- [ ] No expenses → Empty state shows
- [ ] Cannot create expenses (button hidden)

### Maintenance Management (MANAGER)

**Create Maintenance Issue**:
- [ ] Click "Flag Issue" → Form opens empty
- [ ] Submit empty form → Validation errors show
- [ ] Select room from dropdown → Room assigned
- [ ] Leave room unassigned → Issue created without room
- [ ] Create issue → Success, issue appears
- [ ] Status defaults to "NEEDS_ATTENTION"
- [ ] flaggedById is current staff

**List Maintenance Issues**:
- [ ] Page loads → Issues fetch and display
- [ ] Status badges show correct colors
- [ ] Room number displays when assigned
- [ ] Flagged by staff name shows
- [ ] Status filter → Shows only matching issues
- [ ] No issues → Empty state shows
- [ ] API error → Error message shows

**Update Status**:
- [ ] Change status to "IN_PROGRESS" → Updates successfully
- [ ] Change status to "RESOLVED" → resolvedAt timestamp set
- [ ] Change status from "RESOLVED" to "IN_PROGRESS" → resolvedAt cleared
- [ ] Status update fails → Error message shows
- [ ] List refreshes after update

### Maintenance Overview (OWNER)

- [ ] Page loads → Active issues display
- [ ] Only NEEDS_ATTENTION and IN_PROGRESS shown
- [ ] RESOLVED issues excluded
- [ ] Issues sorted by createdAt ascending (oldest first)
- [ ] Active count is accurate
- [ ] No active issues → Empty state shows
- [ ] Cannot flag issues (button hidden)
- [ ] Cannot update status (dropdown hidden)

### Data Integrity

**Expenses**:
- [ ] Amount stored with 2 decimal precision
- [ ] Validation prevents amount <= 0
- [ ] Validation prevents > 2 decimals
- [ ] loggedById links to correct staff user
- [ ] Date field stores as timestamptz
- [ ] Category filter works accurately
- [ ] Total calculation accurate

**Maintenance**:
- [ ] Status defaults to "NEEDS_ATTENTION"
- [ ] roomId validates (404 for invalid room)
- [ ] flaggedById links to correct staff user
- [ ] resolvedAt set when status = "RESOLVED"
- [ ] resolvedAt cleared when status changes from "RESOLVED"
- [ ] Status filter works accurately

### UI/UX

**Design System Consistency**:
- [ ] Deep teal (#0F766E) used for primary actions
- [ ] Soft off-white backgrounds (stone-50)
- [ ] Card-based layouts with subtle shadows
- [ ] Rounded corners on buttons and cards
- [ ] Status badges as soft rounded pills
- [ ] Blurred modal backdrops
- [ ] Consistent with /rooms page design

**Interaction Feedback**:
- [ ] Loading states show during API calls
- [ ] Success messages show after operations
- [ ] Error messages show when operations fail
- [ ] Modals close on successful submit
- [ ] Submit buttons disabled during API call
- [ ] Form validation gives clear feedback
- [ ] Hover effects on interactive elements

### Navigation

- [ ] Update Navigation component to include /expenses and /maintenance links
- [ ] MANAGER sees /rooms, /expenses, /maintenance links
- [ ] OWNER sees /expenses, /maintenance links (not /rooms)
- [ ] RECEPTIONIST sees /bookings link only (future)
- [ ] Active page highlighted in navigation

### Bug Fixes

- Document any bugs found during testing
- Fix bugs before marking task complete
- Retest after fixes

---

## Completion Checklist

Before marking Phase 2.5 complete, verify:

- [ ] Task 1: POST /api/expenses works correctly
- [ ] Task 2: GET /api/expenses works correctly
- [ ] Task 3: POST /api/maintenance works correctly
- [ ] Task 4: GET /api/maintenance works correctly
- [ ] Task 5: PATCH /api/maintenance/[id]/status works correctly
- [ ] Task 6: /expenses page auth guard working
- [ ] Task 7: Expense list (MANAGER) displays correctly
- [ ] Task 8: Expense summary (OWNER) displays correctly
- [ ] Task 9: Expense form creates expenses
- [ ] Task 10: /maintenance page auth guard working
- [ ] Task 11: Maintenance list (MANAGER) displays correctly
- [ ] Task 12: Active maintenance (OWNER) displays correctly
- [ ] Task 13: Maintenance form creates issues
- [ ] Task 14: Status update working
- [ ] Task 15: All manual tests pass

**Final Verification**:
- [ ] npm run build succeeds in admin app
- [ ] No TypeScript errors
- [ ] Three test users can login and access appropriate pages
- [ ] MANAGER has full CRUD on expenses and maintenance
- [ ] OWNER has read-only access to both features
- [ ] Navigation updated with new links
- [ ] Design system consistent with Phase 2

---

## Notes

**Implementation Order**: Tasks should be completed in sequence (1-15) as they build on each other.

**Testing Between Tasks**: Run checkpoints after each task before proceeding.

**API Authentication**: Use `getServerStaff(request)` pattern from Phase 2 for consistency.

**Client Fetching**: Use `authenticatedFetch()` helper from Phase 2 for API calls.

**Error Handling**: Provide clear error messages for both validation and unexpected errors.

**Code Style**: Follow existing patterns from Phase 2 (auth guards, API routes, Tailwind styling).

**Design System**: Maintain deep teal (#0F766E) color scheme and card-based layouts.

---

Phase 2.5 implementation ready to begin.
