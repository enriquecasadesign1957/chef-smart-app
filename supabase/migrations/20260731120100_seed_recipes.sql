-- Seed demo. Proyecto Mi Menú Smart (aknloedykengemrlehyp) únicamente.
-- Compatible con aprendizaje: ingredients_key, steps, photo_keyword.
-- CUIDADO: borra planes y recetas existentes.

truncate table public.weekly_plans;
delete from public.recipes;

insert into public.recipes (
  name,
  ingredients,
  ingredients_key,
  steps,
  cost,
  difficulty,
  time,
  photo_keyword
) values
  (
    'Guiso de lentejas',
    '["lentejas","zanahoria","cebolla","ajo"]'::jsonb,
    'ajo,cebolla,lentejas,zanahoria',
    '["Enjuaga las lentejas.","Sofríe cebolla, zanahoria y ajo.","Añade lentejas y agua; cocina a fuego medio.","Ajusta sal y sirve."]'::jsonb,
    3200,
    'Fácil',
    40,
    'lentil-stew'
  ),
  (
    'Pollo al limón con arroz',
    '["pollo","limón","arroz","ajo"]'::jsonb,
    'ajo,arroz,limon,pollo',
    '["Marina el pollo con limón y ajo.","Dora el pollo.","Cocina el arroz aparte.","Sirve el pollo sobre el arroz."]'::jsonb,
    5400,
    'Fácil',
    35,
    'lemon-chicken-rice'
  ),
  (
    'Pasta con salsa de tomate',
    '["fideos","tomate","ajo","aceite"]'::jsonb,
    'aceite,ajo,fideos,tomate',
    '["Hierve los fideos.","Sofríe ajo en aceite.","Añade tomate y reduce.","Mezcla con la pasta y sirve."]'::jsonb,
    2800,
    'Fácil',
    25,
    'tomato-pasta'
  ),
  (
    'Omelette de verduras',
    '["huevos","espinaca","queso"]'::jsonb,
    'espinaca,huevos,queso',
    '["Bate los huevos.","Saltea espinaca.","Vierte huevos y agrega queso.","Dobla y sirve."]'::jsonb,
    2100,
    'Fácil',
    15,
    'vegetable-omelette'
  ),
  (
    'Salmón con ensalada',
    '["salmón","lechuga","limón","aceite"]'::jsonb,
    'aceite,lechuga,limon,salmon',
    '["Sazona el salmón.","Sella a la plancha.","Prepara ensalada con lechuga, limón y aceite.","Sirve juntos."]'::jsonb,
    8900,
    'Media',
    30,
    'salmon-salad'
  ),
  (
    'Curry de garbanzos',
    '["garbanzos","leche de coco","curry","arroz"]'::jsonb,
    'arroz,curry,garbanzos,leche de coco',
    '["Cocina el arroz.","Calienta curry con leche de coco.","Añade garbanzos y hierve suave.","Sirve con arroz."]'::jsonb,
    3600,
    'Media',
    45,
    'chickpea-curry'
  );
