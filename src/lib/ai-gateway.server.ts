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
  const record = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
  const statusCode =
    typeof record.statusCode === "number"
      ? record.statusCode
      : typeof record.status === "number"
        ? record.status
        : undefined;
  const messageParts = [
    record.message,
    record.responseBody,
    record.responseText,
    record.body,
    record.cause && typeof record.cause === "object"
      ? (record.cause as Record<string, unknown>).message
      : undefined,
  ]
    .filter((part): part is string => typeof part === "string")
    .join("\n");
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
