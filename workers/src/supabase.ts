import type { Env, Recipe } from "./types";

export async function supabaseFetch(
  env: Env,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!env.SUPABASE_URL?.trim()) {
    throw new Error("Falta SUPABASE_URL en el Worker (wrangler secret put SUPABASE_URL)");
  }
  if (!env.SUPABASE_SECRET_KEY?.trim()) {
    throw new Error(
      "Falta SUPABASE_SECRET_KEY en el Worker (wrangler secret put SUPABASE_SECRET_KEY)",
    );
  }
  const url = `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1${path}`;
  const headers = new Headers(init.headers);
  headers.set("apikey", env.SUPABASE_SECRET_KEY);
  headers.set("Authorization", `Bearer ${env.SUPABASE_SECRET_KEY}`);
  headers.set("Content-Type", "application/json");
  return fetch(url, { ...init, headers });
}

export function mapRecipeRow(row: Record<string, unknown>): Recipe {
  const ingredients = Array.isArray(row.ingredients)
    ? row.ingredients.map(String)
    : [];
  const steps = Array.isArray(row.steps) ? row.steps.map(String) : [];
  return {
    id: String(row.id),
    name: String(row.name),
    ingredients,
    cost: Number(row.cost),
    difficulty: String(row.difficulty),
    time: Number(row.time),
    steps,
    photo_keyword: row.photo_keyword ? String(row.photo_keyword) : undefined,
    ingredients_key: row.ingredients_key ? String(row.ingredients_key) : undefined,
  };
}

export async function listRecipesByBudget(env: Env, budget: number): Promise<Recipe[]> {
  const res = await supabaseFetch(
    env,
    `/recipes?select=*&cost=lte.${budget}&order=cost.asc`,
  );
  if (!res.ok) {
    throw new Error(`Supabase recipes: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows.map(mapRecipeRow);
}

/** Caché de aprendizaje: match exacto por ingredients_key. */
export async function findRecipesByIngredientsKey(
  env: Env,
  key: string,
): Promise<Recipe[]> {
  if (!key) return [];
  const encoded = encodeURIComponent(key);
  const res = await supabaseFetch(
    env,
    `/recipes?select=*&ingredients_key=eq.${encoded}&order=created_at.desc`,
  );
  if (!res.ok) {
    throw new Error(`Supabase cache recipes: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows.map(mapRecipeRow);
}

export async function insertRecipes(env: Env, recipes: Recipe[]): Promise<Recipe[]> {
  if (!recipes.length) return [];
  const body = recipes.map((r) => ({
    name: r.name,
    ingredients: r.ingredients,
    cost: r.cost,
    difficulty: r.difficulty,
    time: r.time,
    steps: r.steps ?? [],
    photo_keyword: r.photo_keyword ?? null,
    ingredients_key: r.ingredients_key ?? null,
  }));
  const res = await supabaseFetch(env, "/recipes", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Supabase insert recipes: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows.map(mapRecipeRow);
}

export async function replaceWeeklyPlan(
  env: Env,
  userId: string,
  slots: {
    day: string;
    meal_type: string;
    recipe_id: string;
    budget: number;
  }[],
): Promise<void> {
  const del = await supabaseFetch(env, `/weekly_plans?user_id=eq.${userId}`, {
    method: "DELETE",
  });
  if (!del.ok) {
    throw new Error(`Supabase delete plans: ${del.status} ${await del.text()}`);
  }
  if (!slots.length) return;
  const ins = await supabaseFetch(env, "/weekly_plans", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(slots.map((s) => ({ ...s, user_id: userId }))),
  });
  if (!ins.ok) {
    throw new Error(`Supabase insert plans: ${ins.status} ${await ins.text()}`);
  }
}
