// E2: Etapa 2 del rediseño (Selector de comida y nueva Semana). La Semana muestra un día a la vez con chips de lunes
// a domingo; un hueco vacío abre el Selector y asigna en el momento; uno lleno ofrece Cambiar, Quitar, Porciones y
// Lo comí; el menú ⋯ reúne lo ocasional; una semana nueva pregunta si repetir o empezar de cero (sin perder el plan).
// C2-1 es el control E2-asignar-toques de docs/validacion/criterios.json. Se verifica lo guardado, no los textos.
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
  const leer = k => JSON.parse(localStorage.getItem(k) || "null");
  const todo = () => JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith("miPlatoFacil_")).sort().map(k => [k, localStorage.getItem(k)]));
  const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"], COMIDAS = ["desayuno", "merienda", "almuerzo", "cena"];
  const hoy = () => DIAS[(new Date().getDay() + 6) % 7], otroDia = () => DIAS.find(d => d !== hoy());
  const conPlan = cambios => { const p = JSON.parse(R.data.miPlatoFacil_plan); for (const [d, c, id] of cambios) p[d][c] = id; return { ...R.data, miPlatoFacil_plan: JSON.stringify(p) } };
  const abrirHueco = async (dia, comida) => { await tocar(q('#planDias [data-plan-dia="' + dia + '"]')); await tocar(q('[data-hueco="' + dia + '|' + comida + '"]')) };

  // C2-1 Asignar una comida guardada a un hueco vacío: día, comida y la comida elegida (3 toques o menos)
  const diaVacio = otroDia();
  cargar(conPlan([[diaVacio, "cena", null]])); await abrir(); await irA("semana");
  toques = 0;
  await abrirHueco(diaVacio, "cena");
  const seleccionOk = hojaAbierta() && !!doc().querySelector('.hoja [data-selector-seccion="mias"] [data-selector-id="plato_p3"]');
  await tocar(q('.hoja [data-selector-seccion="mias"] [data-selector-id="plato_p3"]'));
  ok("C2-1 asignar una comida guardada a un hueco lleva 3 toques o menos", seleccionOk && toques <= 3 && plan()[diaVacio].cena === "plato_p3" && !hojaAbierta() && pantalla() === "plan", toques + " toques");
  const antesDeHoy = plan();
  toques = 0; await tocar(q('[data-hueco="' + diaVacio + '|cena"]'));
  await tocar(q(".hoja [data-hueco-cambiar]")); await tocar(q('.hoja [data-selector-id="plato_p5"]'));
  ok("C2-1b cambiar una comida asignada lleva 3 toques y se puede deshacer", toques === 3 && plan()[diaVacio].cena === "plato_p5" && !!doc().querySelector("#planAviso [data-plan-deshacer]"));
  await tocar(q("#planAviso [data-plan-deshacer]"));
  ok("C2-1c Deshacer devuelve la comida anterior", JSON.stringify(plan()) === JSON.stringify(antesDeHoy));

  // C2-2 El plan sigue guardado por día de la semana, con el mismo formato
  cargar(conPlan([["miercoles", "almuerzo", null]])); await abrir(); await irA("semana");
  const antes2 = plan();
  await abrirHueco("miercoles", "almuerzo"); await tocar(q('.hoja [data-selector-id="plato_p2"]'));
  const despues2 = plan(), otrosIguales = DIAS.every(d => d === "miercoles" || JSON.stringify(despues2[d]) === JSON.stringify(antes2[d]));
  ok("C2-2 el plan sigue por día de semana y con el mismo formato", JSON.stringify(Object.keys(despues2)) === JSON.stringify(DIAS) && DIAS.every(d => JSON.stringify(Object.keys(despues2[d])) === JSON.stringify(COMIDAS)) && despues2.miercoles.almuerzo === "plato_p2" && otrosIguales && !Object.keys(localStorage).some(k => !k.startsWith("miPlatoFacil_")));

  // C2-3 Armar desde un hueco vuelve a ese hueco con la comida asignada (y no duplica una ya guardada)
  cargar({}); await abrir(); await irA("semana");
  const armar = async (dia, comida) => {
    await abrirHueco(dia, comida); await tocar(q('.hoja [data-start="plato"][data-start-day="' + dia + '"][data-start-slot="' + comida + '"]'));
    if (pantalla() === "day") await tocar(q('#day [data-day="Día libre"]'));
    if (pantalla() === "plate_static") await tocar(q('#plate_static [data-go="lunch_veg"]'));
    await tocar(q('#boxv [data-name="Tomate"]')); await tocar($("nextBottom"));
    await tocar(q('#boxa [data-name="Papa"]')); await tocar($("nextBottom"));
    await tocar(q('#boxp [data-name="Merluza"]')); await tocar($("nextBottom"));
    await tocar(q("#resumen [data-save-plate]")); await tocar(q(".hoja .button--primary"));
  };
  await armar("viernes", "cena");
  const g3 = guardados(), chip3 = doc().querySelector('#planDias [aria-pressed="true"]');
  ok("C2-3 armar desde un hueco vuelve a la Semana con la comida asignada en ese hueco", g3.length === 1 && plan().viernes && plan().viernes.cena === g3[0].id && pantalla() === "plan" && !!chip3 && chip3.dataset.planDia === "viernes" && ev("state.type") === "" && ev("armadoDestino") === null, pantalla());
  await armar("sabado", "cena");
  ok("C2-3b si la comida ya estaba guardada, asigna la existente sin duplicarla", guardados().length === 1 && plan().sabado.cena === g3[0].id && plan().viernes.cena === g3[0].id);
  await irA("hoy"); await tocar(q('#home [data-start="plato"]'));
  ok("C2-3c un armado que no empieza en un hueco no asigna nada", ev("armadoDestino") === null);

  // C2-4 Semana nueva: aviso, copia fechada antes de vaciar, variación si la copia ya existe, nada se pierde
  const prep = extra => {
    cargar({ ...R.data, miPlatoFacil_datedWeeks_v1: null, miPlatoFacil_planPortions_v1: JSON.stringify({ "lunes|cena": 2 }), ...extra });
  };
  cargar({}); await abrir();
  // Último cambio: el domingo anterior a las 22 (hora local; en UTC puede ser lunes) → la semana del plan es la anterior.
  const domingo22 = ev('(()=>{const d=new Date(semanaActual()+"T12:00:00");d.setDate(d.getDate()-1);d.setHours(22,0,0,0);return d.toISOString()})()');
  const lunesAnt = ev("lunesAnterior()"), ddmm = lunesAnt.slice(8, 10) + "/" + lunesAnt.slice(5, 7), hist = JSON.stringify([{ at: domingo22, text: "Domingo · Cena: asignado algo" }]);
  prep({ miPlatoFacil_planHistory_v1: hist }); await abrir(); await irA("semana");
  const sinEscribir = todo(); await irA("hoy"); await irA("semana");
  const avisoA = $("planSemanaNueva");
  ok("C2-4 una semana nueva pregunta si repetir o empezar de cero (domingo 22 h es la semana anterior) y mostrarlo no escribe nada", visible(avisoA) && $("planSemanaNuevaTexto").textContent.includes(ddmm) && todo() === sinEscribir, $("planSemanaNuevaTexto").textContent);
  const planA = plan();
  await tocar(q("[data-plan-de-cero]"));
  const copiaA = (leer("miPlatoFacil_datedWeeks_v1") || {})[lunesAnt];
  const usadas = new Set(Object.values(planA).flatMap(d => Object.values(d)).filter(Boolean));
  ok("C2-4b Empezar de cero guarda antes la copia fechada (con sus comidas) y después vacía", !!copiaA && JSON.stringify(copiaA.plan) === JSON.stringify(planA) && copiaA.saved.length === usadas.size && copiaA.saved.every(p => usadas.has(p.id)) && Object.values(plan()).every(d => Object.values(d).every(v => v === null)) && localStorage.getItem("miPlatoFacil_planPortions_v1") === null && !visible($("planSemanaNueva")));
  await tocar(q("#planAviso [data-plan-deshacer]"));
  ok("C2-4c Deshacer devuelve plan y porciones; la copia queda", JSON.stringify(plan()) === JSON.stringify(planA) && JSON.stringify(leer("miPlatoFacil_planPortions_v1")) === '{"lunes|cena":2}' && !!(leer("miPlatoFacil_datedWeeks_v1") || {})[lunesAnt]);
  // Copia existente distinta: no se pisa; el plan va a una variación (y se reutiliza si ya está igual).
  const otraCopia = { version: 1, plan: { lunes: { desayuno: null, merienda: null, almuerzo: "plato_p3", cena: null } }, saved: [guardados().find(p => p.id === "plato_p3")] };
  prep({ miPlatoFacil_planHistory_v1: hist, miPlatoFacil_datedWeeks_v1: JSON.stringify({ [lunesAnt]: otraCopia }) }); await abrir(); await irA("semana");
  const planB = plan(), copiaAntes = localStorage.getItem("miPlatoFacil_datedWeeks_v1");
  await tocar(q("[data-plan-de-cero]"));
  const varsB = leer("miPlatoFacil_planVars") || {}, nombreVar = "Semana del " + ddmm;
  ok("C2-4d si esa fecha ya tiene otra copia, no se pisa y el plan va a Planes guardados", localStorage.getItem("miPlatoFacil_datedWeeks_v1") === copiaAntes && JSON.stringify(varsB[nombreVar]) === JSON.stringify(planB) && !!varsB["Semana liviana"] && Object.values(plan()).every(d => Object.values(d).every(v => v === null)), Object.keys(varsB).join(", "));
  await tocar(q("#planAviso [data-plan-deshacer]"));
  ok("C2-4e Deshacer no borra la variación ni la copia recién creadas", JSON.stringify(plan()) === JSON.stringify(planB) && JSON.stringify((leer("miPlatoFacil_planVars") || {})[nombreVar]) === JSON.stringify(planB) && localStorage.getItem("miPlatoFacil_datedWeeks_v1") === copiaAntes);
  // Otra vez con la misma variación ya guardada: se reutiliza, no aparece "(2)".
  localStorage.setItem("miPlatoFacil_planHistory_v1", hist); await abrir(); await irA("semana");
  const cuantasVars = Object.keys(leer("miPlatoFacil_planVars")).length;
  await tocar(q("[data-plan-de-cero]"));
  ok("C2-4f una variación igual ya guardada se reutiliza (sin \"(2)\")", Object.keys(leer("miPlatoFacil_planVars")).length === cuantasVars && !leer("miPlatoFacil_planVars")[nombreVar + " (2)"]);
  // Si guardar la copia falla, el plan no cambia.
  prep({ miPlatoFacil_planHistory_v1: hist }); await abrir(); await irA("semana");
  const planC = localStorage.getItem("miPlatoFacil_plan"), setItem = w.Storage.prototype.setItem;
  w.Storage.prototype.setItem = function (k, v) { if (k === "miPlatoFacil_datedWeeks_v1" || k === "miPlatoFacil_planVars") throw new w.DOMException("Sin espacio", "QuotaExceededError"); return setItem.call(this, k, v) };
  try { await tocar(q("[data-plan-de-cero]")) } finally { w.Storage.prototype.setItem = setItem }
  ok("C2-4g si no se puede guardar la copia, no se vacía nada", localStorage.getItem("miPlatoFacil_plan") === planC && /tu plan no cambió/.test($("planStatus").textContent) && visible($("planSemanaNueva")), $("planStatus").textContent);
  // Repetir: el plan no cambia, guarda la copia si falta y el aviso no vuelve (tampoco al recargar).
  await tocar(q("[data-plan-repetir]"));
  const histR = leer("miPlatoFacil_planHistory_v1");
  ok("C2-4h Repetir no cambia el plan y el aviso no vuelve", localStorage.getItem("miPlatoFacil_plan") === planC && /Plan repetido/.test(histR[0].text) && !visible($("planSemanaNueva")) && !!(leer("miPlatoFacil_datedWeeks_v1") || {})[lunesAnt]);
  await abrir(); await irA("semana");
  ok("C2-4i después de recargar, el aviso sigue sin aparecer", !visible($("planSemanaNueva")));
  // Primera escritura de una semana nueva sin pasar por el aviso: copia automática, solo si tenía comidas.
  prep({ miPlatoFacil_planHistory_v1: hist }); await abrir(); await irA("semana");
  await abrirHueco("lunes", "almuerzo"); await tocar(q(".hoja [data-plan-clear]"));
  const autoCopia = (leer("miPlatoFacil_datedWeeks_v1") || {})[lunesAnt];
  prep({ miPlatoFacil_planHistory_v1: hist, miPlatoFacil_plan: null }); await abrir(); await irA("semana");
  await abrirHueco("lunes", "almuerzo"); await tocar(q('.hoja [data-selector-id="plato_p3"]'));
  ok("C2-4j la primera escritura de una semana nueva guarda la copia de la anterior, solo si tenía comidas", !!autoCopia && JSON.stringify(autoCopia.plan) === R.data.miPlatoFacil_plan && !(leer("miPlatoFacil_datedWeeks_v1") || {})[lunesAnt]);

  // C2-5 Hueco lleno: Cambiar, Quitar con Deshacer, Porciones solo en recetas y Lo comí solo hoy
  cargar(R.data); await abrir(); await irA("semana");
  const h = hoy(), o = otroDia(), receta = d => Object.entries(plan()[d]).find(([, id]) => /^recipe_plan_/.test(id || "")), plato = d => Object.entries(plan()[d]).find(([, id]) => /^plato_p/.test(id || ""));
  const conRec = DIAS.find(d => receta(d)), conPlato = DIAS.find(d => plato(d));
  await abrirHueco(h, "almuerzo"); const loComiHoy = !!doc().querySelector(".hoja [data-plan-eaten]") && !!doc().querySelector(".hoja [data-hueco-cambiar]") && !!doc().querySelector(".hoja [data-plan-clear]");
  await abrirHueco(o, "almuerzo"); const loComiOtro = !!doc().querySelector(".hoja [data-plan-eaten]");
  await abrirHueco(conRec, receta(conRec)[0]); const porcionesReceta = !!doc().querySelector(".hoja [data-plan-portions]");
  await abrirHueco(conPlato, plato(conPlato)[0]); const porcionesPlato = !!doc().querySelector(".hoja [data-plan-portions]");
  await tocar(q(".hoja [data-hueco-cambiar]")); const cambiarAbreSelector = !!doc().querySelector('.hoja [data-selector-seccion="mias"]');
  ev("hoja.cerrar()");
  const antes5 = localStorage.getItem("miPlatoFacil_plan");
  const slot5 = plato(conPlato)[0];
  await abrirHueco(conPlato, slot5); await tocar(q(".hoja [data-plan-clear]"));
  const vacioTrasQuitar = plan()[conPlato][slot5] === null && !hojaAbierta(), quitado = !!doc().querySelector("#planAviso [data-plan-deshacer]");
  await tocar(q("#planAviso [data-plan-deshacer]"));
  ok("C2-5 hueco lleno: Cambiar, Quitar con Deshacer, Porciones solo en recetas y Lo comí solo hoy", loComiHoy && !loComiOtro && porcionesReceta && !porcionesPlato && cambiarAbreSelector && quitado && vacioTrasQuitar && localStorage.getItem("miPlatoFacil_plan") === antes5, [loComiHoy, loComiOtro, porcionesReceta, porcionesPlato, cambiarAbreSelector, vacioTrasQuitar].join(","));

  // C2-6 El menú ⋯ tiene lo del plan y cada ítem abre su herramienta funcionando
  await irA("semana"); await tocar(q("[data-plan-menu]"));
  const items = [...doc().querySelectorAll(".hoja .menu-semana button")].map(b => b.textContent);
  const esperados = ["Repetir semana anterior", "Copiar un día", "Vaciar la semana", "Planes guardados", "Semanas anteriores y mes", "Historial de cambios", "Descargar", "Buscar en mis recetas", "Lo que comí y objetivos"];
  const herr = {};
  const abrirHerr = async nombre => { if (pantalla() !== "plan") await irA("semana"); await tocar(q("[data-plan-menu]")); await tocar(q('.hoja [data-plan-herr="' + nombre + '"]')); return pantalla() === "planHerramientas" && !q('#planHerramientas [data-herr="' + nombre + '"]').hidden };
  herr.variaciones = await abrirHerr("variaciones") && [...$("varSelect").options].some(x => x.value === "Semana liviana") && visible(q("#planHerramientas [data-del-var]"));
  herr.semanas = await abrirHerr("semanas") && visible($("monthlyPlanPanel")) && visible($("datedWeeksPanel")) && $("datedWeekList").querySelectorAll("[data-dated-open]").length === 2 && $("monthlyPlanGrid").querySelectorAll("button").length >= 28;
  herr.historial = await abrirHerr("historial") && $("planHistoryList").querySelectorAll("p").length >= 6;
  herr.descargar = await abrirHerr("descargar") && visible(q("[data-download-week]"));
  herr.recetas = await abrirHerr("recetas") && visible($("planRecipeReference")) && [...$("planRecipeSelect").options].some(x => x.value === "recipe_guiso001");
  herr.consumo = await abrirHerr("consumo") && visible($("consumptionPanel")) && $("consumptionView").textContent.trim().length > 0;
  ok("C2-6 el menú ⋯ lista lo del plan y cada herramienta abre con sus datos", esperados.every(t => items.includes(t)) && Object.values(herr).every(Boolean), JSON.stringify(herr));
  await tocar(q("#homeTop"));
  ok("C2-6b desde una herramienta se vuelve a la Semana", pantalla() === "plan");

  // C2-7 Copiar un día y Vaciar, con Deshacer (plan y porciones)
  cargar({ ...R.data, miPlatoFacil_planPortions_v1: JSON.stringify({ "martes|almuerzo": 3, "lunes|cena": 2 }) }); await abrir(); await irA("semana");
  const plan7 = localStorage.getItem("miPlatoFacil_plan"), porc7 = localStorage.getItem("miPlatoFacil_planPortions_v1");
  await tocar(q('#planDias [data-plan-dia="lunes"]')); await tocar(q("[data-plan-menu]")); await tocar(q(".hoja [data-plan-copiar-dia]"));
  await tocar(q('.hoja [data-copiar-a="martes"]')); await tocar(q('.hoja [data-copiar-a="miercoles"]')); await tocar(q(".hoja [data-copiar-confirmar]"));
  const p7 = plan();
  const copiado = JSON.stringify(p7.martes) === JSON.stringify(p7.lunes) && JSON.stringify(p7.miercoles) === JSON.stringify(p7.lunes) && JSON.stringify(p7.jueves) === JSON.stringify(JSON.parse(plan7).jueves) && JSON.stringify(leer("miPlatoFacil_planPortions_v1")) === '{"lunes|cena":2}' && /Lunes copiado a martes y miércoles/.test(leer("miPlatoFacil_planHistory_v1")[0].text);
  await tocar(q("#planAviso [data-plan-deshacer]"));
  const deshechoCopia = localStorage.getItem("miPlatoFacil_plan") === plan7 && localStorage.getItem("miPlatoFacil_planPortions_v1") === porc7;
  await tocar(q("[data-plan-menu]")); await tocar(q(".hoja [data-clear-plan]"));
  const vaciado = Object.values(plan()).every(d => Object.values(d).every(v => v === null)) && localStorage.getItem("miPlatoFacil_planPortions_v1") === null;
  await irA("compras"); await irA("semana");
  await tocar(q("#planAviso [data-plan-deshacer]"));
  ok("C2-7 Copiar un día y Vaciar, con Deshacer que devuelve plan y porciones (también tras cambiar de pestaña)", copiado && deshechoCopia && vaciado && localStorage.getItem("miPlatoFacil_plan") === plan7 && localStorage.getItem("miPlatoFacil_planPortions_v1") === porc7, [copiado, deshechoCopia, vaciado].join(","));

  // C2-8 Selector: secciones, buscador, sin nombres repetidos, Sugerime y recetas
  cargar(R.data); await abrir(); await irA("semana");
  await abrirHueco("lunes", "almuerzo"); await tocar(q(".hoja [data-hueco-cambiar]"));
  const secciones = [...doc().querySelectorAll(".hoja [data-selector-seccion]")].map(s => s.dataset.selectorSeccion).join(",");
  const nombres = [...doc().querySelectorAll('.hoja [data-selector-seccion="mias"] .selector-item__nombre')].map(e => e.textContent);
  const buscar = q("#selectorBuscar"); buscar.value = "lentejas"; buscar.dispatchEvent(new w.Event("input", { bubbles: true })); await espera(50);
  const filtrados = [...doc().querySelectorAll('.hoja [data-selector-seccion="mias"] .selector-item__nombre')].map(e => e.textContent);
  ok("C2-8 el Selector muestra Recientes, Mis comidas e Ideas; el buscador filtra y no hay nombres repetidos", hojaAbierta() && secciones === "recientes,mias,ideas" && nombres.length >= 9 && new Set(nombres).size === nombres.length && filtrados.length >= 1 && filtrados.length < nombres.length && filtrados.some(n => /lentejas/i.test(n)), secciones + " | " + filtrados.join(", "));
  await tocar(q(".hoja [data-selector-sugerir]"));
  const propuesta = !!doc().querySelector(".hoja .selector__propuesta");
  await tocar(q(".hoja [data-selector-usar]"));
  const elegido = plan().lunes.almuerzo, enGuardados = guardados().some(p => p.id === elegido && p.type === "plato");
  ok("C2-8b Sugerime propone una comida y \"Usar esta\" la asigna", propuesta && enGuardados && !hojaAbierta(), elegido);
  await abrirHueco("lunes", "merienda"); if (!doc().querySelector(".hoja [data-selector-seccion]")) await tocar(q(".hoja [data-hueco-cambiar]"));
  const sinIdeas = !doc().querySelector('.hoja [data-selector-seccion="ideas"]'), receta8 = doc().querySelector(".hoja [data-selector-receta]");
  const rid = receta8 && receta8.dataset.selectorReceta;
  if (receta8) await tocar(receta8);
  const asignada = guardados().find(p => p.id === plan().lunes.merienda);
  ok("C2-8c desayuno y merienda no muestran Ideas; una receta propia se asigna con su copia", sinIdeas && !!rid && !!asignada && asignada.recipeSourceId === rid && asignada.type === "desayuno");

  // C2-9 Listas largas del armado: grilla de chips con buscador; lo elegido no se pierde al filtrar
  cargar({}); await abrir(); await irA("hoy"); await tocar(q('#home [data-start="plato"]'));
  if (pantalla() === "day") await tocar(q('#day [data-day="Día libre"]'));
  if (pantalla() === "plate_static") await tocar(q('#plate_static [data-go="lunch_veg"]'));
  await tocar(q('#boxv [data-name="Tomate"]'));
  const bv = q("#boxvBuscar"); bv.value = "zana"; bv.dispatchEvent(new w.Event("input", { bubbles: true })); await espera(50);
  const vis = [...doc().querySelectorAll("#boxv .choice")].filter(visible).map(c => c.dataset.name);
  await tocar(q('#boxv [data-name="Zanahoria"]'));
  ok("C2-9 verduras en grilla con buscador: filtra, deja a la vista lo elegido y se elige igual que antes", q("#boxv").classList.contains("grid--chips") && vis.includes("Zanahoria") && vis.includes("Tomate") && vis.length === 2 && JSON.stringify(ev("state.verduras.map(v=>v.name)")) === '["Tomate","Zanahoria"]', vis.join(", "));

  // C2-10 Encabezado con las fechas de esta semana y chips con la completitud de cada día
  cargar(R.data); await abrir(); await irA("semana");
  const lunesHoy = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d })(), dom = new Date(lunesHoy); dom.setDate(dom.getDate() + 6);
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"], corto = d => d.getDate() + " " + MES[d.getMonth()];
  const chips = [...doc().querySelectorAll("#planDias [data-plan-dia]")];
  ok("C2-10 \"Esta semana · 26 oct – 1 nov\" y chips de lunes a domingo con 4/4", $("planSemanaTitulo").textContent === "Esta semana · " + corto(lunesHoy) + " – " + corto(dom) && chips.map(c => c.dataset.planDia).join() === DIAS.join() && chips.every(c => c.querySelector(".semana-dia-chip__cuenta").textContent === "4/4") && chips.filter(c => c.getAttribute("aria-pressed") === "true").map(c => c.dataset.planDia).join() === hoy(), $("planSemanaTitulo").textContent);

  document.getElementById("marcoPrueba").remove();
  localStorage.clear();
  return T;
})()
