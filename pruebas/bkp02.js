// BKP-02 battery: user text with < and > must back up, restore and render only as text.
(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const T = []; const ok = (name, cond, detail) => T.push((cond ? "PASA " : "FALLA ") + name + (detail ? " · " + detail : ""));
  const IDEA = "Ensalada completa: lechuga, tomate, huevo, atún y papa";
  const XSS = '<img src=x onerror="window.__xss=1">';
  window.__xss = undefined;
  localStorage.clear();
  const today = localTrainingDate(new Date());
  const monday = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return localTrainingDate(d) })();
  const plate = { id: "p1", savedAt: "2026-10-20T10:00:00.000Z", type: "plato", title: "Almuerzo " + XSS, lines: ["Verduras: <b>Tomate</b>"], sig: "s1", text: "t", cooked: 0, note: "pollo > 200 g " + XSS };
  const data = {
    miPlatoFacil_manualShopping_v1: JSON.stringify([{ id: "m1", name: "Leche <1 L " + XSS, amount: "> 2", done: false }]),
    miPlatoFacil_saved: JSON.stringify([plate]),
    miPlatoFacil_plan: JSON.stringify({ lunes: { desayuno: null, merienda: null, almuerzo: "p1", cena: null } }),
    miPlatoFacil_datedWeeks_v1: JSON.stringify({ [monday]: { version: 1, plan: { lunes: { almuerzo: "p1" } }, saved: [plate] } }),
    miPlatoFacil_cookingHistory_v1: JSON.stringify([{ id: "h1", date: today, meal: "Cena", title: "Cena " + XSS, lines: ["<i>a</i>"], sourceId: "p1", status: "prepared" }]),
    miPlatoFacil_recipeAmounts_v1: JSON.stringify({ [IDEA]: { yield: 1, rows: [{ name: "Papa <grande>", quantity: 200, unit: "g" }] } }),
    miPlatoFacil_recipeDetails_v1: JSON.stringify({ recipe_test0003: { id: "recipe_test0003", title: "Horno > 180 " + XSS, sourceTitle: null, amountsTitle: IDEA, steps: ["Hornear a >180°", XSS], notes: "<script>window.__xss=2</script>" } }),
    miPlatoFacil_referencePrices_v1: JSON.stringify({ pr1: { id: "pr1", name: "Papa <grande>", pack: XSS, amount: 1000, price: 1500, unit: "g", currency: "ARS", date: "2026-10-20" } }),
    miPlatoFacil_pantryQuantities_v1: JSON.stringify({ [stockKey("Papa <grande>", "g")]: { name: "Papa <grande>", quantity: 50, unit: "g" } }),
    miPlatoFacil_recipePreferences_v1: JSON.stringify({ words: "<cebolla>", enabled: false }),
  };
  for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
  const snap = completeBackupSnapshot(localStorage);
  let err = null; try { validateCompleteBackup(snap) } catch (e) { err = e.message }
  ok("C1 respaldo con textos que contienen < y > es válido", err === null, err);
  localStorage.clear(); restoreCompleteBackup(snap, localStorage);
  ok("C2 ida y vuelta conserva los textos exactos", Object.keys(data).every(k => localStorage.getItem(k) === data[k]));
  // Render every screen/panel that shows these texts
  go("misplatos"); renderSaved(); await wait(50);
  const savedText = document.getElementById("savedList").textContent;
  ok("C3 Mis platos muestra la nota como texto", savedText.includes("pollo > 200 g " + XSS));
  go("compras"); renderManualShopping(); await wait(50);
  ok("C4 productos extra muestran \"Leche <1 L\" como texto", document.getElementById("manualShopList").textContent.includes("Leche <1 L"));
  planDiaElegido = "lunes"; go("plan"); renderPlan(); document.getElementById("datedWeeksPanel").open = true; document.getElementById("datedWeekStart").value = monday; renderDatedWeek();
  document.getElementById("monthlyPlanPanel").open = true; renderMonthlyPlan(); await wait(50);
  ok("C5 plan y semanas fechadas muestran el título como texto", document.getElementById("planList").textContent.includes("pollo > 200 g " + XSS) && document.getElementById("datedWeekView").textContent.includes("pollo > 200 g"));
  go("misplatos"); document.getElementById("cookingHistoryPanel").open = true; renderCookingHistory(); await wait(50);
  ok("C6 historial muestra el título como texto", document.getElementById("cookingHistoryList").textContent.includes("Cena " + XSS));
  go("ingredientes"); showRecipeView("browse"); showRecipeRead("recipe_test0003"); await wait(50);
  ok("C7 lectura de receta muestra pasos y notas como texto", document.getElementById("recipeReadSteps").textContent.includes("Hornear a >180°") && document.getElementById("recipeReadNotes").textContent.includes("<script>"));
  go("compras"); document.getElementById("pricePanel").open = true; renderReferencePrices(); await wait(50);
  ok("C8 precios muestran la presentación como texto", document.getElementById("priceList").textContent.includes(XSS));
  const exportHtml = buildWeeklyPlanExport(loadPlan(), loadSaved(), "").html;
  ok("C9 descarga del plan escapa el marcado", !exportHtml.includes("<img") && exportHtml.includes("&lt;img"));
  await wait(400);
  ok("C10 ningún texto se ejecutó ni creó elementos", window.__xss === undefined && document.querySelectorAll("main img, main script, main b, main i").length === 0, "xss=" + window.__xss);
  // Export with < in data: verification passes
  const ac = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { };
  document.getElementById("backupExport").click();
  HTMLAnchorElement.prototype.click = ac;
  ok("C11 exportación con < y > se verifica como restaurable", /Comprobado/.test(document.getElementById("backupStatus").textContent));
  const proto = JSON.parse(JSON.stringify(snap)); proto.data.miPlatoFacil_manualShopping_v1 = '[{"id":"m1","name":"x","__proto__":{"a":1}}]';
  let perr = null; try { validateCompleteBackup(proto) } catch (e) { perr = e.message }
  ok("C12 campos __proto__ siguen rechazados", !!perr, perr);
  localStorage.clear(); restart();
  return T;
})()
