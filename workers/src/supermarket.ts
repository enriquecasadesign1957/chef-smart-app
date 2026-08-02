import { badRequest, json, type Env } from "./types";

type AiProvider = { url: string; apiKey: string; model: string };

function resolveProvider(env: Env): AiProvider | null {
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

export type SupermarketProduct = {
  id: string;
  name: string;
  category: "Verduras" | "Proteínas" | "Lácteos" | "Abarrotes" | "Otros";
  estimatedClp: number;
  url: string;
};

const SYSTEM = `Eres el asistente de compras de "Mi Menú Smart" (Chile), módulo Supermercado Smart.
Sugieres productos concretos para un supermercado chileno (ej. Santa Isabel, Lider, Jumbo).
Responde SOLO JSON válido:
{"store_name":"...","products":[{"name":"...","category":"Verduras|Proteínas|Lácteos|Abarrotes|Otros","estimatedClp":1234,"path":"/busqueda?q=..."}]}
- estimatedClp en CLP realistas Chile.
- La suma de estimatedClp debe ser <= presupuesto.
- Máximo 10 productos.
- path es una ruta o query de búsqueda relativa al sitio del súper (empieza con /).
- No inventes dominios distintos al del usuario.`;

function storeOrigin(storeUrl: string): { origin: string; host: string; name: string } {
  const u = new URL(storeUrl);
  const host = u.hostname.replace(/^www\./, "");
  const nameGuess = host.split(".")[0]?.replace(/-/g, " ") || "Supermercado";
  const name = nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1);
  return { origin: u.origin, host, name };
}

function withPartner(url: string, partner = "mimenusmart"): string {
  const u = new URL(url);
  u.searchParams.set("partner", partner);
  return u.toString();
}

function fallbackProducts(
  storeUrl: string,
  budget: number,
  items: string[],
): { store_name: string; products: SupermarketProduct[] } {
  const { origin, name } = storeOrigin(storeUrl);
  const seed = items.length
    ? items
    : ["tomate", "pollo", "leche", "arroz", "cebolla", "huevos", "queso", "aceite"];
  const categories = ["Verduras", "Proteínas", "Lácteos", "Abarrotes", "Otros"] as const;
  const prices = [990, 4500, 1290, 1500, 890, 2800, 2200, 2500];
  const products: SupermarketProduct[] = [];
  let sum = 0;
  for (let i = 0; i < seed.length && products.length < 8; i++) {
    const price = prices[i % prices.length];
    if (sum + price > budget) continue;
    const q = encodeURIComponent(seed[i]);
    const url = withPartner(`${origin}/busqueda?q=${q}`);
    products.push({
      id: `opt-${i}-${seed[i].toLowerCase().replace(/\s+/g, "-")}`,
      name: seed[i],
      category: categories[i % categories.length],
      estimatedClp: price,
      url,
    });
    sum += price;
  }
  return { store_name: name, products };
}

export async function optimizeSupermarketWithAi(
  env: Env,
  input: { storeUrl: string; budget: number; items?: string[] },
): Promise<{ store_name: string; products: SupermarketProduct[]; source: "ai" | "fallback" }> {
  const { origin, name } = storeOrigin(input.storeUrl);
  const provider = resolveProvider(env);

  if (!provider) {
    const fb = fallbackProducts(input.storeUrl, input.budget, input.items ?? []);
    return { ...fb, source: "fallback" };
  }

  const res = await fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.35,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            store_url: input.storeUrl,
            store_origin: origin,
            budget: input.budget,
            shopping_list: input.items ?? [],
            output: "supermarket_products",
          }),
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const fb = fallbackProducts(input.storeUrl, input.budget, input.items ?? []);
    return { ...fb, source: "fallback" };
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = payload.choices?.[0]?.message?.content ?? "{}";
  let parsed: {
    store_name?: string;
    products?: unknown[];
  };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    const fb = fallbackProducts(input.storeUrl, input.budget, input.items ?? []);
    return { ...fb, source: "fallback" };
  }

  const products: SupermarketProduct[] = [];
  let sum = 0;
  for (const [i, item] of (parsed.products ?? []).entries()) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const productName = String(r.name ?? "").trim();
    const estimatedClp = Math.round(Number(r.estimatedClp));
    const categoryRaw = String(r.category ?? "Otros");
    const category = (
      ["Verduras", "Proteínas", "Lácteos", "Abarrotes", "Otros"].includes(categoryRaw)
        ? categoryRaw
        : "Otros"
    ) as SupermarketProduct["category"];
    if (!productName || !Number.isFinite(estimatedClp) || estimatedClp <= 0) continue;
    if (sum + estimatedClp > input.budget) continue;

    let path = String(r.path ?? `/busqueda?q=${encodeURIComponent(productName)}`);
    if (!path.startsWith("/")) path = `/${path}`;
    const url = withPartner(`${origin}${path}`);

    products.push({
      id: `ai-${i}-${productName.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`,
      name: productName,
      category,
      estimatedClp,
      url,
    });
    sum += estimatedClp;
  }

  if (!products.length) {
    const fb = fallbackProducts(input.storeUrl, input.budget, input.items ?? []);
    return { ...fb, source: "fallback" };
  }

  return {
    store_name: String(parsed.store_name ?? name),
    products: products.slice(0, 10),
    source: "ai",
  };
}

/** POST /supermarket/optimize — { store_url, budget, items? } */
export async function handleOptimizeSupermarket(
  req: Request,
  env: Env,
): Promise<Response> {
  let body: {
    store_url?: string;
    url?: string;
    budget?: number;
    items?: string[];
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return badRequest("JSON inválido");
  }

  const storeUrl = String(body.store_url ?? body.url ?? "").trim();
  const budget = Number(body.budget);
  if (!storeUrl) return badRequest("store_url requerido");
  if (!Number.isFinite(budget) || budget <= 0) {
    return badRequest("budget debe ser un número > 0");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(storeUrl);
  } catch {
    return badRequest("store_url no es una URL válida");
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return badRequest("store_url debe ser http(s)");
  }

  try {
    const result = await optimizeSupermarketWithAi(env, {
      storeUrl: parsedUrl.toString(),
      budget,
      items: (body.items ?? []).map(String).filter(Boolean),
    });

    return json({
      store: {
        name: result.store_name,
        url: parsedUrl.toString(),
      },
      budget,
      products: result.products,
      meta: {
        app: env.APP_NAME ?? "Mi Menú Smart",
        mode: "supermarket-smart",
        partner: "mimenusmart",
        source: result.source,
      },
    });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Error al optimizar supermercado" },
      502,
    );
  }
}
