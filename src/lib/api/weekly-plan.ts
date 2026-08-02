import { buildWeekPlan } from "@/lib/demo-data";
import { queryRecipes } from "@/lib/api/recipes";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { mapRecipeRow, type Recipe } from "@/lib/supabase/types";

export const PLAN_DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

export type MealType = "desayuno" | "almuerzo" | "cena";

export type WeeklyPlanSlot = {
  day: (typeof PLAN_DAYS)[number];
  meal_type: MealType;
  recipe: Recipe;
  budget: number;
};

export type GenerateWeeklyPlanInput = {
  /** Presupuesto diario CLP (almuerzo + cena). */
  dailyBudget: number;
  ingredients?: string[];
  persist?: boolean;
  recipient?: string;
  notify?: boolean;
  userId?: string;
};

const PLAN_MEALS: MealType[] = ["almuerzo", "cena"];

function apiBase(): string | null {
  const base = process.env.NEXT_PUBLIC_MENU_API_URL?.trim();
  if (!base || base.includes("YOUR_")) return null;
  return base.replace(/\/$/, "");
}

function pickDayMeals(pool: Recipe[], dayIndex: number, dailyBudget: number): Recipe[] | null {
  const affordable = pool
    .filter((r) => r.cost <= dailyBudget)
    .sort((a, b) => a.cost - b.cost);
  if (!affordable.length) return null;

  for (let offset = 0; offset < affordable.length; offset++) {
    const a = affordable[(dayIndex * 2 + offset) % affordable.length];
    const b = affordable[(dayIndex * 2 + offset + 3) % affordable.length];
    if (a.cost + b.cost <= dailyBudget) return [a, b];
  }

  const cheap = affordable[0];
  if (cheap.cost * 2 <= dailyBudget) return [cheap, cheap];
  return null;
}

async function persistPlan(
  plan: WeeklyPlanSlot[],
  userId?: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  const { data: userData } = await supabase.auth.getUser();
  const uid = userId ?? userData.user?.id;
  if (!uid) return false;

  await supabase.from("weekly_plans").delete().eq("user_id", uid);
  const rows = plan
    .filter((s) => s.recipe.id)
    .map((slot) => ({
      user_id: uid,
      day: slot.day,
      meal_type: slot.meal_type,
      recipe_id: slot.recipe.id!,
      budget: slot.budget,
    }));
  if (!rows.length) return false;
  const { error } = await supabase.from("weekly_plans").insert(rows);
  if (error) throw new Error(error.message);
  return true;
}

/** POST /weekly-plan con presupuesto diario (fallback local). */
export async function generateWeeklyPlan(input: GenerateWeeklyPlanInput): Promise<{
  plan: WeeklyPlanSlot[];
  source: "worker" | "supabase" | "demo";
  saved: boolean;
  weekTotal: number;
  weekBudget: number;
  withinBudget: boolean;
  whatsapp?: { ok: boolean; error?: string };
}> {
  const dailyBudget = Math.max(0, input.dailyBudget);
  const weekBudget = dailyBudget * PLAN_DAYS.length;
  const base = apiBase();

  if (base) {
    try {
      const res = await fetch(`${base}/weekly-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: input.ingredients ?? [],
          daily_budget: dailyBudget,
          budget: dailyBudget,
          meals: PLAN_MEALS,
          user_id: input.userId,
          recipient: input.recipient,
          notify: Boolean(input.notify && input.recipient),
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          plan?: WeeklyPlanSlot[];
          saved?: boolean;
          meta?: { week_total?: number; week_budget?: number; within_budget?: boolean };
          whatsapp?: { ok: boolean; error?: string };
        };
        let plan = data.plan ?? [];
        let saved = Boolean(data.saved);
        if (input.persist !== false && !saved) {
          try {
            saved = await persistPlan(plan, input.userId);
          } catch {
            /* sin sesión Supabase */
          }
        }
        const weekTotal =
          data.meta?.week_total ??
          plan.reduce((sum, slot) => sum + slot.recipe.cost, 0);
        return {
          plan,
          source: "worker",
          saved,
          weekTotal,
          weekBudget: data.meta?.week_budget ?? weekBudget,
          withinBudget: data.meta?.within_budget ?? weekTotal <= weekBudget,
          whatsapp: data.whatsapp,
        };
      }
    } catch {
      /* fallback */
    }
  }

  const perDish = Math.max(1500, Math.floor(dailyBudget / 2));
  const { recipes, source } = await queryRecipes({
    ingredients: input.ingredients,
    budget: perDish,
    generate: false,
  });

  let pool = recipes;
  if (!pool.length) {
    pool = buildWeekPlan(weekBudget).map(({ recipe }) => ({
      id: recipe.id,
      name: recipe.name,
      ingredients: recipe.ingredients,
      cost: recipe.costClp,
      difficulty: recipe.difficulty,
      time: recipe.minutes,
    }));
  }

  const plan: WeeklyPlanSlot[] = [];
  PLAN_DAYS.forEach((day, dayIndex) => {
    const picks = pickDayMeals(pool, dayIndex, dailyBudget);
    if (!picks) return;
    picks.forEach((recipe, mi) => {
      plan.push({
        day,
        meal_type: PLAN_MEALS[mi],
        recipe,
        budget: dailyBudget,
      });
    });
  });

  const weekTotal = plan.reduce((sum, slot) => sum + slot.recipe.cost, 0);
  let saved = false;
  if (input.persist !== false) {
    try {
      saved = await persistPlan(plan, input.userId);
    } catch {
      saved = false;
    }
  }

  return {
    plan,
    source: source === "demo" ? "demo" : "supabase",
    saved,
    weekTotal,
    weekBudget,
    withinBudget: weekTotal <= weekBudget,
  };
}

export async function saveWeeklyPlanToSupabase(
  plan: WeeklyPlanSlot[],
  userId?: string,
): Promise<boolean> {
  return persistPlan(plan, userId);
}

export async function fetchMyWeeklyPlan(): Promise<(WeeklyPlanSlot & { id: string })[] | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("weekly_plans")
    .select("id, day, meal_type, budget, recipe_id, recipes(*)")
    .eq("user_id", userData.user.id);

  if (error) throw new Error(error.message);

  type Joined = {
    id: string;
    day: string;
    meal_type: MealType;
    budget: number;
    recipes: Parameters<typeof mapRecipeRow>[0] | null;
  };

  return ((data ?? []) as unknown as Joined[])
    .filter((row) => row.recipes)
    .map((row) => ({
      id: row.id,
      day: row.day as WeeklyPlanSlot["day"],
      meal_type: row.meal_type,
      budget: Number(row.budget),
      recipe: mapRecipeRow(row.recipes!),
    }));
}
