// F03 battery: portions per meal, reuse dated weeks, plan change history.
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setRecipes, tradPlate, setSaved, IDEA1 } = R; const T = results();
  window.confirm = () => true;
  const $ = id => document.getElementById(id);
  // v15.1: las porciones se cargan en la hoja del hueco (Semana → día → comida). Lo que se verifica no cambió.
  const abrirHueco = async (dia = "lunes", comida = "almuerzo") => { if (hoja.abierta()) hoja.cerrar(); go("plan"); await wait(20); document.querySelector('[data-plan-dia="' + dia + '"]').click(); document.querySelector('[data-hueco="' + dia + '|' + comida + '"]').click(); await wait(20); return document.querySelector('.hoja [data-plan-portions="' + dia + '|' + comida + '"]') };
  const textoHoja = () => hoja.elemento.textContent;
  reset();
  setAmounts({ [IDEA1]: { yield: 4, rows: [{ name: "Papa", quantity: 400, unit: "g" }] } });
  setRecipes([{ id: "recipe_test0001", title: "Papas al horno", amountsTitle: IDEA1 }]);
  setSaved([tradPlate("tp1", ["Arroz"], ["Tomate"], ["Merluza"]), tradPlate("tp2", ["Fideos y pastas (de trigo, maíz o arroz)"], ["Zanahoria"], ["Pollo (pechuga, muslo, pata-muslo)"])]);
  $("planRecipeReference").open = true; renderPlanRecipeReference();
  $("planRecipeSelect").value = "recipe_test0001"; $("planRecipeDay").value = "lunes"; $("planRecipeSlot").value = "almuerzo"; assignSavedRecipeToPlan();
  go("compras"); await wait(30);
  T.ok("P1a sin porciones, Compras usa la receta completa", R.renderedRows().includes("Papa: 400 g"));
  setSlot("martes", "cena", "tp1");
  const enPlato = await abrirHueco("martes", "cena"), porcionesEnPlato = document.querySelectorAll("[data-plan-portions]").length;
  setSlot("martes", "cena", null);
  const inp = await abrirHueco();
  T.ok("P1b el plan ofrece porciones para recetas (no para platos)", !enPlato && porcionesEnPlato === 0 && !!inp && inp.placeholder === "4" && document.querySelectorAll("[data-plan-portions]").length === 1 && /La receta rinde 4 porciones\. Compras usa la receta completa\./.test(textoHoja()));
  inp.value = "2"; inp.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  T.ok("P1c guardar 2 porciones lo muestra en el plan", /Compras calcula para 2\./.test(textoHoja()) && /2 porciones/.test($("planList").textContent) && JSON.stringify(loadPlanPortions()) === '{"lunes|almuerzo":2}' && /Porciones guardadas/.test($("planStatus").textContent));
  go("compras"); await wait(30);
  T.ok("P2a Compras escala la receta a 2 porciones", R.renderedRows().includes("Papa: 200 g"), R.renderedRows().join(" | "));
  localStorage.setItem("miPlatoFacil_referencePrices_v1", JSON.stringify({ p1: { id: "p1", name: "Papa", pack: "", amount: 1000, price: 1000, unit: "g", currency: "ARS", date: "2026-10-20" } }));
  localStorage.setItem("miPlatoFacil_shoppingBudget_v1", JSON.stringify({ currency: "ARS", limit: 5000 }));
  await R.openPanel("shoppingToolsPanel"); await R.openPanel("shoppingBudgetPanel");
  T.ok("P2b presupuesto usa las porciones", /Costo parcial estimado: 200,00 ARS/.test($("shoppingBudgetResult").textContent));
  await R.openPanel("shoppingQuantCostPanel");
  T.ok("P2c 'Ajustar porciones' parte de las porciones del plan", /Papa: 200 g/.test($("shoppingQuantCostResult").textContent));
  let p = await abrirHueco(); p.value = "0"; p.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  T.ok("P3 porciones inválidas se rechazan", /entre 0,25 y 100/.test($("planStatus").textContent) && loadPlanPortions()["lunes|almuerzo"] === 2);
  p = document.querySelector('[data-plan-portions="lunes|almuerzo"]'); p.value = ""; p.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  T.ok("P4 vaciar el campo vuelve a la receta completa", Object.keys(loadPlanPortions()).length === 0 && localStorage.getItem("miPlatoFacil_planPortions_v1") === null);
  p = document.querySelector('[data-plan-portions="lunes|almuerzo"]'); p.value = "1,5"; p.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  T.ok("P5a acepta decimales con coma", loadPlanPortions()["lunes|almuerzo"] === 1.5);
  window.prompt = () => "Con porciones"; saveVariation();
  setSlot("lunes", "almuerzo", "tp1");
  T.ok("P5b cambiar la comida de esa franja descarta sus porciones", loadPlanPortions()["lunes|almuerzo"] === undefined);
  // Variation load keeps nothing for changed slot, history logs
  const vs = $("varSelect"); vs.value = "Con porciones"; vs.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  T.ok("P6 cargar una variación no arrastra porciones de otra comida", Object.keys(loadPlanPortions()).length === 0 && loadPlan().lunes.almuerzo !== "tp1");
  await R.openPanel("planHistoryPanel");
  const hist = $("planHistoryList").textContent;
  T.ok("P7 el historial registra asignaciones, porciones y variaciones", /Lunes · Almuerzo: asignado Papas al horno/.test(hist) && /porciones 2/.test(hist) && /porciones según la receta/.test(hist) && /Variación "Con porciones" cargada/.test(hist) && hist.includes("Lunes · Almuerzo: asignado " + mealName(loadSaved().find(x => x.id === "tp1"))), hist.slice(0, 300));
  // Reuse a dated week whose plate was deleted afterwards
  setSlot("martes", "cena", "tp2");
  $("datedWeeksPanel").open = true; await wait(10); document.querySelector("[data-dated-save]").click(); await wait(20);
  const key = $("datedWeekStart").value;
  deleteSaved("tp2"); window.confirm = () => true; clearPlan();
  renderDatedWeek(); const reuse = document.querySelector("[data-dated-reuse]");
  T.ok("P8a la semana fechada ofrece 'Usar esta semana como plan actual'", !!reuse && reuse.dataset.datedReuse === key);
  reuse.click(); await wait(20);
  T.ok("P8b reutilizar restaura el plan y recupera el plato borrado", loadPlan().martes.cena === "tp2" && !!loadSaved().find(x => x.id === "tp2") && /Se recuperaron 1 platos/.test($("datedWeekStatus").textContent), $("datedWeekStatus").textContent);
  window.confirm = () => false; reuse.click(); window.confirm = () => true;
  // Backup
  let err = null; const snap = completeBackupSnapshot(localStorage); try { validateCompleteBackup(snap) } catch (e) { err = e.message }
  T.ok("P9a respaldo con historial válido", err === null && "miPlatoFacil_planHistory_v1" in snap.data, err);
  const bad = JSON.parse(JSON.stringify(snap)); bad.data["miPlatoFacil_planPortions_v1"] = JSON.stringify({ "feriado|cena": 2 });
  let e2 = null; try { validateCompleteBackup(bad) } catch (e) { e2 = e.message }
  T.ok("P9b porciones con franjas inválidas se rechazan", /Porciones del plan inválidas/.test(e2 || ""), e2);
  localStorage.removeItem("miPlatoFacil_planHistory_v1"); localStorage.removeItem("miPlatoFacil_planPortions_v1");
  T.ok("P9c sin porciones ni historial, el respaldo conserva 17 claves", Object.keys(completeBackupSnapshot(localStorage).data).length === 17);
  return T;
})()
