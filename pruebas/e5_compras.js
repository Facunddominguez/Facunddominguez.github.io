// E5: Etapa 5 del rediseño (Compras y Despensa). "Lista | Despensa", lista por secciones del súper, interruptor
// "Descontar lo que tengo", productos extra en la lista, "Terminé de comprar" con "Anotar gasto", despensa con cantidad
// e historial por ítem, herramientas en el menú ⋯ y cantidades legibles.
// C5-1 es el control E5-respaldo-completo de docs/validacion/criterios.json: el respaldo de ejemplo se ve completo.
// La app se abre en un marco aparte (mismo origen y mismo localStorage) para poder recargarla. Solo datos inventados.
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
  const todo = () => JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith("miPlatoFacil_") && k !== "miPlatoFacil_uiMode_v1").sort().map(k => [k, localStorage.getItem(k)]));
  const J = k => JSON.parse(R.data[k]);
  const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const planDe = slots => { const p = {}; for (const d of DIAS) p[d] = { desayuno: null, merienda: null, almuerzo: null, cena: null }; for (const [d, c, id] of slots) p[d][c] = id; return JSON.stringify(p) };
  const conReceta = (id, titulo, filas, rinde) => ({
    miPlatoFacil_recipeDetails_v1: JSON.stringify({ [id]: { id, title: titulo, sourceTitle: null, amountsTitle: "receta:" + id, steps: ["Cocinar"], notes: "" } }),
    miPlatoFacil_recipeAmounts_v1: JSON.stringify({ ["receta:" + id]: { yield: rinde || 1, rows: filas } }),
    miPlatoFacil_saved: JSON.stringify([{ id: "rp_" + id, savedAt: "2026-10-26T10:00:00.000Z", type: "plato", title: titulo, lines: [], sig: "recipe-ref:" + id + ":plato", text: titulo, cooked: 0, state: null, recipeSourceId: id, recipeIngredients: filas.map(x => x.name) }]),
    miPlatoFacil_plan: planDe([["lunes", "almuerzo", "rp_" + id]])
  });
  const OPC = "miPlatoFacil_comprasOpciones_v1", EXTRAS = "miPlatoFacil_manualShopping_v1", STOCK = "miPlatoFacil_pantryQuantities_v1", MOVES = "miPlatoFacil_pantryMoves_v1", COMPRAS = "miPlatoFacil_purchases_v1", PRECIOS = "miPlatoFacil_referencePrices_v1";

  // C5-1 El respaldo de ejemplo se restaura y se ve completo: cada módulo se alcanza con toques y muestra sus datos
  localStorage.clear(); await abrir();
  w.restoreCompleteBackup(JSON.parse(JSON.stringify(R)), w.localStorage);
  localStorage.setItem("miPlatoFacil_uiMode_v1", "completo");
  await abrir();
  const antes = todo(), faltan = [];
  const exigir = (modulo, cond, detalle) => { if (!cond) faltan.push(modulo + (detalle ? " (" + detalle + ")" : "")) };
  // Lista: productos extra y presupuesto.
  await irA("compras");
  for (const x of J(EXTRAS)) exigir("extras", seVe($("comprasExtras"), x.name), x.name);
  exigir("presupuesto en la barra", seVe($("comprasPresupuesto"), "60.000"), $("comprasPresupuesto").innerText);
  // Despensa: marcas de Lo básico, ingredientes sin cantidad, existencias con cantidad e historial por ítem.
  await tocar($("comprasDespensa"));
  exigir("pantalla Despensa", pantalla() === "ingredientes");
  const marcas = J("miPlatoFacil_pantry"), chips = marcas.filter(m => w.pantryById(m)), libres = marcas.filter(m => !w.pantryById(m));
  for (const m of chips) { const b = doc().querySelector('#pantryChips [data-pantry-toggle="' + m + '"]'); exigir("marca " + m, visible(b) && b.getAttribute("aria-pressed") === "true", m) }
  for (const m of libres) exigir("despensa sin cantidad", seVe($("pantryItemList"), m), m);
  const existencias = Object.values(J(STOCK));
  for (const s of existencias) exigir("existencia", seVe($("pantryItemList"), s.name + " · " + w.cantidadLegible(s.quantity, s.unit)), s.name);
  for (const h of qa("#pantryItemList .pantry-item__historial")) await tocar(h.querySelector("summary"));
  const historiales = qa("#pantryItemList .pantry-item__historial p").filter(visible).length;
  const filas = existencias.map(s => s.name).concat(libres), movs = J(MOVES);
  const esperados = movs.filter(m => filas.some(n => w.ingredientKey(n) === w.ingredientKey(m.name))).length;
  exigir("historial por ítem", historiales === Math.min(esperados, filas.length * 10) && esperados > 0, historiales + " de " + esperados);
  await tocar(q("#stockMovesPanel summary"));
  exigir("todos los movimientos", qa("#stockMoves p").filter(visible).length === Math.min(movs.length, 30), qa("#stockMoves p").length + " de " + movs.length);
  // Menú ⋯ de Compras: compras realizadas, presupuesto y Mis precios.
  await tocar(q('#ingredientes [data-compras-vista="lista"]'));
  await menuCompras("realizadas");
  for (const p of J(COMPRAS)) exigir("compra realizada", seVe($("purchaseList"), w.typedAppDateLabel(p.date) + (p.store ? " · " + p.store : "")), p.store);
  await irA("compras"); await menuCompras("presupuesto");
  exigir("presupuesto", visible($("shoppingBudgetLimit")) && Number($("shoppingBudgetLimit").value) === J("miPlatoFacil_shoppingBudget_v1").limit && seVe($("shoppingBudgetResult"), "60.000,00"));
  await irA("compras"); await menuCompras("precios");
  for (const p of Object.values(J(PRECIOS))) exigir("Mis precios", seVe($("priceList"), p.name + (p.pack ? " · " + p.pack : "")), p.name);
  // Semana: plan, porciones, planes guardados, semanas con fecha, historial, Lo que comí y objetivos.
  await irA("semana");
  const semana = qa("#planDias [data-plan-dia]").reduce((t, c) => t + Number((c.querySelector(".semana-dia-chip__cuenta").textContent.match(/^(\d)\/4$/) || [0, NaN])[1]), 0);
  exigir("plan", semana === 28, semana + " de 28");
  for (const [clave, n] of Object.entries(J("miPlatoFacil_planPortions_v1"))) {
    const [dia, comida] = clave.split("|");
    await tocar(q('#planDias [data-plan-dia="' + dia + '"]')); await tocar(q('[data-hueco="' + dia + "|" + comida + '"]'));
    const inp = doc().querySelector('.hoja [data-plan-portions="' + clave + '"]');
    exigir("porciones " + clave, visible(inp) && Number(inp.value) === n, inp && inp.value);
    ev("hoja.cerrar()"); await espera(60)
  }
  const menuSemana = async herr => { await tocar(q("#plan [data-plan-menu]")); await tocar(q('.hoja [data-plan-herr="' + herr + '"]')) };
  await menuSemana("variaciones");
  for (const nombre of Object.keys(J("miPlatoFacil_planVars"))) exigir("plan guardado", visible($("varSelect")) && [...$("varSelect").options].some(o => o.textContent.includes(nombre)), nombre);
  await irA("semana"); await menuSemana("semanas");
  for (const fecha of Object.keys(J("miPlatoFacil_datedWeeks_v1"))) exigir("semana con fecha", seVe($("datedWeekList"), fecha), fecha);
  await irA("semana"); await menuSemana("historial");
  for (const h of J("miPlatoFacil_planHistory_v1")) exigir("historial del plan", seVe($("planHistoryList"), h.text), h.text);
  await irA("semana"); await menuSemana("consumo");
  const consumo = J("miPlatoFacil_consumption_v1"), primera = consumo.map(c => c.date).sort()[0];
  let registrados = 0;
  for (let i = 0; i < 80 && ev("consumptionWeek") >= w.mondayOf(primera); i++) {
    registrados += Number((($("consumptionView").innerText.match(/(\d+) comidas? registradas?/) || [0, 0])[1]));
    await tocar(q('[data-consumption-week="-7"]'))
  }
  exigir("Lo que comí", registrados === consumo.length, registrados + " de " + consumo.length);
  const metas = J("miPlatoFacil_habitGoals_v1");
  for (const [g, n] of Object.entries(metas)) exigir("objetivo " + g, seVe($("consumptionView"), "de " + n + " (objetivo)"), g);
  // Comidas: platos y recetas, preparaciones, cantidades de las recetas e ideas favoritas.
  await irA("miscomidas");
  const tarjetas = t => qa('#savedList > .comida-card[data-comida-tipo="' + t + '"]').filter(visible).length;
  exigir("comidas", tarjetas("plato") === 9 && tarjetas("receta") === 5, tarjetas("plato") + " y " + tarjetas("receta"));
  await tocar(q("#cookingHistoryPanel summary"));
  const preparaciones = J("miPlatoFacil_cookingHistory_v1");
  exigir("preparaciones", qa("#cookingHistoryList > *").filter(visible).length >= preparaciones.length && preparaciones.every(p => seVe($("cookingHistoryList"), w.typedAppDateLabel(p.date))), qa("#cookingHistoryList > *").length + " de " + preparaciones.length);
  const recetas = J("miPlatoFacil_recipeDetails_v1"), cantidades = J("miPlatoFacil_recipeAmounts_v1");
  const conCantidades = Object.values(recetas).filter(r => r.amountsTitle && cantidades[r.amountsTitle]);
  exigir("cantidades vinculadas", conCantidades.length === Object.keys(cantidades).length, conCantidades.length + " de " + Object.keys(cantidades).length);
  for (const r of conCantidades) {
    await irA("miscomidas");
    await tocar(q('#savedList [data-recipe-id="' + r.id + '"]'));
    const fila = cantidades[r.amountsTitle].rows.find(x => x.quantity !== null);
    exigir("cantidades de " + r.title, pantalla() === "comida" && seVe($("comida"), fila.name), r.title)
  }
  await irA("miscomidas"); await tocar(q('#misplatos [data-comidas-vista="ideas"]'));
  const favOnly = q('#ideas [data-advice-fav-only="menu"]'); await tocar(favOnly);
  for (const f of J("miPlatoFacil_adviceFavorites").map(x => JSON.parse(x)).filter(x => x[0] === "menu")) exigir("idea favorita", seVe($("ideas"), f[1]), f[1]);
  await tocar(favOnly);
  // Más: rutina y excepciones, preferencias de recetas, equivalencias y tema.
  await irA("mas"); await tocar(q("#home [data-open-training]"));
  const rutina = J("miPlatoFacil_trainingWeek").days;
  exigir("rutina", qa("#trainingDays input[type=checkbox]").filter(c => c.checked && visible(c)).length === rutina.length);
  for (const fecha of Object.keys(J("miPlatoFacil_trainingExceptions"))) exigir("excepción", seVe($("trainingExceptionsList"), fecha), fecha);
  await irA("mas"); await tocar(q("#home [data-open-preferencias]"));
  for (const d of q("#preferencias").querySelectorAll("details")) if (!d.open) await tocar(d.querySelector("summary"));
  exigir("preferencias de recetas", visible($("recipeAvoidWords")) && $("recipeAvoidWords").value === J("miPlatoFacil_recipePreferences_v1").words);
  for (const a of Object.values(J("miPlatoFacil_ingredientAliases_v1"))) exigir("equivalencia", seVe($("ingredientAliasList"), a.from), a.from);
  await irA("mas");
  exigir("tema", seVe($("themeToggle"), "Auto"));
  ok("C5-1 el respaldo de ejemplo se ve completo: cada módulo se alcanza con toques y muestra sus datos", faltan.length === 0 && todo() === antes, faltan.slice(0, 8).join(" | ") + (todo() === antes ? "" : " · se escribió algo"));

  // C5-2 Lista por secciones del súper: cada ítem en una sola sección; los grupos juntos son la lista del plan
  await irA("compras");
  const items = ev("shoppingDisplayItems()"), plan = ev("shoppingPlanItems()").map(e => e.key).sort();
  const enSecciones = qa("#comprasList .compras-seccion [data-shop-key]").map(c => c.dataset.shopKey);
  const titulos = qa("#comprasList .compras-seccion").map(s => s.dataset.seccion), orden = ev("SECCIONES_SUPER");
  const pendientes = items.filter(x => x.group === "pendiente").map(x => x.key).sort();
  ok("C5-2 lista por secciones: cada pendiente en una sola sección, en orden fijo, y los grupos juntos son la lista del plan",
    JSON.stringify([...enSecciones].sort()) === JSON.stringify(pendientes) && new Set(enSecciones).size === enSecciones.length && titulos.every((t, i) => i === 0 || orden.indexOf(t) > orden.indexOf(titulos[i - 1])) && JSON.stringify(items.map(x => x.key).sort()) === JSON.stringify(plan) && ev('seccionDelSuper("Tomate")') === "Verdulería" && ev('seccionDelSuper("Pollo (pechuga, muslo, pata-muslo)")') === "Carnicería y pescadería" && ev('seccionDelSuper("Leche")') === "Lácteos y huevos" && ev('seccionDelSuper("Pan rallado")') === "Almacén" && ev('seccionDelSuper("Detergente")') === "Limpieza",
    titulos.join(", "));

  // C5-3 Interruptor "Descontar lo que tengo": apagado, nada va a "Ya tenés"; solo escribe su clave y solo al tocarlo
  const datosSinOpc = todo(), gruposAntes = JSON.stringify(items.map(x => x.key + ":" + x.group));
  const tenesAntes = items.filter(x => x.group === "tenes").length;
  const sw = $("comprasDescontar"); const encendidoPorDefecto = sw.checked && localStorage.getItem(OPC) === null;
  await tocar(sw);
  const apagado = ev("shoppingDisplayItems()");
  const sinTenes = apagado.every(x => x.group !== "tenes") && apagado.every(x => x.text === x.label || x.group !== "pendiente") && !qa("#comprasList details.shop-group").some(d => d.querySelector("summary").textContent.startsWith("Ya tenés"));
  const soloSuClave = JSON.stringify(JSON.parse(todo()).filter(([k]) => k !== OPC)) === datosSinOpc && localStorage.getItem(OPC) === '{"descontar":false}';
  await tocar(sw);
  ok("C5-3 'Descontar lo que tengo': encendido por defecto; apagado no hay 'Ya tenés' ni 'faltan'; escribe solo su clave al tocarlo",
    encendidoPorDefecto && tenesAntes > 0 && sinTenes && soloSuClave && localStorage.getItem(OPC) === '{"descontar":true}' && JSON.stringify(ev("shoppingDisplayItems()").map(x => x.key + ":" + x.group)) === gruposAntes, tenesAntes + " en Ya tenés");
  // C5-3b Apagado, "Terminé de comprar" suma la cantidad completa del plan (no se descontó nada)
  cargar({ ...conReceta("recipe_e5prue01", "Arroz con pollo", [{ name: "Arroz", quantity: 300, unit: "g" }]), [STOCK]: JSON.stringify({ '["arroz","g"]': { name: "Arroz", quantity: 100, unit: "g" } }), [OPC]: '{"descontar":false}' });
  await abrir(); await irA("compras");
  const filaArroz = q('#comprasList [data-shop-key="arroz"]');
  const sinFaltan = !filaArroz.labels[0].textContent.includes("faltan") && !$("comprasDescontar").checked;
  await tocar(filaArroz); await tocar($("comprasBought"));
  const arroz = JSON.parse(localStorage.getItem(STOCK))['["arroz","g"]'];
  ok("C5-3b apagado, 'Terminé de comprar' suma la cantidad completa del plan", sinFaltan && !!arroz && arroz.quantity === 400, arroz && arroz.quantity);

  // C5-4 Productos extra: "+ Agregar producto" arriba, en la lista; tachar escribe done; Editar; Quitar con Deshacer
  cargar({}); await abrir(); await irA("compras");
  const agregar = q("#manualShoppingPanel summary"), arriba = agregar.compareDocumentPosition($("comprasList")) & 4;
  await tocar(agregar);
  $("manualShopName").value = "Detergente"; $("manualShopAmount").value = "1 botella"; await tocar($("manualShopSubmit"));
  let extras = JSON.parse(localStorage.getItem(EXTRAS) || "[]");
  const enLista = seVe($("comprasExtras"), "Detergente · 1 botella") && extras.length === 1 && extras[0].done === false;
  await tocar(q("#manualShopList [data-manual-check]"));
  const tachado = JSON.parse(localStorage.getItem(EXTRAS))[0].done === true;
  await tocar(q("#manualShopList [data-manual-edit]"));
  $("manualShopName").value = "Lavandina"; await tocar($("manualShopSubmit"));
  const editado = JSON.parse(localStorage.getItem(EXTRAS))[0].name === "Lavandina";
  const antesDeQuitar = localStorage.getItem(EXTRAS);
  await tocar(q("#manualShopList [data-manual-delete]"));
  const quitado = JSON.parse(localStorage.getItem(EXTRAS)).length === 0;
  await tocar(q("#manualShopStatus [data-manual-undo]"));
  ok("C5-4 productos extra: se agregan arriba, se ven en la lista, se tachan, se editan y Quitar tiene Deshacer", !!arriba && enLista && tachado && editado && quitado && localStorage.getItem(EXTRAS) === antesDeQuitar);

  // C5-5 "Terminé de comprar" (como Lo compré) y "Anotar gasto": compra y Mis precios con el formulario de siempre
  cargar(conReceta("recipe_e5prue04", "Merluza con papa", [{ name: "Papa", quantity: 500, unit: "g" }, { name: "Merluza", quantity: 2, unit: "unidad" }]));
  await abrir(); await irA("compras");
  const claves = qa("#comprasList [data-shop-key]").map(c => c.dataset.shopKey);
  await tocar(q('#comprasList [data-shop-key="' + claves[0] + '"]')); await tocar($("comprasBought"));
  const checks = JSON.parse(localStorage.getItem("miPlatoFacil_shoppingChecks_v1") || "{}"), semanaC = Object.values(checks)[0];
  const comoLoCompre = !!semanaC && semanaC.c.includes(claves[0]) && q("#comprasBought").textContent === "Terminé de comprar";
  const sinCompras = localStorage.getItem(COMPRAS) === null && localStorage.getItem(PRECIOS) === null;
  await tocar(q("#comprasBoughtStatus [data-anotar-gasto]"));
  const formCargado = pantalla() === "comprasHerramientas" && visible($("purchasesPanel")) && $("purchaseUpdatePrices").checked && !$("purchaseAddStock").checked && qa("#purchaseItems .purchase-row").length === 1 && q("#purchaseItems [data-purchase-name]").value !== "";
  const nadaEscrito = localStorage.getItem(COMPRAS) === null && localStorage.getItem(PRECIOS) === null;
  $("purchaseTotal").value = "abc"; await tocar($("purchaseSave"));
  const invalidoNoEscribe = localStorage.getItem(COMPRAS) === null && localStorage.getItem(PRECIOS) === null;
  const stockAntes = localStorage.getItem(STOCK);
  $("purchaseTotal").value = "5.000,50"; $("purchaseStore").value = "Verdulería";
  q("#purchaseItems [data-purchase-qty]").value = "1"; q("#purchaseItems [data-purchase-unit]").value = "kg"; q("#purchaseItems [data-purchase-price]").value = "1200";
  await tocar($("purchaseSave"));
  const compras = JSON.parse(localStorage.getItem(COMPRAS) || "[]"), precios = Object.values(JSON.parse(localStorage.getItem(PRECIOS) || "{}"));
  ok("C5-5 'Terminé de comprar' pasa lo tachado como Lo compré; 'Anotar gasto' abre Compras realizadas cargado y guarda compra y precio con el formato de siempre",
    comoLoCompre && sinCompras && formCargado && nadaEscrito && invalidoNoEscribe && ev("validPurchases")(compras) && compras.length === 1 && compras[0].total === 5000.5 && compras[0].store === "Verdulería" && compras[0].currency === "ARS" && precios.length === 1 && precios[0].pack === "Compra en Verdulería" && precios[0].price === 1200 && localStorage.getItem(STOCK) === stockAntes,
    JSON.stringify(compras).slice(0, 120));

  // C5-6 Despensa: cantidad legible, historial por ítem, Editar con Deshacer y editar sin cambios no cambia nada
  cargar({ [STOCK]: JSON.stringify({ '["queso rallado","g"]': { name: "Queso rallado", quantity: 166.666667, unit: "g" } }), [MOVES]: JSON.stringify([{ at: "2026-10-20T10:00:00.000Z", name: "Queso rallado", unit: "g", delta: 166.666667, reason: "Lo compré · 20/10/2026" }, { at: "2026-10-20T11:00:00.000Z", name: "Arroz", unit: "g", delta: 100, reason: "Ajuste manual" }]) });
  await abrir(); await irA("compras"); await tocar($("comprasDespensa"));
  const filaQueso = q('#pantryItemList [data-pantry-item]');
  const legible = filaQueso.innerText.includes("Queso rallado · 167 g");
  await tocar(filaQueso.querySelector(".pantry-item__historial summary"));
  const hist = [...filaQueso.querySelectorAll(".pantry-item__historial p")].map(p => p.textContent);
  const historialOk = hist.length === 1 && /\+167 g · Lo compré/.test(hist[0]);
  const stock0 = localStorage.getItem(STOCK), moves0 = localStorage.getItem(MOVES);
  await tocar(q("#pantryItemList [data-pantry-item-edit]"));
  const exacto = $("pantryItemQty").value === "166,666667";
  await tocar($("pantryItemSubmit"));
  const sinCambios = localStorage.getItem(STOCK) === stock0 && localStorage.getItem(MOVES) === moves0;
  await tocar(q("#pantryItemList [data-pantry-item-edit]"));
  $("pantryItemQty").value = "50"; await tocar($("pantryItemSubmit"));
  const editado6 = JSON.parse(localStorage.getItem(STOCK))['["queso rallado","g"]'].quantity === 50;
  await tocar(q("#pantryItemStatus [data-pantry-undo]"));
  const vuelto = localStorage.getItem(STOCK) === stock0 && JSON.parse(localStorage.getItem(MOVES)).length === 4;
  await tocar(q("#pantryItemList [data-pantry-item-remove-stock]"));
  const sinQueso = !JSON.parse(localStorage.getItem(STOCK) || "{}")['["queso rallado","g"]'];
  await tocar(q("#pantryItemStatus [data-pantry-undo]"));
  ok("C5-6 Despensa: cantidad legible, historial del ítem, editar sin cambios no toca nada, Editar y Quitar con Deshacer",
    legible && historialOk && exacto && sinCambios && editado6 && vuelto && sinQueso && localStorage.getItem(STOCK) === stock0, hist.join(" | "));

  // C5-7 Cantidades legibles: redondeo y plural solo al mostrar; los textos internos de la lista no cambian
  const casos = [[166.666667, "g", "167 g"], [5, "unidad", "5 unidades"], [1, "unidad", "1 unidad"], [0.5, "taza", "0,5 taza"], [1.25, "kg", "1,25 kg"], [2, "cucharadita", "2 cucharaditas"], [3.333333, "unidad", "3,33 unidades"], [2.5, "ml", "2,5 ml"]];
  const malos = casos.filter(([n, u, t]) => w.cantidadLegible(n, u) !== t);
  cargar({ ...conReceta("recipe_e5prue02", "Tarta", [{ name: "Queso rallado", quantity: 1000, unit: "g" }, { name: "Zapallito", quantity: 30, unit: "unidad" }], 6), miPlatoFacil_planPortions_v1: JSON.stringify({ "lunes|almuerzo": 1 }) });
  await abrir(); await irA("compras");
  const filas7 = qa("#comprasList .shop-item label").map(l => l.textContent), internos = ev("shoppingDisplayItems()").map(x => x.label);
  ok("C5-7 cantidades legibles en la lista y al copiar; el texto interno (label) no cambia",
    !malos.length && filas7.includes("Queso rallado: 167 g") && filas7.includes("Zapallito: 5 unidades") && internos.includes("Queso rallado: 166,666667 g") && internos.includes("Zapallito: 5 unidad") && ev("comprasText()").includes("• Zapallito: 5 unidades") && ev('textoLegible("Huevo: 200 g + 2 unidad")') === "Huevo: 200 g + 2 unidades",
    malos.map(m => m.join(" ")).join(", ") + " | " + filas7.join(" | "));

  // C5-8 Menú ⋯: cada herramienta se abre en 2 toques desde Compras, en los dos modos, y funciona
  const herramientas = [["realizadas", "#purchaseFromList"], ["presupuesto", "#shoppingBudgetSave"], ["precios", "#priceForm"], ["costoReceta", "#recipeCostPrepare"], ["otrasRecetas", "#quantShoppingCalculate"], ["otrasRecetas", "#stockPrepare"], ["existencias", "#stockSave"], ["existencias", "#shoppingPortionMultiplier"], ["compartir", "[data-copy-compras]"]];
  const fallas8 = [];
  for (const modo of ["simple", "completo"]) {
    ev('setUiMode("' + modo + '")');
    for (const [herr, sel] of herramientas) {
      await irA("compras"); toques = 0; await menuCompras(herr);
      if (!(toques <= 2 && pantalla() === "comprasHerramientas" && visible(q(sel)))) fallas8.push(modo + ":" + herr + ":" + sel)
    }
    await irA("compras"); toques = 0; await menuCompras("presupuesto");
    await tocar(q("#budgetComparePanel summary"));
    if (!visible($("budgetCompareResult"))) fallas8.push(modo + ": Comparar alternativas");
    await irA("compras"); await tocar($("comprasDespensa"));
    if (!visible(q("#stockMovesPanel summary"))) fallas8.push(modo + ": movimientos en la Despensa")
  }
  // Funciona: Guardar existencia desde la herramienta escribe la despensa con su formato.
  await irA("compras"); await menuCompras("existencias");
  $("stockIngredient").value = "Azúcar"; $("stockQuantity").value = "2"; $("stockUnit").value = "cucharada"; await tocar($("stockSave"));
  const azucar = JSON.parse(localStorage.getItem(STOCK) || "{}")['["azucar","cucharada"]'];
  ev('setUiMode("simple")');
  ok("C5-8 cada herramienta de Compras se abre en 2 toques desde el menú ⋯, en los dos modos, y funciona", !fallas8.length && !!azucar && azucar.quantity === 2 && seVe($("stockList"), "Azúcar: 2 cucharadas"), fallas8.join(", "));

  // C5-9 Una "info" de unidad distinta queda en Pendientes con "revisá"; el contador cuenta lo tachado en "Ya tenés"
  cargar({ ...conReceta("recipe_e5prue03", "Licuado", [{ name: "Leche", quantity: 250, unit: "ml" }, { name: "Banana", quantity: 1, unit: "unidad" }, { name: "Avena", quantity: 30, unit: "g" }]), [STOCK]: JSON.stringify({ '["leche","taza"]': { name: "Leche", quantity: 1, unit: "taza" }, '["banana","unidad"]': { name: "Banana", quantity: 3, unit: "unidad" } }) });
  await abrir(); await irA("compras");
  const leche = ev("shoppingDisplayItems()").find(x => x.name === "Leche"), banana = ev("shoppingDisplayItems()").find(x => x.name === "Banana");
  const revisa = leche.group === "pendiente" && /unidad no coincide/.test(leche.suggestion.text) && seVe($("comprasList"), "Leche: 250 ml · revisá") && banana.group === "tenes";
  await tocar(q('#comprasList details.shop-group summary'));
  await tocar(q('#comprasList details.shop-group [data-shop-key="banana"]'));
  ok("C5-9 una 'info' de unidad distinta no se esconde en 'Ya tenés' y el contador cuenta lo tachado en 'Ya tenés'", revisa && /2 pendientes · 1 tachados/.test($("comprasSummary").textContent), $("comprasSummary").textContent);

  // C5-10 La clave nueva va al respaldo (opcional); un respaldo viejo la deja como está; uno inválido se rechaza
  cargar({ [OPC]: '{"descontar":false}' }); await abrir();
  const snap = w.completeBackupSnapshot(w.localStorage);
  const enRespaldo = snap.data[OPC] === '{"descontar":false}' && ev("COMPLETE_BACKUP_OPTIONAL_KEYS").includes(OPC);
  cargar({}); const vacio = w.completeBackupSnapshot(w.localStorage);
  const omitida = !(OPC in vacio.data);
  cargar({ [OPC]: '{"descontar":false}' });
  w.restoreCompleteBackup(JSON.parse(JSON.stringify(R)), w.localStorage);
  const viejoLaDeja = localStorage.getItem(OPC) === '{"descontar":false}';
  const malo = JSON.parse(JSON.stringify(R)); malo.data[OPC] = '{"descontar":"no"}';
  let rechazado = false; try { w.validateCompleteBackup(malo) } catch (e) { rechazado = true }
  ok("C5-10 'Descontar lo que tengo' va al respaldo como opcional, un respaldo viejo la deja como está y uno inválido se rechaza", enRespaldo && omitida && viejoLaDeja && rechazado);

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
