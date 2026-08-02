export type PantryRecipe = {
  id?: string;
  name: string;
  ingredients: string[];
  steps: string[];
  difficulty: string;
  time: number;
};

function apiBase(): string | null {
  const base = process.env.NEXT_PUBLIC_MENU_API_URL?.trim();
  if (!base || base.includes("YOUR_")) return null;
  return base.replace(/\/$/, "");
}

function parseTokens(text: string): string[] {
  return text
    .split(/[,;|\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function demoPantry(ingredientsText: string): PantryRecipe[] {
  const tokens = parseTokens(ingredientsText);
  const demos: PantryRecipe[] = [
    {
      id: "demo-omelette",
      name: "Omelette de verduras",
      ingredients: ["huevos", "tomate", "cebolla", "sal", "aceite"],
      steps: [
        "Bate los huevos con una pizca de sal.",
        "Saltea cebolla y tomate picados en poco aceite.",
        "Vierte los huevos y cocina a fuego medio hasta cuajar.",
        "Dobla y sirve caliente.",
      ],
      difficulty: "Fácil",
      time: 15,
    },
    {
      id: "demo-huevos-tomate",
      name: "Huevos revueltos con tomate",
      ingredients: ["huevos", "tomate", "aceite", "sal"],
      steps: [
        "Pica el tomate en cubos pequeños.",
        "Calienta aceite y cocina el tomate 2 minutos.",
        "Agrega los huevos batidos y remueve hasta cremosos.",
        "Ajusta sal y sirve.",
      ],
      difficulty: "Fácil",
      time: 12,
    },
    {
      id: "demo-ensalada",
      name: "Ensalada fresca de tomate y cebolla",
      ingredients: ["tomate", "cebolla", "aceite", "sal"],
      steps: [
        "Corta tomate y cebolla en láminas finas.",
        "Mezcla en un bowl.",
        "Aliña con aceite y sal.",
        "Deja reposar 5 minutos y sirve.",
      ],
      difficulty: "Fácil",
      time: 10,
    },
  ];

  return demos
    .map((r) => ({
      recipe: r,
      hits: r.ingredients.filter((ing) =>
        tokens.some((t) => ing.includes(t) || t.includes(ing)),
      ).length,
    }))
    .filter((x) => x.hits > 0 || !tokens.length)
    .sort((a, b) => b.hits - a.hits)
    .map((x) => x.recipe);
}

/**
 * Modo Despensa: GET /recipes?ingredients=...
 * Sin presupuesto ni precios en la respuesta.
 */
export async function fetchPantryRecipes(ingredientsText: string): Promise<{
  recipes: PantryRecipe[];
  source: "worker" | "demo";
}> {
  const cleaned = ingredientsText
    .split(/[,;|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");

  const base = apiBase();
  if (base && cleaned) {
    try {
      const url = `${base}/recipes?ingredients=${encodeURIComponent(cleaned)}`;
      const res = await fetch(url, { method: "GET" });
      if (res.ok) {
        const data = (await res.json()) as { recipes?: PantryRecipe[] };
        const recipes = (data.recipes ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          ingredients: r.ingredients ?? [],
          steps: r.steps?.length
            ? r.steps
            : [
                "Reúne los ingredientes.",
                "Prepara y cocina al gusto.",
                "Sirve de inmediato.",
              ],
          difficulty: r.difficulty,
          time: r.time,
        }));
        return { recipes, source: "worker" };
      }
    } catch {
      /* fallback demo */
    }
  }

  return { recipes: demoPantry(ingredientsText), source: "demo" };
}
