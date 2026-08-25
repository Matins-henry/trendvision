# @hotel-platform/auth

Shared authentication package for the hotel platform monorepo.

## Features

- Supabase authentication integration
- Staff user authentication with role-based access control
- React context for authentication state management
- Support for three staff roles: RECEPTIONIST, MANAGER, OWNER

## Usage

### Authentication Service

```typescript
import { signIn, signOut, getCurrentStaff } from 'auth';

// Sign in a staff member
const staffAuth = await signIn('staff@example.com', 'password');
console.log(staffAuth.role); // RECEPTIONIST | MANAGER | OWNER

// Get current authenticated staff
const currentStaff = await getCurrentStaff();

// Sign out
await signOut();
```

### React Context

```typescript
import { StaffProvider, useStaff } from 'auth';

// Wrap your app with StaffProvider
function App() {
  return (
    <StaffProvider>
      <YourComponents />
    </StaffProvider>
  );
}

// Use authentication in components
function MyComponent() {
  const { staff, isLoading, hasRole } = useStaff();
  
  if (isLoading) return <div>Loading...</div>;
  if (!staff) return <div>Not authenticated</div>;
  
  return (
    <div>
      <p>Welcome, {staff.name}</p>
      {hasRole(['MANAGER', 'OWNER']) && (
        <button>Manager Features</button>
      )}
    </div>
  );
}
```

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

## Dependencies

- `@supabase/supabase-js` - Supabase client library
- `@prisma/client` - Database access for StaffUser records
