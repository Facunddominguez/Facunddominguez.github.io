// F01-01 battery: canonical ingredient key. Same ingredient -> same key; different ingredients -> different keys.
(async () => {
  const { results, reset } = window.R2; const T = results();
  reset();
  const same = [["Tomates", "Tomate"], ["tomate fresco", "Tomate"], ["Lentejas", "lenteja"], ["Porotos negros", "poroto negro"], ["Frijoles negros", "Porotos negros"], ["Patata", "Papa"], ["Papas", "papa"], ["Aguacate", "Palta"], ["Nueces", "nuez"], ["Hojas verdes", "hoja verde"], ["Limones", "limón"], ["Guisantes", "Arvejas"], ["Maicena", "Fécula de maíz (maicena)"], ["Huevos", "Huevo entero de gallina"], ["Pimiento rojo", "Morrón rojo"], ["Yogurt", "Yogur (natural, bebible, griego)"], ["Judías verdes", "Chauchas"], ["Chauchas (judías verdes)", "Chauchas"], ["TOMATE", "tomate"], ["Pollo", "Pollo (pechuga, muslo, pata-muslo)"], ["Salmones", "Salmón"], ["Panes", "Pan"], ["Diente de ajo", "Ajo"], ["Repollo morado", "Repollo colorado"]];
  const bad = same.filter(([a, b]) => ingredientKey(a) !== ingredientKey(b));
  T.ok("K1 reconoce plurales y sinónimos claros", bad.length === 0, bad.map(x => x.join("≠")).join("; ") || same.length + " pares");
  const diff = [["Arroz", "Arroz (integral, yamaní)"], ["Pan", "Pan rallado"], ["Batata", "Papa"], ["Tomate", "Tomates cherry"], ["Queso", "Queso cremoso"], ["Leche", "Leche descremada"], ["Zapallo", "Zapallito"], ["Cebolla", "Cebolla de verdeo"], ["Carne vacuna (nalga, cuadril, bola de lomo, lomo, roast beef)", "Carne de cerdo (carré)"], ["Harina de maíz", "Polenta"], ["Avena", "Avena arrollada o instantánea"], ["Lechuga", "Rúcula"], ["Atún", "Merluza"], ["Pechuga de pollo", "Pollo"], ["Pasta de maní", "Fideos"]];
  const merged = diff.filter(([a, b]) => ingredientKey(a) === ingredientKey(b));
  T.ok("K2 no confunde ingredientes ni variedades distintas", merged.length === 0, merged.map(x => x.join("=")).join("; ") || diff.length + " pares");
  const all = [...data.verduras, ...data.almidones, ...data.legumbres, ...data.proteinas];
  const keys = new Map(); const collisions = [];
  for (const n of all) { const k = ingredientKey(n); if (keys.has(k) && normalizeSearchText(keys.get(k)) !== normalizeSearchText(n)) collisions.push(keys.get(k) + " = " + n); else keys.set(k, n) }
  const allowed = ["Chauchas = Chauchas (judías verdes)"];
  const unexpected = collisions.filter(c => !allowed.includes(c));
  T.ok("K3 el catálogo de la app no une opciones distintas entre sí", unexpected.length === 0, collisions.join("; "));
  T.ok("K4 la clave es estable y no depende de mayúsculas, tildes ni espacios", ingredientKey("  Fécula   de MAÍZ ") === ingredientKey("fecula de maiz") && ingredientKey("") === "");
  const t0 = performance.now(); for (let i = 0; i < 20000; i++) ingredientKey("Tomates cherry " + (i % 50)); const ms = performance.now() - t0;
  T.ok("K5 rendimiento: 20.000 claves en menos de 1 s", ms < 1000, Math.round(ms) + " ms");
  return T;
})()
