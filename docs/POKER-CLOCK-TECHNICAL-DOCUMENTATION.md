# Poker Clock — Complete Technology & Implementation Documentation

**Project:** Poker Clock / PLATINUM  
**Repository:** `aleyas/clock`  
**Production application:** `platinum-app/`  
**Status:** Production-oriented MVP source implemented; deployment and production hardening remain.

## 1. Executive Summary

Poker Clock is a browser-based poker tournament clock. The project evolved from static HTML/CSS/vanilla-JS prototypes into a production-oriented PLATINUM application.

The current production application provides:

- Next.js/React/TypeScript web application
- Email/password authentication
- PostgreSQL persistence through Supabase
- Organizer dashboard
- Tournament editor
- Live organizer control
- Dedicated TV display
- QR + 6-digit TV pairing
- Realtime session updates
- Blind levels and breaks
- Players and average-stack calculation
- Payouts and payout ticker
- Organizer branding
- Sponsor configuration and temporary sponsor overlay
- Platinum unlimited tournament model
- PWA/mobile web support
- Subscription/status model

The application is not yet a fully deployed commercial service. Supabase/Vercel deployment, secure pairing, server-authoritative timing, production media storage, payment integration and full testing remain.

---

## 2. Product Decisions

| Area | Decision |
|---|---|
| Product | Poker Clock PLATINUM |
| TV | Dedicated browser display on TV/monitor |
| Organizer | Dashboard + live control page |
| Mobile | PWA first; native iOS/Android later |
| Login | Email/password initially |
| TV pairing | QR code + short 6-digit code |
| Realtime | Supabase Realtime |
| Database | PostgreSQL via Supabase |
| Hosting target | Vercel + Supabase |
| Storage direction | Object storage + CDN |
| Subscription | Platinum subscription model; payment not connected |
| Tournament saves | Unlimited for Platinum |
| Default sponsor | GGPoker seed entry |
| Language direction | German/English-ready |

---

## 3. Repository Structure

```
clock/
├── index.html
├── bronze.html
├── bronze/index.html
├── gold.html
├── gold/index.html
├── platinum.html
├── platinum/index.html
└── platinum-app/
    ├── app/
    │   ├── control/page.tsx
    │   ├── dashboard/page.tsx
    │   ├── login/page.tsx
    │   ├── subscription/page.tsx
    │   ├── tournament/page.tsx
    │   ├── tv/page.tsx
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── lib/
    │   ├── presets.ts
    │   ├── supabase/client.ts
    │   └── types.ts
    ├── public/
    │   ├── icon.svg
    │   └── manifest.webmanifest
    ├── supabase/
    │   └── schema.sql
    ├── .env.example
    ├── next.config.ts
    ├── next-env.d.ts
    ├── package.json
    ├── README.md
    └── tsconfig.json
```

---

## 4. Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16.3.6 | Web application framework and routing |
| React 19.2.0 | UI |
| TypeScript 5.8.x | Typed application code |
| Supabase JS 2.57.x | Database/Auth/Realtime client |
| @supabase/ssr 0.7.x | SSR architecture support |
| PostgreSQL | Persistent relational database |
| Supabase Realtime | Live session synchronization |
| qrcode 1.5.4 | QR pairing |
| CSS | Responsive UI and TV design |
| PWA manifest | Installable mobile web application |
| GitHub | Source control |
| GitHub Pages | Static prototype hosting |
| Vercel | Planned production hosting |
| Supabase Storage/CDN | Planned production media storage |

---

## 5. Static Prototype Technology

Before the production application, FREE, BRONZE, GOLD and PLATINUM were implemented as static browser applications.

They use:

- HTML
- CSS
- Vanilla JavaScript
- localStorage
- No backend
- No database
- No user accounts
- No true TV-to-phone synchronization

BRONZE uses `pokerClockBronzeTournaments` and is limited to two saved tournaments.

GOLD uses `pokerClockGoldTournaments` for tournaments and `pokerClockGoldMedia` for browser media storage, with a maximum of ten saved tournaments.

