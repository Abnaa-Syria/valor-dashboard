# VALOR — Dashboard

React 19 + Vite + TypeScript + Ant Design + TanStack Query. English only for v1.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
```

The backend must be running on `http://localhost:4000`. In development, Vite forwards `/api` to it, so nothing else is needed.
For production, copy `.env.example` to `.env` and set `VITE_API_URL`, then `npm run build` (output in `dist/`).

Log in with the super admin created by `npm run db:seed` in the backend.

## Structure

```
src/
  main.tsx            providers (query client, antd theme)
  router.tsx          all routes
  theme.ts            VALOR colors for antd
  lib/                api client, auth token, formatting, shared types
  layouts/            AdminLayout (sidebar + header)
  features/<name>/    one folder per section: api.ts + pages/components
```

## Pages

| Path | Page |
|---|---|
| `/login` | Login |
| `/` | Overview (live stats) |
| `/users` | Players: search, filter, details, suspend / ban, credits + ledger, add / deduct credits |
| `/clips` | Clips: search, filter, play, remove (refunds entries / cancels live battles) |
| `/battles` | Battles: both sides revealed for admins, results, cancel a live battle (refunds everyone) |
| `/reports` | Reports: review, resolve (optionally remove the content) or dismiss |
| `/purchases` | Every store purchase, revenue for the current filter, failed deliveries |
| `/store` | Credit packs, gifts & stickers (with icons), and the Customization Studio content: **frames** (ring artwork upload, glow, fit sliders, live preview), **themes** (all 58 tokens with color pickers, live app preview, WCAG contrast check, copy from another theme), **avatars** (ready-made profile pictures) |
| `/games` | Games and their battle criteria (weapon classes, ranks) |
| `/badges` | Badges: automatic rules or awarded by admins (award from a player's page) |
| `/settings` | App settings for undecided product values (edit: super admin only) |
| `/admins` | Admin accounts and roles (super admin only) |

Account menu (top right): change password, log out.

Roles: **Super admin** everything · **Admin** everything except admins and app settings · **Moderator** moderation (clips, reports) and read-only elsewhere.
