// Mis comidas (v14.9.92): platos y recetas en una sola biblioteca. Solo muestra; no cambia datos. Datos inventados.
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setSaved, setPlan, tradPlate } = R; const T = results();
  const $ = id => document.getElementById(id);
  const scr = () => document.querySelector(".screen.is-active").id;
  const shown = e => !!e && e.getClientRects().length > 0;
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
  // L1 Platos y recetas propias juntos, con un resumen
  const plates = [...list.children].filter(n => n.classList.contains("summary__line") && !n.classList.contains("recipe-lib-card") && !/la receta original se borró/.test(n.textContent));
  const recipes = [...list.querySelectorAll(".recipe-lib-card")];
  T.ok("L1 Mis comidas muestra platos y recetas propias en una sola pantalla", scr() === "misplatos" && $("misplatos").querySelector(".screen__title").textContent === "Mis comidas" && plates.length === 2 && recipes.map(c => c.dataset.recipeId).join(",") === "recipe_lib0001,recipe_lib0002" && $("savedHint").textContent === "Tenés 2 platos y 3 recetas guardados en este dispositivo.", $("savedHint").textContent);
  // L2 Tarjeta de receta: ingredientes, tiempo, rinde, pasos y si está en el plan
  const [guiso, tarta] = recipes;
  T.ok("L2 la tarjeta de receta muestra ingredientes, tiempo, rinde, pasos y si está en el plan", guiso.querySelector("li").textContent === "Ingredientes: Lentejas, Zanahoria" && /⏱ 60 min/.test(guiso.textContent) && /Rinde 4 porciones/.test(guiso.textContent) && /2 pasos/.test(guiso.textContent) && /📅 En el plan/.test(guiso.textContent) && !/En el plan/.test(tarta.textContent), guiso.textContent);
  // L3 La copia que usa el plan no se repite; la de una receta borrada se ve con aviso
  const orphan = [...list.children].find(n => /la receta original se borró/.test(n.textContent)), copies = list.querySelector("details.saved-recipes");
  T.ok("L3 la copia del plan no se repite y la de una receta borrada se ve con aviso", !!orphan && /Milanesas viejas/.test(orphan.textContent) && !!copies && copies.querySelectorAll(".summary__line").length === 1 && !shown(copies));
  // L4 Filtro Todo / Platos / Recetas
  document.querySelector('[data-saved-kind="recetas"]').click(); await wait(30);
  const onlyRecipes = !/Día libre/.test(list.textContent) && list.querySelectorAll(".recipe-lib-card").length === 2;
  document.querySelector('[data-saved-kind="platos"]').click(); await wait(30);
  const onlyPlates = list.querySelectorAll(".recipe-lib-card").length === 0 && (list.textContent.match(/Día libre/g) || []).length === 2 && !/Milanesas/.test(list.textContent);
  document.querySelector('[data-saved-kind="todo"]').click(); await wait(30);
  T.ok("L4 el filtro muestra todo, solo platos o solo recetas", onlyRecipes && onlyPlates && document.querySelector('[data-saved-kind="todo"]').getAttribute("aria-pressed") === "true" && list.querySelectorAll(".recipe-lib-card").length === 2);
  // L5 Buscar: recetas por ingrediente o etiqueta, platos por su contenido
  await search("zapallito"); const s1 = [...list.querySelectorAll(".recipe-lib-card")].map(c => c.dataset.recipeId).join(",");
  await search("olla"); const s2 = [...list.querySelectorAll(".recipe-lib-card")].map(c => c.dataset.recipeId).join(",");
  await search("merluza"); const s3 = list.querySelectorAll(".recipe-lib-card").length === 0 && /Merluza/.test(list.textContent) && /Ninguna receta coincide/.test(list.textContent);
  document.querySelector("[data-clear-search]").click(); await wait(30);
  T.ok("L5 la búsqueda encuentra recetas por ingrediente o etiqueta y platos por su contenido", s1 === "recipe_lib0002" && s2 === "recipe_lib0001" && s3 && $("savedSearch").value === "", s1 + " / " + s2);
  // L6 Ver receta la abre; Volver regresa a Mis comidas
  list.querySelector('.recipe-lib-card[data-recipe-id="recipe_lib0001"] [data-saved-recipe-view]').click(); await wait(60);
  const opened = scr() === "ingredientes" && shown($("recipeReadView")) && $("recipeReadTitle").textContent === "Guiso de lentejas" && $("recipeReadBack").textContent === "← Volver a Mis comidas";
  $("recipeReadBack").click(); await wait(60);
  T.ok("L6 Ver receta la abre y Volver regresa a Mis comidas", opened && scr() === "misplatos" && tab("miscomidas").getAttribute("aria-current") === "page");
  // L7 Editar abre el editor con la receta cargada
  $("savedList").querySelector('.recipe-lib-card[data-recipe-id="recipe_lib0002"] [data-saved-recipe-edit]').click(); await wait(60);
  T.ok("L7 Editar abre el editor con la receta cargada", scr() === "ingredientes" && shown($("recipeEditorView")) && $("recipeDetailsTitle").value === "Tarta de zapallitos");
  $("homeTop").click(); await wait(60);
  // L8 Planificar abre la Semana con la receta elegida
  $("savedList").querySelector('.recipe-lib-card[data-recipe-id="recipe_lib0002"] [data-saved-recipe-plan]').click(); await wait(300);
  T.ok("L8 Planificar abre la Semana con la receta elegida", scr() === "plan" && tab("semana").getAttribute("aria-current") === "page" && $("planRecipeReference").open && $("planRecipeSelect").value === "recipe_lib0002" && $("planRecipeDay").value === todayPlanDay() && $("planRecipeSlot").value === "almuerzo", $("planRecipeSelect").value);
  // L9 En modo completo se ven las copias del plan y las herramientas de platos
  setUiMode("completo"); await openLibrary();
  const copies2 = $("savedList").querySelector("details.saved-recipes");
  T.ok("L9 en modo completo se ven las copias de recetas del plan y las herramientas de platos", !!copies2 && shown(copies2) && shown($("savedTools")));
  setUiMode("simple"); await wait(20);
  T.ok("L10 en modo simple, exportar, importar y vaciar platos quedan ocultos, con aviso", !shown($("savedTools")) && !!$("misplatos").querySelector("[data-mode-note]") && /exportar o importar platos/.test($("misplatos").querySelector("[data-mode-note]").textContent));
  // L11 Mirar, filtrar, buscar y abrir recetas no cambia datos
  T.ok("L11 mirar, filtrar, buscar y abrir recetas no cambia ningún dato", appData() === before);
  // L12 Con recetas dañadas, los platos se siguen viendo y se avisa (sin decir que la receta se borró)
  localStorage.setItem("miPlatoFacil_recipeDetails_v1", '{"recipe_x":{"id":"otro"}}');
  await openLibrary();
  const text = $("savedList").textContent;
  T.ok("L12 con recetas dañadas, los platos se siguen viendo y se avisa", /No se pudieron leer los detalles guardados/.test(text) && (text.match(/Día libre/g) || []).length === 2 && !/la receta original se borró/.test(text) && /Guiso de lentejas/.test(text));
  reset(); showRecipeView("browse"); tab("hoy").click(); await wait(40);
  return T;
})()
