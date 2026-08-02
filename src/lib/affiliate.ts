export const AFFILIATE_PARTNER = "mimenusmart";

/** Añade ?partner=mimenusmart (o &partner=) a cualquier URL de producto. */
export function withAffiliateTracking(
  url: string,
  partner: string = AFFILIATE_PARTNER,
): string {
  try {
    const u = new URL(url);
    u.searchParams.set("partner", partner);
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}partner=${encodeURIComponent(partner)}`;
  }
}

/** Construye URL de búsqueda en el súper + tracking afiliado. */
export function supermarketProductUrl(storeUrl: string, productName: string): string {
  try {
    const base = new URL(storeUrl);
    const search = new URL("/busqueda", base.origin);
    search.searchParams.set("q", productName);
    return withAffiliateTracking(search.toString());
  } catch {
    return withAffiliateTracking(`https://www.santaisabel.cl/busqueda?q=${encodeURIComponent(productName)}`);
  }
}
