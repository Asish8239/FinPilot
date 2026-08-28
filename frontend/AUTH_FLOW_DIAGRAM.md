# FinPilot Supabase Auth - Flow Diagrams

## 1. Complete Authentication Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                         FinPilot Frontend (Next.js 14)                          │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Browser                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                            │  │
│  │  Login Page (/login)                   Signup Page (/signup)             │  │
│  │  ┌─────────────────────┐              ┌──────────────────────┐           │  │
│  │  │ LoginForm           │              │ SignupForm           │           │  │
│  │  │ • Email input       │              │ • Email input        │           │  │
│  │  │ • Password input    │              │ • Password input     │           │  │
│  │  │ • Submit button     │              │ • Confirm password   │           │  │
│  │  │ • Link to signup    │              │ • Submit button      │           │  │
│  │  └──────────┬──────────┘              │ • Link to login      │           │  │
│  │             │                         └──────────┬───────────┘           │  │
│  │             │                                    │                       │  │
│  │  useAuth Hook                                                            │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│  │  │                                                                  │   │  │
│  │  │ • signup(email, password) → Supabase.auth.signUp()             │   │  │
│  │  │ • login(email, password) → Supabase.auth.signInWithPassword()  │   │  │
│  │  │ • logout() → Supabase.auth.signOut()                           │   │  │
│  │  │ • getCurrentUser() → Supabase.auth.getUser()                   │   │  │
│  │  │ • Real-time listener → Supabase.auth.onAuthStateChange()      │   │  │
│  │  │                                                                  │   │  │
│  │  │ State:                                                            │   │  │
│  │  │ • user: User | null                                              │   │  │
│  │  │ • session: Session | null                                        │   │  │
│  │  │ • isAuthenticated: boolean                                       │   │  │
│  │  │ • isLoading: boolean                                             │   │  │
│  │  │                                                                  │   │  │
│  │  └───────────────────────────┬──────────────────────────────────────┘   │  │
│  │                              │                                           │  │
│  │  Protected Pages                                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│  │  │                                                                  │   │  │
│  │  │  ProtectedLayout                                                │   │  │
│  │  │  ├─ Check isAuthenticated & isLoading                           │   │  │
│  │  │  ├─ Show loading spinner while checking                         │   │  │
│  │  │  ├─ Redirect to /login if not authenticated                     │   │  │
│  │  │  └─ Render AppShell + content if authenticated                  │   │  │
│  │  │                                                                  │   │  │
│  │  │  Routes: /dashboard, /profile, /settings, /watchlist, etc.      │   │  │
│  │  │                                                                  │   │  │
│  │  └──────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                            │  │
│  │  Public Pages (No Auth Required)                                          │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│  │  │                                                                  │   │  │
│  │  │  PublicLayout                                                   │   │  │
│  │  │  ├─ Allow any user (authenticated or not)                       │   │  │
│  │  │  ├─ Show AppShell only if authenticated                         │   │  │
│  │  │  └─ Show plain content if not authenticated                     │   │  │
│  │  │                                                                  │   │  │
│  │  │  Routes: /glossary, /learn, /markets, /financial-independence   │   │  │
│  │  │                                                                  │   │  │
│  │  └──────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                            │  │
│  └────────────────────────────┬─────────────────────────────────────────────┘  │
│                               │ HTTPS                                          │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┼─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│                               │                                                │
│  Next.js Server (Middleware)                                                  │
│  ┌───────────────────────────▼─────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │  middleware.ts (Edge Runtime)                                           │  │
│  │  ┌────────────────────────────────────────────────────────────────┐    │  │
│  │  │                                                                │    │  │
│  │  │  1. Intercept incoming request                               │    │  │
│  │  │  2. Check if route is public educational (/glossary, etc.)   │    │  │
│  │  │     → Allow request to proceed                               │    │  │
│  │  │  3. Check if route is auth route (/login, /signup)           │    │  │
│  │  │     → Allow request to proceed                               │    │  │
│  │  │  4. Check if route is protected (/dashboard, etc.)           │    │  │
│  │  │     ├─ Call updateSession(request)                           │    │  │
│  │  │     ├─ Refresh auth token via Supabase                       │    │  │
│  │  │     ├─ Check for auth cookie                                 │    │  │
│  │  │     ├─ If exists → Allow request                             │    │  │
│  │  │     └─ If missing → Redirect to /login?redirectTo=[route]   │    │  │
│  │  │  5. All other routes → Update session and allow             │    │  │
│  │  │                                                                │    │  │
│  │  └────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                               │ HTTPS                                          │
├────────────────────────────────┼───────────────────────────────────────────────┤
│                               │                                                │
│  Supabase Backend                                                              │
│  ┌───────────────────────────▼─────────────────────────────────────────────┐  │
│  │                                                                          │  │
│  │  Supabase Auth Service                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────────┐    │  │
│  │  │                                                                │    │  │
│  │  │  • User authentication                                         │    │  │
│  │  │  • Session management                                          │    │  │
│  │  │  • Token generation & refresh                                  │    │  │
│  │  │  • Secure password hashing                                     │    │  │
│  │  │  • HTTP-only cookie handling                                   │    │  │
│  │  │  • Real-time listeners                                         │    │  │
│  │  │                                                                │    │  │
│  │  └────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                          │  │
│  │  PostgreSQL Database                                                    │  │
│  │  ├─ users table                                                         │  │
│  │  │  └─ id, email, password_hash, created_at, last_sign_in_at           │  │
│  │  └─ sessions table                                                      │  │
│  │     └─ id, user_id, access_token, refresh_token, expires_at            │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Signup Flow Sequence Diagram

