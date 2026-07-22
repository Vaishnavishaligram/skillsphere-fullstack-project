# SkillSphere — Frontend

React + Vite frontend for the SkillSphere hyperlocal freelance marketplace. Covers all four weeks of the frontend plan: auth/profile/dashboard, gig marketplace/proposals/search, messaging/reviews/notifications, and payments/admin dashboard — plus the smart reputation system and real-time notification service from the updated spec.

**Stack**: React 18, Redux Toolkit (client/session state), TanStack React Query (server state, caching, mutations), Tailwind CSS, Socket.IO client.

Pairs with the `skillsphere-backend` API (Node/Express/MongoDB) — deploy that first, or point this at wherever it's running.

## 1. Requirements

- Node.js 18+
- A running instance of the SkillSphere backend (local or deployed)

## 2. Local setup

```bash
cd skillsphere-frontend
npm install
cp .env.example .env
# edit .env: point VITE_API_URL / VITE_SOCKET_URL at your backend
npm run dev
```

Open `http://localhost:5173`.

## 3. Environment variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend REST API, e.g. `https://skillsphere-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | Base URL of the backend for Socket.IO, e.g. `https://skillsphere-backend.onrender.com` (no `/api` suffix) |

## 4. State architecture

Two different kinds of state, deliberately kept separate:

- **Redux Toolkit** (`src/store/`) owns *client/session* state: the logged-in user (`authSlice`, with thunks for login/register/2FA/logout/session bootstrap) and a live unread-notification counter (`notificationsSlice`) that updates the instant a Socket.IO event arrives — no need to wait for a refetch just to move a badge.
- **React Query** (`src/hooks/queries/`) owns *server* state: every list, detail view, and mutation (gigs, proposals, search, reviews, notifications, payments, disputes, admin data) goes through a `useQuery`/`useMutation` hook, grouped one file per domain, with a shared query-key factory (`src/hooks/queries/keys.js`) so cache invalidation after a mutation — or after a real-time Socket.IO event — always targets the exact right cached data.

`src/context/AuthContext.jsx` is kept only as a thin compatibility wrapper (same `useAuth()` hook signature as before) so every page can keep doing `import { useAuth } from '../context/AuthContext'` while the actual state lives in Redux. `src/lib/queryClient.js` exports the React Query client as a plain singleton, which is what lets `context/SocketContext.jsx` call `queryClient.invalidateQueries(...)` directly from a Socket.IO event handler, outside the React tree.

## 5. Project structure

```
src/
├── api/            # Axios instance (with auto token-refresh) + endpoint functions per domain
├── store/           # Redux Toolkit: authSlice (session), notificationsSlice (live unread count)
├── hooks/queries/    # React Query hooks per domain (gigs, proposals, reviews, notifications, payments, admin, disputes, chat, profile) + shared key factory
├── lib/               # React Query client singleton
├── context/            # AuthContext (thin Redux-backed compatibility layer), SocketContext (Socket.IO connection + real-time cache invalidation)
├── components/          # Shared UI: cards, badges, modal, rating stars, notification bell/icon, reputation breakdown, etc.
├── layouts/               # AuthLayout (login/register split screen), DashboardLayout (sidebar + topbar)
└── pages/
    ├── auth/          # Login, Register, email verification, forgot/reset password, Google OAuth callback
    ├── profile/        # Edit profile (basic + freelancer + client fields, 2FA setup), public profile views
    ├── gigs/            # Marketplace, gig detail (milestones/proposals/AI recommendations), create gig, my gigs, search
    ├── proposals/        # My proposals (freelancer)
    ├── messages/          # Real-time chat (Socket.IO): inbox + conversation view, typing indicators, read receipts
    ├── notifications/     # Notification center (real-time badge via Redux, list via React Query)
    ├── payments/           # Transaction history + Razorpay escrow funding + milestone release
    └── admin/               # User management, gig approval, review-fraud moderation, payment monitoring, dispute mediation
```

## 6. Smart reputation & notifications (updated spec)

