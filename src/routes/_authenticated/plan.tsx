import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateMealPlan, type Dish, type MealPlan } from "@/lib/meal-plan.functions";
import { MealImage } from "@/components/MealImage";
import { Clock, Flame, Leaf, MessageCircle, ChevronLeft, RefreshCw, ShoppingBasket, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/plan")({
  component: PlanPage,
});

const PENDING_KEY = "bcv:pendingIngredients";
const LAST_INGREDIENTS_KEY = "bcv:lastIngredients";

function PlanPage() {
  const navigate = useNavigate();
  const generate = useServerFn(generateMealPlan);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [activeIdx, setActiveIdx] = useState<number>(-1); // -1 = recommended
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<string>("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let raw = "";
    try {
      raw = sessionStorage.getItem(PENDING_KEY) || sessionStorage.getItem(LAST_INGREDIENTS_KEY) || "";
    } catch {
      raw = "";
    }
    // pending is stored as the natural-language prompt from Landing; strip prefix if present
    const cleaned = raw.replace(/^.*fridge:\s*/i, "").replace(/\.\s*Please plan.*$/i, "").trim();
    if (!cleaned) {
      navigate({ to: "/" });
      return;
    }
    setIngredients(cleaned);
    try {
      sessionStorage.setItem(LAST_INGREDIENTS_KEY, cleaned);
      sessionStorage.removeItem(PENDING_KEY);
    } catch {
      // ignore
    }

    run(cleaned);
  }, [navigate]);

  const run = async (ing: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generate({ data: { ingredients: ing } });
      setPlan(result);
      setActiveIdx(-1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const openInChat = () => {
    try {
      sessionStorage.setItem(
        PENDING_KEY,
        `I have these ingredients in my fridge: ${ingredients}. Please plan tonight's family dinner.`,
      );
    } catch {
      // ignore
    }
    navigate({ to: "/chat" });
  };

  const featured: Dish | null = plan
    ? activeIdx === -1
      ? plan.recommended
      : plan.alternatives[activeIdx] ?? plan.recommended
    : null;

  const otherDishes: Dish[] = plan
    ? [plan.recommended, ...plan.alternatives].filter((_, i) => i - 1 !== activeIdx && !(activeIdx === -1 && i === 0))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" width={32} height={32} />
            <span className="font-serif text-lg leading-none">Bông Cải Vàng</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent sm:inline-flex"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back to kitchen
            </Link>
            <button
              type="button"
              onClick={() => run(ingredients)}
              disabled={loading || !ingredients}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw className={"h-3.5 w-3.5 " + (loading ? "animate-spin" : "")} /> Regenerate
            </button>
            <button
              type="button"
              onClick={openInChat}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Ask chef
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        {ingredients && (
          <div className="mb-6 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Tonight's fridge:</span> {ingredients}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && !plan && <PlanSkeleton />}

        {plan && featured && (
          <>
            <RecommendedSection dish={featured} promoted={activeIdx !== -1} />

            <section className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
              <RecipeSteps dish={featured} />
              <ShoppingListCard items={plan.shoppingList} />
            </section>

            <section className="mt-12">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl">🍽 Alternative meals</h2>
                  <p className="text-sm text-muted-foreground">Tap one to swap it into tonight's spotlight.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherDishes.map((dish, i) => {
                  // Map back to plan index: 0 = recommended, 1..3 = alternatives
                  const planIdx =
                    dish === plan.recommended
                      ? -1
                      : plan.alternatives.findIndex((a) => a === dish);
                  return (
                    <AlternativeCard
                      key={dish.nameVi + i}
                      dish={dish}
                      onSelect={() => setActiveIdx(planIdx)}
                    />
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>Made with 🌿 for family kitchens</span>
          <Link to="/chat" className="hover:text-foreground">Open full chat →</Link>
        </div>
      </footer>
    </div>
  );
}

function DifficultyBadge({ level }: { level: Dish["difficulty"] }) {
  const map = {
    Easy: "bg-[color:var(--basil)]/15 text-[color:var(--basil)]",
    Medium: "bg-primary/25 text-[color:var(--chili)]",
    Hard: "bg-destructive/15 text-destructive",
  } as const;
  return (
    <span className={"inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold " + map[level]}>
      <Flame className="h-3 w-3" /> {level}
    </span>
  );
}

function TimeBadge({ minutes }: { minutes: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
      <Clock className="h-3 w-3" /> {minutes} min
    </span>
  );
}

function HealthyBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--basil)]/15 px-3 py-1 text-xs font-semibold text-[color:var(--basil)]">
      <Leaf className="h-3 w-3" /> Healthy
    </span>
  );
}

function RecommendedSection({ dish, promoted }: { dish: Dish; promoted: boolean }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--chili)]">
        <Sparkles className="h-3.5 w-3.5" /> {promoted ? "You picked" : "🍲 Recommended dinner"}
      </div>
      <div className="grid gap-6 md:grid-cols-[1.15fr_1fr] md:items-center">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          <MealImage dishName={dish.nameVi} prompt={dish.imagePrompt} />
        </div>
        <div>
          <h1 className="font-serif text-4xl leading-tight md:text-5xl">{dish.nameVi}</h1>
          <p className="mt-2 text-lg italic text-muted-foreground">{dish.nameEn}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <TimeBadge minutes={dish.cookingTimeMinutes} />
            <DifficultyBadge level={dish.difficulty} />
            {dish.healthy && <HealthyBadge />}
          </div>
        </div>
      </div>
    </section>
  );
}

