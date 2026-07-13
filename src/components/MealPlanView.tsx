import { useState } from "react";
import { MealImage } from "@/components/MealImage";
import { Clock, Flame, Heart, Leaf, ShoppingBasket, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Dish, MealPlan } from "@/lib/meal-plan.functions";
import { useFavorites } from "@/lib/favorites";


export function MealPlanView({ plan, fromGarden = false }: { plan: MealPlan; fromGarden?: boolean }) {
  const [activeIdx, setActiveIdx] = useState<number>(-1); // -1 = recommended

  const featured: Dish =
    activeIdx === -1 ? plan.recommended : plan.alternatives[activeIdx] ?? plan.recommended;

  const otherDishes: Array<{ dish: Dish; idx: number }> = [
    { dish: plan.recommended, idx: -1 },
    ...plan.alternatives.map((d, i) => ({ dish: d, idx: i })),
  ].filter((x) => x.idx !== activeIdx);

  return (
    <div className="space-y-10">
      <RecommendedSection dish={featured} promoted={activeIdx !== -1} fromGarden={fromGarden} shoppingList={plan.shoppingList} />

      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <RecipeSteps dish={featured} />
        <ShoppingListCard items={plan.shoppingList} />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-serif text-2xl md:text-3xl">🍽 Alternative meals</h2>
          <p className="text-sm text-muted-foreground">
            Tap one to swap it into tonight's spotlight.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherDishes.map(({ dish, idx }) => (
            <AlternativeCard
              key={dish.nameVi + idx}
              dish={dish}
              onSelect={() => setActiveIdx(idx)}
            />
          ))}
        </div>
      </section>
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
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold " + map[level]
      }
    >
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

function RecommendedSection({
  dish,
  promoted,
  fromGarden,
  shoppingList,
}: {
  dish: Dish;
  promoted: boolean;
  fromGarden: boolean;
  shoppingList: MealPlan["shoppingList"];
}) {
  const { save, remove, isSaved, favorites } = useFavorites();
  const saved = isSaved(dish);
  const onToggleSave = () => {
    if (saved) {
      const key = dish.nameVi.trim().toLowerCase();
      const match = favorites.find((f) => f.dish.nameVi.trim().toLowerCase() === key);
      if (match) {
        remove(match.id);
        toast("Removed from Favorites.");
      }
    } else {
      save(dish, { shoppingList });
      toast.success("Recipe saved to Favorites.");
    }
  };
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--chili)]">
        <Sparkles className="h-3.5 w-3.5" />{" "}
        {promoted ? "You picked" : "🍲 Tonight's recommendation"}
      </div>
      <div className="grid gap-6 md:grid-cols-[1.15fr_1fr] md:items-center">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          <MealImage dishName={dish.nameVi} prompt={dish.imagePrompt} />
        </div>
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-serif text-4xl leading-tight md:text-5xl"><span className="font-vi">{dish.nameVi}</span></h1>
            <button
              type="button"
              onClick={onToggleSave}
              aria-pressed={saved}
              aria-label={saved ? "Remove from Favorites" : "Save to Favorites"}
              className={
                "shrink-0 rounded-full border p-2.5 shadow-sm transition " +
                (saved
                  ? "border-[color:var(--chili)]/40 bg-[color:var(--chili)]/10 text-[color:var(--chili)]"
                  : "border-border bg-card text-muted-foreground hover:text-[color:var(--chili)] hover:border-[color:var(--chili)]/40")
              }
            >
              <Heart className={"h-5 w-5 " + (saved ? "fill-current" : "")} />
            </button>
          </div>
          <p className="mt-2 text-lg italic text-muted-foreground">{dish.nameEn}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <TimeBadge minutes={dish.cookingTimeMinutes} />
            <DifficultyBadge level={dish.difficulty} />
            {dish.healthy && <HealthyBadge />}
            {fromGarden && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--basil)]/20 px-3 py-1 text-xs font-semibold text-[color:var(--basil)] ring-1 ring-[color:var(--basil)]/30">
                🌿 Fresh from the garden
              </span>
            )}
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
        <h3 className="font-serif text-lg leading-snug"><span className="font-vi">{dish.nameVi}</span></h3>
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

export function PlanSkeleton() {
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
