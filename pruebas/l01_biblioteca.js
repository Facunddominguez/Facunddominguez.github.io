// Mis comidas (v14.9.92; tarjeta única desde la v15.3): platos y recetas en una sola biblioteca. Solo muestra; no cambia datos. Datos inventados.
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setSaved, setPlan, tradPlate } = R; const T = results();
  const $ = id => document.getElementById(id);
  const scr = () => document.querySelector(".screen.is-active").id;
  const shown = e => !!e && e.getClientRects().length > 0;
  // Desde la v15 los platos sin nombre se muestran con uno automático (mealName), no con "Almuerzo / Cena · Día libre".
  const platosVistos = t => ["p1", "p2"].filter(id => t.includes(mealName(loadSaved().find(x => x.id === id)))).length;
  const appData = () => JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith("miPlatoFacil_") && k !== UI_MODE_KEY).sort().map(k => [k, localStorage.getItem(k)]));
  const tab = name => document.querySelector('#sectionNav [data-section-tab="' + name + '"]');
  const openLibrary = async () => { tab("miscomidas").click(); await wait(60) };
  const search = async text => { $("savedSearch").value = text; $("savedSearch").dispatchEvent(new Event("input", { bubbles: true })); await wait(30) };
  window.confirm = () => true;
  reset();
  setAmounts({ Guiso: { yield: 4, rows: [{ name: "Lentejas", quantity: 300, unit: "g" }, { name: "Zanahoria", quantity: 2, unit: "unidad" }] }, Tarta: { yield: 6, rows: [{ name: "Zapallito", quantity: 3, unit: "unidad" }, { name: "Huevo", quantity: 3, unit: "unidad" }] } });
  localStorage.setItem("miPlatoFacil_recipeDetails_v1", JSON.stringify({
    recipe_lib0001: { id: "recipe_lib0001", title: "Guiso de lentejas", sourceTitle: null, amountsTitle: "Guiso", steps: ["Rehogar", "Cocinar 40 minutos"], notes: "Rinde para congelar", tags: ["olla"], minutes: 60 },
    recipe_lib0002: { id: "recipe_lib0002", title: "Tarta de zapallitos", sourceTitle: null, amountsTitle: "Tarta", steps: ["Armar", "Hornear"], notes: "", tags: ["horno"], minutes: 50 }
  }));
  const copy = (id, rid, title, names) => ({ id, savedAt: "2026-10-26T10:00:00.000Z", type: "plato", title, lines: [], sig: "recipe-ref:" + rid + ":plato", text: title, cooked: 0, state: null, recipeSourceId: rid, recipeIngredients: names });
  setSaved([tradPlate("p1", ["Papa"], ["Tomate"], ["Merluza"]), tradPlate("p2", ["Arroz"], ["Zanahoria"], ["Pollo"]), copy("c1", "recipe_lib0001", "Guiso de lentejas", ["Lentejas", "Zanahoria"]), copy("c2", "recipe_borrada1", "Milanesas viejas", ["Carne"])]);
  setPlan([[todayPlanDay(), "almuerzo", "c1"]]);
  const before = appData();
  await openLibrary();
  const list = $("savedList");
  // v15.3: una sola tarjeta para platos y recetas (data-comida-tipo); las recetas conservan data-recipe-id.
  const cards = tipo => [...list.querySelectorAll(".comida-card")].filter(c => !tipo || c.dataset.comidaTipo === tipo);
  const recetasPropias = () => [...list.querySelectorAll(".comida-card[data-recipe-id]")];
  // L1 Platos y recetas propias juntos, con un resumen
  const plates = cards("plato"), recipes = recetasPropias();
  T.ok("L1 Mis comidas muestra platos y recetas propias en una sola pantalla", scr() === "misplatos" && $("misplatos").querySelector(".screen__title").textContent === "Mis comidas" && !!$("misplatos").querySelector(".segmento") && plates.length === 2 && cards("receta").length === 3 && recipes.map(c => c.dataset.recipeId).join(",") === "recipe_lib0001,recipe_lib0002" && $("savedHint").textContent === "Tenés 5 comidas guardadas.", $("savedHint").textContent);
  // L2 Tarjeta de receta: ingredientes, tiempo, rinde y si está en el plan; el detalle muestra rinde y pasos
  const [guiso, tarta] = recipes;
  const tarjetaOk = guiso.querySelector(".comida-card__componentes").textContent === "Lentejas, Zanahoria" && /⏱ 60 min/.test(guiso.textContent) && /Rinde 4/.test(guiso.textContent) && /📅 En el plan/.test(guiso.textContent) && !/En el plan/.test(tarta.textContent);
  guiso.click(); await wait(60);
  const detalleOk = /Rinde 4 porciones/.test($("recipeReadIngredients").textContent) && $("recipeReadSteps").querySelectorAll("li").length === 2;
  $("recipeReadBack").click(); await wait(60);
  T.ok("L2 la tarjeta de receta muestra ingredientes, tiempo, rinde y si está en el plan; el detalle, rinde y pasos", tarjetaOk && detalleOk, guiso.textContent);
  // L3 La copia que usa el plan no se repite; la de una receta borrada se ve con aviso
  const orphan = cards("receta").find(n => /la receta original se borró/.test(n.textContent)), copies = list.querySelector("details.saved-recipes");
  T.ok("L3 la copia del plan no se repite y la de una receta borrada se ve con aviso", !!orphan && /Milanesas viejas/.test(orphan.textContent) && !!copies && copies.querySelectorAll(".summary__line").length === 1 && !shown(copies));
  // L4 Filtro Todo / Platos / Recetas
  document.querySelector('[data-saved-kind="recetas"]').click(); await wait(30);
  const onlyRecipes = platosVistos(list.textContent) === 0 && recetasPropias().length === 2 && cards("plato").length === 0;
  document.querySelector('[data-saved-kind="platos"]').click(); await wait(30);
  const onlyPlates = recetasPropias().length === 0 && platosVistos(list.textContent) === 2 && !/Milanesas/.test(list.textContent);
  document.querySelector('[data-saved-kind="todo"]').click(); await wait(30);
  T.ok("L4 el filtro muestra todo, solo platos o solo recetas", onlyRecipes && onlyPlates && document.querySelector('[data-saved-kind="todo"]').getAttribute("aria-pressed") === "true" && recetasPropias().length === 2);
  // L5 Buscar: recetas por ingrediente o etiqueta, platos por su contenido
  await search("zapallito"); const s1 = recetasPropias().map(c => c.dataset.recipeId).join(",");
  await search("olla"); const s2 = recetasPropias().map(c => c.dataset.recipeId).join(",");
  await search("merluza"); const s3 = recetasPropias().length === 0 && /Merluza/.test(list.textContent) && cards("plato").length === 1;
  document.querySelector("[data-clear-search]").click(); await wait(30);
  T.ok("L5 la búsqueda encuentra recetas por ingrediente o etiqueta y platos por su contenido", s1 === "recipe_lib0002" && s2 === "recipe_lib0001" && s3 && $("savedSearch").value === "", s1 + " / " + s2);
  // L6 Tocar la tarjeta abre el detalle de la receta; Volver regresa a Mis comidas
  list.querySelector('.comida-card[data-recipe-id="recipe_lib0001"]').click(); await wait(60);
  const opened = scr() === "comida" && shown($("recipeReadView")) && $("recipeReadTitle").textContent === "Guiso de lentejas" && $("comidaTitulo").textContent === "Guiso de lentejas" && $("recipeReadBack").textContent === "← Volver a Mis comidas" && tab("miscomidas").getAttribute("aria-current") === "page";
  $("recipeReadBack").click(); await wait(60);
  T.ok("L6 tocar la receta abre su detalle y Volver regresa a Mis comidas", opened && scr() === "misplatos" && tab("miscomidas").getAttribute("aria-current") === "page");
  // L7 Editar (desde el detalle) abre el formulario con la receta cargada
  $("savedList").querySelector('.comida-card[data-recipe-id="recipe_lib0002"]').click(); await wait(60);
  $("recipeReadEdit").click(); await wait(60);
  T.ok("L7 Editar abre el formulario de receta con la receta cargada", scr() === "recetaEditar" && shown($("recipeEditorView")) && $("recipeDetailsTitle").value === "Tarta de zapallitos" && $("recetaEditarTitulo").textContent === "Editar receta");
  $("homeTop").click(); await wait(60);
  // L11 Mirar, filtrar, buscar y abrir recetas no cambia datos (se comprueba antes de asignar en L8)
  const sinCambios = appData() === before;
  // L8 "Agregar a la semana" (detalle) asigna la receta como "Asignar receta al plan actual"; Planificar sigue funcionando
  const dia = todayPlanDay();
  $("savedList").querySelector('.comida-card[data-recipe-id="recipe_lib0002"]').click(); await wait(60);
  document.querySelector("#comida [data-comida-agregar]").click(); await wait(30);
  $("hojaComidaDia").value = dia; $("hojaComidaSlot").value = "cena";
  [...hoja.elemento.querySelectorAll("button")].find(b => b.textContent === "Agregar a la semana").click(); await wait(40);
  const asignada = loadSaved().find(x => x.id === loadPlan()[dia].cena);
  const agregadaOk = !!asignada && asignada.recipeSourceId === "recipe_lib0002" && asignada.recipeIngredients.join() === "Zapallito,Huevo" && loadPlan()[dia].almuerzo === "c1";
  hoja.cerrar(); $("recipeReadBack").click(); await wait(60);
  planSavedRecipe("recipe_lib0002"); await wait(300);
  T.ok("L8 Agregar a la semana asigna la receta y Planificar abre la Semana con la receta elegida", agregadaOk && scr() === "planHerramientas" && !$("planRecipeReference").closest("[data-herr]").hidden && tab("semana").getAttribute("aria-current") === "page" && $("planRecipeReference").open && $("planRecipeSelect").value === "recipe_lib0002" && $("planRecipeDay").value === todayPlanDay() && $("planRecipeSlot").value === "almuerzo", $("planRecipeSelect").value);
  // L9 En modo completo se ven las copias del plan (Mis comidas) y las herramientas de platos (Mis datos)
  setUiMode("completo"); await openLibrary();
  const copies2 = $("savedList").querySelector("details.saved-recipes");
  const copiasVistas = !!copies2 && shown(copies2);
  go("backupScreen"); await wait(30);
  T.ok("L9 en modo completo se ven las copias de recetas del plan y las herramientas de platos", copiasVistas && shown($("savedTools")));
  setUiMode("simple"); await wait(20);
  T.ok("L10 en modo simple, exportar, importar y vaciar platos quedan ocultos, con aviso", !shown($("savedTools")) && !!$("backupScreen").querySelector("[data-mode-note]") && /exportar o importar platos/.test($("backupScreen").querySelector("[data-mode-note]").textContent));
  T.ok("L11 mirar, filtrar, buscar y abrir recetas no cambia ningún dato", sinCambios);
  // L12 Con recetas dañadas, los platos se siguen viendo y se avisa (sin decir que la receta se borró)
  localStorage.setItem("miPlatoFacil_recipeDetails_v1", '{"recipe_x":{"id":"otro"}}');
  await openLibrary();
  const text = $("savedList").textContent;
  T.ok("L12 con recetas dañadas, los platos se siguen viendo y se avisa", /No se pudieron leer los detalles guardados/.test(text) && platosVistos(text) === 2 && !/la receta original se borró/.test(text) && /Guiso de lentejas/.test(text));
  reset(); showRecipeView("browse"); tab("hoy").click(); await wait(40);
  return T;
})()