function RecipeSteps({ dish }: { dish: Dish }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">📖</span>
        <h2 className="font-serif text-2xl">Recipe summary</h2>
      </div>
      <ol className="space-y-3">
        {dish.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/25 text-sm font-bold text-[color:var(--chili)]">
              {i + 1}
            </span>
            <p className="pt-0.5 text-base leading-relaxed text-foreground">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ShoppingListCard({
  items,
}: {
  items: Array<{ name: string; quantity?: string; category: string }>;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const byCat = new Map<string, typeof items>();
  for (const it of items) {
    if (!byCat.has(it.category)) byCat.set(it.category, []);
    byCat.get(it.category)!.push(it);
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <h2 className="font-serif text-2xl">Shopping list</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Nothing to buy — everything's in your fridge already. 🌿
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">🛒</span>
        <h2 className="font-serif text-2xl">Shopping list</h2>
        <ShoppingBasket className="ml-auto h-4 w-4 text-muted-foreground" />
      </div>
      <div className="space-y-4">
        {Array.from(byCat.entries()).map(([cat, list]) => (
          <div key={cat}>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {cat}
            </div>
            <ul className="divide-y divide-border">
              {list.map((it, i) => {
                const key = cat + ":" + it.name + i;
                const isChecked = checked.has(key);
                return (
                  <li key={key}>
                    <label className="flex cursor-pointer items-center gap-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(key)}
                        className="h-4 w-4 rounded border-border accent-[color:var(--basil)]"
                      />
                      <span className={isChecked ? "text-muted-foreground line-through" : ""}>
                        {it.name}
                      </span>
                      {it.quantity && (
                        <span className="ml-auto text-xs text-muted-foreground">{it.quantity}</span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlternativeCard({ dish, onSelect }: { dish: Dish; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group overflow-hidden rounded-3xl border border-border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="overflow-hidden">
        <MealImage dishName={dish.nameVi} prompt={dish.imagePrompt} />
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg leading-snug">{dish.nameVi}</h3>
        <p className="text-xs italic text-muted-foreground">{dish.nameEn}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <TimeBadge minutes={dish.cookingTimeMinutes} />
          <DifficultyBadge level={dish.difficulty} />
          {dish.healthy && <HealthyBadge />}
        </div>
      </div>
    </button>
  );
}

function PlanSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid gap-6 md:grid-cols-[1.15fr_1fr]">
        <div className="aspect-square w-full rounded-3xl bg-muted" />
        <div className="space-y-3">
          <div className="h-10 w-3/4 rounded bg-muted" />
          <div className="h-5 w-1/2 rounded bg-muted" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-20 rounded-full bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-64 rounded-3xl bg-muted" />
        <div className="h-64 rounded-3xl bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-72 rounded-3xl bg-muted" />
        <div className="h-72 rounded-3xl bg-muted" />
        <div className="h-72 rounded-3xl bg-muted" />
      </div>
    </div>
  );
}
