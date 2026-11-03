// E8: Etapa 8 del rediseño (resto de las herramientas avanzadas): precios separados del modo simple, objetivos en
// Preferencias y resumen en Semana, costo semanal, Anotar gasto con lo realmente comprado, rango en Comparar,
// equivalencias sugeridas en la lista, respaldo de la clave nueva y fila de presupuesto en Preferencias.
// Se usa el archivo de ejemplo datos/precios-ejemplo.json. C8-1 y C8-2 son los controles E8-precios-separados y
// E8-objetivos-en-preferencias de criterios.json.
(async () => {
  const T = []; const ok = (n, c, d) => T.push((c ? "PASA " : "FALLA ") + n + (d !== undefined && d !== "" ? " · " + d : ""));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  let marco = null, w = null, toques = 0;
  const abrir = async () => {
    if (marco) marco.remove();
    marco = document.createElement("iframe"); marco.id = "marcoPrueba";
    marco.style.cssText = "position:fixed;left:0;top:0;width:390px;height:844px;border:0;opacity:0;pointer-events:none;z-index:-1";
    document.body.append(marco);
    await new Promise((res, rej) => { marco.onload = res; marco.onerror = rej; marco.src = "/index.html?marco=" + Date.now() });
    await espera(500);
    w = marco.contentWindow; w.confirm = () => true; w.prompt = () => "";
  };
  const ev = x => w.eval(x);
  const doc = () => w.document;
  const q = s => { const e = doc().querySelector(s); if (!e) throw Error("no está en la pantalla: " + s + " (pantalla: " + ev("stack.at(-1)") + ")"); return e };
  const qa = s => [...doc().querySelectorAll(s)];
  const $ = id => q("#" + id);
  const tocar = async el => { el.click(); toques++; await espera(120) };
  const irA = async pestana => { await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')); if (ev("stack.at(-1) !== activeTabRoot()")) await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')) };
  const pantalla = () => ev("stack.at(-1)");
  const visible = e => !!e && e.getClientRects().length > 0;
  const seVe = (e, texto) => visible(e) && e.innerText.includes(texto);
  const menuCompras = async herr => { await tocar(q("#compras [data-compras-menu]")); await tocar(q('.hoja [data-compras-herr="' + herr + '"]')) };
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const todo = () => JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith("miPlatoFacil_") && k !== "miPlatoFacil_uiMode_v1" && k !== "miPlatoFacil_mostrarPrecios_v1").sort().map(k => [k, localStorage.getItem(k)]));
  const J = k => JSON.parse(R.data[k]);
  const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const planDe = slots => { const p = {}; for (const d of DIAS) p[d] = { desayuno: null, merienda: null, almuerzo: null, cena: null }; for (const [d, c, id] of slots) p[d][c] = id; return JSON.stringify(p) };
  const conReceta = (id, titulo, filas, rinde) => ({
    miPlatoFacil_recipeDetails_v1: JSON.stringify({ [id]: { id, title: titulo, sourceTitle: null, amountsTitle: "receta:" + id, steps: ["Cocinar"], notes: "" } }),
    miPlatoFacil_recipeAmounts_v1: JSON.stringify({ ["receta:" + id]: { yield: rinde || 1, rows: filas } }),
    miPlatoFacil_saved: JSON.stringify([{ id: "rp_" + id, savedAt: "2026-10-26T10:00:00.000Z", type: "plato", title: titulo, lines: [], sig: "recipe-ref:" + id + ":plato", text: titulo, cooked: 0, state: null, recipeSourceId: id, recipeIngredients: filas.map(x => x.name) }]),
    miPlatoFacil_plan: planDe([["lunes", "almuerzo", "rp_" + id]])
  });
  const EJEMPLO = await (await fetch("/datos/precios-ejemplo.json", { cache: "no-store" })).json();
  const MP = "miPlatoFacil_mostrarPrecios_v1", GOALS = "miPlatoFacil_habitGoals_v1", STOCK = "miPlatoFacil_pantryQuantities_v1", BUDGET = "miPlatoFacil_shoppingBudget_v1", ALIAS = "miPlatoFacil_ingredientAliases_v1", COMPRAS = "miPlatoFacil_purchases_v1", UI = "miPlatoFacil_uiMode_v1", REGION = "miPlatoFacil_region_v1", PRECIOS = "miPlatoFacil_referencePrices_v1";
  const abrirConEjemplo = async () => { await abrir(); w.preciosDataset.data = EJEMPLO; w.preciosDataset.cache = null; w.refrescarPrecios(); await espera(50) };
  const RECETA = [{ name: "Arroz", quantity: 300, unit: "g" }, { name: "Pollo", quantity: 500, unit: "g" }, { name: "Zapallito", quantity: 3, unidad: 1, unit: "unidad" }];
  const base = (extra = {}) => ({ ...conReceta("recipe_e7prue01", "Arroz con pollo", RECETA, 2), ...extra });
  const texto = id => doc().getElementById(id).textContent;
  const listaTxt = () => texto("comprasList") + " " + texto("comprasSummary");
  const fila = nombre => qa("#comprasList .shop-item label").find(l => l.textContent.startsWith(nombre));
  const tarjeta = () => qa(".comida-card").map(c => c.textContent).join(" | ");

  const conMP = () => ev("preciosActivos()");
  const lblPrecios = () => $("preciosToggle").querySelector(".tool-button__label").textContent;
  const lblModo = () => $("uiModeToggle").querySelector(".tool-button__label").textContent;

  // C8-1 Dos interruptores independientes: el valor inicial sale de uiMode_v1, tocar uno no cambia el otro
  const casos = [];
  cargar({ [UI]: "completo" }); await abrir();
  casos.push(["completo: precios prendidos y sin escribir nada", conMP() === true && localStorage.getItem(MP) === null && lblPrecios() === "Mostrar precios y presupuesto: activado" && lblModo() === "Mostrar herramientas avanzadas: activado"]);
  cargar({ [UI]: "simple" }); await abrir();
  casos.push(["simple: precios apagados", conMP() === false && localStorage.getItem(MP) === null]);
  cargar({}); await abrir();
  casos.push(["sin nada: precios apagados y nada guardado", conMP() === false && localStorage.getItem(MP) === null && localStorage.getItem(UI) === null]);
  // Quien está en simple (clave ausente) y activa las herramientas avanzadas: los precios siguen apagados (se escribe false)
  await tocar($("uiModeToggle"));
  casos.push(["simple + herramientas avanzadas: precios apagados, se escribe false", localStorage.getItem(UI) === "completo" && localStorage.getItem(MP) === '{"mostrar":false}' && conMP() === false && lblPrecios() === "Mostrar precios y presupuesto: desactivado" && lblModo() === "Mostrar herramientas avanzadas: activado"]);
  await tocar($("preciosToggle"));
  casos.push(["después, prender los precios no toca uiMode_v1", conMP() === true && localStorage.getItem(MP) === '{"mostrar":true}' && localStorage.getItem(UI) === "completo"]);
  await tocar($("uiModeToggle"));
  casos.push(["y apagar las herramientas avanzadas no apaga los precios", localStorage.getItem(UI) === "simple" && conMP() === true && localStorage.getItem(MP) === '{"mostrar":true}']);
  // Quien tenía completo y apaga los precios: uiMode_v1 byte a byte
  cargar({ [UI]: "completo" }); await abrir();
  await tocar($("preciosToggle"));
  casos.push(["completo + apagar los precios: uiMode_v1 intacto", localStorage.getItem(UI) === "completo" && localStorage.getItem(MP) === '{"mostrar":false}' && conMP() === false]);
  // Quien tenía completo y apaga las herramientas: los precios siguen prendidos
  cargar({ [UI]: "completo" }); await abrir();
  await tocar($("uiModeToggle"));
  casos.push(["completo + apagar herramientas: precios siguen prendidos", localStorage.getItem(UI) === "simple" && localStorage.getItem(MP) === '{"mostrar":true}' && conMP() === true]);
  // Clave inválida: se ignora y se deriva de uiMode_v1
  cargar({ [UI]: "completo", [MP]: '{"mostrar":"si"}' }); await abrir();
  const invComp = conMP() === true;
  cargar({ [UI]: "simple", [MP]: "[1]" }); await abrir();
  casos.push(["clave inválida: se ignora y se deriva de uiMode_v1", invComp && conMP() === false]);
  // La barra de presupuesto sigue a los precios, no al modo
  cargar(base({ [UI]: "simple", [MP]: '{"mostrar":true}', [BUDGET]: '{"currency":"ARS","limit":30000,"period":"semana"}' })); await abrirConEjemplo();
  await irA("compras");
  const barraConPrecios = seVe($("comprasPresupuesto"), "30.000") && ev("getUiMode()") === "simple";
  cargar(base({ [UI]: "completo", [MP]: '{"mostrar":false}', [BUDGET]: '{"currency":"ARS","limit":30000,"period":"semana"}' })); await abrirConEjemplo();
  await irA("compras");
  casos.push(["la barra de presupuesto sigue a los precios y no al modo", barraConPrecios && !visible($("comprasPresupuesto")) && ev("getUiMode()") === "completo"]);
  const malosC1 = casos.filter(c => !c[1]).map(c => c[0]);
  ok("C8-1 'Mostrar precios y presupuesto' y 'Mostrar herramientas avanzadas' son independientes: valor inicial desde uiMode_v1, uiMode_v1 intacto y activar las herramientas no enciende los precios", !malosC1.length, malosC1.join(" | "));

  // C8-2 Objetivos en Preferencias: se llenan sin pasar por el Registro y guardar no borra los guardados
  const OBJ = '{"verduras":10,"legumbres":3}';
  cargar({ [GOALS]: OBJ }); await abrir();
  const sinRegistro = !doc().getElementById("registro").contains($("goal_verduras")) && doc().getElementById("preferencias").contains($("goal_verduras")) && !!$("habitGoalsStatus");
  // Sin abrir Preferencias ni el Registro, los campos ya tienen lo guardado (nadie puede guardar vacío por error)
  const llenos = $("goal_verduras").value === "10" && $("goal_legumbres").value === "3" && $("goal_pescado").value === "" && $("goal_fruta").value === "";
  await tocar($("habitGoalsSave"));
  const igualSinAbrir = localStorage.getItem(GOALS) === OBJ;
  ev('go("preferencias")'); await espera(60);
  const llenosPref = $("goal_verduras").value === "10" && $("goal_legumbres").value === "3";
  await tocar($("habitGoalsSave"));
  const igual = localStorage.getItem(GOALS) === OBJ && /Objetivos guardados/.test(texto("habitGoalsStatus"));
  $("goal_verduras").value = "x"; await tocar($("habitGoalsSave"));
  const invalido = localStorage.getItem(GOALS) === OBJ && /enteros/.test(texto("habitGoalsStatus"));
  $("goal_verduras").value = "5"; $("goal_pescado").value = "2"; await tocar($("habitGoalsSave"));
  const cambiado = localStorage.getItem(GOALS) === '{"verduras":5,"legumbres":3,"pescado":2}';
  $("goal_verduras").value = ""; $("goal_legumbres").value = ""; $("goal_pescado").value = ""; await tocar($("habitGoalsSave"));
  const vaciado = localStorage.getItem(GOALS) === null;
  ok("C8-2 los objetivos semanales están en Preferencias (llenos aunque no pases por el Registro), guardar valida y no borra los guardados, y ya no están en el Registro",
    sinRegistro && llenos && igualSinAbrir && llenosPref && igual && invalido && cambiado && vaciado, [sinRegistro, llenos, igualSinAbrir, llenosPref, igual, invalido, cambiado, vaciado].join(","));

  // C8-3 Semana resume los objetivos: "Verduras en N de M comidas"; sin objetivos no hay línea
  const veg = ev("data.verduras[0]");
  const rv = conReceta("recipe_e8verd01", "Ensalada", [{ name: veg, quantity: 100, unit: "g" }], 1);
  const plan2 = planDe([["lunes", "almuerzo", "rp_recipe_e8verd01"], ["martes", "almuerzo", "rp_recipe_e8verd01"]]);
  cargar({ ...rv, miPlatoFacil_plan: plan2, [GOALS]: '{"verduras":14,"pescado":2}' }); await abrir();
  await irA("semana");
  const t1 = texto("planObjetivos");
  localStorage.setItem(GOALS, '{"verduras":2}'); ev("renderPlan()");
  const t2 = texto("planObjetivos");
  localStorage.removeItem(GOALS); ev("renderPlan()");
  const oculto = doc().getElementById("planObjetivos").hidden && texto("planObjetivos") === "";
  ok("C8-3 Semana resume los objetivos con el plan de la semana y no muestra nada sin objetivos",
    t1 === "Verduras en 2 de 14 comidas · Pescado 0 de 2" && t2 === "Verduras: 2 comidas (objetivo 2) ✓" && oculto && /comidas en la semana/.test(texto("planHint")), [t1, t2].join(" | "));

  // C8-4 Costo semanal en Semana: suma los días y dice cuántos precios faltan
  cargar(base({ [UI]: "completo", miPlatoFacil_plan: planDe([["lunes", "almuerzo", "rp_recipe_e7prue01"], ["martes", "almuerzo", "rp_recipe_e7prue01"]]) })); await abrirConEjemplo();
  ev('planDiaElegido="lunes";renderPlan()'); await espera(50);
  const sem = texto("planDiaCosto");
  localStorage.setItem(MP, '{"mostrar":false}'); w.refrescarPrecios();
  ok("C8-4 Semana muestra el costo del día y de la semana, con 'faltan N precios', y nada con los precios apagados",
    sem === "≈ $3.100 por día (faltan 1 precio) · ≈ $6.200 la semana (faltan 2 precios)" && texto("planDiaCosto") === "" && doc().getElementById("planDiaCosto").hidden, sem);

  // C8-5 Anotar gasto con lo realmente sumado a la despensa
  const filasReceta = [{ name: "Arroz", quantity: 500, unit: "g" }, { name: "Papa", quantity: 2, unit: "kg" }, { name: "Aceite", quantity: 100, unit: "ml" }, { name: "Sal", quantity: null, unit: "g" }];
  cargar({ ...conReceta("recipe_e8gast01", "Guiso", filasReceta, 1), [STOCK]: JSON.stringify({ '["arroz","g"]': { name: "Arroz", quantity: 300, unit: "g" }, '["aceite","ml"]': { name: "Aceite", quantity: 500, unit: "ml" } }) }); await abrir();
  await irA("compras");
  for (const k of qa("#comprasList .compras-seccion [data-shop-key]").map(c => c.dataset.shopKey)) await tocar(q("#comprasList [data-shop-key=\"" + k + "\"]"));
  await tocar($("comprasBought"));
  await tocar(q("#comprasBoughtStatus [data-anotar-gasto]"));
  const filasTicket = () => qa("#purchaseItems .purchase-row").map(r => [r.querySelector("[data-purchase-name]").value, r.querySelector("[data-purchase-qty]").value, r.querySelector("[data-purchase-unit]").value]);
  const f1 = filasTicket();
  const esperado = f => f.find(x => x[0] === "Arroz" && x[1] === "200" && x[2] === "g") && f.find(x => x[0] === "Papa" && x[1] === "2" && x[2] === "kg") && !f.some(x => x[0] === "Aceite");
  const filaSal = f1.find(x => x[0] === "Sal"), sinCantidadSal = !filaSal || (filaSal[1] === "" && filaSal[2] === "");
  // Solo las filas incluidas actualizan Mis precios: se quita la fila de la papa y se pone precio a arroz
  const stockAntes = localStorage.getItem(STOCK);
  qa("#purchaseItems .purchase-row").find(r => r.querySelector("[data-purchase-name]").value === "Papa")?.querySelector("button")?.click();
  const filaArroz = qa("#purchaseItems .purchase-row").find(r => r.querySelector("[data-purchase-name]").value === "Arroz");
  if (filaArroz) filaArroz.querySelector("[data-purchase-price]").value = "700";
  $("purchaseTotal").value = "1000"; await tocar($("purchaseSave"));
  const precios = Object.values(JSON.parse(localStorage.getItem(PRECIOS) || "{}")), compras = JSON.parse(localStorage.getItem(COMPRAS) || "[]");
  ok("C8-5 Anotar gasto trae lo realmente sumado (200 g de 500 g, 2 kg en otra unidad, ítem sin cantidad, nada de lo que ya alcanzaba) y Mis precios usa solo las filas incluidas",
    !!esperado(f1) && sinCantidadSal && precios.length === 1 && precios[0].name === "Arroz" && precios[0].amount === 200 && precios[0].unit === "g" && precios[0].price === 700 && compras.length === 1 && !compras[0].items.some(x => x.name === "Papa") && localStorage.getItem(STOCK) === stockAntes, JSON.stringify(f1));

  // C8-6 Comparar alternativas: rango (más barato, típico), promedio y diferencia de Mi precio; no cambia datos
  const mio6 = (id, price, date) => ({ id, name: "Arroz", pack: "", amount: 1, unit: "kg", price, currency: "ARS", date });
  cargar(base({ [UI]: "completo", [BUDGET]: '{"currency":"ARS","limit":50000,"period":"semana"}', [PRECIOS]: JSON.stringify({ a1: mio6("a1", 2800, "2026-10-20"), a2: mio6("a2", 2400, "2026-09-01") }) })); await abrirConEjemplo();
  const antes6 = todo();
  ev('abrirHerramientaCompras("presupuesto");budgetCompareRender()'); await espera(80);
  const cmp = texto("budgetCompareResult");
  const despues6 = todo();
  localStorage.setItem(MP, '{"mostrar":false}'); ev("budgetCompareRender()");
  const cmpOff = texto("budgetCompareResult");
  ok("C8-6 Comparar alternativas muestra el rango (más barato y típico), el promedio y cuánto se aparta Mi precio, sin cambiar ningún dato; con los precios apagados no muestra el promedio",
    cmp.includes("Por kg: más barato $2.400 · típico $2.600 · promedio ≈ $2.000 · Mi precio +40 %") && cmpOff.includes("Por kg: más barato $2.400 · típico $2.600") && !cmpOff.includes("promedio") && despues6 === antes6, cmp);

  // C8-7 Equivalencias sugeridas en la lista
  const rE = conReceta("recipe_e8equi01", "Ensalada", [{ name: "Tomate", quantity: 200, unit: "g" }, { name: "Tomate perita", quantity: 100, unit: "g" }], 1);
  cargar(rE); await abrir();
  await irA("compras");
  const sug = doc().getElementById("comprasEquivalencia");
  const textoSug = sug ? sug.textContent : "";
  await tocar(q("#comprasEquivalencia [data-equiv-no]"));
  const oculta = !doc().getElementById("comprasEquivalencia") && localStorage.getItem(ALIAS) === null;
  ev("equivalenciasOcultas.clear();renderCompras()"); await espera(50);
  await tocar(q("#comprasEquivalencia [data-equiv-unir]"));
  const alias = JSON.parse(localStorage.getItem(ALIAS) || "{}");
  const filasTomate = qa("#comprasList .shop-item label").filter(l => /^Tomate/.test(l.textContent));
  ok("C8-7 la lista sugiere una equivalencia (¿Tomate perita es lo mismo que Tomate?), 'Ahora no' no guarda nada y 'Unir' la guarda y junta los ítems",
    /¿“Tomate perita” es lo mismo que “Tomate”\?/.test(textoSug) && oculta && Object.keys(alias).length === 1 && filasTomate.length === 1 && !doc().getElementById("comprasEquivalencia"), textoSug + " | " + filasTomate.length);

  // C8-8 mostrarPrecios_v1 va al respaldo como opcional; uno viejo se restaura; uno inválido se rechaza
  cargar({ [MP]: '{"mostrar":true}' }); await abrir();
  const conMp = JSON.parse(JSON.stringify(w.completeBackupSnapshot(w.localStorage)));
  const incl = conMp.data[MP] === '{"mostrar":true}';
  cargar({}); await abrir();
  const omit = !(MP in w.completeBackupSnapshot(w.localStorage).data);
  cargar({ [MP]: '{"mostrar":false}' });
  w.restoreCompleteBackup(JSON.parse(JSON.stringify(R)), w.localStorage);
  const viejo = !(MP in R.data) && localStorage.getItem(MP) === '{"mostrar":false}';
  const malo8 = JSON.parse(JSON.stringify(conMp)); malo8.data[MP] = '{"mostrar":"si"}';
  let rech = false; try { w.validateCompleteBackup(malo8) } catch (e) { rech = true }
  w.restoreCompleteBackup(JSON.parse(JSON.stringify(conMp)), w.localStorage);
  ok("C8-8 'Mostrar precios y presupuesto' va al respaldo como opcional, un respaldo viejo la deja como está y uno inválido se rechaza", incl && omit && viejo && rech && localStorage.getItem(MP) === '{"mostrar":true}');

  // C8-9 Fila de presupuesto en Preferencias: muestra lo guardado y abre el panel (solo con los precios prendidos)
  cargar({ [UI]: "completo", [BUDGET]: '{"currency":"ARS","limit":30000,"period":"semana"}' }); await abrir();
  ev('go("preferencias")'); await espera(60);
  const fila9 = seVe($("prefPresupuesto"), "$30.000 por semana");
  await tocar($("prefPresupuesto"));
  const abre = pantalla() === "comprasHerramientas" && visible($("shoppingBudgetPanel"));
  localStorage.setItem(MP, '{"mostrar":false}'); w.refrescarPrecios(); ev('go("preferencias")'); await espera(40);
  ok("C8-9 la fila de presupuesto de Preferencias muestra lo guardado, abre el panel y se esconde con los precios apagados (igual que la región de los precios)", fila9 && abre && !visible($("prefPresupuesto")) && !visible($("preferenciasRegion")));

  // C8-10 La diferencia entre lo gastado y lo estimado vuelve con signo y sentido
  const hoy10 = ev("localTrainingDate(new Date())");
  const compra10 = t => JSON.stringify([{ id: "c8compra01", date: hoy10, store: "", currency: "ARS", total: t, items: [] }]);
  const ref10 = JSON.stringify({ a1: mio6("a1", 2800, "2026-10-20") });
  cargar(base({ [UI]: "completo", [BUDGET]: '{"currency":"ARS","limit":50000,"period":"semana"}', [PRECIOS]: ref10, [COMPRAS]: compra10(100) })); await abrirConEjemplo();
  ev("shoppingBudgetRender()");
  const menos10 = texto("shoppingBudgetResult");
  cargar(base({ [UI]: "completo", [BUDGET]: '{"currency":"ARS","limit":50000,"period":"semana"}', [PRECIOS]: ref10, [COMPRAS]: compra10(5000) })); await abrirConEjemplo();
  ev("shoppingBudgetRender()");
  const mas10 = texto("shoppingBudgetResult");
  ok("C8-10 la diferencia de compras realizadas dice si se gastó más (+) o menos (-) que lo estimado",
    /diferencia -[\d.,]+ ARS \(se gastó menos\)/.test(menos10) && /diferencia \+[\d.,]+ ARS \(se gastó más\)/.test(mas10), menos10.slice(-120) + " | " + mas10.slice(-120));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
