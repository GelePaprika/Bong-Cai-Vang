import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export default defineTool({
  name: "get_thread_messages",
  title: "Get meal plan chat messages",
  description:
    "Read the messages of one of the signed-in user's Bông Cải Vàng meal plan chat threads.",
  inputSchema: {
    threadId: z.string().uuid().describe("The thread id from list_threads"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ threadId }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const { data, error } = await supabase
      .from("messages")
      .select("id, role, parts, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    // Flatten to plain text for the model.
    const transcript = (data ?? [])
      .map((m) => {
        const parts = m.parts as Array<{ type: string; text?: string }> | null;
        const text = Array.isArray(parts)
          ? parts.map((p) => (p.type === "text" ? p.text ?? "" : "")).join("")
          : "";
        return `${m.role}: ${text}`;
      })
      .join("\n\n");
    return {
      content: [{ type: "text", text: transcript || "(empty thread)" }],
      structuredContent: { messages: data ?? [] },
    };
  },
});
