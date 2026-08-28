# FinPilot Supabase Auth Setup Documentation

## Overview

This document describes the complete Supabase authentication integration for the FinPilot Next.js 14 frontend. The implementation provides production-ready authentication with session persistence, middleware-based route protection, and a complete auth flow.

## Architecture

### Components

#### 1. Client Initialization
- **File**: `src/lib/supabase-client.ts`
- **Purpose**: Provides browser-side Supabase client
- **Features**:
  - Singleton pattern for consistent client instance
  - Automatic session persistence via cookies
  - Built-in refresh token management

#### 2. Server Initialization
- **File**: `src/lib/supabase-server.ts`
- **Purpose**: Provides server-side Supabase client for Server Components and Route Handlers
- **Features**:
  - Cookie-based session management
  - Works with Next.js App Router
  - Safe for use in Server Components

#### 3. Middleware
- **File**: `src/middleware.ts` and `src/lib/supabase-middleware.ts`
- **Purpose**: Handles route protection and session refresh
- **Features**:
  - Redirects unauthenticated users to `/login`
  - Refreshes sessions on each request
  - Maintains public educational pages
  - Protects user-specific pages

#### 4. Auth Hook
- **File**: `src/hooks/useAuth.ts`
- **Purpose**: React hook for auth state management
- **Features**:
  - `signup(email, password)` - Register new user
  - `login(email, password)` - Authenticate user
  - `logout()` - Sign out and redirect to login
  - `getCurrentUser()` - Fetch current user info
  - `isAuthenticated` - Auth state boolean
  - `user` and `session` - Current auth objects
  - Real-time auth state updates via listener

#### 5. Auth Forms
- **Signup Form**: `src/components/auth/SignupForm.tsx`
  - Email validation
  - Password confirmation
  - Error handling
  - Loading states
  
- **Login Form**: `src/components/auth/LoginForm.tsx`
  - Email validation
  - Password input
  - Error handling
  - Forgot password link placeholder

#### 6. Auth Pages
- **Login Page**: `src/app/login/page.tsx`
- **Signup Page**: `src/app/signup/page.tsx`
- **Features**:
  - Full-screen auth layouts
  - FinPilot branding
  - Links between signup/login
  - Terms of Service notice

#### 7. Layout Wrappers
- **PublicLayout**: `src/components/layout/PublicLayout.tsx`
  - Allows both authenticated and unauthenticated users
  - Shows AppShell only for authenticated users
  - Used for educational content pages

- **ProtectedLayout**: `src/components/layout/ProtectedLayout.tsx`
  - Restricts access to authenticated users only
  - Shows loading state while checking auth
  - Redirects to login if unauthenticated
  - Used for user-specific pages

#### 8. AppShell Update
- **File**: `src/components/layout/AppShell.tsx`
- **Changes**:
  - Displays user email in sidebar footer
  - Logout button for authenticated users
  - Shows "Anonymous" for guests

## Route Protection Strategy

### Public Educational Routes (No Auth Required)
These routes are always accessible:
- `/glossary` - Financial glossary
- `/learn` - Learning modules
- `/markets` - Market information
- `/financial-independence` - FI education

### Protected Routes (Auth Required)
These routes require authentication:
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/settings` - User settings
- `/watchlist` - Stock watchlist
- `/budget` - Budget planner
- `/progress` - Learning progress
- `/tutor` - AI tutor conversations
- `/quests` - Quest challenges
- `/skills` - Skill tracker
- `/achievements` - Achievement badges

### Auth Routes (No Protection)
- `/login` - Login page
- `/signup` - Signup page

## Authentication Flow

### Signup Flow
```
1. User fills signup form (email, password, confirm password)
2. Validation:
   - Email format check
   - Password length (min 8 chars)
   - Password confirmation match
3. Call `signup(email, password)` via useAuth hook
4. Supabase creates user and session
5. Set user state and isAuthenticated flag
6. Redirect to `/dashboard`
```

### Login Flow
```
1. User fills login form (email, password)
2. Validation:
   - Email format check
   - Both fields filled
3. Call `login(email, password)` via useAuth hook
4. Supabase authenticates user
5. Set user and session state
6. Redirect to `/dashboard`
```

### Logout Flow
```
1. User clicks logout button
2. Call `logout()` via useAuth hook
3. Clear user and session state
4. Sign out from Supabase
5. Redirect to `/login`
```

### Session Persistence
```
1. On app mount:
   - Check for existing session via cookies
   - Restore user and session if found
   
2. On middleware:
   - Refresh session on each request
   - Update cookies if token expires
   
3. Real-time updates:
   - Listen for auth state changes
   - Update state immediately on sign in/out
```

## Environment Configuration

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_anon_key]
```

These should already be in your `.env.local` file. The Supabase project is pre-configured in the environment.

## Usage Examples

### Using the Auth Hook in Components

```typescript
"use client";
import { useAuth } from "@/hooks/useAuth";

export function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Page Layout

```typescript
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

export default function DashboardPage() {
  return (
    <ProtectedLayout>
      {/* Dashboard content */}
    </ProtectedLayout>
  );
}
```

### Creating Public Pages

```typescript
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function GlossaryPage() {
  return (
    <PublicLayout>
      {/* Glossary content */}
    </PublicLayout>
  );
}
```

## Middleware Request Flow

The middleware handles three scenarios:

```
Request → Public Educational Route?
  ├─ Yes → Update session → Allow
  └─ No → Auth Route?
       ├─ Yes → Update session → Allow
       └─ No → Protected Route?
            ├─ Yes → Check session cookie
            │    ├─ Exists → Update session → Allow
            │    └─ Missing → Redirect to /login
            └─ No → Update session → Allow
