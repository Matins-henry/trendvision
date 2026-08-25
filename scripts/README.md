# Utility Scripts

This folder contains utility scripts for testing and setup.

## 🧪 Test Scripts

### Database & Connection Testing

- **`test-db-connection.js`** - Test Prisma database connection
  ```bash
  node scripts/test-db-connection.js
  ```
  Tests if DATABASE_URL is configured correctly and database is reachable.

- **`test-connection.js`** - Basic connection test
  ```bash
  node scripts/test-connection.js
  ```

### Authentication Testing

- **`test-login.js`** - Test login functionality
  ```bash
  node scripts/test-login.js
  ```
  Tests Supabase authentication with test credentials.

- **`verify-auth-working.js`** - Verify auth system is working
  ```bash
  node scripts/verify-auth-working.js
  ```

- **`test-supabase-api.js`** - Test Supabase API directly
  ```bash
  node scripts/test-supabase-api.js
  ```

## 🔧 Setup Scripts

### User Management

- **`create-test-user.js`** - Create a single test user
  ```bash
  node scripts/create-test-user.js
  ```
  Creates one test user with MANAGER role.

- **`create-test-users.js`** - Create all test users
  ```bash
  node scripts/create-test-users.js
  ```
  Creates test users for all three roles:
  - MANAGER (manager@hotel.com)
  - RECEPTIONIST (receptionist@hotel.com)
  - OWNER (owner@hotel.com)

## 📝 Notes

- All scripts require environment variables from `apps/admin/.env.local`
- Scripts use ES modules (import/export syntax)
- Run from project root: `node scripts/<script-name>.js`

## ⚠️ Production Warning

These are **development/testing scripts only**. Do not run in production environment.
