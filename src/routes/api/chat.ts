import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGatewayProvider, getOpenAiFriendlyError } from "@/lib/ai-gateway.server";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SYSTEM_PROMPT = `You are Bông Cải Vàng ("Golden Cauliflower"), a warm, senior AI meal-planning chef for a Vietnamese-Dutch family of 5 (parents + kids aged 11, 13, and 21). You are also a nutrition advisor and expert in Vietnamese and Asian family cooking.

MISSION
Plan delicious weekday dinners from ingredients the user already has. Reduce waste, save money, and keep meals healthy (fresh vegetables, less sugar and salt).

FAMILY & PREFERENCES
- Cuisines the family loves: Vietnamese (primary), Japanese, Korean, Italian.
- Kids enjoy pho, spaghetti, lasagna, pizza, pancakes, sushi, and mom's Vietnamese cooking.
- One boy dislikes shrimp — when a shrimp dish is proposed, ALSO propose one shrimp-free alternate dish for him.
- Family eats eggs at breakfast, so avoid eggs at dinner unless the user asks.
- Fish should appear ~2× per week. Rice is always in the house.
- Cook always has rice in the pantry — you can assume it.

RULES
- NEVER invent ingredients the user did not list, unless clearly stated as a "shopping list" item.
- Prefer seasonal vegetables available in Dutch or Vietnamese supermarkets.
- Every menu MUST contain at least one vegetable-based dish.
- Portion for 5 people.
- Keep salt and sugar low; call out healthier swaps briefly.
- If the user writes in Vietnamese, respond in Vietnamese. In Dutch, respond in Dutch. Otherwise English.
- ALWAYS give Vietnamese dish names in Vietnamese (e.g. "Canh chua cá" – sour fish soup), followed by a short translation in the user's language.

RESPONSE FORMAT
For each meal in the menu:
1. Dish name (Vietnamese name first if Vietnamese, plus translation).
2. Short 3-5 line recipe summary (main steps, no long paragraphs).
3. Waste-reduction tip if any leftover ingredient can be reused tomorrow.

TOOLS
- For every dish you propose in a plan, CALL the \`generateMealImage\` tool once per dish with a vivid English food-photography prompt (e.g. "top-down bowl of Vietnamese Canh chua cá — sour tamarind fish soup with pineapple, tomato, bean sprouts and herbs, natural light"). Do NOT invent image URLs.
- When the user asks for a shopping list, call the \`buildShoppingList\` tool with the missing ingredients grouped by category.

Be warm, encouraging, and concise. Use light emoji sparingly (🌿 🍚 🐟).`;

type ChatBody = { messages: UIMessage[]; threadId?: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages required", { status: 400 });
        }

        const key = process.env.OPENAI_API_KEY;
        if (!key) return new Response("Missing OPENAI_API_KEY", { status: 500 });

        const authHeader = request.headers.get("authorization");
        const threadId = body.threadId;

        // Persist user's last message optimistically
        let supabase: ReturnType<typeof createClient<Database>> | null = null;
        let userId: string | null = null;
        if (authHeader && threadId) {
          const token = authHeader.replace("Bearer ", "");
          try {
            const parts = token.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
              userId = payload.sub ?? null;
            }
          } catch {
            userId = null;
          }
          if (userId) {
            supabase = createClient<Database>(
              process.env.SUPABASE_URL!,
              process.env.SUPABASE_PUBLISHABLE_KEY!,
              {
                global: { headers: { Authorization: `Bearer ${token}` } },
                auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
              },
            );

            const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
            if (lastUser) {
              await supabase.from("messages").insert({
                thread_id: threadId,
                user_id: userId,
                role: "user",
                parts: lastUser.parts as unknown as Database["public"]["Tables"]["messages"]["Insert"]["parts"],
              });
              await supabase
                .from("threads")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", threadId);
            }
          }
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("gpt-4o-mini");

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(body.messages),
          stopWhen: stepCountIs(50),
          tools: {
            generateMealImage: tool({
              description:
                "Register a meal so the UI can render a photo for it. Call once per proposed dish.",
              inputSchema: z.object({
                dishName: z.string().describe("Full dish name, Vietnamese name if applicable"),
                imagePrompt: z
                  .string()
                  .describe("Vivid English food-photography prompt of the finished dish"),
              }),
              execute: async ({ dishName, imagePrompt }) => ({
                dishName,
                imagePrompt,
                status: "queued" as const,
              }),
            }),
            buildShoppingList: tool({
              description: "Produce a grocery shopping list of missing ingredients.",
              inputSchema: z.object({
                items: z.array(
                  z.object({
                    name: z.string(),
                    quantity: z.string().optional(),
                    category: z
                      .string()
                      .describe("e.g. Vegetables, Protein, Pantry, Herbs & spices"),
                  }),
                ),
              }),
              execute: async ({ items }) => ({ items }),
            }),
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages,
          onError: (error) =>
            getOpenAiFriendlyError(error) ??
            "Bông Cải Vàng couldn't answer from the kitchen right now. Please try again in a moment.",
          onFinish: async ({ responseMessage }) => {
            if (!supabase || !userId || !threadId) return;
            await supabase.from("messages").insert({
              thread_id: threadId,
              user_id: userId,
              role: "assistant",
              parts: responseMessage.parts as unknown as Database["public"]["Tables"]["messages"]["Insert"]["parts"],
            });
            await supabase
              .from("threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", threadId);
          },
        });
      },
    },
  },
});
