// R5 · Etapa 39 (Registro y "Lo comí"): ítems R-01 a R-10 de docs/ronda-5-lista.md.
// Datos inventados; precios congelados. Mira lo que se ve en pantalla y lo que queda guardado.
(async () => {
  const H = R5H(), { ok, espera, tocar } = H;
  const ev = x => H.ev(x), doc = () => H.doc(), q = s => { const e = doc().querySelector(s); if (!e) throw new Error("no está: " + s); return e };
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  const abrirRegistro = async (fecha) => { ev(`openTab("mas"); abrirRegistro(${fecha ? `{ fecha: ${JSON.stringify(fecha)} }` : ""})`); await espera(400) };
  const textoPantallas = () => [...doc().querySelectorAll(".screen")].map(s => s.textContent).join(" ");
  const sinDespl = el => el.querySelectorAll("details,summary").length === 0;
  const lunes = () => ev("mondayOf(Rutina.localTrainingDate(new Date()))");
  const suma = (a, n) => ev(`(() => { const d = new Date(${JSON.stringify(a)} + "T12:00:00"); d.setDate(d.getDate() + ${n}); return Rutina.localTrainingDate(d) })()`);
  const CONS = "miPlatoFacil_consumption_v1";

  // ---- R5-R-01, R-02, R-03, R-04, R-05, R-06 con el respaldo de ejemplo (tiene registros "Lo comí" y de cocinado) ----
  await H.abrir({ ...R.data, ...H.MARCA });
  const viejos = JSON.parse(localStorage.getItem("miPlatoFacil_cookingHistory_v1") || "[]");
  const viejo = viejos[0];
  await abrirRegistro(viejo.date);
  const filaVieja = [...doc().querySelectorAll("#registroLista .registro-fila")].map(f => f.textContent).find(t => t.includes(viejo.title)) || "";
  // Comida: botón y aviso
  ev('openTab("miscomidas")'); await espera(250);
  const idPlato = ev("MisPlatos.loadSaved().find(x => x.type === 'plato').id");
  ev(`Comidas.mostrarDetallePlato(${JSON.stringify(idPlato)})`); await espera(250);
  const botonesComida = H.botones(/Lo (comí|cociné)/, doc().getElementById("comida")).map(b => b.textContent.trim());
  await tocar(H.boton(/Lo comí/, doc().getElementById("comida")), 300);
  const aviso = doc().getElementById("comidaEstado").textContent;
  ok("R5-R-01 en toda la app 'Lo cociné' pasa a 'Lo comí' (botones, avisos y textos) y los registros viejos de cocinado se ven como 'Lo comí'",
    !/Lo cociné|cocinaste|Cocinaste|Cocinado/.test(textoPantallas()) && botonesComida.length >= 1 && botonesComida.every(t => /Lo comí/.test(t)) && /Comiste este plato/.test(aviso) && /^🍽️ Lo comí · /.test(filaVieja), JSON.stringify({ botonesComida, aviso, filaVieja, resto: (textoPantallas().match(/.{0,40}(Lo cociné|cocinaste|Cocinaste|Cocinado).{0,40}/g) || []) }));

  await abrirRegistro();
  const reg = doc().getElementById("registro");
  ok("R5-R-02 en Registro no están los botones '+ Lo comí' ni '+ Lo cociné'", !H.boton(/\+ Lo (comí|cociné)/, reg) && !reg.querySelector("[data-registro-anotar]"), JSON.stringify(H.botones(/./, reg).map(b => b.textContent.trim()).slice(0, 12)));

  const panel = doc().getElementById("consumptionPanel"), contadores = doc().getElementById("registroContadores");
  // Un plato con contador viejo y registros nuevos: la suma se ve.
  const conCont = ev("MisPlatos.loadSaved().filter(p => (p.cooked || 0) > 0).length");
  const filasCont = [...doc().querySelectorAll("#registroContadoresLista .registro-fila")];
  const sumaOk = ev(`(() => { const c = loadConsumption(); return [...document.querySelectorAll("#registroContadoresLista .registro-fila")].every(f => { const p = MisPlatos.loadSaved().find(x => x.id === f.dataset.registroContador); return p && Number(f.dataset.veces) === (p.cooked || 0) + c.filter(x => x.sourceId === p.id).length }) })()`);
  ok("R5-R-03 'Anotar otra comida y ver la semana' y 'Veces que comiste cada comida' se ven directo, sin desplegables; los contadores suman lo viejo (contador y cocinado) y los 'Lo comí' con fecha",
    sinDespl(panel) && sinDespl(contadores) && H.visible(doc().getElementById("consumptionPlate")) && H.visible(doc().getElementById("consumptionView")) && H.visible(doc().getElementById("registroContadoresLista")) && /Veces que comiste cada comida/.test(contadores.textContent) && !/cocinaste/i.test(contadores.textContent)
    && /Anotar otra comida y ver la semana/.test(panel.textContent) && filasCont.length > 0 && filasCont.length >= conCont && sumaOk, JSON.stringify({ filas: filasCont.length, conCont, sumaOk }));

  ok("R5-R-04 no está 'Todas las preparaciones' ni su formulario; lo guardado sigue en el dispositivo y entra al respaldo",
    !/Todas las preparaciones/.test(textoPantallas()) && !doc().getElementById("cookingHistoryPanel") && !doc().getElementById("cookingHistoryForm") && viejos.every(v => JSON.parse(localStorage.getItem("miPlatoFacil_cookingHistory_v1")).some(x => x.id === v.id))
    && "miPlatoFacil_cookingHistory_v1" in ev("completeBackupSnapshot(localStorage).data"), JSON.stringify({ t: /Todas las preparaciones/.test(textoPantallas()), p: !!doc().getElementById("cookingHistoryPanel"), n: localStorage.getItem("miPlatoFacil_cookingHistory_v1") && JSON.parse(localStorage.getItem("miPlatoFacil_cookingHistory_v1")).length, v: viejos.length }));

  // R-05: Quitar y Registrar sin Deshacer
  await abrirRegistro(viejo.date);
  const hayFila = !!doc().querySelector("#registroLista [data-registro-quitar]");
  if (hayFila) await tocar(q("#registroLista [data-registro-quitar]"), 300);
  const estado = doc().getElementById("registroEstado").textContent;
  doc().getElementById("consumptionText").value = "Prueba de Registro"; await tocar(doc().getElementById("consumptionSave"), 300);
  ok("R5-R-05 en Registro no hay botón Deshacer: ni al quitar un registro ni al registrar una comida",
    hayFila && /Quitaste/.test(estado) && !H.boton(/Deshacer/, doc().getElementById("registro")) && !doc().querySelector("#registro [data-registro-deshacer]") && /Registrado/.test(doc().getElementById("consumptionStatus").textContent), JSON.stringify({ estado }));

  // R-06: pasar de una semana a otra
  const et0 = doc().getElementById("consumptionWeekLabel").textContent;
  await tocar(q('#consumptionPanel [data-consumption-week="-7"]'));
  const et1 = doc().getElementById("consumptionWeekLabel").textContent;
  await tocar(q('#consumptionPanel [data-consumption-week="7"]'));
  const et2 = doc().getElementById("consumptionWeekLabel").textContent;
  ok("R5-R-06 se mantiene pasar de una semana a otra con ‹ ›: la semana cambia al ir hacia atrás y vuelve al ir hacia adelante", !!et0 && et1 !== et0 && et2 === et0 && /^Semana del /.test(et1), JSON.stringify({ et0, et1, et2 }));

  // ---- R5-R-07, R-08 y R-10: gráficos de la semana ----
  const L = (await (async () => { await H.abrir({ ...H.MARCA }); return lunes() })());
  const reg3 = [
    { id: "r1", date: L, meal: "almuerzo", title: "Milanesa con ensalada", groups: ["verduras", "legumbres"], sourceId: null, planned: true },
    { id: "r2", date: L, meal: "cena", title: "Pescado con puré", groups: ["pescado", "verduras"], sourceId: null, planned: false },
    { id: "r3", date: L, meal: "merienda", title: "Fruta", groups: ["fruta"], sourceId: null, planned: false },
  ];
  await H.abrir({ ...H.MARCA, [CONS]: JSON.stringify(reg3) });
  await abrirRegistro();
  const filasG = id => [...doc().querySelectorAll(`#${id} .grafico__fila`)].map(f => ({ rotulo: f.querySelector(".grafico__rotulo").textContent, valor: f.dataset.valor, texto: f.querySelector(".grafico__valor").textContent, ancho: f.querySelector(".grafico__relleno").style.width }));
  const gA = filasG("graficoSemanaComidas"), gB = filasG("graficoSemanaGrupos");
  ok("R5-R-07 gráfico de barras de la semana: comidas registradas (3), del plan (1) y fuera del plan (2), cada barra con su número",
    JSON.stringify(gA.map(f => [f.rotulo, f.texto])) === JSON.stringify([["Registradas", "3"], ["Del plan", "1"], ["Fuera del plan", "2"]]) && gA.every(f => f.ancho !== "" ) && gA[0].ancho === "100%", JSON.stringify(gA));
  ok("R5-R-08 gráfico de barras de la semana: con verduras (2), con legumbres (1), con pescado (1) y con fruta (1)",
    JSON.stringify(gB.map(f => [f.rotulo, f.valor])) === JSON.stringify([["Con verduras", "2"], ["Con legumbres", "1"], ["Con pescado", "1"], ["Con fruta", "1"]]), JSON.stringify(gB));
  // Sin registros: el gráfico lo dice
  await H.abrir({ ...H.MARCA }); await abrirRegistro();
  const vacio = doc().querySelector("#graficoSemanaGrupos .grafico__vacio");
  ok("R5-R-08 sin registros en la semana, el gráfico dice 'Sin registros esta semana'", !!vacio && /^Sin registros esta semana$/.test(vacio.textContent) && H.visible(vacio), vacio && vacio.textContent);

  // R-10: sin librerías, se leen en claro y en oscuro
  const luz = c => { const m = c.match(/[\d.]+/g).map(Number), f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]) };
  const ratio = (a, b) => { const x = luz(a), y = luz(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) };
  const medirTema = async tema => {
    await H.abrir({ ...H.MARCA, [CONS]: JSON.stringify(reg3), miPlatoFacil_theme: tema === "oscuro" ? "dark" : "light" }); await abrirRegistro();
    const cs = s => getComputedStyle(doc().querySelector(s)), pista = cs("#graficoSemanaComidas .grafico__barra").backgroundColor, relleno = cs("#graficoSemanaComidas .grafico__relleno").backgroundColor, num = cs("#graficoSemanaComidas .grafico__valor").color, fondo = cs("#registro").backgroundColor;
    return { tema: doc().documentElement.getAttribute("data-theme"), barra: Math.round(ratio(relleno, pista) * 10) / 10, numero: Math.round(ratio(num, pista.startsWith("rgba(0, 0, 0, 0)") ? fondo : fondo) * 10) / 10, hayCanvas: doc().querySelectorAll("#registro canvas, #registro svg, #registro img").length, scripts: doc().querySelectorAll("script[src]").length };
  };
  const claro = await medirTema("claro"), oscuro = await medirTema("oscuro");
  ok("R5-R-10 los gráficos se dibujan sin librerías (barras de HTML, sin canvas ni imágenes ni scripts externos), se leen en claro y en oscuro (la barra se distingue de su pista) y cada barra dice su número",
    claro.hayCanvas === 0 && claro.scripts === 0 && claro.barra >= 1.5 && oscuro.barra >= 1.5 && oscuro.tema === "dark" && gA.every(f => /^\d+$/.test(f.texto)), JSON.stringify({ claro, oscuro }));

  // ---- R5-R-09: presupuesto contra gasto real de las últimas 4 semanas ----
  const W0 = L, W1 = suma(L, -7), W2 = suma(L, -14), W3 = suma(L, -21);
  const compra = (id, fecha, total) => ({ id, date: fecha, store: "Súper", currency: "ARS", total, items: [] });
  const PRES = { currency: "ARS", limit: 50000, period: "semana" };
  const datos = { ...H.MARCA, miPlatoFacil_shoppingBudget_v1: JSON.stringify(PRES), miPlatoFacil_purchases_v1: JSON.stringify([compra("c1", suma(W3, 1), 30000), compra("c2", suma(W1, 2), 60000), compra("c3", suma(W1, 3), 5000), compra("c4", W0, 45000)]) };
  await H.abrir(datos); await abrirRegistro();
  const gG = filasG("graficoGasto");
  const gastos = gG.filter(f => /Gasto/.test(f.rotulo)).map(f => Number(f.valor)), presup = gG.filter(f => /Presupuesto/.test(f.rotulo)).map(f => Number(f.valor));
  const sobre = [...doc().querySelectorAll("#graficoGasto .grafico__relleno--fuera")].length;
  // corrección de la semana vista (W0)
  doc().getElementById("gastoSemanaMonto").value = "12345"; await tocar(q("[data-gasto-guardar]"), 300);
  const guardado = JSON.parse(localStorage.getItem("miPlatoFacil_gastoSemanal_v1") || "null");
  const gG2 = filasG("graficoGasto"), ultimo = gG2.at(-1);
  const corregido = /✎/.test(ultimo.rotulo) && Number(ultimo.valor) === 12345;
  await tocar(q("[data-gasto-quitar]"), 300);
  const vuelto = localStorage.getItem("miPlatoFacil_gastoSemanal_v1") === null && Number(filasG("graficoGasto").at(-1).valor) === 45000;
  doc().getElementById("gastoSemanaMonto").value = "7000"; await tocar(q("[data-gasto-guardar]"), 300);
  const snap = ev("completeBackupSnapshot(localStorage)"), enRespaldo = "miPlatoFacil_gastoSemanal_v1" in snap.data;
  let acepta = false, rechaza = false;
  try { ev(`Respaldo.validateCompleteBackup(completeBackupSnapshot(localStorage)); true`); acepta = true } catch (e) { }
  try { ev(`(() => { const s = completeBackupSnapshot(localStorage); s.data["miPlatoFacil_gastoSemanal_v1"] = JSON.stringify({ "no-es-fecha": 5 }); Respaldo.validateCompleteBackup(s) })()`) } catch (e) { rechaza = true }
  ok("R5-R-09 gráfico de las últimas 4 semanas con presupuesto contra gasto real: el gasto sale de Compras realizadas, se corrige por semana (clave miPlatoFacil_gastoSemanal_v1), se puede volver al total de Compras, entra al respaldo como opcional y un valor inválido se rechaza",
    gG.length === 8 && JSON.stringify(gastos) === JSON.stringify([30000, 0, 65000, 45000]) && presup.every(v => v === 50000) && sobre === 1 && JSON.stringify(guardado) === JSON.stringify({ [W0]: 12345 }) && corregido && vuelto && enRespaldo && acepta && rechaza,
    JSON.stringify({ gastos, presup, sobre, guardado, corregido, vuelto, enRespaldo, acepta, rechaza }));

  return H.terminar();
})()
