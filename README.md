# SkillSphere — Backend API

Intelligent Hyperlocal Freelance Ecosystem — full MERN-stack backend (Node.js + Express + MongoDB) implementing all 15 modules from the project spec: multi-role auth, AI-powered job matching, gig marketplace, proposals/bidding, real-time chat (Socket.IO), escrow payments (Stripe/Razorpay), reviews, notifications, disputes, and an admin dashboard.

## 1. Requirements

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Accounts/API keys for: Google OAuth, Cloudinary, Stripe and/or Razorpay, an SMTP email provider (Gmail app password or Mailtrap), and optionally Hugging Face (for AI matching embeddings)

## 2. Setup

```bash
# 1. Extract the zip and enter the folder
cd skillsphere-backend

# 2. Install dependencies
npm install

# 3. Copy the environment template and fill in your own values
cp .env.example .env

# 4. (Optional) create an initial admin account
npm run seed

# 5. Run in development (auto-restart on file changes)
npm run dev

# Or run in production
npm start
```

The API will start on `http://localhost:5000` by default (or whatever `PORT` you set in `.env`).

## 3. Environment variables

All required variables are documented in `.env.example`. At minimum, to boot the server you need:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — any long random strings
- `CLIENT_URL` — your frontend's URL (used in CORS and in email links)

Everything else (Google OAuth, Cloudinary, Stripe, Razorpay, Hugging Face, email) is optional at boot time — routes that need a given integration will return a clear error if that provider isn't configured, but the server itself will still start and every other module will work.

## 4. Project structure

```
skillsphere-backend/
├── server.js                 # App entry point, Express + Socket.IO wiring
├── config/                   # DB, Cloudinary, Passport (Google OAuth) config
├── models/                   # Mongoose schemas (11 collections)
├── middleware/                # auth (JWT), RBAC, error handler, rate limiter
├── controllers/               # Business logic per module
├── routes/                    # Express routers per module
├── sockets/chatSocket.js       # Real-time chat, typing indicators, WebRTC signaling
├── utils/                      # JWT helpers, email templates, AI matching, file upload, seed script
└── .env.example
```

## 5. Database collections (matches the spec)

`Users`, `Freelancers`, `Clients`, `Gigs`, `Proposals`, `Reviews`, `Messages`, `Payments`, `Notifications`, `Disputes`, `AdminLogs`.

## 6. API overview

All routes are prefixed with `/api`.

### Auth (`/api/auth`)
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Register client/freelancer, sends verification email |
| POST | `/login` | Login (returns `twoFactorRequired` if 2FA enabled) |
| POST | `/verify-2fa` | Complete login with TOTP code |
| GET | `/verify-email/:token` | Verify email address |
| POST | `/resend-verification` | Resend verification email (auth required) |
| POST | `/forgot-password` / `/reset-password/:token` | Password reset flow |
| POST | `/refresh-token` | Rotate access token using refresh cookie |
| POST | `/logout` | Invalidate refresh token |
| GET | `/google`, `/google/callback` | Google OAuth login |
| POST | `/2fa/setup`, `/2fa/confirm`, `/2fa/disable` | TOTP-based Two-Factor Authentication |
| GET | `/me` | Get current logged-in user |

### Users/Profiles (`/api/users`)
Freelancer profiles (skills, portfolio, resume, certifications, experience, availability, pricing, verification), client profiles, and freelancer analytics (profile views, earnings, ratings).

### Gigs (`/api/gigs`)
Create/update/delete gigs, milestones, invite freelancers, AI-powered freelancer recommendations per gig, attachment uploads.

### Proposals (`/api/proposals`)
Submit/accept/reject/negotiate/withdraw proposals; every proposal is auto-scored with an AI match score.

### Search (`/api/search`)
`/gigs` and `/freelancers` with text search, skill/category/price/location/rating filters, geo-radius search, and `/trending-skills`.

### Chat (`/api/chat`) + Socket.IO
REST endpoints for inbox/history; real-time messaging, typing indicators, read receipts, and optional WebRTC signaling events over Socket.IO (connect with `auth: { token: <JWT> }`).

