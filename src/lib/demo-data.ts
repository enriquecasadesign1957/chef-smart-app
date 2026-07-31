/** Demo data — Chef Smart (sin backend aún). */

export type Difficulty = "Fácil" | "Media" | "Chef";

export type Recipe = {
  id: string;
  name: string;
  costClp: number;
  minutes: number;
  difficulty: Difficulty;
  tags: string[];
  ingredients: string[];
};

export type GroceryCategory =
  | "Verduras"
  | "Proteínas"
  | "Abarrotes"
  | "Lácteos"
  | "Otros";

export type GroceryItem = {
  id: string;
  name: string;
  category: GroceryCategory;
  estimatedClp: number;
};

export const DEMO_RECIPES: Recipe[] = [
  {
    id: "lentejas",
    name: "Guiso de lentejas",
    costClp: 3200,
    minutes: 40,
    difficulty: "Fácil",
    tags: ["batch", "proteína"],
    ingredients: ["lentejas", "zanahoria", "cebolla", "ajo"],
  },
  {
    id: "pollo-limon",
    name: "Pollo al limón con arroz",
    costClp: 5400,
    minutes: 35,
    difficulty: "Fácil",
    tags: ["familiar"],
    ingredients: ["pollo", "limón", "arroz", "ajo"],
  },
  {
    id: "pasta-tomate",
    name: "Pasta con salsa de tomate",
    costClp: 2800,
    minutes: 25,
    difficulty: "Fácil",
    tags: ["rápido"],
    ingredients: ["fideos", "tomate", "ajo", "aceite"],
  },
  {
    id: "omelette",
    name: "Omelette de verduras",
    costClp: 2100,
    minutes: 15,
    difficulty: "Fácil",
    tags: ["desayuno", "rápido"],
    ingredients: ["huevos", "espinaca", "queso"],
  },
  {
    id: "salmon",
    name: "Salmón con ensalada",
    costClp: 8900,
    minutes: 30,
    difficulty: "Media",
    tags: ["premium"],
    ingredients: ["salmón", "lechuga", "limón", "aceite"],
  },
  {
    id: "curry",
    name: "Curry de garbanzos",
    costClp: 3600,
    minutes: 45,
    difficulty: "Media",
    tags: ["vegetariano"],
    ingredients: ["garbanzos", "leche de coco", "curry", "arroz"],
  },
];

export const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export const DEMO_GROCERY: GroceryItem[] = [
  { id: "1", name: "Lentejas 1 kg", category: "Abarrotes", estimatedClp: 1800 },
  { id: "2", name: "Pollo entero", category: "Proteínas", estimatedClp: 4500 },
  { id: "3", name: "Zanahorias 1 kg", category: "Verduras", estimatedClp: 990 },
  { id: "4", name: "Huevos docena", category: "Proteínas", estimatedClp: 2800 },
  { id: "5", name: "Queso rallado", category: "Lácteos", estimatedClp: 2200 },
  { id: "6", name: "Arroz 1 kg", category: "Abarrotes", estimatedClp: 1500 },
  { id: "7", name: "Espinaca bolsa", category: "Verduras", estimatedClp: 1290 },
  { id: "8", name: "Aceite vegetal", category: "Abarrotes", estimatedClp: 2500 },
];

export function formatClp(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}

export function suggestRecipes(budget: number, pantry: string[]): Recipe[] {
  const tokens = pantry
    .join(" ")
    .toLowerCase()
    .split(/[\s,;]+/)
    .filter(Boolean);

  return DEMO_RECIPES.filter((r) => r.costClp <= budget)
    .map((r) => {
      const hits = r.ingredients.filter((ing) =>
        tokens.some((t) => ing.includes(t) || t.includes(ing)),
      ).length;
      return { recipe: r, hits };
    })
    .sort((a, b) => b.hits - a.hits || a.recipe.costClp - b.recipe.costClp)
    .map((x) => x.recipe);
}

export function buildWeekPlan(budgetTotal: number): { day: string; recipe: Recipe }[] {
  const daily = Math.max(1500, Math.floor(budgetTotal / 7));
  const pool = DEMO_RECIPES.filter((r) => r.costClp <= daily * 1.35);
  const source = pool.length ? pool : DEMO_RECIPES;
  return WEEK_DAYS.map((day, i) => ({
    day,
    recipe: source[i % source.length],
  }));
}
