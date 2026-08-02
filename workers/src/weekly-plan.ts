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

const DEFAULT_MEALS = ["almuerzo", "cena"] as const;

function pickForDay(
  pool: Recipe[],
  startIndex: number,
  dailyBudget: number,
  meals: string[],
): Recipe[] | null {
  const affordable = pool.filter((r) => r.cost <= dailyBudget).sort((a, b) => a.cost - b.cost);
  if (affordable.length < meals.length) return null;

  for (let offset = 0; offset < affordable.length; offset++) {
    const picks: Recipe[] = [];
    let sum = 0;
    let ok = true;
    for (let m = 0; m < meals.length; m++) {
      const recipe = affordable[(startIndex + offset + m * 3) % affordable.length];
      sum += recipe.cost;
      if (sum > dailyBudget) {
        ok = false;
        break;
      }
      picks.push(recipe);
    }
    if (ok) return picks;
  }

  // Fallback: platos más baratos distintos si hay suficientes
  const cheapest = [...affordable];
  const picks: Recipe[] = [];
  let sum = 0;
  for (let m = 0; m < meals.length; m++) {
    const recipe = cheapest[m % cheapest.length];
    if (sum + recipe.cost > dailyBudget) return null;
    picks.push(recipe);
    sum += recipe.cost;
  }
  return picks;
}

/** POST /weekly-plan — presupuesto diario → plan Lun–Dom (almuerzo + cena) */
export async function handleGenerateWeeklyPlan(req: Request, env: Env): Promise<Response> {
  let body: {
    ingredients?: string[];
    budget?: number;
    daily_budget?: number;
    meals?: string[];
    user_id?: string;
    recipient?: string;
    notify?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return badRequest("JSON inválido");
  }

  const dailyBudget = Number(body.daily_budget ?? body.budget);
  if (!Number.isFinite(dailyBudget) || dailyBudget <= 0) {
    return badRequest("daily_budget (o budget) debe ser un número > 0");
  }

  const meals =
    Array.isArray(body.meals) && body.meals.length
      ? body.meals.map(String)
      : [...DEFAULT_MEALS];

  const weekBudget = dailyBudget * DAYS.length;
  const perDishCap = Math.max(1500, Math.floor(dailyBudget / meals.length));

  const recipesRes = await handleGetRecipes(
    new Request(req.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients: body.ingredients ?? [],
        budget: perDishCap,
        generate: true,
        persist: true,
        preferences: "Plan semanal variado chile, almuerzo y cena, económico",
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

  const pool = (recipesJson.recipes ?? []).filter((r) => r.cost > 0);
  if (!pool.length) {
    return badRequest("No hay recetas para armar el plan");
  }

  const plan: {
    day: string;
    meal_type: string;
    recipe: Recipe;
    budget: number;
  }[] = [];

  let dayIndex = 0;
  for (const day of DAYS) {
    const picks = pickForDay(pool, dayIndex * meals.length, dailyBudget, meals);
    if (!picks) {
      return badRequest(
        `No se pudo armar ${day} dentro de ${dailyBudget} CLP (almuerzo + cena)`,
      );
    }
    picks.forEach((recipe, mi) => {
      plan.push({
        day,
        meal_type: meals[mi],
        recipe,
        budget: dailyBudget,
      });
    });
    dayIndex++;
  }

  const weekTotal = plan.reduce((s, slot) => s + slot.recipe.cost, 0);
  if (weekTotal > weekBudget) {
    return badRequest("El plan generado supera el presupuesto semanal");
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

  return json({
    plan,
    saved,
    whatsapp,
    meta: {
      app: env.APP_NAME ?? "Mi Menú Smart",
      daily_budget: dailyBudget,
      week_budget: weekBudget,
      week_total: weekTotal,
      meals,
      within_budget: weekTotal <= weekBudget,
    },
  });
}
