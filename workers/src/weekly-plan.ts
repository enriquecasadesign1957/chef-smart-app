import { handleGetRecipes } from "./recipes";
import { replaceWeeklyPlan } from "./supabase";
import { sendMenuReadyWhatsApp } from "./twilio";
import { badRequest, json, type Env, type Recipe } from "./types";

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

const MEALS = ["desayuno", "almuerzo", "cena"] as const;

/** POST /weekly-plan — generateWeeklyPlan + opcional WhatsApp */
export async function handleGenerateWeeklyPlan(req: Request, env: Env): Promise<Response> {
  let body: {
    ingredients?: string[];
    budget?: number;
    user_id?: string;
    recipient?: string;
    notify?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return badRequest("JSON inválido");
  }

  const budget = Number(body.budget);
  if (!Number.isFinite(budget) || budget <= 0) {
    return badRequest("budget debe ser un número > 0");
  }

  const recipesRes = await handleGetRecipes(
    new Request(req.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients: body.ingredients ?? [],
        budget: Math.max(1500, Math.floor(budget / 21)),
        generate: true,
        persist: true,
      }),
    }),
    env,
  );

  const recipesJson = (await recipesRes.json()) as {
    recipes?: Recipe[];
    error?: string;
  };
  if (!recipesRes.ok) {
    return json(recipesJson, recipesRes.status);
  }

  const pool = recipesJson.recipes ?? [];
  if (!pool.length) {
    return badRequest("No hay recetas para armar el plan");
  }

  const perMeal = Math.max(1500, Math.floor(budget / 21));
  const plan: {
    day: string;
    meal_type: string;
    recipe: Recipe;
    budget: number;
  }[] = [];

  let i = 0;
  for (const day of DAYS) {
    for (const meal_type of MEALS) {
      const affordable = pool.filter((r) => r.cost <= perMeal * 1.35);
      const source = affordable.length ? affordable : pool;
      const recipe = source[i++ % source.length];
      plan.push({ day, meal_type, recipe, budget });
    }
  }

  let saved = false;
  if (body.user_id?.trim()) {
    const slots = plan
      .filter((s) => s.recipe.id)
      .map((s) => ({
        day: s.day,
        meal_type: s.meal_type,
        recipe_id: s.recipe.id!,
        budget: s.budget,
      }));
    if (slots.length) {
      await replaceWeeklyPlan(env, body.user_id.trim(), slots);
      saved = true;
    }
  }

  let whatsapp: { ok: boolean; sid?: string; error?: string } | undefined;
  if (body.notify && body.recipient) {
    whatsapp = await sendMenuReadyWhatsApp(env, body.recipient);
  }

  return json({ plan, saved, whatsapp, meta: { app: env.APP_NAME ?? "Mi Menú Smart" } });
}
