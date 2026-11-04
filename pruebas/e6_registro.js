// E6: Etapa 6 del rediseño (Un solo registro). La vista Registro junta "Lo comí" (consumption_v1) y "Lo cociné"
// (cookingHistory_v1) por día, muestra aparte el contador "cooked" de cada plato y corrige todo con Deshacer.
// C6-1 es el control E6-un-registro de docs/validacion/criterios.json: hay un solo lugar para ver y corregir lo registrado.
// La app se abre en un marco aparte (mismo origen y mismo localStorage) para poder recargarla. Solo datos inventados.
(async () => {
  const T = []; const ok = (n, c, d) => T.push((c ? "PASA " : "FALLA ") + n + (d !== undefined && d !== "" ? " · " + d : ""));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  let marco = null, w = null, toques = 0, pidioConfirmar = false;
  const abrir = async () => {
    if (marco) marco.remove();
    marco = document.createElement("iframe"); marco.id = "marcoPrueba";
    marco.style.cssText = "position:fixed;left:0;top:0;width:390px;height:844px;border:0;opacity:0;pointer-events:none;z-index:-1";
    document.body.append(marco);
    await new Promise((res, rej) => { marco.onload = res; marco.onerror = rej; marco.src = "/index.html?marco=" + Date.now() });
    await espera(500);
    w = marco.contentWindow; pidioConfirmar = false;
    // Nada del Registro pide confirmación: si algo la pide, queda anotado y la prueba falla.
    w.confirm = () => { pidioConfirmar = true; return false }; w.prompt = () => "";
  };
  const ev = x => w.eval(x);
  const doc = () => w.document;
  const q = s => { const e = doc().querySelector(s); if (!e) throw Error("no está en la pantalla: " + s + " (pantalla: " + ev("stack.at(-1)") + ")"); return e };
  const qa = s => [...doc().querySelectorAll(s)];
  const $ = id => q("#" + id);
  const tocar = async el => { el.click(); toques++; await espera(120) };
  const irA = async pestana => { await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')); if (ev("stack.at(-1) !== Armado.activeTabRoot()")) await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')) };
  const pantalla = () => ev("stack.at(-1)");
  const visible = e => !!e && e.getClientRects().length > 0;
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const todo = () => JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith("miPlatoFacil_") && k !== "miPlatoFacil_uiMode_v1").sort().map(k => [k, localStorage.getItem(k)]));
  const J = k => JSON.parse(R.data[k]);
  const CONS = "miPlatoFacil_consumption_v1", HIST = "miPlatoFacil_cookingHistory_v1", SAVED = "miPlatoFacil_saved", STOCK = "miPlatoFacil_pantryQuantities_v1", MOVES = "miPlatoFacil_pantryMoves_v1";
  const tres = () => JSON.stringify([CONS, HIST, SAVED].map(k => localStorage.getItem(k)));
  const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const planDe = slots => { const p = {}; for (const d of DIAS) p[d] = { desayuno: null, merienda: null, almuerzo: null, cena: null }; for (const [d, c, id] of slots) p[d][c] = id; return JSON.stringify(p) };
  const plato = (id, nombre, cooked) => ({ id, savedAt: "2026-10-26T10:00:00.000Z", type: "plato", title: "Almuerzo / Cena · Día libre", note: nombre, lines: ["Verduras: Tomate", "Almidones: Arroz", "Proteínas: Pollo"], sig: "s_" + id, text: nombre, cooked: cooked || 0, state: { type: "plato", day: "Día libre", verduras: ["Tomate"], almidones: ["Arroz"], proteinas: ["Pollo"] } });
  const filas = () => qa("#registroLista .registro-fila").map(f => ({ tipo: f.dataset.registroTipo, id: f.dataset.registroId, texto: f.textContent, quitar: f.querySelector("[data-registro-quitar]") }));
  const fila = id => filas().find(f => f.id === id);
  const deshacer = async sel => { const b = doc().querySelector((sel || "#registroEstado") + " [data-registro-deshacer]"); if (b) await tocar(b); return !!b };
  const hoyF = () => w.Rutina.localTrainingDate(new w.Date());
  const SELS = "[data-consumption-remove], [data-cooking-history-delete], [data-registro-quitar], [data-registro-restar], #consumptionView, #cookingHistoryList, #registroLista";

  // C6-1 Un solo lugar para ver y corregir lo registrado (respaldo de ejemplo)
  localStorage.clear(); await abrir();
  w.Respaldo.restoreCompleteBackup(JSON.parse(JSON.stringify(R)), w.localStorage);
  localStorage.setItem("miPlatoFacil_uiMode_v1", "completo");
  await abrir();
  const antes1 = todo(), faltan = [];
  const exigir = (que, cond, det) => { if (!cond) faltan.push(que + (det ? " (" + det + ")" : "")) };
  // Las otras pantallas no muestran registros ni Quitar de registros.
  const fuera = () => qa(SELS).filter(e => !e.closest("#registro"));
  exigir("todo dentro de #registro", fuera().length === 0, fuera().map(e => e.id || e.className).join(","));
  for (const [tab, extra] of [["hoy"], ["semana"], ["semana", "historial"], ["miscomidas"], ["miscomidas", "card"], ["compras"], ["mas"]]) {
    await irA(tab);
    if (extra === "historial") { await tocar(q("#plan [data-plan-menu]")); await tocar(q('.hoja [data-plan-herr="historial"]')) }
    if (extra === "card") await tocar(q('#savedList .comida-card[data-comida-id="plato_p1"]'));
    exigir("sin registros en " + pantalla(), qa(SELS).filter(visible).length === 0, qa(SELS).filter(visible).map(e => e.id || e.dataset.registroQuitar).join(","));
  }
  // Desde Más, el Registro abre en hoy y recorre los días con los chips y con ‹.
  await irA("mas"); await tocar(q("#sectionSettings [data-open-registro]"));
  exigir("pantalla Registro", pantalla() === "registro" && ev("registroFecha") === hoyF());
  const vistos = new Map();
  const chips = qa("#registroDias [data-registro-ir]").map(c => c.dataset.registroIr);
  const fechas = [...new Set(J(CONS).map(x => x.date).concat(J(HIST).map(x => x.date)))].sort().reverse();
  exigir("chips de días", JSON.stringify(chips) === JSON.stringify(fechas.slice(0, 14)), chips.join(","));
  for (const f of chips) {
    await tocar(q('#registroDias [data-registro-ir="' + f + '"]'));
    for (const r of filas()) { exigir("Quitar en cada fila", visible(r.quitar), r.id); vistos.set(r.id + "|" + r.tipo, (vistos.get(r.id + "|" + r.tipo) || []).concat(f)) }
  }
  for (const x of J(CONS)) exigir("Lo comí " + x.id, JSON.stringify(vistos.get(x.id + "|comi")) === JSON.stringify([x.date]), vistos.get(x.id + "|comi"));
  for (const x of J(HIST)) exigir("Lo cociné " + x.id, JSON.stringify(vistos.get(x.id + "|cocine")) === JSON.stringify([x.date]), vistos.get(x.id + "|cocine"));
  exigir("cantidad de filas", vistos.size === J(CONS).length + J(HIST).length, vistos.size);
  // ‹ retrocede un día y › no pasa de hoy.
  await tocar(q('#registroDias [data-registro-ir="2026-10-21"]')); await tocar(q('#registro [data-registro-dia="-1"]'));
  exigir("‹ un día", ev("registroFecha") === "2026-10-20" && filas().length === J(CONS).filter(x => x.date === "2026-10-20").length + J(HIST).filter(x => x.date === "2026-10-20").length);
  // Veces que cocinaste: los platos con contador, con cuántas veces tienen fecha.
  await tocar(q("#registroContadores summary"));
  const conContador = J(SAVED).filter(p => (p.cooked || 0) > 0);
  const contadores = qa("#registroContadoresLista [data-registro-contador]").filter(visible);
  exigir("contadores", contadores.length === conContador.length && conContador.every(p => { const f = contadores.find(c => c.dataset.registroContador === p.id), n = J(HIST).filter(h => h.sourceId === p.id).length; return f && f.innerText.includes(p.cooked + " ve") && f.innerText.includes("(" + n + " con fecha)") }), contadores.map(c => c.innerText).join(" | "));
  exigir("recorrer no escribe", todo() === antes1);
  // Quitar uno de cada tipo y deshacer deja todo como estaba.
  await tocar(q('#registroDias [data-registro-ir="2026-10-21"]'));
  const comi21 = filas().find(f => f.tipo === "comi"), cocine21 = filas().find(f => f.tipo === "cocine");
  await tocar(comi21.quitar);
  const sinComi = !JSON.parse(localStorage.getItem(CONS)).some(x => x.id === comi21.id) && !fila(comi21.id);
  const d1 = await deshacer();
  await tocar(fila(cocine21.id).quitar);
  const sinCocine = !JSON.parse(localStorage.getItem(HIST)).some(x => x.id === cocine21.id) && /La despensa no cambia/.test($("registroEstado").textContent);
  const d2 = await deshacer();
  exigir("quitar y deshacer", sinComi && sinCocine && d1 && d2 && todo() === antes1 && !!fila(comi21.id) && !!fila(cocine21.id));
  exigir("sin confirmaciones", !pidioConfirmar);
  ok("C6-1 hay un solo lugar para ver y corregir lo registrado: el Registro muestra cada Lo comí y Lo cociné en su día, los contadores aparte, Quitar con Deshacer, y ninguna otra pantalla muestra registros", !faltan.length, faltan.join("; "));

  // C6-2 Las cuatro entradas llegan al Registro en 2 toques o menos
  const llega = [];
  await irA("mas"); toques = 0; await tocar(q("#sectionNav [data-section-tab=\"mas\"]")); await tocar(q("#sectionSettings [data-open-registro]"));
  llega.push(["Más", pantalla() === "registro" && toques <= 2]);
  await irA("hoy"); toques = 0; await tocar(q("#sectionNav [data-section-tab=\"hoy\"]")); await tocar($("todayRegistro"));
  llega.push(["Hoy", pantalla() === "registro" && toques <= 2 && ev("registroFecha") === hoyF() && ev("activeTab") === "hoy"]);
  await irA("semana"); toques = 0; await tocar(q("#plan [data-plan-menu]")); await tocar(q('.hoja [data-plan-herr="consumo"]')); await espera(80);
  llega.push(["Semana", pantalla() === "registro" && toques <= 2 && $("consumptionPanel").open && visible($("consumptionSave"))]);
  await irA("miscomidas"); await tocar(q('#savedList .comida-card[data-comida-id="plato_p3"]')); toques = 0; await tocar(q("#comidaRegistro [data-open-registro]"));
  llega.push(["comida plato_p3", pantalla() === "registro" && toques <= 1 && ev("registroFecha") === "2026-10-21"]);
  await irA("miscomidas"); await tocar(q('#savedList .comida-card[data-recipe-id="recipe_guiso001"]')); await tocar(q("#comidaRegistro [data-open-registro]"));
  llega.push(["receta guiso", pantalla() === "registro" && ev("registroFecha") === "2026-10-20"]);
  ok("C6-2 Más, Hoy, Semana ⋯ y el detalle de una comida llevan al Registro en 2 toques o menos (la comida, a su último día)", llega.every(x => x[1]) && todo() === antes1, llega.filter(x => !x[1]).map(x => x[0]).join(", "));

  // C6-3 Lo comí en Hoy: se ve en el Registro; Quitar (la clave queda vacía y se borra) y Deshacer la vuelven a crear igual
  cargar({ [SAVED]: JSON.stringify([plato("t1", "Pollo con arroz")]), miPlatoFacil_plan: "" });
  localStorage.setItem("miPlatoFacil_plan", planDe([[DIAS[(new Date().getDay() + 6) % 7], "almuerzo", "t1"]]));
  await abrir(); await irA("hoy");
  await tocar(q('#todayRows [data-today-slot="almuerzo"] [data-plan-eaten]'));
  const marca = /✓ Lo comí/.test(q('#todayRows [data-today-slot="almuerzo"]').textContent), conUno = localStorage.getItem(CONS), plan3 = localStorage.getItem("miPlatoFacil_plan");
  await tocar($("todayRegistro"));
  const r3 = filas().find(f => f.tipo === "comi");
  await tocar(r3.quitar);
  const borrada = localStorage.getItem(CONS) === null && !!doc().querySelector('#todayRows [data-today-slot="almuerzo"] [data-plan-eaten]');
  const d3 = await deshacer();
  ok("C6-3 Lo comí de Hoy aparece en el Registro; Quitar vuelve a 'Lo comí' en Hoy y Deshacer restituye la clave byte a byte", marca && !!r3 && /Pollo con arroz/.test(r3.texto) && borrada && d3 && localStorage.getItem(CONS) === conUno && /✓ Lo comí/.test(q('#todayRows [data-today-slot="almuerzo"]').textContent) && localStorage.getItem("miPlatoFacil_plan") === plan3 && !pidioConfirmar, JSON.stringify({ marca, r3: !!r3, borrada, d3, igual: localStorage.getItem(CONS) === conUno, conf: pidioConfirmar, texto: r3 && r3.texto }));

  // C6-4 Lo cociné de un plato: contador +1 y preparación de hoy; Deshacer; respaldo; Quitar no toca el contador; −1
  cargar({ [SAVED]: JSON.stringify([plato("t1", "Pollo con arroz", 0)]) });
  await abrir(); await irA("miscomidas");
  await tocar(q('#savedList .comida-card[data-comida-id="t1"]'));
  const antes4 = tres();
  await tocar(q('#comidaPlatoAcciones [data-cook-saved="t1"]'));
  const h4 = JSON.parse(localStorage.getItem(HIST) || "[]"), c4 = JSON.parse(localStorage.getItem(SAVED))[0].cooked;
  const anota = c4 === 1 && h4.length === 1 && h4[0].sourceId === "t1" && h4[0].date === hoyF() && w.validCookingHistoryRecord(h4[0]) && /Cocinaste/.test($("comidaEstado").textContent);
  const d4 = await deshacer("#comidaEstado");
  const deshecho4 = d4 && tres() === antes4 && localStorage.getItem(HIST) === null;
  await tocar(q('#comidaPlatoAcciones [data-cook-saved="t1"]'));
  const conHist = localStorage.getItem(HIST), snap4 = w.completeBackupSnapshot(w.localStorage);
  let err4 = null; try { w.Respaldo.validateCompleteBackup(snap4) } catch (e) { err4 = e.message }
  cargar({}); w.Respaldo.restoreCompleteBackup(JSON.parse(JSON.stringify(snap4)), w.localStorage);
  const restaurado = localStorage.getItem(HIST) === conHist;
  await abrir(); await irA("mas"); await tocar(q("#sectionSettings [data-open-registro]"));
  const r4 = filas().find(f => f.tipo === "cocine");
  await tocar(r4.quitar);
  const contadorQueda = JSON.parse(localStorage.getItem(SAVED))[0].cooked === 1 && JSON.parse(localStorage.getItem(HIST)).length === 0;
  await tocar(q("#registroContadores summary"));
  await tocar(q('[data-registro-restar="t1"]'));
  const bajo = JSON.parse(localStorage.getItem(SAVED))[0].cooked === 0 && !doc().querySelector('[data-registro-restar="t1"]');
  const d4b = await deshacer();
  const vuelve = d4b && JSON.parse(localStorage.getItem(SAVED))[0].cooked === 1 && !!doc().querySelector('[data-registro-restar="t1"]');
  ok("C6-4 Lo cociné de un plato suma el contador y anota la preparación de hoy (válida para el respaldo); Deshacer, Quitar sin tocar el contador y −1 con Deshacer", anota && deshecho4 && err4 === null && restaurado && !!r4 && contadorQueda && bajo && vuelve && !pidioConfirmar, JSON.stringify({ anota, deshecho4, err4, restaurado, contadorQueda, bajo, vuelve }));

  // C6-5 Lo cociné de una receta aparece en el día; quitarla en el Registro no toca la despensa
  const RID = "recipe_e6prue01";
  cargar({
    miPlatoFacil_recipeDetails_v1: JSON.stringify({ [RID]: { id: RID, title: "Guiso de prueba", sourceTitle: null, amountsTitle: "receta:" + RID, steps: ["Cocinar"], notes: "" } }),
    miPlatoFacil_recipeAmounts_v1: JSON.stringify({ ["receta:" + RID]: { yield: 1, rows: [{ name: "Lentejas", quantity: 300, unit: "g" }] } }),
    [STOCK]: JSON.stringify({ '["lentejas","g"]': { name: "Lentejas", quantity: 500, unit: "g" } })
  });
  await abrir(); await irA("miscomidas");
  await tocar(q('#savedList .comida-card[data-recipe-id="' + RID + '"]')); await tocar($("recipeReadCookNow"));
  const stock5 = localStorage.getItem(STOCK), moves5 = localStorage.getItem(MOVES);
  const descontado = JSON.parse(stock5)['["lentejas","g"]'].quantity === 200;
  await tocar(q("#comidaRegistro [data-open-registro]"));
  const r5 = filas().find(f => f.tipo === "cocine" && /Guiso de prueba/.test(f.texto));
  if (r5) await tocar(r5.quitar);
  ok("C6-5 Lo cociné de una receta aparece en el Registro; quitarlo no cambia la despensa ni los movimientos", descontado && !!r5 && localStorage.getItem(HIST) === "[]" && localStorage.getItem(STOCK) === stock5 && localStorage.getItem(MOVES) === moves5 && /La despensa no cambia/.test($("registroEstado").textContent));

  // C6-6 "+ Lo comí" y "+ Lo cociné" desde un día pasado; fecha futura; preparación repetida sin confirmación; › no pasa de hoy
  cargar({ [SAVED]: JSON.stringify([plato("t1", "Pollo con arroz", 0)]) });
  await abrir(); await irA("mas"); await tocar(q("#sectionSettings [data-open-registro]"));
  await tocar(q('#registro [data-registro-dia="-1"]'));
  const ayer = ev("registroFecha"), ayerL = w.typedAppDateLabel(ayer);
  await tocar(q('[data-registro-anotar="comi"]'));
  const fechaComi = $("consumptionDate").value === ayerL && $("consumptionPanel").open;
  $("consumptionMeal").value = "cena"; $("consumptionPlate").value = ""; $("consumptionText").value = "Empanadas";
  await tocar($("consumptionSave"));
  const comiAyer = JSON.parse(localStorage.getItem(CONS) || "[]").filter(x => x.date === ayer && x.title === "Empanadas").length === 1 && filas().some(f => /Empanadas/.test(f.texto)) && !!$("consumptionStatus").querySelector("[data-registro-deshacer]");
  const antesFut = localStorage.getItem(CONS);
  $("consumptionDate").value = "01/01/2099"; $("consumptionText").value = "Algo"; await tocar($("consumptionSave"));
  const futura = localStorage.getItem(CONS) === antesFut && /no futura/.test($("consumptionStatus").textContent);
  await tocar(q('[data-registro-anotar="cocine"]'));
  const fechaCocine = $("cookingHistoryDate").value === ayerL && $("cookingHistoryPanel").open;
  $("cookingHistoryPlate").value = "t1"; $("cookingHistoryMeal").value = "Cena";
  await tocar(q('#cookingHistoryForm [type="submit"]')); await tocar(q('#cookingHistoryForm [type="submit"]'));
  const dos = JSON.parse(localStorage.getItem(HIST) || "[]").filter(x => x.date === ayer).length === 2 && /Ya había una igual/.test($("cookingHistoryStatus").textContent);
  const d6 = await deshacer("#cookingHistoryStatus");
  const uno = d6 && JSON.parse(localStorage.getItem(HIST)).length === 1 && filas().filter(f => f.tipo === "cocine").length === 1;
  await tocar(q('#registro [data-registro-dia="1"]'));
  const enHoy = ev("registroFecha") === hoyF() && q('#registro [data-registro-dia="1"]').disabled;
  q('#registro [data-registro-dia="1"]').disabled = false; await tocar(q('#registro [data-registro-dia="1"]'));
  ok("C6-6 '+ Lo comí' y '+ Lo cociné' anotan en el día elegido con Deshacer; una fecha futura no se anota; › no pasa de hoy", fechaComi && comiAyer && futura && fechaCocine && dos && uno && enHoy && ev("registroFecha") === hoyF() && !pidioConfirmar, JSON.stringify({ fechaComi, comiAyer, futura, fechaCocine, dos, uno, enHoy }));

  // C6-7 Datos raros: lo que no se puede leer no se pisa ni se descarta
  const raro = { id: "raro", date: "no es fecha", meal: 3 };
  const hoy7 = new Date(); const f7 = hoy7.getFullYear() + "-" + String(hoy7.getMonth() + 1).padStart(2, "0") + "-" + String(hoy7.getDate()).padStart(2, "0");
  const XSS = '<img src=x onerror="window.__e6=1">';
  const hist7 = [raro, { id: "h_c", date: f7, meal: "Cena", title: "Cena " + XSS, lines: [], sourceId: "t1", status: "prepared" }, { id: "h_d", date: f7, meal: "Desayuno", title: "Tostadas", lines: [], sourceId: null, status: "prepared" }, { id: "h_a", date: f7, meal: "almuerzo", title: "Guiso", lines: [], sourceId: null, status: "prepared" }];
  cargar({ [SAVED]: JSON.stringify([plato("t1", "Pollo con arroz", 0)]), [HIST]: JSON.stringify(hist7), [CONS]: JSON.stringify([{ id: "c_m", date: f7, meal: "merienda", title: "Fruta", groups: [], sourceId: null, planned: false }]) });
  await abrir(); await irA("mas"); await tocar(q("#sectionSettings [data-open-registro]"));
  const orden = filas().map(f => f.id).join(",") === "h_d,h_a,c_m,h_c";
  const comoTexto = $("registroLista").textContent.includes("Cena " + XSS) && !doc().querySelector("#registroLista img") && !w.__e6;
  await tocar(fila("h_c").quitar);
  const crudo = JSON.parse(localStorage.getItem(HIST));
  const raroQueda = JSON.stringify(crudo[0]) === JSON.stringify(raro) && crudo.length === 3;
  await tocar(q('[data-registro-anotar="cocine"]')); $("cookingHistoryPlate").value = "t1"; await tocar(q('#cookingHistoryForm [type="submit"]'));
  const raroSigue = JSON.stringify(JSON.parse(localStorage.getItem(HIST))[0]) === JSON.stringify(raro) && JSON.parse(localStorage.getItem(HIST)).length === 4;
  // Historial que no es un arreglo: Lo cociné de un plato no escribe nada y avisa.
  localStorage.setItem(HIST, '{"no":"es un arreglo"}');
  const antesNoArr = tres();
  await irA("miscomidas"); await tocar(q('#savedList .comida-card[data-comida-id="t1"]')); await tocar(q('#comidaPlatoAcciones [data-cook-saved="t1"]'));
  const noEscribe = tres() === antesNoArr && /No se pudo leer/.test($("comidaEstado").textContent);
  // Lo comí guardado inválido: el Registro no lo muestra, Quitar no escribe y anotar no lo pisa.
  const consMalo = JSON.stringify([{ id: "x", date: "2026-13-40", meal: "cena", title: "x", groups: [], sourceId: null, planned: false }]);
  localStorage.setItem(CONS, consMalo); localStorage.setItem(HIST, "[]");
  await irA("mas"); await tocar(q("#sectionSettings [data-open-registro]"));
  const nadaComi = !filas().some(f => f.tipo === "comi");
  await tocar(q('[data-registro-anotar="comi"]')); $("consumptionText").value = "Algo"; $("consumptionDate").value = w.typedAppDateLabel(hoyF()); await tocar($("consumptionSave"));
  const noPisa = localStorage.getItem(CONS) === consMalo && /No se pudo leer/.test($("consumptionStatus").textContent);
  ok("C6-7 datos raros: orden por comida, títulos como texto; un registro inválido no se descarta al quitar ni al agregar; lo que no se puede leer no se pisa", orden && comoTexto && raroQueda && raroSigue && noEscribe && nadaComi && noPisa, JSON.stringify({ orden, comoTexto, raroQueda, raroSigue, noEscribe, nadaComi, noPisa }));

  // C6-8 Sin confirmaciones: los Quitar del Registro y de sus plegables ofrecen Deshacer
  localStorage.clear(); w.Respaldo.restoreCompleteBackup(JSON.parse(JSON.stringify(R)), w.localStorage);
  await abrir(); await irA("mas"); await tocar(q("#sectionSettings [data-open-registro]"));
  const antes8 = todo(), con = [];
  await tocar(q('#registroDias [data-registro-ir="2026-10-22"]'));
  await tocar(filas()[0].quitar); con.push(["fila", await deshacer()]);
  await tocar(q('[data-registro-anotar="comi"]'));
  ev('consumptionWeek = mondayOf("2026-10-22"); renderConsumption()'); await espera(60);
  await tocar(q("#consumptionView [data-consumption-remove]")); con.push(["Lo que comí", await deshacer("#consumptionStatus")]);
  await tocar(q('[data-registro-anotar="cocine"]'));
  await tocar(q("#cookingHistoryList [data-cooking-history-delete]")); con.push(["preparaciones", await deshacer("#cookingHistoryStatus")]);
  ok("C6-8 ningún Quitar pide confirmación: todos ofrecen Deshacer y dejan los datos como estaban", !pidioConfirmar && con.every(x => x[1]) && todo() === antes8, con.filter(x => !x[1]).map(x => x[0]).join(", "));

  // C6-9 Primera vez: el Registro abre en hoy, vacío, con los dos "+", y mirar no escribe nada
  localStorage.clear(); await abrir();
  const antes9 = todo();
  await irA("mas"); await tocar(q("#sectionSettings [data-open-registro]"));
  await tocar(q('#registro [data-registro-dia="-1"]')); await tocar(q('#registro [data-registro-dia="1"]'));
  await tocar(q("#registroContadores summary"));
  ok("C6-9 primera vez: el Registro abre en hoy con 'Nada registrado este día' y los dos '+', sin chips, y mirarlo no escribe nada", pantalla() === "registro" && ev("registroFecha") === hoyF() && /Nada registrado este día/.test($("registroLista").textContent) && visible(q('[data-registro-anotar="comi"]')) && visible(q('[data-registro-anotar="cocine"]')) && !qa("#registroDias [data-registro-ir]").length && todo() === antes9);

  // C6-10 Cada Deshacer es de su acción: un chip viejo que sigue a la vista no deshace una acción más nueva
  cargar({ [SAVED]: JSON.stringify([plato("t1", "Pollo con arroz", 0)]), miPlatoFacil_plan: planDe([[DIAS[(new Date().getDay() + 6) % 7], "almuerzo", "t1"]]) });
  await abrir(); await irA("hoy");
  await tocar(q('#todayRows [data-today-slot="almuerzo"] [data-plan-eaten]'));
  const chipHoy = q("#todayStatus [data-today-undo]");
  await irA("miscomidas"); await tocar(q('#savedList .comida-card[data-comida-id="t1"]'));
  await tocar(q('#comidaPlatoAcciones [data-cook-saved="t1"]'));
  const chipViejo = q("#comidaEstado [data-registro-deshacer]");
  await irA("mas"); await tocar(q("#sectionSettings [data-open-registro]"));
  await tocar(filas().find(f => f.tipo === "comi").quitar);
  const despuesQuitar = tres();
  chipViejo.click(); await espera(80);
  const viejoNoHace = tres() === despuesQuitar && /No se puede deshacer/.test(q("#comidaEstado").textContent);
  chipHoy.click(); await espera(80);
  const hoyNoHace = tres() === despuesQuitar && /ya no está/.test(q("#todayStatus").textContent);
  const nuevoHace = await deshacer();
  const vuelveComi = JSON.parse(localStorage.getItem(CONS) || "[]").length === 1 && JSON.parse(localStorage.getItem(SAVED))[0].cooked === 1;
  ok("C6-10 cada Deshacer es de su propia acción: un chip viejo (Lo cociné, o Lo comí de Hoy) no toca nada y avisa; el más nuevo deshace lo suyo", viejoNoHace && hoyNoHace && nuevoHace && vuelveComi && !pidioConfirmar, JSON.stringify({ viejoNoHace, hoyNoHace, nuevoHace, vuelveComi }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
