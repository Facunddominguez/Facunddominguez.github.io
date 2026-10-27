// INV-01 / SHOP-01 / SHOP-02 / MSG-01 battery: stable plan list + suggestions applied only by the user.
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setRecipes, recipePlate, tradPlate, setSaved, setPlan, setStock, criticalCase, item, renderedRows, IDEA1, IDEA2, IDEA3 } = R; const T = results();
  const sugText = () => [...document.querySelectorAll("#comprasList .shop-suggestion")].map(s => s.textContent);
  const click = async sel => { const b = document.querySelector(sel); if (!b) throw Error("no existe " + sel); b.click(); await wait(60) };
  // S1 critical case with exactly enough pantry for the recipe part
  criticalCase(); setStock([["Papa", 200, "g"]]); go("compras"); await wait(80);
  let papa = item("Papa");
  T.ok("S1a caso crítico: la papa sigue en la lista con ambas partes", papa && papa.label === "Papa: 200 g + sin cantidad en 1 plato" && renderedRows().includes("Papa: 200 g + sin cantidad en 1 plato"), papa && papa.label);
  T.ok("S1b la sugerencia avisa que falta revisar la parte sin cantidad y no tacha", papa.suggestion.kind === "info" && /Cubre lo que tiene cantidad; revisá si alcanza/.test(papa.suggestion.text) && !comprasDone[papa.key]);
  // S2 partial pantry -> Anotar / Deshacer
  setStock([["Papa", 50, "g"]]); renderCompras(); papa = item("Papa");
  T.ok("S2a con 50 g sugiere comprar 150 g y la lista no cambia", papa.label === "Papa: 200 g + sin cantidad en 1 plato" && papa.suggestion.kind === "partial" && papa.suggestion.buy === "150 g" && /más lo que no tiene cantidad/.test(papa.suggestion.text));
  await click('[data-shop-suggest-apply]');
  T.ok("S2b Anotar aplica la sugerencia solo en la fila", renderedRows().includes("Papa: 200 g + sin cantidad en 1 plato → comprar 150 g (sugerencia aplicada)") && sugText().some(t => /Aplicada: comprar 150 g/.test(t)));
  T.ok("S2c copiar usa el texto aplicado", comprasText().includes("• Papa: 200 g + sin cantidad en 1 plato → comprar 150 g (sugerencia aplicada)"));
  await click('[data-shop-suggest-undo]');
  T.ok("S2d Deshacer vuelve al texto del plan", renderedRows().includes("Papa: 200 g + sin cantidad en 1 plato") && !renderedRows().some(t => t.includes("sugerencia aplicada")));
  // S3 invariance: pantry, multiplier, prices and budget do not change the list
  const base = JSON.stringify(R.items().map(x => x.label));
  const baseRendered = JSON.stringify(renderedRows());
  setStock([["Papa", 1000, "g"], ["Merluza", 2, "unidad"]]);
  document.getElementById("shoppingPortionMultiplier").value = "3"; document.getElementById("shoppingPortionMultiplier").dispatchEvent(new Event("change", { bubbles: true }));
  localStorage.setItem("miPlatoFacil_referencePrices_v1", JSON.stringify({ pr1: { id: "pr1", name: "Papa", pack: "bolsa", amount: 1000, price: 1500, unit: "g", currency: "ARS", date: "2026-10-20" } }));
  localStorage.setItem("miPlatoFacil_shoppingBudget_v1", JSON.stringify({ currency: "ARS", limit: 30000 }));
  localStorage.setItem("miPlatoFacil_pantry", JSON.stringify(["tomate"]));
  renderCompras(); await wait(30);
  T.ok("S3 la lista es idéntica aunque cambien despensa, multiplicador, precios y presupuesto", JSON.stringify(R.items().map(x => x.label)) === base && JSON.stringify(renderedRows()) === baseRendered, baseRendered);
  // S3b budget estimate still uses pantry + multiplier (estimation panel, unchanged behaviour)
  document.getElementById("shoppingBudgetPanel").open = true; shoppingBudgetRender(); await wait(20);
  const budgetTxt = document.getElementById("shoppingBudgetResult").textContent;
  T.ok("S3b el presupuesto sigue estimando con despensa y multiplicador (sin cambios)", /Costo parcial estimado: 0,00 ARS/.test(budgetTxt), budgetTxt.slice(0, 80));
  document.getElementById("shoppingPortionMultiplier").value = "1"; document.getElementById("shoppingPortionMultiplier").dispatchEvent(new Event("change", { bubbles: true }));
  // S4 covered + Tachar; recipe-only ingredient
  reset();
  setAmounts({ [IDEA2]: { yield: 1, rows: [{ name: "Arroz", quantity: 300, unit: "g" }, { name: "Merluza", quantity: 2, unit: "unidad" }] } });
  setRecipes([{ id: "recipe_test0002", title: "Merluza con arroz", amountsTitle: IDEA2 }]);
  setSaved([recipePlate("rp2", "recipe_test0002", "Merluza con arroz", ["Arroz", "Merluza"])]); setPlan([["martes", "almuerzo", "rp2"]]);
  setStock([["Arroz", 500, "g"]]); go("compras"); await wait(60);
  const arroz = item("Arroz");
  T.ok("S4a despensa suficiente sugiere Tachar, sin tachar sola", arroz.label === "Arroz: 300 g" && arroz.suggestion.kind === "covered" && !comprasDone[arroz.key]);
  await click('[data-shop-suggest-tick]');
  T.ok("S4b Tachar marca la fila y el contador lo refleja", comprasDone[arroz.key] === true && /1 pendientes · 1 tachados/.test(document.getElementById("comprasSummary").textContent) && !renderedRows().some(t => t.startsWith("Arroz")), document.getElementById("comprasSummary").textContent);
  await click("#comprasShowAll");
  const cb = [...document.querySelectorAll("#comprasList [data-shop-key]")].find(x => x.dataset.shopKey === arroz.key);
  cb.click(); await wait(40);
  T.ok("S4c destildar en Todos lo vuelve a pendiente", !comprasDone[arroz.key] && /2 pendientes · 0 tachados/.test(document.getElementById("comprasSummary").textContent));
  await click("#comprasShowPending");
  // S5 two units, no conversion
  reset();
  setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Papa", quantity: 200, unit: "g" }, { name: "papa", quantity: 2, unit: "unidad" }, { name: "Sal", quantity: null, unit: "g" }] } });
  setRecipes([{ id: "recipe_test0001", title: "Papas", amountsTitle: IDEA1 }]);
  setSaved([recipePlate("rp1", "recipe_test0001", "Papas", ["Papa", "papa", "Sal"])]); setPlan([["lunes", "almuerzo", "rp1"]]);
  setStock([["Papa", 1, "kg"]]); renderCompras();
  T.ok("S5a dos unidades en una línea, sin convertir", item("Papa").label === "Papa: 200 g + 2 unidad", item("Papa").label);
  T.ok("S5b ingrediente de receta sin cantidad se muestra como tal", item("Sal") && item("Sal").label === "Sal");
  if (typeof convertQuantity === "function") {
    // From v14.9.79 (F02-01) 1 kg covers 200 g; "unidad" is never converted.
    T.ok("S5c despensa en kg cubre g; 'unidad' no se convierte", item("Papa").suggestion.kind === "partial" && item("Papa").suggestion.buy === "2 unidad" && !/sin convertir/.test(item("Papa").suggestion.text), item("Papa").suggestion.text);
  } else {
    T.ok("S5c despensa en otra unidad no se descuenta", item("Papa").suggestion.kind === "info" && /1 kg \(en otra unidad, sin convertir\)/.test(item("Papa").suggestion.text) && /unidad no coincide/.test(item("Papa").suggestion.text));
  }
  // S6 recipe whose quantities were unlinked + plan pointing to a deleted plate
  setRecipes([{ id: "recipe_test0001", title: "Papas", amountsTitle: null }]);
  const plan = loadPlan(); plan.martes.cena = "plato_borrado"; localStorage.setItem("miPlatoFacil_plan", JSON.stringify(plan));
  let err = null; try { renderCompras() } catch (e) { err = e.message }
  T.ok("S6 receta sin cantidades usa los nombres guardados; plato borrado no rompe", err === null && item("Papa").label === "Papa (×2)" && !!item("Sal"), item("Papa") && item("Papa").label);
  // S7 quotes in names: real click on the checkbox
  reset();
  setAmounts({ [IDEA3]: { yield: 1, rows: [{ name: 'Queso "cremoso"', quantity: 100, unit: "g" }] } });
  setRecipes([{ id: "recipe_test0003", title: "Risotto", amountsTitle: IDEA3 }]);
  setSaved([recipePlate("rp3", "recipe_test0003", "Risotto", ['Queso "cremoso"'])]); setPlan([["lunes", "cena", "rp3"]]);
  go("compras"); await wait(60);
  window.__r2_quoteKey = item('Queso "cremoso"').key;
  // S8 stale applied suggestion is dropped when pantry changes
  criticalCase(); setStock([["Papa", 50, "g"]]); renderCompras();
  await click('[data-shop-suggest-apply]');
  setStock([["Papa", 120, "g"]]); renderCompras(); papa = item("Papa");
  T.ok("S8 si cambia la despensa, la sugerencia aplicada vieja se descarta", !papa.applied && papa.suggestion.buy === "80 g" && !renderedRows().some(t => t.includes("sugerencia aplicada")));
  // S9 traditional-only list identical to the previous algorithm
  reset();
  setSaved([tradPlate("t1", ["Papa", "Arroz (integral, yamaní)"], ["Tomate", "Lechuga"], ["Merluza"]), tradPlate("t2", ["Papa"], ["Tomate"], ["Pollo (pechuga, muslo, pata-muslo)"])]);
  setPlan([["lunes", "almuerzo", "t1"], ["martes", "cena", "t2"], ["miercoles", "cena", "t1"]]);
  // Reference oracle: the v14.9.74 buildShopping() algorithm, copied here (the app no longer needs it).
  const refMap = new Map(); planItemsFlat().forEach(it => extractIngredients(it).forEach(name => { const key = normalizeSearchText(name); if (!refMap.has(key)) refMap.set(key, { name, count: 0 }); refMap.get(key).count++ }));
  const oldLabels = [...refMap.values()].sort((a, b) => a.name.localeCompare(b.name)).map(x => x.name + (x.count > 1 ? " (×" + x.count + ")" : "")).sort((a, b) => a.localeCompare(b, "es"));
  T.ok("S9 lista solo de platos tradicionales idéntica a v14.9.74", JSON.stringify(R.items().map(x => x.label)) === JSON.stringify(oldLabels), oldLabels.join(" | "));
  // S10 unknown-only item with pantry, and chip mark without pantry
  setStock([["Tomate", 2, "unidad"]]); localStorage.setItem("miPlatoFacil_pantry", JSON.stringify(["hojas"])); renderCompras();
  T.ok("S10a despensa en ingrediente sin cantidad: solo informa", item("Tomate").suggestion.kind === "info" && /El plan no indica cantidad/.test(item("Tomate").suggestion.text));
  T.ok("S10b marca de 'Con lo que tengo' se informa", /Lo marcaste en “Con lo que tengo”/.test(item("Lechuga").suggestion.text));
  // S11 corrupted recipe data only blocks the list when the plan uses recipes
  localStorage.setItem("miPlatoFacil_recipeDetails_v1", '{"recipe_x":{"id":"otro"}}'); renderCompras();
  T.ok("S11a con recetas dañadas, un plan sin recetas sigue mostrando la lista", renderedRows().length > 0);
  criticalCase(); localStorage.setItem("miPlatoFacil_recipeDetails_v1", '{"recipe_x":{"id":"otro"}}'); renderCompras();
  T.ok("S11b si el plan usa recetas dañadas, avisa en vez de omitir", /No se pudo calcular la lista: No se pudieron leer los detalles guardados/.test(document.getElementById("comprasList").textContent));
  // S12 MSG-01: assignment message and hint
  reset();
  setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Papa", quantity: 200, unit: "g" }] } }); setRecipes([{ id: "recipe_test0001", title: "Papas al horno", amountsTitle: IDEA1 }]);
  window.confirm = () => true; document.getElementById("planRecipeReference").open = true; renderPlanRecipeReference();
  document.getElementById("planRecipeSelect").value = "recipe_test0001"; document.getElementById("planRecipeDay").value = "jueves"; document.getElementById("planRecipeSlot").value = "cena";
  assignSavedRecipeToPlan(); go("compras"); await wait(40);
  T.ok("S12 mensajes actualizados (asignación e indicación de Compras)", /cantidades registradas en la receta/.test(document.getElementById("planRecipeAssignStatus").textContent) && /no la cambian/.test(document.getElementById("comprasHint").textContent) && item("Papa").label === "Papa: 200 g");
  // Prepare S7 for a real click (left for the next step)
  reset();
  setAmounts({ [IDEA3]: { yield: 1, rows: [{ name: 'Queso "cremoso"', quantity: 100, unit: "g" }] } });
  setRecipes([{ id: "recipe_test0003", title: "Risotto", amountsTitle: IDEA3 }]);
  setSaved([recipePlate("rp3", "recipe_test0003", "Risotto", ['Queso "cremoso"'])]); setPlan([["lunes", "cena", "rp3"]]);
  go("compras"); await wait(60);
  return T;
})()
