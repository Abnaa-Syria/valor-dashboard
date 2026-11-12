# VALOR — Dashboard

React 19 + Vite + TypeScript + Ant Design + TanStack Query. English only for v1.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
```

The backend must be running on `http://localhost:4000`. In development, Vite forwards `/api` to it, so nothing else is needed.
For production, copy `.env.example` to `.env` and set `VITE_API_URL`, then `npm run build` (output in `dist/`).

**Vercel:** import the repo (framework Vite, settings in `vercel.json`) and add the environment variable `VITE_API_URL=https://api.<your-domain>/api`. `vercel.json` sends every path to `index.html`, so links like `/players/123` open directly. Add the Vercel address to the API's `CORS_ORIGINS`.

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

Every list opens a **detail page**, and every create / edit is its **own page** (no pop-ups). List filters and the open tab live in the URL, so any view can be bookmarked or shared.

| Area | Paths | What you can do |
|---|---|---|
| Overview | `/` | Live counters (each opens its list) + daily charts: new players, votes, clips, battles, revenue (7 / 30 / 90 days) |
| Players | `/players`, `/players/new`, `/players/:id`, `/players/:id/edit` | Create, edit, suspend / ban / reactivate, set password, send reset link, message, export data, delete account (super admin). Tabs: clips, battles, entries, credits (add / deduct), purchases, gifts, badges (award / remove), comments, reports, blocks, admin activity |
| Clips | `/clips`, `/clips/:id`, `/clips/:id/edit` | Play, edit title / game / criteria, remove with reason, restore; comments, battles and reports per clip |
| Comments | `/comments` | Hide / restore any comment |
| Battles | `/battles`, `/battles/:id`, `/entries`, `/rematches` | Both sides revealed for admins; extend, close now, cancel (refunds); votes, gifts, waiting entries (cancel + refund), rematches (cancel) |
| Reports | `/reports`, `/reports/:id` | See the reported content and other reports about it; resolve (optionally remove content) or dismiss |
| Economy | `/purchases`, `/purchases/:id`, `/store/packs…`, `/store/gifts…` | Purchases with revenue + refunds; credit packs and gifts: add, edit, hide, delete |
| Customization | `/customization/frames…`, `/themes…`, `/avatars…` | Frames (ring upload, glow, fit sliders, live preview), themes (58 tokens, live app preview, contrast check, copy from another theme), avatars |
| Setup | `/games…`, `/badges…`, `/announcements…`, `/settings`, `/admins…`, `/audit` | Games and battle criteria; badges and holders; announcements to everyone or one player; app settings; admin accounts (super admin); full admin activity log |

Account menu (top right): change password, log out.

Roles: **Super admin** everything · **Admin** everything except admins and app settings · **Moderator** moderation (clips, reports) and read-only elsewhere.
