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
