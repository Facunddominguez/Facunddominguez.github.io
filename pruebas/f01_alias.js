// F01-02 battery: user-defined equivalences (UI), backup and compatibility.
(async () => {
  const R = window.R2, { wait, results, reset, setAmounts, setRecipes, recipePlate, tradPlate, setSaved, setPlan, IDEA2 } = R; const T = results();
  window.confirm = () => true;
  const KEY = "miPlatoFacil_ingredientAliases_v1";
  reset();
  setAmounts({ [IDEA2]: { yield: 1, rows: [{ name: "Arroz", quantity: 300, unit: "g" }] } });
  setRecipes([{ id: "recipe_test0002", title: "Arroz", amountsTitle: IDEA2 }]);
  setSaved([recipePlate("rp2", "recipe_test0002", "Arroz", ["Arroz"]), tradPlate("tp2", ["Arroz (integral, yamaní)"], ["Tomate"], ["Merluza"])]);
  setPlan([["martes", "almuerzo", "rp2"], ["martes", "cena", "tp2"]]);
  go("ingredientes"); await wait(30);
  await R.openPanel("ingredientAliasPanel");
  const sugBtn = [...document.querySelectorAll("#ingredientAliasSuggestions button")].find(b => b.dataset.ingredientAliasFrom === "Arroz (integral, yamaní)" && b.dataset.ingredientAliasTo === "Arroz");
  T.ok("L1 sugiere unir 'Arroz (integral, yamaní)' con 'Arroz'", !!sugBtn, [...document.querySelectorAll("#ingredientAliasSuggestions .shop-item span")].map(s => s.textContent).join(" | "));
  T.ok("L1b la lista de nombres conocidos alimenta el autocompletado", [...document.querySelectorAll("#ingredientAliasNames option")].some(o => o.value === "Merluza"));
  sugBtn.click(); await wait(30);
  const stored = JSON.parse(localStorage.getItem(KEY));
  T.ok("L2a Unir guarda la equivalencia y la muestra", Object.keys(stored).length === 1 && document.getElementById("ingredientAliasList").textContent.includes("Arroz (integral, yamaní) = Arroz") && /Unidos/.test(document.getElementById("ingredientAliasStatus").textContent));
  go("compras"); await wait(40);
  T.ok("L2b Compras une ambas líneas con el nombre elegido", R.renderedRows().includes("Arroz: 300 g + sin cantidad en 1 plato"), R.renderedRows().join(" | "));
  go("ingredientes"); await R.openPanel("ingredientAliasPanel");
  T.ok("L2c la sugerencia ya no aparece", ![...document.querySelectorAll("#ingredientAliasSuggestions button")].some(b => b.dataset.ingredientAliasFrom === "Arroz (integral, yamaní)"));
  document.getElementById("ingredientAliasFrom").value = "Arroz yamaní"; document.getElementById("ingredientAliasTo").value = "Arroz integral";
  document.getElementById("ingredientAliasSave").click(); await wait(20);
  T.ok("L3 equivalencia manual con nombres nuevos", sameIngredient("Arroz yamaní", "Arroz integral") && /Equivalencia guardada/.test(document.getElementById("ingredientAliasStatus").textContent));
  document.getElementById("ingredientAliasFrom").value = "Tomates"; document.getElementById("ingredientAliasTo").value = "tomate";
  document.getElementById("ingredientAliasSave").click(); await wait(20);
  const e1 = document.getElementById("ingredientAliasStatus").textContent;
  document.getElementById("ingredientAliasFrom").value = ""; document.getElementById("ingredientAliasTo").value = "Arroz";
  document.getElementById("ingredientAliasSave").click(); await wait(20);
  const e2 = document.getElementById("ingredientAliasStatus").textContent;
  T.ok("L4 avisa si ya son iguales o si falta un nombre", /ya se consideran el mismo/.test(e1) && /Escribí los dos nombres/.test(e2), e1 + " / " + e2);
  saveIngredientAlias("Arroz integral", "Arroz");
  T.ok("L5 las equivalencias encadenadas llegan al mismo ingrediente", sameIngredient("Arroz yamaní", "Arroz") && sameIngredient("Arroz integral", "Arroz (integral, yamaní)"));
  // Backup with equivalences
  const snap = completeBackupSnapshot(localStorage); let err = null; try { validateCompleteBackup(snap) } catch (e) { err = e.message }
  T.ok("L6a el respaldo incluye las equivalencias y es válido", err === null && Object.keys(snap.data).length === 18 && snap.data[KEY] === localStorage.getItem(KEY), err);
  localStorage.removeItem(KEY); restoreCompleteBackup(snap, localStorage);
  T.ok("L6b restaurar recupera las equivalencias", localStorage.getItem(KEY) === snap.data[KEY] && sameIngredient("Arroz yamaní", "Arroz"));
  const bad = JSON.parse(JSON.stringify(snap)); bad.data[KEY] = JSON.stringify({ arroz: { from: "Arroz", to: "arroz", toName: "Arroz" } });
  let berr = null; try { validateCompleteBackup(bad) } catch (e) { berr = e.message }
  T.ok("L6c equivalencias inválidas se rechazan", /Equivalencias de ingredientes inválidas/.test(berr || ""), berr);
  // Without equivalences the key is not exported (keeps backups restorable in older versions)
  localStorage.removeItem(KEY);
  const plain = completeBackupSnapshot(localStorage);
  T.ok("L7 sin equivalencias, el respaldo tiene las mismas 17 claves que v14.9.77", Object.keys(plain.data).length === 17 && !(KEY in plain.data));
  window.__f01_plainBackup = JSON.stringify(plain);
  // Rollback with the omitted key must not write the text "undefined"
  const mem = new Map(Object.entries(plain.data).filter(([, v]) => v !== null)); let writes = 0;
  const fake = { getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => { writes++; if (writes === 3) throw new Error("cuota"); mem.set(k, String(v)) }, removeItem: k => mem.delete(k) };
  let rmsg = null; try { restoreCompleteBackup(snap, fake) } catch (e) { rmsg = e.message }
  T.ok("L8 si falla una restauración, la reversión no deja 'undefined'", !!rmsg && fake.getItem(KEY) === null && ![...mem.values()].includes("undefined"), rmsg);
  // Remove an equivalence from the UI
  saveIngredientAlias("Arroz (integral, yamaní)", "Arroz");
  go("ingredientes"); await R.openPanel("ingredientAliasPanel");
  document.querySelector("#ingredientAliasList [data-ingredient-alias-remove]").click(); await wait(20);
  go("compras"); await wait(30);
  T.ok("L9 quitar la equivalencia vuelve a separar las líneas", R.renderedRows().includes("Arroz: 300 g") && R.renderedRows().includes("Arroz (integral, yamaní)") && /Equivalencia quitada/.test(document.getElementById("ingredientAliasStatus").textContent), R.renderedRows().join(" | "));
  const ids = [...document.querySelectorAll("[id]")].map(e => e.id), dups = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
  T.ok("L10 sin IDs duplicados", dups.length === 0, dups.join(","));
  return T;
})()
