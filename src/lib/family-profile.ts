import { useEffect, useState } from "react";

export type Language = "vi" | "en" | "nl";

export type FamilyProfile = {
  familySize: number;
  cuisines: string[];
  healthy: {
    lessSugar: boolean;
    lessSalt: boolean;
    plentyVegetables: boolean;
    riceAlwaysAvailable: boolean;
  };
  dislikes: string; // free text, e.g. "One boy does not eat shrimp — swap for another protein"
  weekly: {
    tuesdayQuick: boolean; // <30 min on Tuesdays
    weekendTraditional: boolean; // Traditional VN dishes on weekends
    fishTwicePerWeek: boolean;
  };
  prioritizeGarden: boolean;
  minimizeFoodWaste: boolean;
  language: Language;
  notes: string;
};

export const DEFAULT_PROFILE: FamilyProfile = {
  familySize: 5,
  cuisines: ["Vietnamese", "Japanese", "Korean", "Italian"],
  healthy: {
    lessSugar: true,
    lessSalt: true,
    plentyVegetables: true,
    riceAlwaysAvailable: true,
  },
  dislikes:
    "One boy does not eat shrimp — if the recommended dish uses shrimp, propose a swap protein for him.",
  weekly: {
    tuesdayQuick: true,
    weekendTraditional: true,
    fishTwicePerWeek: true,
  },
  prioritizeGarden: true,
  minimizeFoodWaste: true,
  language: "vi",
  notes: "",
};

const STORAGE_KEY = "bcv:familyProfile:v1";

export function loadProfile(): FamilyProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed, healthy: { ...DEFAULT_PROFILE.healthy, ...(parsed.healthy ?? {}) }, weekly: { ...DEFAULT_PROFILE.weekly, ...(parsed.weekly ?? {}) } };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(p: FamilyProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function useFamilyProfile() {
  const [profile, setProfile] = useState<FamilyProfile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setProfile(loadProfile());
    setHydrated(true);
  }, []);
  const update = (p: FamilyProfile) => {
    setProfile(p);
    saveProfile(p);
  };
  return { profile, setProfile: update, hydrated };
}

const LANG_LABEL: Record<Language, string> = {
  vi: "Vietnamese",
  en: "English",
  nl: "Dutch",
};

export function profileToPromptBlock(p: FamilyProfile, todayIso = new Date().toISOString()): string {
  const day = new Date(todayIso).toLocaleDateString("en-US", { weekday: "long" });
  const isTuesday = day === "Tuesday";
  const isWeekend = day === "Saturday" || day === "Sunday";
  const healthy = [
    p.healthy.lessSugar && "less sugar",
    p.healthy.lessSalt && "less salt",
    p.healthy.plentyVegetables && "plenty of vegetables",
    p.healthy.riceAlwaysAvailable && "rice always in the pantry",
  ]
    .filter(Boolean)
    .join(", ");

  const weekly = [
    p.weekly.tuesdayQuick && "quick meals under 30 min on Tuesdays",
    p.weekly.weekendTraditional && "traditional Vietnamese family dishes on weekends",
    p.weekly.fishTwicePerWeek && "include fish at least twice per week",
  ]
    .filter(Boolean)
    .join("; ");

  const todayRule = [
    isTuesday && p.weekly.tuesdayQuick && "TODAY IS TUESDAY — the recommended dish MUST cook in ≤30 minutes.",
    isWeekend && p.weekly.weekendTraditional && `TODAY IS ${day.toUpperCase()} — favor a traditional Vietnamese family dish.`,
  ]
    .filter(Boolean)
    .join(" ");

  return `Family profile (apply automatically — do not ask):
- Family size: ${p.familySize} people
- Favorite cuisines: ${p.cuisines.join(", ")}
- Healthy cooking: ${healthy || "balanced"}
- Dietary rules: ${p.dislikes}
- Weekly rhythm: ${weekly}
- Today is ${day}. ${todayRule}
- Garden priority: ${p.prioritizeGarden ? "ALWAYS use Garden Today ingredients first before fridge items." : "no priority"}
- Food waste: ${p.minimizeFoodWaste ? "prefer recipes that maximize ingredients already on hand." : "no preference"}
- Preferred description language: ${LANG_LABEL[p.language]} (Vietnamese dish name always appears first regardless).
${p.notes ? `- Extra notes: ${p.notes}` : ""}`.trim();
}
