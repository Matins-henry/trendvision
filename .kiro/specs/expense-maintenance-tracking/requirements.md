# Requirements Document

## Introduction

This feature enables expense logging and maintenance issue tracking for hotel operations. The system provides MANAGER users with tools to record expenses and flag maintenance issues, while OWNER users can view financial summaries and outstanding maintenance items. The feature supports operational oversight and builds upon the existing role-based access control established in Phase 1 and the design patterns from Phase 2.

## Glossary

- **Expense_System**: The subsystem that records, stores, and displays hotel expenses
- **Maintenance_System**: The subsystem that tracks maintenance issues from flagging through resolution
- **HMS**: Hotel Management System (apps/admin)
- **StaffUser**: A record in the StaffUser table representing an authenticated staff member with a role
- **Expense**: A financial transaction record including description, category, amount, and date
- **MaintenanceIssue**: A tracked maintenance problem with status, optional room association, and resolution tracking
- **Active_Issue**: A MaintenanceIssue with status NEEDS_ATTENTION or IN_PROGRESS
- **Category_Filter**: A user interface control that filters expenses by category field
- **Expense_Total**: The sum of expense amounts within a specified filter or time range

## Requirements

### Requirement 1: Log Expense Entry

**User Story:** As a Manager, I want to log an expense with complete details, so that all hotel operational costs are recorded in the system.

#### Acceptance Criteria

1. WHEN a MANAGER accesses the expense logging interface, THE Expense_System SHALL provide input fields for description, category, amount, date, and notes
2. THE Expense_System SHALL require description, category, amount, and date fields
3. THE Expense_System SHALL allow amount values greater than zero with two decimal precision
4. WHEN a MANAGER submits a valid expense entry, THE Expense_System SHALL save the record with the authenticated StaffUser's ID as loggedById
5. WHEN an expense is successfully created, THE Expense_System SHALL display a success confirmation
6. THE Expense_System SHALL record createdAt timestamp automatically at the time of expense creation

### Requirement 2: View Expense History

**User Story:** As a Manager, I want to view all logged expenses with filtering options, so that I can review spending patterns and verify expense records.

#### Acceptance Criteria

1. WHEN a MANAGER accesses the expense history page, THE Expense_System SHALL display all expense records sorted by date in descending order
2. THE Expense_System SHALL display description, category, amount, date, logged by staff name, and notes for each expense
3. WHERE a Category_Filter is applied, THE Expense_System SHALL show only expenses matching the selected category
4. THE Expense_System SHALL calculate and display the Expense_Total for the current filtered view
5. WHEN no expenses exist, THE Expense_System SHALL display an empty state message

### Requirement 3: Flag Maintenance Issue

**User Story:** As a Manager, I want to flag maintenance issues with detailed descriptions, so that necessary repairs and upkeep are tracked and managed.

#### Acceptance Criteria

1. WHEN a MANAGER accesses the maintenance flagging interface, THE Maintenance_System SHALL provide input fields for title, description, optional room assignment, and status
2. THE Maintenance_System SHALL require title and description fields
3. THE Maintenance_System SHALL default status to NEEDS_ATTENTION when creating a new issue
4. WHERE a room is specified, THE Maintenance_System SHALL link the MaintenanceIssue to the Room via roomId
5. WHEN a MANAGER submits a valid maintenance issue, THE Maintenance_System SHALL save the record with the authenticated StaffUser's ID as flaggedById
6. THE Maintenance_System SHALL record createdAt timestamp automatically at the time of issue creation

### Requirement 4: Update Maintenance Status

**User Story:** As a Manager, I want to update the status of maintenance issues and mark them resolved, so that I can track maintenance progress and completion.

#### Acceptance Criteria

1. WHEN a MANAGER selects a MaintenanceIssue, THE Maintenance_System SHALL allow status changes to NEEDS_ATTENTION, IN_PROGRESS, or RESOLVED
2. WHEN a MANAGER changes status to RESOLVED, THE Maintenance_System SHALL record the current timestamp in the resolvedAt field
3. WHEN a MANAGER changes status from RESOLVED to IN_PROGRESS or NEEDS_ATTENTION, THE Maintenance_System SHALL clear the resolvedAt field
4. THE Maintenance_System SHALL display a success confirmation after status update

### Requirement 5: Owner Expense Overview

**User Story:** As an Owner, I want to view expense breakdown by category with totals, so that I can monitor hotel spending patterns and financial health.

#### Acceptance Criteria

1. WHEN an OWNER accesses the expense overview, THE Expense_System SHALL display expenses grouped by category
2. THE Expense_System SHALL calculate and display the Expense_Total for each category
3. THE Expense_System SHALL calculate and display the overall Expense_Total across all categories
4. THE Expense_System SHALL sort categories by total amount in descending order
5. WHEN no expenses exist, THE Expense_System SHALL display an empty state message

