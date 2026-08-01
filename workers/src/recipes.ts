import { generateRecipesWithAi } from "./ai";
import { insertRecipes, listRecipesByBudget } from "./supabase";
import { badRequest, json, type Env, type Recipe } from "./types";

function score(recipe: Recipe, tokens: string[]): number {
  if (!tokens.length) return 0;
  return recipe.ingredients.filter((ing) =>
    tokens.some((t) => ing.toLowerCase().includes(t) || t.includes(ing.toLowerCase())),
  ).length;
}

/** POST /recipes — getRecipes(ingredients, budget) */
export async function handleGetRecipes(req: Request, env: Env): Promise<Response> {
  let body: {
    ingredients?: string[];
    preferences?: string;
    budget?: number;
    output?: string;
    generate?: boolean;
    persist?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return badRequest("JSON inválido");
  }

  const preferences = String(body.preferences ?? "").trim();
  const ingredients = (body.ingredients ?? []).map((s) => String(s).trim()).filter(Boolean);
  const budget = Number(body.budget);
  if (!Number.isFinite(budget) || budget <= 0) {
    return badRequest("budget debe ser un número > 0");
  }

  const wantGenerate = body.generate !== false;
  let aiRecipes: Recipe[] = [];
  let aiError: string | undefined;

  if (wantGenerate) {
    try {
      aiRecipes = await generateRecipesWithAi(env, {
        ingredients,
        budget,
        output: "recipes",
        preferences: preferences || undefined,
      });
      if (body.persist !== false && aiRecipes.length) {
        try {
          aiRecipes = await insertRecipes(env, aiRecipes);
        } catch {
          /* seguir con recetas AI sin id de BD */
        }
      }
    } catch (e) {
      aiError = e instanceof Error ? e.message : "AI falló";
    }
  }

  let dbRecipes: Recipe[] = [];
  try {
    dbRecipes = await listRecipesByBudget(env, budget);
  } catch (e) {
    if (!aiRecipes.length) {
      return json(
        { error: e instanceof Error ? e.message : "Error Supabase", aiError },
        502,
      );
    }
  }

  const tokens = ingredients.map((t) => t.toLowerCase());
  const merged = new Map<string, Recipe>();
  for (const r of [...aiRecipes, ...dbRecipes]) {
    const key = r.id ?? r.name.toLowerCase();
    if (!merged.has(key)) merged.set(key, r);
  }

  const recipes = [...merged.values()]
    .filter((r) => r.cost <= budget)
    .map((r) => ({ recipe: r, hits: score(r, tokens) }))
    .sort((a, b) => b.hits - a.hits || a.recipe.cost - b.recipe.cost)
    .map((x) => x.recipe);

  return json({
    recipes,
    meta: {
      app: env.APP_NAME ?? "Mi Menú Smart",
      generated: aiRecipes.length,
      fromDb: dbRecipes.length,
      aiError,
      prompt: {
        ingredients,
        preferences: preferences || undefined,
        budget,
        output: body.output ?? "recipes",
      },
    },
  });
}
