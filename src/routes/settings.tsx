import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
  type FamilyProfile,
  type Language,
} from "@/lib/family-profile";

export const Route = createFileRoute("/settings")({
  ssr: false,
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Family profile · Bông Cải Vàng" },
      {
        name: "description",
        content: "Save your family's cooking preferences so Bông Cải Vàng plans dinners you'll love.",
      },
    ],
  }),
});

const CUISINE_OPTIONS = [
  "Vietnamese",
  "Japanese",
  "Korean",
  "Italian",
  "Chinese",
  "Thai",
  "Indian",
  "French",
  "Mexican",
];

function SettingsPage() {
  const [profile, setProfile] = useState<FamilyProfile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setHydrated(true);
  }, []);

  const set = <K extends keyof FamilyProfile>(k: K, v: FamilyProfile[K]) =>
    setProfile((p) => ({ ...p, [k]: v }));

  const toggleCuisine = (c: string) =>
    setProfile((p) => ({
      ...p,
      cuisines: p.cuisines.includes(c) ? p.cuisines.filter((x) => x !== c) : [...p.cuisines, c],
    }));

  const handleSave = () => {
    saveProfile(profile);
    toast.success("Family profile saved — every plan will use it.");
  };

  const handleReset = () => {
    setProfile(DEFAULT_PROFILE);
    saveProfile(DEFAULT_PROFILE);
    toast.success("Restored defaults");
  };

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" /> Back to kitchen
        </Link>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
        >
          <Save className="h-4 w-4" /> Save profile
        </button>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 pb-16">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/25 text-[color:var(--chili)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl">Family profile</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Saved on this device. Every meal plan uses these preferences automatically — you
                don't need to type them again.
              </p>
            </div>
          </div>

          <Section title="👨‍👩‍👧‍👦 Family">
            <Field label="Family size">
              <input
                type="number"
                min={1}
                max={20}
                value={profile.familySize}
                onChange={(e) => set("familySize", Number(e.target.value) || 1)}
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <span className="ml-2 text-sm text-muted-foreground">people</span>
            </Field>
          </Section>

          <Section title="🍜 Favorite cuisines">
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((c) => {
                const active = profile.cuisines.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCuisine(c)}
                    className={
                      "rounded-full border px-3 py-1.5 text-sm transition " +
                      (active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent")
                    }
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="🥗 Healthy cooking">
            <div className="grid gap-2 sm:grid-cols-2">
              <Toggle
                label="Less sugar"
                checked={profile.healthy.lessSugar}
                onChange={(v) => set("healthy", { ...profile.healthy, lessSugar: v })}
              />
              <Toggle
                label="Less salt"
                checked={profile.healthy.lessSalt}
                onChange={(v) => set("healthy", { ...profile.healthy, lessSalt: v })}
              />
              <Toggle
                label="Plenty of vegetables"
                checked={profile.healthy.plentyVegetables}
                onChange={(v) => set("healthy", { ...profile.healthy, plentyVegetables: v })}
              />
              <Toggle
                label="Rice always available"
                checked={profile.healthy.riceAlwaysAvailable}
                onChange={(v) => set("healthy", { ...profile.healthy, riceAlwaysAvailable: v })}
              />
            </div>
          </Section>

          <Section title="🙅 Dietary rules & dislikes">
            <textarea
              value={profile.dislikes}
              onChange={(e) => set("dislikes", e.target.value)}
              rows={3}
              placeholder="E.g. One boy does not eat shrimp — swap for another protein."
              className="w-full rounded-xl border border-border bg-background p-3 text-sm"
            />
          </Section>

          <Section title="📅 Weekly rhythm">
            <div className="space-y-2">
              <Toggle
                label="Tuesday: quick meals under 30 minutes"
                checked={profile.weekly.tuesdayQuick}
                onChange={(v) => set("weekly", { ...profile.weekly, tuesdayQuick: v })}
              />
              <Toggle
                label="Weekend: traditional Vietnamese family dishes"
                checked={profile.weekly.weekendTraditional}
                onChange={(v) => set("weekly", { ...profile.weekly, weekendTraditional: v })}
              />
              <Toggle
                label="Include fish at least twice per week"
                checked={profile.weekly.fishTwicePerWeek}
                onChange={(v) => set("weekly", { ...profile.weekly, fishTwicePerWeek: v })}
              />
            </div>
          </Section>

          <Section title="🌱 Ingredients & waste">
            <div className="space-y-2">
              <Toggle
                label="Always prioritize Garden Today ingredients first"
                checked={profile.prioritizeGarden}
                onChange={(v) => set("prioritizeGarden", v)}
              />
              <Toggle
                label="Prefer recipes that use up what's already on hand"
                checked={profile.minimizeFoodWaste}
                onChange={(v) => set("minimizeFoodWaste", v)}
              />
            </div>
          </Section>

          <Section title="🌏 Language">
            <div className="flex flex-wrap gap-2">
              {(["vi", "en", "nl"] as Language[]).map((l) => {
                const label = { vi: "Tiếng Việt", en: "English", nl: "Nederlands" }[l];
                const active = profile.language === l;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => set("language", l)}
                    className={
                      "rounded-full border px-4 py-1.5 text-sm transition " +
                      (active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent")
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Vietnamese dish names always appear first regardless of language.
            </p>
          </Section>

          <Section title="📝 Extra notes for the chef">
            <textarea
              value={profile.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Anything else the AI should always remember?"
              className="w-full rounded-xl border border-border bg-background p-3 text-sm"
            />
          </Section>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Restore defaults
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
            >
              <Save className="h-4 w-4" /> Save profile
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-5 first:border-t-0 first:pt-0">
      <h2 className="mb-3 font-serif text-lg">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-accent/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border accent-[color:var(--chili)]"
      />
      <span>{label}</span>
    </label>
  );
}