```
User                LoginForm          useAuth             Supabase         Database
  │                    │                  │                   │                 │
  │─ Click signup  ──→ │                  │                   │                 │
  │                    │                  │                   │                 │
  │ ← Show form ────── │                  │                   │                 │
  │                    │                  │                   │                 │
  │─ Enter email, pwd→ │                  │                   │                 │
  │                    │                  │                   │                 │
  │─ Click submit   ─→ │                  │                   │                 │
  │                    │ Validate         │                   │                 │
  │                    │ email & password │                   │                 │
  │                    │ │                │                   │                 │
  │                    ├─ Invalid? ──────→ │                   │                 │
  │                    │ ← Error message ─ │                   │                 │
  │                    │                  │                   │                 │
  │                    │ ✓ Valid          │                   │                 │
  │                    │ ├─ Call signup ─→ │                   │                 │
  │                    │                  │ signup() ────────→ │                 │
  │                    │                  │                   │ Hash password   │
  │                    │                  │                   │ Create user ───→ │
  │                    │                  │                   │ │                │
  │                    │                  │                   │ Create session ─ │
  │                    │                  │                   │ │                │
  │                    │                  │ ← User + Session ─ │ ← Return OK ─── │
  │                    │                  │                   │                 │
  │ ← Success msg ─── │ ← Return user ── │                   │                 │
  │                    │                  │ Set cookies (HTTP-only)             │
  │                    │                  │ Update user state                   │
  │                    │                  │ isAuthenticated = true              │
  │                    │                  │                   │                 │
  │ ← Redirect to   ── │                  │                   │                 │
  │   /dashboard       │                  │                   │                 │
  │                    │                  │                   │                 │
```

## 3. Login Flow Sequence Diagram

```
User                LoginForm          useAuth             Supabase         Database
  │                    │                  │                   │                 │
  │─ Navigate to    ──→ │                  │                   │                 │
  │   /login           │                  │                   │                 │
  │                    │                  │                   │                 │
  │ ← Show form ────── │                  │                   │                 │
  │                    │                  │                   │                 │
  │─ Enter email, pwd→ │                  │                   │                 │
  │                    │                  │                   │                 │
  │─ Click sign in  ─→ │                  │                   │                 │
  │                    │ Validate         │                   │                 │
  │                    │ email & pwd      │                   │                 │
  │                    │ │                │                   │                 │
  │                    ├─ Invalid? ──────→ │                   │                 │
  │                    │ ← Error message ─ │                   │                 │
  │                    │                  │                   │                 │
  │                    │ ✓ Valid          │                   │                 │
  │                    │ ├─ Call login ──→ │                   │                 │
  │                    │                  │ signInWithPassword()                │
  │                    │                  │ ───────────────────→ │               │
  │                    │                  │                   │ Verify password │
  │                    │                  │                   │ │               │
  │                    │                  │                   ├─ Match? ──────→ │
  │                    │                  │                   │ │               │
  │                    │                  │ ← User + Session ─ │ Generate token │
  │                    │                  │                   │ ← Return OK ─── │
  │                    │                  │                   │                 │
  │ ← Success msg ─── │ ← Return user ── │                   │                 │
  │                    │                  │ Set cookies (HTTP-only)             │
  │                    │                  │ Update user state                   │
  │                    │                  │ isAuthenticated = true              │
  │                    │                  │                   │                 │
  │ ← Redirect to   ── │                  │                   │                 │
  │   /dashboard       │                  │                   │                 │
  │                    │                  │                   │                 │
```

