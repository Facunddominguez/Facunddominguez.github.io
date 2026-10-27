// F04 + F02-04 battery: purchases, budget period/people, plan cost, price history, recipe cost per portion.
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setRecipes, setSaved, recipePlate, setPlan, IDEA1 } = R; const T = results();
  window.confirm = () => true;
  const $ = id => document.getElementById(id);
  reset();
  T.ok("G0 montos en formato argentino", parseMoneyText("25000") === 25000 && parseMoneyText("25.000") === 25000 && parseMoneyText("25.000,50") === 25000.5 && parseMoneyText("1500.5") === 1500.5 && parseMoneyText("1,5") === 1.5 && parseMoneyText("", true) === null);
  const today = localTrainingDate(new Date());
  setAmounts({ [IDEA1]: { yield: 4, rows: [{ name: "Papa", quantity: 1, unit: "kg" }, { name: "Sal", quantity: null, unit: "g" }] } });
  setRecipes([{ id: "recipe_test0001", title: "Papas al horno", amountsTitle: IDEA1 }]);
  setSaved([recipePlate("rp1", "recipe_test0001", "Papas al horno", ["Papa", "Sal"])]); setPlan([[todayPlanDay(), "almuerzo", "rp1"]]);
  localStorage.setItem("miPlatoFacil_planPortions_v1", JSON.stringify({ [todayPlanDay() + "|almuerzo"]: 2 }));
  go("compras"); await R.openPanel("shoppingToolsPanel");
  // Purchases
  await R.openPanel("purchasesPanel");
  T.ok("G1 la fecha de compra se completa con hoy", $("purchaseDate").value === typedAppDateLabel(today));
  $("purchaseFromList").click(); await wait(20);
  const names = [...document.querySelectorAll("#purchaseItems [data-purchase-name]")].map(i => i.value), q0 = document.querySelector("#purchaseItems [data-purchase-qty]").value;
  T.ok("G2 'Cargar pendientes de la lista' trae los productos con su cantidad", names.join(",") === "Papa,Sal" && q0 === "0,5", names.join(",") + " / " + q0);
  document.querySelectorAll("#purchaseItems [data-purchase-price]")[0].value = "750";
  $("purchaseTotal").value = "25.000,50"; $("purchaseStore").value = "Verdulería"; $("purchaseUpdatePrices").checked = true;
  $("purchaseSave").click(); await wait(20);
  const pur = loadPurchases(), prices = Object.values(loadReferencePrices());
  T.ok("G3 registrar la compra y guardar el precio del ticket como referencia", pur.length === 1 && pur[0].total === 25000.5 && pur[0].items.length === 2 && prices.length === 1 && prices[0].name === "Papa" && prices[0].amount === 0.5 && prices[0].unit === "kg" && prices[0].price === 750 && /Se guardaron 1 precios/.test($("purchaseStatus").textContent), $("purchaseStatus").textContent);
  T.ok("G4 la lista muestra el total del mes", /Este mes: 1 compra · 25\.000,50 ARS/.test($("purchaseList").textContent), $("purchaseList").textContent.slice(0, 80));
  const before = localStorage.getItem("miPlatoFacil_purchases_v1");
  $("purchaseDate").value = "01/01/2099"; $("purchaseTotal").value = "100"; $("purchaseSave").click(); await wait(5); const e1 = $("purchaseStatus").textContent;
  $("purchaseDate").value = typedAppDateLabel(today); $("purchaseCurrency").value = "pesos"; $("purchaseSave").click(); await wait(5); const e2 = $("purchaseStatus").textContent;
  $("purchaseCurrency").value = "ARS"; appendPurchaseItem({ name: "Leche", quantity: 2, unit: null }); $("purchaseSave").click(); await wait(5); const e3 = $("purchaseStatus").textContent;
  $("purchaseItems").replaceChildren(); $("purchaseTotal").value = "abc"; $("purchaseSave").click(); await wait(5); const e4 = $("purchaseStatus").textContent;
  T.ok("G5 datos inválidos no se registran", /no puede ser futura/.test(e1) && /3 letras/.test(e2) && /Elegí la unidad de Leche/.test(e3) && /Total: ingresá un número positivo/.test(e4) && localStorage.getItem("miPlatoFacil_purchases_v1") === before, [e1, e2, e3, e4].join(" | "));
  // Budget with period and people
  await R.openPanel("shoppingBudgetPanel");
  $("shoppingBudgetCurrency").value = "ARS"; $("shoppingBudgetLimit").value = "100000"; $("shoppingBudgetPeriod").value = "mes"; $("shoppingBudgetPeople").value = "2";
  $("shoppingBudgetSave").click(); await wait(20);
  const b = shoppingBudgetRead(), txt = $("shoppingBudgetResult").textContent;
  T.ok("G6a presupuesto mensual por persona guardado", b.period === "mes" && b.people === 2 && validShoppingBudget(b) && !validShoppingBudget({ currency: "ARS", limit: 1, period: "año" }));
  T.ok("G6b muestra gasto real del mes, disponible y por persona", /Gasto real del mes \(compras registradas\): 25\.000,50 ARS/.test(txt) && /Disponible según gasto real: 74\.999,50 ARS/.test(txt) && /Por persona: 50\.000,00 ARS por mes/.test(txt), txt.slice(0, 400));
  T.ok("G7 costo de todas las recetas del plan con porciones (0,5 kg a 1500/kg = 750)", /Costo de todas las recetas del plan \(sin descontar despensa\): 750,00 ARS · 1 ingrediente sin precio o sin cantidad/.test(txt), txt);
  $("shoppingBudgetPeriod").value = "semana"; $("shoppingBudgetPeople").value = ""; $("shoppingBudgetSave").click(); await wait(20);
  T.ok("G8 semana: compara estimado y gastado", /Gasto real de esta semana/.test($("shoppingBudgetResult").textContent) && /diferencia/.test($("shoppingBudgetResult").textContent) && shoppingBudgetRead().people === undefined);
  // Price history and recipe cost per portion
  const pr = loadReferencePrices(); pr.old = { id: "old", name: "Papas", pack: "", amount: 1000, price: 1000, unit: "g", currency: "ARS", date: "2026-09-01" }; localStorage.setItem("miPlatoFacil_referencePrices_v1", JSON.stringify(pr));
  await R.openPanel("pricePanel");
  T.ok("G9 evolución de precios por kg entre fechas", /Papa: 1\.000 → 1\.500 ARS por kg \(\+50 %\) entre 01\/09\/2026 y/.test($("priceHistory").textContent), $("priceHistory").textContent);
  delete pr.old; localStorage.setItem("miPlatoFacil_referencePrices_v1", JSON.stringify(pr));
  go("ingredientes"); showRecipeView("browse"); showRecipeRead("recipe_test0001");
  T.ok("G10a la receta muestra costo total y por porción", /Costo estimado con tus precios: 1\.500,00 ARS \(375,00 por porción\) · 1 ingrediente sin precio o sin cantidad/.test($("recipeReadIngredients").textContent), $("recipeReadIngredients").textContent);
  closeRecipeRead(false); $("recipeRecommendCosts").checked = true; renderRecipeCatalog();
  T.ok("G10b la tarjeta permite comparar el costo entre recetas", /Costo estimado con tus precios: 1\.500,00 ARS \(375,00 por porción\)/.test($("recipeCatalogResults").textContent));
  $("recipeRecommendCosts").checked = false; renderRecipeCatalog();
  // Remove purchase and backup
  go("compras"); await R.openPanel("shoppingToolsPanel"); await R.openPanel("purchasesPanel");
  let err = null; const snap = completeBackupSnapshot(localStorage); try { validateCompleteBackup(snap) } catch (e) { err = e.message }
  const bad = JSON.parse(JSON.stringify(snap)); bad.data["miPlatoFacil_purchases_v1"] = JSON.stringify([{ id: "x", date: today, store: "", currency: "ARS", total: -5, items: [] }]);
  let e5 = null; try { validateCompleteBackup(bad) } catch (e) { e5 = e.message }
  T.ok("G11 respaldo con compras válido; montos negativos se rechazan", err === null && "miPlatoFacil_purchases_v1" in snap.data && /Compras registradas inválidas/.test(e5 || ""), err + " / " + e5);
  document.querySelector("[data-purchase-remove]").click(); await wait(10);
  T.ok("G12 quitar la compra no borra los precios guardados", loadPurchases().length === 0 && Object.keys(loadReferencePrices()).length === 1 && localStorage.getItem("miPlatoFacil_purchases_v1") === null);
  return T;
})()
