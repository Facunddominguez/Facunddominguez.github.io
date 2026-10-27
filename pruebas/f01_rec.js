// F01-03/05/06/07/08 battery: structured recipes in one editor.
(async () => {
  const R = window.R2, { wait, results, reset } = R; const T = results();
  window.confirm = () => true;
  reset();
  const $ = id => document.getElementById(id);
  const rowsBox = () => $("recipeIngredientRows");
  const fill = (row, name, q, u) => { row.querySelector("[data-amount-name]").value = name; row.querySelector("[data-amount-quantity]").value = q; row.querySelector("[data-amount-unit]").value = u };
  go("ingredientes"); await wait(30);
  $("recipeViewCreate").click(); await wait(20);
  T.ok("E0 el formulario nuevo trae ingredientes, etiquetas, tiempo y reemplazos vacíos", rowsBox().children.length === 0 && $("recipeTags").value === "" && $("recipeMinutes").value === "" && $("recipeSubstitutions").value === "" && $("recipeYield").value === "1");
  $("recipeDetailsTitle").value = "Papas rústicas"; $("recipeDetailsSteps").value = "Cortar\nHornear";
  $("recipeIngredientAdd").click(); $("recipeIngredientAdd").click(); await wait(10);
  fill(rowsBox().children[0], "Papa", "300", "g"); fill(rowsBox().children[1], "Sal", "", "g");
  $("recipeYield").value = "2"; $("recipeTags").value = "rápido, horno, rápido"; $("recipeMinutes").value = "30"; $("recipeSubstitutions").value = "Papa = Batata";
  $("recipeDetailsSave").click(); await wait(20);
  const all = loadRecipeDetails(), r = Object.values(all).find(x => x.title === "Papas rústicas"), amounts = loadRecipeAmounts();
  T.ok("E1 guardar crea la receta con ingredientes, porciones, etiquetas, tiempo y reemplazos", !!r && r.amountsTitle === "receta:" + r.id && amounts[r.amountsTitle].yield === 2 && amounts[r.amountsTitle].rows.length === 2 && amounts[r.amountsTitle].rows[1].quantity === null && JSON.stringify(r.tags) === '["rápido","horno"]' && r.minutes === 30 && r.substitutions[0].to === "Batata" && /con sus ingredientes/.test($("recipeDetailsStatus").textContent), $("recipeDetailsStatus").textContent);
  recipeDetailsEditing = null; resetRecipeDetailsForm(); recipeDetailsEditing = r.id; renderRecipeDetails();
  T.ok("E2 abrir la receta recupera todos los campos", rowsBox().children.length === 2 && $("recipeYield").value === "2" && $("recipeTags").value === "rápido, horno" && $("recipeMinutes").value === "30" && $("recipeSubstitutions").value === "Papa = Batata");
  rowsBox().children[0].querySelector("[data-amount-quantity]").value = "400"; $("recipeDetailsSave").click(); await wait(20);
  T.ok("E3 editar cantidades actualiza la misma clave", Object.keys(loadRecipeAmounts()).length === 1 && loadRecipeAmounts()[r.amountsTitle].rows[0].quantity === 400);
  const before = localStorage.getItem("miPlatoFacil_recipeDetails_v1");
  $("recipeMinutes").value = "abc"; $("recipeDetailsSave").click(); await wait(10); const m1 = $("recipeDetailsStatus").textContent;
  $("recipeMinutes").value = "30"; $("recipeSubstitutions").value = "Papa Batata"; $("recipeDetailsSave").click(); await wait(10); const m2 = $("recipeDetailsStatus").textContent;
  T.ok("E4 datos inválidos avisan y no guardan", /entre 1 y 1440/.test(m1) && /Ingrediente = Reemplazo/.test(m2) && localStorage.getItem("miPlatoFacil_recipeDetails_v1") === before, m1 + " / " + m2);
  $("recipeSubstitutions").value = "Papa = Batata";
  // Catalog: tags searchable, time shown, time filter
  showRecipeView("browse"); $("recipeCatalogSearch").value = "horno"; recipeCatalogPage = 0; renderRecipeCatalog();
  const card = [...document.querySelectorAll("#recipeCatalogResults .recipe-catalog-card")].find(c => c.querySelector("strong").textContent === "Papas rústicas");
  T.ok("E5a buscar por etiqueta encuentra la receta y muestra tiempo y etiquetas", !!card && /⏱ 30 min/.test(card.textContent) && [...card.querySelectorAll(".tag-chip")].map(x => x.textContent).join(",") === "rápido,horno");
  $("recipeCatalogSearch").value = ""; $("recipeCatalogTime").value = "15"; $("recipeCatalogTime").dispatchEvent(new Event("change")); await wait(10);
  const c15 = $("recipeCatalogCount").textContent;
  $("recipeCatalogTime").value = "30"; $("recipeCatalogTime").dispatchEvent(new Event("change")); await wait(10);
  const titles30 = [...document.querySelectorAll("#recipeCatalogResults strong")].map(s => s.textContent);
  T.ok("E5b filtro por tiempo: 15 min la excluye, 30 min la incluye (las ideas sin tiempo no entran)", /^0 resultados/.test(c15) && titles30.length === 1 && titles30[0] === "Papas rústicas", c15 + " / " + titles30.join(","));
  $("recipeCatalogTime").value = ""; renderRecipeCatalog();
  // Read view with substitutions and pantry note
  R.setStock([["Batata", 500, "g"]]);
  showRecipeRead(r.id);
  T.ok("E6 la lectura muestra tiempo, etiquetas y reemplazos con la despensa", /⏱ 30 min · Etiquetas: rápido, horno/.test($("recipeReadMeta").textContent) && /Papa → Batata \(en tu despensa: 500 g\)/.test($("recipeReadSubstitutions").textContent), $("recipeReadMeta").textContent + " | " + $("recipeReadSubstitutions").textContent);
  // Variants
  duplicateRecipeFromButton(r.id); await wait(10);
  const all2 = loadRecipeDetails(), copy = Object.values(all2).find(x => x.title === "Copia de Papas rústicas");
  T.ok("E7a duplicar crea una variante con etiquetas, tiempo y reemplazos", !!copy && copy.variantOf === r.id && copy.minutes === 30 && copy.tags.length === 2 && copy.substitutions.length === 1);
  closeRecipeRead(false); showRecipeView("browse"); showRecipeRead(copy.id);
  const metaCopy = $("recipeReadMeta").textContent;
  closeRecipeRead(false); showRecipeRead(r.id);
  T.ok("E7b la lectura muestra 'Variante de' y 'Otras versiones'", /Variante de: Papas rústicas/.test(metaCopy) && /Otras versiones: Copia de Papas rústicas/.test($("recipeReadMeta").textContent), metaCopy + " | " + $("recipeReadMeta").textContent);
  closeRecipeRead(false);
  // Substitutions in recommendations
  const score = recipePantryScore({ kind: "propia", key: r.id }, loadRecipeDetails(), loadRecipeAmounts(), pantryMarkedMatcher(), loadStockQuantities());
  T.ok("E8 recomendaciones sugieren el reemplazo disponible", score.subs.length === 1 && /Papa → Batata \(tenés 500 g\)/.test(score.subs[0]), JSON.stringify(score.subs));
  $("recipeRecommendPantry").checked = true; renderRecipeCatalog();
  T.ok("E8b la tarjeta muestra 'Reemplazos disponibles'", /Reemplazos disponibles: Papa → Batata/.test($("recipeCatalogResults").textContent));
  $("recipeRecommendPantry").checked = false; renderRecipeCatalog();
  // Start from an idea: ingredients proposed without quantities
  startRecipeFromIdea("Bowl de quinoa + pollo grillado + brócoli y zanahoria");
  const proposed = [...rowsBox().querySelectorAll("[data-amount-name]")].map(i => i.value);
  T.ok("E9 'Usar idea como base' propone ingredientes sin inventar cantidades", proposed.join(",") === "Quinoa,Pollo,Brócoli,Zanahoria" && [...rowsBox().querySelectorAll("[data-amount-quantity]")].every(i => i.value === ""));
  $("recipeDetailsSave").click(); await wait(20);
  const bowl = Object.values(loadRecipeDetails()).find(x => x.title === "Bowl de quinoa + pollo grillado + brócoli y zanahoria");
  // Assign to plan: Compras uses the inline ingredients
  document.getElementById("planRecipeReference").open = true; renderPlanRecipeReference();
  $("planRecipeSelect").value = r.id; $("planRecipeDay").value = "lunes"; $("planRecipeSlot").value = "almuerzo"; assignSavedRecipeToPlan();
  $("planRecipeSelect").value = bowl.id; $("planRecipeDay").value = "martes"; $("planRecipeSlot").value = "almuerzo"; assignSavedRecipeToPlan();
  go("compras"); await wait(30);
  T.ok("E10 el plan usa los ingredientes cargados en la receta", R.renderedRows().includes("Papa: 400 g") && R.renderedRows().includes("Sal") && R.renderedRows().includes("Quinoa"), R.renderedRows().join(" | "));
  // Backup validity and rejection of invalid new fields
  let berr = null; try { validateCompleteBackup(completeBackupSnapshot(localStorage)) } catch (e) { berr = e.message }
  const badStore = JSON.parse(localStorage.getItem("miPlatoFacil_recipeDetails_v1")); badStore[r.id].minutes = 0;
  T.ok("E11 respaldo válido; tiempo inválido se rechaza", berr === null && validRecipeDetails(badStore) === false, berr);
  // Rollback when saving the recipe fails
  go("ingredientes"); recipeDetailsEditing = r.id; renderRecipeDetails(); rowsBox().children[0].querySelector("[data-amount-quantity]").value = "999";
  const realSet = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === "miPlatoFacil_recipeDetails_v1") throw new DOMException("quota", "QuotaExceededError"); return realSet.call(this, k, v) };
  $("recipeDetailsSave").click(); await wait(10); Storage.prototype.setItem = realSet;
  T.ok("E12 si falla guardar la receta, los ingredientes vuelven a su valor anterior", loadRecipeAmounts()[r.amountsTitle].rows[0].quantity === 400 && /No se pudo guardar la receta/.test($("recipeDetailsStatus").textContent));
  rowsBox().children[0].querySelector("[data-amount-quantity]").value = "abc";
  let dupErr = null; try { rowsBox().children[0].querySelectorAll("button")[2].click() } catch (e) { dupErr = e.message }
  T.ok("E13 'Duplicar' una fila con cantidad inválida no rompe", dupErr === null && rowsBox().children.length === 3 && rowsBox().children[1].querySelector("[data-amount-quantity]").value === "");
  const BOWL = "Bowl de quinoa + pollo grillado + brócoli y zanahoria";
  const stored = loadRecipeAmounts(); stored[BOWL] = { yield: 2, rows: [{ name: "Quinoa", quantity: 100, unit: "g" }, { name: "Pollo", quantity: 200, unit: "g" }, { name: "Brócoli", quantity: 1, unit: "unidad" }, { name: "Zanahoria", quantity: 2, unit: "unidad" }] };
  localStorage.setItem("miPlatoFacil_recipeAmounts_v1", JSON.stringify(stored));
  await R.openPanel("recipeAmountsPanel"); const sel = $("amountRecipe"); sel.value = BOWL; sel.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  T.ok("E14 'Mis cantidades por receta' carga todas las filas guardadas", document.querySelectorAll("#amountRows .amount-row").length === 4 && [...document.querySelectorAll("#amountRows [data-amount-name]")].map(i => i.value).join(",") === "Quinoa,Pollo,Brócoli,Zanahoria");
  window.__f01rec_storage = JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
  return T;
})()
