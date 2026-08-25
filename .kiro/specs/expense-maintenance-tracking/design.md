# Phase 2.5: Expense & Maintenance Tracking - Design Document

**Feature**: Expense Logging and Maintenance Issue Tracking  
**Target Roles**: MANAGER (write), OWNER (read-only)  
**Status**: Design (Pending Approval)

---

## Overview

This feature adds expense logging and maintenance issue tracking to the Hotel Management System. It enables MANAGER users to record operational expenses with detailed categorization and flag maintenance issues with room associations. OWNER users can view expense summaries grouped by category and monitor outstanding maintenance issues requiring attention.

The design follows the established patterns from Phase 2 (Room & Rate Management):
- Bearer token authentication via `getServerStaff(request)`
- RESTful API routes with role-based access control
- React client components with `authenticatedFetch()` helper
- Deep teal design system (#0F766E) with card-based UI
- Prisma ORM for data layer (existing schema, no migrations needed)

**Key Design Decision**: We create dedicated pages for expenses and maintenance, following the same pattern as Phase 2's `/rooms` page:
- `/expenses` - MANAGER: full CRUD for expense logging; OWNER: read-only expense summaries
- `/maintenance` - MANAGER: full CRUD for maintenance issues; OWNER: read-only active issues view

This keeps the navigation consistent with the established Phase 2 pattern and provides focused interfaces for each operational concern.

---

## Architecture

This feature follows the standard Next.js App Router pattern established in Phase 2:

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /expenses page (React Client Component)             │  │
│  │  - MANAGER: Full CRUD for expense logging            │  │
│  │  - OWNER: Read-only expense summaries by category    │  │
│  │  - Auth Guard: hasRole(['MANAGER', 'OWNER'])         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /maintenance page (React Client Component)          │  │
│  │  - MANAGER: Full CRUD for maintenance issue tracking │  │
│  │  - OWNER: Read-only active maintenance issues view   │  │
│  │  - Auth Guard: hasRole(['MANAGER', 'OWNER'])         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↕ authenticatedFetch()
┌─────────────────────────────────────────────────────────────┐
│                  API Routes (Server-side)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST   /api/expenses       → Create expense         │  │
│  │  GET    /api/expenses       → List expenses (filter) │  │
│  │  POST   /api/maintenance    → Create issue           │  │
│  │  GET    /api/maintenance    → List issues (filter)   │  │
│  │  PATCH  /api/maintenance/[id]/status → Update status │  │
│  │                                                        │  │
│  │  Each route checks role via getServerStaff(request)   │  │
│  │  MANAGER: Full CRUD access                            │  │
│  │  OWNER: Read-only access (GET endpoints)             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↕ Prisma
┌─────────────────────────────────────────────────────────────┐
│                      Database (Supabase)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Expense table (existing, no changes needed)         │  │
│  │  - id, description, category, amount, date           │  │
│  │  - loggedById, notes, createdAt                      │  │
│  │                                                        │  │
│  │  MaintenanceIssue table (existing, no changes)       │  │
│  │  - id, title, description, status, roomId            │  │
│  │  - flaggedById, resolvedAt, createdAt                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow Pattern**:
1. User accesses `/reports` page
2. Client checks authentication and role via `getCurrentStaff()`
3. Based on role, render appropriate interface (MANAGER: full CRUD, OWNER: read-only)
4. Client fetches data via `authenticatedFetch()` to API routes
5. API routes validate role and execute Prisma queries
6. Client receives data and renders UI components

---

## Components and Interfaces

### Page Components

```
apps/admin/app/reports/
└── page.tsx                    # Enhanced reports page
    ├── Auth guard (MANAGER or OWNER)
    ├── Role-based view selection
    ├── MANAGER View:
    │   ├── ExpenseList component
    │   ├── ExpenseForm modal
    │   ├── MaintenanceList component
    │   └── MaintenanceForm modal
    └── OWNER View:
        ├── ExpenseSummary component (grouped by category)
        └── ActiveMaintenanceList component (read-only)
```

### API Routes

```
apps/admin/app/api/
├── expenses/
│   └── route.ts                # POST (MANAGER), GET (MANAGER, OWNER)
└── maintenance/
    ├── route.ts                # POST (MANAGER), GET (MANAGER, OWNER)
    └── [id]/
        └── status/
            └── route.ts        # PATCH (MANAGER only)
```

### Component Hierarchy

**MANAGER View** (/reports page):
```
ReportsPage
├── Navigation
├── Tab Navigation ("Expenses" | "Maintenance")
├── Expenses Tab
│   ├── Header with "Log Expense" button
│   ├── Category filter dropdown
│   ├── Total display
│   ├── ExpenseList (table)
│   │   └── ExpenseRow × N
│   │       └── Edit button (future phase)
│   └── ExpenseFormModal
│       └── Form fields + validation
└── Maintenance Tab
    ├── Header with "Flag Issue" button
    ├── Status filter dropdown
    ├── MaintenanceList (cards)
    │   └── MaintenanceCard × N
    │       ├── Status badge
    │       ├── Issue details
    │       └── Status update dropdown
    └── MaintenanceFormModal
        └── Form fields + validation
```

**OWNER View** (/reports page):
```
ReportsPage
├── Navigation
├── Expense Summary Section
│   ├── Header with total amount
│   ├── CategorySummaryCard × N
│   │   ├── Category name
│   │   ├── Category total
│   │   └── Expense count
│   └── Overall total display
└── Active Maintenance Section
    ├── Header with active count
    └── MaintenanceCard × N (read-only)
        ├── Status badge
        ├── Issue details
        ├── Room association
        └── Flagged date
```

---

## Data Models

### Expense Model (Existing Schema)

```prisma
model Expense {
  id          String     @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  description String
  category    String
  amount      Decimal    @db.Decimal(10, 2)
  loggedById  String     @db.Uuid
  date        DateTime   @db.Timestamptz(6)
  notes       String?
  createdAt   DateTime   @default(now()) @db.Timestamptz(6)
  loggedBy    StaffUser  @relation(fields: [loggedById], references: [id])
}
```

**TypeScript Interface**:
```typescript
interface Expense {
  id: string;
  description: string;
  category: string;
  amount: string;  // Decimal returned as string from Prisma
  loggedById: string;
  date: string;    // ISO 8601 timestamp
  notes: string | null;
  createdAt: string;
  loggedBy?: {     // Optional relation
    id: string;
    name: string;
  };
}
```

**Common Categories** (not enforced at DB level):
- "Utilities"
- "Supplies"
- "Maintenance"
- "Payroll"
- "Marketing"
- "Insurance"
- "Other"

### MaintenanceIssue Model (Existing Schema)

```prisma
model MaintenanceIssue {
  id          String     @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  title       String
  description String
  status      String     @default("NEEDS_ATTENTION")
  roomId      String?    @db.Uuid
  flaggedById String     @db.Uuid
  resolvedAt  DateTime?  @db.Timestamptz(6)
  createdAt   DateTime   @default(now()) @db.Timestamptz(6)
  room        Room?      @relation(fields: [roomId], references: [id])
  flaggedBy   StaffUser  @relation(fields: [flaggedById], references: [id])
}
```

**TypeScript Interface**:
```typescript
interface MaintenanceIssue {
  id: string;
  title: string;
  description: string;
  status: 'NEEDS_ATTENTION' | 'IN_PROGRESS' | 'RESOLVED';
  roomId: string | null;
  flaggedById: string;
  resolvedAt: string | null;
  createdAt: string;
  room?: {         // Optional relation
    id: string;
    number: string;
  };
  flaggedBy?: {    // Optional relation
    id: string;
    name: string;
  };
}
```

**Status Values**:
- `"NEEDS_ATTENTION"` - Default, newly flagged issue
- `"IN_PROGRESS"` - Issue is being worked on
- `"RESOLVED"` - Issue completed and resolved

---

## API Specifications

### POST /api/expenses (Create Expense)

**Authorization**: MANAGER only

**Request Body**:
```typescript
{
  description: string;   // required, max 255 chars
  category: string;      // required
  amount: number;        // required, > 0, max 2 decimals
  date: string;          // required, ISO 8601 date
  notes?: string;        // optional
}
```

**Response (201 Created)**:
```typescript
{
  id: string;
  description: string;
  category: string;
  amount: string;        // Decimal as string
  loggedById: string;
  date: string;
  notes: string | null;
  createdAt: string;
}
```

**Error Responses**:
- 400: Validation error (missing required fields, invalid amount)
- 401: Unauthorized (no authentication)
- 403: Forbidden (not MANAGER role)
- 500: Internal server error

**Validation Rules**:
- `description`: Required, non-empty, max 255 characters
- `category`: Required, non-empty
- `amount`: Required, > 0, max 2 decimal places
- `date`: Required, valid ISO 8601 date string
- `notes`: Optional, max 1000 characters
- `loggedById`: Auto-populated from authenticated staff user

---

### GET /api/expenses (List Expenses)

**Authorization**: MANAGER (all), OWNER (read-only)

**Query Parameters**:
```
?category=Utilities     // Optional: filter by category
```

**Response (200 OK)**:
```typescript
{
  expenses: Array<{
    id: string;
    description: string;
    category: string;
    amount: string;
    date: string;
    notes: string | null;
    createdAt: string;
    loggedBy: {
      id: string;
      name: string;
    };
  }>;
  total: string;         // Sum of filtered expenses
}
```

**Sorting**: Expenses sorted by `date` descending (newest first)

**Error Responses**:
- 401: Unauthorized
- 403: Forbidden (not MANAGER or OWNER)
- 500: Internal server error

**Query Strategy**:
```typescript
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
```

---

### POST /api/maintenance (Create Maintenance Issue)

**Authorization**: MANAGER only

**Request Body**:
```typescript
{
  title: string;         // required, max 255 chars
  description: string;   // required
  roomId?: string;       // optional, UUID
  status?: string;       // optional, defaults to "NEEDS_ATTENTION"
}
```

**Response (201 Created)**:
```typescript
{
  id: string;
  title: string;
  description: string;
  status: string;
  roomId: string | null;
  flaggedById: string;
  resolvedAt: null;
  createdAt: string;
}
```

**Error Responses**:
- 400: Validation error (missing required fields, invalid roomId)
- 401: Unauthorized
- 403: Forbidden (not MANAGER role)
- 404: Room not found (if roomId provided)
- 500: Internal server error

**Validation Rules**:
- `title`: Required, non-empty, max 255 characters
- `description`: Required, non-empty
- `roomId`: Optional, must exist in Room table if provided
- `status`: Optional, defaults to "NEEDS_ATTENTION"
- `flaggedById`: Auto-populated from authenticated staff user

---

### GET /api/maintenance (List Maintenance Issues)

**Authorization**: MANAGER (all), OWNER (active only)

**Query Parameters**:
```
?status=NEEDS_ATTENTION     // Optional: filter by status
?activeOnly=true            // Optional: exclude RESOLVED (default for OWNER)
```

**Response (200 OK)**:
```typescript
{
  issues: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    roomId: string | null;
    flaggedById: string;
    resolvedAt: string | null;
    createdAt: string;
    room: {
      id: string;
      number: string;
    } | null;
    flaggedBy: {
      id: string;
      name: string;
    };
  }>;
}
```

**Sorting**: 
- For MANAGER: By `createdAt` descending (newest first)
- For OWNER: By `createdAt` ascending (oldest first) - highlights issues needing attention

**Error Responses**:
- 401: Unauthorized
- 403: Forbidden (not MANAGER or OWNER)
- 500: Internal server error

**Query Strategy for OWNER** (default):
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
  orderBy: { createdAt: 'asc' },  // Oldest first for OWNER
});
```

---

### PATCH /api/maintenance/[id]/status (Update Status)

**Authorization**: MANAGER only

**URL Parameters**: `id` (UUID)

**Request Body**:
```typescript
{
  status: "NEEDS_ATTENTION" | "IN_PROGRESS" | "RESOLVED"
}
```

**Response (200 OK)**:
```typescript
{
  id: string;
  title: string;
  status: string;
  resolvedAt: string | null;  // Set to current timestamp if RESOLVED
  // ... other fields
}
```

**Business Logic**:
- When status changes to `"RESOLVED"`: Set `resolvedAt` to current timestamp
- When status changes from `"RESOLVED"` to other: Clear `resolvedAt` field

**Error Responses**:
- 400: Invalid status value
- 401: Unauthorized
- 403: Forbidden (not MANAGER role)
- 404: Maintenance issue not found
- 500: Internal server error

**Update Query**:
```typescript
const updateData: any = { status: newStatus };

