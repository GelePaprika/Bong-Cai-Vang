
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
return (
<div className="flex min-h-screen items-center justify-center bg-background px-4">
<div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <h1 className="font-serif text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
<p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
          The page you're looking for doesn't exist.
</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Back home
        </Link>
</div>
</div>
);
@@ -44,27 +44,25 @@ function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
return (
<div className="flex min-h-screen items-center justify-center bg-background px-4">
<div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <h1 className="font-serif text-2xl">Something went wrong in the kitchen</h1>
<p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
          Try again, or head back home.
</p>
<div className="mt-6 flex flex-wrap justify-center gap-2">
<button
onClick={() => {
router.invalidate();
reset();
}}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
>
Try again
</button>
<a
href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent"
>
            Go home
            Home
</a>
</div>
</div>
@@ -77,20 +75,23 @@ export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
meta: [
{ charSet: "utf-8" },
{ name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "Lovable Generated Project" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Lovable Generated Project" },
      { title: "Bông Cải Vàng — AI family meal planner" },
      {
        name: "description",
        content:
          "Warm AI dinner planner for busy Vietnamese-Dutch families. Turn what's in your fridge into delicious weekly menus with a smart grocery list.",
      },
      { property: "og:title", content: "Bông Cải Vàng — AI family meal planner" },
      {
        property: "og:description",
        content:
          "Plan tonight's dinner from your fridge. Vietnamese, Asian and Italian family recipes with an AI chef.",
      },
{ property: "og:type", content: "website" },
{ name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
],
links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "stylesheet", href: appCss },
{ rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
],
}),
@@ -116,11 +117,21 @@ function RootShell({ children }: { children: ReactNode }) {

function RootComponent() {
const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient, router]);

return (
<QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
<Outlet />
      <Toaster richColors position="top-center" />
</QueryClientProvider>
);
}
