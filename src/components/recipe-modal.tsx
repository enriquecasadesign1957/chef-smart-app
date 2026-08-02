"use client";

import { useEffect } from "react";
import { RecipeBadges } from "@/components/recipe-card";
import { RecipeHeroImage } from "@/components/recipe-hero-image";
import type { PantryRecipe } from "@/lib/api/pantry";

export function RecipeModal({
  recipe,
  onClose,
}: {
  recipe: PantryRecipe;
  onClose: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0">
          <RecipeHeroImage
            title={recipe.name}
            photoKeyword={recipe.photo_keyword}
            className="h-56 sm:h-64"
            priority
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm"
            aria-label="Cerrar"
          >
            Cerrar
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <h2
            id="recipe-modal-title"
            className="mb-2 text-2xl font-bold text-gray-800"
          >
            {recipe.name}
          </h2>
          <RecipeBadges time={recipe.time} difficulty={recipe.difficulty} />

          <section className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Ingredientes requeridos
            </h3>
            <ul className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-gray-50/80">
              {recipe.ingredients.map((ing) => (
                <li
                  key={ing}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-800"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--cs-mint)]" />
                  {ing}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Pasos de preparación
            </h3>
            <ol className="mt-3 space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={`${recipe.name}-step-${i}`} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--cs-brand)] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed text-gray-700">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
