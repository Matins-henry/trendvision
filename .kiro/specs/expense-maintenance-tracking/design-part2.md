## Error Handling

### Client-Side Error Handling

**Error Types**:
1. **Validation errors**: Display inline below form fields
2. **Network errors**: Show toast notification "Unable to connect. Please try again."
3. **API errors (4xx/5xx)**: Parse error message, show in modal or toast
4. **Authorization errors (403)**: Redirect to `/access-denied` page

**Error Display Strategy**:
```typescript
try {
  const response = await authenticatedFetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 403) {
      router.push('/access-denied');
      return;
    }
    throw new Error(error.error || 'Operation failed');
  }
  
  // Success handling...
  setSuccess(true);
  await loadData();
  closeModal();
} catch (error) {
  setErrorMessage(error.message);
  // Keep modal open, show error inline
}
```

### Server-Side Error Handling

**Error Response Format**:
```typescript
// Validation error
{
  error: 'Description is required',
  field: 'description',
  code: 'REQUIRED_FIELD'
}

// Authorization error
{
  error: 'Forbidden. Manager role required.'
}

// Not found
{
  error: 'Maintenance issue not found',
  code: 'NOT_FOUND'
}

// Invalid input
{
  error: 'Amount must be greater than zero',
  field: 'amount',
  code: 'INVALID_VALUE'
}

// Generic server error
{
  error: 'Internal server error'
}
```

**Error Logging Strategy**:
- Log all 500 errors with stack trace
- Include request context (method, path, user ID, role)
- Do NOT expose sensitive data in client error messages
- Log validation errors at debug level only

### API Route Error Handling Pattern

