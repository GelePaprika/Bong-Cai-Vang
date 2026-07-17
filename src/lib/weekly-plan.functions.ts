import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateObject, NoObjectGeneratedError } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const DayDishSchema = z.object({
  day: z.string(),
  nameVi: z.string(),
  nameEn: z.string(),
  cookingTimeMinutes: z.number(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  healthy: z.boolean(),
  summary: z.string(),
  imagePrompt: z.string(),
  reusedIngredients: z.array(z.string()).default([]),
});

const WeeklyPlanSchema = z.object({
  days: z.array(DayDishSchema),
  shoppingList: z.array(
    z.object({
      name: z.string(),
      quantity: z.string().optional(),
      category: z.string(),
    }),
  ),
  wasteNotes: z.string().optional().default(""),
});

export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;
export type DayDish = z.infer<typeof DayDishSchema>;

const SYSTEM = `You are Bông Cải Vàng, a warm Vietnamese family chef planning a WHOLE WEEK of dinners (Monday → Sunday, 7 dinners) for a family of 5.

STRICT PLANNING RULES:
1. PRIORITIZE ingredients the family already has ("What we already have"). Feature them across MULTIPLE dinners so nothing wilts. Example: if broccoli / pak choi / minced pork are on hand, plan them into 2-3 dinners in different preparations.
2. REUSE ingredients across the week to minimize food waste. A bunch of coriander, a pack of tofu, or a slab of pork should appear in more than one meal when possible.
3. The shopping list MUST contain ONLY missing ingredients — never repeat anything the family already has. Combine duplicates into a single line with the total weekly quantity.
4. Assume rice, fish sauce, soy sauce, salt, sugar, cooking oil are ALWAYS in the pantry — do NOT put them on the shopping list unless the user explicitly listed them as "don't have".
5. Include at least one vegetable-forward dish and (usually) fish twice a week. Respect the family profile (dislikes, cuisines, healthy rules).
6. Vietnamese primary; also welcome Japanese / Korean / Italian per profile.

For every day return:
- day: Monday..Sunday
- nameVi: authentic Vietnamese dish name with FULL correct diacritics (NFC). Capitalize only first word / proper nouns.
- nameEn: natural restaurant-menu English translation in Title Case using "&" for compound dishes. Not a literal word-for-word translation.
- cookingTimeMinutes: realistic integer
- difficulty: Easy | Medium | Hard
- healthy: true if vegetable-forward, low salt/sugar, light frying
- summary: 1-2 sentence description of the dish
- imagePrompt: vivid ENGLISH food-photography prompt of the finished plated dish, natural light, wooden table
- reusedIngredients: array of the "already have" items this dish uses (lowercase names)

Return ONLY minified JSON, no markdown, no code fences. Shape:
{
  "days": [7 dishes Mon..Sun],
  "shoppingList": [{ "name": string, "quantity"?: string, "category": string }],
  "wasteNotes": string
}`;

export const generateWeeklyPlan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        available: z.string().optional().default(""),
        profile: z.string().optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const gateway = createLovableAiGatewayProvider();
    const model = gateway("gpt-4o-mini");

    const availableBlock = data.available.trim()
      ? `\n\n🥬 What we already have (PRIORITIZE these; DO NOT add them to the shopping list):\n${data.available}`
      : `\n\n🥬 What we already have: (nothing specified — assume only rice + basic pantry staples are in the house; build a balanced week and put everything else on the shopping list).`;

    const profileBlock = data.profile.trim() ? `\n\n${data.profile}` : "";
    const prompt = `Plan 7 family dinners (Monday through Sunday).${availableBlock}${profileBlock}\n\nReturn JSON only.`;

    const nfc = (s: string) => s.normalize("NFC");
    const normalize = (p: WeeklyPlan): WeeklyPlan => ({
      days: p.days.map((d) => ({
        ...d,
        nameVi: nfc(d.nameVi),
        nameEn: nfc(d.nameEn),
        summary: nfc(d.summary),
        imagePrompt: nfc(d.imagePrompt),
      })),
      shoppingList: p.shoppingList.map((it) => ({
        ...it,
        name: nfc(it.name),
        category: nfc(it.category),
        quantity: it.quantity ? nfc(it.quantity) : it.quantity,
      })),
      wasteNotes: nfc(p.wasteNotes ?? ""),
    });

    const tryParse = (text: string): WeeklyPlan | null => {
      if (!text) return null;
      const cleaned = text
        .replace(/^\s*```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start === -1 || end === -1) return null;
      try {
        return WeeklyPlanSchema.parse(JSON.parse(cleaned.slice(start, end + 1)));
      } catch {
        return null;
      }
    };

    try {
      const { object } = await generateObject({
        model,
        system: SYSTEM,
        prompt,
        schema: WeeklyPlanSchema,
      });
      return normalize(object as WeeklyPlan);
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        const parsed = tryParse(error.text ?? "");
        if (parsed) return normalize(parsed);
      }
      const { generateText } = await import("ai");
      const { text } = await generateText({ model, system: SYSTEM, prompt });
      const parsed = tryParse(text);
      if (parsed) return normalize(parsed);
      throw new Error(
        "The chef couldn't put together a weekly plan this time. Try again with a slightly different list.",
      );
    }
  });
