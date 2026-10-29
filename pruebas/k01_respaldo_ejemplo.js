// K01: el respaldo de ejemplo (pruebas/fixtures/respaldo-v14.9.94.json, datos inventados con los 24 módulos de la
// v14.9.94) se restaura completo, cada pantalla abre sin errores, recorrerlas no escribe nada y los conteos coinciden.
// Corre en todas las etapas. La app se abre en un marco aparte (mismo origen y mismo localStorage) porque restaurar
// desde la app recarga la página. Los conteos no dependen de la fecha real.
(async () => {
  const T = []; const ok = (n, c, d) => T.push((c ? "PASA " : "FALLA ") + n + (d !== undefined && d !== "" ? " · " + d : ""));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const abrir = async () => {
    const viejo = document.getElementById("marcoPrueba"); if (viejo) viejo.remove();
    const f = document.createElement("iframe"); f.id = "marcoPrueba";
    f.style.cssText = "position:fixed;left:0;top:0;width:390px;height:844px;border:0;opacity:0;pointer-events:none;z-index:-1";
    document.body.append(f);
    await new Promise((res, rej) => { f.onload = res; f.onerror = rej; f.src = "/index.html?marco=" + Date.now() });
    await espera(500);
    return f.contentWindow;
  };
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  const claves = Object.keys(R.data);
  const guardado = () => JSON.stringify(claves.map(k => [k, localStorage.getItem(k)]));
  localStorage.clear();
  let w = await abrir();
  // K1 El respaldo de ejemplo es válido para la app
  let error = null; try { w.validateCompleteBackup(JSON.parse(JSON.stringify(R))) } catch (e) { error = e.message }
  ok("K1 el respaldo de ejemplo es válido para la app", error === null, error);
  // K2 Se restaura completo: las 24 claves quedan idénticas, byte a byte
  w.restoreCompleteBackup(JSON.parse(JSON.stringify(R)), w.localStorage);
  const distintas = claves.filter(k => R.data[k] !== localStorage.getItem(k));
  ok("K2 se restaura completo: las 24 claves quedan idénticas", claves.length === 24 && distintas.length === 0, distintas.join(", "));
  // K3 Con la app recién abierta sobre esos datos, cada pantalla y pestaña abre sin errores
  w = await abrir();
  const antes = guardado(), errores = [];
  w.addEventListener("error", e => errores.push(e.message));
  const consola = w.console.error; w.console.error = (...a) => { errores.push(a.map(String).join(" ")); consola.apply(w.console, a) };
  for (const s of w.document.querySelectorAll("section.screen[id]")) { try { w.go(s.id) } catch (e) { errores.push(s.id + ": " + e.message) } await espera(30) }
  for (const b of w.document.querySelectorAll("#sectionNav [data-section-tab]")) { try { b.click() } catch (e) { errores.push(b.dataset.sectionTab + ": " + e.message) } await espera(40) }
  ok("K3 cada pantalla y pestaña abre sin errores con el respaldo de ejemplo", errores.length === 0, errores.slice(0, 5).join(" | "));
  // K4 Recorrer las pantallas no reescribe nada de lo guardado
  ok("K4 recorrer todas las pantallas no cambia nada de lo guardado", guardado() === antes);
  // K5 Los conteos de cada módulo coinciden con el respaldo
  const n = k => { const v = R.data[k]; if (v === null || v === undefined) return 0; const j = JSON.parse(v); return Array.isArray(j) ? j.length : Object.keys(j).length };
  const asignadas = p => Object.values(p).reduce((t, d) => t + Object.values(d).filter(Boolean).length, 0);
  const cuentas = {
    platos: [w.loadSaved().length, n("miPlatoFacil_saved")],
    recetas: [Object.keys(w.loadRecipeDetails()).length, n("miPlatoFacil_recipeDetails_v1")],
    comidasDelPlan: [asignadas(w.loadPlan()), asignadas(JSON.parse(R.data.miPlatoFacil_plan))],
    loQueComi: [w.loadConsumption().length, n("miPlatoFacil_consumption_v1")],
    preparaciones: [w.loadCookingHistory().length, n("miPlatoFacil_cookingHistory_v1")],
    compras: [w.loadPurchases().length, n("miPlatoFacil_purchases_v1")],
    existencias: [Object.keys(w.loadStockQuantities()).length, n("miPlatoFacil_pantryQuantities_v1")],
    movimientos: [w.loadPantryMoves().length, n("miPlatoFacil_pantryMoves_v1")],
    precios: [Object.keys(w.loadReferencePrices()).length, n("miPlatoFacil_referencePrices_v1")],
    semanasConFecha: [Object.keys(w.loadDatedWeeks()).length, n("miPlatoFacil_datedWeeks_v1")],
    variaciones: [Object.keys(w.loadVars()).length, n("miPlatoFacil_planVars")],
    extras: [w.loadManualShopping().length, n("miPlatoFacil_manualShopping_v1")],
    despensa: [w.loadPantry().length, n("miPlatoFacil_pantry")],
    equivalencias: [Object.keys(w.loadIngredientAliases()).length, n("miPlatoFacil_ingredientAliases_v1")],
    historialDelPlan: [w.loadPlanHistory().length, n("miPlatoFacil_planHistory_v1")],
    porciones: [Object.keys(w.loadPlanPortions()).length, n("miPlatoFacil_planPortions_v1")],
    favoritos: [w.loadAdviceFavs().length, n("miPlatoFacil_adviceFavorites")],
    excepciones: [Object.keys(w.loadTrainingExceptions()).length, n("miPlatoFacil_trainingExceptions")]
  };
  const mal = Object.entries(cuentas).filter(([, [a, b]]) => a !== b || !(b > 0));
  ok("K5 los conteos de cada módulo coinciden con el respaldo (y ninguno está vacío)", mal.length === 0, mal.map(([k, [a, b]]) => k + " " + a + "≠" + b).join(", "));
  // K6 Las pantallas muestran esos datos
  const doc = w.document, tab = t => doc.querySelector('#sectionNav [data-section-tab="' + t + '"]');
  tab("semana").click(); await espera(80);
  const semana = doc.getElementById("planHint").textContent;
  tab("miscomidas").click(); await espera(80);
  const comidas = doc.getElementById("savedHint").textContent;
  ok("K6 Semana y Mis comidas muestran lo del respaldo", /Tenés 28 comidas asignadas/.test(semana) && /Tenés 9 platos y 5 recetas/.test(comidas), semana + " | " + comidas);
  document.getElementById("marcoPrueba").remove();
  localStorage.clear();
  return T;
})()
