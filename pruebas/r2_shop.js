// INV-01 / SHOP-01 / SHOP-02 / MSG-01 battery: stable plan list + suggestions applied only by the user.
// Desde la v15 (Etapa 1) la lista tiene grupos: Pendientes, "Ya tenés" (en la despensa y alcanza, o sin cantidad para
// comparar) y "Ya en tu despensa" (lo pasado con Lo compré). Juntos son siempre los mismos ítems con las cantidades
// del plan; "Anotar" se integró como "faltan X" y "Tachar" como el grupo "Ya tenés".
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setRecipes, recipePlate, tradPlate, setSaved, setPlan, setStock, criticalCase, item, renderedRows, IDEA1, IDEA2, IDEA3 } = R; const T = results();
  const grupo = name => (item(name) || {}).group;
  const keysEnPantalla = () => JSON.stringify([...document.querySelectorAll("#comprasList [data-shop-key]")].map(c => c.dataset.shopKey).sort());
  const grupos = () => JSON.stringify(R.items().map(x => x.key + ":" + x.group));
  const click = async sel => { const b = document.querySelector(sel); if (!b) throw Error("no existe " + sel); b.click(); await wait(60) };
  // S1 critical case with exactly enough pantry for the recipe part
  criticalCase(); setStock([["Papa", 200, "g"]]); go("compras"); await wait(80);
  let papa = item("Papa");
  T.ok("S1a caso crítico: la papa sigue en la lista con ambas partes", papa && papa.label === "Papa: 200 g + sin cantidad en 1 plato" && renderedRows().includes("Papa: 200 g + sin cantidad en 1 plato"), papa && papa.label);
  T.ok("S1b la sugerencia avisa que falta revisar la parte sin cantidad y no tacha", papa.suggestion.kind === "info" && /Cubre lo que tiene cantidad; revisá si alcanza/.test(papa.suggestion.text) && !comprasDone[papa.key] && papa.group === "tenes" && /Ya tenés \(1\)/.test(document.getElementById("comprasList").textContent));
  // S2 partial pantry -> "faltan X" en Pendientes (antes: Anotar / Deshacer)
  setStock([["Papa", 50, "g"]]); renderCompras(); papa = item("Papa");
  T.ok("S2a con 50 g sugiere comprar 150 g y la lista no cambia", papa.label === "Papa: 200 g + sin cantidad en 1 plato" && papa.suggestion.kind === "partial" && papa.suggestion.buy === "150 g" && /más lo que no tiene cantidad/.test(papa.suggestion.text) && papa.group === "pendiente");
  T.ok("S2b la fila pendiente dice cuánto falta", renderedRows().includes("Papa: 200 g + sin cantidad en 1 plato · faltan 150 g") && !renderedRows().includes("Papa: 200 g + sin cantidad en 1 plato"));
  T.ok("S2c copiar usa el texto con lo que falta", comprasText().includes("• Papa: 200 g + sin cantidad en 1 plato · faltan 150 g"));
  setStock([["Papa", 200, "g"]]); renderCompras();
  T.ok("S2d si la despensa alcanza, vuelve al texto del plan, pasa a Ya tenés y no se copia", item("Papa").group === "tenes" && renderedRows().includes("Papa: 200 g + sin cantidad en 1 plato") && !renderedRows().some(t => t.includes("faltan")) && !comprasText().includes("Papa"));
  // S3 invariance: los tres grupos juntos son la misma lista aunque cambien despensa, multiplicador, precios y
  // presupuesto; multiplicador, precios y presupuesto no mueven nada entre grupos.
  setStock([["Papa", 50, "g"]]); renderCompras();
  const base = JSON.stringify(R.items().map(x => x.label)), baseKeys = keysEnPantalla(), baseGroups = grupos();
  document.getElementById("shoppingPortionMultiplier").value = "3"; document.getElementById("shoppingPortionMultiplier").dispatchEvent(new Event("change", { bubbles: true }));
  localStorage.setItem("miPlatoFacil_referencePrices_v1", JSON.stringify({ pr1: { id: "pr1", name: "Papa", pack: "bolsa", amount: 1000, price: 1500, unit: "g", currency: "ARS", date: "2026-10-20" } }));
  localStorage.setItem("miPlatoFacil_shoppingBudget_v1", JSON.stringify({ currency: "ARS", limit: 30000 }));
  renderCompras(); await wait(30);
  const sameGroups = grupos() === baseGroups;
  setStock([["Papa", 1000, "g"], ["Merluza", 2, "unidad"]]);
  localStorage.setItem("miPlatoFacil_pantry", JSON.stringify(["tomate"]));
  renderCompras(); await wait(30);
  T.ok("S3 la lista es idéntica aunque cambien despensa, multiplicador, precios y presupuesto", JSON.stringify(R.items().map(x => x.label)) === base && keysEnPantalla() === baseKeys && sameGroups && grupos() !== baseGroups, baseGroups);
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
  // v15.4: Pendientes van por secciones del súper; "Ya tenés" se busca por su título.
  const pendientesVisibles = () => [...document.querySelectorAll("#comprasList .compras-seccion .shop-item label")].map(l => l.textContent);
  const grupoPorTitulo = t => [...document.querySelectorAll("#comprasList details.shop-group")].find(d => d.querySelector("summary").textContent.startsWith(t + " ("));
  T.ok("S4a despensa suficiente va a Ya tenés, sin tachar sola", arroz.label === "Arroz: 300 g" && arroz.suggestion.kind === "covered" && arroz.group === "tenes" && !comprasDone[arroz.key]);
  T.ok("S4b lo que ya tenés no cuenta como pendiente y está en el grupo plegado", /1 pendientes · 0 tachados/.test(document.getElementById("comprasSummary").textContent) && pendientesVisibles().includes("Merluza: 2 unidades") && !pendientesVisibles().some(t => t.startsWith("Arroz")) && !!grupoPorTitulo("Ya tenés") && !grupoPorTitulo("Ya tenés").open && grupoPorTitulo("Ya tenés").textContent.includes("Arroz: 300 g"), document.getElementById("comprasSummary").textContent);
  const merluza = item("Merluza");
  [...document.querySelectorAll("#comprasList [data-shop-key]")].find(x => x.dataset.shopKey === merluza.key).click(); await wait(40);
  const ticked = /0 pendientes · 1 tachados/.test(document.getElementById("comprasSummary").textContent);
  // v15.4: sin "Todos": lo tachado sigue a la vista, tachado, en su sección; se destilda ahí mismo.
  const cb = [...document.querySelectorAll("#comprasList .compras-seccion [data-shop-key]")].find(x => x.dataset.shopKey === merluza.key);
  const tachadoVisible = !!cb && cb.checked && cb.closest(".shop-item").classList.contains("is-done");
  cb.click(); await wait(40);
  T.ok("S4c destildar en Todos lo vuelve a pendiente", ticked && tachadoVisible && !comprasDone[merluza.key] && /1 pendientes · 0 tachados/.test(document.getElementById("comprasSummary").textContent));
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
  const antes8 = renderedRows().includes("Papa: 200 g + sin cantidad en 1 plato · faltan 150 g");
  setStock([["Papa", 120, "g"]]); renderCompras(); papa = item("Papa");
  T.ok("S8 si cambia la despensa, la sugerencia aplicada vieja se descarta", antes8 && papa.suggestion.buy === "80 g" && renderedRows().includes("Papa: 200 g + sin cantidad en 1 plato · faltan 80 g") && !renderedRows().some(t => t.includes("faltan 150 g")));
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
  T.ok("S10a despensa en ingrediente sin cantidad: solo informa", item("Tomate").suggestion.kind === "info" && /El plan no indica cantidad/.test(item("Tomate").suggestion.text) && grupo("Tomate") === "tenes");
  T.ok("S10b marca de 'Con lo que tengo' se informa", /Lo marcaste en tu Despensa/.test(item("Lechuga").suggestion.text) && grupo("Lechuga") === "tenes" && document.getElementById("comprasList").textContent.includes("💡 Lo marcaste en tu Despensa"));
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
  T.ok("S12 mensajes actualizados (asignación e indicación de Compras)", /cantidades registradas en la receta/.test(document.getElementById("planRecipeAssignStatus").textContent) && /Ya tenés/.test(document.getElementById("comprasHint").textContent) && item("Papa").label === "Papa: 200 g");
  // Prepare S7 for a real click (left for the next step)
  reset();
  setAmounts({ [IDEA3]: { yield: 1, rows: [{ name: 'Queso "cremoso"', quantity: 100, unit: "g" }] } });
  setRecipes([{ id: "recipe_test0003", title: "Risotto", amountsTitle: IDEA3 }]);
  setSaved([recipePlate("rp3", "recipe_test0003", "Risotto", ['Queso "cremoso"'])]); setPlan([["lunes", "cena", "rp3"]]);
  go("compras"); await wait(60);
  return T;
})()
