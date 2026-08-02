"use client";

import { RecipeHeroImage } from "@/components/recipe-hero-image";
import type { PantryRecipe } from "@/lib/api/pantry";

function difficultyBadge(difficulty: string) {
  const d = difficulty.toLowerCase();
  if (d.includes("fácil") || d.includes("facil")) {
    return {
      label: difficulty,
      className: "bg-emerald-100 text-emerald-800",
      icon: "🌿",
    };
  }
  if (d.includes("chef") || d.includes("difícil") || d.includes("dificil")) {
    return {
      label: difficulty,
      className: "bg-violet-100 text-violet-800",
      icon: "👩‍🍳",
    };
  }
  return {
    label: difficulty || "Media",
    className: "bg-orange-100 text-orange-800",
    icon: "🔥",
  };
}

export function RecipeBadges({
  time,
  difficulty,
}: {
  time: number;
  difficulty: string;
}) {
  const diff = difficultyBadge(difficulty);
  return (
    <div className="mb-1 flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">
        <span aria-hidden>⏱️</span>
        {time} min
      </span>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${diff.className}`}
      >
        <span aria-hidden>{diff.icon}</span>
        {diff.label}
      </span>
    </div>
  );
}

export function RecipeCard({
  recipe,
  onOpen,
}: {
  recipe: PantryRecipe;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-md transition-all duration-300 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cs-mint)]"
    >
      <RecipeHeroImage title={recipe.name} className="h-48" />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 text-xl font-bold text-gray-800">{recipe.name}</h3>
        <RecipeBadges time={recipe.time} difficulty={recipe.difficulty} />
        <p className="mt-3 line-clamp-2 text-sm text-gray-500">
          {recipe.ingredients.slice(0, 4).join(" · ")}
          {recipe.ingredients.length > 4 ? "…" : ""}
        </p>
        <span className="mt-4 text-sm font-semibold text-[var(--cs-accent)]">
          Ver preparación →
        </span>
      </div>
    </button>
  );
}
