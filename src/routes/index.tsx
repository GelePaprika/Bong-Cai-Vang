import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import hero from "@/assets/hero.jpg";
import { Sparkles, Leaf, ShoppingBasket, Globe2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
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
            <Sparkles className="h-3.5 w-3.5" /> Your kitchen sidekick
          </span>
          <h1 className="mt-4 text-4xl leading-[1.05] md:text-6xl">
            Tonight's dinner,
            <br />
            <span className="text-[color:var(--chili)]">already planned.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
            Bông Cải Vàng is your warm AI chef for Vietnamese, Asian and Italian family dinners.
            Tell it what's in your fridge — get a delicious menu, a photo for every dish, and a
            tidy grocery list for what's missing.
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
            alt="A Vietnamese family dinner spread"
            width={1536}
            height={1024}
            className="rounded-3xl border border-border shadow-xl"
          />
        </div>
      </section>

      <section id="features" className="mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-3">
        <Feature
          icon={<Leaf className="h-5 w-5" />}
          title="From your fridge, not the store"
          body="Type the ingredients you already have. Bông Cải Vàng builds menus around them and only shops for what's missing."
        />
        <Feature
          icon={<Globe2 className="h-5 w-5" />}
          title="Vietnamese, Dutch or English"
          body="Chat in your language. Vietnamese dish names stay in Vietnamese — Canh chua cá, phở gà, thịt kho — with a friendly translation."
        />
        <Feature
          icon={<ShoppingBasket className="h-5 w-5" />}
          title="Photo + recipe + grocery list"
          body="Every dish comes with a real photo, a short recipe, and a leftover tip so nothing in the fridge goes to waste."
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
