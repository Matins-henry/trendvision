# Availability Tests

## Database Setup Required

These tests require a PostgreSQL database to run. You have two options:

### Option 1: Use Existing Database
Set the `DATABASE_URL` environment variable to your test database:
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/hotel_test"
npm test
```

### Option 2: Use Separate Test Database
Set the `DATABASE_URL_TEST` environment variable for test-specific database:
```bash
export DATABASE_URL_TEST="postgresql://user:password@localhost:5432/hotel_test"
npm test
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Test Coverage

The test suite covers:
- Basic scenarios (empty room, overlapping bookings, non-overlapping bookings)
- Booking status filtering (CANCELLED and CHECKED_OUT don't block)
- excludeBookingId parameter functionality
- Boundary conditions (same-day turnaround, adjacent bookings, zero-duration)
- Edge cases (past dates, nested ranges)
- Property-based tests for universal correctness properties

## Note on Database State

Tests use `beforeEach` hooks to clean up the database between tests, ensuring isolation. Each test creates its own test data and cleans up after execution.
