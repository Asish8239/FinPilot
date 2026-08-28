# FinPilot Auth - Quick Reference Guide

## 🚀 Quick Start

### 1. Run Dev Server
```bash
cd frontend
npm run dev
```

### 2. Test Signup
```
Navigate to http://localhost:3000/signup
Fill form with:
  - Email: user@example.com
  - Password: ValidPass123
  - Confirm: ValidPass123
Click "Create Account"
✓ Should redirect to /dashboard
```

### 3. Test Login
```
Navigate to http://localhost:3000/login
Fill form with:
  - Email: user@example.com
  - Password: ValidPass123
Click "Sign In"
✓ Should redirect to /dashboard
```

### 4. Test Protected Routes
```
Navigate to http://localhost:3000/dashboard (not logged in)
✓ Should redirect to /login
After login:
✓ Should show dashboard
```

---

## 📁 Key Files Location

### Core Authentication
- **Client Setup**: `src/lib/supabase-client.ts`
- **Server Setup**: `src/lib/supabase-server.ts`
- **Middleware**: `src/middleware.ts`
- **Auth Hook**: `src/hooks/useAuth.ts`

### Components
- **Login Form**: `src/components/auth/LoginForm.tsx`
- **Signup Form**: `src/components/auth/SignupForm.tsx`
- **Protected Layout**: `src/components/layout/ProtectedLayout.tsx`
- **Public Layout**: `src/components/layout/PublicLayout.tsx`

### Pages
- **Login Page**: `src/app/login/page.tsx`
- **Signup Page**: `src/app/signup/page.tsx`

### Documentation
- **Setup Guide**: `AUTH_SETUP.md`
- **Test Report**: `AUTH_TEST_REPORT.md`
- **Flow Diagrams**: `AUTH_FLOW_DIAGRAM.md`

---

## 🔑 Core Functions

### Using useAuth Hook

```typescript
import { useAuth } from "@/hooks/useAuth";

export function MyComponent() {
  const { 
    user,                // Current user object or null
    session,             // Current session or null
    isLoading,          // Loading state during auth check
    isAuthenticated,    // Boolean flag
    signup,             // signup(email, password)
    login,              // login(email, password)
    logout,             // logout() - clears everything
    getCurrentUser      // getCurrentUser() - async fetch
  } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return <div>Welcome, {user?.email}</div>;
}
```

### Protecting a Page

```typescript
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

export default function DashboardPage() {
  return (
    <ProtectedLayout>
      {/* This only shows if user is authenticated */}
      <h1>Dashboard</h1>
    </ProtectedLayout>
  );
}
```

### Public Page (Works With or Without Auth)

```typescript
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function GlossaryPage() {
  return (
    <PublicLayout>
      {/* Shows for everyone, with AppShell if authenticated */}
      <h1>Glossary</h1>
    </PublicLayout>
  );
}
```

---

## 🛣️ Route Reference

### Public Routes (No Auth Required)
```
/glossary                    # Financial glossary - ALWAYS accessible
/learn                       # Learning modules - ALWAYS accessible
/markets                     # Market info - ALWAYS accessible
/financial-independence      # FI education - ALWAYS accessible
/login                       # Login page
/signup                      # Signup page
/                           # Home page
```

### Protected Routes (Auth Required)
```
/dashboard                   # User dashboard
/profile                     # User profile
/settings                    # User settings
/watchlist                   # Stock watchlist
/budget                      # Budget planner
/progress                    # Learning progress
/tutor                       # AI tutor
/quests                      # Quests
/skills                      # Skills
/achievements                # Achievements
```

---

## 🧪 Common Test Scenarios

### Test 1: Signup with Valid Data
```
1. Go to /signup
2. Enter: user@test.com, password123, password123
3. Click "Create Account"
4. ✓ Redirect to /dashboard
5. ✓ See user email in sidebar
```

### Test 2: Signup with Invalid Email
```
1. Go to /signup
2. Enter: notanemail, password123, password123
3. Click "Create Account"
4. ✓ Show error: "Please enter a valid email address"
```

### Test 3: Signup with Short Password
```
1. Go to /signup
2. Enter: user@test.com, short, short
3. Click "Create Account"
4. ✓ Show error: "Password must be at least 8 characters"
```

### Test 4: Login with Correct Credentials
```
1. Go to /login
2. Enter: user@test.com, password123
3. Click "Sign In"
4. ✓ Redirect to /dashboard
```

### Test 5: Login with Wrong Password
```
1. Go to /login
2. Enter: user@test.com, wrongpassword
3. Click "Sign In"
4. ✓ Show error: "Invalid login credentials"
```

### Test 6: Protect Route Access
```
1. Go to /dashboard (NOT logged in)
2. ✓ Redirect to /login
3. Go to /login, sign in
4. Go to /dashboard
5. ✓ Dashboard loads successfully
```

