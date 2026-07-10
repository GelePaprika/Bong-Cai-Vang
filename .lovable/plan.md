## Goal
Turn the "Suggest Dinner" flow into a visual recipe page (Pinterest / HelloFresh feel) instead of a chat transcript. Chat stays available as a secondary surface.

## New route: `/plan`
`src/routes/_authenticated/plan.tsx` — the primary result page after clicking 🍲 Suggest Dinner.

Layout sections:
1. **🍲 Recommended Dinner** — full-width hero image, Vietnamese name + English translation, chips for ⏱ cooking time, 🔥 difficulty, 🌿 healthy indicator.
2. **📖 Recipe Summary** — numbered short steps in a clean card, generous typography.
3. **🛒 Shopping List** — checkbox list grouped by category (reuse styling from `ShoppingList`), items toggleable client-side.
4. **🍽 Alternative Meals** — grid of 3 cards: photo, VN + EN name, cooking time, difficulty. Clicking a card promotes it to the "Recommended" slot (swaps state).

Sticky header with logo, "Back to kitchen" link, and a small "Open chat" button that routes to `/chat` for follow-up questions on the same ingredients.

## Data: structured meal plan server function
New `src/lib/meal-plan.functions.ts` — `createServerFn` `generateMealPlan({ ingredients })`:
- Uses `google/gemini-3-flash-preview` via existing `createLovableAiGatewayProvider`.
- `generateText` + `Output.object` with a Zod schema:
  ```
  {
    recommended: Dish,
    alternatives: Dish[3],
    shoppingList: { name, quantity?, category }[]
  }
  Dish = {
    nameVi, nameEn,
    cookingTimeMinutes,
    difficulty: 'Easy'|'Medium'|'Hard',
    healthy: boolean,
    steps: string[]  // 4–6 short lines
    imagePrompt: string  // vivid English food-photography prompt
  }
  ```
- System prompt: reuse mission/family constraints from `src/routes/api/chat.ts` (no shrimp for one boy, no eggs at dinner, at least one vegetable dish, portion for 5, VN names first, etc.).
- Gated with `requireSupabaseAuth` so the meal plan is per-user.

## Images
Reuse `MealImage` (already streams from `/api/generate-meal-image`) for the hero and the 3 alternatives — no new endpoint needed.

## Wiring the landing button
`src/routes/index.tsx`:
- On "🍲 Suggest Dinner", still stash ingredients in `sessionStorage` under `bcv:pendingIngredients`, but navigate to `/plan` (not `/chat`).
- `/plan` reads that value on mount, calls `generateMealPlan`, and renders sections progressively (skeleton while pending, then hero/summary/shopping/alternatives fill in). Images stream in parallel via `MealImage`.

An "Ask a follow-up in chat" button on `/plan` sends the same ingredients into a new chat thread (existing flow).

## Chat surface
`/chat` remains fully functional and reachable from the header + from the plan page. No changes to `ChatShell` beyond leaving the pending-ingredients auto-send in place for when the user explicitly picks chat.

## Files touched
- add: `src/routes/_authenticated/plan.tsx`
- add: `src/lib/meal-plan.functions.ts`
- add: `src/components/RecipeHero.tsx`, `src/components/RecipeSteps.tsx`, `src/components/AlternativeMealCard.tsx` (small presentational)
- edit: `src/routes/index.tsx` (navigate to `/plan` instead of `/chat`)
- routeTree.gen.ts regenerates automatically

## Out of scope
- Persisting generated meal plans to the DB (can add later if you want a saved cookbook).
- Editing / regenerating individual dishes in place beyond the "swap in an alternative" interaction.
