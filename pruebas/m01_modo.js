// Modo simple (v14.9.90): oculta las herramientas avanzadas sin borrar ni cambiar datos.
// Se cambia desde Configuración o desde el aviso de cada pantalla. Solo datos inventados.
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setRecipes, setStock, criticalCase } = R; const T = results();
  const $ = id => document.getElementById(id);
  const shown = e => !!e && e.getClientRects().length > 0;
  const openAll = id => { const s = $(id); s.querySelectorAll("details").forEach(d => { d.open = true }) };
  const appData = () => JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith("miPlatoFacil_") && k !== UI_MODE_KEY).sort().map(k => [k, localStorage.getItem(k)]));
  const advancedIn = id => [...$(id).querySelectorAll("[data-avanzado]")];
  reset();
  // M1 Arranca en modo simple, sin guardar nada
  T.ok("M1 la app arranca en modo simple sin guardar ningún ajuste", getUiMode() === "simple" && document.documentElement.dataset.modo === "simple" && localStorage.getItem(UI_MODE_KEY) === null);
  // Datos inventados para que todas las pantallas tengan contenido
  criticalCase();
  setStock([["Papa", 1, "kg"]]);
  const recipeId = "recipe_test0001";
  // M2 Herramientas avanzadas ocultas en Compras, Recetas y Plan (aunque los paneles estén abiertos)
  const expected = {
    compras: ["shoppingToolsPanel"],
    ingredientes: ["pantryReviewPanel", "recipeAmountsPanel", "ingredientAliasPanel"],
    plan: ["varSelect", "monthlyPlanPanel", "datedWeeksPanel", "datedEditPanel", "planHistoryPanel", "habitGoalsPanel"]
  };
  const visibleAdvanced = [];
  for (const [screen, ids] of Object.entries(expected)) {
    go(screen); if (screen === "ingredientes") showRecipeView("browse");
    openAll(screen); await wait(40);
    for (const id of ids) if (shown($(id))) visibleAdvanced.push(id);
    for (const e of advancedIn(screen)) if (shown(e)) visibleAdvanced.push(screen + ":" + (e.id || e.className));
  }
  go("plan"); await wait(20);
  if (shown(document.querySelector("#plan [data-del-var]"))) visibleAdvanced.push("Borrar variación");
  go("ingredientes"); showRecipeView("browse"); await wait(20);
  for (const id of ["recipeRecommendPantry", "recipeRecommendMode", "recipeCatalogSort", "recipeCatalogPageSize"]) if (shown($(id))) visibleAdvanced.push(id);
  showRecipeRead(recipeId); await wait(30);
  const readOpen = shown($("recipeReadView"));
  if (shown($("recipeReadCooked"))) visibleAdvanced.push("recipeReadCooked");
  showRecipeView("editor"); await wait(20);
  if (shown($("recipeDetailsAmounts"))) visibleAdvanced.push("recipeDetailsAmounts");
  showRecipeView("browse");
  T.ok("M2 las herramientas avanzadas no se ven en modo simple", readOpen && visibleAdvanced.length === 0, visibleAdvanced.join(", "));
  // M3 Lo esencial sigue a la vista
  const essentials = [];
  go("compras"); await wait(20);
  for (const sel of ["#comprasList", "#manualShoppingPanel", "[data-share-compras]", "[data-copy-compras]", "#comprasShowPending"]) if (!shown(document.querySelector(sel))) essentials.push(sel);
  go("ingredientes"); showRecipeView("browse"); openAll("ingredientes"); await wait(30);
  for (const sel of ["#pantryChips", "#recipeCatalogSearch", "#recipeCatalogTime", "#recipeAvoidWords", "#aiIdeasPanel", "#nutritionLookupPanel", "#recipeCatalogResults", "#recipeViewCreate"]) if (!shown(document.querySelector(sel))) essentials.push(sel);
  go("plan"); openAll("plan"); await wait(30);
  for (const sel of ["#currentPlanPanel", "#planList", "#planRecipeReference", "#consumptionPanel", "[data-clear-plan]", "[data-download-week]"]) if (!shown(document.querySelector(sel))) essentials.push(sel);
  T.ok("M3 lo esencial sigue visible (lista, extras, recetas, plan, lo que comí)", essentials.length === 0, essentials.join(", "));
  // M4 Cada pantalla avisa qué está oculto y que los datos siguen guardados
  const notes = ["compras", "ingredientes", "plan"].map(id => document.querySelector("#" + id + " [data-mode-note]"));
  T.ok("M4 aviso en Compras, Recetas y Plan con lo que está oculto", notes.every(n => n && /Tus datos siguen guardados/.test(n.textContent) && n.querySelector("button").textContent === "Mostrar herramientas avanzadas") && /presupuesto/.test(notes[0].textContent) && /variaciones/.test(notes[2].textContent) && $("shoppingToolsPanel").previousElementSibling === notes[0], notes.map(n => n && n.textContent.slice(0, 60)).join(" | "));
  // M5 Tarjeta en Configuración: cambia el modo y lo recuerda
  const card = $("uiModeToggle");
  const inSettings = !!card && $("sectionSettings").contains(card) && card.classList.contains("tool-button");
  const before = appData();
  const label1 = card.querySelector(".tool-button__label").textContent;
  card.click(); await wait(20);
  const label2 = card.querySelector(".tool-button__label").textContent;
  T.ok("M5 la tarjeta de Configuración activa el modo completo y lo recuerda", inSettings && label1 === "Modo simple: activado" && label2 === "Modo simple: desactivado" && getUiMode() === "completo" && localStorage.getItem(UI_MODE_KEY) === "completo" && document.documentElement.dataset.modo === "completo", label1 + " → " + label2);
  // M6 En modo completo se ve todo otra vez
  go("compras"); await wait(20);
  const toolsShown = shown($("shoppingToolsPanel"));
  go("plan"); openAll("plan"); await wait(20);
  const planShown = ["varSelect", "monthlyPlanPanel", "datedWeeksPanel", "planHistoryPanel"].every(id => shown($(id))) && shown(document.querySelector("#plan [data-del-var]"));
  go("ingredientes"); showRecipeView("browse"); openAll("ingredientes"); await wait(20);
  const ingShown = ["pantryReviewPanel", "recipeAmountsPanel", "ingredientAliasPanel", "recipeRecommendPantry"].every(id => shown($(id)));
  T.ok("M6 en modo completo vuelven a verse todas las herramientas", toolsShown && planShown && ingShown && notes.every(n => n.querySelector("button").textContent === "Ocultar herramientas avanzadas"));
  // M7 El aviso de cada pantalla vuelve al modo simple
  notes[2].querySelector("button").click(); await wait(20);
  T.ok("M7 el botón del aviso vuelve al modo simple", getUiMode() === "simple" && localStorage.getItem(UI_MODE_KEY) === "simple" && !shown($("monthlyPlanPanel")) && card.querySelector(".tool-button__label").textContent === "Modo simple: activado");
  // M8 Cambiar de modo no toca ningún dato
  card.click(); await wait(10); card.click(); await wait(10);
  T.ok("M8 cambiar de modo no modifica ningún dato guardado", appData() === before && Object.keys(localStorage).filter(k => k.startsWith("miPlatoFacil_")).includes(UI_MODE_KEY));
  // M9 Lo guardado en herramientas ocultas sigue en uso: las existencias generan la sugerencia en Compras
  go("compras"); await wait(30);
  const papa = shoppingDisplayItems().find(x => x.name === "Papa");
  T.ok("M9 las existencias guardadas siguen sugiriendo en Compras aunque estén ocultas", getUiMode() === "simple" && !!papa && !!papa.suggestion && /1 kg/.test(papa.suggestion.text) && /💡/.test($("comprasList").textContent), papa && papa.suggestion && papa.suggestion.text);
  // M10 Al volver al modo simple, los controles ocultos de la sesión vuelven a su valor inicial
  setUiMode("completo");
  $("recipeRecommendMode").value = "budget"; $("recipeRecommendPantry").checked = true; $("recipeRecommendCosts").checked = true; $("recipeCatalogSort").value = "reverse"; $("recipeCatalogPageSize").value = "60";
  setUiMode("simple");
  T.ok("M10 los controles ocultos no siguen cambiando el orden de las recetas", $("recipeRecommendMode").value === "normal" && !$("recipeRecommendPantry").checked && !$("recipeRecommendCosts").checked && $("recipeCatalogSort").value === "name" && $("recipeCatalogPageSize").value === "20");
  // M11 El modo no va en los respaldos y restaurar no lo cambia
  setUiMode("completo");
  const snap = completeBackupSnapshot(localStorage);
  let valid = true; try { validateCompleteBackup(JSON.parse(JSON.stringify(snap))) } catch (e) { valid = false }
  restoreCompleteBackup(JSON.parse(JSON.stringify(snap)), localStorage);
  T.ok("M11 el modo es un ajuste del dispositivo: no va en el respaldo y restaurar no lo cambia", !(UI_MODE_KEY in snap.data) && valid && getUiMode() === "completo");
  setUiMode("simple");
  // M12 Los mensajes no mandan a herramientas ocultas
  setRecipes([{ id: "recipe_sinIng1", title: "Receta sin ingredientes", amountsTitle: null }]);
  go("plan"); await R.openPanel("planRecipeReference");
  $("planRecipeSelect").value = "recipe_sinIng1"; $("planRecipeAssign").click(); await wait(20);
  const assignMsg = $("planRecipeAssignStatus").textContent;
  go("ingredientes"); showRecipeView("browse"); showRecipeRead("recipe_sinIng1"); await wait(20);
  const readMsg = $("recipeReadIngredients").textContent;
  T.ok("M12 los mensajes indican Editar receta, no paneles ocultos", /Editar receta/.test(assignMsg) && !/Mis cantidades/.test(assignMsg) && /Editar receta/.test(readMsg) && !/Mis cantidades/.test(readMsg), assignMsg + " | " + readMsg);
  // M13 Un valor desconocido guardado no rompe: se usa el modo simple
  localStorage.setItem(UI_MODE_KEY, "raro"); applyUiMode();
  T.ok("M13 un valor desconocido del ajuste se toma como modo simple", getUiMode() === "simple" && document.documentElement.dataset.modo === "simple");
  closeRecipeRead(false); showRecipeView("browse");
  reset(); go("home");
  return T;
})()