### Requirement 6: Owner Maintenance Overview

**User Story:** As an Owner, I want to see all outstanding maintenance issues, so that I can monitor facility upkeep and ensure timely resolution.

#### Acceptance Criteria

1. WHEN an OWNER accesses the maintenance overview, THE Maintenance_System SHALL display all Active_Issues
2. THE Maintenance_System SHALL display title, description, status, associated room number, flagged date, and flagged by staff name for each issue
3. THE Maintenance_System SHALL sort Active_Issues by createdAt in ascending order (oldest first)
4. THE Maintenance_System SHALL exclude MaintenanceIssues with status RESOLVED from the default view
5. WHERE a MaintenanceIssue has a roomId, THE Maintenance_System SHALL display the associated room number
6. WHEN no Active_Issues exist, THE Maintenance_System SHALL display an empty state message

### Requirement 7: Role-Based Access Control

**User Story:** As a system administrator, I want to restrict expense and maintenance write access to MANAGER role only, so that operational data integrity is maintained.

#### Acceptance Criteria

1. THE HMS SHALL allow MANAGER role to create, view, and update expenses and maintenance issues
2. THE HMS SHALL allow OWNER role to view expense summaries and maintenance overviews in read-only mode
3. IF a RECEPTIONIST attempts to access expense or maintenance features, THEN THE HMS SHALL display an access denied message
4. THE HMS SHALL enforce role-based access control at both page level and API route level
5. WHEN an unauthorized role attempts API access, THE HMS SHALL return 403 Forbidden status

## Non-Functional Requirements

### NF1: Data Validation
- All form inputs validated client-side and server-side
- Amount fields enforce positive values with two decimal precision
- Required fields prevent submission when empty
- User-friendly error messages for validation failures

### NF2: User Experience
- Loading states shown during API calls
- Success and error feedback after operations
- Responsive design works on desktop and tablet
- Forms follow the deep teal design system from Phase 2
- Card-based UI layout consistent with existing HMS pages

### NF3: Performance
- Expense history loads in under 2 seconds under normal conditions
- Maintenance issue list loads in under 2 seconds under normal conditions
- Form submissions complete in under 1 second
- Category totals calculate on the server to handle large datasets efficiently

### NF4: Data Integrity
- Expense and MaintenanceIssue records preserve audit trail via createdAt timestamps
- Deleting a StaffUser does not cascade delete their logged expenses or flagged issues
- Deleting a Room does not cascade delete associated maintenance issues
- resolvedAt field accurately reflects most recent resolution timestamp

## Out of Scope (Future Phases)

The following are explicitly **not** included in this phase:
- Expense receipt upload functionality
- Expense approval workflows
- Budget tracking and alerts
- Maintenance issue assignment to specific staff members
- Maintenance scheduling and calendar integration
- Email or SMS notifications for maintenance issues
- Expense and maintenance reporting exports (CSV, PDF)
- Historical trend analysis and charts
- Recurring expense tracking
- Vendor management for maintenance services
- Maintenance cost tracking linked to expenses
- Multi-currency support for expenses

## Dependencies

- **Phase 1 Complete**: Authentication and role-based access control working
- **Database Schema**: Expense and MaintenanceIssue models exist (no migrations needed)
- **Auth Package**: `@hotel/auth` with `useStaff()` and `hasRole()` available
- **Prisma Client**: Available in `@hotel/db` package
- **Design System**: Deep teal color scheme and card-based layout from Phase 2

## Success Criteria

This phase is complete when:
1. MANAGER can log expenses with all required fields
2. MANAGER can view expense history with category filtering and totals
3. MANAGER can flag maintenance issues with optional room association
4. MANAGER can update maintenance issue status including marking as resolved
5. OWNER can view expense breakdown by category with totals
6. OWNER can view all outstanding maintenance issues sorted by age
7. Role-based access control restricts write operations to MANAGER only
8. All CRUD operations persist correctly to the database
9. UI provides clear feedback for success and error states
10. Design follows the established HMS visual patterns

## Technical Notes

**Existing Expense Model Schema**:
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

**Existing MaintenanceIssue Model Schema**:
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

**Status Values for MaintenanceIssue**:
- "NEEDS_ATTENTION" - Newly flagged issue requiring attention
- "IN_PROGRESS" - Issue is currently being worked on
- "RESOLVED" - Issue has been completed and resolved

**Common Expense Categories** (not enforced at database level):
- Utilities
- Supplies
- Maintenance
- Payroll
- Marketing
- Insurance
- Other

No schema changes or migrations required - models already support all needed functionality.
