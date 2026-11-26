// R5 · Etapa 41 (Compras y Despensa): ítems K-01 a K-17 de docs/ronda-5-lista.md.
// Datos inventados; precios congelados. Mira lo que se ve en pantalla (botones, textos, cantidad de <details>, medidas) y lo que queda guardado.
(async () => {
  const H = R5H(), { ok, espera, tocar } = H;
  const ev = x => H.ev(x), doc = () => H.doc();
  const q = s => { const e = doc().querySelector(s); if (!e) throw new Error("no está: " + s); return e };
  const qa = s => [...doc().querySelectorAll(s)];
  const $ = id => doc().getElementById(id);
  const norm = t => String(t || "").replace(/\s+/g, " ").trim();
  const PRECIOS = { miPlatoFacil_mostrarPrecios_v1: '{"mostrar":true}' };
  const MOVES = "miPlatoFacil_pantryMoves_v1", STOCK = "miPlatoFacil_pantryQuantities_v1", VUELTAS = "miPlatoFacil_comprasVueltas_v1", EXTRAS = "miPlatoFacil_manualShopping_v1", REF = "miPlatoFacil_referencePrices_v1";
  const J = k => JSON.parse(localStorage.getItem(k) || "null");
  const irCompras = async () => { ev('openTab("compras")'); await espera(250) };
  const menu = async () => { await irCompras(); await tocar(q("#compras [data-compras-menu]"), 250) };
  const herr = async nombre => { await menu(); await tocar(q('.hoja [data-compras-herr="' + nombre + '"]'), 300) };
  const textosMenu = () => H.botonesHoja();
  const botonesVisibles = (raiz, re) => H.botones(re, raiz);
  // Una semana armada con tres ingredientes que ya están en la despensa (marcados, sin cantidad): quedan en "Ya tenés".
  const conTenes = async () => {
    await H.abrir({ ...H.MARCA, ...PRECIOS, ...H.PRES(60000) }); R6_LUNES(H.w());
    await H.armar("todo"); await irCompras();
    const pend = ev("shoppingDisplayItems()").filter(x => x.group === "pendiente").map(x => x.name).slice(0, 3);
    ev('go("ingredientes")'); await espera(200);
    for (const n of pend) { $("pantryItemName").value = n; $("pantryItemQty").value = ""; await tocar($("pantryItemSubmit"), 150) }
    await irCompras();
    return pend
  };

  // ---- Compras con "Ya tenés" ----
  const pend = await conTenes();
  const tenes = () => ev("shoppingDisplayItems()").filter(x => x.group === "tenes");
  const grupoTenes = () => qa("#comprasList .shop-group").find(g => /^Ya tenés/.test(g.querySelector("h3").textContent));

  // R5-K-03: "Ya tenés" no es un desplegable: se ve directo.
  const g = grupoTenes();
  ok("R5-K-03 'Ya tenés' se ve directo (sin desplegable): título y productos a la vista sin tocar nada, y Compras no tiene ningún <details>",
    !!g && g.tagName === "DIV" && H.visible(g) && qa("#comprasList .shop-group .shop-item").filter(H.visible).length >= 1 && $("compras").querySelectorAll("details,summary").length === 0 && tenes().length >= 1,
    (g ? g.querySelector("h3").textContent : "sin grupo") + " · " + pend.join(","));

  // R5-K-04: se puede sacar un producto de "Ya tenés" y vuelve a la lista (botón en cada fila).
  const filas = qa("#comprasList .shop-group .shop-item"), conBoton = filas.filter(f => f.querySelector("[data-volver-a-lista]"));
  const antesPend = ev("shoppingDisplayItems()").filter(x => x.group === "pendiente").length, nTenes = tenes().length;
  const clave = q("#comprasList [data-volver-a-lista]").dataset.volverALista, nombreVuelve = ev("shoppingDisplayItems()").find(x => x.key === clave).name;
  await tocar(q('#comprasList [data-volver-a-lista="' + clave + '"]'), 250);
  const despues = ev("shoppingDisplayItems()"), vuelto = despues.find(x => x.key === clave);
  const enLista = qa("#comprasList .compras-seccion [data-shop-key]").some(c => c.dataset.shopKey === clave);
  const guardado = J(VUELTAS);
  const semanaV = Object.values(guardado || {})[0] || [];
  ok("R5-K-04 cada fila de 'Ya tenés' tiene su botón 'Volver a la lista'; al tocarlo el producto vuelve a la lista de compras (y deja de estar en 'Ya tenés')",
    filas.length > 0 && conBoton.length === filas.length && vuelto.group === "pendiente" && enLista && tenes().length === nTenes - 1 && despues.filter(x => x.group === "pendiente").length === antesPend + 1,
    nombreVuelve + " · " + filas.length + " filas");
  const snap = ev("completeBackupSnapshot(localStorage)");
  ok("R5-K-04 lo que volvió a la lista se guarda en la clave nueva miPlatoFacil_comprasVueltas_v1 (una entrada por semana), entra al respaldo como opcional y se mantiene al volver a abrir",
    semanaV.includes(clave) && Object.keys(guardado).length === 1 && !!snap.data[VUELTAS] && ev('COMPLETE_BACKUP_OPTIONAL_KEYS.includes("' + VUELTAS + '")') && ev('Compras.validVueltas(' + JSON.stringify(guardado) + ')') && !ev('Compras.validVueltas({"x":["a"]})'));
  ev("renderCompras()"); await espera(100);
  ok("R5-K-04 al volver a dibujar la lista el producto sigue en la lista", ev("shoppingDisplayItems()").find(x => x.key === clave).group === "pendiente");

  // R5-K-01: sin Deshacer en Compras (ni al quitar un producto extra ni después de "Terminé de comprar").
  $("manualShopName").value = "Detergente"; $("manualShopAmount").value = "1 botella"; await tocar($("manualShopSubmit"), 200);
  await tocar(q("#manualShopList [data-manual-delete]"), 200);
  const sinDeshacerExtra = botonesVisibles($("compras"), /Deshacer/i).length === 0 && /Quitado: Detergente\./.test($("manualShopStatus").textContent);
  const primero = q("#comprasList .compras-seccion [data-shop-key]");
  await tocar(primero, 150); await tocar($("comprasBought"), 300);
  ok("R5-K-01 en Compras no hay ningún botón Deshacer: ni al quitar un producto que agregaste ni después de 'Terminé de comprar' (que sigue contando qué pasó a la despensa)",
    sinDeshacerExtra && botonesVisibles($("compras"), /Deshacer/i).length === 0 && /Pasó a tu despensa/.test($("comprasBoughtStatus").textContent) && !!$("comprasBoughtStatus").querySelector("[data-anotar-gasto]") && !$("compras").textContent.includes("Deshacer"),
    $("comprasBoughtStatus").textContent);

  // R5-K-02: "Agregar producto" es un recuadro con los campos a la vista y aire entre su título y el rótulo "Producto".
  await H.abrir({ ...H.MARCA, ...PRECIOS }); await irCompras();
  const caja = $("manualShoppingPanel"), rotulo = q('#manualShoppingPanel label[for="manualShopName"]'), titulo = q("#manualShoppingPanel h3");
  const bordeCaja = parseFloat(w_estilo(caja, "borderTopWidth"));
  function w_estilo(e, p) { return H.w().getComputedStyle(e)[p] }
  const sepCompras = H.separacion(titulo, rotulo);
  const camposVisibles = H.visible($("manualShopName")) && H.visible($("manualShopAmount")) && H.visible($("manualShopSubmit"));
  ev('go("ingredientes")'); await espera(200);
  const sepDespensa = H.separacion(q("#pantryItemsPanel .screen__hint"), q('#pantryItemsPanel label[for="pantryItemName"]'));
  ok("R5-K-02 'Agregar producto' es un recuadro con borde y sus campos a la vista (sin tocar nada), con al menos 8 px entre el título y el rótulo 'Producto'; el formulario de la Despensa también",
    caja.tagName === "DIV" && bordeCaja >= 1 && camposVisibles && /^Producto$/.test(norm(rotulo.textContent)) && sepCompras >= 8 && sepDespensa >= 8 && H.visible($("pantryItemName")),
    "Compras " + sepCompras + " px · Despensa " + sepDespensa + " px");

  // ---- Menú ⋯ de Compras ----
  await H.abrir({ ...H.MARCA, ...PRECIOS, ...H.PRES(60000) }); await menu();
  const entradas = textosMenu();
  ok("R5-K-10 el menú ⋯ de Compras no tiene 'Presupuesto' (ya está en la barra de arriba de la lista, que sigue abriéndolo)",
    !entradas.some(t => /Presupuesto/.test(t)) && H.visible($("comprasPresupuesto")), entradas.join(" | "));
  ok("R5-K-11 el menú ⋯ de Compras no tiene 'Compartir o copiar lista'", !entradas.some(t => /Compartir|Copiar/.test(t)), entradas.join(" | "));
  ok("R5-K-12 el menú ⋯ de Compras no tiene 'Porciones, existencias y costos'", !entradas.some(t => /Porciones|existencias/i.test(t)), entradas.join(" | "));
  ok("R5-K-13 el menú ⋯ de Compras no tiene 'Calcular para otras recetas' (ni 'Descontar lo que ya tengo', que dependía de esa selección); quedan solo Compras realizadas, Mis precios y Costo de una receta",
    !entradas.some(t => /Calcular|Descontar/.test(t)) && entradas.filter(t => /Compras realizadas|Mis precios|Costo de una receta/.test(t)).length === 3 && entradas.filter(t => t !== "Cerrar").length === 3 && !$("quantShoppingPanel") && !$("stockDeductionPanel"),
    entradas.join(" | "));

  // R5-K-06: ni "Compartir", ni "Copiar lista", ni "Ver la semana" en el pie de ninguna subsección.
  const pies = [];
  for (const [n, sel] of [["realizadas", "#purchaseSave"], ["precios", "#priceForm"], ["costoReceta", "#recipeCostPrepare"], ["presupuesto", "#shoppingBudgetSave"]]) {
    if (n === "presupuesto") { ev("hoja.cerrar()"); ev('ComprasDespensa.abrirHerramientaCompras("presupuesto")'); await espera(200) } else await herr(n);
    const visibles = botonesVisibles($("comprasHerramientas"), /^(Compartir|Copiar lista|Ver la semana)/);
    if (!H.visible(q(sel)) || visibles.length) pies.push(n + ": " + visibles.map(b => b.textContent.trim()).join(","));
  }
  await irCompras();
  ok("R5-K-06 en el pie de las subsecciones del menú ⋯ de Compras (Compras realizadas, Mis precios, Costo de una receta y Presupuesto) no hay 'Compartir', 'Copiar lista' ni 'Ver la semana'; en la lista sigue 'Compartir lista'",
    pies.length === 0 && !doc().querySelector("[data-share-compras],[data-copy-compras],[data-back-plan]") && botonesVisibles($("compras"), /^Compartir lista$/).length === 1, pies.join(" | "));

  // R5-K-05: "Compras realizadas" abre su contenido directo, sin otro desplegable.
  await herr("realizadas");
  const pr = $("purchasesPanel"), campos = ["purchaseDate", "purchaseStore", "purchaseCurrency", "purchaseTotal", "purchaseAddItem", "purchaseSave"].map(id => H.visible($(id)));
  ok("R5-K-05 en ⋯, 'Compras realizadas' abre su contenido directo: fecha, comercio, total y detalle a la vista, sin desplegable ni título repetido",
    ev("stack.at(-1)") === "comprasHerramientas" && pr.tagName === "DIV" && H.visible(pr) && campos.every(Boolean) && $("comprasHerramientas").querySelectorAll("#purchasesPanel details,#purchasesPanel summary").length === 0
    && qa("#comprasHerramientas h2,#comprasHerramientas h3,#comprasHerramientas summary").filter(H.visible).filter(e => /Compras realizadas/.test(e.textContent)).length === 1,
    campos.join(","));

  // R5-K-07 y K-08: cada producto en una fila prolija y la suma de los precios cargados.
  ev("ComprasHechas.appendPurchaseItem({ name: 'Arroz', quantity: 1, unit: 'kg', price: 1800 })");
  ev("ComprasHechas.appendPurchaseItem({ name: 'Leche entera', quantity: 2, unit: 'l', price: 3200 })");
  ev("ComprasHechas.appendPurchaseItem({ name: 'Tomate', quantity: 0.5, unit: 'kg', price: null })");
  $("purchaseTotal").value = "6.500"; $("purchaseTotal").dispatchEvent(new Event("input", { bubbles: true })); await espera(100);
  const fila = q("#purchaseItems .purchase-row"), rr = e => e.getBoundingClientRect();
  const cam = [...fila.querySelectorAll(".purchase-campo")], rotulos = cam.map(c => norm(c.firstChild.textContent));
  const mismaFila = cam.every(c => Math.abs(rr(c).top - rr(cam[0]).top) < 2) && cam.every((c, i) => i === 0 || rr(c).left >= rr(cam[i - 1]).right - 0.5);
  const dentro = [...fila.querySelectorAll("input,select,button")].every(e => rr(e).left >= rr($("purchasesPanel")).left - 0.5 && rr(e).right <= rr($("purchasesPanel")).right + 0.5);
  const altos = [...fila.querySelectorAll("input,select,button")].every(e => rr(e).height >= 44 - 0.5);
  ok("R5-K-07 cada producto del ticket es un renglón prolijo: nombre con su × arriba y, debajo y en una sola fila, Cantidad, Unidad y Precio con su rótulo a la vista (sin superponerse, todo adentro del recuadro y con objetivos de 44 px)",
    rotulos.join("/") === "Cantidad/Unidad/Precio" && mismaFila && dentro && altos && !H.seSuperponen([...fila.querySelectorAll("input,select,button")]) && qa("#purchaseItems .purchase-row").length === 3,
    rotulos.join("/") + " " + mismaFila + " " + dentro + " " + altos);
  const sel = q("#purchaseItems [data-purchase-unit]");
  const fondo = c => (c.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
  const claro = fondo(H.w().getComputedStyle(sel).backgroundColor), luz = c => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  ev('document.documentElement.setAttribute("data-theme","dark")'); await espera(100);
  const bgOscuro = fondo(H.w().getComputedStyle(sel).backgroundColor), texto = fondo(H.w().getComputedStyle(sel).color);
  ok("R5-K-07 en tema oscuro el selector de unidad no tiene fondo blanco (fondo oscuro y texto claro, como los otros campos)",
    luz(bgOscuro) < 0.35 && luz(texto) > 0.6 && luz(bgOscuro) < luz(claro) + 0.01 && luz(fondo(H.w().getComputedStyle(q("#purchaseItems [data-purchase-name]")).backgroundColor)) < 0.35,
    "fondo " + bgOscuro.join(",") + " texto " + texto.join(","));
  const suma = norm($("purchaseItemsSum").textContent);
  ok("R5-K-08 Compras realizadas muestra la suma de los precios cargados ('Suma de los precios cargados: 5.000,00 ARS (2 de 3 con precio)') y la compara con el total del ticket", /Suma de los precios cargados: 5\.000,00 ARS \(2 de 3 con precio\)/.test(suma) && /el total pagado es 6\.500,00 ARS \(faltan 1\.500,00 ARS\)/.test(suma) && H.visible($("purchaseItemsSum")), suma);
  const precio3 = qa("#purchaseItems [data-purchase-price]")[2]; precio3.value = "1500"; precio3.dispatchEvent(new Event("input", { bubbles: true })); await espera(100);
  ok("R5-K-08 al cargar el precio que falta la suma se actualiza sola y avisa que coincide con el total pagado", /6\.500,00 ARS \(3 de 3 con precio\)/.test(norm($("purchaseItemsSum").textContent)) && /coincide con el total pagado/.test($("purchaseItemsSum").textContent), norm($("purchaseItemsSum").textContent));
  ev('document.documentElement.removeAttribute("data-theme")'); await espera(60);

  // R5-K-09: "Actualizar Mis precios" y "Sumar a la despensa" en renglones separados.
  const a1 = $("purchaseUpdatePrices").closest("label"), a2 = $("purchaseAddStock").closest("label");
  ok("R5-K-09 'Actualizar Mis precios' y 'Sumar a la despensa' van en renglones separados, uno debajo del otro, de 44 px o más",
    /Actualizar Mis precios/.test(a1.textContent) && /Sumar a la despensa/.test(a2.textContent) && rr(a2).top >= rr(a1).bottom - 0.5 && rr(a1).height >= 44 - 0.5 && rr(a2).height >= 44 - 0.5 && Math.abs(rr(a1).left - rr(a2).left) < 2,
    Math.round(rr(a1).bottom) + "→" + Math.round(rr(a2).top));

  // ---- Mis precios y Costo de una receta ----
  // R5-K-14: abren su contenido directo, sin desplegables.
  // Con el respaldo de ejemplo sin "Mis precios" hay productos de la semana sin precio real.
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  await H.abrir({ ...R.data, ...H.MARCA, [REF]: null });
  await herr("precios");
  const pp = $("pricePanel");
  const directoPrecios = pp.tagName === "DIV" && H.visible(pp) && H.visible($("priceForm")) && H.visible($("priceName")) && H.visible($("priceValue")) && pp.querySelectorAll("details,summary").length === 0;
  const textoPrecios = norm($("comprasHerramientas").innerText);
  await herr("costoReceta");
  const pc = $("recipeCostPanel");
  const directoCosto = pc.tagName === "DIV" && H.visible(pc) && H.visible($("recipeCostTitle")) && H.visible($("recipeCostPortions")) && H.visible($("recipeCostPrepare")) && pc.querySelectorAll("details,summary").length === 0;
  ok("R5-K-14 'Mis precios' y 'Costo de una receta' abren su contenido directo: formularios a la vista sin tocar nada y sin desplegables",
    directoPrecios && directoCosto && !/Compras realizadas/.test($("comprasHerrTitulo").textContent) && /Costo de una receta/.test($("comprasHerrTitulo").textContent), directoPrecios + " " + directoCosto);

  // R5-K-15: Mis precios avisa qué ingredientes no tienen precio (los de la semana primero) y deja elegir uno o escribir uno propio.
  await herr("precios");
  const aviso = norm($("priceMissing").textContent), semana = ev("ingredientesSinPrecio()");
  const select = $("priceMissingSelect"), grupos = [...select.querySelectorAll("optgroup")].map(o => o.label);
  const opSemana = [...select.querySelectorAll("optgroup")[0].querySelectorAll("option")].map(o => o.value);
  ok("R5-K-15 'Mis precios' avisa qué ingredientes de la semana no tienen precio ('Te faltan precios de N ingredientes de tu semana: …') y los muestra primero en la lista, antes que los otros ingredientes sin precio",
    semana.semana.length > 0 && new RegExp("^Te faltan precios de " + semana.semana.length + " ingredientes? de tu semana: ").test(aviso) && grupos[0] === "De tu semana" && JSON.stringify(opSemana) === JSON.stringify(semana.semana) && (semana.otros.length === 0 || grupos[1] === "Otros ingredientes") && H.visible(select),
    aviso.slice(0, 140));
  const elegido = semana.semana[0];
  select.value = elegido; select.dispatchEvent(new Event("change", { bubbles: true })); await espera(100);
  const llenoNombre = $("priceName").value === elegido && $("priceUnit").value === ev("unidadSugeridaFicha(" + JSON.stringify(elegido) + ")") && /Cargá el contenido y el precio/.test($("priceStatus").textContent);
  const unidadLlena = $("priceUnit").value; $("priceAmount").value = "1"; $("priceValue").value = "2500";
  await tocar(q('#priceForm button[type="submit"]'), 250);
  const refs = Object.values(J(REF) || {});
  const guardoElegido = refs.some(r => r.name.toLowerCase() === elegido.toLowerCase() && r.price === 2500);
  const despuesSem = ev("ingredientesSinPrecio()").semana;
  $("priceName").value = "Ingrediente inventado de prueba"; $("priceAmount").value = "500"; $("priceValue").value = "900"; $("priceUnit").value = "g";
  await tocar(q('#priceForm button[type="submit"]'), 250);
  const propio = Object.values(J(REF) || {}).some(r => r.name === "Ingrediente inventado de prueba" && r.price === 900);
  ok("R5-K-15 elegir un ingrediente de la lista llena el formulario (nombre y unidad), al guardar su precio deja de aparecer como faltante, y se puede escribir un ingrediente propio",
    llenoNombre && guardoElegido && !despuesSem.some(n => n.toLowerCase() === elegido.toLowerCase()) && propio && !!$("priceName"), elegido + " · quedan " + despuesSem.length);

  // ---- Despensa ----
  const stock0 = JSON.stringify({ '["queso rallado","g"]': { name: "Queso rallado", quantity: 200, unit: "g" } });
  const mov0 = JSON.stringify([{ at: "2026-11-20T10:00:00.000Z", name: "Queso rallado", unit: "g", delta: 200, reason: "Ajuste manual" }, { at: "2026-11-21T10:00:00.000Z", name: "Arroz", unit: "g", delta: 100, reason: "Lo compré · 21/11/2026" }]);
  await H.abrir({ ...H.MARCA, ...PRECIOS, [STOCK]: stock0, [MOVES]: mov0 });
  ev('openTab("compras")'); await espera(200); ev('go("ingredientes")'); await espera(250);
  const des = $("ingredientes");
  // R5-K-16: sin Deshacer ni "Todos los movimientos" (los datos quedan).
  await tocar(q("#pantryItemList [data-pantry-item-remove-stock]"), 250);
  const sinDeshacer = botonesVisibles(des, /Deshacer/i).length === 0 && !des.textContent.includes("Deshacer");
  const quitado = !(J(STOCK) || {})['["queso rallado","g"]'];
  ok("R5-K-16 en Despensa no hay botón Deshacer (ni al quitar un ingrediente ni al editarlo) y no existe 'Todos los movimientos'",
    sinDeshacer && quitado && !/Todos los movimientos/.test(des.textContent) && !$("stockMoves") && !$("stockMovesPanel") && /Quitado: Queso rallado\./.test($("pantryItemStatus").textContent), $("pantryItemStatus").textContent);
  const snapD = ev("completeBackupSnapshot(localStorage)");
  ok("R5-K-16 los movimientos siguen guardados (miPlatoFacil_pantryMoves_v1 con lo anterior más el de quitar), entran al respaldo y se ven en el historial de cada ingrediente",
    J(MOVES).length >= 3 && J(MOVES).some(m => m.name === "Arroz") && !!snapD.data[MOVES] && ev('movimientosDe("Arroz").length') === 1 && ev('COMPLETE_BACKUP_KEYS.includes("' + MOVES + '")'));

  // R5-K-12: cargar existencias con cantidad se hace en Despensa, sin desplegables; el formulario viejo no está.
  const form = $("pantryItemsPanel");
  $("pantryItemName").value = "Azúcar"; $("pantryItemQty").value = "2"; $("pantryItemUnit").value = "cucharada"; await tocar($("pantryItemSubmit"), 250);
  const az = (J(STOCK) || {})['["azucar","cucharada"]'];
  const desplegablesDespensa = qa("#ingredientes details").filter(d => !d.classList.contains("pantry-item__historial"));
  ok("R5-K-12 'Porciones, existencias y costos' salió del menú; las existencias con cantidad se cargan en Despensa (ingrediente, cantidad y unidad a la vista, sin desplegables) y quedan en la despensa; el formulario viejo (stockSave, multiplicador) ya no está",
    H.visible(form) && H.visible($("pantryItemQty")) && H.visible($("pantryItemUnit")) && !!az && az.quantity === 2 && /Azúcar · 2 cucharadas/.test($("pantryItemList").innerText) && desplegablesDespensa.length === 0
    && !$("stockSave") && !$("stockIngredient") && !$("shoppingPortionMultiplier") && !$("shoppingQuantCostPanel"), desplegablesDespensa.length + " desplegables");

  // R5-K-17: "Revisar qué tengo y qué falta" es un botón, no un desplegable.
  ev('ModoSimple.setUiMode("completo")'); await espera(100); ev('go("ingredientes")'); await espera(200);
  const rev = $("pantryReviewAbrir"), panelOculto = !H.visible($("pantryReviewPanel")), exp0 = rev.getAttribute("aria-expanded");
  await tocar(rev, 300);
  ok("R5-K-17 'Revisar qué tengo y qué falta' es un botón (no un desplegable): al tocarlo se abre la revisión en el mismo lugar con su lista de ideas",
    rev.tagName === "BUTTON" && /Revisar qué tengo y qué falta/.test(rev.textContent) && panelOculto && exp0 === "false" && rev.getAttribute("aria-expanded") === "true" && H.visible($("pantryReviewPanel")) && H.visible($("pantryReviewRecipe")) && $("pantryReviewRecipe").options.length > 5 && !rev.closest("details") && !$("pantryReviewPanel").closest("details"),
    "opciones " + $("pantryReviewRecipe").options.length);
  await tocar(rev, 200);
  ok("R5-K-17 al volver a tocarlo se esconde la revisión", !H.visible($("pantryReviewPanel")) && rev.getAttribute("aria-expanded") === "false");

  return H.terminar();
})()
