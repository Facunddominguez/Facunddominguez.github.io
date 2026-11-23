// DOM-01 battery.
(async () => {
  const { wait, results, reset, setAmounts, IDEA1 } = window.R2; const T = results();
  reset();
  const ids = [...document.querySelectorAll("[id]")].map(e => e.id), dups = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
  T.ok("D1 ningún ID duplicado en la página", dups.length === 0, dups.join(","));
  setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Papa", quantity: 200, unit: "g" }] } });
  go("compras"); await wait(80);
  // v19.8 (R5-K-12, K-13, K-16): los paneles de "otras recetas", "descontar lo que ya tengo", "existencias" y "movimientos" se
  // eliminaron; cada panel que queda escribe en su propio estado y no en el de otro.
  const sobran = ["quantShoppingPanel", "stockDeductionPanel", "shoppingQuantCostPanel", "stockMovesPanel", "stockSave", "stockStatus"].filter(id => document.getElementById(id));
  T.ok("D2 los paneles eliminados ya no están en la página", sobran.length === 0, sobran.join(","));
  const est = id => document.getElementById(id).textContent;
  go("ingredientes"); await wait(50);
  const otros = () => ["purchaseStatus", "priceStatus", "recipeCostStatus"].map(est).join("|"), otrosAntes = otros();
  document.getElementById("pantryItemName").value = "Arroz"; document.getElementById("pantryItemQty").value = "300"; document.getElementById("pantryItemUnit").value = "g";
  document.getElementById("pantryItemSubmit").click(); await wait(50);
  T.ok("D3 guardar una existencia escribe en el estado de la despensa", /Guardado: Arroz/.test(est("pantryItemStatus")) && otros() === otrosAntes, est("pantryItemStatus"));
  const antesDespensa = est("pantryItemStatus");
  await window.R2.openPanel("purchasesPanel");
  document.getElementById("purchaseFromList").click(); await wait(50);
  T.ok("D4 'Cargar pendientes' escribe en el estado de Compras realizadas", est("purchaseStatus") !== "" && est("pantryItemStatus") === antesDespensa && est("priceStatus") === "", est("purchaseStatus"));
  await window.R2.openPanel("pricePanel");
  document.getElementById("priceName").value = ""; document.getElementById("priceForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); await wait(50);
  const antesCompra = est("purchaseStatus");
  T.ok("D4 guardar un precio inválido escribe en el estado de Mis precios", est("priceStatus") !== "" && est("purchaseStatus") === antesCompra && est("pantryItemStatus") === antesDespensa, est("priceStatus"));
  await window.R2.openPanel("recipeCostPanel");
  document.getElementById("recipeCostPrepare").click(); await wait(50);
  T.ok("D5 preparar el costo de una receta escribe en su propio estado", est("recipeCostStatus") !== "" && est("priceStatus") !== est("recipeCostStatus") && est("pantryItemStatus") === antesDespensa && est("purchaseStatus") === antesCompra, est("recipeCostStatus"));
  reset();
  return T;
})()
