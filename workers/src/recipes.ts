import { generatePantryRecipesWithAi, generateRecipesWithAi } from "./ai";
import { insertRecipes, listRecipesByBudget } from "./supabase";
import {
  badRequest,
  json,
  type Env,
  type PantryRecipe,
  type Recipe,
} from "./types";

function score(recipe: Recipe, tokens: string[]): number {
  if (!tokens.length) return 0;
  return recipe.ingredients.filter((ing) =>
    tokens.some((t) => ing.toLowerCase().includes(t) || t.includes(ing.toLowerCase())),
  ).length;
}

function parseIngredientList(raw: string): string[] {
  return raw
    .split(/[,;|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toPantryRecipe(r: Recipe): PantryRecipe {
  return {
    id: r.id,
    name: r.name,
    ingredients: r.ingredients,
    steps:
      r.steps?.length
        ? r.steps
        : [
            "Reúne y lava los ingredientes.",
            "Prepara según la técnica de la receta.",
            "Ajusta sal y cocción al gusto.",
            "Sirve de inmediato.",
          ],
    difficulty: r.difficulty,
    time: r.time,
  };
}

/** GET /recipes?ingredients=huevos,tomate — Modo Despensa (sin precios). */
export async function handlePantryRecipes(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const ingredients = parseIngredientList(url.searchParams.get("ingredients") ?? "");
  if (!ingredients.length) {
    return badRequest("ingredients requerido (ej: ?ingredients=huevos,tomate,cebolla)");
  }

  const tokens = ingredients.map((t) => t.toLowerCase());
  let aiRecipes: Recipe[] = [];
  let aiError: string | undefined;

  try {
    aiRecipes = await generatePantryRecipesWithAi(env, ingredients);
  } catch (e) {
    aiError = e instanceof Error ? e.message : "AI falló";
  }

  let dbRecipes: Recipe[] = [];
  try {
    dbRecipes = await listRecipesByBudget(env, 1_000_000);
  } catch {
    /* si falla Supabase y hay AI, seguimos */
  }

  const merged = new Map<string, Recipe>();
  for (const r of [...aiRecipes, ...dbRecipes]) {
    const key = r.id ?? r.name.toLowerCase();
    if (!merged.has(key)) merged.set(key, r);
  }

  const recipes = [...merged.values()]
    .map((r) => ({ recipe: r, hits: score(r, tokens) }))
    .filter((x) => x.hits > 0 || aiRecipes.some((a) => a.name === x.recipe.name))
    .sort((a, b) => b.hits - a.hits || a.recipe.time - b.recipe.time)
    .slice(0, 8)
    .map((x) => toPantryRecipe(x.recipe));

  if (!recipes.length && aiError) {
    return json({ error: aiError, recipes: [] }, 502);
  }

  return json({
    recipes,
    meta: {
      app: env.APP_NAME ?? "Mi Menú Smart",
      mode: "pantry",
      generated: aiRecipes.length,
      fromDb: dbRecipes.length,
      aiError,
      ingredients,
    },
  });
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