if (newStatus === 'RESOLVED') {
  updateData.resolvedAt = new Date();
} else if (oldStatus === 'RESOLVED' && newStatus !== 'RESOLVED') {
  updateData.resolvedAt = null;
}

const issue = await prisma.maintenanceIssue.update({
  where: { id },
  data: updateData,
});
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Required expense fields validation

*For any* expense submission, if any required field (description, category, amount, date) is missing or empty, then the system should reject the submission with a validation error.

**Validates: Requirements 1.2**

### Property 2: Positive amount with decimal precision

*For any* expense amount value, the system should accept values greater than zero with up to two decimal places, and reject zero, negative values, or values with more than two decimal places.

**Validates: Requirements 1.3**

### Property 3: Authenticated user tracking for expenses and maintenance

*For any* valid expense or maintenance issue submission, the created record should have loggedById (for expenses) or flaggedById (for maintenance) equal to the authenticated staff user's ID.

**Validates: Requirements 1.4, 3.5**

### Property 4: Expense creation timestamp

*For any* expense creation operation, the created record should have a createdAt timestamp within 5 seconds of the current time.

**Validates: Requirements 1.6**

### Property 5: Expense sorting by date descending

*For any* set of expense records returned by the list endpoint, the expenses should be ordered by date in descending order (newest first).

