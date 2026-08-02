export type Env = {
  APP_NAME?: string;
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_WHATSAPP_FROM?: string;
};

export type Recipe = {
  id?: string;
  name: string;
  ingredients: string[];
  cost: number;
  difficulty: string;
  time: number;
  steps?: string[];
};

/** Respuesta pública del Modo Despensa (sin costo). */
export type PantryRecipe = {
  id?: string;
  name: string;
  ingredients: string[];
  steps: string[];
  difficulty: string;
  time: number;
};

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS },
  });
}

export function badRequest(message: string): Response {
  return json({ error: message }, 400);
}
