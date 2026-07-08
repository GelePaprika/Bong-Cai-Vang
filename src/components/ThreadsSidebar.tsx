import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createThread, deleteThread, listThreads } from "@/lib/threads.functions";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, LogOut, MessageCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

export function ThreadsSidebar({ activeId }: { activeId: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const del = useServerFn(deleteThread);

  const { data: threads = [] } = useQuery({
    queryKey: ["threads"],
    queryFn: () => list({}),
  });

  const newThread = useMutation({
    mutationFn: () => create({ data: {} }),
    onSuccess: (thread) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (thread) navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
    },
  });

  const removeThread = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: async (_r, id) => {
      await qc.invalidateQueries({ queryKey: ["threads"] });
      if (id === activeId) navigate({ to: "/chat" });
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <img src={logo} alt="" width={32} height={32} />
        <Link to="/" className="font-serif text-lg">
          Bông Cải Vàng
        </Link>
      </div>

      <div className="px-3">
        <button
          onClick={() => newThread.mutate()}
          disabled={newThread.isPending}
          className="flex w-full items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> New meal plan
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {threads.length === 0 && (
          <p className="px-3 py-4 text-xs text-muted-foreground">
            Your saved meal plans will appear here.
          </p>
        )}
        {threads.map((t) => {
          const isActive = t.id === activeId;
          return (
            <div
              key={t.id}
              className={
                "group flex items-center rounded-lg pr-1 " +
                (isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60")
              }
            >
              <Link
                to="/chat/$threadId"
                params={{ threadId: t.id }}
                className="flex flex-1 items-center gap-2 truncate px-3 py-2 text-sm"
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{t.title}</span>
              </Link>
              <button
                onClick={() => {
                  if (confirm("Delete this plan?")) removeThread.mutate(t.id);
                }}
                className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