```typescript
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const staff = await getServerStaff(request);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (staff.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden. Manager role required.' },
        { status: 403 }
      );
    }

    // Parse and validate
    const body = await request.json();
    
    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: 'Description is required', field: 'description' },
        { status: 400 }
      );
    }
    
    // ... more validation
    
    // Database operation
    const expense = await prisma.expense.create({ data: { ... } });
    return NextResponse.json(expense, { status: 201 });
    
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Testing Strategy

This feature requires comprehensive testing with both unit tests and property-based tests to ensure correctness across all input combinations.

### Testing Approach

**Dual Testing Strategy**:
- **Unit tests**: Specific examples, edge cases, and error conditions
- **Property-based tests**: Universal properties verified across 100+ random inputs

**Balance**:
- Unit tests focus on specific scenarios and integration points
- Property tests handle comprehensive input coverage through randomization
- Both are complementary and necessary for full confidence

### Property-Based Testing

**Library**: Fast-check (TypeScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test to catch edge cases through randomization.

**Test Tagging**: Each property test must reference its design document property:
```typescript
// Feature: expense-maintenance-tracking, Property 8: Expense total calculation accuracy
test('expense totals equal sum of amounts', async () => {
  await fc.assert(
    fc.asyncProperty(expenseArrayArbitrary, async (expenses) => {
      // Property test implementation
    }),
    { numRuns: 100 }
  );
});
```

### Property-Based Tests to Implement

**Property 2: Positive amount with decimal precision**
```typescript
// Test that valid amounts (positive, ≤2 decimals) are accepted
// Test that invalid amounts (zero, negative, >2 decimals) are rejected
```

**Property 3: Authenticated user tracking**
```typescript
// For random expense/maintenance data, verify loggedById/flaggedById
// equals authenticated user ID
```

**Property 5: Expense sorting by date descending**
```typescript
// Generate random expense arrays, verify API returns sorted by date desc
```

**Property 7: Category filter correctness**
```typescript
// For random category values, verify all returned expenses match filter
```

**Property 8: Expense total calculation accuracy**
```typescript
// For random expense arrays, verify displayed total = sum of amounts
```

**Property 13: Valid status transitions**
```typescript
// Generate random status values, verify only valid ones accepted
```

**Property 15: Resolved timestamp clearing (round-trip)**
```typescript
// For any issue, resolve → unresolve should clear resolvedAt
```

**Property 17: Category total calculation accuracy**
```typescript
// For random expense data, verify each category total = sum within category
```

**Property 20: Active issues filtering**
```typescript
// For random issue arrays, verify OWNER view excludes RESOLVED
```

**Property 23-25: Authorization properties**
```typescript
// For each role, verify correct access patterns to all endpoints
```

### Unit Tests to Implement

**Edge Cases**:
- Empty expense list displays empty state
- Empty maintenance list displays empty state
- Expense with no notes field (null) renders correctly
- Maintenance issue with no room (roomId = null) renders correctly
- Category filter with non-existent category returns empty array
- Status filter with "RESOLVED" for OWNER returns empty (excluded)

**Specific Examples**:
- Create expense with all fields populated
- Create expense with only required fields
- Create maintenance issue with room association
- Create maintenance issue without room association
- Update status NEEDS_ATTENTION → IN_PROGRESS → RESOLVED
- Verify resolvedAt timestamp set when marking RESOLVED

**Error Conditions**:
- POST /api/expenses without authentication returns 401
- POST /api/expenses as OWNER returns 403
- POST /api/expenses as RECEPTIONIST returns 403
- POST /api/expenses with missing description returns 400
- POST /api/expenses with amount = 0 returns 400
- POST /api/maintenance with invalid roomId returns 400/404
- PATCH /api/maintenance/[id]/status with invalid status returns 400

**Integration Tests**:
- Full flow: MANAGER creates expense → views in list → total calculated
- Full flow: MANAGER flags issue → updates status → OWNER sees in overview
- Role-based views: MANAGER sees all data, OWNER sees read-only summaries

### Manual Testing Checklist

**Expense Features (MANAGER)**:
- [ ] Log expense with all fields → Success, appears in list
- [ ] Log expense with only required fields → Success
- [ ] Try to log expense with empty description → Error displayed
- [ ] Try to log expense with amount = 0 → Error displayed
- [ ] Apply category filter "Utilities" → Only utilities shown
- [ ] Clear category filter → All expenses shown
- [ ] Verify total displays correctly (sum of amounts)
- [ ] Verify expenses sorted by date descending

**Maintenance Features (MANAGER)**:
- [ ] Flag issue with room association → Success, room number shown
- [ ] Flag issue without room → Success, no room shown
- [ ] Update status NEEDS_ATTENTION → IN_PROGRESS → Success
- [ ] Update status IN_PROGRESS → RESOLVED → resolvedAt populated
- [ ] Update status RESOLVED → NEEDS_ATTENTION → resolvedAt cleared
- [ ] Apply status filter "NEEDS_ATTENTION" → Only those shown
- [ ] Verify issues sorted by createdAt descending

**OWNER View**:
- [ ] View expense summary → Grouped by category
- [ ] Verify category totals correct
- [ ] Verify overall total correct
- [ ] Verify categories sorted by total descending
- [ ] View maintenance overview → Only active issues shown
- [ ] Verify RESOLVED issues excluded
- [ ] Verify issues sorted by createdAt ascending (oldest first)

**Access Control**:
- [ ] Login as MANAGER → Can create and update expenses/maintenance
- [ ] Login as OWNER → Can view summaries, cannot create/update
- [ ] Login as RECEPTIONIST → Cannot access page (redirect or error)
- [ ] Direct API call as OWNER to POST /api/expenses → 403
- [ ] Direct API call as RECEPTIONIST to GET /api/expenses → 403

---

## UI/UX Design

### Reports Page - MANAGER View

**Layout**:
```
┌────────────────────────────────────────────────────────────┐
│  Hotel Management System         Manager Name (MANAGER)    │
└────────────────────────────────────────────────────────────┘

  [ Expenses ] [ Maintenance ]                    (Tab nav)

  ┌─────────────────────── EXPENSES TAB ─────────────────────┐
  │                                                           │
  │  Expenses                                 [+ Log Expense] │
  │                                                           │
  │  Filter: [All Categories ▼]    Total: $4,250.00         │
  │                                                           │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ Date      │ Description  │ Category  │ Amount     │  │
  │  ├───────────┼──────────────┼───────────┼────────────┤  │
  │  │ Jan 15    │ Water bill   │ Utilities │ $150.00    │  │
  │  │ Jan 14    │ Cleaning     │ Supplies  │ $85.50     │  │
  │  │ Jan 12    │ AC repair    │ Maint.    │ $450.00    │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                           │
  └───────────────────────────────────────────────────────────┘

  ┌──────────────────── MAINTENANCE TAB ─────────────────────┐
  │                                                           │
  │  Maintenance Issues                   [+ Flag New Issue] │
  │                                                           │
  │  Filter: [All Statuses ▼]           Active: 5 issues    │
  │                                                           │
  │  ┌──────────────────────────────────────────────────┐   │
  │  │  🔴 NEEDS ATTENTION                Room 201       │   │
  │  │  Leaking faucet in bathroom                      │   │
  │  │  Flagged Jan 10 by John Smith                    │   │
  │  │  Status: [Needs Attention ▼]                     │   │
  │  └──────────────────────────────────────────────────┘   │
  │                                                           │
  │  ┌──────────────────────────────────────────────────┐   │
  │  │  🟡 IN PROGRESS                    Room 102      │   │
  │  │  Air conditioning not cooling properly           │   │
  │  │  Flagged Jan 8 by Sarah Johnson                  │   │
  │  │  Status: [In Progress ▼]                         │   │
  │  └──────────────────────────────────────────────────┘   │
  │                                                           │
  └───────────────────────────────────────────────────────────┘
