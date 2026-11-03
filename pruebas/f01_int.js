// F01 integration battery: the canonical identity is used by Compras, pantry, prices, budget and costs.
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setRecipes, recipePlate, tradPlate, setSaved, setPlan, setStock, IDEA1, IDEA2 } = R; const T = results();
  window.confirm = () => true;
  const price = (id, name, amount, value, unit) => ({ id, name, pack: "", amount, price: value, unit, currency: "ARS", date: "2026-10-20" });
  // Recipe uses "Tomates" (2 unidad) and "Patata" (200 g); traditional plate uses "Tomate" and "Papa".
  reset();
  setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Tomates", quantity: 2, unit: "unidad" }, { name: "Patata", quantity: 200, unit: "g" }] } });
  setRecipes([{ id: "recipe_test0001", title: "Ensalada", amountsTitle: IDEA1 }]);
  setSaved([recipePlate("rp1", "recipe_test0001", "Ensalada", ["Tomates", "Patata"]), tradPlate("tp1", ["Papa"], ["Tomate"], ["Merluza"])]);
  setPlan([["lunes", "almuerzo", "rp1"], ["lunes", "cena", "tp1"]]);
  go("compras"); await wait(60);
  const rows = R.renderedRows();
  T.ok("M1 Compras une plural y sinónimo en una sola línea", rows.includes("Tomate: 2 unidades + sin cantidad en 1 plato") && R.item("Tomate").label === "Tomate: 2 unidad + sin cantidad en 1 plato" && rows.includes("Papa: 200 g + sin cantidad en 1 plato") && rows.length === 3, rows.join(" | "));
  setStock([["Tomate", 1, "unidad"], ["Papas", 500, "g"]]); renderCompras();
  const tom = R.item("Tomate"), papa = R.item("Papa");
  T.ok("M2 la despensa se reconoce aunque el nombre esté en otra forma", tom.suggestion.kind === "partial" && tom.suggestion.buy === "1 unidad" && papa.suggestion.kind === "info" && /tenés 500 g/.test(papa.suggestion.text), tom.suggestion.text + " / " + papa.suggestion.text);
  // Prices registered as "Tomate" and "Patatas" are used for "Tomates" and "Patata"
  localStorage.setItem("miPlatoFacil_referencePrices_v1", JSON.stringify({ p1: price("p1", "Tomate", 1, 100, "unidad"), p2: price("p2", "Patatas", 1000, 1500, "g") }));
  setStock([]);
  localStorage.setItem("miPlatoFacil_shoppingBudget_v1", JSON.stringify({ currency: "ARS", limit: 1000 }));
  await R.openPanel("shoppingToolsPanel"); await R.openPanel("shoppingBudgetPanel");
  const budget = document.getElementById("shoppingBudgetResult").textContent;
  T.ok("M3 presupuesto usa precios de nombres equivalentes", /Costo parcial estimado: 500,00 ARS/.test(budget) && /2 ingredientes valorizados/.test(budget), budget.slice(0, 120));
  await R.openPanel("shoppingQuantCostPanel");
  const qc = document.getElementById("shoppingQuantCostResult").textContent;
  T.ok("M4 'Ajustar porciones' usa precios equivalentes", /Subtotal estimado con referencias inequívocas: 500,00 ARS/.test(qc), qc.slice(0, 160));
  await R.openPanel("recipeCostPanel");
  document.getElementById("recipeCostTitle").value = IDEA1; document.getElementById("recipeCostPortions").value = "1";
  document.getElementById("recipeCostPrepare").click(); await wait(30);
  const selects = [...document.querySelectorAll("[data-recipe-cost-price]")];
  selects.forEach(s => { if (s.options.length > 1) s.value = s.options[1].value });
  document.getElementById("recipeCostCalculate").click(); await wait(30);
  const cost = document.getElementById("recipeCostResult").textContent;
  T.ok("M5 'Estimar costo' ofrece y acepta precios equivalentes", selects.every(s => s.options.length === 2) && /Total estimado: 500,00 ARS/.test(cost), cost.slice(0, 160));
  // Old calculator (v14.9.45) merges plural forms
  setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Tomates", quantity: 2, unit: "unidad" }, { name: "Tomate", quantity: 1, unit: "unidad" }] } });
  const agg = aggregateQuantifiedRecipes([{ title: IDEA1, portions: 1 }], loadRecipeAmounts());
  T.ok("M6 'Calcular compras por recetas' suma formas equivalentes", agg.length === 1 && agg[0].quantity === 3, JSON.stringify(agg));
  // Recommendations: pantry registered in other form counts as available
  setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Patata", quantity: 200, unit: "g" }] } });
  setStock([["Papas", 500, "g"]]);
  const score = recipePantryScore({ kind: "propia", key: "recipe_test0001" }, loadRecipeDetails(), loadRecipeAmounts(), pantryMarkedMatcher(), loadStockQuantities());
  T.ok("M7 recomendaciones reconocen la despensa equivalente", score.known && score.complete && score.have === 1, JSON.stringify(score));
  localStorage.setItem("miPlatoFacil_referencePrices_v1", JSON.stringify({ p2: price("p2", "Patatas", 1000, 1500, "g") }));
  setStock([["Papas", 50, "g"]]);
  const mc = recipeMissingCost({ kind: "propia", key: "recipe_test0001" }, loadRecipeDetails(), loadRecipeAmounts(), loadStockQuantities(), Object.values(loadReferencePrices()));
  T.ok("M8 costo de faltantes usa despensa y precio equivalentes", mc && Math.round(mc.totals.ARS) === 225, JSON.stringify(mc));
  localStorage.setItem("miPlatoFacil_pantry", JSON.stringify(["papa"]));
  T.ok("M9 la marca 'papa' de Con lo que tengo reconoce 'Patata'", pantryMarkedMatcher().has("Patata") && !pantryMarkedMatcher().has("Batata"));
  // Variedades no se unen solas
  reset();
  setAmounts({ [IDEA2]: { yield: 1, rows: [{ name: "Arroz", quantity: 300, unit: "g" }] } });
  setRecipes([{ id: "recipe_test0002", title: "Arroz", amountsTitle: IDEA2 }]);
  setSaved([recipePlate("rp2", "recipe_test0002", "Arroz", ["Arroz"]), tradPlate("tp2", ["Arroz (integral, yamaní)"], ["Tomate"], ["Merluza"])]);
  setPlan([["martes", "almuerzo", "rp2"], ["martes", "cena", "tp2"]]);
  go("compras"); await wait(40);
  T.ok("M10 'Arroz' y 'Arroz (integral, yamaní)' siguen separados", R.renderedRows().includes("Arroz: 300 g") && R.renderedRows().includes("Arroz (integral, yamaní)"), R.renderedRows().join(" | "));
  return T;
})()