### Reviews (`/api/reviews`) — smart reputation system
Not a simple average. Each review is scored and weighted:
- **Verified reviews**: a review is marked `isVerified` only if it's tied to a gig with an actually-released (paid) escrow payment — proof real, paid work happened, not just a gig marked complete.
- **Weighted, Bayesian-smoothed reputation score**: verified reviews count 1.5x, older reviews decay in weight (floored at 0.5x) rather than being dropped, and a low review count is pulled toward a platform-average prior so one 5-star review doesn't instantly show as a "perfect 5.0". See `utils/reputation.js`.
- **Fraud detection**: every new review is scored 0–100 at write-time (`utils/reviewFraud.js`) against heuristics — reciprocal review rings, duplicate/copy-pasted comment text, brand-new accounts posting immediately, extreme ratings with no explanation, and burst-posting patterns. Reviews scoring ≥50 are auto-flagged and excluded from the public rating until an admin clears them (`PUT /api/admin/reviews/:id/moderate`); admins can see the queue at `GET /api/admin/reviews/flagged`.
- **Review analytics**: `GET /api/reviews/analytics/:userId` returns rating distribution, average sub-scores (communication/quality/timeliness), verified-vs-unverified counts, and a 6-month rating trend.

### Notifications (`/api/notifications`) — real-time + email
All notifications go through a single service (`utils/notify.js`) so every event is simultaneously: written to the DB, pushed instantly over Socket.IO to the user's personal room (`notification` event), and emailed for the notification types that warrant it (new gig matching your skills, proposal accepted, payment received/released, review received) — everything else (typing, gig invitations, milestone nudges) stays in-app only to avoid over-emailing. Covers: new gig posted (broadcast to skill-matching freelancers, capped at 25), proposal received/accepted/rejected, new message, milestone updates, payment received/released, review received, review flagged (to admins), gig invitations, disputes raised/resolved, account suspended, freelancer verified.

### Payments (`/api/payments`)
Escrow deposits and milestone releases via Razorpay (order + signature verification) or Stripe (PaymentIntents + webhook), refunds, transaction history.

### Disputes (`/api/disputes`)
Raise disputes with evidence uploads, admin mediation and resolution (refund / pay freelancer / split / no action).

### Admin (`/api/admin`)
User management (suspend/reinstate), freelancer verification badges, gig approval/rejection, platform-wide payment monitoring (`/admin/payments`), review fraud moderation queue (`/admin/reviews/flagged`, `/admin/reviews/:id/moderate`), platform analytics (revenue with 6-month trend, active freelancers, top categories, job success rate), basic fraud-detection heuristics on freelancers/gigs, and an audit log.

## 7. Real-time chat (Socket.IO) quick reference

```js
const socket = io('http://localhost:5000', { auth: { token: accessToken } });

socket.emit('join_conversation', { otherUserId });
socket.emit('send_message', { receiverId, content, gigId });
socket.on('receive_message', (msg) => { /* ... */ });
socket.emit('typing', { receiverId });
socket.emit('mark_read', { otherUserId });
```

## 8. Security features included

JWT access + refresh tokens, bcrypt password hashing, RBAC middleware, Helmet, CORS, MongoDB query sanitization, HTTP parameter pollution protection, rate limiting (general + strict auth/sensitive limiters), Google OAuth, email verification, password reset tokens, TOTP 2FA, and an admin audit log.

## 9. Deploying

This backend is stateless aside from MongoDB, so it deploys cleanly to Render, Railway, Heroku, AWS Elastic Beanstalk, or a VPS with PM2 + Nginx. Remember to:

1. Set all environment variables in your hosting provider's dashboard.
2. Point `CLIENT_URL` to your deployed frontend's URL.
3. Point `GOOGLE_CALLBACK_URL` and Stripe webhook URL to your deployed backend's URL.
4. Use a process manager (PM2) or your platform's built-in restart policy in production.

## 10. Notes

- AI matching uses Hugging Face's Inference API for text embeddings when `HUGGINGFACE_API_KEY` is set; otherwise it falls back to a deterministic local embedding so the matching engine still works end-to-end in development/demo environments.
- Payment provider code is written against the real Stripe/Razorpay SDKs — you only need to supply live/test API keys to go live. No mock payment logic is used.
