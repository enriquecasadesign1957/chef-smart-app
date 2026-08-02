import { generateLearningRecipesWithAi, generateRecipesWithAi } from "./ai";
import { cleanAndSortIngredients, ingredientsKey } from "./ingredients";
import {
  findRecipesByIngredientsKey,
  insertRecipes,
  listRecipesByBudget,
} from "./supabase";
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
    photo_keyword: r.photo_keyword,
  };
}

function withLearningKey(recipes: Recipe[], key: string, cleaned: string[]): Recipe[] {
  return recipes.map((r) => ({
    ...r,
    ingredients: r.ingredients.length ? r.ingredients : cleaned,
    ingredients_key: key,
  }));
}

/**
 * Flujo aprendizaje:
 * 1) limpia ingredientes 2) caché Supabase 3) Groq 4) guarda 5) responde
 */
async function learnRecipes(
  env: Env,
  rawIngredients: string[],
  opts?: { budget?: number },
): Promise<{
  recipes: Recipe[];
  cleaned: string[];
  key: string;
  source: "cache" | "groq";
  aiError?: string;
}> {
  const cleaned = cleanAndSortIngredients(rawIngredients);
  const key = ingredientsKey(cleaned);
  if (!cleaned.length) {
    return { recipes: [], cleaned, key, source: "cache" };
  }

  try {
    const cached = await findRecipesByIngredientsKey(env, key);
    if (cached.length) {
      return { recipes: cached, cleaned, key, source: "cache" };
    }
  } catch {
    /* si falla caché, seguimos a Groq */
  }

  try {
    let generated = await generateLearningRecipesWithAi(env, cleaned, opts?.budget);
    generated = withLearningKey(generated, key, cleaned);
    if (generated.length) {
      try {
        generated = await insertRecipes(env, generated);
      } catch {
        /* devolver AI aunque no se persista (migración pendiente) */
      }
    }
    return { recipes: generated, cleaned, key, source: "groq" };
  } catch (e) {
    return {
      recipes: [],
      cleaned,
      key,
      source: "groq",
      aiError: e instanceof Error ? e.message : "AI falló",
    };
  }
}

/** GET /recipes?ingredients=… — Modo Despensa + aprendizaje */
export async function handlePantryRecipes(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const raw = parseIngredientList(url.searchParams.get("ingredients") ?? "");
  if (!raw.length) {
    return badRequest("ingredients requerido (ej: ?ingredients=huevos,tomate,cebolla)");
  }

  const learned = await learnRecipes(env, raw);
  const recipes = learned.recipes.map(toPantryRecipe);

  if (!recipes.length && learned.aiError) {
    return json(
      {
        error: learned.aiError,
        recipes: [],
        meta: {
          app: env.APP_NAME ?? "Mi Menú Smart",
          mode: "pantry",
          source: learned.source,
          ingredients: learned.cleaned,
          ingredients_key: learned.key,
        },
      },
      502,
    );
  }

  return json({
    recipes,
    meta: {
      app: env.APP_NAME ?? "Mi Menú Smart",
      mode: "pantry",
      source: learned.source,
      cached: learned.source === "cache",
      generated: learned.source === "groq" ? learned.recipes.length : 0,
      ingredients: learned.cleaned,
      ingredients_key: learned.key,
      aiError: learned.aiError,
    },
  });
}

/** POST /recipes — presupuesto + aprendizaje (caché → Groq → Supabase) */
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
  const rawIngredients = (body.ingredients ?? []).map((s) => String(s).trim()).filter(Boolean);
  const budget = Number(body.budget);
  if (!Number.isFinite(budget) || budget <= 0) {
    return badRequest("budget debe ser un número > 0");
  }

  const cleaned = cleanAndSortIngredients(rawIngredients);
  const key = ingredientsKey(cleaned);
  const wantGenerate = body.generate !== false;

  let learnedRecipes: Recipe[] = [];
  let source: "cache" | "groq" | "none" = "none";
  let aiError: string | undefined;

  if (wantGenerate && cleaned.length) {
    const learned = await learnRecipes(env, cleaned, { budget });
    learnedRecipes = learned.recipes.filter((r) => r.cost <= budget);
    source = learned.source;
    aiError = learned.aiError;

    // Si hay preferencias extra y vino de caché vacío de matices, opcionalmente enriquecer
    if (!learnedRecipes.length && preferences && source !== "cache") {
      try {
        let extra = await generateRecipesWithAi(env, {
          ingredients: cleaned,
          budget,
          output: "recipes",
          preferences,
        });
        extra = withLearningKey(extra, key, cleaned);
        if (body.persist !== false && extra.length) {
          try {
            extra = await insertRecipes(env, extra);
          } catch {
            /* ignore */
          }
        }
        learnedRecipes = extra;
        source = "groq";
      } catch (e) {
        aiError = e instanceof Error ? e.message : "AI falló";
      }
    }
  }

  let dbRecipes: Recipe[] = [];
  try {
    dbRecipes = await listRecipesByBudget(env, budget);
  } catch (e) {
    if (!learnedRecipes.length) {
      return json(
        { error: e instanceof Error ? e.message : "Error Supabase", aiError },
        502,
      );
    }
  }

  const tokens = cleaned;
  const merged = new Map<string, Recipe>();
  for (const r of [...learnedRecipes, ...dbRecipes]) {
    const mapKey = r.id ?? r.name.toLowerCase();
    if (!merged.has(mapKey)) merged.set(mapKey, r);
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
      source,
      cached: source === "cache",
      generated: source === "groq" ? learnedRecipes.length : 0,
      fromDb: dbRecipes.length,
      aiError,
      prompt: {
        ingredients: cleaned,
        ingredients_key: key,
        preferences: preferences || undefined,
        budget,
        output: body.output ?? "recipes",
      },
    },
  });
}
