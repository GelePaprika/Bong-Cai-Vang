import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import logo from "@/assets/logo.png";
import hero from "@/assets/hero.jpg";
import { Sparkles, Leaf, ShoppingBasket, Globe2, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PENDING_KEY = "bcv:pendingIngredients";

function normalizeIngredients(raw: string): string {
  const parts = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.join(", ");
}

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSuggest = async () => {
    const normalized = normalizeIngredients(ingredients);
    if (!normalized) return;
    setSubmitting(true);
    const prompt = `I have these ingredients in my fridge: ${normalized}. Please plan tonight's family dinner.`;
    try {
      sessionStorage.setItem(PENDING_KEY, prompt);
    } catch {
      // ignore storage failures
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      navigate({ to: "/chat" });
    } else {
      navigate({ to: "/auth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" width={40} height={40} className="drop-shadow-sm" />
          <span className="font-serif text-xl">Bông Cải Vàng</span>
        </div>
        <Link
          to="/auth"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Start planning
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-10 md:grid-cols-2 md:py-16">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Mẹ's kitchen helper
          </span>
          <h1 className="mt-4 text-4xl leading-[1.05] md:text-6xl">
            Bữa cơm gia đình,
            <br />
            <span className="text-[color:var(--chili)]">planned with love.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
            Bông Cải Vàng is your warm AI kitchen companion for Vietnamese family dinners.
            Tell me what's in your fridge — I'll build a wholesome menu, a photo for every
            dish, and a grocery list for whatever you need to bring home.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
            >
              Plan this week's meals
            </Link>
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
            alt="A Vietnamese family gathered around a wooden table sharing a home-cooked dinner with cơm trắng, canh chua cá lóc, thịt kho tộ, rau muống xào tỏi, and cá chiên xả ớt"
            width={1536}
            height={1024}
            className="rounded-3xl border border-border shadow-xl"
          />
        </div>
      </section>

      <section id="plan" className="mx-auto max-w-4xl px-6 pb-16">
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

          <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              🌿 Tip: mix Vietnamese and English names — "cá basa, rau muống, tomatoes"
              works great.
            </p>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={submitting || !ingredients.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              🍲 Suggest Dinner
            </button>
          </div>
        </div>
      </section>



      <section id="features" className="mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-3">
        <Feature
          icon={<Leaf className="h-5 w-5" />}
          title="Cook from your fridge"
          body="Type the ingredients you already have — gà, cá, rau muống, tỏi, nước mắm — and I'll build a menu around them."
        />
        <Feature
          icon={<Globe2 className="h-5 w-5" />}
          title="Vietnamese, Dutch or English"
          body="Chat in your language. Dish names stay true to Vietnamese — canh chua cá lóc, rau muống xào tỏi, thịt kho tộ — with a friendly translation."
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
