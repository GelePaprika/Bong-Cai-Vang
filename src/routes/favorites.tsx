import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Flame,
  Heart,
  Leaf,
  Search,
  ShoppingBasket,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MealImage } from "@/components/MealImage";

import { useFavorites, type FavoriteRecipe } from "@/lib/favorites";
import type { Dish } from "@/lib/meal-plan.functions";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favorites — Bông Cải Vàng Family Cookbook" },
      {
        name: "description",
        content:
          "Your growing Vietnamese family cookbook — save the recipes you love and cook them again anytime.",
      },
      { property: "og:title", content: "Favorites — Bông Cải Vàng" },
      {
        property: "og:description",
        content: "Beautiful, personal cookbook of recipes your family loves.",
      },
    ],
  }),
  component: FavoritesPage,
});

const CUISINES = ["Vietnamese", "Japanese", "Korean", "Italian"] as const;
const PROTEINS = ["Vegetarian", "Fish", "Chicken", "Pork", "Beef"] as const;
type SortKey = "recent" | "most-cooked" | "alpha";

function FavoritesPage() {
  const { favorites, hydrated, remove, incrementCooked } = useFavorites();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>("recent");
  const [shoppingFor, setShoppingFor] = useState<FavoriteRecipe | null>(null);

  const toggleFilter = (f: string) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = favorites.filter((fav) => {
      if (q) {
        const hay = (fav.dish.nameVi + " " + fav.dish.nameEn).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.size > 0) {
        const cuisineOk =
          !CUISINES.some((c) => filters.has(c)) ||
          (fav.cuisine && filters.has(fav.cuisine));
        const proteinOk =
          !PROTEINS.some((p) => filters.has(p)) ||
          (fav.proteinTags ?? []).some((p) => filters.has(p));
        if (!cuisineOk || !proteinOk) return false;
      }
      return true;
    });
    if (sort === "recent") arr.sort((a, b) => b.savedAt - a.savedAt);
    else if (sort === "most-cooked")
      arr.sort((a, b) => (b.timesCooked ?? 0) - (a.timesCooked ?? 0) || b.savedAt - a.savedAt);
    else if (sort === "alpha") arr.sort((a, b) => a.dish.nameVi.localeCompare(b.dish.nameVi, "vi"));
    return arr;
  }, [favorites, search, filters, sort]);

  const onRemove = (fav: FavoriteRecipe) => {
    if (!window.confirm(`Remove "${fav.dish.nameVi}" from your cookbook?`)) return;
    remove(fav.id);
    toast("Removed from Favorites.");
  };

  const onCookAgain = (fav: FavoriteRecipe) => {
    incrementCooked(fav.id);
    toast.success(`Let's cook "${fav.dish.nameVi}" again tonight! 🍳`);
    try {
      sessionStorage.setItem("bcv:pendingIngredients", fav.ingredientsUsed ?? "");
    } catch {
      /* ignore */
    }
    // Navigate home so user can adjust ingredients for the regeneration
    window.location.href = "/#plan";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to kitchen
        </Link>
        <div className="flex items-center gap-1.5 font-serif text-lg">
          <Heart className="h-5 w-5 fill-[color:var(--chili)] text-[color:var(--chili)]" />
          Family Cookbook
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-4">
        <h1 className="font-serif text-4xl md:text-5xl">
          <span className="font-vi">Sách bếp gia đình</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          A growing cookbook of recipes your family loves. Save any dish with the heart, then come
          back anytime to cook it again.
        </p>
      </section>

      {hydrated && favorites.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section className="mx-auto mt-8 max-w-6xl px-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Vietnamese or English name…"
                  className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-xs font-semibold text-muted-foreground">
                  Sort
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
                >
                  <option value="recent">Recently saved</option>
                  <option value="most-cooked">Most cooked</option>
                  <option value="alpha">Alphabetical</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[...CUISINES, ...PROTEINS].map((tag) => {
                const active = filters.has(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleFilter(tag)}
                    className={
                      "rounded-full border px-3 py-1 text-xs font-semibold transition " +
                      (active
                        ? "border-[color:var(--basil)] bg-[color:var(--basil)]/15 text-[color:var(--basil)]"
                        : "border-border bg-card text-muted-foreground hover:text-foreground")
                    }
                  >
                    {tag}
                  </button>
                );
              })}
              {filters.size > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters(new Set())}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-10">
            {filtered.length === 0 ? (
              <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No recipes match your search. Try clearing filters.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((fav) => (
                  <RecipeCard
                    key={fav.id}
                    fav={fav}
                    onRemove={() => onRemove(fav)}
                    onCook={() => onCookAgain(fav)}
                    onShop={() => setShoppingFor(fav)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {shoppingFor && (
        <ShoppingModal fav={shoppingFor} onClose={() => setShoppingFor(null)} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--chili)]/10 text-3xl">
          ❤️
        </div>
        <h2 className="font-serif text-3xl">Build Your Family Cookbook</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Save recipes your family loves and they'll appear here — a beautiful, growing collection
          of dishes to cook again and again.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
        >
          <ChefHat className="h-4 w-4" /> Go cook tonight
        </Link>
      </div>
    </section>
  );
}

function RecipeCard({
  fav,
  onRemove,
  onCook,
  onShop,
}: {
  fav: FavoriteRecipe;
  onRemove: () => void;
  onCook: () => void;
  onShop: () => void;
}) {
  const dish: Dish = fav.dish;
  const savedDate = new Date(fav.savedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative">
        <MealImage dishName={dish.nameVi} prompt={dish.imagePrompt} />
        <div className="absolute right-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-semibold text-foreground backdrop-blur">
          Saved {savedDate}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-xl leading-snug">
          <span className="font-vi">{dish.nameVi}</span>
        </h3>
        <p className="mt-0.5 text-sm italic text-muted-foreground">{dish.nameEn}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
            <Clock className="h-3 w-3" /> {dish.cookingTimeMinutes} min
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-[color:var(--chili)]">
            <Flame className="h-3 w-3" /> {dish.difficulty}
          </span>
          {dish.healthy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--basil)]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[color:var(--basil)]">
              <Leaf className="h-3 w-3" /> Healthy
            </span>
          )}
          {fav.cuisine && (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {fav.cuisine}
            </span>
          )}
          {(fav.proteinTags ?? []).map((p) => (
            <span
              key={p}
              className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {p}
            </span>
          ))}
        </div>

        {(fav.timesCooked ?? 0) > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Cooked {fav.timesCooked} {fav.timesCooked === 1 ? "time" : "times"} 🍚
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          <button
            type="button"
            onClick={onCook}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90"
          >
            🍳 Cook again
          </button>
          <button
            type="button"
            onClick={onShop}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent"
          >
            <ShoppingBasket className="h-3.5 w-3.5" /> Shopping list
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove favorite"
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground hover:border-destructive/40 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function ShoppingModal({ fav, onClose }: { fav: FavoriteRecipe; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-accent"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--chili)]">
            🛒 Shopping list for
          </div>
          <h3 className="font-serif text-2xl">
            <span className="font-vi">{fav.dish.nameVi}</span>
          </h3>
        </div>
        <ShoppingListInline items={fav.shoppingList} />
      </div>
    </div>
  );
}

function ShoppingListInline({
  items,
}: {
  items: Array<{ name: string; quantity?: string; category: string }>;
}) {
  if (!items?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No shopping list saved for this recipe — everything came from your fridge. 🌿
      </p>
    );
  }
  const byCat = new Map<string, typeof items>();
  for (const it of items) {
    if (!byCat.has(it.category)) byCat.set(it.category, []);
    byCat.get(it.category)!.push(it);
  }
  return (
    <div className="space-y-4">
      {Array.from(byCat.entries()).map(([cat, list]) => (
        <div key={cat}>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {cat}
          </div>
          <ul className="divide-y divide-border">
            {list.map((it, i) => (
              <li key={cat + i} className="flex items-center gap-3 py-2 text-sm">
                <span>{it.name}</span>
                {it.quantity && (
                  <span className="ml-auto text-xs text-muted-foreground">{it.quantity}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

