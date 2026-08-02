import type { Env, Recipe } from "./types";

type AiPrompt = {
  ingredients: string[];
  budget: number;
  output: "recipes";
  preferences?: string;
};

function resolveProvider(env: Env): { url: string; apiKey: string; model: string } | null {
  if (env.GROQ_API_KEY?.trim()) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: env.GROQ_API_KEY.trim(),
      model: env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
    };
  }
  if (env.OPENAI_API_KEY?.trim()) {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      apiKey: env.OPENAI_API_KEY.trim(),
      model: env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    };
  }
  return null;
}

const SYSTEM = `Eres el chef de "Mi Menú Smart" (Chile). Generas recetas realistas, económicas y en español.
Responde SOLO JSON válido (sin markdown) con esta forma:
{"recipes":[{"name":"...","ingredients":["..."],"steps":["paso 1"],"cost":1234,"difficulty":"Fácil|Media|Chef","time":30,"photo_keyword":"baked-potato"}]}
- cost en CLP (número entero), siempre <= presupuesto indicado.
- steps: 4 a 8 instrucciones claras.
- photo_keyword OBLIGATORIO: término en inglés ultra específico del plato (kebab-case, ej. "tomato-soup", "chicken-rice").
- Usa preferentemente los ingredientes dados; puedes añadir básicos (sal, aceite, cebolla).
- Máximo 5 recetas.
- No inventes marcas ni precios absurdos.`;

const SYSTEM_LEARN = `Eres el chef de "Mi Menú Smart" (Chile). Generas UNA o pocas recetas básicas con los ingredientes clave dados.
Responde SOLO JSON válido:
{"recipes":[{"name":"...","ingredients":["..."],"steps":["..."],"cost":3500,"difficulty":"Fácil|Media|Chef","time":25,"photo_keyword":"baked-potato"}]}
REGLAS ESTRICTAS:
- photo_keyword OBLIGATORIO en inglés, kebab-case, ultra específico del plato (ej. "baked-potato", "tomato-soup", "scrambled-eggs-tomato").
- steps: array de 4-8 instrucciones en español.
- ingredients: usa los ingredientes clave recibidos (puedes sumar sal/aceite/agua).
- cost: estimado CLP realista Chile.
- Máximo 3 recetas.
- Sin markdown.`;

function parseDifficulty(raw: unknown): string {
  const d = String(raw ?? "Fácil");
  if (d.includes("Chef")) return "Chef";
  if (d.toLowerCase().includes("media") || d.toLowerCase().includes("medio")) return "Media";
  return "Fácil";
}

function parseAiRecipes(
  parsed: { recipes?: unknown[] },
  opts: { budget?: number; requireCost: boolean },
): Recipe[] {
  const recipes: Recipe[] = [];
  for (const item of parsed.recipes ?? []) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const name = String(r.name ?? "").trim();
    const time = Number(r.time);
    const cost = Number(r.cost);
    const ingredients = Array.isArray(r.ingredients)
      ? r.ingredients.map(String)
      : [];
    const steps = Array.isArray(r.steps)
      ? r.steps.map((s) => String(s).trim()).filter(Boolean)
      : Array.isArray(r.instructions)
        ? r.instructions.map((s) => String(s).trim()).filter(Boolean)
        : [];
    let photo_keyword = String(r.photo_keyword ?? r.photoKeyword ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    if (!name || !ingredients.length || !Number.isFinite(time) || time <= 0) continue;
    if (opts.requireCost) {
      if (!Number.isFinite(cost) || cost <= 0) continue;
      if (opts.budget != null && cost > opts.budget) continue;
    }
    if (!photo_keyword) {
      photo_keyword = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "homemade-dish";
    }
    recipes.push({
      name,
      ingredients,
      cost: Number.isFinite(cost) && cost > 0 ? Math.round(cost) : 2500,
      difficulty: parseDifficulty(r.difficulty),
      time: Math.round(time),
      steps: steps.length
        ? steps
        : ["Preparar ingredientes.", "Cocinar según gusto.", "Servir caliente."],
      photo_keyword,
    });
  }
  return recipes;
}

async function chatJson(
  env: Env,
  system: string,
  user: string,
): Promise<{ recipes?: unknown[] }> {
  const provider = resolveProvider(env);
  if (!provider) {
    throw new Error("Falta GROQ_API_KEY u OPENAI_API_KEY en el Worker");
  }

  const res = await fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`AI error ${res.status}: ${await res.text()}`);
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = payload.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(raw) as { recipes?: unknown[] };
  } catch {
    throw new Error("La IA no devolvió JSON válido");
  }
}

export async function generateRecipesWithAi(
  env: Env,
  input: AiPrompt,
): Promise<Recipe[]> {
  const parsed = await chatJson(
    env,
    SYSTEM,
    `Genera recetas usando los ingredientes disponibles y ajustadas al presupuesto indicado. ` +
      `Devuelve nombre, ingredientes, steps, costo estimado, dificultad, tiempo y photo_keyword.\n` +
      `Input JSON:\n${JSON.stringify({
        ingredients: input.ingredients,
        budget: input.budget,
        output: "recipes",
        preferences: input.preferences || undefined,
      })}`,
  );
  return parseAiRecipes(parsed, { budget: input.budget, requireCost: true }).slice(0, 5);
}

/** Generación con photo_keyword obligatorio (aprendizaje / despensa). */
export async function generateLearningRecipesWithAi(
  env: Env,
  ingredients: string[],
  budget?: number,
): Promise<Recipe[]> {
  const parsed = await chatJson(
    env,
    SYSTEM_LEARN,
    `Genera recetas con estos ingredientes clave limpios (ya sin adjetivos):\n` +
      JSON.stringify({
        ingredients,
        budget: budget ?? 8000,
        output: "recipes",
        require: ["photo_keyword", "steps", "cost"],
      }),
  );
  return parseAiRecipes(parsed, {
    budget: budget ?? 50_000,
    requireCost: true,
  }).slice(0, 3);
}

/** @deprecated usar generateLearningRecipesWithAi */
export async function generatePantryRecipesWithAi(
  env: Env,
  ingredients: string[],
): Promise<Recipe[]> {
  return generateLearningRecipesWithAi(env, ingredients);
}
