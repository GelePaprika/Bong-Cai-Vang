import { useEffect, useRef, useState } from "react";
import { streamImage } from "@/lib/streamImage";
import { ImageIcon } from "lucide-react";

const cache = new Map<string, string>();

export function MealImage({ dishName, prompt }: { dishName: string; prompt: string }) {
  const [src, setSrc] = useState<string | null>(() => cache.get(prompt) ?? null);
  const [isFinal, setIsFinal] = useState(() => cache.has(prompt));
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (cache.has(prompt)) return;
    started.current = true;
    streamImage(
      "/api/generate-meal-image",
      prompt,
      (dataUrl, final) => {
        setSrc(dataUrl);
        if (final) {
          setIsFinal(true);
          cache.set(prompt, dataUrl);
        }
      },
    ).catch((err) => setError(err instanceof Error ? err.message : "Image failed"));
  }, [prompt]);


  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-muted">
      <div className="relative aspect-square w-full bg-gradient-to-br from-primary/20 to-accent/20">
        {src ? (
          <img
            src={src}
            alt={dishName}
            className={
              "h-full w-full object-cover transition-[filter] duration-500 " +
              (isFinal ? "blur-0" : "blur-2xl")
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-6 w-6 animate-pulse" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-3 text-center text-xs text-destructive">
            {error}
          </div>
        )}
      </div>
      <figcaption className="border-t border-border bg-card px-3 py-2 text-sm font-semibold">
        {dishName}
      </figcaption>
    </figure>
  );
}