```

## Session Management

### Cookie-Based Sessions
- Sessions stored in secure HTTP-only cookies
- Automatically managed by Supabase SSR
- Refreshed on each middleware request
- Secure cross-site cookie handling

### Token Refresh
- Supabase automatically refreshes expired tokens
- Middleware ensures tokens stay fresh
- No manual refresh token management needed

### Logout Behavior
- Clears session cookies
- Clears auth state in browser
- Removes refresh token from Supabase
- Redirects to login page

## Security Considerations

✓ **Implemented**:
- HTTP-only cookies (no XSS access)
- HTTPS-only in production
- Session validation on middleware
- Automatic token refresh
- Secure password handling via Supabase
- Email validation
- Password length requirements (8+ chars)

✓ **To Implement** (Backend):
- Email verification flow
- Password reset functionality
- Rate limiting on auth endpoints
- Two-factor authentication
- CSRF protection

## Testing Checklist

- [ ] Signup with valid email/password
- [ ] Signup fails with invalid email
- [ ] Signup fails with short password
- [ ] Signup fails with mismatched passwords
- [ ] Login with correct credentials
- [ ] Login fails with incorrect password
- [ ] Logout clears session
- [ ] Accessing protected route redirects to login when not authenticated
- [ ] Public educational routes work without auth
- [ ] Session persists on page refresh
- [ ] Token refreshes on middleware requests
- [ ] Logout redirects to login page

## Troubleshooting

### "Session is null" error
- Check if Supabase credentials are correct in `.env.local`
- Verify NEXT_PUBLIC_SUPABASE_URL format
- Check that NEXT_PUBLIC_SUPABASE_ANON_KEY is complete

### Redirects to login on protected routes
- Ensure middleware is configured correctly
- Check that auth state is loading (isLoading flag)
- Verify cookies are being set properly

### Form validation not working
- Check email regex pattern is valid
- Ensure password requirements are met
- Verify form state updates are triggered

### Session persists after logout
- Verify logout() is called from useAuth
- Check that cookies are cleared by Supabase
- Ensure redirect happens after logout

## Next Steps

1. Test the complete auth flow end-to-end
2. Implement email verification flow
3. Add password reset functionality
4. Add social authentication (Google, GitHub)
5. Implement two-factor authentication
6. Add user profile completion flow
7. Implement account deletion functionality
8. Add session timeout and warning dialogs

## Files Created/Modified

### Created
- `src/lib/supabase-client.ts` - Browser client
- `src/lib/supabase-server.ts` - Server client
- `src/lib/supabase-middleware.ts` - Middleware utilities
- `src/middleware.ts` - Route protection middleware
- `src/hooks/useAuth.ts` - Auth state hook
- `src/components/auth/LoginForm.tsx` - Login form component
- `src/components/auth/SignupForm.tsx` - Signup form component
- `src/components/layout/ProtectedLayout.tsx` - Protected page wrapper
- `src/components/layout/PublicLayout.tsx` - Public page wrapper
- `src/app/login/page.tsx` - Login page
- `src/app/signup/page.tsx` - Signup page
- `.env.example` - Updated with Supabase variables
- `AUTH_SETUP.md` - This documentation

### Modified
- `src/components/layout/AppShell.tsx` - Added user info and logout button
- `src/components/layout/Providers.tsx` - Already configured correctly

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Routes                                                       │
│  ├── Public: /glossary, /learn, /markets                     │
│  ├── Auth: /login, /signup                                   │
│  └── Protected: /dashboard, /profile, /settings, etc.        │
│                                                               │
│  Middleware (src/middleware.ts)                              │
│  ├── Check route type                                        │
│  ├── Refresh session                                         │
│  └── Redirect if needed                                      │
│                                                               │
│  useAuth Hook (src/hooks/useAuth.ts)                         │
│  ├── signup/login/logout                                     │
│  ├── Auth state (user, session, isLoading)                   │
│  └── Real-time listeners                                     │
│                                                               │
│  Components                                                   │
│  ├── LoginForm / SignupForm                                  │
│  ├── ProtectedLayout / PublicLayout                          │
│  └── AppShell (with logout button)                           │
│                                                               │
│  Supabase Clients                                             │
│  ├── Browser Client (createSupabaseBrowserClient)            │
│  └── Server Client (createSupabaseServerClient)              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
          │
          │ HTTP/HTTPS
          │
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Auth Service                                                │
│  ├── User management                                         │
│  ├── Session handling                                        │
│  ├── Token refresh                                           │
│  └── Secure storage                                          │
│                                                               │
│  Database (PostgreSQL)                                        │
│  ├── Users table                                             │
│  ├── Sessions table                                          │
│  └── Other app data                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Production Deployment Checklist

- [ ] Environment variables set in production
- [ ] HTTPS enabled (required for secure cookies)
- [ ] Supabase project configured for production
- [ ] Email verification enabled
- [ ] Password reset emails configured
- [ ] CORS settings configured for your domain
- [ ] Rate limiting enabled on auth endpoints
- [ ] Monitoring/logging for auth failures
- [ ] User session timeout configured
- [ ] Backup and disaster recovery plan
