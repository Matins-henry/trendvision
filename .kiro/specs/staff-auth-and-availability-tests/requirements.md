# Requirements Document

## Introduction

This feature establishes staff authentication using Supabase Auth integrated with the existing three-role system (RECEPTIONIST, MANAGER, OWNER) and provides comprehensive test coverage for the existing room availability logic. The goal is to enable secure, role-based access to the Hotel Management System while ensuring the existing availability checking function correctly prevents double-bookings.

## Glossary

- **Staff_Auth_System**: The Supabase Auth integration that authenticates hotel staff members
- **Availability_Checker**: The existing isRoomAvailable() function in packages/db/src/availability.ts
- **HMS**: Hotel Management System (apps/admin)
- **Booking_System**: The combined database and application logic that creates and manages bookings
- **StaffUser**: A record in the StaffUser table representing an authenticated staff member with a role
- **Active_Booking**: A booking with status PENDING, CONFIRMED, or CHECKED_IN

## Requirements

### Requirement 1: Staff Authentication Integration

**User Story:** As a hotel staff member, I want to authenticate with my credentials, so that I can access the Hotel Management System according to my assigned role.

#### Acceptance Criteria

1. THE Staff_Auth_System SHALL integrate with Supabase Auth
2. WHEN a staff member provides valid credentials, THE Staff_Auth_System SHALL authenticate the staff member and return their authId
3. WHEN authentication succeeds, THE Staff_Auth_System SHALL retrieve the corresponding StaffUser record from the database
4. IF the StaffUser active field is false, THEN THE Staff_Auth_System SHALL deny access
5. WHEN a StaffUser is created, THE Staff_Auth_System SHALL assign exactly one role from the enum (RECEPTIONIST, MANAGER, OWNER)

### Requirement 2: Role-Based Access Control

**User Story:** As a hotel owner, I want staff members to only access features appropriate to their role, so that system security and operational integrity are maintained.

#### Acceptance Criteria

1. WHEN a RECEPTIONIST authenticates, THE HMS SHALL grant access to booking creation, check-in, check-out, payment processing, and receipt printing features
2. WHEN a MANAGER authenticates, THE HMS SHALL grant access to all RECEPTIONIST features plus room management, rate management, and reporting features
3. WHEN an OWNER authenticates, THE HMS SHALL grant access to a revenue and occupancy dashboard
4. THE HMS SHALL prevent access to features not assigned to the authenticated staff member's role

### Requirement 3: Availability Checking Logic Verification

**User Story:** As a developer, I want comprehensive tests for the availability checking function, so that I can verify it correctly prevents double-bookings.

#### Acceptance Criteria

1. WHEN the Availability_Checker receives a roomId and date range with no Active_Bookings, THE Availability_Checker SHALL return true
2. WHEN the Availability_Checker receives a roomId and date range that overlaps with an Active_Booking, THE Availability_Checker SHALL return false
3. WHEN the Availability_Checker receives an excludeBookingId parameter, THE Availability_Checker SHALL ignore that specific booking when checking for conflicts
4. WHEN the Availability_Checker checks overlapping date ranges, THE Availability_Checker SHALL detect overlap when checkIn is before existing checkOut and checkOut is after existing checkIn
5. WHEN the Availability_Checker evaluates booking status, THE Availability_Checker SHALL only consider bookings with status PENDING, CONFIRMED, or CHECKED_IN as conflicts
6. WHEN the Availability_Checker evaluates a booking with status CANCELLED or CHECKED_OUT, THE Availability_Checker SHALL treat the room as available for those dates

### Requirement 4: Boundary Condition Testing

**User Story:** As a developer, I want tests that verify edge cases in availability checking, so that same-day check-in/check-out and adjacent bookings are handled correctly.

#### Acceptance Criteria

1. WHEN a booking checks out on date D and another booking checks in on date D, THE Availability_Checker SHALL return true (same-day turnaround is allowed)
2. WHEN date ranges share only a boundary timestamp with no overlap, THE Availability_Checker SHALL return true
3. WHEN checkIn equals checkOut (zero-duration booking attempt), THE Availability_Checker SHALL evaluate the booking based on standard overlap logic
4. WHEN the Availability_Checker receives dates in the past, THE Availability_Checker SHALL process the request without date validation restrictions

### Requirement 5: Test Suite Implementation

**User Story:** As a developer, I want a complete test suite for the availability function, so that I can verify correctness before deploying booking features.

#### Acceptance Criteria

1. THE Test_Suite SHALL test the scenario where no bookings exist for a room
2. THE Test_Suite SHALL test the scenario where an Active_Booking completely overlaps the requested date range
3. THE Test_Suite SHALL test the scenario where the requested date range falls entirely within an existing booking
4. THE Test_Suite SHALL test the scenario where multiple non-overlapping bookings exist and the requested range fits between them
5. THE Test_Suite SHALL test the scenario where a CANCELLED booking exists for the same dates
6. THE Test_Suite SHALL test the excludeBookingId parameter functionality
7. THE Test_Suite SHALL test same-day check-in and check-out boundary conditions
8. THE Test_Suite SHALL verify that the database constraint no_overlapping_bookings works in conjunction with the Availability_Checker
