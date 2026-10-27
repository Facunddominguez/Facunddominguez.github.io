// DOM-01 battery.
(async () => {
  const { wait, results, reset, setAmounts, IDEA1 } = window.R2; const T = results();
  reset();
  const ids = [...document.querySelectorAll("[id]")].map(e => e.id), dups = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
  T.ok("D1 ningún ID duplicado en la página", dups.length === 0, dups.join(","));
  setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Papa", quantity: 200, unit: "g" }] } });
  go("compras"); await wait(80);
  await window.R2.openPanel("quantShoppingPanel");
  await window.R2.openPanel("stockDeductionPanel");
  document.querySelector("[data-quant-recipe]").checked = true;
  const own = () => document.getElementById("stockDeductionStatus").textContent, pantry = () => document.getElementById("stockStatus").textContent;
  document.getElementById("stockStatus").textContent = "";
  document.getElementById("stockPrepare").click(); await wait(50);
  T.ok("D2 preparar revisión escribe en su propio panel", /Escribí 0/.test(own()) && pantry() === "", own());
  document.querySelector("[data-stock-available]").value = "50";
  document.getElementById("stockRows").dispatchEvent(new Event("input", { bubbles: true }));
  T.ok("D3 modificar existencias avisa en su propio panel", /Existencias modificadas/.test(own()) && pantry() === "");
  document.getElementById("stockCalculate").click(); await wait(50);
  T.ok("D4 calcular muestra resultado y mensaje en su panel", /Simulación calculada/.test(own()) && /falta 150 g/.test(document.getElementById("stockResult").textContent) && pantry() === "", document.getElementById("stockResult").textContent);
  const before = own();
  document.getElementById("stockIngredient").value = "Arroz"; document.getElementById("stockQuantity").value = "300";
  document.getElementById("stockSave").click(); await wait(50);
  T.ok("D5 guardar existencia escribe en el panel de despensa", /Existencia guardada/.test(pantry()) && own() === before, pantry());
  reset();
  return T;
})()
