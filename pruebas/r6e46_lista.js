// R6 · Etapa 46 (Lista para cuando comprás): ítems L-01 a L-06 de docs/ronda-6-lista.md.
// Datos inventados; hoy fijo = jueves 26/11/2026 (esta semana empieza el lunes 23/11; la que viene, el lunes 30/11) salvo donde se cambia.
(async () => {
  const H = R6H(), { ok, espera, tocar } = H;
  const ev = x => H.ev(x), doc = () => H.doc();
  const $ = id => doc().getElementById(id);
  const qa = s => [...doc().querySelectorAll(s)];
  const norm = H.norm, J = H.J;
  const CHECKS = "miPlatoFacil_shoppingChecks_v1", PERIODO = "miPlatoFacil_comprasPeriodo_v1";
  const R = [
    { id: "recipe_lista6a", titulo: "Guiso del lunes", filas: [{ name: "Lentejas", quantity: 200, unit: "g" }, { name: "Arroz", quantity: 100, unit: "g" }] },
    { id: "recipe_lista6b", titulo: "Pollo de hoy", filas: [{ name: "Pollo", quantity: 500, unit: "g" }, { name: "Arroz", quantity: 100, unit: "g" }] },
    { id: "recipe_lista6c", titulo: "Tarta del sábado", filas: [{ name: "Zapallito", quantity: 4, unit: "unidad" }, { name: "Huevo", quantity: 3, unit: "unidad" }] },
    { id: "recipe_lista6d", titulo: "Ensalada de la semana que viene", filas: [{ name: "Lechuga", quantity: 1, unit: "unidad" }, { name: "Arroz", quantity: 150, unit: "g" }] },
    { id: "recipe_lista6e", titulo: "Milanesas del martes que viene", filas: [{ name: "Carne picada", quantity: 400, unit: "g" }, { name: "Arroz", quantity: 50, unit: "g" }] },
  ];
  const base = (hoy, plan, prox, extra = {}) => ({ ...H.MARCA, ...H.recetas(R), miPlatoFacil_plan: JSON.stringify(H.planDe(plan)), ...(prox ? H.proxima(prox.lunes, prox.slots) : {}), ...extra });
  const PLAN = [["lunes", "almuerzo", "rp_recipe_lista6a"], ["jueves", "cena", "rp_recipe_lista6b"], ["sabado", "almuerzo", "rp_recipe_lista6c"]];
  const PROX = { lunes: "2026-11-30", slots: [["lunes", "almuerzo", "rp_recipe_lista6d"], ["martes", "cena", "rp_recipe_lista6e"]] };
  const abrir = async (hoy, datos) => { await H.abrirEn(hoy, datos); ev('openTab("compras")'); await espera(350) };
  const nombres = () => ev("shoppingDisplayItems(Compras.periodoActual())").map(x => x.name).sort();
  const filas = () => qa("#comprasList .shop-item").map(f => norm(f.innerText));
  const botonesPeriodo = () => qa("[data-compras-periodo]");
  const pulsado = () => botonesPeriodo().filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.dataset.comprasPeriodo);
  const w_ = () => H.w().localStorage;
  const elegir = async p => { await tocar(botonesPeriodo().find(b => b.dataset.comprasPeriodo === p), 350) };
  const tachar = async nombre => { const f = qa("#comprasList .shop-item").find(x => new RegExp("^" + nombre, "i").test(norm(x.innerText))); const c = f && f.querySelector("input[type=checkbox]"); if (!c) throw new Error("no hay casilla para " + nombre); await tocar(c, 350) };

  // ---- L-01: "Comprar para" con tres botones; la lista, el total y la barra de presupuesto salen del período ----
  await abrir("2026-11-26", base("2026-11-26", PLAN, PROX, { ...H.PRES(60000), miPlatoFacil_mostrarPrecios_v1: '{"mostrar":true}' }));
  const titulo = norm(($("comprasPeriodoTitulo") || { innerText: "" }).innerText), textos = botonesPeriodo().map(b => norm(b.innerText));
  ok("R6-L-01 arriba de la lista dice 'Comprar para' y hay tres botones: Esta semana, La semana que viene y Las dos", titulo === "Comprar para" && JSON.stringify(textos) === JSON.stringify(["Esta semana", "La semana que viene", "Las dos"]) && botonesPeriodo().every(H.visible) && H.separacion($("comprasPeriodoTitulo"), $("comprasList")) > 0, titulo + " | " + textos.join(" | "));
  const esta = { pulsado: pulsado(), nombres: nombres(), total: norm($("comprasSummary").innerText), barra: norm($("comprasPresupuesto").innerText) };
  await elegir("proxima");
  const prox = { pulsado: pulsado(), nombres: nombres(), total: norm($("comprasSummary").innerText), barra: norm($("comprasPresupuesto").innerText), filas: filas() };
  await elegir("dos");
  const dos = { pulsado: pulsado(), nombres: nombres(), total: norm($("comprasSummary").innerText), barra: norm($("comprasPresupuesto").innerText) };
  ok("R6-L-01 la lista cambia con el período: esta semana, la que viene y las dos, con el botón elegido marcado", JSON.stringify(esta.pulsado) === '["esta"]' && JSON.stringify(prox.pulsado) === '["proxima"]' && JSON.stringify(dos.pulsado) === '["dos"]'
    && esta.nombres.includes("Pollo") && !esta.nombres.includes("Lechuga") && prox.nombres.includes("Lechuga") && prox.nombres.includes("Carne picada") && !prox.nombres.includes("Pollo")
    && ["Pollo", "Lechuga", "Carne picada", "Zapallito"].every(n => dos.nombres.includes(n)), JSON.stringify({ esta: esta.nombres, prox: prox.nombres, dos: dos.nombres }));
  ok("R6-L-01 el total y la barra de presupuesto salen del período elegido (cada uno da un número distinto)", new Set([esta.total, prox.total, dos.total]).size === 3 && new Set([esta.barra, prox.barra, dos.barra]).size === 3 && /≈ \$/.test(prox.barra), JSON.stringify({ e: esta.total, p: prox.total, d: dos.total }) + " | " + esta.barra + " | " + prox.barra + " | " + dos.barra);

  // ---- L-02: "Esta semana" cuenta de hoy al domingo ----
  await abrir("2026-11-26", base("2026-11-26", PLAN, PROX));
  const hoyJueves = nombres();
  ok("R6-L-02 'Esta semana' (jueves) cuenta las comidas de hoy al domingo: no está lo del lunes (Lentejas) y sí lo de hoy y el sábado", !hoyJueves.includes("Lentejas") && hoyJueves.includes("Pollo") && hoyJueves.includes("Zapallito") && hoyJueves.includes("Arroz"), hoyJueves.join(", "));
  const arrozEsta = ev("shoppingDisplayItems('esta').find(x => x.name === 'Arroz').units.get('g')");
  await abrir("2026-11-23", base("2026-11-23", PLAN, PROX));
  ok("R6-L-02 el lunes 'Esta semana' cuenta todos los días de la semana: vuelve la lentejas y el arroz suma lo del lunes y lo del jueves", nombres().includes("Lentejas") && ev("shoppingDisplayItems('esta').find(x => x.name === 'Arroz').units.get('g')") === 200 && arrozEsta === 100, "jueves " + arrozEsta);

  // ---- L-03: por defecto y lo elegido a mano ----
  const defecto = async (hoy, plan, prox) => { await abrir(hoy, base(hoy, plan, prox)); return { pulsado: pulsado()[0], periodo: ev("Compras.periodoActual()"), guardado: localStorage.getItem(PERIODO) } };
  const vie = await defecto("2026-11-27", PLAN, PROX), sab = await defecto("2026-11-28", PLAN, PROX), dom = await defecto("2026-11-29", PLAN, PROX), jue = await defecto("2026-11-26", PLAN, PROX), lun = await defecto("2026-11-23", PLAN, PROX);
  const vieSin = await defecto("2026-11-27", PLAN, null);
  ok("R6-L-03 de viernes a domingo, con comidas la semana que viene, la lista abre en 'La semana que viene'; los otros días, en 'Esta semana'", [vie, sab, dom].every(x => x.pulsado === "proxima" && x.periodo === "proxima") && [jue, lun].every(x => x.pulsado === "esta"), JSON.stringify({ vie, sab, dom, jue, lun }));
  ok("R6-L-03 de viernes a domingo, si la semana que viene está vacía, abre en 'Esta semana'", vieSin.pulsado === "esta", JSON.stringify(vieSin));
  ok("R6-L-03 abrir la lista sin elegir nada no escribe la clave miPlatoFacil_comprasPeriodo_v1", [vie, sab, dom, jue, lun, vieSin].every(x => x.guardado === null));
  await abrir("2026-11-27", base("2026-11-27", PLAN, PROX));
  await elegir("esta");
  const guardado = J(PERIODO);
  await abrir("2026-11-27", { ...base("2026-11-27", PLAN, PROX), [PERIODO]: JSON.stringify(guardado) });
  const recordado = pulsado()[0];
  await abrir("2026-11-28", { ...base("2026-11-28", PLAN, PROX), [PERIODO]: JSON.stringify(guardado) });
  const sabado = pulsado()[0];
  await abrir("2026-11-30", { ...base("2026-11-30", PLAN, PROX), [PERIODO]: JSON.stringify(guardado) });
  const lunesSig = ev("Compras.periodoActual()");
  ok("R6-L-03 lo que elegís a mano se recuerda (clave con el lunes de esa semana) hasta el lunes siguiente, y ese lunes vuelve a lo de siempre", guardado && guardado.periodo === "esta" && guardado.semana === "2026-11-23" && recordado === "esta" && sabado === "esta" && lunesSig === "esta", JSON.stringify({ guardado, recordado, sabado, lunesSig }));
  ok("R6-L-03 una clave de período con formato malo se ignora y se usa el período de siempre", await (async () => { await abrir("2026-11-27", { ...base("2026-11-27", PLAN, PROX), [PERIODO]: '{"periodo":"mes","semana":"2026-11-23"}' }); return pulsado()[0] === "proxima" })());

  // ---- L-04: tachado por semana ----
  await abrir("2026-11-26", base("2026-11-26", PLAN, PROX));
  await elegir("dos");
  const arroz2 = ev("shoppingDisplayItems('dos').filter(x => x.name === 'Arroz').map(x => x.units.get('g'))");
  await tachar("Arroz");
  const tras = J(CHECKS) || {};
  ok("R6-L-04 con 'Las dos', el arroz de las dos semanas aparece una vez con la cantidad sumada (100 de hoy + 150 + 50 de la que viene) y tacharlo lo tacha en las dos semanas", JSON.stringify(arroz2) === "[300]" && (tras["2026-11-23"] || { t: [] }).t.includes("arroz") && (tras["2026-11-30"] || { t: [] }).t.includes("arroz"), JSON.stringify({ arroz2, tras }));
  await elegir("esta");
  const arrozEstaTachado = ev("comprasDone.arroz === true");
  await elegir("proxima");
  ok("R6-L-04 el arroz tachado con 'Las dos' queda tachado en cada semana por separado", arrozEstaTachado && ev("comprasDone.arroz === true"));
  // Tachar algo de la semana que viene no cambia esta semana (y al revés), y lo ya tachado sigue igual.
  await abrir("2026-11-26", base("2026-11-26", PLAN, PROX, { [CHECKS]: JSON.stringify({ "2026-11-23": { t: ["pollo"], c: [] } }) }));
  const estaAntes = J(CHECKS);
  await elegir("proxima");
  await tachar("Lechuga");
  const trasProx = J(CHECKS);
  ok("R6-L-04 tachar algo de la semana que viene no cambia esta semana, y lo ya tachado sigue igual", JSON.stringify(trasProx["2026-11-23"]) === JSON.stringify(estaAntes["2026-11-23"]) && trasProx["2026-11-30"].t.includes("lechuga") && !trasProx["2026-11-23"].t.includes("lechuga"), JSON.stringify(trasProx));
  await elegir("esta");
  ok("R6-L-04 al volver a 'Esta semana' el pollo sigue tachado y la lechuga no está", ev("comprasDone.pollo === true") && !nombres().includes("Lechuga"));
  // Compatibilidad: un respaldo viejo (tachados de esta semana, sin la clave del período) se ve igual que antes.
  await abrir("2026-11-26", { ...base("2026-11-26", PLAN, null, { [CHECKS]: JSON.stringify({ "2026-11-23": { t: ["arroz", "pollo"], c: [] } }) }) });
  ok("R6-L-04 con tachados guardados de esta semana y sin la clave nueva, la lista abre en 'Esta semana' con esos productos tachados", pulsado()[0] === "esta" && ev("comprasDone.arroz === true && comprasDone.pollo === true") && qa("#comprasList .shop-item input:checked").length === 2, JSON.stringify({ p: pulsado(), d: ev("JSON.stringify(comprasDone)"), n: qa("#comprasList .shop-item input:checked").length, periodo: ev("Compras.periodoActual()"), hoy: ev("String(new Date())") }));

  // Con "Las dos", tachar o destachar otra cosa no borra lo que está tachado (o comprado) en una sola semana.
  await abrir("2026-11-26", base("2026-11-26", PLAN, PROX, { [CHECKS]: JSON.stringify({ "2026-11-23": { t: ["pollo", "arroz"], c: ["arroz"] }, "2026-11-30": { t: ["lechuga"], c: [] } }) }));
  const ordenar = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { t: [...v.t].sort(), c: [...v.c].sort() }]));
  const antesDos = JSON.stringify(J(CHECKS));
  await elegir("dos");
  await tachar("Huevo");
  const tras1 = J(CHECKS);
  await tachar("Huevo");
  const tras2 = J(CHECKS);
  ok("R6-L-04 con 'Las dos', tachar y destachar un producto solo toca a ese producto: lo tachado y lo comprado de una sola semana (pollo, arroz, lechuga) sigue guardado", ["pollo", "arroz"].every(k => tras1["2026-11-23"].t.includes(k)) && tras1["2026-11-23"].c.includes("arroz") && tras1["2026-11-30"].t.includes("lechuga")
    && tras1["2026-11-23"].t.includes("huevo") && !tras2["2026-11-23"].t.includes("huevo") && JSON.stringify(ordenar(tras2)) === JSON.stringify(ordenar(JSON.parse(antesDos))), JSON.stringify({ antesDos, tras1, tras2 }));
  // "Terminé de comprar" con "Las dos" marca como comprado solo lo tachado y deja lo comprado de otra semana.
  await tachar("Carne picada");
  await tocar($("comprasBought"), 500);
  const trasComprar = J(CHECKS);
  ok("R6-L-04 'Terminé de comprar' con 'Las dos' marca lo tachado como comprado en su semana y conserva el resto", trasComprar["2026-11-30"].c.includes("carne picada") && trasComprar["2026-11-23"].c.includes("arroz") && trasComprar["2026-11-30"].t.includes("lechuga"), JSON.stringify(trasComprar));
  // Si el plan cambia, un producto que vuelve a aparecer se ve tachado si lo estaba (se relee del almacenamiento).
  await abrir("2026-11-26", base("2026-11-26", PLAN, null, { [CHECKS]: JSON.stringify({ "2026-11-23": { t: ["pollo", "lechuga"], c: [] } }) }));
  const sinLechuga = !ev("comprasDone.lechuga");
  localStorage.setItem("miPlatoFacil_plan", JSON.stringify(H.planDe([...PLAN, ["viernes", "almuerzo", "rp_recipe_lista6d"]])));
  w_(); await espera(100); ev('renderCompras()');
  ok("R6-L-04 si el plan cambia, un producto que vuelve a aparecer se ve tachado si lo estaba (no se pierde de la vista ni del almacenamiento)", sinLechuga && ev("comprasDone.lechuga === true") && J(CHECKS)["2026-11-23"].t.includes("lechuga"));

  // ---- L-05: compartir ----
  await abrir("2026-11-26", base("2026-11-26", PLAN, PROX));
  await elegir("proxima");
  const tProx = ev("Compras.comprasText()");
  await elegir("esta");
  const tEsta = ev("Compras.comprasText()");
  await elegir("dos");
  const tDos = ev("Compras.comprasText()");
  ok("R6-L-05 compartir dice el período: 'Lista para la semana del 30/11 al 6/12' (la que viene), del 26/11 al 29/11 (esta) y del 26/11 al 6/12 (las dos)", /Lista para la semana del 30\/11 al 6\/12/.test(tProx) && /Lista para la semana del 26\/11 al 29\/11/.test(tEsta) && /Lista para la semana del 26\/11 al 6\/12/.test(tDos), tProx.split("\n").slice(0, 3).join(" / "));
  ok("R6-L-05 el texto compartido lleva solo los productos del período", /Lechuga/.test(tProx) && /Carne picada/.test(tProx) && !/Pollo/.test(tProx) && !/Zapallito/.test(tProx) && /Pollo/.test(tEsta) && !/Lechuga/.test(tEsta) && /Lechuga/.test(tDos) && /Pollo/.test(tDos), tProx);

  // ---- L-06: "Agregar producto" debajo de la lista ----
  const panel = $("manualShoppingPanel"), lista = $("comprasList");
  ok("R6-L-06 'Agregar producto' queda debajo de la lista (y sigue funcionando)", H.visible(panel) && panel.getBoundingClientRect().top >= lista.getBoundingClientRect().bottom - 1 && /Agregar producto/.test(panel.innerText) && !!$("manualShopName") && !!$("manualShopSubmit"), Math.round(panel.getBoundingClientRect().top) + " vs " + Math.round(lista.getBoundingClientRect().bottom));
  $("manualShopName").value = "Detergente"; $("manualShopAmount").value = "1 botella";
  await tocar($("manualShopSubmit"), 300);
  ok("R6-L-06 un producto agregado abajo aparece en 'Otros productos' y se guarda", /Detergente/.test($("manualShopList").innerText) && /Detergente/.test(localStorage.getItem("miPlatoFacil_manualShopping_v1") || ""));

  // ---- Una fila con la nota de la despensa no se aprieta (estaba en main: el nombre quedaba en una columna de una letra por línea) ----
  await abrir("2026-11-23", base("2026-11-23", PLAN, PROX, { miPlatoFacil_pantryQuantities_v1: JSON.stringify({ '["pollo","kg"]': { name: "Pollo", quantity: 2, unit: "kg" }, '["zapallito","g"]': { name: "Zapallito", quantity: 300, unit: "g" } }) }));
  const conNota = qa("#comprasList .shop-item").filter(f => f.querySelector(".shop-item__detail"));
  const angosta = qa("#comprasList .shop-item label").filter(l => l.getBoundingClientRect().height > 90 && H.visible(l));
  ok("R6-L-01 ninguna fila de la lista deja el nombre partido en muchas líneas (más de 90 px de alto), tengan o no una nota de la despensa", angosta.length === 0, "filas con nota: " + conNota.length + ", angostas: " + angosta.map(l => norm(l.innerText) + " " + Math.round(l.getBoundingClientRect().width) + "px fila " + Math.round(l.parentNode.getBoundingClientRect().width) + "px").join(" | "));

  // ---- El período se guarda en el respaldo (opcional) y un respaldo viejo sin la clave se restaura igual ----
  {
    const R0 = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json(), w = H.w();
    const conClave = JSON.parse(JSON.stringify(R0)); conClave.data[PERIODO] = JSON.stringify({ periodo: "dos", semana: "2026-11-23" });
    const malo = JSON.parse(JSON.stringify(R0)); malo.data[PERIODO] = '{"periodo":"mes","semana":"x"}';
    let restauroCon = false, restauroViejo = false, rechazoMalo = false;
    try { w.Respaldo.restoreCompleteBackup(conClave, w.localStorage); restauroCon = w.localStorage.getItem(PERIODO) === conClave.data[PERIODO] } catch (e) { }
    w.localStorage.removeItem(PERIODO);
    try { w.Respaldo.restoreCompleteBackup(JSON.parse(JSON.stringify(R0)), w.localStorage); restauroViejo = true } catch (e) { }
    try { w.Respaldo.restoreCompleteBackup(malo, w.localStorage) } catch (e) { rechazoMalo = true }
    ok("R6-L-03 la clave del período entra al respaldo como opcional: se restaura con la clave, se restaura un respaldo viejo sin ella y se rechaza una con formato malo", restauroCon && restauroViejo && rechazoMalo && w.eval("COMPLETE_BACKUP_KEYS.includes(" + JSON.stringify(PERIODO) + ") && COMPLETE_BACKUP_OPTIONAL_KEYS.includes(" + JSON.stringify(PERIODO) + ")"), JSON.stringify({ restauroCon, restauroViejo, rechazoMalo }));
  }

  // ---- Si el día cambia con la app abierta, la lista y los tachados se recalculan ----
  await abrir("2026-11-23", base("2026-11-23", PLAN, PROX));
  const KEYLENT = ev('ingredientKey("Lentejas")');
  await abrir("2026-11-23", base("2026-11-23", PLAN, PROX, { [CHECKS]: JSON.stringify({ "2026-11-23": { t: [KEYLENT], c: [] } }) }));
  const lunesAntes = { n: nombres(), d: ev("JSON.stringify(comprasDone)"), hoy: ev("String(new Date())"), per: ev("Compras.periodoActual()") }, lunesCon = nombres().includes("Lentejas") && ev("comprasDone[" + JSON.stringify(KEYLENT) + "] === true");
  H.fijarFecha("2026-11-26"); ev("renderCompras()"); await espera(200);
  ok("R6-L-02 si el día cambia con la app abierta (del lunes al jueves), la lista ya no cuenta lo que pasó y los tachados se recalculan", lunesCon && !nombres().includes("Lentejas") && ev("comprasDone[" + JSON.stringify(KEYLENT) + "] !== true") && !!J(CHECKS)["2026-11-23"].t.includes(KEYLENT), JSON.stringify({ lunesAntes, n: nombres(), d: ev("JSON.stringify(comprasDone)"), s: localStorage.getItem(CHECKS) }));

  // ---- Sin configurar nada: la lista da lo mismo que en la v19.10.5 (esta semana completa, sin período guardado) ----
  const lunesTodo = await (async () => { await abrir("2026-11-23", base("2026-11-23", PLAN, PROX)); return JSON.stringify(ev("shoppingDisplayItems('esta').map(x => [x.name, [...x.units]])")) === JSON.stringify(ev("shoppingDisplayItems().map(x => [x.name, [...x.units]])")) })();
  ok("R6-L-02 sin período (como en la v19.10.5) la lista de esta semana entera es la misma que con el período 'Esta semana' el lunes", lunesTodo);
  return H.terminar();
})()
