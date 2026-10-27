// Despensa única (v14.9.93): "Lo básico" + otros ingredientes con cantidad opcional, en la misma pantalla.
// Sin cantidad se guarda como marca; con cantidad, como existencia (la misma de Compras). Solo datos inventados.
(async () => {
  const R = window.R2, { wait, results, reset, setSaved, setPlan, tradPlate } = R; const T = results();
  const $ = id => document.getElementById(id);
  const shown = e => !!e && e.getClientRects().length > 0;
  const pantry = () => JSON.parse(localStorage.getItem("miPlatoFacil_pantry") || "[]");
  const stock = () => loadStockQuantities();
  const moves = () => loadPantryMoves();
  const rowText = () => [...document.querySelectorAll("#pantryItemList .pantry-item")].map(r => r.querySelector(".pantry-item__text").textContent);
  const add = async (name, qty, unit) => { $("pantryItemName").value = name; $("pantryItemQty").value = qty || ""; if (unit) $("pantryItemUnit").value = unit; $("pantryItemForm").requestSubmit(); await wait(30); return $("pantryItemStatus").textContent };
  const btn = (attr, value) => [...document.querySelectorAll("#pantryItemList [" + attr + "]")].find(b => b.getAttribute(attr) === value);
  window.confirm = () => true;
  reset(); go("ingredientes"); showRecipeView("browse"); await wait(40);
  // DP1 Pantalla: Mi despensa, Lo básico, otros ingredientes e ideas justo debajo (también en modo simple)
  const sec = $("ingredientes"), pos = id => [...sec.querySelectorAll("[id]")].indexOf($(id));
  T.ok("DP1 Mi despensa: lo básico, otros ingredientes e ideas justo debajo", sec.querySelector(".screen__title").textContent === "Mi despensa" && shown($("pantryItemsPanel")) && shown($("pantryItemForm")) && pos("pantryChips") < pos("pantryItemsPanel") && pos("pantryItemsPanel") < pos("pantryResults") && pos("pantryResults") < pos("recipeDetailsPanel") && $("pantryItemUnit").options.length === RECIPE_AMOUNT_UNITS.length);
  // DP2 Sin cantidad: se guarda como ingrediente de la despensa (marca), sin tocar existencias
  const m2 = await add("Quinoa roja");
  T.ok("DP2 sin cantidad se agrega a la despensa como marca", pantry().includes("Quinoa roja") && !Object.keys(stock()).length && rowText().includes("Quinoa roja · sin cantidad") && /sin cantidad/.test(m2), m2);
  // DP3 Si es de Lo básico, marca ese botón en vez de repetirlo
  const m3 = await add("arroz");
  T.ok("DP3 un ingrediente de Lo básico marca su botón (sin repetirlo)", pantry().includes("arroz") && pantry().filter(x => x === "arroz").length === 1 && document.querySelector('[data-pantry-toggle="arroz"]').getAttribute("aria-pressed") === "true" && rowText().length === 1, m3);
  // DP4 Con cantidad: se guarda como existencia y queda el movimiento
  const m4 = await add("Arroz yamaní", "500", "g");
  const st4 = stock()[stockKey("Arroz yamaní", "g")];
  T.ok("DP4 con cantidad se guarda como existencia (la de Compras) con su movimiento", !!st4 && st4.quantity === 500 && moves().some(m => m.name === "Arroz yamaní" && m.delta === 500 && m.reason === "Ajuste manual") && rowText().includes("Arroz yamaní · 500 g"), m4);
  // DP5 Agregar cantidad a un ingrediente sin cantidad: pasa a existencia, sin quedar repetido
  btn("data-pantry-item-qty", "Quinoa roja").click(); await wait(20);
  const nameFilled = $("pantryItemName").value === "Quinoa roja";
  await add("Quinoa roja", "300", "g");
  T.ok("DP5 agregar cantidad convierte la marca en existencia, sin repetir", nameFilled && !pantry().includes("Quinoa roja") && stock()[stockKey("Quinoa roja", "g")].quantity === 300 && rowText().filter(t => t.startsWith("Quinoa roja")).length === 1);
  // DP6 Editar una existencia (cambiar unidad): se reemplaza, con sus movimientos
  btn("data-pantry-item-edit", stockKey("Arroz yamaní", "g")).click(); await wait(20);
  const editing = $("pantryItemSubmit").textContent === "Guardar cambios" && $("pantryItemQty").value === "500";
  await add("Arroz yamaní", "1", "kg");
  T.ok("DP6 editar reemplaza la existencia y registra los movimientos", editing && !stock()[stockKey("Arroz yamaní", "g")] && stock()[stockKey("Arroz yamaní", "kg")].quantity === 1 && moves().some(m => m.name === "Arroz yamaní" && m.delta === -500) && rowText().includes("Arroz yamaní · 1 kg") && $("pantryItemSubmit").textContent === "Agregar a la despensa");
  // DP7 Quitar una existencia y deshacer
  btn("data-pantry-item-remove-stock", stockKey("Arroz yamaní", "kg")).click(); await wait(30);
  const removed = !stock()[stockKey("Arroz yamaní", "kg")] && moves().some(m => m.reason === "Quitada de la despensa" && m.delta === -1);
  $("pantryItemStatus").querySelector("[data-pantry-undo]").click(); await wait(30);
  T.ok("DP7 quitar una existencia se puede deshacer", removed && stock()[stockKey("Arroz yamaní", "kg")].quantity === 1 && rowText().includes("Arroz yamaní · 1 kg"));
  // DP8 Quitar un ingrediente sin cantidad y deshacer
  await add("Comino");
  btn("data-pantry-item-remove-free", "Comino").click(); await wait(30);
  const removedFree = !pantry().includes("Comino");
  $("pantryItemStatus").querySelector("[data-pantry-undo]").click(); await wait(30);
  T.ok("DP8 quitar un ingrediente sin cantidad se puede deshacer", removedFree && pantry().includes("Comino") && rowText().includes("Comino · sin cantidad"));
  // DP9 Limpiar selección limpia Lo básico y deja lo demás
  document.querySelector("[data-pantry-clear]").click(); await wait(30);
  T.ok("DP9 'Limpiar selección' desmarca Lo básico y conserva lo demás", !pantry().includes("arroz") && pantry().includes("Comino") && !!stock()[stockKey("Quinoa roja", "g")]);
  // DP10 Compras usa la despensa: marca sin cantidad y existencia con cantidad
  setSaved([tradPlate("t1", ["Quinoa roja"], ["Comino"], ["Merluza"])]); setPlan([["lunes", "almuerzo", "t1"]]);
  const items = shoppingDisplayItems(), quinoa = items.find(x => x.name === "Quinoa roja"), comino = items.find(x => x.name === "Comino");
  T.ok("DP10 Compras sugiere con lo de la despensa (con y sin cantidad), sin cambiar la lista", !!quinoa && /Despensa: tenés 300 g/.test(quinoa.suggestion.text) && !!comino && /Lo marcaste en “Con lo que tengo”/.test(comino.suggestion.text) && items.length === 3, (quinoa && quinoa.suggestion && quinoa.suggestion.text) + " | " + (comino && comino.suggestion && comino.suggestion.text));
  // DP11 Las ideas y el asistente de IA usan también lo agregado a mano y las existencias
  localStorage.setItem("miPlatoFacil_pantry", JSON.stringify(["Merluza fresca"])); pantrySel = loadPantry();
  localStorage.setItem("miPlatoFacil_pantryQuantities_v1", JSON.stringify({ [stockKey("Lentejas", "g")]: { name: "Lentejas", quantity: 300, unit: "g" } }));
  const ideas = pantryMatches(), withLentejas = data.menuCatalog.filter(r => (" " + normalizeSearchText(r.text).replace(/[^a-z0-9]+/g, " ") + " ").includes(" lentejas ")).length;
  const ai = aiAvailableIngredients();
  T.ok("DP11 las ideas y la IA usan lo agregado a mano y las existencias", ideas.filter(r => r.matched.includes("Lentejas")).length === withLentejas && withLentejas > 0 && ai.includes("Merluza fresca") && ai.some(x => /^Lentejas \(300 g\)$/.test(x)), withLentejas + " ideas con lentejas; IA: " + ai.join(", "));
  // DP12 Se cuenta cada ingrediente una vez y se muestran las primeras 8 ideas con "Ver todas"
  localStorage.setItem("miPlatoFacil_pantry", JSON.stringify(["arroz", "pollo", "huevo", "tomate", "papa", "hojas"])); pantrySel = loadPantry();
  localStorage.setItem("miPlatoFacil_pantryQuantities_v1", JSON.stringify({ [stockKey("Arroz", "g")]: { name: "Arroz", quantity: 500, unit: "g" } }));
  pantryResultsAll = false; renderPantry(); await wait(20);
  const total = pantryMatches().length, listed = () => $("pantryResults").querySelectorAll(".menu-list li").length, more = $("pantryResults").querySelector("[data-pantry-results-toggle]");
  const firstCount = listed();
  if (more) { more.click(); await wait(20) }
  T.ok("DP12 cuenta cada ingrediente una vez y muestra 8 ideas con 'Ver todas'", /^Tenés 6 ingredientes en la despensa/.test($("pantryHint").textContent) && total > 8 && firstCount === 8 && !!more && listed() === total, $("pantryHint").textContent.slice(0, 40) + " · " + total + " ideas");
  pantryResultsAll = false;
  // DP13 El respaldo incluye lo agregado a mano y se puede restaurar (mismo formato de siempre)
  localStorage.setItem("miPlatoFacil_pantry", JSON.stringify(["arroz", "Comino"]));
  const snap = completeBackupSnapshot(localStorage);
  let ok13 = true; try { validateCompleteBackup(JSON.parse(JSON.stringify(snap))); restoreCompleteBackup(JSON.parse(JSON.stringify(snap)), localStorage) } catch (e) { ok13 = false }
  T.ok("DP13 el respaldo guarda y restaura lo agregado a mano", ok13 && JSON.parse(snap.data.miPlatoFacil_pantry).join(",") === "arroz,Comino" && pantry().join(",") === "arroz,Comino");
  // DP14 Validaciones: nombre vacío y cantidad inválida no guardan nada
  const before = JSON.stringify([pantry(), stock()]);
  const e1 = await add("   "), e2 = await add("Harina", "abc", "g");
  T.ok("DP14 nombre vacío o cantidad inválida no guardan nada", JSON.stringify([pantry(), stock()]) === before && /Escribí el ingrediente/.test(e1) && /números positivos/.test(e2), e1 + " | " + e2);
  reset(); pantrySel = []; renderPantry(); go("home");
  return T;
})()
