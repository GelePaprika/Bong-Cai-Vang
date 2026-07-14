import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarDays,
  ChevronLeft,
  RefreshCw,
  ShoppingBasket,
  Sparkles,
  Clock,
  Flame,
  Leaf,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { generateWeeklyPlan, type WeeklyPlan } from "@/lib/weekly-plan.functions";
import { MealImage } from "@/components/MealImage";
import { useFamilyProfile, profileToPromptBlock } from "@/lib/family-profile";

export const Route = createFileRoute("/weekly")({
  head: () => ({
    meta: [
      { title: "Weekly Planner — Bông Cải Vàng" },
      {
        name: "description",
        content:
          "Plan a full week of Vietnamese family dinners. Use what you already have first — get one smart shopping list for the rest.",
      },
      { property: "og:title", content: "Weekly Planner — Bông Cải Vàng" },
      {
        property: "og:description",
        content:
          "A full week of family dinners built around what's already in your kitchen.",
      },
    ],
  }),
  component: WeeklyPage,
});

function normalize(raw: string): string {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

function WeeklyPage() {
  const generate = useServerFn(generateWeeklyPlan);
  const { profile } = useFamilyProfile();
  const [available, setAvailable] = useState("");
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const result = await generate({
        data: {
          available: normalize(available),
          profile: profileToPromptBlock(profile),
        },
      });
      setPlan(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" width={32} height={32} />
            <span className="font-serif text-lg leading-none">Bông Cải Vàng</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to kitchen
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[color:var(--chili)]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-3xl leading-tight md:text-4xl">
              Weekly Planner
            </h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Seven family dinners, built around what you already have — with one smart shopping list for the rest.
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-lg md:p-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xl">🥬</span>
            <h2 className="font-serif text-xl md:text-2xl">What we already have</h2>
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Optional
            </span>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Fridge, pantry, freezer, garden, herbs, leftovers — anything at home. Leave blank
            and I'll plan a balanced week from scratch.
          </p>
          <label htmlFor="available" className="sr-only">
            Ingredients already at home
          </label>
          <textarea
            id="available"
            value={available}
            onChange={(e) => setAvailable(e.target.value)}
            rows={9}
            placeholder={"Rice\nEggs\nChicken breast\nFrozen minced pork\nPak choi\nTomatoes\nSoy sauce\nGarlic"}
            className="w-full resize-y rounded-2xl border border-border bg-background p-4 font-mono text-base leading-relaxed shadow-inner outline-none transition placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              🌿 I'll reuse the same ingredient across several dinners to avoid waste.
            </p>
            <button
              type="button"
              onClick={run}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Planning your week…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Plan my week
                </>
              )}
            </button>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && !plan && <WeeklySkeleton />}

        {plan && <WeeklyResults plan={plan} />}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>Made with 🌿 for family kitchens</span>
        </div>
      </footer>
    </div>
  );
}

function WeeklyResults({ plan }: { plan: WeeklyPlan }) {
  const byCategory = new Map<string, typeof plan.shoppingList>();
  for (const it of plan.shoppingList) {
    const key = it.category || "Other";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(it);
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h2 className="mb-4 font-serif text-2xl">This week's dinners</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {plan.days.map((d, i) => (
            <article
              key={i}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <MealImage dishName={d.day} prompt={d.imagePrompt} />
              <div className="p-4">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[color:var(--chili)]">
                  {d.day}
                </div>
                <h3 className="mt-1 font-serif text-lg leading-tight font-vi">
                  {d.nameVi}
                </h3>
                <div className="text-sm text-muted-foreground">{d.nameEn}</div>
                <p className="mt-2 text-sm">{d.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                    <Clock className="h-3 w-3" /> {d.cookingTimeMinutes} min
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                    <Flame className="h-3 w-3" /> {d.difficulty}
                  </span>
                  {d.healthy && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--basil)]/15 px-2 py-0.5 text-[color:var(--basil)]">
                      <Leaf className="h-3 w-3" /> Healthy
                    </span>
                  )}
                </div>
                {d.reusedIngredients.length > 0 && (
                  <div className="mt-3 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">From home:</span>{" "}
                    {d.reusedIngredients.join(", ")}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
        {plan.wasteNotes && (
          <div className="mt-6 rounded-2xl border border-[color:var(--basil)]/30 bg-[color:var(--basil)]/5 p-4 text-sm text-[color:var(--basil)]">
            🌿 {plan.wasteNotes}
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--basil)]/15 text-[color:var(--basil)]">
              <ShoppingBasket className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg">Weekly shopping list</h3>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Only what you still need to buy — everything from "What we already have" is left out.
          </p>
          {plan.shoppingList.length === 0 ? (
            <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              You already have everything for the week. 🎉
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(byCategory.entries()).map(([cat, list]) => (
                <div key={cat}>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat}
                  </div>
                  <ul className="mt-1 divide-y divide-border">
                    {list.map((it, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-2 py-1.5 text-sm"
                      >
                        <span>{it.name}</span>
                        {it.quantity && (
                          <span className="text-xs text-muted-foreground">
                            {it.quantity}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function WeeklySkeleton() {
  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="aspect-square bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
