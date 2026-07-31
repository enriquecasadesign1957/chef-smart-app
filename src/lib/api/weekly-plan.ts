import { buildWeekPlan, WEEK_DAYS } from "@/lib/demo-data";
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
  budget: number;
  ingredients?: string[];
  /** Si hay sesión Supabase Auth, se persiste en weekly_plans */
  persist?: boolean;
};

const MEALS: MealType[] = ["desayuno", "almuerzo", "cena"];

function pickRecipe(pool: Recipe[], index: number, maxCost: number): Recipe | null {
  const affordable = pool.filter((r) => r.cost <= maxCost);
  const source = affordable.length ? affordable : pool;
  if (!source.length) return null;
  return source[index % source.length];
}

/** Equivalente a POST /weekly-plan — genera menú y opcionalmente guarda. */
export async function generateWeeklyPlan(input: GenerateWeeklyPlanInput): Promise<{
  plan: WeeklyPlanSlot[];
  source: "supabase" | "demo";
  saved: boolean;
}> {
  const weekBudget = Math.max(0, input.budget);
  const perMeal = Math.max(1500, Math.floor(weekBudget / (7 * 3)));

  const { recipes, source } = await queryRecipes({
    ingredients: input.ingredients,
    budget: perMeal * 1.35,
  });

  let pool = recipes;
  if (!pool.length && source === "demo") {
    const fallback = buildWeekPlan(weekBudget).map(({ recipe }) => ({
      id: recipe.id,
      name: recipe.name,
      ingredients: recipe.ingredients,
      cost: recipe.costClp,
      difficulty: recipe.difficulty,
      time: recipe.minutes,
    }));
    pool = fallback;
  }

  const plan: WeeklyPlanSlot[] = [];
  let i = 0;
  for (const day of PLAN_DAYS) {
    for (const meal_type of MEALS) {
      const recipe = pickRecipe(pool, i++, perMeal);
      if (!recipe) continue;
      plan.push({ day, meal_type, recipe, budget: weekBudget });
    }
  }

  let saved = false;
  if (
    input.persist !== false &&
    source === "supabase" &&
    isSupabaseConfigured()
  ) {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (userId) {
        await supabase.from("weekly_plans").delete().eq("user_id", userId);
        const rows = plan.map((slot) => ({
          user_id: userId,
          day: slot.day,
          meal_type: slot.meal_type,
          recipe_id: slot.recipe.id,
          budget: slot.budget,
        }));
        const { error } = await supabase.from("weekly_plans").insert(rows);
        if (error) throw new Error(error.message);
        saved = true;
      }
    }
  }

  return { plan, source, saved };
}

export async function fetchMyWeeklyPlan(): Promise<
  (WeeklyPlanSlot & { id: string })[] | null
> {
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

/** @deprecated alias corto */
export const DAYS_SHORT = WEEK_DAYS;
