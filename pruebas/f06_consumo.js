// F03-6 + F06 (without nutrients) battery: consumption log, weekly summary, goals.
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setRecipes, recipePlate, tradPlate, setSaved, setPlan, IDEA1 } = R; const T = results();
  window.confirm = () => true;
  const $ = id => document.getElementById(id);
  reset();
  const today = localTrainingDate(new Date()), wd = todayPlanDay();
  setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Lentejas", quantity: 200, unit: "g" }, { name: "Zanahoria", quantity: 1, unit: "unidad" }] } });
  setRecipes([{ id: "recipe_test0001", title: "Guiso de lentejas", amountsTitle: IDEA1 }]);
  setSaved([tradPlate("tp1", ["Arroz"], ["Tomate"], ["Merluza"]), recipePlate("rp1", "recipe_test0001", "Guiso de lentejas", ["Lentejas", "Zanahoria"]), { id: "bf1", type: "desayuno", title: "Desayuno / Merienda", lines: ["Fruta: Licuado"], sig: "bf", text: "bf", cooked: 0, state: { type: "desayuno", fruta: { name: "Licuado" }, bfprot: { name: "Yogur" } } }]);
  setPlan([[wd, "almuerzo", "tp1"], [wd, "cena", "rp1"]]);
  T.ok("C1 grupos detectados desde los ingredientes registrados", JSON.stringify(plateGroups(loadSaved()[0])) === '["verduras","pescado","almidones","proteinas"]' && JSON.stringify(plateGroups(loadSaved()[1])) === '["verduras","legumbres"]' && plateGroups(loadSaved()[2]).includes("fruta"), JSON.stringify(loadSaved().map(plateGroups)));
  go("plan"); await wait(30);
  const eatBtn = document.querySelector(`[data-plan-eaten="${wd}|almuerzo"]`);
  T.ok("C2a el plan ofrece 'Lo comí hoy' solo en las comidas de hoy", !!eatBtn && document.querySelectorAll("[data-plan-eaten]").length === 2);
  eatBtn.click(); await wait(20);
  const after = document.querySelector(`[data-plan-eaten="${wd}|almuerzo"]`);
  T.ok("C2b registrar desde el plan marca '✓ Comido hoy' y no cambia el plan", after.disabled && after.textContent === "✓ Comido hoy" && loadPlan()[wd].almuerzo === "tp1" && loadConsumption().length === 1 && loadConsumption()[0].planned === true && loadConsumption()[0].date === today);
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
  T.ok("C4 resumen semanal: total, del plan y grupos", /3 comidas registradas · 2 del plan · 1 fuera del plan/.test(view) && /Con verduras: 2/.test(view) && /Con legumbres: 1/.test(view) && /Con pescado: 1/.test(view) && /1 registro sin grupos identificados/.test(view), view.slice(0, 260));
  $("goal_legumbres").value = "3"; $("goal_pescado").value = "1"; $("goal_verduras").value = "x"; $("habitGoalsSave").click(); await wait(10);
  const badGoal = $("consumptionStatus").textContent;
  $("goal_verduras").value = ""; $("habitGoalsSave").click(); await wait(10);
  T.ok("C5 objetivos: valida y muestra el progreso", /entre 0 y 21/.test(badGoal) && JSON.stringify(loadHabitGoals()) === '{"legumbres":3,"pescado":1}' && /Con legumbres: 1 de 3 \(objetivo\)/.test($("consumptionView").textContent) && /Con pescado: 1 de 1 \(objetivo\) ✓/.test($("consumptionView").textContent));
  document.querySelector('[data-consumption-week="-7"]').click(); await wait(10);
  T.ok("C6a navegar a la semana anterior", /Sin registros esta semana/.test($("consumptionView").textContent));
  document.querySelector('[data-consumption-week="7"]').click(); await wait(10);
  document.querySelector("[data-consumption-remove]").click(); await wait(10);
  T.ok("C6b quitar un registro", loadConsumption().length === 2 && /Registro quitado/.test($("consumptionStatus").textContent));
  T.ok("C7 las preparaciones (Cociné) no cambian", loadSaved().every(p => (p.cooked || 0) === 0) && !localStorage.getItem("miPlatoFacil_cookingHistory_v1"));
  let err = null; const snap = completeBackupSnapshot(localStorage); try { validateCompleteBackup(snap) } catch (e) { err = e.message }
  const bad = JSON.parse(JSON.stringify(snap)); bad.data["miPlatoFacil_consumption_v1"] = JSON.stringify([{ id: "x", date: "2026-13-40", meal: "cena", title: "x", groups: [], sourceId: null, planned: false }]);
  let e2 = null; try { validateCompleteBackup(bad) } catch (e) { e2 = e.message }
  T.ok("C8 respaldo con consumo y objetivos válido; fechas inválidas se rechazan", err === null && "miPlatoFacil_consumption_v1" in snap.data && "miPlatoFacil_habitGoals_v1" in snap.data && /Registro de consumo inválido/.test(e2 || ""), err + " / " + e2);
  return T;
})()
