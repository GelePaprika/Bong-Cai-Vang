import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Single AI provider configuration layer.
 *
 * To switch providers in the future, change ONLY this file:
 *  - `AI_PROVIDER`  — "lovable" | "openai"
 *  - `AI_MODELS`    — model ids per capability
 *
 * All app code imports `getChatModel()` / `generateImageBase64()` from here.
 */

type ProviderName = "lovable" | "openai";

const AI_PROVIDER: ProviderName = "lovable";

const AI_MODELS = {
  lovable: {
    chat: "google/gemini-2.5-flash",
    vision: "google/gemini-2.5-flash",
    image: "google/gemini-2.5-flash-image",
  },
  openai: {
    chat: "gpt-4o-mini",
    vision: "gpt-4o-mini",
    image: "gpt-image-1",
  },
} as const;

function getProviderConfig() {
  if (AI_PROVIDER === "lovable") {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    return {
      apiKey,
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    };
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  return {
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    headers: { Authorization: `Bearer ${apiKey}` },
  };
}

function createProvider() {
  const cfg = getProviderConfig();
  return createOpenAICompatible({
    name: AI_PROVIDER === "lovable" ? "lovable" : "openai",
    baseURL: cfg.baseURL,
    headers: cfg.headers,
  });
}

/** Chat/text model — used for meal plan, weekly plan, translations, vision. */
export function getChatModel(kind: "chat" | "vision" = "chat") {
  const provider = createProvider();
  const modelId = AI_MODELS[AI_PROVIDER][kind];
  return provider(modelId);
}

/**
 * Backwards-compatible alias — existing code calls
 * `createLovableAiGatewayProvider()(modelId)`. We ignore the requested modelId
 * and route to the configured chat model so a single config switch works.
 */
export function createLovableAiGatewayProvider(_apiKey?: string) {
  return (_modelId?: string) => getChatModel("chat");
}

/**
 * Generate an image and return a raw base64 PNG string.
 * Uses Lovable AI Gateway `google/gemini-2.5-flash-image` by default.
 */
export async function generateImageBase64(prompt: string): Promise<string> {
  const cfg = getProviderConfig();
  const model = AI_MODELS[AI_PROVIDER].image;

  if (AI_PROVIDER === "lovable") {
    // Lovable AI Gateway: use chat completions with image modality.
    const res = await fetch(`${cfg.baseURL}/chat/completions`, {
      method: "POST",
      headers: { ...cfg.headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw Object.assign(new Error(text || `Image gen failed (${res.status})`), {
        status: res.status,
        responseBody: text,
      });
    }
    const json = (await res.json()) as {
      choices?: Array<{
        message?: {
          images?: Array<{ image_url?: { url?: string } }>;
        };
      }>;
    };
    const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? "";
    const match = dataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
    if (!match) throw new Error("Image response did not include a base64 image");
    return match[1];
  }

  // OpenAI fallback (non-streaming).
  const res = await fetch(`${cfg.baseURL}/images/generations`, {
    method: "POST",
    headers: { ...cfg.headers, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, size: "1024x1024" }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(new Error(text || `Image gen failed (${res.status})`), {
      status: res.status,
      responseBody: text,
    });
  }
  const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image response did not include base64 data");
  return b64;
}

export function getOpenAIKey(): string {
  const cfg = getProviderConfig();
  return cfg.apiKey;
}

export function getOpenAiFriendlyError(error: unknown): string | null {
  const seen = new Set<unknown>();
  const collect = (value: unknown): { statusCode?: number; text: string } => {
    if (!value || typeof value !== "object" || seen.has(value)) return { text: "" };
    seen.add(value);

    const record = value as Record<string, unknown>;
    const nested = collect(record.cause);
    const statusCode =
      typeof record.statusCode === "number"
        ? record.statusCode
        : typeof record.status === "number"
          ? record.status
          : nested.statusCode;
    const ownText = [record.message, record.responseBody, record.responseText, record.body]
      .filter((part): part is string => typeof part === "string")
      .join("\n");

    return { statusCode, text: `${ownText}\n${nested.text}` };
  };

  const { statusCode, text: messageParts } = collect(error);
  const text = messageParts.toLowerCase();

  if (text.includes("missing lovable_api_key")) {
    return "Bông Cải Vàng's kitchen needs Lovable AI to be enabled before it can plan meals.";
  }
  if (text.includes("missing openai_api_key")) {
    return "Bông Cải Vàng needs a saved OpenAI API key before it can cook up meal ideas.";
  }
  if (statusCode === 402 || text.includes("insufficient_credits") || text.includes("payment required")) {
    return "The kitchen ran out of AI credits. Please top up Lovable credits and try again.";
  }
  if (statusCode === 429) {
    return "The AI kitchen is busy right now. Please wait a moment and try again.";
  }
  if (statusCode === 401 || text.includes("invalid_api_key")) {
    return "The AI key is not valid. Please check your Lovable AI setup and try again.";
  }
  return null;
}
