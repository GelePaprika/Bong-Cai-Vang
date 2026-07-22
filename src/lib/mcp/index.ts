import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listThreads from "./tools/list-threads";
import getThread from "./tools/get-thread";
import listRecipes from "./tools/list-recipes";
import getRecipe from "./tools/get-recipe";

// Direct Supabase issuer (never the .lovable.cloud proxy).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "bong-cai-vang-mcp",
  title: "Bông Cải Vàng",
  version: "0.1.0",
  instructions:
    "Tools for Bông Cải Vàng, a Vietnamese-Dutch family meal planner. Use list_threads / get_thread_messages to read the signed-in user's meal-plan chats, and list_recipes / get_recipe to browse and open their saved family cookbook recipes.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listThreads, getThread, listRecipes, getRecipe],
});
