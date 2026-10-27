// Functional regression of validated flows (programmatic clicks on the real UI, synthetic data).
(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const click = async sel => { const b = document.querySelector(sel); if (!b) throw Error("no existe " + sel); b.click(); await wait(130) };
  const scr = () => document.querySelector(".screen.is-active").id;
  const T = []; const ok = (name, cond, detail) => T.push((cond ? "PASA " : "FALLA ") + name + (detail ? " · " + detail : ""));
  window.confirm = () => true; window.prompt = () => "Var A";
  localStorage.clear(); restart();
  const expectVersion = window.__expectVersion || "14.9.74";
  ok("R0 versión visible " + expectVersion, document.getElementById("deploymentGuide").textContent.includes("Versión " + expectVersion));
  // Breakfast flow
  await click('[data-start="desayuno"]');
  await click('#fruit [data-name="Licuado"]'); await wait(100);
  await click('#bfprot [data-name="Yogur natural descremado"]'); await wait(100);
  await click('#bfcarb [data-name="Pan de molde integral o blanco"]'); await wait(100);
  await click('#bffat [data-name="Palta"]'); await wait(100);
  ok("R1 desayuno completo llega al resumen", scr() === "resumen" && /Licuado/.test(el.summary.textContent) && /Palta/.test(el.summary.textContent));
  await click('#summary [data-edit="bf_prot"]'); await click('#bfprot [data-name="Huevo | Clara de huevo"]'); await wait(100);
  ok("R2 editar desde el resumen vuelve al resumen", scr() === "resumen" && /Huevo/.test(el.summary.textContent));
  await click('[data-save-plate]');
  await click('[data-restart]');
  ok("R3 Armar otro plato reinicia", scr() === "home" && state.type === "");
  // Lunch flow
  await click('[data-start="plato"]'); await click('[data-day="Día de entrenamiento"]'); await click('#plate_static [data-go="lunch_veg"]');
  await click('#boxv [data-name="Tomate"]'); await click('#nextBottom');
  await click('[data-replace="carb"][data-value="true"]'); await click('#boxLegCarb [data-name="Lentejas"]'); await click('#nextBottom');
  await click('#boxp [data-name="Merluza"]'); await click('#nextBottom');
  ok("R4 almuerzo con legumbre como almidón llega al resumen", scr() === "resumen" && /Lentejas/.test(el.summary.textContent) && /Merluza/.test(el.summary.textContent));
  // v14.9.91: las pestañas son Hoy, Semana, Compras, Mis comidas y Más.
  await click('#summary [data-edit="lunch_veg"]'); await click('[data-section-tab="semana"]'); await click('[data-section-tab="hoy"]');
  const restored = scr(); await click('#nextBottom');
  ok("R5 edición en curso sobrevive al cambio de pestaña (N01)", restored === "lunch_veg" && scr() === "resumen");
  await click('#summary [data-edit-portions-summary]');
  el.portionVeg.value = "1/2"; el.portionCarb.value = "1/2"; el.portionProt.value = "1/4"; await click("[data-save-portions]");
  const blocked = el.portionError.classList.contains("is-visible") && scr() === "plate_static";
  el.portionVeg.value = "1/2"; el.portionCarb.value = "1/4"; el.portionProt.value = "1/4"; await click("[data-save-portions]");
  ok("R6 proporciones inválidas bloquean y válidas vuelven al resumen", blocked && scr() === "resumen");
  await click('[data-save-plate]');
  await click('#homeTop');
  ok("R7 Inicio vuelve a la portada sin borrar la selección", scr() === "home" && state.type === "plato");
  await click('[data-restart]');
  ok("R8 dos platos guardados", loadSaved().length === 2);
  // Plan
  await click('[data-section-tab="semana"]');
  ok("R8b la pestaña Semana abre el plan", scr() === "plan");
  const plate = loadSaved().find(p => p.type === "plato"), bf = loadSaved().find(p => p.type === "desayuno");
  document.querySelector('[data-plan-select="lunes|almuerzo"]').value = plate.id; await click('[data-plan-set="lunes|almuerzo"]');
  document.querySelector('[data-plan-select="lunes|desayuno"]').value = bf.id; await click('[data-plan-set="lunes|desayuno"]');
  ok("R9 asignar platos al plan", loadPlan().lunes.almuerzo === plate.id && loadPlan().lunes.desayuno === bf.id);
  document.querySelector('[data-plan-select="lunes|almuerzo"]').value = plate.id; await click('[data-plan-set="lunes|almuerzo"]');
  ok("R10 Reemplazar sigue operativo", loadPlan().lunes.almuerzo === plate.id);
  await click('[data-save-var]'); await click('[data-plan-clear="lunes|almuerzo"]');
  const vs = document.getElementById("varSelect"); vs.value = "Var A"; vs.dispatchEvent(new Event("change", { bubbles: true })); await wait(100);
  ok("R11 variaciones independientes del plan actual", !!loadVars()["Var A"].lunes.almuerzo && loadPlan().lunes.almuerzo === plate.id);
  document.getElementById("datedWeeksPanel").open = true; await wait(50); await click('[data-dated-save]');
  await click('[data-plan-clear="lunes|almuerzo"]');
  const weeks = loadDatedWeeks(), k = Object.keys(weeks)[0];
  ok("R12 semana fechada es una copia independiente", !!weeks[k].plan.lunes.almuerzo && !loadPlan().lunes.almuerzo);
  document.getElementById("monthlyPlanPanel").open = true; renderMonthlyPlan(); await wait(50);
  ok("R13 vista mensual marca días con comidas", document.querySelectorAll('#monthlyPlanGrid [data-mark]').length >= 1);
  // Compras
  await click('[data-plan-set="lunes|almuerzo"]'); document.querySelector('[data-plan-select="lunes|almuerzo"]').value = plate.id; await click('[data-plan-set="lunes|almuerzo"]');
  go("compras"); await wait(100);
  const items = [...document.querySelectorAll("#comprasList .shop-item")].map(x => x.textContent);
  ok("R14 Compras lista los ingredientes del plan", ["Tomate", "Lentejas", "Merluza", "Licuado"].every(n => items.some(t => t.includes(n))), items.join(" | "));
  document.getElementById("manualShopName").value = "Detergente"; document.getElementById("manualShoppingForm").requestSubmit(); await wait(80);
  ok("R15 productos extra se agregan", loadManualShopping().some(x => x.name === "Detergente"));
  // Training
  go("trainingCalendar"); await wait(80);
  document.querySelector('[data-training-day="1"]').checked = true; await click("[data-training-save]");
  ok("R16 semana de entrenamiento se guarda", JSON.stringify(loadTrainingWeek().days) === "[1]");
  await click('[data-train-quick="1"]'); await click('[data-train-type="rest"]'); await click("[data-training-exception-save]");
  ok("R17 excepción por fecha se guarda", Object.keys(loadTrainingExceptions()).length === 1);
  // Recipes
  go("ingredientes"); await wait(80);
  await click("#recipeViewCreate");
  document.getElementById("recipeDetailsTitle").value = "Receta de prueba"; document.getElementById("recipeDetailsSteps").value = "Paso 1\nPaso 2";
  await click("#recipeDetailsSave");
  const own = loadRecipeDetails(), rid = Object.keys(own)[0];
  ok("R18 crear receta propia", !!rid && own[rid].steps.length === 2);
  await click("#recipeViewBrowse"); showRecipeRead(rid); await click("#recipeReadDuplicate");
  ok("R19 duplicar receta", Object.keys(loadRecipeDetails()).length === 2);
  // Theme + advice modal
  await click('[data-section-tab="hoy"]');
  await click("#adviceFab"); const modalOpen = el.adviceModal.classList.contains("is-visible"); await click("[data-close-advice]");
  ok("R20 Consejos abre y cierra", modalOpen && !el.adviceModal.classList.contains("is-visible"));
  ok("R21 sin aviso de arranque con datos válidos", !document.getElementById("startupIssues"));
  localStorage.clear(); restart();
  return T;
})()
