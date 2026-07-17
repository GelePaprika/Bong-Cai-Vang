import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { useServerFn } from "@tanstack/react-start";
import logo from "@/assets/logo.png";
import hero from "@/assets/hero.jpg";
import {
  Sparkles,
  Leaf,
  ShoppingBasket,
  Globe2,
  UtensilsCrossed,
  MessageCircle,
  RefreshCw,
  Sprout,
  Settings,
  Heart,
  Camera,
  CalendarDays,
  Menu,
  X,
} from "lucide-react";


import { generateMealPlan, type MealPlan } from "@/lib/meal-plan.functions";
import { scanGarden } from "@/lib/garden-vision.functions";
import { MealPlanView, PlanSkeleton } from "@/components/MealPlanView";
import { useFamilyProfile, profileToPromptBlock } from "@/lib/family-profile";

const PENDING_KEY = "bcv:pendingIngredients";
const LANG_KEY = "bcv:recipeLang";
const DIFF_KEY = "bcv:cookDifficulty";

type RecipeLang = "en" | "nl" | "vi";
type Difficulty = "easy" | "medium" | "chef";

const LANG_OPTIONS: { value: RecipeLang; label: string }[] = [
  { value: "en", label: "🇬🇧 English" },
  { value: "nl", label: "🇳🇱 Nederlands" },
  { value: "vi", label: "🇻🇳 Tiếng Việt" },
];

const DIFF_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "🟢 Easy" },
  { value: "medium", label: "🟡 Medium" },
  { value: "chef", label: "🔴 Challenge" },
];

