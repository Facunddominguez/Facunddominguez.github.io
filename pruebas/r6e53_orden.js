// R6 · Etapa 53 (Orden y limpieza): ítems O-01 a O-04 de docs/ronda-6-lista.md. Fecha fija: martes 24/11/2026.
(async () => {
  const H = R6H(), { ok, espera } = H;
  const tocar = async (el, ms) => { if (!el) throw new Error("no hay elemento para tocar · tras " + H.T.length + " pruebas"); return H.tocar(el, ms) };
  const ev = x => H.ev(x), doc = () => H.doc();
  const $ = id => doc().getElementById(id);
  const qa = s => [...doc().querySelectorAll(s)];
  const norm = H.norm, J = H.J, visible = H.visible;
  const R0 = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  const normal = () => JSON.parse(JSON.stringify(R0)).data;

  // ---- O-01: fechas bien escritas en toda la app ----
  // Revisa el texto de cada nodo visible (con text-transform: capitalize aplicado, como lo ve quien mira la pantalla; el uppercase no cuenta).
  const revisarFechas = nombre => H.w().eval(`(() => {
    const MES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
    const cap = t => t.replace(/(^|[\\s·(\\-/])(\\S)/g, (m, a, b) => a + b.toUpperCase());
    const malos = [];
    const visible = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && !e.closest("[hidden]") && !e.closest("[aria-hidden=true]") };
    for (const raiz of document.querySelectorAll("section.screen.is-active, .hoja-fondo:not([hidden]), #todayPanel")) {
      const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        let t = n.textContent.replace(/\\s+/g, " ").trim();
        const el = n.parentElement;
        if (!t || !el || !visible(el)) continue;
        const st = getComputedStyle(el).textTransform;
        if (st === "uppercase") continue;
        if (st === "capitalize") t = cap(t);
        // Un mes con mayúscula en medio de un texto ("24 De Noviembre", "Noviembre De 2026"), o De/Del/Al con mayúscula después de otra palabra.
        const mes = MES.some(m => new RegExp("(\\\\d|\\\\bde|\\\\bDe) " + m + "\\\\b|^" + m + " [Dd]e \\\\d{4}").test(t));
        const pal = /[a-záéíóúñ0-9] (De|Del|Al)\\b/.test(t);
        if (mes || pal) malos.push(${JSON.stringify(nombre)} + ": " + t.slice(0, 70));
      }
    }
    return JSON.stringify(malos);
  })()`);
  await H.abrirEn("2026-11-24", normal());
  const pantallas = [["hoy", 'openTab("hoy")'], ["semana", 'openTab("semana")'], ["comidas", 'openTab("miscomidas")'], ["compras", 'openTab("compras")'], ["mas", 'openTab("mas")'], ["calendario de entrenamiento", 'openTab("mas"); go("trainingCalendar")'], ["registro", 'openTab("mas"); abrirRegistro()'], ["preferencias", 'openTab("mas"); go("preferencias")'], ["semanas anteriores", 'openTab("semana"); Semana.abrirSemanasAnteriores && Semana.abrirSemanasAnteriores()'], ["plan mensual", 'openTab("semana"); go("planHerramientas")']];
  const malos = [];
  for (const [n, c] of pantallas) { try { ev(c) } catch (e) { } await espera(350); malos.push(...JSON.parse(await revisarFechas(n))) }
  ok("R6-O-01 en el texto visible de Hoy, Semana, Comidas, Compras, Más, el calendario de entrenamiento, el Registro, Preferencias y el plan mensual, ningún mes ni 'de', 'del' o 'al' lleva mayúscula en medio de la fecha", malos.length === 0, JSON.stringify(malos.slice(0, 8)));
  ev('go("trainingCalendar")'); await espera(300);
  ok("R6-O-01 el calendario de entrenamiento dice 'noviembre de 2026' (mes en minúscula y 'de' en minúscula)", norm($("trainMonthTitle").textContent) === "noviembre de 2026" && getComputedStyleTransform($("trainMonthTitle")) !== "capitalize", norm($("trainMonthTitle").textContent));
  function getComputedStyleTransform(el) { return H.w().getComputedStyle(el).textTransform }
  ev('openTab("hoy")'); await espera(300);
  ok("R6-O-01 Hoy dice 'martes, 24 de noviembre' (con 'de' en minúscula; el encabezado va en mayúsculas por diseño)", /martes, 24 de noviembre/i.test(norm(qa("#todayPanel")[0] ? doc().querySelector("#home .screen__title, #home h2").textContent : "")) || /martes, 24 de noviembre/i.test(norm(doc().body.textContent)));

  // ---- O-02: ninguna comida dos veces en el selector ----
  const guardadas = Array.from({ length: 7 }, (_, i) => ({ id: "rp_ord" + i, savedAt: "2026-10-2" + i + "T10:00:00.000Z", type: "plato", title: "Plato de prueba " + i, lines: [], sig: "ord" + i, text: "Plato de prueba " + i, cooked: 0, state: { type: "plato", day: "Día libre", verduras: [{ name: "Zanahoria", portion: "1 unidad" }], almidones: [{ name: "Arroz", portion: "1/4 del plato" }], proteinas: [{ name: "Pollo", portion: "1/4 del plato" }] }, fav: i === 0 }));
  await H.abrirEn("2026-11-24", { ...H.MARCA, miPlatoFacil_saved: JSON.stringify(guardadas) });
  ev('openTab("semana"); Semana.elegirDiaPlan("miercoles"); renderPlan(); abrirSelector("miercoles", "almuerzo")'); await espera(500);
  const secciones = qa(".hoja [data-selector-seccion]").map(s => ({ clave: s.dataset.selectorSeccion, nombres: [...s.querySelectorAll(".selector-item__nombre")].map(x => norm(x.textContent).replace(/^[⭐📖💡\s]+/, "").replace(/ ⭐$/, "")) }));
  const todos = secciones.filter(s => ["recientes", "mias", "recetas"].includes(s.clave)).flatMap(s => s.nombres), repetidos = todos.filter((n, i) => todos.indexOf(n) !== i);
  ok("R6-O-02 al elegir una comida, ninguna aparece dos veces: Recientes va primero (4) y Mis comidas muestra el resto (3)", secciones[0].clave === "recientes" && secciones[0].nombres.length === 4 && secciones.find(s => s.clave === "mias").nombres.length === 3 && repetidos.length === 0 && todos.length === 7, JSON.stringify(secciones));
  await H.cerrarHoja();
  ev('abrirSelector("miercoles", "almuerzo")'); await espera(300);
  ev('(() => { const i = document.querySelector(".hoja .selector-buscar input, .hoja input[type=search], .hoja input[type=text]"); if (i) { i.value = "Plato de prueba"; i.dispatchEvent(new Event("input", { bubbles: true })) } })()'); await espera(300);
  const conBusqueda = qa(".hoja .selector-item__nombre").map(x => norm(x.textContent));
  ok("R6-O-02 con una búsqueda tampoco se repite ninguna (Recientes se esconde y salen las 7 una sola vez)", conBusqueda.length === 7 && new Set(conBusqueda).size === 7, JSON.stringify(conBusqueda));
  await H.cerrarHoja();
  await H.abrirEn("2026-11-24", { ...H.MARCA, miPlatoFacil_saved: JSON.stringify(guardadas.slice(0, 3)) });
  ev('openTab("semana"); abrirSelector("miercoles", "almuerzo")'); await espera(400);
  const pocas = qa(".hoja [data-selector-seccion]").map(s => s.dataset.selectorSeccion);
  ok("R6-O-02 con 4 comidas o menos no hay Recientes y Mis comidas las muestra a todas (3)", !pocas.includes("recientes") && qa(".hoja [data-selector-seccion=mias] .selector-item").length === 3);
  await H.cerrarHoja();

  // ---- O-03 y O-04: una sola acción principal por pestaña y cuántos botones hay ----
  const medir = tab => JSON.parse(H.w().eval(`(() => { const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && !e.closest("[hidden]") }; const sc = document.querySelector("section.screen.is-active"); const bs = [...sc.querySelectorAll("button, [role=button]")].filter(vis); const pr = bs.filter(b => b.classList.contains("button--primary") || b.classList.contains("tool-button--primary")); return JSON.stringify({ botones: bs.length, principales: pr.map(b => (b.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40)), alto: pr.map(b => Math.round(b.getBoundingClientRect().height)) }) })()`));
  const TABS = [["hoy", "hoy"], ["semana", "semana"], ["comidas", "miscomidas"], ["compras", "compras"], ["mas", "mas"]];
  const ANTES = { normal: { hoy: 17, semana: 19, comidas: 26, compras: 54, mas: 8 }, vacio: { hoy: 11, semana: 14, comidas: 13, compras: 11, mas: 8 } };
  const PRINCIPAL = { normal: { hoy: /^Lo comí$/, semana: /^Repetir el plan$/, comidas: /^\+ Nueva$/, compras: /^Terminé de comprar$/, mas: /Registro/ }, vacio: { hoy: /^Elegir$/, semana: /^Armame la semana$/, comidas: /^\+ Nueva$/, compras: /^Armar mi semana$/, mas: /Registro/ } };
  for (const [estado, datos] of [["normal", normal()], ["vacio", {}]]) {
    await H.abrirEn("2026-11-24", datos);
    const r = {};
    for (const [n, tab] of TABS) { ev(`openTab("${tab}")`); await espera(400); r[n] = medir(tab) }
    ok(`R6-O-03 (${estado}) cada pestaña muestra una sola acción principal (botón verde lleno): ` + TABS.map(([n]) => n + " → " + r[n].principales.join(" | ")).join(" · "), TABS.every(([n]) => r[n].principales.length === 1 && PRINCIPAL[estado][n].test(r[n].principales[0])), JSON.stringify(Object.fromEntries(TABS.map(([n]) => [n, r[n].principales]))));
    ok(`R6-O-03 (${estado}) la acción principal mide al menos 44 px de alto`, TABS.every(([n]) => r[n].alto.every(h => h >= 43.5)), JSON.stringify(Object.fromEntries(TABS.map(([n]) => [n, r[n].alto]))));
    ok(`R6-O-04 (${estado}) no se eliminó ninguna función: la cantidad de botones de cada pestaña es la de antes (` + TABS.map(([n]) => n + " " + ANTES[estado][n]).join(", ") + ")", TABS.every(([n]) => r[n].botones === ANTES[estado][n]), JSON.stringify(Object.fromEntries(TABS.map(([n]) => [n, r[n].botones]))));
  }
  // Semana con la pregunta de la semana nueva: solo "Repetir el plan" es principal
  await H.abrirEn("2026-11-30", normal());
  ev('openTab("semana")'); await espera(500);
  const nueva = medir("semana");
  ok("R6-O-03 Semana con la pregunta '¿Repetís el plan o empezás de cero?' tiene una sola principal: Repetir el plan (Rehacer/Armame pasa a secundaria)", /Repetir el plan/.test(JSON.stringify(nueva.principales)) && nueva.principales.length === 1, JSON.stringify(nueva.principales));
  // Hoy con la primera comida ya anotada: la principal pasa a la siguiente
  await H.abrirEn("2026-11-24", normal());
  ev('openTab("hoy")'); await espera(400);
  const antesP = qa("#todayRows .button--primary").map(b => norm(b.closest(".today-row").dataset.todaySlot));
  await tocar(doc().querySelector("[data-today-eaten]"), 500);
  const despuesP = qa("#todayRows .button--primary").map(b => norm(b.closest(".today-row").dataset.todaySlot));
  ok("R6-O-03 en Hoy la principal es 'Lo comí' de la primera comida por anotar y, al anotarla, pasa a la siguiente", antesP.length === 1 && despuesP.length === 1 && antesP[0] !== despuesP[0], JSON.stringify([antesP, despuesP]));
  return H.terminar();
})()
