/** Fotos Unsplash de comida (IDs públicos) para cabeceras de receta. */
const FOOD_PHOTOS = [
  "photo-1546069901-ba9599a7e63c",
  "photo-1504674900247-0877df9cc836",
  "photo-1512621776951-a57141f2eefd",
  "photo-1467003909585-2f8a72700288",
  "photo-1476224203421-9ac39bcb3327",
  "photo-1455619452474-d2be8b1e70cd",
  "photo-1565299624946-b28f40a0ae38",
  "photo-1567620905732-2d1ec7ab7445",
  "photo-1484723091739-30a097e8f929",
  "photo-1495521821757-a1efb6729352",
  "photo-1512058564366-18510be2db19",
  "photo-1555939594-58d7cb561ad1",
  "photo-1540189549336-e6e99c3679fe",
  "photo-1565958011703-44f9829ba187",
  "photo-1529042410759-befb1204b468",
] as const;

function hashTitle(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** URL dinámica tipo Unsplash según el título (foto de plato). */
export function recipeHeroImageUrl(title: string, size: "hero" | "thumb" = "hero"): string {
  const photo = FOOD_PHOTOS[hashTitle(title) % FOOD_PHOTOS.length];
  const q = encodeURIComponent(title.slice(0, 48));
  const wh = size === "thumb" ? "w=160&h=160" : "w=900&h=600";
  return `https://images.unsplash.com/${photo}?auto=format&fit=crop&${wh}&q=80&utm_source=mimenusmart&utm_medium=referral&sig=${hashTitle(title)}&q_food=${q}`;
}
