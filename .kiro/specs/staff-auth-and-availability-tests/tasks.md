# Implementation Plan: Staff Authentication and Availability Tests

## Overview

This implementation plan creates a secure staff authentication system using Supabase Auth integrated with the existing StaffUser table, implements role-based access control for the admin app, and provides comprehensive test coverage for the existing isRoomAvailable() function to ensure correct double-booking prevention.

**Key Implementation Approach:**
1. Create new `packages/auth` package for authentication logic
2. Set up Supabase client configuration and authentication service
3. Implement authorization middleware for role-based access control
4. Set up comprehensive test suite for availability logic using Jest and fast-check
5. Wire authentication and authorization into the admin app

## Tasks

- [ ] 1. Set up packages/auth package structure
  - Create package directory with TypeScript configuration
  - Add package.json with dependencies (@supabase/supabase-js, @prisma/client)
  - Create src directory with index.ts for exports
  - Configure TypeScript with appropriate compiler options
  - _Requirements: 1.1, 1.2_

- [ ] 2. Implement Supabase client configuration
  - [ ] 2.1 Create Supabase client instances in packages/auth/src/supabase.ts
    - Export supabaseClient for client-side operations
    - Export supabaseServerClient for server-side operations
    - Use environment variables for URL and keys
    - _Requirements: 1.1_

  - [ ] 2.2 Create TypeScript interfaces for authentication results
    - Define StaffAuthResult interface with authId, staffUserId, role, name, email, active fields
    - Define AuthService interface with signIn, signOut, getCurrentStaff, verifyActive methods
    - _Requirements: 1.2, 1.3, 1.4_

- [ ] 3. Implement authentication service
  - [ ] 3.1 Create packages/auth/src/staff-auth.ts with signIn method
    - Authenticate with Supabase using signInWithPassword
    - Query StaffUser by authId from authentication result
    - Verify active status and reject if false
    - Return StaffAuthResult with user data and role
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [ ] 3.2 Implement signOut, getCurrentStaff, and verifyActive methods
    - signOut: Clear Supabase session
    - getCurrentStaff: Retrieve current authenticated staff from session
    - verifyActive: Check if StaffUser with given authId is active
    - _Requirements: 1.4_

- [ ] 4. Implement authorization middleware
  - [ ] 4.1 Create apps/admin/middleware.ts with route permissions matrix
    - Define ROUTE_PERMISSIONS mapping routes to allowed roles
    - RECEPTIONIST: /bookings, /check-in, /check-out, /payments
    - MANAGER: all RECEPTIONIST routes plus /rooms, /rates, /reports
    - OWNER: /dashboard only
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 4.2 Implement middleware function to enforce role-based access
    - Read staff role from session
    - Check if current route requires authentication
    - Verify staff role has permission for requested route
    - Redirect to login if not authenticated, or show access denied if insufficient permissions
    - _Requirements: 2.4_

- [ ] 5. Create React context provider for staff authentication
  - [ ] 5.1 Create packages/auth/src/staff-provider.tsx with StaffProvider component
    - Implement React context to store current staff information
    - Provide useStaff hook for accessing staff context
    - Include isLoading state for authentication checks
    - Implement hasRole helper function for role-based UI rendering
    - _Requirements: 1.2, 2.4_

- [ ] 6. Checkpoint - Verify authentication infrastructure
  - Ensure all TypeScript compiles without errors
  - Verify package exports are correct
  - Ask the user if questions arise

- [ ] 7. Set up testing infrastructure for availability function
  - [ ] 7.1 Install testing dependencies in packages/db
    - Install jest, @types/jest, ts-jest for test runner
    - Install fast-check for property-based testing
    - Add test script to package.json
    - Create jest.config.js with TypeScript support
    - _Requirements: 5.1_

  - [ ] 7.2 Create test database setup utilities
    - Create packages/db/src/__tests__/setup.ts for test helpers
    - Implement database cleanup functions
    - Configure test database connection using DATABASE_URL_TEST
    - Set up beforeEach and afterEach hooks for test isolation
    - _Requirements: 5.1_