- **`components/ReputationBreakdown.jsx`** — renders `GET /api/reviews/analytics/:userId`: verified-vs-total review count, communication/quality/timeliness sub-scores, a rating-distribution bar chart, and a 6-month trend line. Embedded on both `FreelancerProfileView` and `ClientProfileView`.
- **`pages/admin/AdminReviewModeration.jsx`** — the fraud-detection review queue. Every review the backend auto-flags (reciprocal review rings, duplicate text, brand-new accounts, burst-posting, extreme ratings with no explanation) shows up here with its fraud score and triggered signals; an admin clears it (restores it to the public rating) or confirms it as fraud.
- **`components/NotificationIcon.jsx`** — maps every `Notification.type` from the backend (new gig posted, proposal accepted/rejected, payment received/released, review received, review flagged, disputes, etc.) to a distinct icon and color, used in both the bell dropdown and the full notifications page.
- Real-time delivery: `context/SocketContext.jsx` listens for a single `notification` Socket.IO event, updates the Redux unread badge instantly, shows a toast, and invalidates the specific React Query caches that event type affects (e.g. a `new_gig_posted` event invalidates the gig marketplace list so a matching freelancer sees it appear without refreshing).

## 7. Design system

The visual identity leans into SkillSphere's "hyperlocal" positioning with a wayfinding/civic-signage aesthetic rather than a generic template look:

- **Colors**: deep ink-navy (`#10192E`) surfaces and text, warm off-white paper background, signal-amber accent for primary actions, teal "pin" accent for verified/location markers, moss green and rose for success/danger states.
- **Type**: Space Grotesk (display/headers), Inter (body/UI), IBM Plex Mono (stats, prices, IDs).
- **Signature motif**: a small connecting node/pin mark (three dots joined by lines) used in the logo, loading states, and empty states — visually reinforcing the "local network" concept throughout the app chrome.

All tokens live in `tailwind.config.js` and reusable component classes (`.btn-*`, `.card`, `.badge-*`, `.input`, etc.) live in `src/index.css`.

## 8. Deploying to Vercel

**Option A — Vercel dashboard**
1. Push this project to a GitHub repo.
2. Go to vercel.com → **Add New** → **Project** → import the repo.
3. Framework preset: Vite (auto-detected). Build command `npm run build`, output directory `dist` (auto-detected).
4. Add environment variables `VITE_API_URL` and `VITE_SOCKET_URL` under **Settings → Environment Variables**.
5. Deploy. Vercel gives you a URL like `https://skillsphere-frontend.vercel.app`.

**Option B — Vercel CLI**
```bash
npm i -g vercel
cd skillsphere-frontend
vercel
# follow prompts, then set env vars:
vercel env add VITE_API_URL
vercel env add VITE_SOCKET_URL
vercel --prod
```

The included `vercel.json` adds an SPA rewrite so client-side routes (e.g. `/dashboard`, `/gigs/123`) don't 404 on refresh.

### After deploying
- Update your **backend's** `CLIENT_URL` env var to this Vercel URL (needed for CORS and email links).
- Update Google OAuth's authorized redirect and your backend's `GOOGLE_CALLBACK_URL` if you use Google sign-in.
- Because chat relies on Socket.IO/WebSockets, make sure your backend host supports persistent WebSocket connections (Render/Railway do; some serverless platforms don't — this is why the backend should NOT be deployed as a Vercel serverless function).

## 9. Notes

- Auth uses a short-lived access token in memory/localStorage plus an httpOnly refresh-token cookie; the Axios client auto-refreshes on 401s.
- Payments use the real Razorpay Checkout.js script — you need live/test Razorpay keys configured on the backend for the "Fund a milestone" flow to work end-to-end.
- Admin routes are only reachable by users with `role: "admin"` (create one via the backend's `npm run seed`, or promote a user directly in MongoDB).
- Not yet built: an availability-calendar/booking UI (the backend only stores raw availability slots, no scheduling system exists yet on either side), and a UI for the backend's freelancer/gig fraud-flags endpoint (`useFraudFlags` hook exists but isn't wired to a page).
