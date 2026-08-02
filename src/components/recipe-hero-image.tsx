"use client";

import { useEffect, useState } from "react";
import { recipeHeroImageUrl } from "@/lib/recipe-image";

export function RecipeHeroImage({
  title,
  className = "h-48",
  priority = false,
}: {
  title: string;
  className?: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = recipeHeroImageUrl(title);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <div className={`relative w-full overflow-hidden bg-gray-100 ${className}`}>
      {!loaded && !failed && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"
          aria-hidden
        />
      )}
      {failed ? (
        <div className="flex h-full w-full items-center justify-center bg-[var(--cs-mint)]/20 text-sm font-semibold text-[var(--cs-brand)]">
          {title.slice(0, 28)}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
