"use client";

import { useCallback, useState } from "react";
import { queryRecipes, type RecipesQuery } from "@/lib/api/recipes";
import type { Recipe } from "@/lib/supabase/types";

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [source, setSource] = useState<"supabase" | "demo" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: RecipesQuery) => {
    setLoading(true);
    setError(null);
    try {
      const res = await queryRecipes(query);
      setRecipes(res.recipes);
      setSource(res.source);
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudieron cargar recetas";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { recipes, source, loading, error, search };
}
