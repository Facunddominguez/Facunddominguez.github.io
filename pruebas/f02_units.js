// F02-01 battery: controlled unit conversion (g↔kg, ml↔l, cucharadita↔cucharada only).
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setRecipes, recipePlate, setSaved, setPlan, setStock, IDEA1 } = R; const T = results();
  window.confirm = () => true;
  T.ok("U1a conversiones exactas", convertQuantity(1, "kg", "g") === 1000 && convertQuantity(500, "ml", "l") === 0.5 && convertQuantity(1, "cucharada", "cucharadita") === 3);
  T.ok("U1b no convierte peso↔volumen, taza, ni unidad", convertQuantity(1, "g", "ml") === null && convertQuantity(1, "taza", "ml") === null && convertQuantity(1, "unidad", "g") === null && convertQuantity(1, "taza", "cucharada") === null);
  const plan = rows => { reset(); setAmounts({ [IDEA1]: { yield: 1, rows } }); setRecipes([{ id: "recipe_test0001", title: "Receta", amountsTitle: IDEA1 }]); setSaved([recipePlate("rp1", "recipe_test0001", "Receta", rows.map(r => r.name))]); setPlan([["lunes", "almuerzo", "rp1"]]) };
  plan([{ name: "Papa", quantity: 200, unit: "g" }, { name: "Papas", quantity: 1, unit: "kg" }, { name: "Leche", quantity: 300, unit: "ml" }, { name: "Leche", quantity: 1, unit: "l" }, { name: "Aceite", quantity: 1, unit: "cucharada" }, { name: "Aceite", quantity: 2, unit: "cucharadita" }, { name: "Huevo", quantity: 200, unit: "g" }, { name: "Huevo", quantity: 2, unit: "unidad" }]);
  go("compras"); await wait(50);
  const rows = R.renderedRows();
  T.ok("U2 Compras suma unidades compatibles y separa las incompatibles", rows.includes("Papa: 1,2 kg") && rows.includes("Leche: 1,3 l") && rows.includes("Aceite: 1 cucharada + 2 cucharaditas") && rows.includes("Huevo: 200 g + 2 unidades") && R.item("Aceite").label === "Aceite: 1 cucharada + 2 cucharadita" && R.item("Huevo").label === "Huevo: 200 g + 2 unidad", rows.join(" | "));
  plan([{ name: "Papa", quantity: 200, unit: "g" }]); go("compras"); await wait(30);
  T.ok("U3 con una sola unidad, la lista no cambia el formato", R.renderedRows().includes("Papa: 200 g"));
  setStock([["Papa", 1, "kg"]]); renderCompras();
  T.ok("U4a 1 kg en despensa alcanza para 200 g", R.item("Papa").suggestion.kind === "covered" && /tenés 1 kg, alcanza/.test(R.item("Papa").suggestion.text), R.item("Papa").suggestion.text);
  plan([{ name: "Papa", quantity: 1, unit: "kg" }]); setStock([["Papa", 100, "g"]]); go("compras"); await wait(30);
  T.ok("U4b faltante expresado en la unidad del plan", R.item("Papa").suggestion.buy === "0,9 kg", R.item("Papa").suggestion.text);
  setStock([["Papa", 2, "unidad"]]); renderCompras();
  T.ok("U4c despensa en 'unidad' no se convierte a kg", R.item("Papa").suggestion.kind === "info" && /2 unidad \(en otra unidad, sin convertir\)/.test(R.item("Papa").suggestion.text));
  plan([{ name: "Leche", quantity: 250, unit: "ml" }]); setStock([["Leche", 1, "taza"]]); go("compras"); await wait(30);
  T.ok("U4d taza no se convierte a ml", /unidad no coincide/.test(R.item("Leche").suggestion.text));
  // Prices in kg for needs in g
  plan([{ name: "Papa", quantity: 500, unit: "g" }]); setStock([]);
  localStorage.setItem("miPlatoFacil_referencePrices_v1", JSON.stringify({ p1: { id: "p1", name: "Papa", pack: "bolsa", amount: 1, price: 2000, unit: "kg", currency: "ARS", date: "2026-10-20" } }));
  localStorage.setItem("miPlatoFacil_shoppingBudget_v1", JSON.stringify({ currency: "ARS", limit: 5000 }));
  go("compras"); await R.openPanel("shoppingToolsPanel"); await R.openPanel("shoppingBudgetPanel");
  T.ok("U5a presupuesto: 500 g a 2000 ARS/kg = 1000 ARS", /Costo parcial estimado: 1\.000,00 ARS/.test(document.getElementById("shoppingBudgetResult").textContent), document.getElementById("shoppingBudgetResult").textContent.slice(0, 90));
  const opt = document.querySelector("#budgetCompareResult select option:nth-child(2)");
  T.ok("U5b comparar alternativas muestra el precio convertido", !!opt && /1\.000,00 ARS · 2000 \/ 1000 g/.test(opt.textContent), opt && opt.textContent);
  await R.openPanel("shoppingQuantCostPanel");
  T.ok("U5c 'Ajustar porciones' calcula el costo con precio en kg", /Subtotal estimado con referencias inequívocas: 1\.000,00 ARS/.test(document.getElementById("shoppingQuantCostResult").textContent));
  await R.openPanel("recipeCostPanel");
  document.getElementById("recipeCostTitle").value = IDEA1; document.getElementById("recipeCostPortions").value = "1";
  document.getElementById("recipeCostPrepare").click(); await wait(20);
  const sel = document.querySelector("[data-recipe-cost-price]"); sel.value = sel.options[1] ? sel.options[1].value : "";
  document.getElementById("recipeCostCalculate").click(); await wait(20);
  T.ok("U6 'Estimar costo' acepta precio en kg para receta en g", /Total estimado: 1\.000,00 ARS/.test(document.getElementById("recipeCostResult").textContent), document.getElementById("recipeCostResult").textContent.slice(0, 120));
  setStock([["Papa", 1, "kg"]]);
  const score = recipePantryScore({ kind: "propia", key: "recipe_test0001" }, loadRecipeDetails(), loadRecipeAmounts(), pantryMarkedMatcher(), loadStockQuantities());
  T.ok("U7 recomendaciones: 1 kg cubre 500 g", score.complete, JSON.stringify(score));
  const agg = aggregateQuantifiedRecipes([{ title: IDEA1, portions: 1 }], { [IDEA1]: { yield: 1, rows: [{ name: "Papa", quantity: 200, unit: "g" }, { name: "Papa", quantity: 1, unit: "kg" }] } });
  T.ok("U8 'Calcular compras por recetas' suma g y kg", agg.length === 1 && agg[0].unit === "g" && agg[0].quantity === 1200, JSON.stringify(agg));
  setStock([["Papa", 300, "g"]]); go("compras"); await R.openPanel("shoppingQuantCostPanel");
  T.ok("U9 'Ajustar porciones' descuenta despensa compatible", /Papa: 500 g · Disponible: 300 g · Falta comprar: 200 g/.test(document.getElementById("shoppingQuantCostResult").textContent), document.getElementById("shoppingQuantCostResult").textContent.slice(0, 200));
  T.ok("U10 los textos ya no prometen 'no convierte unidades'", !/No convierte unidades|Usá exactamente la misma unidad|Solo admite la misma unidad|sin convertir unidades ni/.test(document.getElementById("appMain").textContent));
  reset();
  return T;
})()
