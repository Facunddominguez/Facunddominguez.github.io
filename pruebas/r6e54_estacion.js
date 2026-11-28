// R6 · Etapa 54 (Frutas y verduras de estación, completada en la v20.11): ítems E-01 a E-04 de docs/ronda-6-lista.md.
// También los arreglos de la v20.11: "Mañana" de un domingo y los botones que se repetían en la ficha de una receta.
// Fechas fijas: jueves 26/11/2026 (primavera) y jueves 16/7/2026 (invierno). Datos inventados.
(async () => {
  const H = R6H(), { ok, espera } = H;
  const tocar = async (el, ms) => { if (!el) throw new Error("no hay elemento para tocar · tras " + H.T.length + " pruebas"); return H.tocar(el, ms) };
  const ev = x => H.ev(x), doc = () => H.doc();
  const $ = id => doc().getElementById(id);
  const qa = s => [...doc().querySelectorAll(s)];
  const norm = H.norm, visible = H.visible;
  const R = [
    { id: "recipe_estac6a", titulo: "Ensalada de tomate y zapallito", filas: [{ name: "Tomate", quantity: 300, unit: "g" }, { name: "Zapallito", quantity: 2, unit: "unidad" }, { name: "Cebolla", quantity: 1, unit: "unidad" }] },
    { id: "recipe_estac6b", titulo: "Postre de fruta", tipo: "desayuno", filas: [{ name: "Fruta de estación", quantity: 2, unit: "unidad" }, { name: "Yogur natural", quantity: 200, unit: "g" }] },
    { id: "recipe_estac6c", titulo: "Fideos con salsa", filas: [{ name: "Fideos", quantity: 200, unit: "g" }, { name: "Salsa de tomate", quantity: 1, unit: "unidad" }] },
    { id: "recipe_estac6d", titulo: "Guiso del lunes que viene", filas: [{ name: "Lentejas", quantity: 200, unit: "g" }] },
  ];
  const PLAN = [["jueves", "almuerzo", "rp_recipe_estac6a"], ["jueves", "desayuno", "rp_recipe_estac6b"], ["viernes", "cena", "rp_recipe_estac6c"]];
  const base = (extra = {}) => ({ ...H.MARCA, ...H.recetas(R), miPlatoFacil_plan: JSON.stringify(H.planDe(PLAN)), ...extra });
  const compras = async () => { ev('openTab("compras"); renderCompras()'); await espera(400) };
  const fila = re => qa("#comprasList .shop-item").find(f => re.test(norm(f.innerText)));
  // En la lista la marca es el ::after del texto de la fila (el texto que se copia no cambia).
  const marcada = f => { const l = f && f.querySelector("label[data-de-estacion]"); return !!l && /de estación/.test(H.w().getComputedStyle(l, "::after").content) };

  // ---- E-01: el archivo de estación, con su fuente ----
  await H.abrirEn("2026-11-26", base());
  const D = JSON.parse(ev("JSON.stringify(ESTACION_DATOS)"));
  const meses = Object.values(D.meses).flat();
  ok("R6-E-01 datos/estacion.json está incrustado en la app y cita su fuente (nombre, dirección y fecha)", D.version === 1 && /Gobierno de la Ciudad de Buenos Aires/.test(D.fuente.nombre) && /^https:\/\/www\.buenosaires\.gob\.ar\//.test(D.fuente.url) && /^\d{4}-\d{2}-\d{2}$/.test(D.fuente.fecha), JSON.stringify(D.fuente));
  ok("R6-E-01 cada mes del año cae en una sola estación y cada estación tiene frutas y verduras", meses.length === 12 && new Set(meses).size === 12 && ["verano", "otono", "invierno", "primavera"].every(t => D.temporadas[t].frutas.length && D.temporadas[t].verduras.length), JSON.stringify(D.meses));
  ok("R6-E-01 noviembre es primavera y julio, invierno (hemisferio sur)", ev('Estacion.temporada(new Date(2026, 10, 26))') === "primavera" && ev('Estacion.temporada(new Date(2026, 6, 16))') === "invierno" && ev("Estacion.temporada()") === "primavera");
  ok("R6-E-01 se reconoce por la primera palabra y en singular: 'Tomate cherry' y 'Zapallitos' sí, 'Salsa de tomate' y 'Cebolla' (todo el año) no", ev('Estacion.es("Tomate cherry")') === true && ev('Estacion.es("Zapallitos")') === true && ev('Estacion.es("Morrón rojo")') === true && ev('Estacion.es("Salsa de tomate")') === false && ev('Estacion.es("Cebolla")') === false);

  // ---- E-02: "Fruta de estación" muestra ejemplos del mes; el precio no cambia ----
  await compras();
  const frutaNov = fila(/^Fruta de estación/);
  ok("R6-E-02 en la lista: 'Fruta de estación (durazno, damasco o frutilla)' en noviembre", !!frutaNov && /^Fruta de estación \(durazno, damasco o frutilla\)/.test(norm(frutaNov.innerText)), frutaNov ? norm(frutaNov.innerText) : qa("#comprasList .shop-item").map(f => norm(f.innerText)).join(" | "));
  const precioNov = frutaNov && (frutaNov.querySelector(".shop-item__precio") || {}).textContent;
  ev('Comidas.abrirComida("receta", "recipe_estac6b")'); await espera(400);
  const chips = qa("#recipeReadIngredients .comida-ingrediente").map(b => norm(b.innerText));
  ok("R6-E-02 en la ficha de la receta: 'Fruta de estación (durazno, damasco o frutilla): 2 unidad'", chips.some(t => /^Fruta de estación \(durazno, damasco o frutilla\):/.test(t)), JSON.stringify(chips));
  ev('openTab("hoy")'); await espera(400);
  const comprar = norm(($("hoyAvisos") || { innerText: "" }).innerText);
  ok("R6-E-02 en Hoy: 'Para comprar hoy' dice 'Fruta de estación (durazno, damasco o frutilla)'", /Para comprar hoy: .*Fruta de estación \(durazno, damasco o frutilla\)/i.test(comprar), comprar);
  H.fijarFecha("2026-07-16"); await compras();
  const frutaJul = fila(/^Fruta de estación/), precioJul = frutaJul && (frutaJul.querySelector(".shop-item__precio") || {}).textContent;
  ok("R6-E-02 en julio cambian los ejemplos (mandarina, manzana o pomelo) y el precio de la fila es el mismo que en noviembre", !!frutaJul && /^Fruta de estación \(mandarina, manzana o pomelo\)/.test(norm(frutaJul.innerText)) && precioNov === precioJul, JSON.stringify([frutaJul && norm(frutaJul.innerText), precioNov, precioJul]));

  // ---- E-03: la marca "de estación" en la lista y al elegir una comida ----
  H.fijarFecha("2026-11-26"); await compras();
  ok("R6-E-03 en la lista de noviembre, Tomate y Zapallito llevan 'de estación'; Cebolla (todo el año) y Fideos no (y el texto de la fila no cambia)", marcada(fila(/^Tomate/)) && marcada(fila(/^Zapallito/)) && !marcada(fila(/^Cebolla/)) && !marcada(fila(/^Fideos/)) && !/de estación/.test(fila(/^Tomate/).querySelector("label").textContent), qa("#comprasList .shop-item").map(f => norm(f.innerText)).join(" | "));
  const m = fila(/^Tomate/).querySelector("label").getBoundingClientRect(), f = fila(/^Tomate/).getBoundingClientRect();
  ok("R6-E-03 la marca entra en la fila (el texto con su marca no se sale a 390 px) y el texto que se copia no la incluye", m.right <= f.right + 0.5 && m.left >= f.left - 0.5 && !/de estación/.test(fila(/^Tomate/).querySelector("label").textContent), JSON.stringify([m.left, m.right, f.left, f.right]));
  H.fijarFecha("2026-07-16"); await compras();
  ok("R6-E-03 en julio el tomate ya no es de estación (no está en la lista de invierno) y el zapallito sí", !marcada(fila(/^Tomate/)) && marcada(fila(/^Zapallito/)), qa("#comprasList .shop-item").map(f => norm(f.innerText)).join(" | "));
  H.fijarFecha("2026-11-26");
  ev('openTab("semana"); abrirSelector("miercoles", "almuerzo")'); await espera(500);
  const items = qa(".hoja .selector-item").map(b => ({ t: norm((b.querySelector(".selector-item__nombre") || b).textContent), e: !!b.querySelector("[data-de-estacion]") }));
  const ens = items.find(x => /Ensalada de tomate y zapallito/.test(x.t)), fid = items.find(x => /Fideos con salsa/.test(x.t));
  ok("R6-E-03 al elegir una comida: la ensalada de tomate y zapallito lleva 'de estación'; los fideos con salsa de tomate, no", !!ens && ens.e && !!fid && !fid.e, JSON.stringify(items.slice(0, 12)));
  ok("R6-E-03 entre las ideas del selector también hay alguna marcada 'de estación'", qa(".hoja [data-selector-seccion=ideas] .selector-item [data-de-estacion]").length > 0, String(qa(".hoja [data-selector-seccion=ideas] .selector-item").length));
  ev("hoja.cerrar()"); await espera(200);

  // ---- E-04: Armame desempata por lo de estación y lo dice en Ver detalle ----
  await H.abrirEn("2026-11-26", { ...H.MARCA });
  const nov = JSON.parse(ev('JSON.stringify((() => { const r = ArmameSemana.armar({ modo: "todo" }); return { porque: r.porque, llenos: r.llenos, huecos: r.huecos, detalle: ArmameSemana.resumen(r) } })())'));
  ok("R6-E-04 en noviembre, Ver detalle dice 'Entre opciones parecidas elegí lo de estación. De estación (primavera) esta semana: …'", nov.porque.temporada === "primavera" && nov.porque.estacion.length > 0 && /Entre opciones parecidas elegí lo de estación\. De estación \(primavera\) esta semana: /.test(nov.detalle), nov.detalle);
  H.fijarFecha("2026-07-16");
  const jul = JSON.parse(ev('JSON.stringify((() => { const r = ArmameSemana.armar({ modo: "todo" }); return { porque: r.porque, llenos: r.llenos, huecos: r.huecos, detalle: ArmameSemana.resumen(r) } })())'));
  ok("R6-E-04 es un desempate, no una regla fija: en julio llena los mismos huecos y nombra solo cosas de invierno", jul.llenos === jul.huecos && nov.llenos === nov.huecos && jul.porque.temporada === "invierno" && jul.porque.estacion.every(x => D.temporadas.invierno.frutas.concat(D.temporadas.invierno.verduras).includes(x)), JSON.stringify([jul.llenos, jul.huecos, jul.porque.estacion]));
  const fuente = ev("String(ArmameSemana.armar).length") > 0 && ev('(() => { const o = Estacion.deLista; let n = 0; Estacion.deLista = (...a) => { n++; return o(...a) }; try { ArmameSemana.armar({ modo: "todo" }) } finally { Estacion.deLista = o } return n })()');
  ok("R6-E-04 Armame consulta lo de estación al puntuar cada opción", fuente > 20, String(fuente));

  // ---- v20.11: "Mañana" de un domingo muestra el lunes de la semana que viene ----
  await H.abrirEn("2026-11-29", { ...base(), ...H.proxima("2026-11-30", [["lunes", "almuerzo", "rp_recipe_estac6d"]]), miPlatoFacil_plan: JSON.stringify(H.planDe([["lunes", "almuerzo", "rp_recipe_estac6c"]])) });
  ev('openTab("hoy")'); await espera(300);
  ev("abrirMananaHoy()"); await espera(300);
  const hojaManana = norm((doc().querySelector(".hoja-fondo:not([hidden]) .hoja") || { innerText: "" }).innerText);
  ok("V2011-manana un domingo, 'Mañana' muestra el lunes de la semana que viene (no el de esta semana, que ya pasó)", /Mañana · lunes/i.test(hojaManana) && /Guiso del lunes que viene/.test(hojaManana) && !/Fideos con salsa/.test(hojaManana), hojaManana);
  ev("hoja.cerrar()"); await espera(150);

  // ---- v20.11: la ficha de una receta no repite botones ----
  await H.abrirEn("2026-11-26", base());
  ev('openTab("miscomidas"); Comidas.abrirComida("receta", "recipe_estac6a")'); await espera(400);
  const visibles = qa("#recipeReadAcciones button").filter(visible).map(b => norm(b.innerText));
  ok("V2011-ficha desde Comidas no se repiten 'Volver a Comidas' (ya está '← Comidas' arriba), Duplicar ni Agregar faltantes (están en ⋯)", !visibles.some(t => /Volver a Comidas|Duplicar|Agregar faltantes/.test(t)) && visibles.some(t => /Editar receta/.test(t)) && visibles.some(t => /Lo comí/.test(t)), JSON.stringify(visibles));
  const antes = JSON.parse(ev('JSON.stringify(Object.keys(loadRecipeDetails()).length)'));
  await tocar(doc().querySelector("[data-comida-menu]"), 250);
  await tocar(qa(".hoja-fondo:not([hidden]) .menu-semana button").find(b => /Duplicar receta/.test(b.innerText)), 400);
  const despues = JSON.parse(ev('JSON.stringify(Object.keys(loadRecipeDetails()).length)'));
  ok("V2011-ficha 'Duplicar receta' desde ⋯ sigue funcionando con el botón de abajo oculto", despues === antes + 1, JSON.stringify([antes, despues]));
  return H.terminar();
})()
