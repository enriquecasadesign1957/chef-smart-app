"use client";

import { useEffect, useState } from "react";
import { recipeHeroImageUrl } from "@/lib/recipe-image";

export function MealThumb({ title }: { title: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = recipeHeroImageUrl(title, "thumb");

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
      {!loaded && !failed && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100" />
      )}
      {failed ? (
        <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-[10px] font-bold text-emerald-700">
          Plato
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-16 w-16 rounded-xl object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
