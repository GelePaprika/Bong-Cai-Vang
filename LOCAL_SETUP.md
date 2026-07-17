# Local Setup — Bông Cải Vàng

This project runs fully locally against standard third-party APIs. It does
NOT depend on any Lovable-only key. You need:

1. **Node.js 20+** (or Bun 1.1+) and npm/bun installed.
2. **A Supabase project** (URL + publishable / anon key).
3. **An OpenAI API key** with access to `gpt-4o-mini` and `gpt-image-1`
   (used for meal planning, garden vision, chat, and meal image generation).

## 1. Clone & install

```bash
git clone <this-repo>
cd <this-repo>
npm install     # or: bun install
```

## 2. Create `.env`

Copy the values below into a `.env` file at the project root:

```env
# --- Supabase (client + server) ---
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-or-publishable-key>
VITE_SUPABASE_PROJECT_ID=<your-project-ref>
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-anon-or-publishable-key>
SUPABASE_PROJECT_ID=<your-project-ref>

# --- AI (server only) ---
OPENAI_API_KEY=sk-...
# Optional: point at an OpenAI-compatible gateway (Azure OpenAI, OpenRouter, etc.)
# OPENAI_BASE_URL=https://api.openai.com/v1
```

Where to find each value:

| Variable | Where |
|---|---|
| `VITE_SUPABASE_*` / `SUPABASE_*` | Supabase dashboard → Project settings → API |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |

`OPENAI_API_KEY` is server-only — never prefix it with `VITE_` and never
expose it to the browser.

## 3. Run

```bash
npm run dev
```

Open http://localhost:8080, sign in, add a few ingredients, and generate a
meal plan. The streaming plan, garden photo scan, meal image, and chat
should all work.

## 4. Troubleshooting

| Symptom | Fix |
|---|---|
| `Missing OPENAI_API_KEY` in server log | Add `OPENAI_API_KEY` to `.env` and restart `npm run dev` |
| 401 from OpenAI | Key is wrong or revoked — re-generate on platform.openai.com |
| 429 from OpenAI | Rate limited or out of credit — check your OpenAI billing |
| Auth / DB errors | Verify the `VITE_SUPABASE_*` values match your Supabase project |
| Meal images never appear | Your OpenAI account may not have access to `gpt-image-1` — enable image generation on your account |

## Notes

- The code path is identical in local dev and in production. There is no
  hosted-only functionality: every AI call goes to OpenAI over standard
  HTTPS using `OPENAI_API_KEY`.
- To use an OpenAI-compatible provider (Azure OpenAI, OpenRouter, a local
  LLM server, etc.), set `OPENAI_BASE_URL` and adjust the model names in
  `src/lib/*.functions.ts` / `src/routes/api/*` accordingly.
