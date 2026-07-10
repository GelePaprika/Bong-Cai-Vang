import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
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
- nameVi: Vietnamese name (e.g. "Canh chua cá lóc").
- nameEn: short English translation (e.g. "Sour tamarind fish soup").
- cookingTimeMinutes: realistic integer.
- difficulty: Easy | Medium | Hard.
- healthy: true if it's vegetable-forward, low salt/sugar, light on frying.
- steps: 4-6 short imperative lines, no long paragraphs.
- imagePrompt: vivid ENGLISH food-photography prompt of the finished plated dish, top-down or 3/4, natural light, wooden table.

Be concise. Do not invent ingredients not in the fridge unless they go on the shopping list.`;

export const generateMealPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ingredients: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = `Ingredients available in the fridge/pantry:\n${data.ingredients}\n\nPlan tonight's family dinner.`;

    try {
      const { experimental_output } = await generateText({
        model,
        system: SYSTEM,
        prompt,
        experimental_output: Output.object({ schema: PlanSchema }),
      });
      return experimental_output as MealPlan;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        try {
          return PlanSchema.parse(JSON.parse(error.text ?? "{}"));
        } catch {
          throw new Error("The chef couldn't put together a plan this time. Try again with a slightly different ingredient list.");
        }
      }
      throw error;
    }
  });
