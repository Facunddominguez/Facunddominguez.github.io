// E3: Etapa 3 del rediseño (Hoy). Hoy muestra el chip de entrenamiento, las 4 comidas con "Lo comí", un hueco vacío
// abre el Selector y asigna ahí mismo, "Mañana" plegado y los atajos (Sugerime algo integra Plato del día y Sugerir al
// azar). C3-1 es el control E3-hoy-toques de docs/validacion/criterios.json. Se verifica lo guardado, no los textos.
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
  const $ = id => { const e = doc().getElementById(id); if (!e) throw Error("no está en la pantalla: #" + id); return e };
  const q = s => { const e = doc().querySelector(s); if (!e) throw Error("no está en la pantalla: " + s + " (pantalla: " + ev("stack.at(-1)") + ")"); return e };
  const tocar = async el => { el.click(); toques++; await espera(120) };
  const irA = async pestana => { await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')); if (ev("stack.at(-1) !== activeTabRoot()")) await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')) };
  const pantalla = () => ev("stack.at(-1)");
  const visible = e => !!e && e.getClientRects().length > 0;
  const hojaAbierta = () => ev("hoja.abierta()");
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const plan = () => JSON.parse(localStorage.getItem("miPlatoFacil_plan") || "{}");
  const guardados = () => JSON.parse(localStorage.getItem("miPlatoFacil_saved") || "[]");
  const consumo = () => JSON.parse(localStorage.getItem("miPlatoFacil_consumption_v1") || "[]");
  const todo = () => JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith("miPlatoFacil_")).sort().map(k => [k, localStorage.getItem(k)]));
  const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const hoy = () => DIAS[(new Date().getDay() + 6) % 7], manana = () => DIAS[(new Date().getDay() + 7) % 7];
  const fechaHoy = () => ev("localTrainingDate(new Date())");
  const conPlan = (cambios, extra) => { const p = JSON.parse(R.data.miPlatoFacil_plan); for (const [d, c, id] of cambios) p[d][c] = id; return { ...R.data, miPlatoFacil_plan: JSON.stringify(p), ...(extra || {}) } };
  const fila = comida => q('#todayRows [data-today-slot="' + comida + '"]');
  const estado = () => $("todayStatus");
  const propuesta = () => { const p = doc().querySelector(".hoja .selector__propuesta"); return p ? p.textContent : "" };
  const nombreDe = s => s ? (s.tipo === "idea" ? s.idea.text : w.mealName(s.item)) : "";
  const EVITAR = "a, e, ra, la, ta, na, ca, de, es, on, an, en, or, er, ar, pa, po, ll, ro, to, ma, co, ri, ce, li, ga, za, ne, bo, ho";

  // C3-1 Desde Hoy, elegir y marcar Lo comí en un hueco vacío: Elegir, la comida y Lo comí (3 toques o menos)
  cargar(conPlan([[hoy(), "almuerzo", null]])); await abrir(); await irA("hoy");
  toques = 0;
  await tocar(q('#todayRows [data-today-slot="almuerzo"] [data-today-choose]'));
  const enSelector = hojaAbierta() && pantalla() === "home" && !!doc().querySelector('.hoja [data-selector-seccion="mias"] [data-selector-id="plato_p3"]');
  await tocar(q('.hoja [data-selector-id="plato_p3"]'));
  const asignado = plan()[hoy()].almuerzo === "plato_p3" && !hojaAbierta() && pantalla() === "home" && !!estado().querySelector("[data-plan-deshacer]");
  await tocar(q('#todayRows [data-today-slot="almuerzo"] [data-plan-eaten]'));
  const rec = consumo().at(-1) || {};
  ok("C3-1 desde Hoy, elegir y marcar Lo comí en un hueco vacío lleva 3 toques o menos", enSelector && asignado && toques <= 3 && pantalla() === "home" && rec.date === fechaHoy() && rec.meal === "almuerzo" && rec.planned === true && rec.sourceId === "plato_p3" && /✓ Comido/.test(fila("almuerzo").textContent), toques + " toques");
  await tocar(q("#todayStatus [data-today-undo]"));
  ok("C3-1b el Lo comí de ese hueco se puede deshacer y el plan queda asignado", !consumo().some(x => x.id === rec.id) && plan()[hoy()].almuerzo === "plato_p3");

  // C3-2 Chip de entrenamiento: cambia solo la excepción de hoy, conserva las demás (aunque sean raras) y se deshace
  const rarasTexto = JSON.stringify({ "2026-10-25": true, "no-es-fecha": "rara", "2020-02-30": false, "2019-01-01": 1 });
  cargar({ ...R.data, miPlatoFacil_trainingExceptions: rarasTexto }); await abrir(); await irA("hoy");
  const rutinaHoy = [1, 3, 5].includes(new Date().getDay());
  const chip = () => q('#todayEntreno [data-hoy-entreno]');
  const textoAntes = chip().textContent, diaAntes = ev("diaDeRutina(new Date())");
  await tocar(chip());
  const ex1 = JSON.parse(localStorage.getItem("miPlatoFacil_trainingExceptions")), resto1 = { ...ex1 }; delete resto1[fechaHoy()];
  ok("C3-2 el chip dice el tipo de día de la rutina y \"cambiar\" escribe solo la excepción de hoy", (rutinaHoy ? /Hoy entrenás/ : /Hoy descansás/).test(textoAntes) && /cambiar/.test(textoAntes) && ex1[fechaHoy()] === !rutinaHoy && JSON.stringify(resto1) === rarasTexto && (rutinaHoy ? /Hoy descansás/ : /Hoy entrenás/).test(chip().textContent), textoAntes + " → " + chip().textContent);
  ok("C3-2b el Selector y el armado usan el tipo de día nuevo", ev("diaDeRutina(new Date())") === (rutinaHoy ? "Día libre" : "Día de entrenamiento") && ev("diaDeRutina(new Date())") !== diaAntes && ev("diaDeRutina(fechaDelDiaDelPlan(todayPlanDay()))") === ev("diaDeRutina(new Date())"));
  await tocar(q("#todayStatus [data-hoy-entreno-deshacer]"));
  ok("C3-2c Deshacer deja las excepciones byte a byte como estaban", localStorage.getItem("miPlatoFacil_trainingExceptions") === rarasTexto && chip().textContent === textoAntes);
  await tocar(chip()); await tocar(chip());
  const ex2 = JSON.parse(localStorage.getItem("miPlatoFacil_trainingExceptions"));
  ok("C3-2d volver al valor de la rutina quita la excepción de hoy (sin guardar una de más)", !Object.prototype.hasOwnProperty.call(ex2, fechaHoy()) && JSON.stringify(ex2) === rarasTexto && chip().textContent === textoAntes);
  await tocar(chip());
  const cambiado = JSON.stringify({ ...JSON.parse(localStorage.getItem("miPlatoFacil_trainingExceptions")), "2026-12-24": true });
  localStorage.setItem("miPlatoFacil_trainingExceptions", cambiado);
  await tocar(q("#todayStatus [data-hoy-entreno-deshacer]"));
  ok("C3-2e si las excepciones cambiaron después, Deshacer no pisa nada y lo dice", localStorage.getItem("miPlatoFacil_trainingExceptions") === cambiado && /No se puede deshacer/.test(estado().textContent), estado().textContent);
  const antesFalla = localStorage.getItem("miPlatoFacil_trainingExceptions"), setItemOriginal = w.Storage.prototype.setItem;
  w.Storage.prototype.setItem = function () { throw Error("sin espacio") };
  try { await tocar(chip()) } finally { w.Storage.prototype.setItem = setItemOriginal }
  ok("C3-2f si no se puede guardar, nada cambia y se avisa", localStorage.getItem("miPlatoFacil_trainingExceptions") === antesFalla && /No se pudo guardar/.test(estado().textContent), estado().textContent);
  cargar({}); await abrir(); await irA("hoy");
  const sinRutina = chip().textContent;
  await tocar(chip());
  const hojaSiNo = hojaAbierta() && !!doc().querySelector('.hoja [data-hoy-entreno-valor="si"]') && !!doc().querySelector('.hoja [data-hoy-entreno-valor="no"]') && !!doc().querySelector(".hoja [data-open-training]");
  await tocar(q('.hoja [data-hoy-entreno-valor="si"]'));
  const ex3 = JSON.parse(localStorage.getItem("miPlatoFacil_trainingExceptions") || "{}");
  await tocar(q('#home [data-start="plato"]'));
  ok("C3-2g sin rutina, el chip pregunta; Sí guarda la excepción de hoy y el armado ya no pregunta", /¿Entrenás hoy\?/.test(sinRutina) && hojaSiNo && JSON.stringify(ex3) === JSON.stringify({ [fechaHoy()]: true }) && localStorage.getItem("miPlatoFacil_trainingWeek") === null && pantalla() === "lunch_veg" && ev("state.day") === "Día de entrenamiento", sinRutina);

  // C3-3 Primera vez: el método del plato y el primer paso en una línea; pintar Hoy no escribe
  cargar({}); await abrir();
  const antes3 = todo();
  await irA("semana"); await irA("hoy");
  const filas3 = [...doc().querySelectorAll("#todayRows .today-row")];
  ok("C3-3 primera vez: una línea con el método y el primer paso, y el Elegir del almuerzo es el botón lleno", visible($("todayPrimera")) && /Medio plato de verduras/.test($("todayPrimera").textContent) && /Empezá eligiendo tu almuerzo/.test($("todayPrimera").textContent) && q('#todayRows [data-today-slot="almuerzo"] [data-today-choose]').classList.contains("button--primary") && doc().querySelectorAll("#todayRows .button--primary").length === 1 && !filas3.some(f => /Sin plan para hoy/.test(f.textContent)) && filas3.length === 4);
  ok("C3-3b pintar Hoy no escribe nada", todo() === antes3);
  cargar(conPlan(DIAS.flatMap(d => ["desayuno", "merienda", "almuerzo", "cena"].map(c => [d, c, null])))); await abrir(); await irA("hoy");
  ok("C3-3c con comidas guardadas, la línea de primera vez no está", !visible($("todayPrimera")) && !doc().querySelector("#todayRows .button--primary"));

  // C3-4 Mañana: plegado, con las comidas del día siguiente del plan; elegir ahí asigna a ese día, sin Lo comí
  cargar(R.data); await abrir(); await irA("hoy");
  const pm = plan()[manana()], porId = new Map(guardados().map(x => [x.id, x]));
  const nombresManana = [...doc().querySelectorAll("#todayMananaRows .today-row__plate")].map(x => x.textContent);
  ok("C3-4 Mañana arranca plegado y muestra las comidas del día siguiente del plan", visible($("todayManana")) && $("todayManana").open === false && $("todayMananaTitulo").textContent === "Mañana · " + ev("planDayName(" + JSON.stringify(manana()) + ")").toLowerCase() && JSON.stringify(nombresManana) === JSON.stringify(["desayuno", "almuerzo", "merienda", "cena"].map(c => w.mealName(porId.get(pm[c])))) && !doc().querySelector("#todayMananaRows [data-plan-eaten]") && ev('diaSiguienteDelPlan("domingo")') === "lunes", nombresManana.join(" | "));
  cargar(conPlan([[manana(), "cena", null]])); await abrir(); await irA("hoy");
  const planHoy4 = JSON.stringify(plan()[hoy()]);
  $("todayManana").open = true;
  await tocar(q('#todayMananaRows [data-today-slot="cena"] button'));
  const titulo4 = $("hojaTitulo").textContent;
  await tocar(q('.hoja [data-selector-id="plato_p3"]'));
  ok("C3-4b elegir en Mañana asigna a ese día sin salir de Hoy", /^Elegir cena del /.test(titulo4) && plan()[manana()].cena === "plato_p3" && JSON.stringify(plan()[hoy()]) === planHoy4 && pantalla() === "home", titulo4);
  await tocar(q('#todayMananaRows [data-today-slot="cena"] [data-hueco-hoy]'));
  ok("C3-4c el hueco lleno de mañana abre sus opciones sin Lo comí", hojaAbierta() && !!doc().querySelector(".hoja [data-hueco-cambiar]") && !doc().querySelector(".hoja [data-plan-eaten]"));
  ev("hoja.cerrar()");

  // C3-5 Sugerime algo: integra Plato del día (primera propuesta, con semilla) y Sugerir al azar ("Otra")
  cargar(conPlan([[hoy(), "almuerzo", null]])); await abrir(); await irA("hoy");
  await tocar(q('#home [data-sugerime]'));
  const delDia = nombreDe(ev('sugerenciaDelDia("almuerzo")')), p1 = propuesta();
  const enAlmuerzo = $("hojaTitulo").textContent === "Sugerime algo" && q('.hoja [data-sugerime-comida="almuerzo"]').getAttribute("aria-pressed") === "true";
  ev("hoja.cerrar()"); await tocar(q('#home [data-sugerime]'));
  const p2 = propuesta();
  ev("hoja.cerrar()"); ev("platoDelDia()"); await espera(100);
  const nombrePlatoDia = ev("state.nombreSugerido");
  ok("C3-5 Sugerime algo abre el primer hueco vacío de hoy y propone el Plato del día, igual todo el día", enAlmuerzo && !!delDia && p1.includes(delDia) && p1 === p2 && nombrePlatoDia === delDia, p1);
  await irA("hoy"); await tocar(q('#home [data-sugerime]')); await tocar(q('.hoja [data-sugerime-comida="cena"]'));
  const cenaDelDia = nombreDe(ev('elegirSugerencia("cena", mulberry32(hashStr("plato_" + localTrainingDate(new Date()) + "_cena")), diaDeRutina(new Date()))'));
  ok("C3-5b en la cena, la semilla suma la comida", propuesta().includes(cenaDelDia) && nombreDe(ev('sugerenciaDelDia("cena")')) === cenaDelDia, propuesta());
  await tocar(q('.hoja [data-sugerime-comida="almuerzo"]'));
  let cambio = false;
  for (let i = 0; i < 12 && !cambio; i++) { await tocar(q(".hoja [data-sugerime-otra]")); cambio = propuesta() !== p1 }
  ok("C3-5c \"Otra\" propone otra al azar", cambio);
  const elegida = ev("huecoAbierto.sugerencia"), nombreElegida = nombreDe(elegida);
  await tocar(q(".hoja [data-selector-usar]"));
  const idAlm = plan()[hoy()].almuerzo, itAlm = guardados().find(x => x.id === idAlm);
  ok("C3-5d \"Usar esta\" asigna la propuesta al hueco de hoy, con Deshacer", !!itAlm && w.mealName(itAlm) === nombreElegida && !hojaAbierta() && pantalla() === "home" && !!estado().querySelector("[data-plan-deshacer]"), nombreElegida);
  await tocar(q("#todayStatus [data-plan-deshacer]"));
  ok("C3-5e Deshacer vuelve el hueco a vacío", plan()[hoy()].almuerzo === null && /se deshizo/.test(estado().textContent));
  const catalogo = new Set(ev("data.menuCatalog.map(x=>x.text)"));
  await tocar(q('#home [data-sugerime]'));
  const p5 = propuesta();
  await tocar(q(".hoja [data-sugerime-ver]"));
  const nombre5 = ev("state.nombreSugerido"), destino5 = ev("JSON.stringify(armadoDestino)");
  ok("C3-5f \"Ver y cambiar\" muestra una idea del catálogo o una comida tuya, con su nombre y sus ingredientes", pantalla() === "resumen" && p5.includes(nombre5) && (catalogo.has(nombre5) || w.loadSaved().some(x => w.mealName(x) === nombre5)) && ev("state.verduras.length + state.almidones.length + state.proteinas.length + state.legCarb.length + state.legProt.length") > 0 && destino5 === JSON.stringify({ dia: hoy(), slot: "almuerzo", tab: "hoy" }), nombre5);
  await tocar(q("#resumen [data-save-plate]")); await tocar(q(".hoja .button--primary"));
  const id5 = plan()[hoy()].almuerzo, it5 = guardados().find(x => x.id === id5);
  ok("C3-5g al guardarla, queda asignada al hueco y se vuelve a Hoy", pantalla() === "home" && !!it5 && w.mealName(it5) === nombre5 && ev("armadoDestino") === null, pantalla());
  cargar(conPlan([[hoy(), "desayuno", null]])); await abrir(); await irA("hoy");
  await tocar(q('#home [data-sugerime]'));
  const enDesayuno = q('.hoja [data-sugerime-comida="desayuno"]').getAttribute("aria-pressed") === "true";
  await tocar(q(".hoja [data-selector-sugerir]"));
  const frutaOk = ev("data.frutas.some(f => f[0] === state.fruta.name) && data.frutaFormas.includes(state.fruta.forma)"), destino6 = ev("JSON.stringify(armadoDestino)");
  await tocar(q("#resumen [data-save-plate]")); await tocar(q(".hoja .button--primary"));
  const it6 = guardados().find(x => x.id === plan()[hoy()].desayuno);
  ok("C3-5h en el desayuno arma uno con fruta real y, al guardarlo, queda asignado", enDesayuno && frutaOk && destino6 === JSON.stringify({ dia: hoy(), slot: "desayuno", tab: "hoy" }) && !!it6 && it6.type === "desayuno" && pantalla() === "home", destino6);
  cargar(conPlan([[hoy(), "almuerzo", null]], { miPlatoFacil_recipePreferences_v1: JSON.stringify({ enabled: true, words: EVITAR }) })); await abrir(); await irA("hoy");
  const antes7 = ev("JSON.stringify(state)"), datos7 = todo();
  await tocar(q('#home [data-sugerime]'));
  ok("C3-5i si las preferencias dejan sin ideas, se avisa y nunca se combinan ingredientes sueltos", w.sugerenciasPara("almuerzo", "").length === 0 && /No hay ideas que no tengan lo que evitás/.test(doc().querySelector(".hoja").textContent) && !doc().querySelector(".hoja [data-selector-usar]") && ev("JSON.stringify(state)") === antes7 && todo() === datos7);
  ev("hoja.cerrar()");

  // C3-6 Atajos: Sugerime algo y Con lo que tengo; ninguna entrada separada de Plato del día ni de Sugerir al azar
  for (const modo of ["simple", "completo"]) {
    cargar(R.data); localStorage.setItem("miPlatoFacil_uiMode_v1", modo); await abrir(); await irA("hoy");
    const atajos = [...doc().querySelectorAll("#home .home-group--main .tool-button")].filter(visible).map(b => b.querySelector(".tool-button__label").textContent);
    // v15.3: "Armar una comida" es una sola tarjeta con sus dos opciones (los mismos data-start).
    const armarOk = visible(q('#home .armar-comida [data-start="desayuno"]')) && visible(q('#home .armar-comida [data-start="plato"]'));
    const enHoy = [...doc().querySelectorAll("#home .tool-button")].filter(visible).map(b => b.textContent).join(" | ");
    const vistaHoy = visible(q("#todayEntreno [data-hoy-entreno]")) && visible($("todayManana")) && doc().querySelectorAll("#todayRows .today-row").length === 4;
    await irA("mas");
    const enMas = [...doc().querySelectorAll("#home .tool-button")].filter(visible).map(b => b.textContent).join(" | ");
    // v15.3: Más tiene Mi rutina y los ajustes; Ideas pasó a Comidas.
    const masOk = visible(q("#sectionSettings [data-open-training]")) && visible(q("#sectionSettings [data-open-como-funciona]")) && !visible($("todayPanel"));
    ok("C3-6" + (modo === "simple" ? "" : "b") + " atajos de Hoy en modo " + modo + ": chip, 4 comidas, Mañana y Armar, Sugerime algo y Con lo que tengo", vistaHoy && JSON.stringify(atajos) === JSON.stringify(["Armar una comida", "Sugerime algo", "Con lo que tengo"]) && armarOk && !/Plato del día|Sugerir al azar/.test(enHoy + enMas) && masOk, atajos.join(" | "));
  }
  await irA("miscomidas"); await tocar(q('#misplatos [data-comidas-vista="ideas"]'));
  const ideasOk = pantalla() === "ideas";
  await irA("mas"); await tocar(q("#sectionSettings [data-open-training]"));
  const rutinaOk = pantalla() === "trainingCalendar";
  await irA("hoy"); ev("platoDelDia()"); await espera(100);
  const platoDiaOk = pantalla() === "resumen" && !!ev("state.nombreSugerido");
  await irA("hoy"); await tocar(q('#home [data-sugerime]')); await tocar(q('.hoja [data-open-azar]'));
  const azarOk = pantalla() === "azar" && !hojaAbierta();
  await tocar(q('#azar [data-random-type="plato"]'));
  ok("C3-6c Ideas, Días de entrenamiento, Plato del día y la pantalla al azar siguen funcionando", ideasOk && rutinaOk && platoDiaOk && azarOk && pantalla() === "resumen", [ideasOk, rutinaOk, platoDiaOk, azarOk].join());

  // C3-7 Hueco lleno en Hoy: el nombre abre Cambiar, Quitar (con Deshacer) y Lo comí; armar desde Hoy vuelve a Hoy
  cargar(R.data); await abrir(); await irA("hoy");
  const antes8 = plan()[hoy()].almuerzo;
  await tocar(q('#todayRows [data-today-slot="almuerzo"] [data-hueco-hoy]'));
  const opciones = hojaAbierta() && !!doc().querySelector(".hoja [data-hueco-cambiar]") && !!doc().querySelector(".hoja [data-plan-clear]") && /Lo comí hoy/.test((doc().querySelector(".hoja [data-plan-eaten]") || {}).textContent || "");
  await tocar(q(".hoja [data-plan-clear]"));
  const quitado = plan()[hoy()].almuerzo === null && pantalla() === "home" && !!estado().querySelector("[data-plan-deshacer]") && fila("almuerzo").querySelector("[data-today-choose]");
  await tocar(q("#todayStatus [data-plan-deshacer]"));
  ok("C3-7 el nombre de un hueco lleno abre Cambiar, Quitar y Lo comí hoy; Quitar se deshace desde Hoy", opciones && !!quitado && plan()[hoy()].almuerzo === antes8);
  cargar({}); await abrir(); await irA("hoy");
  await tocar(q('#todayRows [data-today-slot="cena"] [data-today-choose]'));
  await tocar(q('.hoja [data-start="plato"][data-start-slot="cena"]'));
  if (pantalla() === "day") await tocar(q('#day [data-day="Día libre"]'));
  if (pantalla() === "plate_static") await tocar(q('#plate_static [data-go="lunch_veg"]'));
  await tocar(q('#boxv [data-name="Tomate"]')); await tocar($("nextBottom"));
  await tocar(q('#boxa [data-name="Papa"]')); await tocar($("nextBottom"));
  await tocar(q('#boxp [data-name="Merluza"]')); await tocar($("nextBottom"));
  await tocar(q("#resumen [data-save-plate]")); await tocar(q(".hoja .button--primary"));
  const g7 = guardados();
  ok("C3-7b armar desde un hueco de Hoy vuelve a Hoy con la comida asignada", g7.length === 1 && plan()[hoy()].cena === g7[0].id && pantalla() === "home" && ev('activeTab') === "hoy" && ev("armadoDestino") === null && /asignado/i.test(estado().textContent), pantalla() + " · " + estado().textContent);

  // C3-8 Hoy y la Semana muestran el mismo plan
  cargar(conPlan([[hoy(), "cena", null]])); await abrir(); await irA("hoy");
  await tocar(q('#todayRows [data-today-slot="cena"] [data-today-choose]')); await tocar(q('.hoja [data-selector-id="plato_p5"]'));
  await irA("semana");
  const cuenta = q('#planDias [data-plan-dia="' + hoy() + '"] .semana-dia-chip__cuenta').textContent;
  await tocar(q('#planDias [data-plan-dia="' + hoy() + '"]')); await tocar(q('[data-hueco="' + hoy() + '|cena"]'));
  await tocar(q(".hoja [data-hueco-cambiar]")); await tocar(q('.hoja [data-selector-id="plato_p2"]'));
  await irA("hoy");
  ok("C3-8 lo asignado en Hoy se ve en la Semana y lo asignado en la Semana, en Hoy", cuenta === "4/4" && plan()[hoy()].cena === "plato_p2" && fila("cena").querySelector(".today-row__plate").textContent === w.mealName(guardados().find(x => x.id === "plato_p2")), cuenta);

  document.getElementById("marcoPrueba").remove();
  localStorage.clear();
  return T;
})()
