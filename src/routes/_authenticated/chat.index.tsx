import { createFileRoute, redirect } from "@tanstack/react-router";
import { createThread } from "@/lib/threads.functions";

export const Route = createFileRoute("/_authenticated/chat/")({
  loader: async () => {
    const thread = await createThread({ data: {} });
    throw redirect({ to: "/chat/$threadId", params: { threadId: thread!.id } });
  },
  component: () => null,
});
