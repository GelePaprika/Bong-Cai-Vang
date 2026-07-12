import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateMealPlan, type MealPlan } from "@/lib/meal-plan.functions";
import { MealPlanView, PlanSkeleton } from "@/components/MealPlanView";
import { MessageCircle, ChevronLeft, RefreshCw } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<string>("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let raw = "";
    try {
      raw =
        sessionStorage.getItem(PENDING_KEY) ||
        sessionStorage.getItem(LAST_INGREDIENTS_KEY) ||
        "";
    } catch {
      raw = "";
    }
    const cleaned = raw
      .replace(/^.*fridge:\s*/i, "")
      .replace(/\.\s*Please plan.*$/i, "")
      .trim();
    if (!cleaned) {
      navigate({ to: "/" });
      return;
    }
    setIngredients(cleaned);
    try {
      sessionStorage.setItem(LAST_INGREDIENTS_KEY, cleaned);
      sessionStorage.removeItem(PENDING_KEY);
    } catch {
      /* ignore */
    }
    run(cleaned);
  }, [navigate]);

  const run = async (ing: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generate({ data: { ingredients: ing } });
      setPlan(result);
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
      /* ignore */
    }
    navigate({ to: "/chat" });
  };

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
        {plan && <MealPlanView plan={plan} />}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>Made with 🌿 for family kitchens</span>
          <Link to="/chat" className="hover:text-foreground">
            Open full chat →
          </Link>
        </div>
      </footer>
    </div>
  );
}
