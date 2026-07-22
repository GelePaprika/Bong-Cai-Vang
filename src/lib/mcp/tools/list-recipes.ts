import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export default defineTool({
  name: "list_recipes",
  title: "List saved recipes",
  description:
    "Search the signed-in user's saved Bông Cải Vàng recipes. Optional query filters by title or Vietnamese name.",
  inputSchema: {
    query: z.string().optional().describe("Optional search string matched against title/name_vi"),
    limit: z.number().int().min(1).max(100).optional().describe("Max recipes (default 20)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
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
    let q = supabase
      .from("recipes")
      .select("id, title, name_vi, cuisine, difficulty, tags, cooking_time, created_at")
      .eq("user_id", ctx.getUserId()!)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (query) {
      const like = `%${query}%`;
      q = q.or(`title.ilike.${like},name_vi.ilike.${like}`);
    }
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { recipes: data ?? [] },
    };
  },
});
