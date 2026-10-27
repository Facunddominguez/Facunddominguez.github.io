// IMP-01 battery: plate import validation, through the real file input where possible.
(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const T = []; const ok = (name, cond, detail) => T.push((cond ? "PASA " : "FALLA ") + name + (detail ? " · " + detail : ""));
  const status = () => document.getElementById("savedStatus").textContent;
  const viaInput = async (content, name = "mis-platos.json") => {
    const dt = new DataTransfer(); dt.items.add(new File([content], name, { type: "application/json" }));
    const input = document.getElementById("importFile"); input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(250);
  };
  const backupOk = () => { try { validateCompleteBackup(completeBackupSnapshot(localStorage)); return null } catch (e) { return e.message } };
  window.confirm = () => true;
  localStorage.clear(); restart();
  // Build real plates through the app
  state.type = "desayuno"; state.fruta = { name: "Licuado", quantity: "1 vaso" }; state.bfprot = { name: "Yogur natural descremado", quantity: "1 pote" }; state.bfcarb = { name: "Avena arrollada o instantánea", quantity: "2 cdas soperas" }; state.grasa = { name: "No sumo grasa" };
  savePlate(); restart();
  state.type = "plato"; state.day = "Día libre"; state.verduras = [{ name: "Tomate" }]; state.almidones = [{ name: "Papa" }]; state.proteinas = [{ name: "Merluza" }];
  savePlate(); restart();
  const arr = loadSaved(); arr[0].fav = true; arr[0].note = "Cena rápida"; arr[0].cooked = 3;
  arr.push({ id: "recipe_plan_1_abc", savedAt: "2026-10-26T10:00:00.000Z", type: "plato", title: "Papas al horno", lines: [], sig: "recipe-ref:recipe_x:plato", text: "Papas al horno", cooked: 0, state: null, recipeSourceId: "recipe_x", recipeIngredients: ["Papa"] });
  persistSaved(arr);
  const original = JSON.stringify(loadSaved());
  // Export through the real button (download intercepted)
  const blobs = []; const oc = URL.createObjectURL; URL.createObjectURL = b => { blobs.push(b); return oc.call(URL, b) };
  const ac = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { };
  exportPlates();
  HTMLAnchorElement.prototype.click = ac; URL.createObjectURL = oc;
  const exported = await blobs.at(-1).text();
  // I1: import own export into an empty store -> identical
  persistSaved([]);
  await viaInput(exported);
  ok("I1 exportación propia se importa idéntica (ids, favoritos, notas, Cociné, recetas)", JSON.stringify(loadSaved()) === original, status());
  // I2: re-import -> nothing duplicated
  await viaInput(exported);
  ok("I2 reimportar no duplica", loadSaved().length === 3 && /Importados 0 platos nuevos\. 3 ya estaban guardados\./.test(status()), status());
  // I3: mixed file
  const legacyText = "🍽️ Mi plato fácil\nDesayuno / Merienda\n• Fruta: Banana\n• Proteína: Yogur";
  const firstId = loadSaved()[0].id;
  const mixed = '[' + [
    JSON.stringify({ text: "solo texto, sin id ni tipo" }),
    JSON.stringify({ text: "tipo inventado", id: "dup", type: "cualquiera", lines: "no-es-lista" }),
    JSON.stringify({ text: '<img src=x onerror="window.__xss=1">', id: "h1", type: "plato", lines: ["<b>x</b>"] }),
    JSON.stringify({ text: "mismo id", id: "dup", type: "plato", lines: [] }),
    JSON.stringify({ text: "otro con mismo id", id: "dup", type: "plato", lines: [] }),
    JSON.stringify({ text: legacyText, id: "old1" }),
    '{"text":"proto","type":"plato","lines":[],"state":{"__proto__":{"x":1}}}',
    JSON.stringify({ text: "estado roto", type: "plato", lines: [], state: { verduras: [{ name: 5 }] } }),
    JSON.stringify({ text: "cocinado raro", type: "plato", lines: [], cooked: "abc" }),
    JSON.stringify({ text: "choca con un id existente", id: firstId, type: "plato", lines: [] }),
    "null", "5", '"texto suelto"'
  ].join(",") + ']';
  await viaInput(mixed);
  const after = loadSaved();
  const byText = t => after.filter(p => p.text === t);
  ok("I3a mensaje informa importados y omitidos", /Importados 5 platos nuevos\. 8 omitidos por formato inválido\./.test(status()), status());
  ok("I3b todos los ids quedan únicos", new Set(after.map(p => p.id)).size === after.length);
  ok("I3c id repetido se regenera; el original no se toca", byText("otro con mismo id")[0].id !== "dup" && byText("mismo id")[0].id === "dup" && byText("choca con un id existente")[0].id !== firstId && after.filter(p => p.id === firstId).length === 1);
  const legacy = byText(legacyText)[0];
  ok("I3d plato antiguo sin tipo ni líneas se completa desde su texto", !!legacy && legacy.type === "desayuno" && JSON.stringify(legacy.lines) === JSON.stringify(["Fruta: Banana", "Proteína: Yogur"]), legacy && JSON.stringify(legacy.lines));
  ok("I3e se rechazan tipo inválido, estado roto, __proto__, Cociné no numérico y valores sueltos", ["tipo inventado", "proto", "estado roto", "cocinado raro", "solo texto, sin id ni tipo"].every(t => byText(t).length === 0));
  ok("I3f después de importar, el respaldo completo sigue siendo restaurable", backupOk() === null, backupOk());
  renderSaved(); await wait(50);
  ok("I3g Mis platos muestra el contenido importado solo como texto", window.__xss === undefined && document.querySelectorAll("#savedList img, #savedList b").length === 0);
  // Imported plates are usable in plan and Compras
  setSlot("martes", "almuerzo", byText("mismo id")[0].id); setSlot("lunes", "cena", after.find(p => p.text.includes("Merluza")).id);
  const shopList = () => typeof buildShopping === "function" ? buildShopping() : shoppingDisplayItems();
  let shopErr = null; try { shopList() } catch (e) { shopErr = e.message }
  ok("I3h platos importados se pueden asignar y Compras calcula sin errores", shopErr === null && shopList().some(x => x.name === "Merluza"), shopErr);
  // I4: invalid files change nothing
  const snapshot = localStorage.getItem("miPlatoFacil_saved");
  await viaInput('{"no":"es lista"}');
  const s1 = status();
  await viaInput("esto no es JSON");
  ok("I4 archivo que no es lista o no es JSON se rechaza sin cambios", /Archivo inválido/.test(s1) && /Archivo inválido/.test(status()) && localStorage.getItem("miPlatoFacil_saved") === snapshot);
  // I5: >10 MB
  await viaInput("[" + " ".repeat(10500000) + "]");
  ok("I5 archivo de más de 10 MB se rechaza sin cambios", /supera el límite de 10 MB/.test(status()) && localStorage.getItem("miPlatoFacil_saved") === snapshot, status());
  // I6: storage full
  const realSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { if (k === "miPlatoFacil_saved") throw new DOMException("quota", "QuotaExceededError"); return realSet.call(this, k, v) };
  await viaInput(JSON.stringify([{ text: "nuevo con almacenamiento lleno", type: "plato", lines: [] }]));
  Storage.prototype.setItem = realSet;
  ok("I6 almacenamiento lleno: avisa y no modifica los platos", /No se pudo guardar la importación/.test(status()) && localStorage.getItem("miPlatoFacil_saved") === snapshot, status());
  localStorage.clear(); restart();
  return T;
})()
