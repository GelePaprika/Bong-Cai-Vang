import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-meal-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt } = (await request.json()) as { prompt?: string };
        if (!prompt) return new Response("prompt required", { status: 400 });

        const key = process.env.OPENAI_API_KEY;
        if (!key) return new Response("Missing OPENAI_API_KEY", { status: 500 });

        const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

        const upstream = await fetch(`${baseUrl}/images/generations`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: `${prompt}. Warm, appetizing food photography, natural daylight, shallow depth of field, styled on a wooden family dinner table.`,
            size: "1024x1024",
            stream: true,
            partial_images: 1,
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "Image generation failed", { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
