// R4-32: Etapa 32 de la Ronda 4 ("Respaldo sin olvidos, recordatorio y recorrido final"). Controles R4-32-aviso, R4-32-copia,
// R4-32-persistente, R4-32-ics, R4-32-enlace, R4-32-respaldo y R4-32-recorrido de docs/validacion/criterios.json.
(async () => {
  const T = []; const ok = (n, c, d) => T.push((c ? "PASA " : "FALLA ") + n + (d !== undefined && d !== "" ? " · " + d : ""));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  let marco = null, w = null;
  const abrir = async (extra, consulta) => {
    localStorage.clear();
    if (extra !== null) localStorage.setItem("miPlatoFacil_bienvenida_v1", '{"vista":true}');
    for (const [k, v] of Object.entries(extra || {})) localStorage.setItem(k, v);
    if (marco) marco.remove();
    marco = document.createElement("iframe"); marco.id = "marcoPrueba";
    marco.style.cssText = "position:fixed;left:0;top:0;width:390px;height:844px;border:0;opacity:0;pointer-events:none;z-index:-1";
    document.body.append(marco);
    await new Promise((res, rej) => { marco.onload = res; marco.onerror = rej; marco.src = "/index.html?" + (consulta ? consulta + "&" : "") + "marco=" + Date.now() });
    await espera(500);
    w = marco.contentWindow; w.confirm = () => true; w.prompt = () => "";
  };
  const ev = x => w.eval(x), doc = () => w.document;
  const tocar = async el => { el.click(); await espera(250) };
  const PRES = l => ({ miPlatoFacil_shoppingBudget_v1: JSON.stringify({ currency: "ARS", limit: l, period: "semana" }) });
  const dia = n => ev(`(() => { const d = new Date(); d.setDate(d.getDate() - ${n}); return Rutina.localTrainingDate(d) })()`);
  const aviso = o => JSON.stringify({ version: 1, ...o });
  const conComida = () => ev('IdeasHoja.guardarIdea(data.menuCatalog[3], "Día libre")');
  const lee = async (clave, setup) => { await abrir(setup ? setup(clave) : {}); conComida(); ev("renderToday()"); const t = doc().getElementById("todayRespaldo"); return { visible: !t.hidden, texto: t.textContent } };

  // R4-32-aviso
  await abrir({}); const hoy = ev("RespaldoAviso.hoy()"), d30 = dia(30), d29 = dia(29), d34 = dia(34), d7 = dia(7), d8 = dia(8);
  const A = async (o, conDatos = true) => { await abrir({ miPlatoFacil_respaldoAviso_v1: aviso(o) }); if (conDatos) conComida(); ev("renderToday()"); const t = doc().getElementById("todayRespaldo"); return { visible: !t.hidden, texto: t.textContent } };
  const a30 = await A({ primerUso: dia(90), ultimo: d30 }), a29 = await A({ primerUso: dia(90), ultimo: d29 }), sinDatos = await A({ primerUso: dia(90), ultimo: d30 }, false);
  const nunca = await A({ primerUso: d34 }), p0 = await A({ primerUso: dia(90), ultimo: d30, pospuesto: hoy }), p7 = await A({ primerUso: dia(90), ultimo: d30, pospuesto: d7 }), p8 = await A({ primerUso: dia(90), ultimo: d30, pospuesto: d8 });
  await abrir({ miPlatoFacil_respaldoAviso_v1: aviso({ primerUso: dia(90), ultimo: d30 }) }); conComida(); ev('openTab("mas"); go("backupScreen")'); await espera(250);
  const enMas = doc().getElementById("backupAviso"), enMasTexto = enMas.textContent, enMasVisible = !enMas.hidden;
  await tocar(enMas.querySelector("[data-respaldo-mas-tarde]"));
  const trasMasTarde = ev("RespaldoAviso.leer()");
  await abrir({}); conComida(); ev("renderToday()");
  const primer = ev("RespaldoAviso.leer()");
  ok("R4-32-aviso con el último respaldo hace 30 días aparece el aviso en Hoy y en Más; con 29, no; sin comidas ni plan, no; 'Más tarde' lo esconde 7 días y vuelve al octavo; sin respaldo se cuenta desde el primer uso",
    a30.visible && a30.texto.startsWith("Hace 30 días que no guardás una copia de tus datos.") && !a29.visible && !sinDatos.visible && nunca.visible && /Hace 34 días/.test(nunca.texto) && !p0.visible && !p7.visible && p8.visible
    && enMasVisible && /Hace 30 días/.test(enMasTexto) && trasMasTarde && trasMasTarde.pospuesto === hoy && !!primer && primer.primerUso === hoy && primer.ultimo === undefined,
    JSON.stringify({ a30, a29: a29.visible, sinDatos: sinDatos.visible, nunca: nunca.texto.slice(0, 30), p0: p0.visible, p7: p7.visible, p8: p8.visible, enMasVisible, trasMasTarde, primer }));

  // R4-32-copia: con navigator.share simulado, "Guardar copia" comparte un .json que el validador acepta y deja ultimo; sin canShare, descarga.
  await abrir({ miPlatoFacil_respaldoAviso_v1: aviso({ primerUso: dia(90), ultimo: d30 }) }); conComida();
  let compartido = null;
  Object.defineProperty(w.navigator, "canShare", { value: () => true, configurable: true });
  Object.defineProperty(w.navigator, "share", { value: o => { compartido = o; return Promise.resolve() }, configurable: true });
  w.RespaldoAviso.guardarCopia(); await espera(500);
  const f = compartido && compartido.files && compartido.files[0];
  let valido = false, tipo = f && f.type;
  if (f) { try { w.Respaldo.validateCompleteBackup(JSON.parse(await f.text())); valido = true } catch (e) { valido = false } }
  const ultimoShare = ev("RespaldoAviso.leer()").ultimo;
  await abrir({ miPlatoFacil_respaldoAviso_v1: aviso({ primerUso: dia(90), ultimo: d30 }) }); conComida();
  Object.defineProperty(w.navigator, "canShare", { value: undefined, configurable: true });
  let bajada = null; const proto = w.HTMLAnchorElement.prototype, click0 = proto.click; proto.click = function () { bajada = this.download };
  doc().getElementById("backupExport").click(); await espera(400); proto.click = click0;
  const ultimoDescarga = ev("RespaldoAviso.leer()").ultimo;
  ok("R4-32-copia 'Guardar copia' comparte un archivo .json que validateCompleteBackup() acepta (con navigator.share simulado) y deja ultimo con la fecha de hoy; sin navigator.canShare, descarga el .json y también deja la fecha",
    !!f && /\.json$/.test(f.name) && tipo === "application/json" && valido && ultimoShare === hoy && /^mi-plato-respaldo-.*\.json$/.test(bajada || "") && ultimoDescarga === hoy, JSON.stringify({ nombre: f && f.name, tipo, valido, ultimoShare, bajada, ultimoDescarga }));

  // R4-32-persistente
  await abrir({});
  let llamadas = 0;
  Object.defineProperty(w.navigator, "storage", { value: { persist: () => { llamadas++; return Promise.resolve(true) } }, configurable: true });
  ev('Bienvenida.terminarBienvenida("hoy")'); await espera(200); ev('Bienvenida.terminarBienvenida("hoy")'); ev('IdeasHoja.guardarIdea(data.menuCatalog[3], "Día libre")'); await espera(100);
  const una = llamadas;
  Object.defineProperty(w.navigator, "storage", { value: undefined, configurable: true });
  ev("RespaldoAviso._pedido = false"); let sinApi = true; try { ev("RespaldoAviso.pedirPersistencia()") } catch (e) { sinApi = false }
  ok("R4-32-persistente navigator.storage.persist() se llama una vez al terminar la bienvenida (y no de nuevo al guardar la primera comida en la misma sesión), y la app no falla si no existe", una === 1 && sinApi, JSON.stringify({ una, sinApi }));

  // R4-32-ics
  await abrir({ ...PRES(90000) }); ev('openTab("semana")'); await espera(200); ev('ArmameSemana.correr("todo")'); await espera(400);
  let blob = null, nombre = null;
  w.URL.createObjectURL = b => { blob = b; return "blob:prueba" };
  Object.defineProperty(w.navigator, "share", { value: undefined, configurable: true });
  const proto2 = w.HTMLAnchorElement.prototype, click1 = proto2.click; proto2.click = function () { nombre = this.download };
  await tocar(doc().querySelector("#plan [data-plan-menu]"));
  const bot = [...doc().querySelectorAll(".hoja button")].find(b => b.textContent === "Recordarme armar la semana");
  if (bot) await tocar(bot);
  const porDefecto = { dia: (doc().getElementById("recordatorioDia") || {}).value, hora: (doc().getElementById("recordatorioHora") || {}).value };
  doc().getElementById("recordatorioDia").value = "TU"; doc().getElementById("recordatorioHora").value = "19:30";
  await tocar(doc().querySelector(".hoja [data-recordatorio-agregar]")); proto2.click = click1;
  const ics = blob ? (await blob.text()).replace(/\r\n /g, "") : "";
  ok("R4-32-ics 'Recordarme armar la semana' (domingo 18:00 por defecto) baja armar-la-semana.ics con BEGIN:VCALENDAR, un VEVENT, RRULE:FREQ=WEEKLY con el día elegido, un VALARM y el enlace con ?ir=semana-proxima",
    porDefecto.dia === "SU" && porDefecto.hora === "18:00" && nombre === "armar-la-semana.ics" && /^BEGIN:VCALENDAR/.test(ics) && (ics.match(/BEGIN:VEVENT/g) || []).length === 1 && /RRULE:FREQ=WEEKLY;BYDAY=TU\r?\n/.test(ics) && /DTSTART:\d{8}T193000/.test(ics)
    && (ics.match(/BEGIN:VALARM/g) || []).length === 1 && /SUMMARY:Armar la semana · Mi Plato Fácil/.test(ics) && /\?ir=semana-proxima/.test(ics) && /END:VCALENDAR/.test(ics), JSON.stringify({ porDefecto, nombre, ics: ics.slice(0, 400) }));

  // R4-32-enlace
  await abrir({ ...PRES(90000) }, "ir=semana-proxima"); await espera(300);
  const conEnlace = { titulo: (doc().getElementById("planSemanaTitulo") || {}).textContent, prox: ev("Semana.viendoProxima()"), pantalla: (doc().querySelector(".screen.is-active") || {}).id };
  await abrir({ ...PRES(90000) });
  const sinEnlace = { prox: ev("Semana.viendoProxima()"), pantalla: (doc().querySelector(".screen.is-active") || {}).id };
  ok("R4-32-enlace abrir index.html?ir=semana-proxima muestra 'Semana que viene'; sin el parámetro, la app abre como siempre",
    /^Semana que viene/.test(conEnlace.titulo) && conEnlace.prox === true && conEnlace.pantalla === "plan" && sinEnlace.prox === false && sinEnlace.pantalla === "home", JSON.stringify({ conEnlace, sinEnlace }));

  // R4-32-respaldo: la clave nueva va y vuelve, un valor inválido se rechaza y el respaldo de ejemplo se restaura completo.
  await abrir({ miPlatoFacil_respaldoAviso_v1: aviso({ primerUso: d34, ultimo: d30, pospuesto: hoy }) }); conComida();
  const res = JSON.parse(ev(`JSON.stringify((() => { const snap = completeBackupSnapshot(localStorage), copia = JSON.parse(JSON.stringify(snap)); Respaldo.validateCompleteBackup(copia);
    const malo = JSON.parse(JSON.stringify(snap)); malo.data.miPlatoFacil_respaldoAviso_v1 = JSON.stringify({ version: 1, primerUso: "2026-99-99" }); let msg = null; try { Respaldo.validateCompleteBackup(malo) } catch (e) { msg = e.message }
    const ant = localStorage.getItem("miPlatoFacil_respaldoAviso_v1"); localStorage.clear(); Respaldo.restoreCompleteBackup(copia, localStorage);
    return { enSnap: snap.data.miPlatoFacil_respaldoAviso_v1 === ant, vuelta: localStorage.getItem("miPlatoFacil_respaldoAviso_v1") === ant, malo: msg, opcional: COMPLETE_BACKUP_OPTIONAL_KEYS.includes("miPlatoFacil_respaldoAviso_v1") && COMPLETE_BACKUP_KEYS.includes("miPlatoFacil_respaldoAviso_v1") } })())`));
  const viejo = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  await abrir({});
  const restaurado = ev(`(() => { try { Respaldo.restoreCompleteBackup(${JSON.stringify(viejo)}, localStorage); return true } catch (e) { return e.message } })()`);
  ok("R4-32-respaldo la clave nueva va y vuelve en el respaldo (opcional), una fecha imposible se rechaza y el respaldo de ejemplo, que no la trae, se restaura igual", res.enSnap && res.vuelta && !!res.malo && res.opcional && restaurado === true, JSON.stringify({ res, restaurado }));

  // R4-32-recorrido: bienvenida, semana armada, detalle con pasos, "Supermercado", 5 productos tachados, "Terminé de comprar", compartir la semana y guardar una copia.
  await abrir(null); await espera(300);
  const pantalla = () => (doc().querySelector(".screen.is-active") || {}).id, enBienvenida = pantalla() === "bienvenida";
  await tocar(doc().querySelector('#bienvenida [data-bienvenida-paso="1"] [data-bienvenida-siguiente]'));
  await tocar(doc().querySelector('#bienvenida [data-bienvenida-paso="2"] [data-bienvenida-siguiente]'));
  await tocar(doc().querySelector('#bienvenida [data-bienvenida-paso="3"] [data-bienvenida-siguiente]'));
  for (const i of [0, 1, 2]) await tocar(doc().querySelectorAll("#bienvenidaIdeas [data-bienvenida-idea]")[i]);
  await tocar(doc().querySelector("#bienvenida [data-bienvenida-armar]")); await espera(600);
  const semana = JSON.parse(ev(`JSON.stringify((() => { const plan = loadPlan(); let n = 0; for (const d of Object.values(plan)) for (const id of Object.values(d)) if (id) n++; return { n, pantalla: document.querySelector(".screen.is-active").id } })())`));
  // Detalle de una comida que viene de una idea: tiene cantidades y pasos.
  const detalle = JSON.parse(ev(`JSON.stringify((() => { const saved = MisPlatos.loadSaved(), it = saved.find(x => IdeasHoja.ideaDeComida(x)); return it ? { id: it.id } : null })())`));
  ev('openTab("miscomidas")'); await espera(200); ev(`Comidas.abrirComida("plato", ${JSON.stringify(detalle && detalle.id)})`); await espera(300);
  const pasosVisibles = doc().querySelectorAll("#comidaPasosLista li").length;
  // Cambiar "Verdulería" por "Supermercado": el total de la semana sube.
  const totalVerd = Math.round(ev("costoSemanaPlan().total"));
  ev('openTab("mas"); go("preferencias")'); await espera(250);
  const sel = doc().getElementById("dondeCompro"); sel.value = "super"; sel.dispatchEvent(new w.Event("change", { bubbles: true })); await espera(200);
  const totalSuper = Math.round(ev("costoSemanaPlan().total"));
  // Compras: tachar 5 productos y "Terminé de comprar".
  ev('openTab("compras")'); await espera(300);
  const pendientes = () => doc().querySelectorAll("#comprasList .compras-seccion .shop-item:not(.is-done)").length, antes = pendientes();
  for (let i = 0; i < 5; i++) await tocar(doc().querySelector("#comprasList .compras-seccion .shop-item:not(.is-done) label"));
  const tachados = antes - pendientes();
  await tocar(doc().getElementById("comprasBought"));
  const despues = pendientes();
  // Compartir la semana (texto) y guardar una copia.
  let compartida = null;
  Object.defineProperty(w.navigator, "canShare", { value: () => true, configurable: true });
  Object.defineProperty(w.navigator, "share", { value: o => { compartida = o; return Promise.resolve() }, configurable: true });
  ev('openTab("semana")'); await espera(200);
  w.Compartir.compartirSemana("texto"); await espera(300);
  const textoSemana = compartida && compartida.text; compartida = null;
  w.RespaldoAviso.guardarCopia(); await espera(500);
  const copia = compartida && compartida.files && compartida.files[0];
  ok("R4-32-recorrido el recorrido final pasa de punta a punta: bienvenida, semana armada (28 comidas), detalle de una idea con pasos, 'Supermercado' sube el total, 5 productos tachados, 'Terminé de comprar', compartir la semana y guardar una copia",
    enBienvenida && semana.n === 28 && !!detalle && pasosVisibles >= 3 && totalSuper > totalVerd && tachados === 5 && despues < antes - 4 && /Mi semana/.test(textoSemana || "") && !!copia && /\.json$/.test(copia.name) && ev("RespaldoAviso.leer().ultimo") === hoy,
    JSON.stringify({ enBienvenida, semana, pasosVisibles, totalVerd, totalSuper, tachados, antes, despues, titulo: (textoSemana || "").split("\n")[0], copia: copia && copia.name }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