- [ ] 8. Write unit tests for availability function
  - [ ] 8.1 Create packages/db/src/__tests__/availability.test.ts with basic scenario tests
    - Test: Empty room returns true (no bookings exist)
    - Test: Overlapping booking returns false
    - Test: Non-overlapping bookings return true
    - Test: CANCELLED booking doesn't block availability
    - Test: CHECKED_OUT booking doesn't block availability
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 5.1, 5.2, 5.5_

  - [ ]*
 8.2 Write unit tests for excludeBookingId parameter
    - Test: excludeBookingId ignores specified booking when checking conflicts
    - Test: Multiple bookings with one excluded still detects remaining conflicts
    - _Requirements: 3.3, 5.6_

  - [ ]* 8.3 Write unit tests for boundary conditions
    - Test: Same-day check-in/check-out (checkOut of one booking equals checkIn of another)
    - Test: Adjacent bookings with touching boundaries but no overlap
    - Test: Zero-duration booking (checkIn == checkOut)
    - _Requirements: 4.1, 4.2, 4.3, 5.7_

  - [ ]* 8.4 Write unit tests for edge cases
    - Test: Past dates are processed without validation restrictions
    - Test: Multiple non-overlapping bookings with requested range between them
    - Test: Requested date range completely within existing booking
    - _Requirements: 4.4, 5.3, 5.4_

- [ ] 9. Write property-based tests for availability function
  - [ ]* 9.1 Write property test for empty room availability
    - **Property 3: Empty room availability**
    - **Validates: Requirements 3.1**
    - Generate random roomId and date ranges
    - Verify isRoomAvailable returns true when no active bookings exist
    - Use fast-check with minimum 100 iterations
    - Tag: "Feature: staff-auth-and-availability-tests, Property 3"

  - [ ]* 9.2 Write property test for overlapping booking detection
    - **Property 4: Overlapping booking detection**
    - **Validates: Requirements 3.2, 3.4**
    - Generate random existing booking with active status
    - Generate overlapping date range
    - Verify isRoomAvailable returns false for all overlaps
    - Use fast-check with minimum 100 iterations
    - Tag: "Feature: staff-auth-and-availability-tests, Property 4"

  - [ ]* 9.3 Write property test for excludeBookingId parameter
    - **Property 5: Exclude booking parameter**
    - **Validates: Requirements 3.3**
    - Generate booking that would conflict
    - Verify isRoomAvailable returns true when that booking is excluded
    - Use fast-check with minimum 100 iterations
    - Tag: "Feature: staff-auth-and-availability-tests, Property 5"

  - [ ]* 9.4 Write property test for booking status filtering
    - **Property 6: Booking status filtering**
    - **Validates: Requirements 3.5, 3.6**
    - Generate bookings with various statuses
    - Verify only PENDING, CONFIRMED, CHECKED_IN block availability
    - Verify CANCELLED and CHECKED_OUT don't block availability
    - Use fast-check with minimum 100 iterations
    - Tag: "Feature: staff-auth-and-availability-tests, Property 6"

  - [ ]* 9.5 Write property test for past date acceptance
    - **Property 7: Past date acceptance**
    - **Validates: Requirements 4.4**
    - Generate date ranges in the past
    - Verify isRoomAvailable processes without date validation rejection
    - Use fast-check with minimum 100 iterations
    - Tag: "Feature: staff-auth-and-availability-tests, Property 7"

  - [ ]* 9.6 Write property test for boundary non-overlap
    - **Property 8: Boundary non-overlap (same-day turnaround)**
    - **Validates: Requirements 4.1, 4.2**
    - Generate booking with checkOut at time T
    - Generate new booking with checkIn at time T
    - Verify no conflict when boundaries touch without overlap
    - Use fast-check with minimum 100 iterations
    - Tag: "Feature: staff-auth-and-availability-tests, Property 8"

- [ ] 10. Checkpoint - Verify availability test suite
  - Ensure all tests pass
  - Verify property tests run minimum 100 iterations each
  - Check test coverage for isRoomAvailable function
  - Ask the user if questions arise

- [x] 11. Wire authentication into admin app
  - [x] 11.1 Add environment variables to apps/admin
  - [x] 11.2 Create login page at apps/admin/app/login/page.tsx
  - [x] 11.3 Wrap app with StaffProvider in apps/admin/app/layout.tsx
  - [x] 11.4 Create placeholder dashboard routes

- [ ] 12. Final checkpoint - Integration verification
  - Run TypeScript compile check across all packages and apps
  - Verify middleware correctly enforces route permissions (or confirm page-level auth working)
  - Ensure all availability tests still pass (or documented why skipped)
  - Run lint checks
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunity for user feedback
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The new packages/auth package is an additive structural change (approved)
- OWNER role is scoped to /dashboard only for narrow, read-only view
- isRoomAvailable() remains pure overlap logic with no date validation (as designed)
