// UNI-01 battery.
(async () => {
  const { wait, results, reset, setStock } = window.R2; const T = results();
  reset();
  const opts = [...document.getElementById("stockUnit").options].map(o => o.value);
  T.ok("U1 la despensa ofrece las 8 unidades de las recetas", JSON.stringify(opts) === JSON.stringify(RECIPE_AMOUNT_UNITS), opts.join(","));
  setStock([["Arroz", 300, "g"]]); renderStockQuantities();
  T.ok("U2 existencias anteriores en g siguen visibles", document.getElementById("stockList").textContent.includes("Arroz: 300 g"));
  document.getElementById("stockIngredient").value = "Azúcar"; document.getElementById("stockQuantity").value = "2"; document.getElementById("stockUnit").value = "cucharada";
  document.getElementById("stockSave").click(); await wait(50);
  T.ok("U3 se puede registrar en cucharadas", !!loadStockQuantities()[stockKey("Azúcar", "cucharada")] && document.getElementById("stockList").textContent.includes("Azúcar: 2 cucharada"));
  document.getElementById("stockUnit").value = "g";
  const edit = [...document.querySelectorAll("#stockList .shop-item")].find(r => r.textContent.includes("Azúcar")).querySelector("button");
  edit.click(); await wait(30);
  T.ok("U4 Editar recupera la unidad cucharada", document.getElementById("stockUnit").value === "cucharada");
  T.ok("U5 sin aviso de arranque", !document.getElementById("startupIssues"));
  reset();
  return T;
})()
