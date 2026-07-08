import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ThreadsSidebar } from "@/components/ThreadsSidebar";
import { MealImage } from "@/components/MealImage";
import { ShoppingList } from "@/components/ShoppingList";
import { Sparkles, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { useServerFn } from "@tanstack/react-start";
import { renameThread } from "@/lib/threads.functions";
import { useQueryClient } from "@tanstack/react-query";

const STARTERS = [
  "I have chicken thighs, bok choy, ginger, garlic, spring onion and jasmine rice. Plan tonight's dinner.",
  "Plan a week of dinners around salmon, tofu, broccoli, carrots, cabbage and rice noodles.",
  "Có cá basa, cà chua, thơm, giá đỗ, rau muống — nấu gì cho cả nhà?",
  "Wat kan ik koken met kip, paprika, courgette en pasta?",
];

export function ChatShell({
  threadId,
  initialMessages,
}: {
  threadId: string;
  initialMessages: UIMessage[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const rename = useServerFn(renameThread);
  const qc = useQueryClient();
  const renamedRef = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const headers = new Headers(init?.headers);
          if (data.session?.access_token) {
            headers.set("Authorization", `Bearer ${data.session.access_token}`);
          }
          return fetch(input, { ...init, headers });
        },
        prepareSendMessagesRequest: ({ messages, id }) => ({
          body: { messages, threadId: id },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
  });

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId, status]);

  // Auto-title the thread from first user message
  useEffect(() => {
    if (renamedRef.current) return;
    if (initialMessages.length > 0) {
      renamedRef.current = true;
      return;
    }
    const first = messages.find((m) => m.role === "user");
    if (!first) return;
    const text = first.parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join(" ")
      .trim()
      .slice(0, 60);
    if (!text) return;
    renamedRef.current = true;
    rename({ data: { id: threadId, title: text } }).then(() => {
      qc.invalidateQueries({ queryKey: ["threads"] });
    });
  }, [messages, initialMessages.length, rename, threadId, qc]);

  const handleSubmit = async (message: { text?: string }) => {
    const value = (message.text ?? input).trim();
    if (!value || status === "streaming" || status === "submitted") return;
    setInput("");
    await sendMessage({ text: value });
  };

  const send = async (text: string) => {
    if (status === "streaming" || status === "submitted") return;
    await sendMessage({ text });
  };

  const loading = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      <div
        className={
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden " +
          (sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0")
        }
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform md:static md:z-auto md:translate-x-0 " +
          (sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")
        }
      >
        <div className="h-full w-72">
          <ThreadsSidebar activeId={threadId} />
        </div>
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border bg-card/60 px-4 py-3 backdrop-blur md:px-6">
          <button
            className="rounded-lg p-1.5 hover:bg-accent md:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Menu"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <img src={logo} alt="" width={28} height={28} className="md:hidden" />
          <div className="flex-1">
            <h1 className="font-serif text-lg leading-tight">Meal plan chat</h1>
            <p className="text-xs text-muted-foreground">
              Tell me what's in your fridge — I'll cook up a plan.
            </p>
          </div>
        </header>

        <Conversation className="flex-1">
          <ConversationContent className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<img src={logo} alt="" width={72} height={72} />}
                title="What's in your fridge tonight?"
                description="Type the ingredients you already have. I'll design a family dinner with pictures, a short recipe, and a grocery list for anything missing."
              >
                <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-2xl border border-border bg-card p-3 text-left text-sm text-foreground shadow-sm transition hover:border-primary hover:bg-accent"
                    >
                      <Sparkles className="mb-1.5 inline h-3.5 w-3.5 text-[color:var(--basil)]" />{" "}
                      {s}
                    </button>
                  ))}
                </div>
              </ConversationEmptyState>
            ) : (
              messages.map((m) => <MessageBubble key={m.id} message={m} />)
            )}

            {status === "submitted" && (
              <div className="mt-2 pl-1">
                <Shimmer>Bông Cải Vàng is thinking…</Shimmer>
              </div>
            )}
            {error && (
              <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error.message}
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-border bg-card/60 px-4 py-3 backdrop-blur md:px-6">
          <div className="mx-auto max-w-3xl">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputTextarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. I have chicken, bok choy, ginger, spring onion, rice…"
              />
              <PromptInputFooter className="justify-between">
                <span className="pl-2 text-xs text-muted-foreground">
                  🇻🇳 🇬🇧 🇳🇱 Chat in Vietnamese, English or Dutch
                </span>
                <PromptInputSubmit
                  status={status}
                  disabled={!input.trim() && !loading}
                  onClick={loading ? () => stop() : undefined}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  return (
    <Message from={message.role} className="my-4">
      <MessageContent>
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <MessageResponse key={i}>
                {part.text}
              </MessageResponse>
            );
          }
          if (part.type === "tool-generateMealImage") {
            const state = part as unknown as {
              state: string;
              input?: { dishName?: string; imagePrompt?: string };
              output?: { dishName: string; imagePrompt: string };
            };
            const data = state.output ?? state.input;
            if (!data?.dishName || !data.imagePrompt) return null;
            return (
              <div key={i} className="w-full max-w-xs">
                <MealImage dishName={data.dishName} prompt={data.imagePrompt} />
              </div>
            );
          }
          if (part.type === "tool-buildShoppingList") {
            const state = part as unknown as {
              output?: { items: Array<{ name: string; quantity?: string; category?: string }> };
              input?: { items: Array<{ name: string; quantity?: string; category?: string }> };
            };
            const items = state.output?.items ?? state.input?.items;
            if (!items) return null;
            return <ShoppingList key={i} items={items} />;
          }
          return null;
        })}
      </MessageContent>
    </Message>
  );
}
