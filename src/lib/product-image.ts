/** Unsplash: abarrotes, frutas y verduras (fondo limpio / empaque). */
const GROCERY_PHOTOS = [
  "photo-1586201375761-83865001e31c", // rice
  "photo-1474979266404-7eaacbcd87c5", // oil/olive
  "photo-1582722879131-4d0c861d0c8b", // eggs
  "photo-1598170845058-32b9d6a5da37", // carrots
  "photo-1604503468506-a8da13d82791", // chicken
  "photo-1486297678162-eb2a19b0a32d", // cheese
  "photo-1576045057995-568f588f82fb", // spinach
  "photo-1518977676601-b53f82aba655", // potato/produce
  "photo-1592924357228-91a4daadcfea", // tomatoes
  "photo-1563636619-e9143da7973b", // milk
  "photo-1615485290382-441e4d049cb5", // lentils/beans
  "photo-1464965911861-746a04b4bca6", // strawberries/produce
  "photo-1610832958506-aa56368176cf", // fruit aisle
  "photo-1540420773420-3366772f4999", // salad greens
  "photo-1506617564039-2c380a0c2b1f", // pasta/pantry
] as const;

const BRANDS = [
  "Marca Santa Isabel",
  "Preferente",
  "Cocina del Sur",
  "Ahorro Diario",
  "Campo Fresco",
  "Despensa Chile",
] as const;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function productImageUrl(productName: string): string {
  const photo = GROCERY_PHOTOS[hash(productName) % GROCERY_PHOTOS.length];
  const q = encodeURIComponent(productName.slice(0, 40));
  return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=240&h=240&q=80&utm_source=mimenusmart&sig=${hash(productName)}&q_item=${q}`;
}

export function productBrand(productName: string): string {
  return BRANDS[hash(productName) % BRANDS.length];
}
