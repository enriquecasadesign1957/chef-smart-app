import { supermarketProductUrl, withAffiliateTracking } from "@/lib/affiliate";
import { DEMO_GROCERY, type GroceryCategory, type GroceryItem } from "@/lib/demo-data";

export type SmartProduct = GroceryItem & {
  url: string;
};

function apiBase(): string | null {
  const base =
    process.env.NEXT_PUBLIC_MENU_API_URL?.trim() ||
    "https://mi-menu-smart-api.enriquecasadesign.workers.dev";
  if (!base || base.includes("YOUR_")) return null;
  return base.replace(/\/$/, "");
}

export async function optimizeWithSupermarket(input: {
  storeUrl: string;
  budget: number;
  items?: string[];
}): Promise<{
  storeName: string;
  products: SmartProduct[];
  source: "worker" | "local";
}> {
  const base = apiBase();
  if (base) {
    try {
      const res = await fetch(`${base}/supermarket/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_url: input.storeUrl,
          budget: input.budget,
          items: input.items ?? [],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          store?: { name?: string };
          products?: {
            id: string;
            name: string;
            category: GroceryCategory;
            estimatedClp: number;
            url: string;
          }[];
        };
        const products: SmartProduct[] = (data.products ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          estimatedClp: p.estimatedClp,
          url: withAffiliateTracking(p.url),
        }));
        return {
          storeName: data.store?.name ?? "Supermercado",
          products,
          source: "worker",
        };
      }
    } catch {
      /* fallback local */
    }
  }

  // Fallback local: lista demo con links al súper + afiliado
  let sum = 0;
  const products: SmartProduct[] = [];
  for (const item of DEMO_GROCERY) {
    if (sum + item.estimatedClp > input.budget) continue;
    products.push({
      ...item,
      url: supermarketProductUrl(input.storeUrl, item.name),
    });
    sum += item.estimatedClp;
  }
  return {
    storeName: "Tu supermercado",
    products,
    source: "local",
  };
}
