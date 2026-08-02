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
{"recipes":[{"name":"...","ingredients":["..."],"cost":1234,"difficulty":"Fácil|Media|Chef","time":30}]}
- cost en CLP (número entero), siempre <= presupuesto indicado.
- Usa preferentemente los ingredientes dados; puedes añadir básicos baratos (sal, aceite, cebolla).
- Máximo 5 recetas.
- No inventes marcas ni precios absurdos.`;

const SYSTEM_PANTRY = `Eres el chef de "Mi Menú Smart" (Chile), modo despensa/refrigerador.
Generas recetas para cocinar YA con lo que la persona tiene en casa. Español claro.
Responde SOLO JSON válido (sin markdown):
{"recipes":[{"name":"...","ingredients":["..."],"steps":["paso 1","paso 2"],"difficulty":"Fácil|Media|Chef","time":25}]}
- Prioriza los ingredientes listados; puedes sumar básicos (sal, aceite, agua).
- steps: 4 a 8 pasos concretos y accionables.
- NO menciones precios, costos ni presupuestos.
- Máximo 5 recetas.
- time en minutos.`;

export async function generateRecipesWithAi(
  env: Env,
  input: AiPrompt,
): Promise<Recipe[]> {
  const provider = resolveProvider(env);
  if (!provider) {
    throw new Error("Falta GROQ_API_KEY u OPENAI_API_KEY en el Worker");
  }

  const userPayload = {
    ingredients: input.ingredients,
    budget: input.budget,
    output: "recipes" as const,
    preferences: input.preferences || undefined,
  };

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
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content:
            `Genera recetas usando los ingredientes disponibles y ajustadas al presupuesto indicado. ` +
            `Devuelve nombre, ingredientes, costo estimado, dificultad y tiempo.\n` +
            `Input JSON:\n${JSON.stringify(userPayload)}`,
        },
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
  let parsed: { recipes?: unknown[] };
  try {
    parsed = JSON.parse(raw) as { recipes?: unknown[] };
  } catch {
    throw new Error("La IA no devolvió JSON válido");
  }

  const recipes: Recipe[] = [];
  for (const item of parsed.recipes ?? []) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const name = String(r.name ?? "").trim();
    const cost = Number(r.cost);
    const time = Number(r.time);
    const ingredients = Array.isArray(r.ingredients)
      ? r.ingredients.map(String)
      : [];
    if (!name || !Number.isFinite(cost) || cost <= 0 || cost > input.budget) continue;
    if (!Number.isFinite(time) || time <= 0) continue;
    recipes.push({
      name,
      ingredients,
      cost: Math.round(cost),
      difficulty: String(r.difficulty ?? "Fácil"),
      time: Math.round(time),
    });
  }
  return recipes.slice(0, 5);
}

/** Modo Despensa: sin presupuesto; incluye pasos de preparación. */
export async function generatePantryRecipesWithAi(
  env: Env,
  ingredients: string[],
): Promise<Recipe[]> {
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
      temperature: 0.45,
      messages: [
        { role: "system", content: SYSTEM_PANTRY },
        {
          role: "user",
          content:
            `Cocinar con lo que ya tengo. Ingredientes en despensa/refrigerador:\n` +
            JSON.stringify({ ingredients, output: "recipes" }),
        },
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
  let parsed: { recipes?: unknown[] };
  try {
    parsed = JSON.parse(raw) as { recipes?: unknown[] };
  } catch {
    throw new Error("La IA no devolvió JSON válido");
  }

  const recipes: Recipe[] = [];
  for (const item of parsed.recipes ?? []) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const name = String(r.name ?? "").trim();
    const time = Number(r.time);
    const ingredientsList = Array.isArray(r.ingredients)
      ? r.ingredients.map(String)
      : [];
    const steps = Array.isArray(r.steps)
      ? r.steps.map((s) => String(s).trim()).filter(Boolean)
      : [];
    if (!name || !Number.isFinite(time) || time <= 0 || !ingredientsList.length) continue;
    recipes.push({
      name,
      ingredients: ingredientsList,
      cost: 0,
      difficulty: String(r.difficulty ?? "Fácil"),
      time: Math.round(time),
      steps: steps.length
        ? steps
        : ["Preparar ingredientes.", "Cocinar según gusto.", "Servir caliente."],
    });
  }
  return recipes.slice(0, 5);
}