These prototypes remain useful as visual and product references, but the production architecture moves persistence and live state to Supabase.

---

## 6. Production Architecture

The production application has separate browser roles:

1. **Landing page** — product entry point.
2. **Login** — authentication.
3. **Dashboard** — tournament management.
4. **Tournament editor** — configuration.
5. **Control** — organizer live remote.
6. **TV** — public tournament display.
7. **Subscription** — plan/status page.

Architecture:

```
Organizer Phone / Tablet
        |
        | PWA / HTTPS / Realtime
        v
Next.js Application
        |
        +-- Supabase Auth
        +-- Tournament logic
        +-- Session logic
        +-- Pairing
        +-- Subscription model
        |
        v
Supabase PostgreSQL
        |
        +-- Realtime
        +-- Future Storage/CDN

TV Browser
        |
        | Pairing + Realtime
        v
Same live tournament session
```

---

## 7. Main Routes

| Route | Purpose |
|---|---|
| `/` | Platinum landing page |
| `/login` | Login/signup |
| `/dashboard` | Tournament list and creation |
| `/tournament?id=...` | Tournament editor |
| `/control?session=...` | Organizer live control |
| `/tv` | TV display and pairing |
| `/subscription` | Subscription/status |

---

## 8. Implemented Features

### Authentication

- Supabase Auth
- Email/password signup
- Email/password login
- User profile creation through database trigger
- Initial Platinum/trial profile model

### Tournament Management

- Unlimited Platinum tournaments
- Tournament name
- Total entries
- Starting stack
- Entry fee
- Branding name/logo
- Blind levels
- Breaks
- Payouts
- Sponsors
- Save/edit functionality

### Blind Structure

- Standard preset
- Editable levels
- Add/delete levels
- Add/delete breaks
- Duration
- Small blind
- Big blind
- Ante
- Big Blind Ante model

### Live Control

- Start
- Pause
- Previous level
- Next level
- +30 seconds
- -30 seconds
- Players +/-
- Reset players
- Current level
- Next level
- Session status

### Player / Stack Logic

`remainingPlayers` is separate from `totalEntries`.

Average stack:

```
averageStack = startingStack * totalEntries / remainingPlayers
```

This means the original field remains unchanged while the remaining player count changes.

### Payouts

- Multiple payout places
- Money or free text
- Show/hide
- Ordinal labels: 1st, 2nd, 3rd, 4th...
- Payout ticker for longer structures

Ordinal implementation:

```js
const ordinal = (n) => {
  const x = Number(n);
  if (x % 100 >= 11 && x % 100 <= 13) return x + 'th';
  const r = x % 10;
  return x + (r === 1 ? 'st' : r === 2 ? 'nd' : r === 3 ? 'rd' : 'th');
};
```

### Branding

- Club/event name
- Logo URL
- TV branding area
- “powered by Poker and more”

Current production editor uses image URLs. Upload/storage integration is planned.

### Sponsors

- Multiple sponsors
- Sponsor name
- Sponsor image
- Enabled/disabled
- Display order
- Interval
- Duration
- Temporary advertising overlay
- Essential clock information remains visible
- Sponsor can be displayed during live operation

The default seeded sponsor is GGPoker. The current MVP uses its favicon URL; an approved commercial creative should replace this before public use.

### TV Pairing

- Start a live session
- Generate 6-digit code
- Display QR code on organizer control
- TV can pair with code
- TV reads the session/tournament data
- Realtime session updates are subscribed to by the TV

### PWA

- Web manifest
- Application icon
- Mobile browser installation support
- Organizer control usable on phone/tablet
- Native apps planned later

---

## 9. Platinum TV Layout

The TV visual system follows the Platinum design:

- 16:9-oriented
- Black / white / gray visual language
- Left 25%
- Center 50%
- Right 25%

### Left

- Organizer logo
- Club/event branding
- Sponsor area

### Center

