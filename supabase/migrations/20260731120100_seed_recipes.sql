-- Seed demo. Proyecto chef_smart únicamente.

truncate table public.weekly_plans;
delete from public.recipes;

insert into public.recipes (name, ingredients, cost, difficulty, time) values
  ('Guiso de lentejas', '["lentejas","zanahoria","cebolla","ajo"]'::jsonb, 3200, 'Fácil', 40),
  ('Pollo al limón con arroz', '["pollo","limón","arroz","ajo"]'::jsonb, 5400, 'Fácil', 35),
  ('Pasta con salsa de tomate', '["fideos","tomate","ajo","aceite"]'::jsonb, 2800, 'Fácil', 25),
  ('Omelette de verduras', '["huevos","espinaca","queso"]'::jsonb, 2100, 'Fácil', 15),
  ('Salmón con ensalada', '["salmón","lechuga","limón","aceite"]'::jsonb, 8900, 'Media', 30),
  ('Curry de garbanzos', '["garbanzos","leche de coco","curry","arroz"]'::jsonb, 3600, 'Media', 45);
