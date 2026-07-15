import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateObject, NoObjectGeneratedError } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const DishSchema = z.object({
  nameVi: z.string(),
  nameEn: z.string(),
  cookingTimeMinutes: z.number(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  healthy: z.boolean(),
  steps: z.array(z.string()),
  imagePrompt: z.string(),
});

const PlanSchema = z.object({
  recommended: DishSchema,
  alternatives: z.array(DishSchema),
  shoppingList: z.array(
    z.object({
      name: z.string(),
      quantity: z.string().optional(),
      category: z.string(),
    }),
  ),
});

export type MealPlan = z.infer<typeof PlanSchema>;
export type Dish = z.infer<typeof DishSchema>;

const SYSTEM = `You are Bông Cải Vàng, a warm Vietnamese family chef and nutrition advisor. Plan a family dinner for 5 (parents + kids aged 11, 13, 21) using ingredients the cook already has.

Family:
- Loves Vietnamese (primary), Japanese, Korean, Italian.
- One boy dislikes shrimp — avoid shrimp in the recommended dish.
- Eggs are eaten at breakfast — avoid eggs at dinner.
- Rice is always in the pantry.
- Fish ~2x per week is welcome.
- Keep salt and sugar low, include vegetables.

Return a plan with:
- ONE recommended dinner (the star of the plate).
- EXACTLY 3 alternative dishes so the family can choose.
- A shopping list of missing ingredients (categories like Vegetables, Protein, Pantry, Herbs & spices).

For every dish:
- nameVi: the authentic Vietnamese dish name with FULL, CORRECT diacritics (e.g. "Gà hấp cải chíp tỏi phi", "Canh chua cá lóc", "Thịt kho tộ"). Use precomposed Unicode (NFC) — never split a base letter and a combining accent. Capitalize only the first word and proper nouns.
- nameEn: a natural, restaurant-menu-quality English translation in Title Case, using "&" for compound dishes. NOT a literal word-for-word translation. Examples:
    • "Gà hấp cải chíp tỏi phi" → "Steamed Chicken with Pak Choi & Crispy Fried Garlic"
    • "Cà tím sốt thịt băm" → "Tomato-Braised Eggplant with Minced Pork"
    • "Canh chua cá lóc" → "Sour Tamarind Fish Soup with Snakehead"
  Use familiar English produce names: pak choi (not paksoi), morning glory (not water spinach), spring onion, coriander, fish sauce.
- cookingTimeMinutes: realistic integer.
- difficulty: Easy | Medium | Hard.
- healthy: true if it's vegetable-forward, low salt/sugar, light on frying.
- steps: 4-6 short imperative lines, no long paragraphs.
- imagePrompt: vivid ENGLISH food-photography prompt of the finished plated dish, top-down or 3/4, natural light, wooden table.

Be concise. Do not invent ingredients not in the fridge unless they go on the shopping list.

Respond with ONLY valid minified JSON, no markdown, no code fences, no commentary. Shape:
{
  "recommended": Dish,
  "alternatives": [Dish, Dish, Dish],
  "shoppingList": [{ "name": string, "quantity"?: string, "category": string }]
}
where Dish = { "nameVi": string, "nameEn": string, "cookingTimeMinutes": number, "difficulty": "Easy"|"Medium"|"Hard", "healthy": boolean, "steps": string[], "imagePrompt": string }.`;


export const generateMealPlan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        ingredients: z.string().min(1),
        garden: z.string().optional().default(""),
        profile: z.string().optional().default(""),
        language: z.enum(["en", "nl", "vi"]).optional().default("en"),
        difficulty: z.enum(["easy", "medium", "chef"]).optional().default("easy"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const gardenBlock = data.garden.trim()
      ? `\n\n🌱 Harvested from the family garden TODAY (PRIORITIZE these first to avoid food waste — try to feature at least one in the recommended dish):\n${data.garden}`
      : "";
    const profileBlock = data.profile.trim() ? `\n\n${data.profile}` : "";
    const langName =
      data.language === "vi" ? "Vietnamese (Tiếng Việt)" : data.language === "nl" ? "Dutch (Nederlands)" : "English";
    const langBlock = `\n\nOUTPUT LANGUAGE: Write ALL user-facing generated content in ${langName} — the "nameEn" field (dish title/subtitle in ${langName}), the "steps" (cooking instructions), and the "shoppingList" item names and categories. ALWAYS keep "nameVi" in authentic Vietnamese with full diacritics regardless of language. Keep "imagePrompt" in English (for the image model).`;
    const difficultyBlock =
      data.difficulty === "chef"
        ? `\n\nCOOKING DIFFICULTY: Chef's Challenge — advanced traditional family dishes or restaurant-quality meals, up to ~60 minutes, multiple cooking techniques. Set every dish "difficulty" field to "Hard".`
        : data.difficulty === "medium"
          ? `\n\nCOOKING DIFFICULTY: Medium — around 30-45 minutes, moderate cooking skills, more techniques. Set every dish "difficulty" field to "Medium".`
          : `\n\nCOOKING DIFFICULTY: Easy — beginner friendly, simple recipes, around 20-30 minutes, suitable for kids and teenagers learning to cook. Set every dish "difficulty" field to "Easy".`;
    const prompt = `Ingredients available in the fridge/pantry:\n${data.ingredients}${gardenBlock}${profileBlock}${langBlock}${difficultyBlock}\n\nPlan tonight's family dinner. Return JSON only.`;

    const nfc = (s: string) => s.normalize("NFC");
    const normalizeDish = (d: Dish): Dish => ({
      ...d,
      nameVi: nfc(d.nameVi),
      nameEn: nfc(d.nameEn),
      steps: d.steps.map(nfc),
      imagePrompt: nfc(d.imagePrompt),
    });
    const normalizePlan = (p: MealPlan): MealPlan => ({
      recommended: normalizeDish(p.recommended),
      alternatives: p.alternatives.map(normalizeDish),
      shoppingList: p.shoppingList.map((it) => ({
        ...it,
        name: nfc(it.name),
        category: nfc(it.category),
        quantity: it.quantity ? nfc(it.quantity) : it.quantity,
      })),
    });

    const tryParse = (text: string): MealPlan | null => {
      if (!text) return null;
      const cleaned = text
        .replace(/^\s*```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start === -1 || end === -1) return null;
      const candidate = cleaned.slice(start, end + 1);
      try {
        return PlanSchema.parse(JSON.parse(candidate));
      } catch {
        return null;
      }
    };

    try {
      const { object } = await generateObject({
        model,
        system: SYSTEM,
        prompt,
        schema: PlanSchema,
      });
      return normalizePlan(object as MealPlan);
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        const parsed = tryParse(error.text ?? "");
        if (parsed) return normalizePlan(parsed);
      }
      // Fallback: plain text generation, then extract JSON
      const { generateText } = await import("ai");
      const { text } = await generateText({
        model,
        system: SYSTEM,
        prompt,
      });
      const parsed = tryParse(text);
      if (parsed) return normalizePlan(parsed);
      throw new Error(
        "The chef couldn't put together a plan this time. Try again with a slightly different ingredient list.",
      );
    }
  });

