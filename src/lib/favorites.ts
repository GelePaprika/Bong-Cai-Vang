import { useEffect, useState, useCallback } from "react";
import type { Dish, MealPlan } from "@/lib/meal-plan.functions";

const STORAGE_KEY = "bcv:favorites";

export type FavoriteRecipe = {
  id: string;
  dish: Dish;
  shoppingList: MealPlan["shoppingList"];
  savedAt: number; // epoch ms
  cuisine?: string; // "Vietnamese" | "Japanese" | "Korean" | "Italian" | "Other"
  proteinTags?: string[]; // ["Chicken","Fish","Pork","Beef","Vegetarian"]
  timesCooked?: number;
  notes?: string;
  rating?: number;
  ingredientsUsed?: string; // original fridge ingredients
  garden?: string;
};

// Cheap heuristics to infer cuisine + protein tags from Vietnamese/English names
export function inferTags(dish: Dish): { cuisine: string; proteinTags: string[] } {
  const hay = (dish.nameVi + " " + dish.nameEn).toLowerCase();

  let cuisine = "Vietnamese";
  if (/\b(sushi|ramen|udon|tempura|miso|teriyaki|donburi|katsu|onigiri|yakitori)\b/.test(hay))
    cuisine = "Japanese";
  else if (/\b(kimchi|bibimbap|bulgogi|gochujang|tteok|jjigae|galbi|japchae)\b/.test(hay))
    cuisine = "Korean";
  else if (/\b(pasta|pizza|risotto|lasagna|carbonara|bolognese|gnocchi|parmesan|pesto|focaccia)\b/.test(hay))
    cuisine = "Italian";

  const proteinTags: string[] = [];
  if (/\b(gà|chicken)\b/.test(hay)) proteinTags.push("Chicken");
  if (/\b(cá|fish|salmon|tuna|snakehead|basa|mackerel)\b/.test(hay)) proteinTags.push("Fish");
  if (/\b(heo|lợn|thịt kho|pork|bacon|ham)\b/.test(hay)) proteinTags.push("Pork");
  if (/\b(bò|beef|steak)\b/.test(hay)) proteinTags.push("Beef");
  if (proteinTags.length === 0 && dish.healthy) proteinTags.push("Vegetarian");
  return { cuisine, proteinTags };
}

function readAll(): FavoriteRecipe[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: FavoriteRecipe[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("bcv:favorites-changed"));
  } catch {
    /* ignore */
  }
}

export function dishKey(dish: Dish): string {
  return dish.nameVi.trim().toLowerCase();
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavorites(readAll());
    setHydrated(true);
    const onChange = () => setFavorites(readAll());
    window.addEventListener("bcv:favorites-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("bcv:favorites-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const save = useCallback(
    (dish: Dish, extra: Partial<FavoriteRecipe> = {}) => {
      const list = readAll();
      const key = dishKey(dish);
      if (list.some((f) => dishKey(f.dish) === key)) return;
      const { cuisine, proteinTags } = inferTags(dish);
      const fav: FavoriteRecipe = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        dish,
        shoppingList: extra.shoppingList ?? [],
        savedAt: Date.now(),
        cuisine,
        proteinTags,
        timesCooked: 0,
        ...extra,
      };
      writeAll([fav, ...list]);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    writeAll(readAll().filter((f) => f.id !== id));
  }, []);

  const incrementCooked = useCallback((id: string) => {
    const list = readAll().map((f) =>
      f.id === id ? { ...f, timesCooked: (f.timesCooked ?? 0) + 1 } : f,
    );
    writeAll(list);
  }, []);

  const isSaved = useCallback(
    (dish: Dish) => favorites.some((f) => dishKey(f.dish) === dishKey(dish)),
    [favorites],
  );

  return { favorites, hydrated, save, remove, incrementCooked, isSaved };
}
