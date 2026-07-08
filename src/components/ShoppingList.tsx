import { ShoppingBasket } from "lucide-react";

export function ShoppingList({
  items,
}: {
  items: Array<{ name: string; quantity?: string; category?: string }>;
}) {
  const byCategory = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.category ?? "Other";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(item);
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--basil)]/15 text-[color:var(--basil)]">
          <ShoppingBasket className="h-4 w-4" />
        </div>
        <h4 className="font-serif text-lg">Grocery list</h4>
      </div>
      <div className="space-y-3">
        {Array.from(byCategory.entries()).map(([cat, list]) => (
          <div key={cat}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {cat}
            </div>
            <ul className="mt-1 divide-y divide-border">
              {list.map((it, i) => (
                <li key={i} className="flex items-center justify-between py-1.5 text-sm">
                  <span>{it.name}</span>
                  {it.quantity && (
                    <span className="text-xs text-muted-foreground">{it.quantity}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
