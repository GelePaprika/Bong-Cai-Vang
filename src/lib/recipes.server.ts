import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Dish, MealPlan } from "@/lib/meal-plan.functions";

const CUISINE_KEYWORDS: Array<[string, string[]]> = [
  ["Vietnamese", ["vietnam", "phở", "pho", "bún", "bun", "gỏi", "cơm", "nem", "chả", "canh", "kho"]],
  ["Japanese", ["japan", "sushi", "ramen", "udon", "miso", "teriyaki", "tonkatsu", "donburi"]],
  ["Korean", ["korea", "kimchi", "bulgogi", "bibimbap", "gochu", "tteok"]],
  ["Chinese", ["china", "chinese", "wok", "hoisin", "sichuan", "cantonese", "dumpling"]],
  ["Thai", ["thai", "pad thai", "tom yum", "tom kha", "curry paste"]],
  ["Italian", ["italian", "pasta", "risotto", "pizza", "parmesan", "pesto", "lasagna"]],
  ["Dutch", ["dutch", "stamppot", "hutspot", "erwtensoep"]],
];

const PROTEINS = ["Chicken", "Beef", "Pork", "Fish", "Shrimp", "Tofu", "Egg"];
const PROTEIN_HINTS: Record<string, string[]> = {
  Chicken: ["chicken", "gà"],
  Beef: ["beef", "bò"],
  Pork: ["pork", "heo", "thịt kho", "lợn"],
  Fish: ["fish", "cá", "salmon", "cod", "tuna"],
  Shrimp: ["shrimp", "prawn", "tôm"],
  Tofu: ["tofu", "đậu hũ", "đậu phụ"],
  Egg: ["egg", "trứng", "omelet"],
};

const VEGETABLES = [
  "Broccoli",
  "Bok Choy",
  "Spinach",
  "Tomato",
  "Pumpkin",
  "Cabbage",
  "Carrot",
];
const VEG_HINTS: Record<string, string[]> = {
  Broccoli: ["broccoli", "bông cải xanh"],
  "Bok Choy": ["bok choy", "pak choi", "cải chíp", "cải thìa"],
  Spinach: ["spinach", "rau chân vịt", "cải bó xôi"],
  Tomato: ["tomato", "cà chua"],
  Pumpkin: ["pumpkin", "bí đỏ"],
  Cabbage: ["cabbage", "bắp cải"],
  Carrot: ["carrot", "cà rốt"],
};

const CARBS = ["Rice", "Noodles", "Bread", "Potato"];
const CARB_HINTS: Record<string, string[]> = {
  Rice: ["rice", "cơm", "gạo"],
  Noodles: ["noodle", "bún", "mì", "phở", "udon", "ramen", "pasta", "spaghetti"],
  Bread: ["bread", "bánh mì", "toast", "sandwich"],
  Potato: ["potato", "khoai tây"],
};

const METHODS: Array<[string, string[]]> = [
  ["Stir Fry", ["stir fry", "stir-fry", "xào", "wok"]],
  ["Soup", ["soup", "canh", "broth", "stew"]],
  ["Grilled", ["grill", "nướng", "bbq"]],
  ["Steamed", ["steam", "hấp"]],
  ["Fried", ["fried", "chiên", "rán", "deep fry"]],
  ["Baked", ["bake", "oven", "roast"]],
  ["Air Fryer", ["air fry", "air-fry"]],
  ["Hot Pot", ["hot pot", "lẩu"]],
];

const DIETARY: Array<[string, (text: string, healthy: boolean) => boolean]> = [
  ["Healthy", (_t, h) => h],
  ["Vegetarian", (t) => /vegetarian/i.test(t)],
  ["Vegan", (t) => /vegan/i.test(t)],
  ["Low Carb", (t) => /low[- ]carb|keto/i.test(t)],
  ["High Protein", (t) => /high[- ]protein/i.test(t)],
  ["Gluten Free", (t) => /gluten[- ]free/i.test(t)],
  ["Dairy Free", (t) => /dairy[- ]free/i.test(t)],
];

function matchOne(text: string, hints: string[]): boolean {
  return hints.some((h) => text.includes(h));
}

export function generateTags(dish: Dish): string[] {
  const haystack = [dish.nameVi, dish.nameEn, dish.steps.join(" "), dish.imagePrompt]
    .join(" ")
    .toLowerCase();

  const tags = new Set<string>();

  // Cuisine
  let cuisineFound = false;
  for (const [cuisine, hints] of CUISINE_KEYWORDS) {
    if (matchOne(haystack, hints)) {
      tags.add(cuisine);
      cuisineFound = true;
      break;
    }
  }
  if (!cuisineFound) tags.add("Vietnamese"); // family default

  // Proteins
  for (const p of PROTEINS) if (matchOne(haystack, PROTEIN_HINTS[p])) tags.add(p);

  // Vegetables
  for (const v of VEGETABLES) if (matchOne(haystack, VEG_HINTS[v])) tags.add(v);

  // Carbs
  for (const c of CARBS) if (matchOne(haystack, CARB_HINTS[c])) tags.add(c);

  // Methods
  for (const [m, hints] of METHODS) if (matchOne(haystack, hints)) tags.add(m);

  // Meal type
  tags.add("Dinner");

  // Difficulty
  const diffMap: Record<Dish["difficulty"], string> = {
    Easy: "Easy",
    Medium: "Medium",
    Hard: "Advanced",
  };
  tags.add(diffMap[dish.difficulty]);

  // Cooking time
  const t = dish.cookingTimeMinutes;
  if (t <= 15) tags.add("15 Minutes");
  else if (t <= 30) tags.add("30 Minutes");
  else if (t <= 60) tags.add("Under 1 Hour");

  // Dietary
  for (const [tag, test] of DIETARY) if (test(haystack, dish.healthy)) tags.add(tag);

  // Family
  tags.add("Family Friendly");
  if (dish.difficulty === "Easy") tags.add("Kid Friendly");

  return Array.from(tags);
}

function inferCuisine(tags: string[]): string {
  const cuisines = CUISINE_KEYWORDS.map(([c]) => c);
  return tags.find((t) => cuisines.includes(t)) ?? "Vietnamese";
}

export type SaveRecipeContext = {
  language?: string;
  aiModel?: string;
  userId?: string | null;
};

export async function saveDishAsRecipe(
  dish: Dish,
  shoppingList: MealPlan["shoppingList"],
  ctx: SaveRecipeContext = {},
): Promise<void> {
  const tags = generateTags(dish);
  const cuisine = inferCuisine(tags);

  const { error } = await supabaseAdmin.from("recipes").insert({
    user_id: ctx.userId ?? null,
    title: dish.nameEn,
    name_vi: dish.nameVi,
    cuisine,
    ingredients: (dish.ingredients ?? []) as unknown as never,
    instructions: dish.steps.join("\n"),
    shopping_list: shoppingList,
    preparation_time: null,
    cooking_time: dish.cookingTimeMinutes,
    servings: 5,
    difficulty: dish.difficulty,
    nutrition: {},
    image_url: null,
    language: ctx.language ?? "en",
    ai_model: ctx.aiModel ?? "google/gemini-2.5-flash",
    recipe_source: "AI",
    tags,
  });

  if (error) throw error;
}

export async function saveMealPlan(plan: MealPlan, ctx: SaveRecipeContext = {}): Promise<void> {
  const dishes = [plan.recommended, ...plan.alternatives];
  // Fire off in parallel; individual failures are swallowed by caller-level try/catch.
  await Promise.allSettled(
    dishes.map((d) => saveDishAsRecipe(d, plan.shoppingList, ctx)),
  );
}
