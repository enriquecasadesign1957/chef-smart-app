import { DEMO_RECIPES, type Recipe as DemoRecipe } from "@/lib/demo-data";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { mapRecipeRow, type Recipe } from "@/lib/supabase/types";

export type RecipesQuery = {
  ingredients?: string[];
  budget?: number;
};

function demoAsRecipes(): Recipe[] {
  return DEMO_RECIPES.map((r: DemoRecipe) => ({
    id: r.id,
    name: r.name,
    ingredients: r.ingredients,
    cost: r.costClp,
    difficulty: r.difficulty,
    time: r.minutes,
  }));
}

function scoreRecipe(recipe: Recipe, tokens: string[]): number {
  if (!tokens.length) return 0;
  return recipe.ingredients.filter((ing) =>
    tokens.some((t) => ing.toLowerCase().includes(t) || t.includes(ing.toLowerCase())),
  ).length;
}

/** Equivalente a POST /recipes — ingredientes + presupuesto → recetas. */
export async function queryRecipes(input: RecipesQuery): Promise<{
  recipes: Recipe[];
  source: "supabase" | "demo";
}> {
  const budget = input.budget ?? Number.POSITIVE_INFINITY;
  const tokens = (input.ingredients ?? [])
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const supabase = getSupabaseBrowser();
  if (supabase && isSupabaseConfigured()) {
    let q = supabase.from("recipes").select("*").order("cost", { ascending: true });
    if (Number.isFinite(budget)) {
      q = q.lte("cost", budget);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const recipes = (data ?? [])
      .map(mapRecipeRow)
      .map((r) => ({ recipe: r, hits: scoreRecipe(r, tokens) }))
      .sort((a, b) => b.hits - a.hits || a.recipe.cost - b.recipe.cost)
      .map((x) => x.recipe);
    return { recipes, source: "supabase" };
  }

  const recipes = demoAsRecipes()
    .filter((r) => r.cost <= budget)
    .map((r) => ({ recipe: r, hits: scoreRecipe(r, tokens) }))
    .sort((a, b) => b.hits - a.hits || a.recipe.cost - b.recipe.cost)
    .map((x) => x.recipe);

  return { recipes, source: "demo" };
}
