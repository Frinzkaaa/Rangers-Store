# Authentication & Role-Based Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure, high-speed role-based authentication and login system for Rangers Store POS with Owner and Kasir roles, route protection middleware, and a sleek store login UI.

**Architecture:** Lightweight HMAC-SHA256 signed session cookie (`rangers_session`) compatible with Next.js Edge Middleware and App Router API routes. Role-based route guard protects financial/batch management from cashiers while enabling frictionless PIN and password login at checkout.

**Tech Stack:** Next.js 14 App Router, Web Crypto API (Edge-compatible HMAC SHA-256), TypeScript, Lucide Icons, Vanilla CSS design system.

**Spec:** Direct user requirement: "langsung buatkan sesuai dengan standarnya" (standard thrifting POS login with Kasir & Owner roles).

## Global Constraints
- Node.js & Edge Runtime compatible: auth library must use standard Web Crypto API without heavy external dependencies.
- Brand fidelity: Rangers Store styling (vibrant indigo/blue accents, rounded cards, clean typography, badge indicators).
- Non-breaking: existing routes and POS checkout remain functional, all 7 existing test suites must continue to pass.
- Default roles & credentials:
  - Owner / Admin: username `owner`, PIN `8888` or password `rangers123`
  - Kasir: username `kasir`, PIN `1234` or password `kasir123`

## Review Focus
- Tampered cookie signature must be rejected immediately and clear invalid state.
- Edge Middleware must cleanly redirect unauthenticated requests to `/login?from=...` and avoid redirect loops.
- Cashier (`role: 'kasir'`) attempting to directly URL-browse to `/keuangan` or `/batches` must be redirected to `/pos`.
- Logout must immediately invalidate cookie and clear client state.
- POS cashier quick-login with 4-digit PIN must take < 2 seconds for high-paced bazar / mall checkout.

---

### Task 1: Auth Library & Session Token (`src/lib/auth.ts`) & Tests

**Files:**
- Create: `src/lib/auth.ts`
- Create: `tests/auth.test.ts`

**Interfaces:**
- Produces:
  - `interface UserSession { username: string; name: string; role: 'owner' | 'kasir'; exp: number }`
  - `function signSessionToken(session: Omit<UserSession, 'exp'>, expiresInSec?: number): Promise<string>`
  - `function verifySessionToken(token: string): Promise<UserSession | null>`
  - `function authenticateUser(identifier: string, secret: string): UserSession | null`

- [ ] **Step 1: Write the failing unit tests in `tests/auth.test.ts`**
  Cover `signSessionToken`, `verifySessionToken` (valid & invalid/tampered), and `authenticateUser` for both `owner` and `kasir` via PIN and password.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx tsx tests/auth.test.ts`
  Expected: FAIL with "Cannot find module '../src/lib/auth'"

- [ ] **Step 3: Implement `src/lib/auth.ts`**
  Implement credentials list, Web Crypto HMAC-SHA256 signature, token creation, and verification.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx tsx tests/auth.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add src/lib/auth.ts tests/auth.test.ts
  git commit -m "feat(auth): add edge-compatible session signing and authentication library"
  ```

---

### Task 2: Auth API Routes (`/api/auth/login`, `/api/auth/logout`, `/api/auth/me`)

**Files:**
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`

**Interfaces:**
- Consumes: `authenticateUser`, `signSessionToken`, `verifySessionToken` from `src/lib/auth.ts`
- Produces:
  - `POST /api/auth/login`: `{ username, passwordOrPin }` -> sets `Set-Cookie: rangers_session=...; HttpOnly; Path=/` and returns `{ success: true, user }`
  - `POST /api/auth/logout`: clears `rangers_session` cookie -> `{ success: true }`
  - `GET /api/auth/me`: reads cookie -> `{ authenticated: boolean, user?: UserSession }`

- [ ] **Step 1: Implement `src/app/api/auth/login/route.ts`**
  Validates input, checks credentials, creates signed token, and sets HTTP-only cookie.

- [ ] **Step 2: Implement `src/app/api/auth/logout/route.ts`**
  Sets expired cookie to remove session.

- [ ] **Step 3: Implement `src/app/api/auth/me/route.ts`**
  Extracts cookie from request and verifies signature to return active session.

- [ ] **Step 4: Test API routes using curl**
  Run:
  ```bash
  curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"kasir","secret":"1234"}'
  ```
  Expected: `{ "success": true, "user": { "username": "kasir", "role": "kasir" } }` with `set-cookie`.

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add src/app/api/auth/
  git commit -m "feat(auth): implement login, logout, and me API endpoints"
  ```

---

### Task 3: Edge Route Guard Middleware (`src/middleware.ts`)

**Files:**
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `verifySessionToken` from `src/lib/auth.ts`
- Produces: Next.js Middleware guarding `/pos`, `/transaksi`, `/dashboard`, `/batches`, `/keuangan`

- [ ] **Step 1: Implement `src/middleware.ts`**
  - Intercept protected paths.
  - If no cookie or invalid token, redirect to `/login?from=${pathname}`.
  - If role is `'kasir'` and attempting to access `/batches` or `/keuangan`, redirect to `/pos?error=unauthorized`.
  - If visiting `/login` while authenticated, redirect to `/pos`.

- [ ] **Step 2: Verify middleware with curl**
  Run:
  ```bash
  curl -I http://localhost:3000/keuangan
  ```
  Expected: `307 Temporary Redirect` to `/login?from=/keuangan`.

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add src/middleware.ts
  git commit -m "feat(auth): add route protection middleware for protected pages and role-based access"
  ```

---

### Task 4: Store Login Page UI (`src/app/login/page.tsx`)

**Files:**
- Create: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: `/api/auth/login` endpoint
- Produces: User-facing interactive login interface with role presets, PIN pad & password support

- [ ] **Step 1: Implement `src/app/login/page.tsx`**
  - Sleek card layout with Rangers Store branding and logo.
  - Role switcher tab (Kasir vs Owner).
  - PIN input mode (quick 4-digit numeric keypad) or standard Password mode.
  - Quick-fill preset buttons for instant test / store cashier onboarding.
  - Auto-redirect upon successful login to `from` query param or default `/pos`.

- [ ] **Step 2: Verify in browser**
  Test login flow with both Kasir (PIN: 1234) and Owner (PIN: 8888 / Password: rangers123).

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add src/app/login/page.tsx
  git commit -m "feat(auth): create modern store login page with PIN and password modes"
  ```

---

### Task 5: Navbar Integration & Test Suite Integration

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `package.json` (add `tests/auth.test.ts` to `npm test`)

**Interfaces:**
- Consumes: `/api/auth/me`, `/api/auth/logout`
- Produces: User profile indicator, role-based nav pill filtering, and Logout button in Navbar

- [ ] **Step 1: Update `src/components/Navbar.tsx`**
  - Fetch `/api/auth/me` on mount.
  - Display active user badge (e.g. `👤 Kasir` or `👑 Owner`).
  - If `role === 'kasir'`, omit or disable `/batches` and `/keuangan` links.
  - Add Logout button with icon that calls `/api/auth/logout` and navigates to `/login`.

- [ ] **Step 2: Update `package.json` test script**
  Include `tsx tests/auth.test.ts`.

- [ ] **Step 3: Run full verification**
  Run: `npm test && npm run build`
  Expected: All 8 test suites pass, build succeeds.

- [ ] **Step 4: Commit**
  Run:
  ```bash
  git add src/components/Navbar.tsx package.json
  git commit -m "feat(auth): integrate user role badge and logout action into Navbar"
  ```
