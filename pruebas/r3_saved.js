// REC-02 / P1-03 battery: recipes separated from plates; current names and ingredients shown.
(async () => {
  const R = window.R2, { wait, results, reset, IDEA1 } = R; const T = results();
  window.confirm = () => true;
  reset();
  R.setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Papa", quantity: 200, unit: "g" }, { name: "Romero", quantity: null, unit: "g" }] } });
  R.setRecipes([{ id: "recipe_test0001", title: "Papas al horno", amountsTitle: IDEA1 }]);
  R.setSaved([R.tradPlate("tp1", ["Arroz"], ["Tomate"], ["Merluza"])]);
  R.setPlan([["lunes", "cena", "tp1"]]);
  document.getElementById("planRecipeReference").open = true; renderPlanRecipeReference();
  document.getElementById("planRecipeSelect").value = "recipe_test0001"; document.getElementById("planRecipeDay").value = "lunes"; document.getElementById("planRecipeSlot").value = "almuerzo";
  assignSavedRecipeToPlan();
  // v14.9.92: Mis comidas muestra platos y recetas propias en secciones; la copia que crea el plan
  // no se repite como receta (queda en "Copias de recetas usadas en el plan", visible en el modo completo).
  go("misplatos"); await wait(40);
  const list = document.getElementById("savedList"), box = list.querySelector("details.saved-recipes");
  const plateCards = [...list.children].filter(n => n.classList.contains("summary__line") && !n.classList.contains("recipe-lib-card"));
  const recipeCards = [...list.querySelectorAll(".recipe-lib-card")];
  T.ok("G1a Mis comidas separa platos y recetas, sin repetir la copia del plan", plateCards.length === 1 && recipeCards.length === 1 && recipeCards[0].dataset.recipeId === "recipe_test0001" && !!box && box.querySelectorAll(".summary__line").length === 1 && box.getClientRects().length === 0);
  T.ok("G1b el resumen cuenta platos y recetas por separado", document.getElementById("savedHint").textContent === "Tenés 1 plato y 1 receta guardados en este dispositivo.", document.getElementById("savedHint").textContent);
  const card = recipeCards[0];
  T.ok("G2 la tarjeta de receta muestra nombre e ingredientes", card.querySelector("strong").textContent === "📖 Papas al horno" && card.querySelector("li").textContent === "Ingredientes: Papa, Romero");
  go("ingredientes"); recipeDetailsEditing = "recipe_test0001"; renderRecipeDetails(); document.getElementById("recipeDetailsTitle").value = "Papas rústicas"; document.getElementById("recipeDetailsSave").click(); await wait(20);
  // v15.1: la Semana muestra un día a la vez; el plan de la prueba está en el lunes.
  planDiaElegido = "lunes"; go("plan"); await wait(40);
  const planText = document.getElementById("planList").textContent;
  T.ok("G3a el plan muestra el nombre actual de la receta", planText.includes("📖 Papas rústicas") && !planText.includes("Papas al horno"));
  go("misplatos"); await wait(30);
  T.ok("G3b Mis comidas también (receta y copia del plan), sin reescribir lo guardado", document.querySelector("#savedList .recipe-lib-card strong").textContent === "📖 Papas rústicas" && document.querySelector("#savedList details.saved-recipes strong").textContent === "📖 Papas rústicas" && loadSaved().find(p => p.recipeSourceId).title === "Papas al horno");
  T.ok("G4a el plan muestra los ingredientes de la receta", planText.includes("Ingredientes: Papa, Romero"));
  const html = buildWeeklyPlanExport(loadPlan(), loadSaved(), "").html;
  T.ok("G4b la descarga del plan incluye los ingredientes", html.includes("<li>Ingredientes: Papa, Romero</li>"));
  abrirSelector("lunes", "cena"); await wait(20);
  const opts = [...hoja.elemento.querySelectorAll('[data-selector-seccion="mias"] .selector-item__nombre')].map(o => o.textContent); hoja.cerrar();
  T.ok("G4c los selectores del plan marcan las recetas con 📖", opts.some(t => t.startsWith("📖 Papas rústicas")));
  savedQuery = "romero"; go("misplatos"); renderSaved(); await wait(20);
  const found = document.querySelector("#savedList .recipe-lib-card");
  T.ok("G5 buscar por ingrediente encuentra la receta", !!found && found.dataset.recipeId === "recipe_test0001" && /Ningún plato coincide/.test(document.getElementById("savedList").textContent));
  savedQuery = ""; renderSaved();
  document.getElementById("datedWeeksPanel").open = true; go("plan"); await wait(20);
  document.querySelector("[data-dated-save]").click(); await wait(30);
  T.ok("G6 la semana fechada muestra los ingredientes de la receta", document.getElementById("datedWeekView").textContent.includes("Ingredientes: Papa, Romero"));
  go("ingredientes"); recipeDetailsEditing = "recipe_test0001"; renderRecipeDetails(); document.getElementById("recipeDetailsDelete").click(); await wait(20);
  planDiaElegido = "lunes"; go("plan"); await wait(30);
  let err = null; try { renderPlan(); renderCompras(); renderSaved() } catch (e) { err = e.message }
  go("compras"); await wait(30);
  T.ok("G7 si se borra la receta, el plan usa el nombre guardado y Compras sus ingredientes", err === null && document.getElementById("planList").textContent.includes("📖 Papas al horno") && R.renderedRows().includes("Papa") && R.renderedRows().includes("Romero"), R.renderedRows().join(" | "));
  return T;
})()