```

### Reports Page - OWNER View

**Layout**:
```
┌────────────────────────────────────────────────────────────┐
│  Hotel Management System         Owner Name (OWNER)        │
└────────────────────────────────────────────────────────────┘

  Operational Overview

  ┌────────────────── EXPENSE SUMMARY ──────────────────────┐
  │                                                          │
  │  Total Expenses: $4,250.00                              │
  │                                                          │
  │  ┌──────────────────┐  ┌──────────────────┐           │
  │  │  Maintenance     │  │  Utilities        │           │
  │  │  $1,850.00       │  │  $1,200.00        │           │
  │  │  12 expenses     │  │  8 expenses       │           │
  │  └──────────────────┘  └──────────────────┘           │
  │                                                          │
  │  ┌──────────────────┐  ┌──────────────────┐           │
  │  │  Supplies        │  │  Payroll          │           │
  │  │  $850.00         │  │  $350.00          │           │
  │  │  15 expenses     │  │  2 expenses       │           │
  │  └──────────────────┘  └──────────────────┘           │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ┌───────────── ACTIVE MAINTENANCE ISSUES ─────────────────┐
  │                                                          │
  │  Outstanding Issues: 5                                  │
  │                                                          │
  │  ┌────────────────────────────────────────────────────┐ │
  │  │  🔴 NEEDS ATTENTION        Room 201                │ │
  │  │  Leaking faucet in bathroom                        │ │
  │  │  Flagged 5 days ago by John Smith                  │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                          │
  │  ┌────────────────────────────────────────────────────┐ │
  │  │  🟡 IN PROGRESS            Room 102                │ │
  │  │  Air conditioning not cooling properly             │ │
  │  │  Flagged 7 days ago by Sarah Johnson               │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

### Visual Design System

**Colors** (Deep teal from Phase 2):
- Primary: `#0F766E` (teal-700)
- Primary hover: `#115E59` (teal-800)
- Primary light: `#CCFBF1` (teal-100)
- Success: `#059669` (emerald-600)
- Warning: `#D97706` (amber-600)
- Danger: `#DC2626` (red-600)
- Background: `#FAFAF9` (stone-50)
- Card: `#FFFFFF` with soft shadow

