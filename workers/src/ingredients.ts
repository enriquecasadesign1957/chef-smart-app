/** Limpia adjetivos y estandariza ingredientes clave (orden alfabético). */

const ADJECTIVES = new Set(
  [
    "maduro",
    "madura",
    "maduros",
    "maduras",
    "viejo",
    "vieja",
    "viejos",
    "viejas",
    "fresco",
    "fresca",
    "frescos",
    "frescas",
    "grande",
    "grandes",
    "pequeño",
    "pequeña",
    "pequeños",
    "pequeñas",
    "chico",
    "chica",
    "chicos",
    "chicas",
    "rojo",
    "roja",
    "rojos",
    "rojas",
    "verde",
    "verdes",
    "amarillo",
    "amarilla",
    "congelado",
    "congelada",
    "congelados",
    "congeladas",
    "picado",
    "picada",
    "picados",
    "picadas",
    "entero",
    "entera",
    "enteros",
    "enteras",
    "crudo",
    "cruda",
    "cocido",
    "cocida",
    "orgánico",
    "organica",
    "organico",
    "orgánica",
    "bueno",
    "buena",
    "rico",
    "rica",
    "nuevo",
    "nueva",
    "unos",
    "unas",
    "algunos",
    "algunas",
    "poco",
    "poca",
    "mucho",
    "mucha",
  ].map((w) => stripAccents(w)),
);

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

function cleanOne(raw: string): string {
  const base = stripAccents(String(raw).toLowerCase())
    .replace(/[^a-z0-9ñ\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!base) return "";
  const words = base
    .split(" ")
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !ADJECTIVES.has(stripAccents(w)));
  return words.join(" ").trim();
}

/** Ej: "tomates maduros, papas viejas" → ["papas", "tomates"] ordenado. */
export function cleanAndSortIngredients(list: string[]): string[] {
  const cleaned = list
    .flatMap((item) => String(item).split(/[,;|\n]+/))
    .map(cleanOne)
    .filter(Boolean);
  const unique = [...new Set(cleaned)];
  unique.sort((a, b) => a.localeCompare(b, "es"));
  return unique;
}

export function ingredientsKey(list: string[]): string {
  return cleanAndSortIngredients(list).join("|");
}
