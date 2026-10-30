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
  // v15.3: la misma lista de ids, repartida por la pantalla de su tema (antes las tres estaban en "ingredientes").
  const expected = {
    compras: ["comprasPresupuesto"],
    ingredientes: ["pantryReviewPanel"],
    recetaEditar: ["recipeAmountsPanel"],
    preferencias: ["ingredientAliasPanel"],
    ideas: [], comida: [], backupScreen: [],
    plan: ["varSelect", "monthlyPlanPanel", "datedWeeksPanel", "datedEditPanel", "planHistoryPanel", "habitGoalsPanel"]
  };
  const visibleAdvanced = [];
  for (const [screen, ids] of Object.entries(expected)) {
    go(screen); if (screen === "ideas") showRecipeView("browse");
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
  // v15.4: la lista, agregar producto, el interruptor y Terminé de comprar en la vista; Compartir, Copiar y las
  // herramientas de compras en el menú ⋯ (en los dos modos), cada una visible y con sus controles.
  for (const sel of ["#comprasList", "#manualShoppingPanel", "#comprasDescontar", "#comprasBought"]) if (!shown(document.querySelector(sel))) essentials.push(sel);
  const herramientasCompras = async () => {
    let ok = true;
    for (const [herr, sels] of [["compartir", ["[data-share-compras]", "[data-copy-compras]"]], ["realizadas", ["#purchasesPanel", "#purchaseSave", "#purchaseFromList"]], ["presupuesto", ["#shoppingBudgetPanel", "#shoppingBudgetSave"]], ["precios", ["#pricePanel", "#priceForm"]], ["costoReceta", ["#recipeCostPanel", "#recipeCostPrepare"]], ["otrasRecetas", ["#quantShoppingPanel", "#quantShoppingCalculate", "#stockDeductionPanel", "#stockPrepare"]], ["existencias", ["#shoppingQuantCostPanel", "#shoppingPortionMultiplier", "#stockSave"]]]) {
      go("compras"); await wait(20); document.querySelector("#compras [data-compras-menu]").click(); await wait(30);
      const b = document.querySelector('.hoja [data-compras-herr="' + herr + '"]');
      if (!shown(b)) { essentials.push("menú ⋯ de Compras sin " + herr); ok = false; hoja.cerrar(); continue }
      b.click(); await wait(60);
      const faltan = sels.filter(s => !shown(document.querySelector(s))); if (faltan.length) { essentials.push(...faltan); ok = false }
    }
    go("compras"); await wait(20); return ok
  };
  await herramientasCompras();
  // v15.3: los mismos elementos, cada uno en su pantalla (despensa, Ideas, Preferencias y Fuentes de datos).
  for (const [pant, sels] of [["ingredientes", ["#pantryChips"]], ["ideas", ["#recipeCatalogSearch", "#recipeCatalogTime", "#aiIdeasPanel", "#recipeCatalogResults", "#recipeViewCreate"]], ["preferencias", ["#recipeAvoidWords"]], ["fuentes", ["#nutritionLookupPanel"]]]) {
    go(pant); if (pant === "ideas") showRecipeView("browse"); openAll(pant); await wait(30);
    for (const sel of sels) if (!shown(document.querySelector(sel))) essentials.push(sel)
  }
  // Desde la v15.1 la Semana muestra el día elegido y lo ocasional está en su menú ⋯ (en los dos modos):
  // lo esencial se alcanza desde la Semana, se ve y muestra sus datos.
  go("plan"); await wait(30);
  for (const sel of ["#currentPlanPanel", "#planList", "#planList [data-hueco]"]) if (!shown(document.querySelector("#plan " + sel.replace("#plan ", "")))) essentials.push(sel);
  const menuSemana = async () => { document.querySelector("#plan [data-plan-menu]").click(); await wait(30) };
  const porMenu = async (herr, sels) => {
    await menuSemana(); const b = document.querySelector(".hoja [data-plan-herr=\"" + herr + "\"]");
    if (!shown(b)) { essentials.push("menú ⋯ sin " + herr); hoja.cerrar(); return false }
    b.click(); await wait(80); const faltan = sels.filter(s => !shown(document.querySelector(s))); essentials.push(...faltan); return !faltan.length
  };
  // Las herramientas de la Semana (variaciones, semanas por fecha y mes, historial) se alcanzan desde el menú ⋯.
  const herramientasPlan = async () => { const r = []; r.push(await porMenu("variaciones", ["#varSelect", "#planHerramientas [data-del-var]"])); r.push(await porMenu("semanas", ["#monthlyPlanPanel", "#datedWeeksPanel"])); r.push(await porMenu("historial", ["#planHistoryPanel", "#planHistoryList"])); go("plan"); await wait(20); return r.every(Boolean) };
  await menuSemana(); if (!shown(document.querySelector(".hoja [data-clear-plan]"))) essentials.push("[data-clear-plan]"); hoja.cerrar();
  // Buscar en mis recetas: busca por nombre y encuentra la receta.
  await porMenu("recetas", ["#planRecipeReference", "#planRecipeSelect", "#planRecipeSearch"]);
  $("planRecipeSearch").value = "Papas"; $("planRecipeSearch").dispatchEvent(new Event("input", { bubbles: true })); await wait(20);
  if ($("planRecipeSelect").value !== recipeId) essentials.push("Buscar en mis recetas no encontró la receta");
  $("planRecipeSearch").value = ""; $("planRecipeSearch").dispatchEvent(new Event("input", { bubbles: true }));
  // Lo que comí: registra una comida escrita a mano.
  await porMenu("consumo", ["#consumptionPanel", "#consumptionSave", "#consumptionView"]);
  const registrosAntes = loadConsumption().length;
  $("consumptionMeal").value = "merienda"; $("consumptionPlate").value = ""; $("consumptionText").value = "Prueba de modo simple"; $("consumptionSave").click(); await wait(20);
  if (loadConsumption().length !== registrosAntes + 1 || !/1 comida registrada|comidas registradas/.test($("consumptionView").textContent)) essentials.push("Lo que comí no registró");
  // Descargar: pide la descarga del plan (sin bajar nada de verdad).
  await porMenu("descargar", ["[data-download-week]"]);
  const blobs = [], crear = URL.createObjectURL, clic = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = b => { blobs.push(b); return crear.call(URL, b) }; HTMLAnchorElement.prototype.click = function () { };
  try { document.querySelector("[data-download-week]").click(); await wait(20) } finally { URL.createObjectURL = crear; HTMLAnchorElement.prototype.click = clic }
  if (blobs.length !== 1 || !(await blobs[0].text()).includes("Papas al horno")) essentials.push("Descargar no generó el plan");
  // Las herramientas de la Semana también se alcanzan en modo simple.
  if (!(await herramientasPlan())) essentials.push("herramientas de la Semana en modo simple");
  const planHerrSimple = true;
  go("plan"); await wait(20);
  T.ok("M3 lo esencial sigue visible (lista, extras, recetas, plan, lo que comí)", essentials.length === 0, essentials.join(", "));
  // M4 Cada pantalla avisa qué está oculto y que los datos siguen guardados
  // Semana (desde la v15.1) no oculta nada: no lleva aviso y su menú ⋯ lista todas sus herramientas.
  // v15.3: cada pantalla nueva que oculta herramientas tiene su aviso con el botón.
  const notes = ["compras", "ingredientes", "ideas", "comida", "recetaEditar", "preferencias", "backupScreen"].map(id => document.querySelector("#" + id + " [data-mode-note]"));
  await menuSemana(); const itemsMenu = [...document.querySelectorAll(".hoja .menu-semana button")].filter(shown).map(b => b.textContent); hoja.cerrar();
  const menuCompleto = ["Repetir semana anterior", "Copiar un día", "Vaciar la semana", "Planes guardados", "Semanas anteriores y mes", "Historial de cambios", "Descargar", "Buscar en mis recetas", "Lo que comí y objetivos"].every(t => itemsMenu.includes(t));
  T.ok("M4 aviso en Compras y Recetas con lo que está oculto; Semana no oculta nada y su menú lo lista todo", notes.every(n => n && /Tus datos siguen guardados/.test(n.textContent) && n.querySelector("button").textContent === "Mostrar herramientas avanzadas") && /presupuesto/.test(notes[0].textContent) && notes[0].parentElement === $("compras") && !document.querySelector("#plan [data-mode-note]") && menuCompleto, notes.map(n => n && n.textContent.slice(0, 60)).join(" | ") + " | " + itemsMenu.join(", "));
  // M5 Tarjeta en Configuración: cambia el modo y lo recuerda
  const card = $("uiModeToggle");
  const inSettings = !!card && $("preferencias").contains(card) && card.classList.contains("tool-button");
  const before = appData();
  const label1 = card.querySelector(".tool-button__label").textContent;
  card.click(); await wait(20);
  const label2 = card.querySelector(".tool-button__label").textContent;
  T.ok("M5 la tarjeta de Configuración activa el modo completo y lo recuerda", inSettings && label1 === "Modo simple: activado" && label2 === "Modo simple: desactivado" && getUiMode() === "completo" && localStorage.getItem(UI_MODE_KEY) === "completo" && document.documentElement.dataset.modo === "completo", label1 + " → " + label2);
  // M6 En modo completo se ve todo otra vez
  go("compras"); await wait(20);
  const toolsShown = shown($("comprasPresupuesto")) && await herramientasCompras();
  // Semana: las mismas herramientas desde el menú ⋯, en modo completo y (ya comprobado en M3) en modo simple.
  const planShown = planHerrSimple && await herramientasPlan();
  let ingShown = true;
  for (const [pant, id] of [["ingredientes", "pantryReviewPanel"], ["recetaEditar", "recipeAmountsPanel"], ["preferencias", "ingredientAliasPanel"], ["ideas", "recipeRecommendPantry"]]) {
    go(pant); if (pant === "ideas") showRecipeView("browse"); openAll(pant); await wait(20);
    if (!shown($(id))) ingShown = false
  }
  T.ok("M6 en modo completo vuelven a verse todas las herramientas", toolsShown && planShown && ingShown && notes.every(n => n.querySelector("button").textContent === "Ocultar herramientas avanzadas"));
  // M7 El aviso de cada pantalla vuelve al modo simple
  notes[0].querySelector("button").click(); await wait(20); go("compras"); await wait(20);
  T.ok("M7 el botón del aviso vuelve al modo simple", getUiMode() === "simple" && localStorage.getItem(UI_MODE_KEY) === "simple" && !shown($("comprasPresupuesto")) && card.querySelector(".tool-button__label").textContent === "Modo simple: activado");
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
