// P1-02 battery: duplicated recipes get independent quantities.
(async () => {
  const R = window.R2, { wait, results, reset, IDEA1 } = R; const T = results();
  window.confirm = () => true;
  reset();
  R.setAmounts({ [IDEA1]: { yield: 1, rows: [{ name: "Papa", quantity: 200, unit: "g" }] } });
  R.setRecipes([{ id: "recipe_test0001", title: "Papas", amountsTitle: IDEA1 }, { id: "recipe_test0009", title: "Sin cantidades", amountsTitle: null }]);
  go("ingredientes"); await wait(30);
  duplicateRecipeFromButton("recipe_test0001"); await wait(20);
  const copy = Object.values(loadRecipeDetails()).find(r => r.title === "Copia de Papas");
  const amounts = loadRecipeAmounts();
  T.ok("F1a la copia tiene sus propias cantidades, iguales a las originales", !!copy && copy.amountsTitle === "receta:" + copy.id && JSON.stringify(amounts[copy.amountsTitle]) === JSON.stringify(amounts[IDEA1]) && /propias cantidades/.test(document.getElementById("recipeDetailsStatus").textContent));
  const panel = document.getElementById("recipeAmountsPanel"), sel = document.getElementById("amountRecipe");
  panel.open = false; await wait(15); panel.open = true; await wait(50);
  sel.value = copy.amountsTitle; sel.dispatchEvent(new Event("change", { bubbles: true })); await wait(30);
  document.querySelector("#amountRows [data-amount-quantity]").value = "500";
  document.getElementById("amountSave").click(); await wait(20);
  T.ok("F1b cambiar la copia no modifica la original", loadRecipeAmounts()[copy.amountsTitle].rows[0].quantity === 500 && loadRecipeAmounts()[IDEA1].rows[0].quantity === 200 && loadRecipeDetails().recipe_test0001.amountsTitle === IDEA1);
  duplicateRecipeFromButton("recipe_test0009"); await wait(20);
  const copy2 = Object.values(loadRecipeDetails()).find(r => r.title === "Copia de Sin cantidades");
  T.ok("F2 duplicar una receta sin cantidades no inventa cantidades", !!copy2 && copy2.amountsTitle === null && /no tenía cantidades/.test(document.getElementById("recipeDetailsStatus").textContent));
  const keysBefore = Object.keys(loadRecipeAmounts()).length, recipesBefore = Object.keys(loadRecipeDetails()).length;
  const realSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { if (k === "miPlatoFacil_recipeDetails_v1") throw new DOMException("quota", "QuotaExceededError"); return realSet.call(this, k, v) };
  duplicateRecipeFromButton("recipe_test0001"); await wait(20);
  Storage.prototype.setItem = realSet;
  T.ok("F3 si falla la copia, no quedan cantidades huérfanas y el mensaje es claro", Object.keys(loadRecipeAmounts()).length === keysBefore && Object.keys(loadRecipeDetails()).length === recipesBefore && /No se pudo crear la copia/.test(document.getElementById("recipeDetailsStatus").textContent), document.getElementById("recipeDetailsStatus").textContent);
  Storage.prototype.setItem = function (k, v) { if (k === "miPlatoFacil_recipeAmounts_v1") throw new DOMException("quota", "QuotaExceededError"); return realSet.call(this, k, v) };
  duplicateRecipeFromButton("recipe_test0001"); await wait(20);
  Storage.prototype.setItem = realSet;
  T.ok("F3b si falla al copiar las cantidades, tampoco cambia nada", Object.keys(loadRecipeAmounts()).length === keysBefore && Object.keys(loadRecipeDetails()).length === recipesBefore && /No se pudo crear la copia/.test(document.getElementById("recipeDetailsStatus").textContent));
  duplicateRecipeFromButton("recipe_test0001"); await wait(20);
  const copies = Object.values(loadRecipeDetails()).filter(r => r.title === "Copia de Papas");
  T.ok("F4 dos copias tienen claves distintas", copies.length === 2 && copies[0].amountsTitle !== copies[1].amountsTitle && copies.every(c => !!loadRecipeAmounts()[c.amountsTitle]));
  let berr = null; try { validateCompleteBackup(completeBackupSnapshot(localStorage)) } catch (e) { berr = e.message }
  T.ok("F5 el respaldo sigue siendo válido con copias", berr === null, berr);
  reset();
  return T;
})()
