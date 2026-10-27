// Shared synthetic fixtures for R2 batteries. Defines window.R2 helpers.
window.R2 = (() => {
  const IDEA1 = "Ensalada completa: lechuga, tomate, huevo, atún y papa";
  const IDEA2 = "Merluza al vapor con arroz integral y ensalada mixta";
  const IDEA3 = "Risotto de hongos con arvejas y queso";
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const results = () => { const T = []; T.ok = (name, cond, detail) => T.push((cond ? "PASA " : "FALLA ") + name + (detail !== undefined && detail !== "" ? " · " + detail : "")); return T };
  const reset = () => { localStorage.clear(); restart(); comprasDone = {}; if (typeof comprasApplied !== "undefined") comprasApplied = {}; };
  const setAmounts = obj => localStorage.setItem("miPlatoFacil_recipeAmounts_v1", JSON.stringify(obj));
  const setRecipes = list => localStorage.setItem("miPlatoFacil_recipeDetails_v1", JSON.stringify(Object.fromEntries(list.map(r => [r.id, { id: r.id, title: r.title, sourceTitle: null, amountsTitle: r.amountsTitle, steps: ["Cocinar"], notes: "" }]))));
  const recipePlate = (id, recipeId, title, names) => ({ id, savedAt: "2026-10-26T10:00:00.000Z", type: "plato", title, lines: [], sig: "recipe-ref:" + recipeId + ":plato", text: title, cooked: 0, state: null, recipeSourceId: recipeId, recipeIngredients: names });
  const tradPlate = (id, almidones, verduras, proteinas) => ({ id, savedAt: "2026-10-26T10:00:00.000Z", type: "plato", title: "Almuerzo / Cena · Día libre", lines: ["Verduras: " + verduras.join(", "), "Almidones: " + almidones.join(", "), "Proteínas: " + proteinas.join(", ")], sig: "trad-" + id, text: "t-" + id, cooked: 0, state: { type: "plato", day: "Día libre", verduras: verduras.map(name => ({ name })), almidones: almidones.map(name => ({ name })), proteinas: proteinas.map(name => ({ name })), legCarb: [], legProt: [] } });
  const setSaved = list => localStorage.setItem("miPlatoFacil_saved", JSON.stringify(list));
  const setPlan = slots => { const plan = {}; for (const [day] of DAYS) plan[day] = { desayuno: null, merienda: null, almuerzo: null, cena: null }; for (const [day, slot, id] of slots) plan[day][slot] = id; localStorage.setItem("miPlatoFacil_plan", JSON.stringify(plan)) };
  const setStock = rows => localStorage.setItem("miPlatoFacil_pantryQuantities_v1", JSON.stringify(Object.fromEntries(rows.map(([name, quantity, unit]) => [stockKey(name, unit), { name, quantity, unit }]))));
  // Critical case: recipe "Papas al horno" (Papa 200 g) + traditional plate with Papa
  const criticalCase = () => {
    reset();
    setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Papa", quantity: 200, unit: "g" }] } });
    setRecipes([{ id: "recipe_test0001", title: "Papas al horno", amountsTitle: IDEA1 }]);
    setSaved([recipePlate("rp1", "recipe_test0001", "Papas al horno", ["Papa"]), tradPlate("tp1", ["Papa"], ["Tomate"], ["Merluza"])]);
    setPlan([["lunes", "almuerzo", "rp1"], ["lunes", "cena", "tp1"]]);
  };
  const items = () => shoppingDisplayItems();
  const item = name => items().find(x => x.name === name);
  const renderedRows = () => [...document.querySelectorAll("#comprasList .shop-item label")].map(l => l.textContent);
  // Close then open a <details> panel in separate tasks so its "toggle" handler always runs.
  const openPanel = async id => { const p = document.getElementById(id); p.open = false; await wait(15); p.open = true; await wait(50); return p };
  return { IDEA1, IDEA2, IDEA3, wait, results, reset, setAmounts, setRecipes, recipePlate, tradPlate, setSaved, setPlan, setStock, criticalCase, items, item, renderedRows, openPanel };
})();
"fixtures listos";
