import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Printer,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { generateWeeklyPlan, type WeeklyPlan } from "@/lib/weekly-plan.functions";
import { translateShoppingList } from "@/lib/translate-shopping.functions";
import { MealImage } from "@/components/MealImage";
import { useFamilyProfile, profileToPromptBlock } from "@/lib/family-profile";

type ShoppingLang = "en" | "nl" | "vi";
const SHOPPING_LANG_KEY = "bcv:shopping-lang-v1";
const LANG_OPTIONS: { code: ShoppingLang; flag: string; label: string }[] = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "nl", flag: "🇳🇱", label: "Nederlands" },
  { code: "vi", flag: "🇻🇳", label: "Tiếng Việt" },
];

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

const STORAGE_KEY = "bcv:weekly-plan-v1";

type SavedWeek = {
  available: string;
  plan: WeeklyPlan;
  savedAt: string;
};

function loadSaved(): SavedWeek | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedWeek;
  } catch {
    return null;
  }
}

function saveWeek(week: SavedWeek) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(week));
  } catch {
    /* ignore */
  }
}

function clearSaved() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function normalize(raw: string): string {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

function formatSavedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

type PrintMode = "none" | "plan" | "shopping";

function WeeklyPage() {
  const generate = useServerFn(generateWeeklyPlan);
  const { profile } = useFamilyProfile();
  const [available, setAvailable] = useState("");
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedWeek | null>(null);
  const [showContinueCard, setShowContinueCard] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("none");

  useEffect(() => {
    const s = loadSaved();
    if (s) {
      setSaved(s);
      setShowContinueCard(true);
    }
  }, []);

  const doGenerate = async (currentAvailable: string) => {
    setLoading(true);
    setError(null);
    setPlan(null);
    setSavedAt(null);
    try {
      const result = await generate({
        data: {
          available: normalize(currentAvailable),
          profile: profileToPromptBlock(profile),
        },
      });
      const now = new Date().toISOString();
      setPlan(result);
      setSavedAt(now);
      saveWeek({ available: currentAvailable, plan: result, savedAt: now });
      setSaved({ available: currentAvailable, plan: result, savedAt: now });
      setShowContinueCard(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const continueWeek = () => {
    if (!saved) return;
    setAvailable(saved.available);
    setPlan(saved.plan);
    setSavedAt(saved.savedAt);
    setShowContinueCard(false);
  };

  const planNewWeek = () => {
    clearSaved();
    setSaved(null);
    setPlan(null);
    setSavedAt(null);
    setShowContinueCard(false);
  };

  const triggerPrint = (mode: PrintMode) => {
    setPrintMode(mode);
    // Wait for DOM to update print class before invoking print
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode("none"), 200);
    }, 50);
  };

  return (
    <div
      className={`min-h-screen bg-background ${
        printMode === "plan"
          ? "print-mode-plan"
          : printMode === "shopping"
            ? "print-mode-shopping"
            : ""
      }`}
    >
      <PrintStyles />
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" width={32} height={32} />
            <span className="font-vi text-lg leading-none">Bông Cải Vàng</span>
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
        <div className="mb-8 flex items-start gap-3 print:hidden">
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

        {showContinueCard && saved && (
          <section className="mb-8 rounded-3xl border border-[color:var(--basil)]/30 bg-gradient-to-br from-[color:var(--basil)]/10 via-primary/5 to-[color:var(--chili)]/5 p-5 shadow-md md:p-7 print:hidden">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  <h2 className="font-serif text-xl md:text-2xl">Continue This Week</h2>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  Planned on{" "}
                  <span className="font-medium text-foreground">
                    {formatSavedDate(saved.savedAt)}
                  </span>
                  . Pick up where you left off — no need to plan again.
                </p>
                <ul className="space-y-1 text-sm">
                  {saved.plan.days.slice(0, 7).map((d, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--chili)]">
                        {d.day}
                      </span>
                      <span className="font-vi">{d.nameVi}</span>
                      <span className="text-muted-foreground">— {d.nameEn}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2 md:w-56 md:shrink-0">
                <button
                  type="button"
                  onClick={continueWeek}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
                >
                  Continue This Week
                </button>
                <button
                  type="button"
                  onClick={planNewWeek}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-accent"
                >
                  Plan a New Week
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-border bg-card p-5 shadow-lg md:p-8 print:hidden">
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
              onClick={() => doGenerate(available)}
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
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive print:hidden">
            {error}
          </div>
        )}

        {loading && !plan && <WeeklySkeleton />}

        {plan && (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="text-xs text-muted-foreground">
                {savedAt && <>Saved on {formatSavedDate(savedAt)} — kept on this device.</>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => triggerPrint("plan")}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  <Printer className="h-4 w-4" /> 🖨 Print Weekly Plan
                </button>
                <button
                  type="button"
                  onClick={() => triggerPrint("shopping")}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  <ShoppingBasket className="h-4 w-4" /> 🛒 Print Shopping List
                </button>
              </div>
            </div>

            <WeeklyResults plan={plan} savedAt={savedAt} />
          </>
        )}
      </main>

      <footer className="border-t border-border print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>Made with 🌿 for family kitchens</span>
        </div>
      </footer>
    </div>
  );
}

function PrintStyles() {
  return (
    <style>{`
@media print {
  @page { size: A4; margin: 14mm; }
  body { background: #fff !important; }
  .print-mode-plan .print-only-shopping { display: none !important; }
  .print-mode-shopping .print-only-plan { display: none !important; }
  .print-hide { display: none !important; }
  .weekly-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
  .weekly-card { break-inside: avoid; page-break-inside: avoid; border: 1px solid #ddd !important; box-shadow: none !important; }
  .shopping-block { break-inside: avoid; }
  .print-title { display: block !important; }
}
.print-title { display: none; }
`}</style>
  );
}

function WeeklyResults({
  plan,
  savedAt,
}: {
  plan: WeeklyPlan;
  savedAt: string | null;
}) {
  const byCategory = new Map<string, typeof plan.shoppingList>();
  for (const it of plan.shoppingList) {
    const key = it.category || "Other";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(it);
  }
  const categoryOrder = Array.from(byCategory.keys());
  const flatItems = categoryOrder.flatMap((c) => byCategory.get(c)!);

  const translate = useServerFn(translateShoppingList);
  const [lang, setLang] = useState<ShoppingLang>("en");
  const [catMap, setCatMap] = useState<Record<string, string>>({});
  const [itemMap, setItemMap] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SHOPPING_LANG_KEY) as ShoppingLang | null;
      if (saved && LANG_OPTIONS.some((l) => l.code === saved)) setLang(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (lang === "en") {
      setCatMap({});
      setItemMap({});
      return;
    }
    if (flatItems.length === 0 && categoryOrder.length === 0) return;
    setTranslating(true);
    translate({
      data: {
        items: flatItems.map((i) => ({ name: i.name, category: i.category })),
        categories: categoryOrder,
        targetLang: lang,
      },
    })
      .then((res) => {
        if (cancelled) return;
        const cm: Record<string, string> = {};
        categoryOrder.forEach((c, i) => (cm[c] = res.categories[i] ?? c));
        const im: Record<string, string> = {};
        flatItems.forEach((it, i) => (im[`${it.category}|${it.name}`] = res.items[i] ?? it.name));
        setCatMap(cm);
        setItemMap(im);
      })
      .catch(() => {
        if (cancelled) return;
        setCatMap({});
        setItemMap({});
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, plan]);

  const pickLang = (code: ShoppingLang) => {
    setLang(code);
    try {
      localStorage.setItem(SHOPPING_LANG_KEY, code);
    } catch {
      /* ignore */
    }
  };

  const tCat = (c: string) => (lang === "en" ? c : catMap[c] ?? c);
  const tItem = (c: string, n: string) =>
    lang === "en" ? n : itemMap[`${c}|${n}`] ?? n;


  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="print-only-plan">
        <div className="print-title mb-4">
          <h1 className="font-serif text-3xl">Our Weekly Dinner Plan</h1>
          {savedAt && (
            <p className="text-sm text-muted-foreground">
              Planned on {formatSavedDate(savedAt)}
            </p>
          )}
        </div>
        <h2 className="mb-4 font-serif text-2xl print:hidden">This week's dinners</h2>
        <div className="weekly-grid grid gap-5 sm:grid-cols-2">
          {plan.days.map((d, i) => (
            <article
              key={i}
              className="weekly-card overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
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
                <p className="mt-2 text-sm print:hidden">{d.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                    <Clock className="h-3 w-3" /> {d.cookingTimeMinutes} min
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 print:hidden">
                    <Flame className="h-3 w-3" /> {d.difficulty}
                  </span>
                  {d.healthy && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--basil)]/15 px-2 py-0.5 text-[color:var(--basil)]">
                      <Leaf className="h-3 w-3" /> Healthy
                    </span>
                  )}
                </div>
                {d.reusedIngredients.length > 0 && (
                  <div className="mt-3 text-[11px] text-muted-foreground print:hidden">
                    <span className="font-semibold text-foreground">From home:</span>{" "}
                    {d.reusedIngredients.join(", ")}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
        {plan.wasteNotes && (
          <div className="mt-6 rounded-2xl border border-[color:var(--basil)]/30 bg-[color:var(--basil)]/5 p-4 text-sm text-[color:var(--basil)] print:hidden">
            🌿 {plan.wasteNotes}
          </div>
        )}
      </div>

      <aside className="print-only-shopping lg:sticky lg:top-20 lg:self-start">
        <div className="print-title mb-4">
          <h1 className="font-serif text-3xl">Weekly Shopping List</h1>
          {savedAt && (
            <p className="text-sm text-muted-foreground">
              Planned on {formatSavedDate(savedAt)}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm print:border-0 print:shadow-none">
          <div className="mb-3 flex items-center gap-2 print:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--basil)]/15 text-[color:var(--basil)]">
              <ShoppingBasket className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg">Weekly shopping list</h3>
          </div>
          <p className="mb-3 text-xs text-muted-foreground print:hidden">
            Only what you still need to buy — everything from "What we already have" is left out.
          </p>

          <div className="mb-4 print:hidden">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Shopping list language
            </div>
            <div
              role="radiogroup"
              aria-label="Shopping list language"
              className="flex flex-wrap gap-1.5"
            >
              {LANG_OPTIONS.map((opt) => {
                const active = lang === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => pickLang(opt.code)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-[color:var(--basil)] bg-[color:var(--basil)]/15 text-[color:var(--basil)]"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    <span aria-hidden>{opt.flag}</span> {opt.label}
                  </button>
                );
              })}
            </div>
            {translating && lang !== "en" && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" /> Translating…
              </div>
            )}
          </div>

          {plan.shoppingList.length === 0 ? (
            <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              You already have everything for the week. 🎉
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(byCategory.entries()).map(([cat, list]) => (
                <div key={cat} className="shopping-block">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground print:text-sm print:text-black">
                    {tCat(cat)}
                  </div>
                  <ul className="mt-1 divide-y divide-border">
                    {list.map((it, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-2 py-1.5 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className="hidden h-4 w-4 rounded-sm border border-black print:inline-block"
                          />
                          {tItem(cat, it.name)}
                        </span>
                        {it.quantity && (
                          <span className="text-xs text-muted-foreground print:text-black">
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
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
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