### Test 7: Session Persistence
```
1. Login to /dashboard
2. Refresh page (F5)
3. ✓ Still logged in, no redirect to /login
```

### Test 8: Logout
```
1. Login and go to /dashboard
2. Click logout button in sidebar
3. ✓ Redirect to /login
4. Try to access /dashboard
5. ✓ Redirect to /login (session cleared)
```

---

## 🐛 Troubleshooting

### Issue: "Session is null"
**Solution**: 
- Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`
- Check `.env.local` has `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verify Supabase project URL format

### Issue: Always Redirects to /login
**Solution**:
- Check browser console for errors
- Check network tab for auth API calls
- Verify Supabase credentials in `.env.local`

### Issue: Form Doesn't Submit
**Solution**:
- Check all required fields are filled
- Check email format is valid
- Check password meets requirements (8+ chars)
- Check browser console for JavaScript errors

### Issue: Session Lost After Refresh
**Solution**:
- Check browser allows cookies for localhost
- Check incognito mode (private browsing can block cookies)
- Restart dev server
- Clear browser cache and cookies

### Issue: Can Access Protected Route Without Login
**Solution**:
- Verify middleware is running (`npm run dev` shows middleware in terminal)
- Verify route is in protected list in `src/middleware.ts`
- Hard refresh page (Ctrl+Shift+R)

---

## 📊 Environment Variables

### Required in `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

### For Development
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
OPENAI_API_KEY=your_key
GROQ_API_KEY=your_key
ALPHA_VANTAGE_API_KEY=your_key
```

### Check Current Setup
```bash
cd frontend
cat .env.local  # View current values
```

---

## 🔒 Security Checklist

✅ Passwords are NOT shown in forms (type="password")
✅ Sessions stored in HTTP-only cookies (no JS access)
✅ Email format validated
✅ Password length enforced (8+ characters)
✅ Token automatically refreshed
✅ HTTPS ready for production
✅ No sensitive data in browser storage
✅ CSRF protection via Supabase

---

## 🚀 Build & Deploy

### Build for Production
```bash
cd frontend
npm run build
```

### Check Build Output
```bash
# Should see:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages
```

### Run Production Build Locally
```bash
cd frontend
npm run build
npm start
```

### Deploy Checklist
- [ ] Build passes: `npm run build`
- [ ] Environment variables set on hosting
- [ ] Supabase project created
- [ ] Email verification configured
- [ ] CORS settings updated
- [ ] HTTPS enabled
- [ ] Monitoring enabled

---

## 📚 Documentation Links

| Document | Purpose |
|----------|---------|
| `AUTH_SETUP.md` | Detailed setup and architecture |
| `AUTH_TEST_REPORT.md` | Complete test scenarios |
| `AUTH_FLOW_DIAGRAM.md` | Visual flow diagrams |
| `WORKSTREAM_A1_COMPLETE.md` | Project completion summary |

---

## 🎯 Common Tasks

### Add a New Protected Page
```typescript
// 1. Create page file
// src/app/new-page/page.tsx

import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

export default function NewPage() {
  return (
    <ProtectedLayout>
      <h1>New Protected Page</h1>
    </ProtectedLayout>
  );
}

// 2. Add to middleware if needed
// src/middleware.ts - add to PROTECTED_PAGES array
```

### Access Current User in Component
```typescript
"use client";
import { useAuth } from "@/hooks/useAuth";

export function UserInfo() {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>User: {user?.email}</p>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  );
}
```

### Handle Logout
```typescript
"use client";
import { useAuth } from "@/hooks/useAuth";

export function LogoutButton() {
  const { logout } = useAuth();
  
  return (
    <button onClick={logout}>
      Sign Out
    </button>
  );
}
```

---

## 🔄 Development Workflow

1. **Start dev server**
   ```bash
   cd frontend && npm run dev
   ```

2. **Navigate to app**
   ```
   http://localhost:3000
   ```

3. **Make changes**
   - Edit components in `src/`
   - Hot reload automatic

4. **Test flow**
   - Signup at `/signup`
   - Login at `/login`
   - Access protected routes
   - Test logout

5. **Build before commit**
   ```bash
   npm run build
   npm run lint
   ```

---

## 📞 Support

For issues:

1. Check **AUTH_SETUP.md** troubleshooting section
2. Check browser console for errors
3. Check network tab for API responses
4. Verify environment variables in `.env.local`
5. Check Supabase project is running
6. Review **AUTH_FLOW_DIAGRAM.md** for expected flow

---

## ✅ Status

**Build**: ✅ Passing
**Types**: ✅ All valid
**Auth**: ✅ Production ready
**Routes**: ✅ Protected
**Docs**: ✅ Complete

**Ready for Production**: YES ✅

---

Last Updated: December 2024  
Version: 1.0  
Status: Production Ready
