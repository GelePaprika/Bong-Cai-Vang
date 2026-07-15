import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Leaf, Sprout, UtensilsCrossed } from "lucide-react";
import logo from "@/assets/logo.png";
import aboutHero from "@/assets/about-hero.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Bông Cải Vàng" },
      {
        name: "description",
        content:
          "The story behind Bông Cải Vàng: a warm kitchen helper built for one family and shared with yours.",
      },
      { property: "og:title", content: "About — Bông Cải Vàng" },
      {
        property: "og:description",
        content:
          "A little helper in my kitchen. The story behind a family meal planner made with love.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" width={32} height={32} />
            <span className="font-be-vietnam text-lg leading-none">Bông Cải Vàng</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <UtensilsCrossed className="h-3.5 w-3.5" /> Back to kitchen
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 md:py-20">
        <section className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <Heart className="h-3.5 w-3.5" /> From my kitchen to yours
          </span>
          <h1 className="mt-5 font-vi text-4xl leading-[1.1] md:text-5xl">
            About Bông Cải Vàng
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            A little helper in my kitchen.
          </p>
        </section>

        <div className="relative mt-10 overflow-hidden rounded-3xl border border-border shadow-lg">
          <img
            src={aboutHero}
            alt="A warm family kitchen with fresh vegetables and afternoon light"
            width={1536}
            height={1024}
            className="h-64 w-full object-cover md:h-80"
          />
        </div>

        <section className="mt-14 space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[color:var(--chili)]">
              <span className="text-lg"></span>
            </div>
            <h2 className="pt-1 font-serif text-2xl">Hi!</h2>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-foreground/90 md:text-lg">
            <p>
              I'm a busy mum trying to balance work, family and all the little things that come with everyday life. Like many parents, I found myself asking the same question almost every afternoon: "What are we going to eat tonight?"
            </p>
            <p>
              Not because I don't enjoy cooking (sometimes I do... just sometimes), but because deciding what to cook every single day can be surprisingly tiring.
            </p>
            <p>
              I wanted something that could help me make that decision a little faster while still cooking healthy meals, making good use of what we already have at home and wasting less food. More importantly, I wanted to spend less time planning and more time sitting around the dinner table with my family.
            </p>
            <p>
              That's how Bông Cải Vàng began. It started as a small kitchen helper for my own family and slowly grew into this project.
            </p>
          </div>
        </section>

        <section className="mt-16 space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--basil)]/15 text-[color:var(--basil)]">
              <Sprout className="h-4 w-4" />
            </div>
            <h2 className="pt-1 font-serif text-2xl">The Story Behind the Name</h2>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-foreground/90 md:text-lg">
            <p>
              The name Bông Cải Vàng comes from the beautiful yellow rapeseed flowers that bloom every summer in my parents' garden. Those flowers have their own special story in my family. Whenever I see them, they remind me of the love within a family and the warmth of a family kitchen.
            </p>
            <p>
              No matter how the day has gone, busy, stressful or simply exhausting, you know that, at the end of the day, you're coming home to the people who love you, care for you and are waiting to share a meal together.
            </p>
            <p>
              That's the feeling I hope Bông Cải Vàng can bring to every family.
            </p>
          </div>
        </section>

        <section className="mt-16 space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--basil)]/15 text-[color:var(--basil)]">
              <Leaf className="h-4 w-4" />
            </div>
            <h2 className="pt-1 font-serif text-2xl">Cooking with What We Already Have</h2>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-foreground/90 md:text-lg">
            <p>
              One of my hobbies is gardening. There is something special about picking vegetables you've grown yourself and cooking with them the very same evening.
            </p>
            <p>
              Whenever possible, I'd rather use what is already growing in the garden or waiting in the fridge before buying more food. It's a small way to waste less, save time and enjoy fresher meals.
            </p>
          </div>
        </section>

        <section className="mt-16 space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[color:var(--chili)]">
              <span className="text-lg">🌱</span>
            </div>
            <h2 className="pt-1 font-serif text-2xl">Growing Little by Little</h2>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-foreground/90 md:text-lg">
            <p>
              Bông Cải Vàng is still growing, just like my garden. Every new feature comes from something I genuinely wanted to solve in my own kitchen. If it helps another family spend a little less time planning, waste a little less food and enjoy a few more meals together, then this little project has already done more than I hoped for.
            </p>
            <p className="pt-2 font-serif text-lg text-[color:var(--chili)]">
              ❤️ Happy cooking, and thank you for visiting Bông Cải Vàng.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>Made with 🌿 for family kitchens</span>
          <span>© {new Date().getFullYear()} Bông Cải Vàng</span>
        </div>
      </footer>
    </div>
  );
}
