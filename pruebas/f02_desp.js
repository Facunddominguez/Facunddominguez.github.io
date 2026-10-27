// F02-05/06 battery: pantry movements, deduct when cooking, add from purchases.
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setRecipes, setStock, IDEA1 } = R; const T = results();
  window.confirm = () => true;
  const $ = id => document.getElementById(id);
  reset();
  go("compras"); await R.openPanel("shoppingToolsPanel"); await R.openPanel("shoppingQuantCostPanel");
  $("stockIngredient").value = "Papa"; $("stockQuantity").value = "300"; $("stockUnit").value = "g"; $("stockSave").click(); await wait(10);
  $("stockIngredient").value = "Papa"; $("stockQuantity").value = "200"; $("stockUnit").value = "g"; $("stockSave").click(); await wait(10);
  let moves = loadPantryMoves();
  T.ok("D1 ajustes manuales registran movimientos", moves.length === 2 && moves[0].delta === 300 && moves[1].delta === -100 && moves[1].reason === "Ajuste manual");
  [...$("stockList").querySelectorAll("button")].find(b => b.textContent === "Quitar").click(); await wait(10);
  moves = loadPantryMoves();
  T.ok("D2 quitar una existencia registra la salida", moves.length === 3 && moves[2].delta === -200 && /Quitada/.test(moves[2].reason));
  $("stockMovesPanel").open = true; await wait(10);
  T.ok("D3 'Movimientos recientes' muestra lo último primero", /Papa −200 g · Quitada de la despensa/.test($("stockMoves").querySelector("p").textContent), $("stockMoves").textContent.slice(0, 120));
  // Cooking deducts across forms and units, never below zero
  setAmounts({ [IDEA1]: { yield: 2, rows: [{ name: "Papa", quantity: 300, unit: "g" }, { name: "Sal", quantity: 5, unit: "g" }, { name: "Romero", quantity: null, unit: "g" }] } });
  setRecipes([{ id: "recipe_test0001", title: "Papas al horno", amountsTitle: IDEA1 }]);
  setStock([["Papa", 100, "g"], ["Papas", 1, "kg"]]);
  go("ingredientes"); showRecipeView("browse"); showRecipeRead("recipe_test0001");
  $("recipeReadCooked").click(); await wait(20);
  const stock = loadStockQuantities(), a = stock[stockKey("Papa", "g")], b = stock[stockKey("Papas", "kg")];
  T.ok("D4 'Descontar de la despensa' usa primero 100 g y luego 0,2 kg", a.quantity === 0 && b.quantity === 0.8, JSON.stringify(stock));
  T.ok("D5 avisa lo que no alcanzó y no inventa existencias", /No alcanzó: Sal: faltaron 5 g/.test($("recipeCatalogCount").textContent) && !stock[stockKey("Sal", "g")], $("recipeCatalogCount").textContent);
  $("recipeReadCooked").click(); await wait(20);
  T.ok("D6 nunca deja cantidades negativas", loadStockQuantities()[stockKey("Papas", "kg")].quantity >= 0 && loadStockQuantities()[stockKey("Papa", "g")].quantity === 0);
  window.confirm = () => false; const before = localStorage.getItem("miPlatoFacil_pantryQuantities_v1"); $("recipeReadCooked").click(); await wait(10); window.confirm = () => true;
  T.ok("D7 cancelar no modifica nada", localStorage.getItem("miPlatoFacil_pantryQuantities_v1") === before);
  closeRecipeRead(false);
  // Purchase adds to pantry
  go("compras"); await R.openPanel("shoppingToolsPanel"); await R.openPanel("purchasesPanel");
  $("purchaseItems").replaceChildren(); appendPurchaseItem({ name: "Papas", quantity: 2, unit: "kg", price: 3000 }); appendPurchaseItem({ name: "Leche", quantity: 1, unit: "l", price: 1200 }); appendPurchaseItem({ name: "Pan", quantity: null, unit: null, price: null });
  $("purchaseTotal").value = "4200"; $("purchaseAddStock").checked = true; $("purchaseUpdatePrices").checked = false; $("purchaseSave").click(); await wait(20);
  const st2 = loadStockQuantities();
  T.ok("D8 la compra suma a la despensa solo lo que tiene cantidad y unidad", Math.abs(st2[stockKey("Papas", "kg")].quantity - 2.5) < 1e-9 && st2[stockKey("Leche", "l")].quantity === 1 && !st2[stockKey("Pan", "unidad")] && /Se sumaron 2 productos a la despensa/.test($("purchaseStatus").textContent), $("purchaseStatus").textContent + " " + JSON.stringify(st2));
  T.ok("D9 los movimientos de compra quedan registrados", loadPantryMoves().filter(m => /^Compra del/.test(m.reason)).length === 2);
  let err = null; const snap = completeBackupSnapshot(localStorage); try { validateCompleteBackup(snap) } catch (e) { err = e.message }
  const bad = JSON.parse(JSON.stringify(snap)); bad.data["miPlatoFacil_pantryMoves_v1"] = JSON.stringify([{ at: "x", name: "", unit: "g", delta: 1, reason: "" }]);
  let e2 = null; try { validateCompleteBackup(bad) } catch (e) { e2 = e.message }
  T.ok("D10 respaldo con movimientos válido; inválidos se rechazan", err === null && "miPlatoFacil_pantryMoves_v1" in snap.data && /Movimientos de despensa inválidos/.test(e2 || ""), err + " / " + e2);
  window.__desp_storage = JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
  return T;
})()
