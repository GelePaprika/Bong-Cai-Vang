import { createFileRoute } from "@tanstack/react-router";
import { generateImageBase64, getOpenAiFriendlyError } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/generate-meal-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt } = (await request.json()) as { prompt?: string };
        if (!prompt) return new Response("prompt required", { status: 400 });

        try {
          const b64 = await generateImageBase64(
            `${prompt}. Warm, appetizing food photography, natural daylight, shallow depth of field, styled on a wooden family dinner table.`,
          );

          // Emit a single SSE event matching the shape streamImage.ts expects.
          const payload = JSON.stringify({ type: "image_generation.completed", b64_json: b64 });
          const body = `event: image_generation.completed\ndata: ${payload}\n\n`;

          return new Response(body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
            },
          });
        } catch (error) {
          const friendly = getOpenAiFriendlyError(error);
          const message =
            friendly ?? (error instanceof Error ? error.message : "Image generation failed");
          const status =
            (error as { status?: number })?.status && (error as { status?: number }).status! >= 400
              ? (error as { status: number }).status
              : 500;
          return new Response(message, { status });
        }
      },
    },
  },
});