**Validates: Requirements 2.1**

### Property 6: Expense display completeness

*For any* expense rendered in the UI, the display should include description, category, amount, date, logged by staff name, and notes fields.

**Validates: Requirements 2.2**

### Property 7: Category filter correctness

*For any* category filter value applied to the expense list, all returned expenses should have a category field exactly matching the filter value.

**Validates: Requirements 2.3**

### Property 8: Expense total calculation accuracy

*For any* set of expenses (filtered or unfiltered), the displayed total should equal the mathematical sum of all expense amounts in that set.

**Validates: Requirements 2.4**

### Property 9: Required maintenance fields validation

*For any* maintenance issue submission, if title or description is missing or empty, then the system should reject the submission with a validation error.

**Validates: Requirements 3.2**

### Property 10: Default maintenance status

*For any* maintenance issue created without an explicit status value, the created record should have status equal to "NEEDS_ATTENTION".

**Validates: Requirements 3.3**

### Property 11: Room association linkage

*For any* maintenance issue submission that includes a roomId, the created record should have that roomId stored and should be queryable via the room relation.

**Validates: Requirements 3.4**

### Property 12: Maintenance creation timestamp

*For any* maintenance issue creation operation, the created record should have a createdAt timestamp within 5 seconds of the current time.

**Validates: Requirements 3.6**

