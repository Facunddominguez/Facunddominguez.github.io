// R4 battery: accessibility, amount editor layout, simplified Compras, dead code removed.
(async () => {
  const R = window.R2, { wait, results, criticalCase } = R; const T = results();
  criticalCase(); go("compras"); await wait(60);
  const cbs = [...document.querySelectorAll("#comprasList input[data-shop-key]")];
  T.ok("X1 cada casilla de Compras tiene su etiqueta (nombre accesible)", cbs.length === 3 && cbs.every(cb => cb.labels.length === 1 && cb.labels[0].textContent.length > 0), cbs.map(cb => cb.labels[0] && cb.labels[0].textContent).join(" | "));
  const tomato = cbs.find(cb => cb.labels[0].textContent === "Tomate");
  tomato.labels[0].click(); await wait(40);
  T.ok("X2 tocar el nombre tilda la casilla", comprasDone[normalizeSearchText("Tomate")] === true && /1 tachados/.test(document.getElementById("comprasSummary").textContent));
  const ids = [...document.querySelectorAll("[id]")].map(e => e.id), dups = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
  T.ok("X3 sin IDs duplicados", dups.length === 0, dups.join(","));
  const sec = document.getElementById("compras"), kids = [...sec.children].map(e => e.id || e.className);
  const idx = id => kids.indexOf(id);
  T.ok("X4 Compras: lista, extras y Compartir arriba; herramientas al final", idx("comprasList") < idx("manualShoppingPanel") && idx("manualShoppingPanel") < idx("comprasStatus") && idx("comprasStatus") < idx("shoppingToolsPanel") && kids.at(-1) === "shoppingToolsPanel", kids.join(" > "));
  const tools = document.getElementById("shoppingToolsPanel");
  const inside = ["shoppingBudgetPanel", "shoppingQuantCostPanel", "recipeCostPanel", "pricePanel", "quantShoppingPanel", "stockDeductionPanel"].every(id => tools.contains(document.getElementById(id)));
  const source = await (await fetch(location.href, { cache: "no-store" })).text();
  T.ok("X5 las 6 herramientas están dentro del bloque plegable, cerrado por defecto", inside && source.includes('<details class="home-group" id="shoppingToolsPanel"><summary>'));
  await R.openPanel("shoppingToolsPanel"); await R.openPanel("shoppingBudgetPanel");
  T.ok("X6 las herramientas siguen funcionando dentro del bloque", /Guardá un presupuesto/.test(document.getElementById("shoppingBudgetResult").textContent));
  tools.open = false;
  T.ok("X7 la indicación explica dónde registrar la despensa", /Más herramientas/.test(document.getElementById("comprasHint").textContent));
  T.ok("X8 código sin uso eliminado", typeof buildShopping === "undefined" && typeof shoppingMissingLabel === "undefined" && !document.querySelector("[data-manual-copy]"));
  T.ok("X9 copiar la lista sigue funcionando", /🛒 Lista de compras/.test(comprasText()) && comprasText().includes("Papa: 200 g"));
  return T;
})()
