# Poker Clock Platinum — Production App

This folder is the production-oriented Platinum application built from the Poker-Clock concept and the existing Platinum prototype.

## Decisions implemented
- Responsive web application for mobile, tablet, laptop and desktop.
- Dedicated 16:9 TV/projector display.
- Organizer control from a second device.
- PWA-ready mobile experience; native iOS/Android packaging can be added later.
- Email/password authentication initially.
- QR + 6-digit TV pairing.
- PostgreSQL data model through Supabase.
- Supabase Realtime for TV/controller synchronization.
- Unlimited Platinum tournaments.
- Platinum subscription state modeled as trial/active plan.
- Payment is deliberately not connected yet.
- GGPoker is seeded as Sponsor #1.
- Current Platinum TV visual language is preserved.

## Stack
- Next.js 16
- React 19
- TypeScript
- Supabase Auth
- Supabase PostgreSQL
- Supabase Realtime
- PWA manifest

## Local setup
1. Create a Supabase project.
2. Run supabase/schema.sql in the Supabase SQL Editor.
3. Copy .env.example to .env.local.
4. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and NEXT_PUBLIC_APP_URL.
5. Run npm install.
6. Run npm run dev.
7. Open http://localhost:3000.

## Deployment
Recommended first production deployment: Vercel for the application and Supabase for database, Auth and Realtime. Connect the chosen Poker Clock domain after the first deployment.

Do not commit .env.local or any secret service-role key.

## Routes
/ — product landing
/login — organizer login/sign-up
/dashboard — tournament management
/control?session=... — organizer remote control
/tv — TV pairing/display

## Production work still required
1. Complete Supabase Storage for sponsor/branding uploads.
2. Harden the public pairing policy with a pairing RPC/token flow.
3. Add server-side command authorization and audit logging.
4. Add automatic pairing-code expiry/rotation.
5. Add reconnect/resync handling.
6. Add server-authoritative automatic level transitions.
7. Complete tournament, payouts, branding and sponsor editors.
8. Add subscription enforcement UI.
9. Connect payment only after pricing is final.
10. Add automated tests.
11. Add privacy policy, terms, account deletion and retention handling.
12. Add monitoring, backups and recovery.

## Architecture
Organizer device -> authenticated session -> Supabase database/realtime -> TV browser.

The TV is a read-only display. The organizer device sends commands. The live session is stored centrally so changing or refreshing a browser does not reset the tournament.

## Migration
The existing /platinum static prototype remains the visual reference. platinum-app/ is the new production application and is intentionally separated from the prototype during migration.