**Status Badge Colors**:
- NEEDS_ATTENTION: Red badge (#DC2626)
- IN_PROGRESS: Amber badge (#D97706)
- RESOLVED: Green badge (#059669)
- ACTIVE (general): Emerald badge (#059669)

**Typography**:
- Headers: Font weight 600 (semibold), gray-800
- Body: Font weight 400 (normal), gray-600
- Labels: Font weight 500 (medium), gray-700, text-sm

**Component Styling**:
- Cards: Rounded corners (12px), soft shadow, white background
- Buttons: Rounded (8px), medium font weight, transition on hover
- Inputs: Border gray-300, focus ring teal-500
- Modals: Backdrop blur, rounded (16px), max-width 2xl

### Expense Form Modal

**Layout**:
```
┌─────────────────────────────────────────┐
│  Log New Expense                    [×] │
├─────────────────────────────────────────┤
│                                          │
│  Description *                           │
│  ┌────────────────────────────────────┐ │
│  │ Water and electricity bill        │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Category *                              │
│  ┌────────────────────────────────────┐ │
│  │ Utilities                       ▼  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Amount ($) *                            │
│  ┌────────────────────────────────────┐ │
│  │ 150.00                             │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Date *                                  │
│  ┌────────────────────────────────────┐ │
│  │ 2024-01-15                         │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Notes (optional)                        │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│             [Cancel]  [Log Expense]      │
└─────────────────────────────────────────┘
```

**Category Dropdown Options**:
- Utilities
- Supplies
- Maintenance
- Payroll
- Marketing
- Insurance
- Other

**Validation**:
- Description: Required, max 255 chars
- Category: Required, select from dropdown
- Amount: Required, number > 0, max 2 decimals
- Date: Required, date picker (default: today)
- Notes: Optional, max 1000 chars

### Maintenance Form Modal

**Layout**:
```
┌─────────────────────────────────────────┐
│  Flag Maintenance Issue             [×] │
├─────────────────────────────────────────┤
│                                          │
│  Title *                                 │
│  ┌────────────────────────────────────┐ │
│  │ Leaking faucet                     │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Description *                           │
│  ┌────────────────────────────────────┐ │
│  │ Bathroom sink faucet has slow     │ │
│  │ leak that needs repair            │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Room (optional)                         │
│  ┌────────────────────────────────────┐ │
│  │ 201                             ▼  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Status                                  │
│  ┌────────────────────────────────────┐ │
│  │ Needs Attention                    │ │
│  └────────────────────────────────────┘ │
│  (Auto-set for new issues)               │
│                                          │
│            [Cancel]  [Flag Issue]        │
└─────────────────────────────────────────┘
```

**Room Dropdown**:
- Fetched from `/api/rooms`
- Display format: "Room {number} - {type}"
- Optional field (can be general facility issue)

**Validation**:
- Title: Required, max 255 chars
- Description: Required, no max length
- Room: Optional, must be valid room ID if selected
- Status: Auto-set to "NEEDS_ATTENTION", read-only in create form

### Loading and Empty States

**Loading State**:
```
┌────────────────────────────────────────┐
│                                         │
│      ⟳ Loading expenses...              │
│                                         │
└────────────────────────────────────────┘
```

**Empty State (No Expenses)**:
```
┌────────────────────────────────────────┐
│                                         │
│      📊 No expenses recorded yet        │
│                                         │
│      Click "Log Expense" to add one     │
│                                         │
└────────────────────────────────────────┘
```

**Empty State (No Maintenance Issues)**:
```
┌────────────────────────────────────────┐
│                                         │
│      ✅ No outstanding maintenance      │
│                                         │
│      All issues resolved!               │
│                                         │
└────────────────────────────────────────┘
```

---

## Security and Authorization

### Role-Based Access Matrix

| Feature | MANAGER | OWNER | RECEPTIONIST |
|---------|---------|-------|--------------|
| View /reports page | ✅ Full CRUD | ✅ Read-only | ❌ Access denied |
| Create expense | ✅ Yes | ❌ 403 | ❌ 403 |
| View expenses | ✅ All | ✅ Summaries | ❌ 403 |
| Create maintenance | ✅ Yes | ❌ 403 | ❌ 403 |
| View maintenance | ✅ All | ✅ Active only | ❌ 403 |
| Update maintenance status | ✅ Yes | ❌ 403 | ❌ 403 |

### Page-Level Authorization

```typescript
// apps/admin/app/reports/page.tsx
export default function ReportsPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      try {
        const currentStaff = await getCurrentStaff();
        
        if (!currentStaff) {
          router.push('/login');
          return;
        }

        if (!['MANAGER', 'OWNER'].includes(currentStaff.role)) {
          router.push('/access-denied');
          return;
        }

        setStaff(currentStaff);
        setLoading(false);
      } catch (err) {
        console.error('Access check error:', err);
        router.push('/login');
      }
    }

    checkAccess();
  }, [router]);

  if (loading) {
    return <LoadingState />;
  }

  // Render role-appropriate view
  if (staff?.role === 'MANAGER') {
    return <ManagerView staff={staff} />;
  }

  if (staff?.role === 'OWNER') {
    return <OwnerView staff={staff} />;
  }

  return null;
}
```

### API Route Authorization Pattern

```typescript
export async function POST(request: NextRequest) {
  try {
    const staff = await getServerStaff(request);
    
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (staff.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden. Manager role required.' },
        { status: 403 }
      );
    }

    // Proceed with operation...
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const staff = await getServerStaff(request);
    
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!['MANAGER', 'OWNER'].includes(staff.role)) {
      return NextResponse.json(
        { error: 'Forbidden. Manager or Owner role required.' },
        { status: 403 }
      );
    }

    // Role-specific query logic
    if (staff.role === 'OWNER') {
      // Return summaries, active issues only
    } else {
      // Return full data
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Security Best Practices

1. **Never trust client data**: Always validate on server
2. **Enforce authorization at API level**: Page guards can be bypassed
3. **Use parameterized queries**: Prisma handles SQL injection prevention
4. **Log security events**: Track unauthorized access attempts
5. **Sanitize user inputs**: Trim whitespace, validate formats
6. **Use HTTPS only**: Ensure bearer tokens transmitted securely
7. **Rate limiting**: Consider adding to prevent abuse (future phase)

---

## Performance Considerations

### Database Query Optimization

**Expense List Query** (with relations):
```typescript
const expenses = await prisma.expense.findMany({
  where: category ? { category } : {},
  include: {
    loggedBy: {
      select: { id: true, name: true },
    },
  },
  orderBy: { date: 'desc' },
  take: 100,  // Limit results, paginate if needed
});
```

**Maintenance List Query** (with relations):
```typescript
const issues = await prisma.maintenanceIssue.findMany({
  where: {
    status: { in: ['NEEDS_ATTENTION', 'IN_PROGRESS'] },
  },
  include: {
    room: {
      select: { id: true, number: true },
    },
    flaggedBy: {
      select: { id: true, name: true },
    },
  },
  orderBy: { createdAt: 'asc' },
});
```

**Aggregate Queries** (for totals):
```typescript
// Efficient: Single aggregate query
const result = await prisma.expense.aggregate({
  where: category ? { category } : {},
  _sum: { amount: true },
});

// Group by category (for OWNER view)
const grouped = await prisma.expense.groupBy({
  by: ['category'],
  _sum: { amount: true },
  _count: true,
  orderBy: { _sum: { amount: 'desc' } },
});
```

### Frontend Optimizations

1. **Debounce filter changes**: Wait 300ms before applying filter
2. **Optimistic updates**: Update UI immediately, rollback on error
3. **Memoize calculations**: Cache total calculations with `useMemo`
4. **Lazy load modals**: Only render when opened
5. **Pagination**: Load 50-100 records at a time (future enhancement)

### Expected Performance

- Expense list load: < 500ms (for 100 records)
- Maintenance list load: < 500ms (for 100 records)
- Form submission: < 200ms
- Status update: < 200ms
- Total calculation: < 100ms (server-side aggregate)

---

## Implementation Phases

### Phase 1: API Routes (Backend)

1. Create `/api/expenses/route.ts`
   - POST handler with MANAGER-only authorization
   - GET handler with MANAGER/OWNER authorization
   - Validation logic for all fields
   - Aggregate query for totals

2. Create `/api/maintenance/route.ts`
   - POST handler with MANAGER-only authorization
   - GET handler with MANAGER/OWNER authorization, role-specific queries
   - Validation logic for all fields
   - Room existence check for roomId

3. Create `/api/maintenance/[id]/status/route.ts`
   - PATCH handler with MANAGER-only authorization
   - Status validation
   - Business logic for resolvedAt timestamp

**Dependencies**: `@hotel/auth`, `@hotel/db` packages already available

### Phase 2: UI Components (Frontend)

1. Update `/app/reports/page.tsx`
   - Add role-based view switching
   - Implement MANAGER view with tabs
   - Implement OWNER view with summaries

2. Create ExpenseFormModal component
   - Form with validation
   - Category dropdown
   - Date picker
   - Submit handler

3. Create MaintenanceFormModal component
   - Form with validation
   - Room dropdown (fetch from /api/rooms)
   - Submit handler

4. Create expense/maintenance list components
   - Data fetching with authenticatedFetch()
   - Filtering UI
   - Status update dropdowns (maintenance)

**Dependencies**: Navigation component, design system from Phase 2

### Phase 3: Testing

1. Write property-based tests using fast-check
2. Write unit tests for edge cases
3. Perform manual testing following checklist
4. Verify authorization at page and API levels

---

## Out of Scope (This Phase)

The following are explicitly **not** included in Phase 2.5:

- Expense receipt upload functionality
- Expense approval workflows
- Budget tracking and alerts
- Maintenance task assignment to specific staff
- Maintenance scheduling/calendar
- Email/SMS notifications
- Export functionality (CSV, PDF)
- Historical trend charts
- Recurring expense tracking
- Vendor management
- Linking maintenance costs to expenses
- Multi-currency support
- Expense editing (only create in this phase)
- Maintenance issue editing (only status update)
- Pagination (load all records for now)
- Advanced search/filtering
- Expense categories as structured enum in DB

---

## Success Criteria

Phase 2.5 implementation is complete when:

1. ✅ MANAGER can log expenses with all required fields
2. ✅ MANAGER can view expense history with category filtering
3. ✅ Expense totals calculated correctly (filtered and overall)
4. ✅ MANAGER can flag maintenance issues with optional room association
5. ✅ MANAGER can update maintenance issue status (including RESOLVED)
6. ✅ resolvedAt timestamp set/cleared correctly based on status
7. ✅ OWNER can view expense summary grouped by category with totals
8. ✅ OWNER can view active maintenance issues (excluding RESOLVED)
9. ✅ Role-based access enforced at both page and API level
10. ✅ RECEPTIONIST cannot access expense/maintenance features (403)
11. ✅ All form validation works client-side and server-side
12. ✅ UI shows loading, success, and error states appropriately
13. ✅ Design follows deep teal color scheme from Phase 2
14. ✅ Manual testing checklist passes 100%
15. ✅ Property-based tests written for all applicable properties

---

## File Structure Summary

```
hotel-platform/
├── apps/admin/
│   ├── app/
│   │   ├── reports/
│   │   │   └── page.tsx                    # UPDATED (enhanced)
│   │   └── api/
│   │       ├── expenses/
│   │       │   └── route.ts                # NEW
│   │       └── maintenance/
│   │           ├── route.ts                # NEW
│   │           └── [id]/
│   │               └── status/
│   │                   └── route.ts        # NEW
│   └── ...
└── packages/
    └── db/
        └── src/
            └── availability.ts             # No changes needed
```

**New/Updated Files**:
- 1 updated page: `/reports/page.tsx`
- 3 new API routes: expenses, maintenance, maintenance/[id]/status

---

## Database Queries Reference

### Create Expense

```typescript
const expense = await prisma.expense.create({
  data: {
    description: body.description.trim(),
    category: body.category.trim(),
    amount: body.amount,
    date: new Date(body.date),
    notes: body.notes?.trim() || null,
    loggedById: staff.id,
  },
});
```

### List Expenses (with filter and total)

```typescript
const whereClause = category ? { category } : {};

const [expenses, aggregate] = await Promise.all([
  prisma.expense.findMany({
    where: whereClause,
    include: {
      loggedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { date: 'desc' },
  }),
  prisma.expense.aggregate({
    where: whereClause,
    _sum: { amount: true },
  }),
]);

return {
  expenses,
  total: aggregate._sum.amount?.toString() || '0',
};
```

### Create Maintenance Issue

```typescript
// If roomId provided, verify it exists
if (body.roomId) {
  const room = await prisma.room.findUnique({
    where: { id: body.roomId },
    select: { id: true },
  });
  
  if (!room) {
    return NextResponse.json(
      { error: 'Room not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }
}

const issue = await prisma.maintenanceIssue.create({
  data: {
    title: body.title.trim(),
    description: body.description.trim(),
    roomId: body.roomId || null,
    status: 'NEEDS_ATTENTION',
    flaggedById: staff.id,
  },
});
```

### List Maintenance Issues (OWNER: active only)

```typescript
const isOwner = staff.role === 'OWNER';
const statusFilter = isOwner 
  ? { in: ['NEEDS_ATTENTION', 'IN_PROGRESS'] }
  : (statusQuery ? statusQuery : undefined);

const issues = await prisma.maintenanceIssue.findMany({
  where: statusFilter ? { status: statusFilter } : {},
  include: {
    room: {
      select: { id: true, number: true },
    },
    flaggedBy: {
      select: { id: true, name: true },
    },
  },
  orderBy: { 
    createdAt: isOwner ? 'asc' : 'desc',  // Oldest first for OWNER
  },
});
```

### Update Maintenance Status

```typescript
// First, get current status
const current = await prisma.maintenanceIssue.findUnique({
  where: { id: issueId },
  select: { status: true },
});

if (!current) {
  return NextResponse.json(
    { error: 'Maintenance issue not found', code: 'NOT_FOUND' },
    { status: 404 }
  );
}

// Prepare update data
const updateData: any = { status: body.status };

if (body.status === 'RESOLVED') {
  updateData.resolvedAt = new Date();
} else if (current.status === 'RESOLVED' && body.status !== 'RESOLVED') {
  updateData.resolvedAt = null;
}

// Update
const updated = await prisma.maintenanceIssue.update({
  where: { id: issueId },
  data: updateData,
});
```

### Expense Summary for OWNER (grouped by category)

```typescript
const grouped = await prisma.expense.groupBy({
  by: ['category'],
  _sum: { amount: true },
  _count: { id: true },
  orderBy: {
    _sum: {
      amount: 'desc',
    },
  },
});

// Also get overall total
const overall = await prisma.expense.aggregate({
  _sum: { amount: true },
});

return {
  categories: grouped.map(g => ({
    category: g.category,
    total: g._sum.amount?.toString() || '0',
    count: g._count.id,
  })),
  overallTotal: overall._sum.amount?.toString() || '0',
};
```

---

## Migration Notes

**No database migrations required** for this phase. All necessary tables (Expense, MaintenanceIssue) and relations already exist in the schema.

**Existing Schema Verification**:
- ✅ Expense model has all required fields
- ✅ MaintenanceIssue model has all required fields
- ✅ Relations to StaffUser and Room properly defined
- ✅ UUID primary keys configured
- ✅ Timestamp fields use @db.Timestamptz(6)

---

This design is ready for implementation once approved. The implementation follows established patterns from Phase 2 and requires minimal new infrastructure.

