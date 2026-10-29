// Navegación con pestañas (v14.9.91): Hoy, Semana, Compras, Mis comidas y Más. Solo datos inventados.
(async () => {
  const R = window.R2, { wait, results, reset, setSaved, setPlan, tradPlate } = R; const T = results();
  const $ = id => document.getElementById(id);
  const scr = () => document.querySelector(".screen.is-active").id;
  const tab = name => document.querySelector('#sectionNav [data-section-tab="' + name + '"]');
  const clickTab = async name => { tab(name).click(); await wait(60) };
  const shown = e => !!e && e.getClientRects().length > 0;
  const appData = () => JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith("miPlatoFacil_")).sort().map(k => [k, localStorage.getItem(k)]));
  reset(); await clickTab("hoy");
  // N1 Cinco pestañas en orden
  const names = [...document.querySelectorAll("#sectionNav [data-section-tab]")].map(b => b.querySelector("span:last-child").textContent);
  T.ok("N1 la barra tiene 5 pestañas: Hoy, Semana, Compras, Mis comidas y Más", names.join(",") === "Hoy,Semana,Compras,Mis comidas,Más", names.join(","));
  // N2 Cada pestaña abre su pantalla
  const roots = {};
  for (const name of ["semana", "compras", "miscomidas", "mas", "hoy"]) { await clickTab(name); roots[name] = scr() + (scr() === "home" ? ":" + $("home").dataset.homeTab : "") }
  T.ok("N2 cada pestaña abre su pantalla", roots.semana === "plan" && roots.compras === "compras" && roots.miscomidas === "misplatos" && roots.mas === "home:mas" && roots.hoy === "home:hoy", JSON.stringify(roots));
  // N3 La pestaña activa está marcada
  await clickTab("compras");
  T.ok("N3 la pestaña activa está marcada", tab("compras").getAttribute("aria-current") === "page" && document.querySelectorAll('#sectionNav [aria-current="page"]').length === 1);
  // N4 Botón de arriba: oculto en el inicio de la pestaña; más adentro vuelve a ese inicio
  const topHiddenAtRoot = !$("homeTop").classList.contains("is-visible");
  go("ingredientes"); await wait(40);
  const topLabel = $("homeTop").classList.contains("is-visible") ? $("homeTop").textContent : "(oculto)";
  $("homeTop").click(); await wait(60);
  T.ok("N4 el botón de arriba vuelve al inicio de la pestaña y no aparece si ya estás ahí", topHiddenAtRoot && topLabel === "← Compras" && scr() === "compras" && !$("homeTop").classList.contains("is-visible"), topLabel);
  // N5 Tocar la pestaña activa vuelve a su inicio
  go("trainingCalendar"); await wait(30); await clickTab("compras");
  T.ok("N5 tocar la pestaña activa vuelve a su inicio", scr() === "compras");
  // N6 Cada pestaña recuerda su recorrido (un plato a medio armar)
  await clickTab("hoy");
  document.querySelector('#home [data-start="plato"]').click(); await wait(80);
  document.querySelector('[data-day="Día de entrenamiento"]').click(); await wait(80);
  document.querySelector('#plate_static [data-go="lunch_veg"]').click(); await wait(80);
  const before = scr();
  await clickTab("semana"); const inSemana = scr();
  await clickTab("hoy");
  T.ok("N6 cada pestaña recuerda su recorrido", before === "lunch_veg" && inSemana === "plan" && scr() === "lunch_veg", before + " → " + inSemana + " → " + scr());
  // N7 "Armar otro plato" vuelve a Hoy
  await clickTab("semana");
  document.querySelector("[data-restart]").click(); await wait(60);
  T.ok("N7 'Armar otro plato' vuelve a Hoy", scr() === "home" && $("home").dataset.homeTab === "hoy" && tab("hoy").getAttribute("aria-current") === "page");
  // N8 Hoy muestra las comidas del día según el plan
  reset();
  const day = todayPlanDay();
  setSaved([tradPlate("t1", ["Papa"], ["Tomate"], ["Merluza"])]);
  setPlan([[day, "almuerzo", "t1"]]);
  await clickTab("semana"); await clickTab("hoy");
  const rows = [...document.querySelectorAll("#todayRows .today-row")];
  const lunch = rows.find(r => r.dataset.todaySlot === "almuerzo");
  T.ok("N8 Hoy muestra las 4 comidas del día en orden, con lo planificado", rows.map(r => r.dataset.todaySlot).join(",") === "desayuno,almuerzo,merienda,cena" && lunch.querySelector(".today-row__plate").textContent === mealName(loadSaved()[0]) && lunch.querySelector("button").textContent === "Lo comí" && rows.filter(r => r.querySelector(".today-row__plate.is-empty")).length === 3 && $("home").querySelector(".screen__title").textContent.startsWith("Hoy · "), rows.map(r => r.textContent).join(" | "));
  // N9 "Lo comí" registra la comida en un toque y no cambia el plan
  const planBefore = localStorage.getItem("miPlatoFacil_plan");
  lunch.querySelector("button").click(); await wait(60);
  const recs = loadConsumption(), lunchAfter = document.querySelector('#todayRows [data-today-slot="almuerzo"]');
  T.ok("N9 'Lo comí' en Hoy registra la comida (del plan, hoy) sin cambiar el plan", recs.length === 1 && recs[0].meal === "almuerzo" && recs[0].planned === true && recs[0].date === localTrainingDate(new Date()) && recs[0].sourceId === "t1" && localStorage.getItem("miPlatoFacil_plan") === planBefore && /✓ Comido/.test(lunchAfter.textContent) && /Registrado/.test($("todayStatus").textContent), $("todayStatus").textContent);
  // N10 "Elegir" en una comida sin plan abre el Selector de esa comida sin salir de Hoy (v15.2; antes abría la Semana)
  document.querySelector('#todayRows [data-today-slot="cena"] button').click(); await wait(150);
  T.ok("N10 'Elegir' en una comida sin plan abre el Selector sin salir de Hoy", scr() === "home" && tab("hoy").getAttribute("aria-current") === "page" && hoja.abierta() && /^Elegir cena del /.test(document.getElementById("hojaTitulo").textContent) && !!hoja.elemento.querySelector("[data-selector-seccion=\"mias\"]"), document.getElementById("hojaTitulo").textContent);
  hoja.cerrar();
  // N11 Más reúne ideas, entrenamiento y ajustes
  await clickTab("mas");
  const masCards = [...document.querySelectorAll("#home .home-group--find button, #sectionSettings button")].filter(shown).map(b => b.querySelector(".tool-button__label").textContent);
  T.ok("N11 Más reúne ideas, entrenamiento y ajustes (Sugerir al azar se integró en Sugerime algo, v15.2)", ["Ideas", "Con lo que tengo", "Días de entrenamiento", "Respaldo y restauración"].every(x => masCards.includes(x)) && ![...document.querySelectorAll("#home .tool-button")].filter(shown).some(b => /Plato del día|Sugerir al azar/.test(b.textContent)) && masCards.some(x => /^Tema:/.test(x)) && masCards.some(x => /^Modo simple:/.test(x)) && !shown($("todayPanel")), masCards.join(" | "));
  // N12 Desde Más se abre "Con lo que tengo" y Más sigue marcada
  document.querySelector("#home [data-open-pantry]").click(); await wait(60);
  T.ok("N12 desde Más se abre Con lo que tengo y la pestaña Más sigue marcada", scr() === "ingredientes" && tab("mas").getAttribute("aria-current") === "page" && $("homeTop").textContent === "← Más");
  // N13 Hoy no muestra lo de Más
  await clickTab("hoy");
  T.ok("N13 Hoy muestra el día y los atajos para armar, sin ideas ni ajustes", shown($("todayPanel")) && shown(document.querySelector('#home [data-start="plato"]')) && !shown($("sectionSettings")) && !shown(document.querySelector("#home .home-group--find")));
  // N14 En Compras, "Ver el plan de la semana" abre la pestaña Semana
  await clickTab("compras"); document.querySelector("[data-back-plan]").click(); await wait(60);
  T.ok("N14 en Compras, 'Ver el plan de la semana' abre la pestaña Semana", scr() === "plan" && tab("semana").getAttribute("aria-current") === "page");
  // N15 Moverse entre pestañas no cambia ningún dato
  const snap = appData();
  for (const n of ["hoy", "semana", "compras", "miscomidas", "mas", "hoy"]) await clickTab(n);
  T.ok("N15 moverse entre pestañas no cambia ningún dato", appData() === snap);
  // N16 Más → Asistente de IA abre su pantalla propia (desde la v15 ya no está dentro de Respaldo), sin barra de pasos
  await clickTab("mas");
  $("aiSettingsOpen").click(); await wait(120);
  T.ok("N16 Más → Asistente de IA abre su configuración", scr() === "asistente" && shown($("aiKeyInput")) && !$("backupScreen").contains($("aiSettingsPanel")) && !$("bottom").classList.contains("is-visible") && tab("mas").getAttribute("aria-current") === "page" && $("sectionSettings").contains($("aiSettingsOpen")));
  reset(); await clickTab("hoy");
  return T;
})()