## 4. Logout Flow Sequence Diagram

```
User              AppShell         useAuth          Supabase         Browser
  │                   │              │                  │               │
  │─ Click logout  ──→ │              │                  │               │
  │                    │              │                  │               │
  │                    │ Call logout ─ │                  │               │
  │                    │              │ signOut() ───────→ │               │
  │                    │              │                  │ Invalidate    │
  │                    │              │                  │ session       │
  │                    │              │ ← Success ────── │               │
  │                    │              │                  │               │
  │                    │              │ Clear user state │               │
  │                    │              │ Clear session    │               │
  │                    │              │ isAuthenticated= │               │
  │                    │              │ false            │               │
  │                    │              │                  │ Clear cookies │
  │                    │              │ ───────────────────────────────→ │
  │                    │              │                  │               │
  │ ← Redirect to /login           │                  │               │
  │                    │              │                  │               │
  │ Show /login page   │              │                  │               │
  │                    │              │                  │               │
```

## 5. Protected Route Access Flow

```
User              Browser         Middleware        AppShell         useAuth
  │                  │                │               │                 │
  │─ Click link   ──→ │                │               │                 │
  │   to /dashboard   │                │               │                 │
  │                   │                │               │                 │
  │                   │─ GET /dashboard→ │               │                 │
  │                   │                │ Check route    │                 │
  │                   │                │ Protected? YES │                 │
  │                   │                │ Check cookie? │                 │
  │                   │                │               │                 │
  │                   │                ├─ Not found ───────────────────→ │
  │                   │                │               │ Redirect to    │
  │                   │                │ Cookie found  │ /login         │
  │                   │                │ Refresh token │                 │
  │                   │                │ │              │                 │
  │                   │                ├─ Valid? ──────→ │ Check state   │
  │                   │                │                │ │              │
  │                   │ ← Redirect to /login ← Redirect ← │ Not authed   │
  │ ← Show /login     │                │                │                │
  │                   │                │                │                │
  │  (After login)    │                │                │                │
  │                   │                │                │                │
  │─ Click link   ──→ │                │                │                │
  │   to /dashboard   │                │                │                │
  │                   │─ GET /dashboard→ │                │                │
  │                   │                │ Check route    │                │
  │                   │                │ Protected? YES │                │
  │                   │                │ Cookie? YES    │                │
  │                   │                │ Refresh token  │                │
  │                   │                │ Valid? YES     │                │
  │                   │ ← 200 OK       │ Allow request  │                │
  │                   │                │ ───────────────→ │ Render page  │
  │                   │ ← Page HTML    │                │ ← Return JSX │
  │                   │                │                │                │
  │ ← Show dashboard  │                │                │                │
```

## 6. Session Persistence Flow

```
Session Started    Page Refresh       Middleware        useAuth
  │                    │                  │               │
  │─ User logs in   ──→ │                  │               │
  │ ← Session created ─ │                  │               │
  │ ← Cookies set     ─ │                  │               │
  │                     │                  │               │
  │─ Press F5 to    ──→ │                  │               │
  │   refresh page      │                  │               │
  │                     │ New page request │               │
  │                     │ ────────────────→ │               │
  │                     │ Read cookies     │               │
  │                     │ Get session      │               │
  │                     │ Refresh token    │               │
  │                     │ ────────────────────────────────→ │
  │                     │                  │ getSession() │
  │                     │                  │ ← Session OK │
  │                     │ ← Allow request  │               │
  │                     │                  │ ← User state │
  │                     │ ← Page HTML  ──← │ Restored     │
  │ ← Still logged in   │                  │               │
  │                     │                  │               │
```

## 7. Token Refresh Flow

```
Browser             Middleware          Supabase           Database
  │                     │                   │                 │
  │ Request with        │                   │                 │
  │ expired token ──→  │ Check token       │                 │
  │                     │ Expired? YES      │                 │
  │                     │ ─ Call refresh ──→ │                 │
  │                     │                   │ Validate        │
  │                     │                   │ refresh token   │
  │                     │                   │ ──────────────→ │
  │                     │                   │ ← Valid        │
  │                     │                   │ Generate new   │
  │                     │ ← New tokens    ←  │ token pair    │
  │                     │ Update cookies    │                 │
  │                     │ Continue request  │                 │
  │ ← Response         │ ←────────────────── │                 │
  │ (with new token)   │                   │                 │
```

