// F03-6 + F06 (without nutrients) battery: consumption log, weekly summary, goals.
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setRecipes, recipePlate, tradPlate, setSaved, setPlan, IDEA1 } = R; const T = results();
  window.confirm = () => true;
  const $ = id => document.getElementById(id);
  reset();
  const today = Rutina.localTrainingDate(new Date()), wd = todayPlanDay();
  setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Lentejas", quantity: 200, unit: "g" }, { name: "Zanahoria", quantity: 1, unit: "unidad" }] } });
  setRecipes([{ id: "recipe_test0001", title: "Guiso de lentejas", amountsTitle: IDEA1 }]);
  setSaved([tradPlate("tp1", ["Arroz"], ["Tomate"], ["Merluza"]), recipePlate("rp1", "recipe_test0001", "Guiso de lentejas", ["Lentejas", "Zanahoria"]), { id: "bf1", type: "desayuno", title: "Desayuno / Merienda", lines: ["Fruta: Licuado"], sig: "bf", text: "bf", cooked: 0, state: { type: "desayuno", fruta: { name: "Licuado" }, bfprot: { name: "Yogur" } } }]);
  setPlan([[wd, "almuerzo", "tp1"], [wd, "cena", "rp1"]]);
  T.ok("C1 grupos detectados desde los ingredientes registrados", JSON.stringify(plateGroups(MisPlatos.loadSaved()[0])) === '["verduras","pescado","almidones","proteinas"]' && JSON.stringify(plateGroups(MisPlatos.loadSaved()[1])) === '["verduras","legumbres"]' && plateGroups(MisPlatos.loadSaved()[2]).includes("fruta"), JSON.stringify(MisPlatos.loadSaved().map(plateGroups)));
  // v15.1: "Lo comí hoy" está en la hoja de cada comida de hoy (Semana → hoy → comida), no en los otros días.
  const otro = DAYS.map(d => d[0]).find(d => d !== wd);
  setPlan([[wd, "almuerzo", "tp1"], [wd, "cena", "rp1"], [otro, "almuerzo", "tp1"]]);
  const hojaDe = async (dia, comida) => { if (hoja.abierta()) hoja.cerrar(); go("plan"); await wait(20); document.querySelector(`[data-plan-dia="${dia}"]`).click(); document.querySelector(`[data-hueco="${dia}|${comida}"]`).click(); await wait(20); return [...hoja.elemento.querySelectorAll("[data-plan-eaten]")] };
  const enOtroDia = (await hojaDe(otro, "almuerzo")).length, enCena = (await hojaDe(wd, "cena")).map(b => b.dataset.planEaten);
  setPlan([[wd, "almuerzo", "tp1"], [wd, "cena", "rp1"]]);
  const eatBtn = (await hojaDe(wd, "almuerzo"))[0];
  T.ok("C2a el plan ofrece 'Lo comí hoy' solo en las comidas de hoy", !!eatBtn && eatBtn.dataset.planEaten === `${wd}|almuerzo` && enOtroDia === 0 && enCena.join() === `${wd}|cena` && hoja.elemento.querySelectorAll("[data-plan-eaten]").length === 1);
  eatBtn.click(); await wait(20);
  const after = hoja.elemento.querySelector(`[data-plan-eaten="${wd}|almuerzo"]`); hoja.cerrar();
  T.ok("C2b registrar desde el plan marca '✓ Lo comí hoy' y no cambia el plan", after.disabled && after.textContent === "✓ Lo comí hoy" && loadPlan()[wd].almuerzo === "tp1" && loadConsumption().length === 1 && loadConsumption()[0].planned === true && loadConsumption()[0].date === today);
  // Form: plate from plan (cena) and free text
  await R.openPanel("consumptionPanel");
  T.ok("C3a la fecha se completa con hoy", $("consumptionDate").value === typedAppDateLabel(today));
  $("consumptionMeal").value = "cena"; $("consumptionPlate").value = "rp1"; $("consumptionSave").click(); await wait(20);
  $("consumptionMeal").value = "merienda"; $("consumptionPlate").value = ""; $("consumptionText").value = "Facturas"; $("consumptionSave").click(); await wait(20);
  const recs = loadConsumption();
  T.ok("C3b el formulario registra plato del plan y texto libre", recs.length === 3 && recs[1].planned === true && recs[1].groups.includes("legumbres") && recs[2].planned === false && recs[2].groups.length === 0, JSON.stringify(recs.map(r => [r.meal, r.planned, r.groups])));
  $("consumptionDate").value = "01/01/2099"; $("consumptionText").value = "Algo"; $("consumptionSave").click(); await wait(10);
  T.ok("C3c no acepta fechas futuras", /no futura/.test($("consumptionStatus").textContent) && loadConsumption().length === 3);
  $("consumptionDate").value = typedAppDateLabel(today);
  const view = $("consumptionView").textContent;
  // Desde la v19.6 (R5-R07 y R08) el resumen semanal son gráficos de barras con su número.
  const barras = () => [...document.querySelectorAll("#consumptionView .grafico__fila")].map(f => f.querySelector(".grafico__rotulo").textContent + "=" + f.querySelector(".grafico__valor").textContent);
  T.ok("C4 resumen semanal: total, del plan y grupos", barras().includes("Registradas=3") && barras().includes("Del plan=2") && barras().includes("Fuera del plan=1") && barras().includes("Con verduras=2") && barras().includes("Con legumbres=1") && barras().includes("Con pescado=1") && /1 registro sin grupos identificados/.test(view), barras().join(" | "));
  $("goal_legumbres").value = "3"; $("goal_pescado").value = "1"; $("goal_verduras").value = "x"; $("habitGoalsSave").click(); await wait(10);
  const badGoal = $("habitGoalsStatus").textContent;
  $("goal_verduras").value = ""; $("habitGoalsSave").click(); await wait(10);
  T.ok("C5 objetivos: valida y muestra el progreso", /entre 0 y 21/.test(badGoal) && JSON.stringify(loadHabitGoals()) === '{"legumbres":3,"pescado":1}' && barras().includes("Con legumbres=1 de 3") && barras().includes("Con pescado=1 de 1 ✓"), badGoal + " | " + JSON.stringify(loadHabitGoals()));
  document.querySelector('[data-consumption-week="-7"]').click(); await wait(10);
  T.ok("C6a navegar a la semana anterior", /Sin registros esta semana/.test($("consumptionView").textContent));
  document.querySelector('[data-consumption-week="7"]').click(); await wait(10);
  // v15.5: Quitar no pide confirmación (si la pidiera, la prueba falla) y ofrece Deshacer.
  let pidioConfirmar = false; window.confirm = () => { pidioConfirmar = true; return false };
  const antesDeQuitar = localStorage.getItem("miPlatoFacil_consumption_v1");
  document.querySelector("[data-consumption-remove]").click(); await wait(10);
  const quitado = loadConsumption().length === 2 && /Registro quitado/.test($("consumptionStatus").textContent), deshacerQuitar = $("consumptionStatus").querySelector("[data-registro-deshacer]");
  window.confirm = () => true;
  T.ok("C6b quitar un registro, sin confirmación y sin Deshacer en el Registro (R5-R05)", !pidioConfirmar && quitado && !deshacerQuitar && loadConsumption().length === 2 && /Registro quitado/.test($("consumptionStatus").textContent));
  T.ok("C7 las preparaciones (Cociné) no cambian", MisPlatos.loadSaved().every(p => (p.cooked || 0) === 0) && !localStorage.getItem("miPlatoFacil_cookingHistory_v1"));
  let err = null; const snap = completeBackupSnapshot(localStorage); try { Respaldo.validateCompleteBackup(snap) } catch (e) { err = e.message }
  const bad = JSON.parse(JSON.stringify(snap)); bad.data["miPlatoFacil_consumption_v1"] = JSON.stringify([{ id: "x", date: "2026-13-40", meal: "cena", title: "x", groups: [], sourceId: null, planned: false }]);
  let e2 = null; try { Respaldo.validateCompleteBackup(bad) } catch (e) { e2 = e.message }
  T.ok("C8 respaldo con consumo y objetivos válido; fechas inválidas se rechazan", err === null && "miPlatoFacil_consumption_v1" in snap.data && "miPlatoFacil_habitGoals_v1" in snap.data && /Registro de consumo inválido/.test(e2 || ""), err + " / " + e2);
  return T;
})()