### Property 13: Valid status transitions

*For any* maintenance issue status update, the system should accept only the values "NEEDS_ATTENTION", "IN_PROGRESS", or "RESOLVED", and reject any other status value.

**Validates: Requirements 4.1**

### Property 14: Resolved timestamp setting

*For any* maintenance issue status update to "RESOLVED", the updated record should have resolvedAt set to a timestamp within 5 seconds of the current time.

**Validates: Requirements 4.2**

### Property 15: Resolved timestamp clearing on status change

*For any* maintenance issue with status "RESOLVED", if the status is changed to "IN_PROGRESS" or "NEEDS_ATTENTION", then the resolvedAt field should be set to null.

**Validates: Requirements 4.3**

### Property 16: Expense grouping by category

*For any* expense overview for OWNER role, expenses should be organized into groups where all expenses in each group have the same category value.

**Validates: Requirements 5.1**

### Property 17: Category total calculation accuracy

*For any* category in the expense overview, the displayed category total should equal the mathematical sum of all expense amounts within that category.

**Validates: Requirements 5.2**

### Property 18: Overall expense total accuracy

*For any* expense overview, the overall total should equal the mathematical sum of all expense amounts across all categories.

**Validates: Requirements 5.3**

### Property 19: Category sorting by total descending

*For any* expense overview with multiple categories, the categories should be ordered by their total amounts in descending order (highest first).

**Validates: Requirements 5.4**

### Property 20: Active issues filtering for OWNER

*For any* maintenance overview accessed by OWNER role, only issues with status "NEEDS_ATTENTION" or "IN_PROGRESS" should be included, and issues with status "RESOLVED" should be excluded.

**Validates: Requirements 6.1, 6.4**

### Property 21: Maintenance display completeness

*For any* maintenance issue rendered in the overview, the display should include title, description, status, associated room number (if roomId present), flagged date, and flagged by staff name fields.

**Validates: Requirements 6.2, 6.5**

### Property 22: Active issues sorting by date ascending

*For any* set of active maintenance issues in OWNER view, the issues should be ordered by createdAt in ascending order (oldest first).

**Validates: Requirements 6.3**

### Property 23: MANAGER role full access authorization

*For any* authenticated MANAGER user, all expense and maintenance API endpoints (POST, GET, PATCH) should return successful responses (2xx status codes) for valid requests.

**Validates: Requirements 7.1**

### Property 24: OWNER role read-only authorization

*For any* authenticated OWNER user, GET requests to expense and maintenance endpoints should succeed, while POST and PATCH requests should return 403 Forbidden status.

**Validates: Requirements 7.2**

### Property 25: Unauthorized role rejection

*For any* authenticated user with role other than MANAGER or OWNER (e.g., RECEPTIONIST), all expense and maintenance API endpoint requests should return 403 Forbidden status.

**Validates: Requirements 7.3, 7.5**

---