## 8. Request Flow Through Middleware

```
Request
  │
  ├─→ Is public educational route? (/glossary, /learn, /markets, /financial-independence)
  │   ├─ YES → updateSession() → Allow
  │   │
  │   └─ NO
  │       │
  │       ├─→ Is auth route? (/login, /signup)
  │       │   ├─ YES → updateSession() → Allow
  │       │   │
  │       │   └─ NO
  │       │       │
  │       │       ├─→ Is protected route? (/dashboard, /profile, /settings, etc.)
  │       │       │   ├─ YES
  │       │       │   │   │
  │       │       │   │   ├─ updateSession()
  │       │       │   │   ├─ Refresh token
  │       │       │   │   │
  │       │       │   │   ├─ Has auth cookie?
  │       │       │   │   │   ├─ YES → Allow
  │       │       │   │   │   │
  │       │       │   │   │   └─ NO → Redirect to /login?redirectTo=[original]
  │       │       │   │
  │       │       │   └─ NO
  │       │       │       │
  │       │       │       └─ updateSession() → Allow (public routes, etc.)
  │
  ├─→ Response
```

## 9. Component Hierarchy

```
RootLayout
│
├─ Providers (QueryClientProvider)
│
└─ Auth Pages
   │
   ├─ /login/page.tsx
   │  └─ LoginForm
   │     └─ useAuth (login, isLoading)
   │
   └─ /signup/page.tsx
      └─ SignupForm
         └─ useAuth (signup, isLoading)

Protected Pages (with ProtectedLayout)
│
├─ /dashboard/page.tsx
│  └─ ProtectedLayout
│     └─ AppShell
│        ├─ Sidebar
│        │  └─ useAuth (user, logout)
│        │
│        └─ Page Content
│
├─ /profile/page.tsx
├─ /settings/page.tsx
├─ /watchlist/page.tsx
├─ /budget/page.tsx
├─ /progress/page.tsx
├─ /tutor/page.tsx
├─ /quests/page.tsx
├─ /skills/page.tsx
└─ /achievements/page.tsx

Public Pages (with PublicLayout)
│
├─ /glossary/page.tsx
│  └─ PublicLayout
│     ├─ If authenticated: AppShell + Content
│     └─ If not: Plain Content
│
├─ /learn/page.tsx
├─ /markets/page.tsx
└─ /financial-independence/page.tsx
```

## 10. State Management

```
useAuth Hook State:

Initial State:
{
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false
}

After Signup:
{
  user: {
    id: "uuid",
    email: "user@example.com",
    user_metadata: {...},
    app_metadata: {...},
    created_at: "2024-01-01T00:00:00Z",
    ...
  },
  session: {
    access_token: "jwt_token",
    refresh_token: "refresh_token",
    expires_in: 3600,
    expires_at: 1704096000,
    ...
  },
  isLoading: false,
  isAuthenticated: true
}

After Logout:
{
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false
}
```

## 11. Data Flow - Form Submission

```
SignupForm Component State:
┌──────────────────┐
│ email: string    │
│ password: string │
│ confirmPassword: │
│ string           │
│ error: string    │
│ isLoading: bool  │
└────────┬─────────┘
         │
         ├─ Validate on submit
         │  ├─ Email format
         │  ├─ Password length
         │  ├─ Password match
         │  └─ All fields filled
         │
         ├─ Call useAuth.signup()
         │  └─ Returns { user, error }
         │
         ├─ If error:
         │  └─ Set error state
         │
         └─ If success:
            └─ useAuth updates auth state
               ├─ user state set
               ├─ session state set
               ├─ isAuthenticated = true
               └─ Redirect to /dashboard
```

## 12. Error Handling Flow

```
User Input
    │
    ├─ Client-side validation
    │  ├─ Email format regex
    │  ├─ Password length check
    │  ├─ Password confirmation
    │  └─ Required fields check
    │     │
    │     ├─ Validation Error
    │     │  └─ Display error UI
    │     │
    │     └─ Validation Pass
    │        │
    │        └─ Submit to Supabase
    │           │
    │           ├─ Network/Auth Error
    │           │  ├─ "User already registered"
    │           │  ├─ "Invalid login credentials"
    │           │  ├─ "Password too weak"
    │           │  └─ Network errors
    │           │  └─ Display error UI
    │           │
    │           └─ Success
    │              └─ Update state & redirect
```

These diagrams provide a complete visual representation of the authentication system's architecture, flows, and component interactions.
