// BKP-01 battery (synthetic data only). Evaluated in the app page; returns a list of results.
(async () => {
  const IDEA = "Ensalada completa: lechuga, tomate, huevo, atún y papa";
  const SEED = {
    miPlatoFacil_adviceFavorites: JSON.stringify([JSON.stringify(["menu", "Wrap de pollo, palta y vegetales"])]),
    miPlatoFacil_datedWeeks_v1: JSON.stringify({ "2026-10-19": { version: 1, plan: { lunes: { almuerzo: "p1" } }, saved: [{ id: "p1", type: "plato", title: "Almuerzo / Cena · Día libre", lines: ["Verduras: Tomate"], text: "t" }] } }),
    miPlatoFacil_manualShopping_v1: JSON.stringify([{ id: "m1", name: "Detergente", amount: "1", done: false }]),
    miPlatoFacil_pantry: JSON.stringify(["papa", "pollo"]),
    miPlatoFacil_plan: JSON.stringify({ lunes: { desayuno: null, merienda: null, almuerzo: "p1", cena: null } }),
    miPlatoFacil_planVars: JSON.stringify({ "Var A": { lunes: { desayuno: null, merienda: null, almuerzo: "p1", cena: null } } }),
    miPlatoFacil_saved: JSON.stringify([{ id: "p1", savedAt: "2026-10-20T10:00:00.000Z", type: "plato", title: "Almuerzo / Cena · Día libre", lines: ["Verduras: Tomate"], sig: "s1", text: "t", cooked: 0 }]),
    miPlatoFacil_theme: "dark",
    miPlatoFacil_trainingExceptions: JSON.stringify({ "2026-10-27": true }),
    miPlatoFacil_trainingWeek: JSON.stringify({ version: 1, days: [1, 3] }),
    miPlatoFacil_cookingHistory_v1: JSON.stringify([{ id: "h1", date: "2026-10-20", meal: "Cena", title: "x", lines: ["a"], sourceId: "p1", status: "prepared" }]),
    miPlatoFacil_recipeAmounts_v1: JSON.stringify({ [IDEA]: { yield: 1, rows: [{ name: "Papa", quantity: 200, unit: "g" }] } }),
    miPlatoFacil_referencePrices_v1: JSON.stringify({ pr1: { id: "pr1", name: "Papa", pack: "bolsa", amount: 1000, price: 1500, unit: "g", currency: "ARS", date: "2026-10-20" } }),
    miPlatoFacil_recipeDetails_v1: JSON.stringify({ recipe_test0001: { id: "recipe_test0001", title: "Papas al horno", sourceTitle: null, amountsTitle: IDEA, steps: ["Hornear"], notes: "" } }),
    miPlatoFacil_pantryQuantities_v1: JSON.stringify({ [stockKey("Papa", "g")]: { name: "Papa", quantity: 200, unit: "g" } }),
    miPlatoFacil_shoppingBudget_v1: JSON.stringify({ currency: "ARS", limit: 30000 }),
    miPlatoFacil_recipePreferences_v1: JSON.stringify({ words: "cebolla", enabled: true }),
  };
  window.__SEED = SEED;
  const seed = () => { localStorage.clear(); for (const [k, v] of Object.entries(SEED)) localStorage.setItem(k, v); };
  const T = []; const ok = (name, cond, detail) => T.push((cond ? "PASA " : "FALLA ") + name + (detail ? " · " + detail : ""));
  const rejects = o => { try { validateCompleteBackup(o); return null } catch (e) { return e.message } };
  const NEW3 = ["miPlatoFacil_pantryQuantities_v1", "miPlatoFacil_shoppingBudget_v1", "miPlatoFacil_recipePreferences_v1"];
  seed();
  const snap = completeBackupSnapshot(localStorage);
  ok("B1 respaldo incluye las 17 claves", Object.keys(snap.data).length === 17 && Object.keys(SEED).every(k => k in snap.data));
  ok("B2 respaldo propio válido", rejects(snap) === null, rejects(snap));
  localStorage.clear(); restoreCompleteBackup(snap, localStorage);
  ok("B3 ida y vuelta: 17 claves idénticas", Object.keys(SEED).every(k => localStorage.getItem(k) === SEED[k]));
  seed(); const old73 = JSON.parse(JSON.stringify(snap)); NEW3.forEach(k => delete old73.data[k]); old73.data.miPlatoFacil_pantry = JSON.stringify(["arroz"]);
  ok("B4a respaldo formato v14.9.73 aceptado", rejects(old73) === null, rejects(old73));
  restoreCompleteBackup(old73, localStorage);
  ok("B4b restauración antigua reemplaza módulos incluidos", localStorage.getItem("miPlatoFacil_pantry") === '["arroz"]');
  ok("B4c y conserva los 3 módulos ausentes (regla R01)", NEW3.every(k => localStorage.getItem(k) === SEED[k]));
  const old45 = JSON.parse(JSON.stringify(old73)); delete old45.data.miPlatoFacil_recipeDetails_v1;
  ok("B5 respaldo formato v14.9.45 aceptado", rejects(old45) === null, rejects(old45));
  const bad = (k, v) => { const o = JSON.parse(JSON.stringify(snap)); if (v === undefined) delete o.data[k]; else o.data[k] = v; return rejects(o) };
  ok("B6a presupuesto con moneda EUR rechazado", !!bad("miPlatoFacil_shoppingBudget_v1", JSON.stringify({ currency: "EUR", limit: 10 })));
  ok("B6b presupuesto negativo rechazado", !!bad("miPlatoFacil_shoppingBudget_v1", JSON.stringify({ currency: "ARS", limit: -1 })));
  ok("B6c existencia negativa rechazada", !!bad("miPlatoFacil_pantryQuantities_v1", JSON.stringify({ [stockKey("Papa", "g")]: { name: "Papa", quantity: -5, unit: "g" } })));
  ok("B6d existencia con clave inconsistente rechazada", !!bad("miPlatoFacil_pantryQuantities_v1", JSON.stringify({ otra: { name: "Papa", quantity: 5, unit: "g" } })));
  ok("B6e existencia con unidad desconocida rechazada", !!bad("miPlatoFacil_pantryQuantities_v1", JSON.stringify({ [stockKey("Papa", "bolsa")]: { name: "Papa", quantity: 5, unit: "bolsa" } })));
  ok("B6f preferencias con enabled no booleano rechazadas", !!bad("miPlatoFacil_recipePreferences_v1", JSON.stringify({ words: "x", enabled: "si" })));
  ok("B6g clave desconocida sigue rechazada", !!bad("miPlatoFacil_otraCosa", "{}"));
  ok("B6h clave obligatoria faltante sigue rechazada", !!bad("miPlatoFacil_plan", undefined));
  ok("B6i formato inválido rechazado", !!rejects({ app: "Otra", format: "x", data: {} }));
  ok("B6j campo __proto__ rechazado", !!bad("miPlatoFacil_shoppingBudget_v1", '{"currency":"ARS","limit":1,"__proto__":{"x":1}}'));
  seed(); const nulls = JSON.parse(JSON.stringify(snap)); NEW3.forEach(k => nulls.data[k] = null);
  restoreCompleteBackup(nulls, localStorage);
  ok("B7 módulos vacíos en el respaldo se vacían al restaurar", NEW3.every(k => localStorage.getItem(k) === null));
  const mem = new Map(Object.entries(SEED)); let writes = 0;
  const fake = { getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => { writes++; if (writes === 16) throw new Error("cuota"); mem.set(k, String(v)) }, removeItem: k => mem.delete(k) };
  const alt = JSON.parse(JSON.stringify(snap)); alt.data.miPlatoFacil_pantry = JSON.stringify(["huevo"]); alt.data.miPlatoFacil_shoppingBudget_v1 = JSON.stringify({ currency: "USD", limit: 5 });
  let msg = null; try { restoreCompleteBackup(alt, fake) } catch (e) { msg = e.message }
  ok("B8 error de escritura revierte todo", !!msg && Object.keys(SEED).every(k => mem.get(k) === SEED[k]), msg);
  // Export button: verification message (download intercepted, nothing saved to disk)
  seed();
  const blobs = []; const oc = URL.createObjectURL; URL.createObjectURL = b => { blobs.push(b); return oc.call(URL, b) };
  const ac = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { };
  document.getElementById("backupExport").click();
  const okStatus = document.getElementById("backupStatus").textContent;
  const exported = JSON.parse(await blobs.at(-1).text());
  localStorage.setItem("miPlatoFacil_saved", JSON.stringify([{ id: "p9", type: "plato", text: "viejo" }]));
  document.getElementById("backupExport").click();
  const warnStatus = document.getElementById("backupStatus").textContent;
  HTMLAnchorElement.prototype.click = ac; URL.createObjectURL = oc;
  ok("B9 exportación confirma que el archivo se puede restaurar", /Comprobado: este respaldo se puede restaurar/.test(okStatus) && Object.keys(SEED).every(k => exported.data[k] === SEED[k]), okStatus);
  ok("B10 exportación advierte si el archivo no se podría restaurar", /Atención: este respaldo no se podría restaurar\. Motivo: Platos guardados inválidos\. Conservalo/.test(warnStatus), warnStatus);
  window.__exportedBackup = JSON.stringify(exported);
  localStorage.clear();
  return T;
})()
