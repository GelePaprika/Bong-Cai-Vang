import { createFileRoute } from "@tanstack/react-router";
import { ChatShell } from "@/components/ChatShell";
import { getThreadMessages } from "@/lib/threads.functions";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { UIMessage } from "ai";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  const fetchMessages = useServerFn(getThreadMessages);

  const { data: initialMessages } = useQuery({
    queryKey: ["messages", threadId],
    queryFn: async () => {
      const raw = await fetchMessages({ data: { threadId } });
      const parsed = JSON.parse(raw as unknown as string) as Array<{
        id: string;
        role: UIMessage["role"];
        parts: UIMessage["parts"];
      }>;
      return parsed;
    },
  });

  return (
    <ChatShell
      threadId={threadId}
      initialMessages={(initialMessages ?? []) as unknown as UIMessage[]}
    />
  );
}
