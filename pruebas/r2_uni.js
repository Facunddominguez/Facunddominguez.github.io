// UNI-01 battery.
(async () => {
  const { wait, results, reset, setStock } = window.R2; const T = results();
  reset();
  // R5-K-12: las existencias con cantidad se cargan en Despensa (pantryItem*), con las 8 unidades de las recetas.
  const opts = [...document.getElementById("pantryItemUnit").options].map(o => o.value);
  T.ok("U1 la despensa ofrece las 8 unidades de las recetas", JSON.stringify(opts) === JSON.stringify(RECIPE_AMOUNT_UNITS), opts.join(","));
  setStock([["Arroz", 300, "g"]]); renderPantryItems();
  T.ok("U2 existencias anteriores en g siguen visibles", document.getElementById("pantryItemList").textContent.includes("Arroz · 300 g"));
  document.getElementById("pantryItemName").value = "Azúcar"; document.getElementById("pantryItemQty").value = "2"; document.getElementById("pantryItemUnit").value = "cucharada";
  document.getElementById("pantryItemForm").requestSubmit(); await wait(50);
  T.ok("U3 se puede registrar en cucharadas", !!loadStockQuantities()[Existencias.stockKey("Azúcar", "cucharada")] && document.getElementById("pantryItemList").textContent.includes("Azúcar · 2 cucharadas"));
  document.getElementById("pantryItemUnit").value = "g";
  const edit = [...document.querySelectorAll("#pantryItemList [data-pantry-item]")].find(r => r.textContent.includes("Azúcar")).querySelector("[data-pantry-item-edit]");
  edit.click(); await wait(30);
  T.ok("U4 Editar recupera la unidad cucharada", document.getElementById("pantryItemUnit").value === "cucharada");
  T.ok("U5 sin aviso de arranque", !document.getElementById("startupIssues"));
  reset();
  return T;
})()
