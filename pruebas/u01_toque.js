// Registrar en un toque (v14.9.94): Lo comí (Hoy, con deshacer), Lo cociné (recetas) y Lo compré (Compras).
// Usan los registros de siempre y se pueden deshacer. La lista de compras no cambia. Solo datos inventados.
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setRecipes, setSaved, setPlan, setStock, tradPlate, recipePlate, IDEA1 } = R; const T = results();
  const $ = id => document.getElementById(id);
  const tab = name => document.querySelector('#sectionNav [data-section-tab="' + name + '"]');
  const keys = () => JSON.stringify(Object.fromEntries(["miPlatoFacil_pantry", "miPlatoFacil_pantryQuantities_v1", "miPlatoFacil_pantryMoves_v1", "miPlatoFacil_cookingHistory_v1", "miPlatoFacil_consumption_v1", "miPlatoFacil_plan", "miPlatoFacil_saved"].map(k => [k, localStorage.getItem(k)])));
  const papasCase = () => { setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Papa", quantity: 200, unit: "g" }] } }); setRecipes([{ id: "recipe_test0001", title: "Papas al horno", amountsTitle: IDEA1 }]) };
  window.confirm = () => true;
  reset(); comprasTransferred = new Set();
  // U1 "Lo comí" en Hoy se puede deshacer
  setSaved([tradPlate("t1", ["Papa"], ["Tomate"], ["Merluza"])]); setPlan([[todayPlanDay(), "almuerzo", "t1"]]);
  tab("semana").click(); await wait(40); tab("hoy").click(); await wait(60);
  const s0 = keys();
  document.querySelector('#todayRows [data-today-slot="almuerzo"] button').click(); await wait(60);
  const eaten = loadConsumption().length === 1 && /✓ Comido/.test(document.querySelector('#todayRows [data-today-slot="almuerzo"]').textContent);
  $("todayStatus").querySelector("[data-today-undo]").click(); await wait(40);
  T.ok("U1 'Lo comí' en Hoy se puede deshacer", eaten && loadConsumption().length === 0 && keys() === s0 && document.querySelector('#todayRows [data-today-slot="almuerzo"] button').textContent === "Lo comí" && /se deshizo/.test($("todayStatus").textContent));
  // U2 "Lo cociné" desde Mis comidas: anota la preparación de hoy y descuenta lo que tenés
  reset();
  setAmounts({ [IDEA1]: { yield: 2, rows: [{ name: "Lentejas", quantity: 300, unit: "g" }, { name: "Cebolla", quantity: 1, unit: "unidad" }, { name: "Sal", quantity: null, unit: "g" }] } });
  setRecipes([{ id: "recipe_test0001", title: "Guiso", amountsTitle: IDEA1 }]);
  setStock([["Lentejas", 500, "g"]]);
  const s1 = keys();
  tab("miscomidas").click(); await wait(60);
  document.querySelector('#savedList [data-saved-recipe-cook="recipe_test0001"]').click(); await wait(40);
  const hist = loadCookingHistory(), lent = loadStockQuantities()[stockKey("Lentejas", "g")], msg2 = $("savedActionStatus").textContent;
  T.ok("U2 'Lo cociné' anota la preparación de hoy y descuenta lo que tenés", hist.length === 1 && hist[0].title === "Guiso" && hist[0].date === localTrainingDate(new Date()) && hist[0].sourceId === "recipe_test0001" && lent.quantity === 200 && /Se descontó de tu despensa: Lentejas 300 g/.test(msg2) && /No alcanzó: Cebolla/.test(msg2) && !loadStockQuantities()[stockKey("Cebolla", "unidad")], msg2);
  // U3 Deshacer vuelve todo a como estaba (despensa, movimientos e historial)
  $("savedActionStatus").querySelector("[data-one-tap-undo]").click(); await wait(30);
  T.ok("U3 deshacer 'Lo cociné' deja todo como estaba", keys() === s1 && /se deshizo/.test($("savedActionStatus").textContent));
  // U4 En la receta: se ve en modo simple; sin cantidades solo anota
  setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Romero", quantity: null, unit: "g" }] } });
  const stockBefore = localStorage.getItem("miPlatoFacil_pantryQuantities_v1");
  go("ingredientes"); showRecipeView("browse"); showRecipeRead("recipe_test0001"); await wait(30);
  const visible = $("recipeReadCookNow").getClientRects().length > 0 && $("recipeReadCooked").getClientRects().length === 0;
  $("recipeReadCookNow").click(); await wait(30);
  T.ok("U4 'Lo cociné' en la receta se ve en modo simple y, sin cantidades, solo anota", visible && loadCookingHistory().length === 1 && localStorage.getItem("miPlatoFacil_pantryQuantities_v1") === stockBefore && /no tiene cantidades/.test($("recipeReadStatus").textContent), $("recipeReadStatus").textContent);
  closeRecipeRead(false);
  // U5 "Lo compré" sin nada tachado avisa y no cambia nada
  reset(); comprasTransferred = new Set(); papasCase();
  setSaved([recipePlate("rp1", "recipe_test0001", "Papas al horno", ["Papa"]), tradPlate("tp1", ["Arroz"], ["Tomate"], ["Merluza"])]);
  setPlan([["lunes", "almuerzo", "rp1"], ["lunes", "cena", "tp1"]]);
  tab("compras").click(); await wait(60);
  const s5 = keys(), labels = shoppingDisplayItems().map(x => x.label).join("|"), grupos = () => shoppingDisplayItems().map(x => x.name + ":" + x.group).join("|");
  $("comprasBought").click(); await wait(30);
  T.ok("U5 'Lo compré' se ve en modo simple; sin nada tachado avisa y no cambia nada", $("comprasBought").getClientRects().length > 0 && keys() === s5 && /Primero tachá/.test($("comprasBoughtStatus").textContent));
  // U6 Lo tachado pasa a la despensa: con cantidad suma existencias; sin cantidad queda marcado
  toggleShop(ingredientKey("Papa"), true); toggleShop(ingredientKey("Tomate"), true); await wait(20);
  const checks6 = localStorage.getItem("miPlatoFacil_shoppingChecks_v1");
  $("comprasBought").click(); await wait(40);
  const papa6 = loadStockQuantities()[stockKey("Papa", "g")], msg6 = $("comprasBoughtStatus").textContent;
  T.ok("U6 'Lo compré' pasa lo tachado a la despensa (con y sin cantidad)", !!papa6 && papa6.quantity === 200 && JSON.parse(localStorage.getItem("miPlatoFacil_pantry")).includes("tomate") && loadPantryMoves().some(m => /^Lo compré/.test(m.reason) && m.delta === 200) && /Pasó a tu despensa: Papa 200 g, Tomate \(sin cantidad\)/.test(msg6) && grupos() === "Arroz:pendiente|Merluza:pendiente|Papa:comprado|Tomate:comprado" && /Ya en tu despensa \(2\)/.test($("comprasList").textContent), msg6);
  // U7 Deshacer "Lo compré" deja todo como estaba
  $("comprasBoughtStatus").querySelector("[data-one-tap-undo]").click(); await wait(30);
  T.ok("U7 deshacer 'Lo compré' deja todo como estaba (también tachados y comprados)", keys() === s5 && localStorage.getItem("miPlatoFacil_shoppingChecks_v1") === checks6 && grupos() === "Arroz:pendiente|Merluza:pendiente|Papa:pendiente|Tomate:pendiente" && comprasDone[ingredientKey("Papa")] === true && /se deshizo/.test($("comprasBoughtStatus").textContent));
  // U8 La lista no cambia (Compras no cambia sola) y tocar de nuevo no suma dos veces
  $("comprasBought").click(); await wait(30); $("comprasBought").click(); await wait(30);
  T.ok("U8 la lista no cambia y tocar de nuevo no suma dos veces", labels === shoppingDisplayItems().map(x => x.label).join("|") && loadStockQuantities()[stockKey("Papa", "g")].quantity === 200 && /ya está en tu despensa/.test($("comprasBoughtStatus").textContent));
  // U9 Con una sugerencia aplicada, suma solo lo que faltaba comprar
  reset(); comprasTransferred = new Set(); papasCase();
  setSaved([recipePlate("rp1", "recipe_test0001", "Papas al horno", ["Papa"])]); setPlan([["lunes", "almuerzo", "rp1"]]); setStock([["Papa", 50, "g"]]);
  go("compras"); await wait(40);
  // v15: "Anotar" se integró: con "faltan X", Lo compré suma solo lo que faltaba.
  const sugg = shoppingDisplayItems().find(x => x.name === "Papa").suggestion, faltan = R.renderedRows().includes("Papa: 200 g · faltan 150 g");
  toggleShop(ingredientKey("Papa"), true); await wait(20);
  $("comprasBought").click(); await wait(30);
  T.ok("U9 con la sugerencia aplicada suma solo lo que faltaba (150 g)", sugg.kind === "partial" && faltan && loadStockQuantities()[stockKey("Papa", "g")].quantity === 200 && /Papa 150 g/.test($("comprasBoughtStatus").textContent), $("comprasBoughtStatus").textContent);
  reset(); comprasTransferred = new Set(); tab("hoy").click(); await wait(30);
  return T;
})()