- Large, thin timer
- Blinds
- Ante
- Next level
- Payout ticker
- Sponsor overlay when active

### Right

- Level
- Total time
- Next break
- Entry
- Players
- Average stack

The timer is deliberately larger and thinner than surrounding information.

---

## 10. Database

Schema file:

`platinum-app/supabase/schema.sql`

### Tables

| Table | Purpose |
|---|---|
| `profiles` | User profile and plan |
| `tournaments` | Tournament master data |
| `tournament_levels` | Levels and breaks |
| `payouts` | Prize structure |
| `sponsors` | Sponsor configuration |
| `sessions` | Live tournament state |

### Important tournament fields

- name
- starting_stack
- total_entries
- entry_fee
- brand_name
- brand_image_url

### Important session fields

- pairing_code
- status
- current_index
- remaining_seconds
- server_started_at
- remaining_players
- total_entries
- active_sponsor_id
- updated_at

---

## 11. Database Security

The schema includes:

- Row Level Security
- Organizer ownership policies
- Public active-session display policies
- Realtime publication for sessions
- Profile creation trigger

Current public TV policies are MVP-level.

**Required production improvement:** use a secure pairing RPC or short-lived session token so a pairing code does not provide broad access to active session data.

---

## 12. Realtime Session Model

The current MVP stores live state in `sessions` and subscribes to PostgreSQL changes.

The organizer changes session state and the TV receives those updates.

Current fields:

- `status`
- `current_index`
- `remaining_seconds`
- `server_started_at`
- `remaining_players`
- `total_entries`
- `active_sponsor_id`
- `updated_at`

### Important limitation

The current countdown is **not yet fully server-authoritative**.

The production target is:

- Backend owns canonical session state.
- Backend owns start/pause/resume/transition decisions.
- TV derives displayed time from server timestamps.
- Organizer reconnects to canonical state.
- TV reconnects to canonical state.
- Clock drift is corrected from server time.
- Sponsor timing can use canonical session time.

---

## 13. Supabase

Supabase is being used for:

- Authentication
- PostgreSQL
- Realtime
- Future Storage
- Future server-side production functions/RPCs

Environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Secrets must not be committed to GitHub.

---

## 14. Important Source Files

| File | Responsibility |
|---|---|
| `app/page.tsx` | Landing |
| `app/login/page.tsx` | Authentication UI |
| `app/dashboard/page.tsx` | Tournament dashboard |
| `app/tournament/page.tsx` | Tournament editor |
| `app/control/page.tsx` | Live organizer control |
| `app/tv/page.tsx` | TV display |
| `app/subscription/page.tsx` | Subscription/status |
| `app/globals.css` | Application styling |
| `app/layout.tsx` | Global layout/PWA connection |
| `lib/supabase/client.ts` | Supabase browser client |
| `lib/types.ts` | Domain types |
| `lib/presets.ts` | Blind/tournament presets |
| `supabase/schema.sql` | Database, RLS and realtime |
| `public/manifest.webmanifest` | PWA manifest |
| `public/icon.svg` | PWA icon |
| `.env.example` | Environment template |
| `README.md` | Setup/architecture notes |

---

## 15. Package Configuration

Current main dependencies:

- Next.js 16.3.6
- React 19.2.0
- react-dom 19.2.0
- @supabase/ssr ^0.7.0
- @supabase/supabase-js ^2.57.0
- qrcode ^1.5.4
- TypeScript ^5.8.3
- React/Node type packages

Scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

**Known maintenance item:** Next.js 16 no longer provides the old `next lint` command. The project should switch to a current ESLint configuration before relying on lint in CI.

---

## 16. Security Model

Implemented/directed:

- Supabase authentication
- RLS ownership policies
- Environment variables for secrets
- HTTPS target
- Database-level access controls

Still required:

- Secure TV pairing tokens
- Pairing RPC
- Authorization hardening
- Rate limiting
- Upload validation
- Audit logging
- Server-side plan enforcement
- Abuse protection
- Monitoring
- Backup strategy