function normalizeIngredients(raw: string): string {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const generate = useServerFn(generateMealPlan);
  const scan = useServerFn(scanGarden);
  const { profile } = useFamilyProfile();
  const [ingredients, setIngredients] = useState("");
  const [garden, setGarden] = useState("");
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastIngredients, setLastIngredients] = useState<string>("");
  const [lastGarden, setLastGarden] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const [language, setLanguage] = useState<RecipeLang>("en");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  // Load saved preferences
  useEffect(() => {
    try {
      const l = localStorage.getItem(LANG_KEY);
      if (l === "en" || l === "nl" || l === "vi") setLanguage(l);
      const d = localStorage.getItem(DIFF_KEY);
      if (d === "easy" || d === "medium" || d === "chef") setDifficulty(d);
    } catch {
      /* ignore */
    }
  }, []);

  const updateLanguage = (v: RecipeLang) => {
    setLanguage(v);
    try {
      localStorage.setItem(LANG_KEY, v);
    } catch {
      /* ignore */
    }
  };
  const updateDifficulty = (v: Difficulty) => {
    setDifficulty(v);
    try {
      localStorage.setItem(DIFF_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const appendGardenItems = (items: string[]) => {
    setGarden((prev) => {
      const existing = prev
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const lower = new Set(existing.map((s) => s.toLowerCase()));
      const merged = [...existing];
      for (const raw of items) {
        const item = raw.trim();
        if (!item) continue;
        if (lower.has(item.toLowerCase())) continue;
        lower.add(item.toLowerCase());
        merged.push(item);
      }
      return merged.join("\n");
    });
  };

  const handleScanFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setScanError("Please upload a clear photo of vegetables or herbs from your garden.");
      setScanMsg(null);
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setScanError("That photo is a bit large — try one under 12 MB.");
      return;
    }
    setScanError(null);
    setScanning(true);
    setScanMsg("🌱 Looking around your garden...");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Please upload a clear photo of vegetables or herbs from your garden."));
        reader.readAsDataURL(file);
      });
      const result = await scan({ data: { imageDataUrl: dataUrl } });
      const found = result.ingredients ?? [];
      appendGardenItems(found);
      setScanMsg(
        found.length === 0
          ? "I couldn't recognize any vegetables in this photo. Try taking a brighter photo or placing the vegetables on a plain background."
          : `Garden Scout found ${found.length} ingredient${found.length === 1 ? "" : "s"}: ${found.join(", ")}.`,
      );
    } catch {
      setScanError("I couldn't read that photo. Try a clearer, well-lit shot of your garden.");
      setScanMsg(null);
    } finally {
      setScanning(false);
    }
  };



  // Prefill ingredients if arriving from "Cook again" on Favorites
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(PENDING_KEY);
      if (pending && !pending.startsWith("I have these ingredients")) {
        setIngredients(pending);
        sessionStorage.removeItem(PENDING_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);


  const runPlan = async (ing: string, gard: string) => {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const result = await generate({ data: { ingredients: ing, garden: gard, profile: profileToPromptBlock(profile), language, difficulty } });
      setPlan(result);
      setLastIngredients(ing);
      setLastGarden(gard);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The chef couldn't put together a plan this time. Try again.",
      );
    } finally {
      setLoading(false);
      // scroll to result after paint
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  const handleSuggest = async () => {
    const normalized = normalizeIngredients(ingredients);
    const normalizedGarden = normalizeIngredients(garden);
    await runPlan(normalized, normalizedGarden);
  };

  const noIngredientsEntered = !ingredients.trim() && !garden.trim();

  const openInChat = () => {
    const ing = lastIngredients || normalizeIngredients(ingredients);
    if (!ing) return;
    try {
      sessionStorage.setItem(
        PENDING_KEY,
        `I have these ingredients in my fridge: ${ing}. Please plan tonight's family dinner.`,
      );
    } catch {
      /* ignore */
    }
    window.location.href = "/chat";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-5">
        <div className="flex min-w-0 items-center gap-2">
          <img src={logo} alt="" width={40} height={40} className="shrink-0 drop-shadow-sm" />
          <span className="font-vi truncate text-xl">Bông Cải Vàng</span>
        </div>
        <nav className="hidden items-center gap-2 md:flex">
          <Link
            to="/weekly"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <CalendarDays className="h-4 w-4 text-[color:var(--chili)]" /> Weekly planner
          </Link>
          <Link
            to="/favorites"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <Heart className="h-4 w-4 text-[color:var(--chili)]" /> Favorites
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <Heart className="h-4 w-4 text-[color:var(--chili)]" /> About
          </Link>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <Settings className="h-4 w-4" /> Family profile
          </Link>
          <Link
            to="/auth"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Sign in
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-accent md:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {mobileMenuOpen && (
        <div className="mx-auto max-w-6xl px-6 pb-4 md:hidden">
          <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-4 shadow-lg">
            <Link
              to="/weekly"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-accent"
            >
              <CalendarDays className="h-4 w-4 text-[color:var(--chili)]" /> Weekly planner
            </Link>
            <Link
              to="/favorites"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-accent"
            >
              <Heart className="h-4 w-4 text-[color:var(--chili)]" /> Favorites
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-accent"
            >
              <Heart className="h-4 w-4 text-[color:var(--chili)]" /> About
            </Link>
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-accent"
            >
              <Settings className="h-4 w-4" /> Family profile
            </Link>
            <Link
              to="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}


      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-10 md:grid-cols-2 md:py-16">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" /> <span className="font-vi">Mẹ's</span> kitchen helper
          </span>
          <h1 className="mt-4 text-4xl leading-[1.05] md:text-5xl">
            <span className="font-vi">Bữa cơm gia đình,</span>
            <br />
            <span className="text-[color:var(--chili)]">planned with love.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
            Let's make dinner a little easier and a little more fun.
            Tell Bông Cải Vàng what's in your fridge or garden, and discover delicious meals your family will enjoy, easy recipes, and a shopping list for anything you still need.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#plan"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
            >
              Plan tonight's dinner
            </a>
            <a
              href="#features"
              className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent"
            >
              How it works
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/30 to-[color:var(--basil)]/20 blur-2xl" />
          <img
            src={hero}
            alt="A Vietnamese family gathered around a wooden table sharing a home-cooked dinner"
            width={1536}
            height={1024}
            className="rounded-3xl border border-border shadow-xl"
          />
        </div>
      </section>

      <section id="plan" className="mx-auto max-w-4xl px-6 pb-10">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-lg md:p-10">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/25 text-[color:var(--chili)]">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-2xl md:text-3xl">What's in your fridge tonight?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Type or paste your ingredients — one per line, or comma separated.
              </p>
            </div>
          </div>

          <label htmlFor="ingredients" className="sr-only">
            Available ingredients
          </label>
          <textarea
            id="ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={8}
            placeholder={"Chicken\nTomatoes\nPak choi\nCarrots\nGinger, garlic, spring onion"}
            className="w-full resize-y rounded-2xl border border-border bg-background p-4 font-mono text-base leading-relaxed shadow-inner outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          {noIngredientsEntered && (
            <p className="mt-3 text-sm text-muted-foreground">
              No ingredients entered. I'll suggest a meal based on your family preferences and selected cooking options.
            </p>
          )}

          <div className="mt-6 rounded-2xl border border-[color:var(--basil)]/30 bg-[color:var(--basil)]/5 p-5">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--basil)]/20 text-[color:var(--basil)]">
                <Sprout className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg leading-tight">🌱 Garden Today</h3>
                <p className="text-xs text-muted-foreground">
                  Anything harvested from your garden today? I'll use it first so nothing wilts.
                </p>
              </div>
            </div>
            <label htmlFor="garden" className="sr-only">
              Harvested from the garden today
            </label>
            <textarea
              id="garden"
              value={garden}
              onChange={(e) => setGarden(e.target.value)}
              rows={4}
              placeholder={"Pak choi\nMorning glory\nVietnamese basil\nMint, spring onion"}
              className="w-full resize-y rounded-xl border border-[color:var(--basil)]/30 bg-background p-3 font-mono text-sm leading-relaxed shadow-inner outline-none transition placeholder:text-muted-foreground/60 focus:border-[color:var(--basil)] focus:ring-2 focus:ring-[color:var(--basil)]/30"
            />
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleScanFile(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--basil)]/40 bg-background px-3 py-1.5 text-xs font-semibold text-[color:var(--basil)] hover:bg-[color:var(--basil)]/10 disabled:opacity-60"
                >
                  {scanning ? (
                    <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Scanning garden…</>
                  ) : (
                    <><Camera className="h-3.5 w-3.5" /> 📷 Scan my garden</>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Show us what's growing in your garden! 
                🌱 Take or upload a photo, and we'll add your freshly picked vegetables to your ingredient list.
              </p>
              {scanMsg && !scanning && (
                <div className="flex w-full flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">{scanMsg}</span>
                  {scanMsg.startsWith("I couldn't recognize") && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full border border-[color:var(--basil)]/40 bg-background px-2.5 py-1 text-[11px] font-semibold text-[color:var(--basil)] hover:bg-[color:var(--basil)]/10"
                      >
                        Try another photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setScanMsg(null)}
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium hover:bg-accent"
                      >
                        Continue without Garden Scan
                      </button>
                    </>
                  )}
                </div>
              )}
              {scanning && scanMsg && (
                <span className="text-xs text-[color:var(--basil)]">{scanMsg}</span>
              )}
              {scanError && (
                <div className="flex w-full flex-wrap items-center gap-2">
                  <span className="text-xs text-destructive">{scanError}</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full border border-[color:var(--basil)]/40 bg-background px-2.5 py-1 text-[11px] font-semibold text-[color:var(--basil)] hover:bg-[color:var(--basil)]/10"
                  >
                    Try another photo
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">🌍 Recipe Language</h3>
              <div className="flex flex-wrap gap-2">
                {LANG_OPTIONS.map((opt) => {
                  const active = language === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateLanguage(opt.value)}
                      className={
                        "rounded-full border px-4 py-1.5 text-sm font-medium transition " +
                        (active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card hover:bg-accent")
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">👩‍🍳 Cooking Difficulty</h3>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                {DIFF_OPTIONS.map((opt) => {
                  const active = difficulty === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateDifficulty(opt.value)}
                      className={
                        "flex-1 min-w-[5.5rem] rounded-full border px-3 py-1.5 text-center text-sm font-medium transition " +
                        (active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card hover:bg-accent")
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              🌿 Tip: mix Vietnamese and English names — "cá basa, rau muống, tomatoes" works great.
            </p>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Cooking up ideas…
                </>
              ) : (
                <>🍲 Suggest Dinner</>
              )}
            </button>
          </div>
        </div>
      </section>

      <section
        ref={resultRef}
        id="result"
        className="mx-auto max-w-6xl px-6 pb-16"
        aria-live="polite"
      >
        {error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <span>🍲 Something went wrong while preparing your meal. Please try again.</span>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 self-start rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60 sm:self-auto"
            >
              <RefreshCw className={"h-3.5 w-3.5 " + (loading ? "animate-spin" : "")} /> Try again
            </button>
          </div>
        )}

        {loading && !plan && <PlanSkeleton />}
        {plan && (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">Tonight's fridge:</span>{" "}
                  {lastIngredients}
                </div>
                {lastGarden && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--basil)]/15 px-2.5 py-1 text-xs font-medium text-[color:var(--basil)]">
                    <Sprout className="h-3 w-3" /> Garden today: {lastGarden}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => runPlan(lastIngredients, lastGarden)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
                >
                  <RefreshCw className={"h-3.5 w-3.5 " + (loading ? "animate-spin" : "")} />{" "}
                  Regenerate
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
            <MealPlanView
              plan={plan}
              fromGarden={Boolean(lastGarden)}
              ingredientsUsed={lastIngredients}
              garden={lastGarden}
            />

          </>
        )}
      </section>

      <section id="features" className="mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-3">
        <Feature
          icon={<Leaf className="h-5 w-5" />}
          title="Cook from your fridge"
          body="Type the ingredients you already have (gà, cá, rau muống, tỏi, nước mắm...) and I'll build a menu around them."
        />
        <Feature
          icon={<Globe2 className="h-5 w-5" />}
          title="Vietnamese, Dutch or English"
          body="Chat in your language. Dish names stay true to Vietnamese (canh chua cá lóc, rau muống xào tỏi, thịt kho tộ...) with a friendly translation."
        />
        <Feature
          icon={<ShoppingBasket className="h-5 w-5" />}
          title="Photo + recipe + shopping list"
          body="Every meal comes with a vivid photo, a short recipe, and a categorized shopping list so nothing in the fridge goes to waste."
        />
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>Made with 🌿 for family kitchens</span>
          <span>© {new Date().getFullYear()} Bông Cải Vàng</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/25 text-[color:var(--primary-foreground)]">
        {icon}
      </div>
      <h3 className="font-serif text-xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
