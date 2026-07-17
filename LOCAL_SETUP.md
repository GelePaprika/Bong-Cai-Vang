# Running Bông Cải Vàng locally

The published app on Lovable works out of the box because Lovable injects a
few managed secrets into the hosted runtime. When you clone this repo to
your own machine you have to supply those secrets yourself — otherwise the
frontend loads but every AI feature (Suggest Dinner, weekly plan, garden
scan, meal images, chat) returns an error like `Missing LOVABLE_API_KEY`.

## Prerequisites

- Node.js 20+ (or Bun 1.1+)
- npm, pnpm, or bun
- A Lovable Cloud (Supabase) project — the one this app is wired to, or
  your own copy
- A Lovable AI Gateway API key (`LOVABLE_API_KEY`)

## 1. Install dependencies

```bash
npm install
# or: bun install
```

## 2. Create a local `.env`

Copy the committed `.env` (it already has the Supabase publishable values)
and add the AI key. The file layout:

```dotenv
# --- Supabase / Lovable Cloud (publishable — safe to commit) ---
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
VITE_SUPABASE_PROJECT_ID=<your-project-ref>

# Server-side mirrors (read by createServerFn / server routes)
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_PROJECT_ID=<your-project-ref>

# --- Lovable AI Gateway (REQUIRED for all AI features) ---
LOVABLE_API_KEY=<your-lovable-ai-gateway-key>
```

### Where to get each value

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Lovable Cloud → project settings, or your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | The publishable (anon) key — safe to expose in the browser |
| `VITE_SUPABASE_PROJECT_ID` / `SUPABASE_PROJECT_ID` | The project ref (subdomain of the Supabase URL) |
| `LOVABLE_API_KEY` | Auto-provisioned in the Lovable editor. Open the project in Lovable → Cloud / Secrets to view it, or generate one via the Lovable AI Gateway dashboard. **Never commit this value.** |

Notes:
- `VITE_*` variables are exposed to the browser bundle. Only publishable
  keys belong there.
- `LOVABLE_API_KEY`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` are
  read via `process.env.*` inside server functions and API routes — they
  are never shipped to the client.
- We do **not** use `SUPABASE_SERVICE_ROLE_KEY` for app-internal AI calls;
  no service-role key is required for local development of these features.

## 3. Run the dev server

```bash
npm run dev
# app on http://localhost:8080
```

## 4. Verify AI works

1. Open http://localhost:8080
2. Sign in (Supabase auth) — required because meal generation runs behind
   `requireSupabaseAuth`
3. Type a few ingredients and click **🍲 Suggest Dinner**
4. You should see a streaming meal plan appear on `/plan`

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Missing LOVABLE_API_KEY` in the server log or a red toast in the UI | `LOVABLE_API_KEY` is not set in `.env` | Add it and restart `npm run dev` |
| `Unauthorized: No authorization header provided` from a server function | You are not signed in, or the Supabase publishable key is wrong | Sign in via `/auth`; double-check `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Meal plan generation returns 402 | Your Lovable AI Gateway credits are exhausted | Top up credits in the Lovable workspace |
| Meal plan returns 429 | AI Gateway rate limit | Wait a few seconds and retry |
| Auth works but no data loads | `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` (the non-VITE server copies) are missing | Add them to `.env` — server routes read `process.env.*`, not `import.meta.env` |
| Env changes not taking effect | Vite only reads `.env` at startup | Stop and restart `npm run dev` |

## What only works in hosted Lovable?

Nothing that this app relies on is hosted-only, **provided** you supply
`LOVABLE_API_KEY` locally. The AI Gateway, meal image streaming, and
garden vision all run the same code path in both environments. The only
difference is that the hosted editor injects `LOVABLE_API_KEY`
automatically; locally you must set it yourself.