---

## 17. Production Media Architecture

Current MVP:

```
Image URL -> database field -> browser
```

Production target:

```
Browser upload
    -> validation
    -> object storage
    -> CDN
    -> database asset reference
    -> TV / organizer
```

Required controls:

- File type validation
- File size limits
- Image dimension limits
- Malware/content checks where appropriate
- Controlled public/private access
- Replace/delete lifecycle
- Sponsor asset rights/approval

---

## 18. Subscription Architecture

Current:

- Platinum plan model
- Unlimited tournaments
- Subscription/status page
- Trial-style profile state
- No payment provider connected

Production:

```
Payment provider
    -> webhook
    -> server-side subscription state
    -> plan enforcement
    -> application
```

Plan enforcement must happen server-side, not only in the UI.

---

## 19. Development History

Major implementation stages:

1. Created production Next.js/React/TypeScript application.
2. Added Supabase browser client.
3. Added email/password authentication.
4. Added dashboard.
5. Added tournament editor.
6. Added blind structure and presets.
7. Added payouts.
8. Added branding.
9. Added sponsors.
10. Added live control.
11. Added TV display.
12. Added QR pairing.
13. Added realtime session updates.
14. Added sponsor timing and advertising overlay.
15. Added payout ticker.
16. Added PWA manifest and icon.
17. Added PostgreSQL schema and RLS.
18. Added subscription/status page.
19. Added README and production architecture documentation.

---

## 20. Selected Git Commits

| Commit | Change |
|---|---|
| `b3955d89891897f0f0cf75b49c79b4d40c337cc0` | Package configuration |
| `17d679b8299cf57d4ddd389a3cc37fb2bf468de2` | Login |
| `f5f1f22393afb28837fa85b7da19d568bbca87a0` | Supabase client |
| `1965746e43f883d4de4c495ef062cb79657b968d` | Tournament editor |
| `22c2fa26c82b37e9427efc40532f03337b558080` | QR pairing |
| `e7f43e5039d1ee8a6c9fffced487d003cd674c48` | Sponsor overlay |
| `a1790a9de3d49ec0d67a20ab68752d738cd8047` | Payout ticker |
| `89a7cffaed46832bc87a3f2826bf86eaa07a71f1` | TV stats/branding |
| `3b7ab4fa1f372b41f01b51fff74e1bccf7dab868` | PWA manifest |
| `25146b947c9a76a35e94c869517f1320027e8a24` | README |
| `84073489893b4e759554da7e9f17d7f61d8f57b4` | Database schema |
| `58c0f9fd0ee9c67e9d6df04022ca26143e2a46a2` | Control remote |
| `70c7d09e8e67a1120c49cffb94c3593ff1a36329` | TV display |
| `1cc284661ad3bda22c7e941ca3eeeb00845d0518` | Dashboard |
```

---

## 21. Legacy localStorage

| Prototype | Key | Purpose |
|---|---|---|
| BRONZE | `pokerClockBronzeTournaments` | Saved tournaments, max 2 |
| GOLD | `pokerClockGoldTournaments` | Saved tournaments, max 10 |
| GOLD | `pokerClockGoldMedia` | Browser media |
| PLATINUM prototype | Local/browser state | Prototype persistence |

The production application intentionally replaces this model with PostgreSQL.

---

## 22. Production Pairing Flow

1. Organizer opens/creates tournament.
2. Organizer starts live session.
3. Backend creates unique session and pairing token/code.
4. Control page displays QR + short code.
5. TV scans QR or enters code.
6. Backend validates pairing.
7. TV receives only authorized session data.
8. TV subscribes to the session.
9. Pairing token expires or is revoked when appropriate.

---

## 23. Deployment Plan

1. Create Supabase project.
2. Run `platinum-app/supabase/schema.sql`.
3. Configure Supabase Auth.
4. Configure production environment variables.
5. Deploy Next.js application to Vercel.
6. Configure production domain.
7. Test signup/login.
8. Create/edit tournament.
9. Start session.
10. Test QR/short-code pairing.
11. Test TV on second device.
12. Test realtime start/pause/level/player changes.
13. Test sponsor overlay.
14. Test payout ticker.
15. Harden RLS and pairing.
16. Implement media storage.
17. Connect payment provider.
18. Run E2E/security/load tests.
19. Add monitoring/backups.
20. Publish privacy/terms documentation.

---

## 24. Testing Status

Repository source files were checked through GitHub.

Important limitation:

- A local clone/build could not be completed in the available environment because the environment could not resolve github.com.
- A live Supabase project has not been connected.
- Vercel deployment has not been connected.
- Multi-device realtime behavior has not yet been production-tested.
- Browser rendering has not been independently verified in a live deployed environment.

Therefore the correct status is:

**Production-oriented MVP source implementation — not yet production-verified/deployed.**

---

## 25. Remaining Development Work

### Critical

- Harden TV pairing/security.
- Implement server-authoritative clock.
- Improve reconnect/resync.
- Add production RLS/RPC pairing.
- Add rate limiting and authorization.
- Implement media storage.

### Commercial

- Connect payment provider.
- Webhook handling.
- Server-side subscription enforcement.
- Finalize plans/pricing.

### Quality

- Unit tests.
- Integration tests.
- End-to-end tests.
- Multi-device realtime tests.
- Load/performance tests.
- CI/CD.
- Current ESLint setup.

### Product

- Complete German/English localization.
- Native mobile apps later.
- Production sponsor asset management.
- Monitoring and analytics.
- Privacy/terms/legal setup.

---

## 26. Target Production Architecture

```
                 ┌──────────────────────┐
                 │      TV Browser      │
                 │   Platinum Display   │
                 └──────────┬───────────┘
                            │
                       HTTPS / Realtime
                            │
