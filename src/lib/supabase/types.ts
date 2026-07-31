export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type RecipeRow = {
  id: string;
  name: string;
  ingredients: Json;
  cost: number;
  difficulty: string;
  time: number;
  created_at?: string;
};

export type WeeklyPlanRow = {
  id: string;
  user_id: string;
  day: string;
  meal_type: "desayuno" | "almuerzo" | "cena";
  recipe_id: string;
  budget: number;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      recipes: {
        Row: RecipeRow;
        Insert: Omit<RecipeRow, "id" | "created_at"> & { id?: string };
        Update: Partial<RecipeRow>;
        Relationships: [];
      };
      weekly_plans: {
        Row: WeeklyPlanRow;
        Insert: Omit<WeeklyPlanRow, "id" | "created_at"> & { id?: string };
        Update: Partial<WeeklyPlanRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Recipe = {
  id: string;
  name: string;
  ingredients: string[];
  cost: number;
  difficulty: string;
  time: number;
};

export function mapRecipeRow(row: RecipeRow): Recipe {
  const ingredients = Array.isArray(row.ingredients)
    ? row.ingredients.map(String)
    : [];
  return {
    id: row.id,
    name: row.name,
    ingredients,
    cost: Number(row.cost),
    difficulty: row.difficulty,
    time: Number(row.time),
  };
}
