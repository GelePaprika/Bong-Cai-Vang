import { createOpenAI } from "@ai-sdk/openai";

/**
 * Creates a standard OpenAI provider using the OPENAI_API_KEY env var.
 * Kept under this legacy filename/export for backwards compatibility with
 * existing imports across the codebase.
 */
export function createLovableAiGatewayProvider(_apiKey?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  return createOpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

export function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  return key;
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

  if (text.includes("missing openai_api_key")) {
    return "Bông Cải Vàng needs a saved OpenAI API key before it can cook up meal ideas.";
  }

  if (
    statusCode === 401 ||
    text.includes("invalid_api_key") ||
    text.includes("incorrect api key")
  ) {
    return "The saved OpenAI API key is not valid yet. Please replace it with a real key from your OpenAI account, then try again.";
  }

  if (
    text.includes("insufficient_quota") ||
    text.includes("exceeded your current quota") ||
    text.includes("check your plan and billing")
  ) {
    return "The OpenAI key is valid, but that OpenAI account has no available quota or billing credits. Add billing/credits in OpenAI or save a funded key, then try again.";
  }

  if (statusCode === 429) {
    return "OpenAI is rate limiting the kitchen right now. Please wait a moment and try again.";
  }

  return null;
}
