# GymFrek

Live Link: https://gym-frek.vercel.app/

A multi-tenant gym management platform with member, plan, dues, and admin management — built with a Node/Express backend and a React (Vite + TypeScript) frontend.

## Tech Stack

**Backend**
- Node.js + Express
- PostgreSQL (raw SQL migrations in `server/db`)
- Cookie-based auth with refresh tokens
- Helmet, CORS, rate limiting, XSS/HPP protection

**Frontend**
- React + TypeScript
- Vite
- Tailwind CSS
- Axios for API calls

**Deployment**
- Frontend: Vercel
- Backend: Render

## Project Structure

### Server

```
server/
├── db/                     # SQL migrations + schema
├── scripts/                # One-off admin/maintenance scripts
├── src/
│   ├── config/              # DB config
│   ├── controllers/         # Route handlers (auth, gym, members, plans, dues, dashboard, admin, users)
│   ├── middleware/          # Auth, tenant scoping, validation, error handling
│   ├── routes/               # Express routers
│   ├── uploads/              # Gym logos, member photos
│   ├── utils/                # App bootstrap, token helpers, upload helpers
│   ├── app.js
│   └── server.js
├── .env / .env.example
└── package.json
```

### Client

```
client/
├── public/
├── src/
│   ├── api/                 # Axios instance + per-resource API modules
│   ├── components/          # Shared UI (modals, layout, sidebar, gates, etc.)
│   ├── context/              # Auth, Gym, Theme, Toast contexts
│   ├── pages/
│   │   ├── admin/            # Admin overview, gym detail/list
│   │   ├── gym/               # Gym settings, gym registration
│   │   ├── members/           # Member management
│   │   └── plans/              # Membership plans
│   ├── styles/
│   └── types/
├── .env / .env.example
├── tailwind.config.js
└── vite.config.ts
```

## Environment Variables

### Server

| Variable | Description |
|---|---|
| `CLIENT_URL` | Deployed frontend origin, used for CORS (must exactly match the frontend URL, **no trailing slash**) |
| `DATABASE_URL` | PostgreSQL connection string |

### Client

| Variable | Description |
|---|---|
| `VITE_API_URL` | Deployed backend base URL (e.g. `https://gymfrek.onrender.com`) |

## Deployment Notes

- Backend is on Render's free tier — expect a cold-start delay (~30–60s) after inactivity.
- CORS `origin` in `server/src/utils/app.js` is read from `CLIENT_URL`; it must match the frontend's origin **exactly**, including protocol and with no trailing slash.
- Auth cookies are set with `secure: true` and `sameSite: 'none'` to work across the Vercel/Render cross-domain setup.

## Roadmap / Planned Features

- **WhatsApp integration (Meta Cloud API)** — automated member notifications (due reminders, plan expiry, ticket updates) and two-way messaging via the WhatsApp Business Platform.
- **Payment gateway integration (Razorpay)** — online due/invoice payments, payment status webhooks, and receipt generation directly from the member and admin dashboards.
- **AI-powered diet & health tips** — personalized nutrition and fitness suggestions for members, generated via an LLM based on member profile data (goals, activity, membership plan).

## Getting Started

### Backend

```bash
cd server
npm install
cp .env.example .env   # fill in DATABASE_URL, CLIENT_URL, etc.
npm run dev
```

### Frontend

```bash
cd client
npm install
cp .env.example .env   # set VITE_API_URL to your backend URL
npm run dev
```
