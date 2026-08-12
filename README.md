# Comp-Dash

A production-grade mobile-first SaaS platform for college competition management.

## Architecture

```
comp-dash/
├─ apps/
│  ├─ mobile/          # React Native (Expo) - Student & Advisor app
│  └─ web/             # Next.js 15 - Admin dashboard
├─ packages/
│  ├─ api/             # TanStack Query hooks & API client
│  ├─ design-system/   # Shared UI components (Button, Card, Badge, etc.)
│  ├─ hooks/           # Shared React hooks
│  ├─ i18n/            # Internationalization (en, ta, hi)
│  ├─ types/           # TypeScript type definitions
│  └─ utils/           # Utility functions
└─ locales/            # Translation files
```

## Tech Stack

- **Mobile**: React Native, Expo, React Navigation
- **Web**: Next.js 15, React, Tailwind CSS
- **State**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **i18n**: i18next + react-i18next

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn
- Expo CLI (for mobile)
- Android Studio / Xcode (for mobile development)

### Installation

```bash
# Install dependencies
npm install

# Start web dashboard
npm run dev:web

# Start mobile app
npm run dev:mobile
```

### Development

```bash
# Run web app
cd apps/web && npm run dev

# Run mobile app
cd apps/mobile && npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Formatting
npm run format
```

## Design System

The design system follows Apple-inspired design language with:

- **Colors**: Primary violet (#6C4CF1), semantic colors for status
- **Typography**: Inter font family, clear hierarchy
- **Components**: Button, Card, Badge, Avatar, Input, Skeleton, etc.
- **Spacing**: 8-point grid system
- **Border Radius**: Rounded corners (12-20px)

### Available Components

```tsx
import { Button, Card, Badge, Avatar, Input, Skeleton } from '@comp-dash/design-system'

<Button variant="primary" size="md">Click me</Button>
<Card padding="lg">Content</Card>
<Badge variant="success" dot>Active</Badge>
<Avatar name="John Doe" size="lg" />
<Input label="Email" placeholder="Enter email" />
<Skeleton variant="heading" width="half" />
```

## API Layer

All API calls go through TanStack Query hooks:

```tsx
import { useCompetitions, useRegistrations } from '@comp-dash/api'

const { data, isLoading } = useCompetitions({ category: 'hackathon' })
const { data: registrations } = useRegistrations({ status: 'verified' })
```

## Internationalization

Translations are in `locales/` directory:

- `en.json` - English
- `ta.json` - Tamil
- `hi.json` - Hindi

```tsx
import { useTranslation } from 'react-i18next'

const { t } = useTranslation()
return <h1>{t('home.greeting', { name: 'John' })}</h1>
```

## Features

### Mobile App (Student/Advisor)
- **Home**: Personalized dashboard with stats, deadlines, verified registrations
- **Discover**: Browse and filter competitions
- **Competition Details**: Full competition info with registration
- **History**: Track registration status
- **Profile**: Account settings and preferences
- **Notifications**: Real-time updates

### Web Dashboard (Admin)
- **Dashboard**: Overview with charts and key metrics
- **Competitions**: Manage all competitions
- **Registrations**: Review and verify registrations
- **Students**: Student management
- **Advisors**: Advisor management
- **Departments**: Department overview
- **Winners**: Winner management
- **Analytics**: Detailed analytics
- **Notifications**: Notification management
- **Settings**: System configuration
- **Audit Logs**: Activity tracking

## Environment Variables

### Web App (`apps/web/.env.local`)

```env
# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase (server-only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App API base URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Google OAuth (server-only, for Gmail verification)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# Real-time webhook secret
REAL_TIME_API_SECRET=change-me-to-a-long-random-string

# Firebase Admin (server-only, JSON string)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

See `apps/web/.env.example` for the full annotated list.

## Auth & Database (Supabase)

- Run `supabase/schema.sql` in the Supabase SQL editor to create every table,
  RLS policies, and the `on_auth_user_created` trigger that auto-creates a
  `profiles` row on signup.
- Sign in / sign up use Supabase Auth (`/sign-in`, `/sign-up`).
- Seed demo users:
  ```bash
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:auth
  ```
  Demo logins: `admin@citchennai.net`, `hod@citchennai.net`,
  `advisor@citchennai.net`, `student@citchennai.net` (password `CompDash@123`).
- Gmail OAuth tokens are stored **server-side** in the `gmail_tokens` table and
  are only touched via the service role. The client never sees or stores them.
  The OAuth dance runs through `/api/auth/gmail` and `/api/auth/gmail/callback`.

### Google Sign-In (OAuth)

The "Continue with Google" button on `/sign-in` and `/sign-up` runs through
`/api/auth/google` → Google consent → `/api/auth/google/callback`. The flow:

1. Redirects to Google with the `hd=citchennai.net` hosted-domain filter, so the
   account picker only shows college accounts.
2. Server-side, the callback **enforces that the signed-in Google account ends
   in `@citchennai.net`** — anything else is rejected and redirected back to
   `/sign-in` with an error.
3. It then **verifies the user against the database** to grant the right
   privileges:
   - `role_access` (explicit allowlist `email → role/department`; `granted = false`
     blocks the account),
   - falling back to `profiles`, then `user_profiles`,
   - otherwise the account defaults to the `student` role.
4. The DB-resolved role/department is written into the Supabase auth user's
   metadata, and a session is minted via `signInWithIdToken` so the role is
   correct from the first request.

**Required setup:**

- `NEXT_PUBLIC_APP_URL` must point at the app origin (no trailing slash).
- Add `{NEXT_PUBLIC_APP_URL}/api/auth/google/callback` as an **Authorized
  redirect URI** on your OAuth client in the
  [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
- Enable the **Google** provider in Supabase → Auth → Providers and paste the
  same `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- For staff/admin access, insert rows into `role_access`, e.g.:
  ```sql
  insert into role_access (email, role, department, granted)
  values ('hod@citchennai.net', 'hod', 'CSE', true);
  ```


### Mobile App (`apps/mobile/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

## License

Private - All rights reserved.
