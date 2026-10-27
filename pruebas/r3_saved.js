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
  go("misplatos"); await wait(40);
  const list = document.getElementById("savedList"), box = list.querySelector("details.saved-recipes");
  const outside = [...list.children].filter(n => n.classList.contains("summary__line"));
  T.ok("G1a Mis platos separa platos y recetas del plan", outside.length === 1 && !!box && box.querySelector("summary").textContent === "📖 Recetas asignadas al plan (1)" && box.querySelectorAll(".summary__line").length === 1);
  T.ok("G1b el resumen cuenta platos y recetas por separado", document.getElementById("savedHint").textContent === "Tenés 1 plato guardado y 1 receta del plan en este dispositivo.", document.getElementById("savedHint").textContent);
  const card = box.querySelector(".summary__line");
  T.ok("G2 la tarjeta de receta muestra nombre e ingredientes", card.querySelector("strong").textContent === "📖 Papas al horno" && card.querySelector("li").textContent === "Ingredientes: Papa, Romero");
  go("ingredientes"); recipeDetailsEditing = "recipe_test0001"; renderRecipeDetails(); document.getElementById("recipeDetailsTitle").value = "Papas rústicas"; document.getElementById("recipeDetailsSave").click(); await wait(20);
  go("plan"); await wait(40);
  const planText = document.getElementById("planList").textContent;
  T.ok("G3a el plan muestra el nombre actual de la receta", planText.includes("📖 Papas rústicas") && !planText.includes("Papas al horno"));
  go("misplatos"); await wait(30);
  T.ok("G3b Mis platos también, sin reescribir lo guardado", document.querySelector("#savedList details.saved-recipes strong").textContent === "📖 Papas rústicas" && loadSaved().find(p => p.recipeSourceId).title === "Papas al horno");
  T.ok("G4a el plan muestra los ingredientes de la receta", planText.includes("Ingredientes: Papa, Romero"));
  const html = buildWeeklyPlanExport(loadPlan(), loadSaved(), "").html;
  T.ok("G4b la descarga del plan incluye los ingredientes", html.includes("<li>Ingredientes: Papa, Romero</li>"));
  const opts = [...document.querySelectorAll('#planList select option')].map(o => o.textContent);
  T.ok("G4c los selectores del plan marcan las recetas con 📖", opts.some(t => t.startsWith("📖 Papas rústicas")));
  savedQuery = "romero"; go("misplatos"); renderSaved(); await wait(20);
  const found = document.querySelector("#savedList details.saved-recipes");
  T.ok("G5 buscar por ingrediente encuentra la receta y abre su sección", !!found && found.open && /Ningún plato propio coincide/.test(document.getElementById("savedList").textContent));
  savedQuery = ""; renderSaved();
  document.getElementById("datedWeeksPanel").open = true; go("plan"); await wait(20);
  document.querySelector("[data-dated-save]").click(); await wait(30);
  T.ok("G6 la semana fechada muestra los ingredientes de la receta", document.getElementById("datedWeekView").textContent.includes("Ingredientes: Papa, Romero"));
  go("ingredientes"); recipeDetailsEditing = "recipe_test0001"; renderRecipeDetails(); document.getElementById("recipeDetailsDelete").click(); await wait(20);
  go("plan"); await wait(30);
  let err = null; try { renderPlan(); renderCompras(); renderSaved() } catch (e) { err = e.message }
  go("compras"); await wait(30);
  T.ok("G7 si se borra la receta, el plan usa el nombre guardado y Compras sus ingredientes", err === null && document.getElementById("planList").textContent.includes("📖 Papas al horno") && R.renderedRows().includes("Papa") && R.renderedRows().includes("Romero"), R.renderedRows().join(" | "));
  return T;
})()