┌─────────────────┐         ▼
│ Phone / Tablet  │───► Application/API
│ PWA Controller  │         │
└─────────────────┘         ├── Auth
                            ├── Authorization
                            ├── Tournament Service
                            ├── Session Service
                            ├── Pairing Service
                            ├── Subscription Service
                            └── Media Service
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   PostgreSQL    │
                            │   + Storage     │
                            └─────────────────┘
```

The backend should become the canonical source of live tournament state.

---

## 27. Product Tier Context

| Tier | Project definition |
|---|---|
| FREE | Basic clock |
| BRONZE | Editable structure + limited saved tournaments |
| SILBER | Intermediate feature tier |
| GOLD | Payouts, branding, sponsors, mobile/tablet control |
| PLATIN | Gold functionality + unlimited tournaments + production-oriented architecture |

Commercial pricing discussed in the product concept was preliminary and should not be treated as final.

---

## 28. Current Overall State

The project has successfully moved from a static poker clock to a structured production-oriented PLATINUM web application.

The technical foundation now includes:

**Next.js + React + TypeScript + Supabase Auth + PostgreSQL + Realtime + PWA + QR pairing + organizer control + TV display + payouts + branding + sponsors.**

The main remaining gap is production hardening rather than the basic product concept:

**server-authoritative timing, secure pairing, production media storage, subscription/payment, testing, deployment and operational infrastructure.**

---

## 29. Quick Reference

| Item | Current |
|---|---|
| Repository | `aleyas/clock` |
| Production app | `platinum-app/` |
| Framework | Next.js 16.3.6 |
| Frontend | React 19.2.0 + TypeScript |
| Backend platform | Supabase |
| Database | PostgreSQL |
| Realtime | Supabase Realtime |
| Auth | Supabase Auth / email-password |
| Mobile | PWA |
| TV pairing | QR + 6-digit code |
| Hosting target | Vercel |
| Persistence | PostgreSQL |
| Static prototypes | HTML/CSS/vanilla JS + localStorage |
| Production status | MVP source implemented; deployment/hardening pending |

---

**Document maintained as the technical reference for the Poker Clock project.**
