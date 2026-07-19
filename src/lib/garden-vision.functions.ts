import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateObject, NoObjectGeneratedError } from "ai";
import { createLovableAiGatewayProvider, getOpenAiFriendlyError } from "@/lib/ai-gateway.server";

const ResultSchema = z.object({
  ingredients: z.array(z.string()),
});

export type GardenScanResult = z.infer<typeof ResultSchema>;

const SYSTEM = `You are Garden Scout, a friendly vision assistant for a Vietnamese family cook. Look at the garden photo and list ONLY the edible vegetables, herbs, fruits, or leafy greens you can clearly identify with reasonable confidence.

Rules:
- Use familiar English produce names in lower case: pak choi, morning glory, lettuce, tomatoes, chili, basil, Vietnamese basil, mint, cilantro, spring onion, eggplant, cucumber, green beans, pumpkin, zucchini, lemongrass, perilla, coriander.
- Skip anything you are unsure about. Skip flowers, weeds, soil, pots, tools, people.
- Deduplicate. Return 0–12 items max.
- Respond ONLY as minified JSON: {"ingredients": string[]}.`;

export const scanGarden = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ imageDataUrl: z.string().min(20) }).parse(d),
  )
  .handler(async ({ data }) => {
    const gateway = createLovableAiGatewayProvider();
    const model = gateway("gpt-4o-mini");

    try {
      const { object } = await generateObject({
        model,
        system: SYSTEM,
        schema: ResultSchema,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What edible vegetables and herbs can you spot in this garden photo?" },
              { type: "image", image: data.imageDataUrl },
            ],
          },
        ],
      });
      return object;
    } catch (error) {
      const friendlyError = getOpenAiFriendlyError(error);
      if (friendlyError) throw new Error(friendlyError);

      if (NoObjectGeneratedError.isInstance(error)) {
        const txt = error.text ?? "";
        const start = txt.indexOf("{");
        const end = txt.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          try {
            return ResultSchema.parse(JSON.parse(txt.slice(start, end + 1)));
          } catch {
            /* fall through */
          }
        }
      }
      throw new Error("Garden Scout couldn't read that photo. Try a clearer, well-lit shot.");
    }
  });
