import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateObject, NoObjectGeneratedError } from "ai";
import { createLovableAiGatewayProvider, getOpenAiFriendlyError } from "@/lib/ai-gateway.server";

const ItemSchema = z.object({ name: z.string(), category: z.string() });

const InputSchema = z.object({
  items: z.array(ItemSchema),
  categories: z.array(z.string()),
  targetLang: z.enum(["en", "nl", "vi"]),
});

const OutputSchema = z.object({
  items: z.array(z.string()),
  categories: z.array(z.string()),
});

export type TranslatedShopping = z.infer<typeof OutputSchema>;

const LANG_NAME: Record<"en" | "nl" | "vi", string> = {
  en: "English",
  nl: "Dutch (Nederlands)",
  vi: "Vietnamese (Tiếng Việt) with full correct diacritics (NFC)",
};

export const translateShoppingList = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    // Fast path: English pass-through (source is already English)
    if (data.targetLang === "en") {
      return {
        items: data.items.map((i) => i.name),
        categories: data.categories,
      } satisfies TranslatedShopping;
    }

    const gateway = createLovableAiGatewayProvider();
    const model = gateway("gpt-4o-mini");

    const langLabel = LANG_NAME[data.targetLang];

    const system = `You translate grocery shopping list terms into ${langLabel}.
Rules:
- Translate ONLY ingredient names and category names.
- Use the natural everyday supermarket term a native shopper would recognize.
- Keep it concise (1-3 words per item, no descriptions).
- Do NOT include quantities, units, brands, or extra words.
- Preserve item order exactly. Preserve category order exactly.
- Return JSON only.`;

    const prompt = `Translate to ${langLabel}.

Ingredient names (in order, ${data.items.length} items):
${data.items.map((it, i) => `${i + 1}. ${it.name} [category: ${it.category}]`).join("\n")}

Category names (in order, ${data.categories.length} items):
${data.categories.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Return JSON: { "items": string[${data.items.length}], "categories": string[${data.categories.length}] }`;

    try {
      const { object } = await generateObject({
        model,
        system,
        prompt,
        schema: OutputSchema,
      });
      const out = object as TranslatedShopping;
      if (
        out.items.length !== data.items.length ||
        out.categories.length !== data.categories.length
      ) {
        throw new Error("length mismatch");
      }
      return out;
    } catch (error) {
      const friendlyError = getOpenAiFriendlyError(error);
      if (friendlyError) throw new Error(friendlyError);

      if (NoObjectGeneratedError.isInstance(error)) {
        try {
          const cleaned = (error.text ?? "")
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, "")
            .trim();
          const start = cleaned.indexOf("{");
          const end = cleaned.lastIndexOf("}");
          if (start !== -1 && end !== -1) {
            const parsed = OutputSchema.parse(
              JSON.parse(cleaned.slice(start, end + 1)),
            );
            return parsed;
          }
        } catch {
          /* fall through */
        }
      }
      // Fallback: return originals so UI still works
      return {
        items: data.items.map((i) => i.name),
        categories: data.categories,
      } satisfies TranslatedShopping;
    }
  });
