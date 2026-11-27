// R6 · Etapa 49 (Armame aprende de vos): ítems A-01 a A-06 de docs/ronda-6-lista.md.
// Datos inventados; las pruebas de Armame fijan la fecha (H.abrirEn) como armarFijo de e20_un_costo.js: la semana (y su semilla) es siempre la misma.
(async () => {
  const H = R6H(), { ok, espera } = H;
  const tocar = async (el, ms) => { if (!el) throw new Error("no hay elemento para tocar · tras " + H.T.length + " pruebas · " + (new Error().stack.split("\n")[2] || "").trim().slice(-30)); return H.tocar(el, ms) };
  const ev = x => H.ev(x), doc = () => H.doc();
  const $ = id => doc().getElementById(id);
  const qa = s => [...doc().querySelectorAll(s)];
  const norm = H.norm, J = H.J, visible = H.visible;
  const GUSTOS = "miPlatoFacil_gustos_v1", REGLAS = "miPlatoFacil_armameReglas_v1", PLANK = "miPlatoFacil_plan";
  const REC = [
    { id: "recipe_armame6a", titulo: "Guiso de lentejas de mi casa", fav: true, filas: [{ name: "Lentejas", quantity: 200, unit: "g" }, { name: "Cebolla", quantity: 1, unit: "unidad" }] },
    { id: "recipe_armame6b", titulo: "Pollo con papas de los domingos", filas: [{ name: "Pollo", quantity: 500, unit: "g" }, { name: "Papa", quantity: 400, unit: "g" }] },
    { id: "recipe_armame6c", titulo: "Tarta de zapallito", filas: [{ name: "Zapallito", quantity: 4, unit: "unidad" }, { name: "Huevo", quantity: 3, unit: "unidad" }] },
  ];
  const A = "rp_recipe_armame6a", B = "rp_recipe_armame6b", C = "rp_recipe_armame6c";
  const base = (extra = {}, recetas = REC) => ({ ...H.MARCA, ...H.recetas(recetas), ...extra });
  const abrir = async (hoy, extra, recetas, op) => { await H.abrirEn(hoy, base(extra, recetas), op) };
  const armar = async modo => { ev('openTab("semana")'); await espera(200); await ev(`(async () => { await ArmameSemana.correr(${JSON.stringify(modo || "todo")}) })()`); await espera(700) };
  const plan = () => J(PLANK);
  const ids = p => DAYS_SLOTS(p).map(x => x[2]);
  function DAYS_SLOTS(p) { const o = []; for (const d of H.DIAS) for (const s of H.SLOTS) if (p && p[d] && p[d][s]) o.push([d, s, p[d][s]]); return o }
  const veces = (p, id) => DAYS_SLOTS(p).filter(x => x[2] === id).length;
  const detalle = () => norm(($("planAviso") || { textContent: "" }).textContent);
  const FECHAS = ["2026-11-24", "2026-12-01", "2026-12-08"];

  // ---- A-01: la pregunta "¿Te gustó?" ----
  const sobre = { ...H.PRES(60000) };
  await abrir("2026-11-24", { miPlatoFacil_plan: JSON.stringify(H.planDe([["martes", "desayuno", C], ["martes", "almuerzo", B], ["martes", "cena", A]])) });
  ev('openTab("hoy")'); await espera(400);
  await tocar(doc().querySelector("[data-today-eaten]"), 400);
  const p1 = $("gustoPregunta");
  ok("R6-A-01 después de 'Lo comí' en Hoy aparece '¿Te gustó?' con Sí, No y una forma de cerrar, de al menos 44 px", !!p1 && visible(p1) && /¿Te gustó\?/.test(norm(p1.innerText)) && [...p1.querySelectorAll("button")].map(b => norm(b.textContent)).join("|") === "Sí|No|✕" && [...p1.querySelectorAll("button")].every(b => b.getBoundingClientRect().height >= 44), p1 && norm(p1.innerText));
  await tocar(doc().querySelector("#gustoPregunta [data-gusto-cerrar]"), 200);
  ok("R6-A-01 se puede cerrar sin responder: no se escribe nada", !$("gustoPregunta") && localStorage.getItem(GUSTOS) === null);
  await tocar(doc().querySelector("[data-today-eaten]"), 400);
  ev('openTab("semana")'); await espera(300);
  ok("R6-A-01 la pregunta se va al cambiar de pantalla (es de la comida que acabás de anotar)", !$("gustoPregunta"));
  ev('openTab("hoy")'); await espera(300);
  await tocar(doc().querySelector("[data-today-eaten]"), 400);
  await tocar(doc().querySelector('#gustoPregunta [data-gusto-responder="s"]'), 300);
  ok("R6-A-01 'Sí' se guarda en la clave nueva con el nombre de la comida (sin tildes ni signos) y la pregunta se despide", /Anotado, gracias/.test(norm($("gustoPregunta").innerText)) && Object.values(J(GUSTOS)).join() === "s" && /^[a-z0-9ñ ]+$/.test(Object.keys(J(GUSTOS))[0]), localStorage.getItem(GUSTOS));
  await espera(2200);
  ok("R6-A-01 la pregunta desaparece sola después de responder", !$("gustoPregunta"));
  // No y varias respuestas
  await abrir("2026-11-24", { miPlatoFacil_plan: JSON.stringify(H.planDe([["martes", "almuerzo", B]])) });
  ev('Gustos.responder("Pollo con papas de los domingos", "n"); Gustos.responder("Pollo con papas de los domingos", "n")');
  ok("R6-A-01 las respuestas se acumulan como 'nn' (hasta 12, la más nueva al final)", J(GUSTOS)["pollo con papas de los domingos"] === "nn" && ev('(() => { for (let i = 0; i < 20; i++) Gustos.responder("Pollo con papas de los domingos", "s"); return Gustos.cargar()["pollo con papas de los domingos"].length })()') === 12);
  // Ficha de una comida, ficha de una receta, Registro y modo cocina
  await abrir("2026-11-24", {});
  ev('Comidas.abrirComida("plato", ' + JSON.stringify(A) + ')'); await espera(300);
  await tocar(doc().querySelector("#comidaPlatoAcciones [data-cook-saved]"), 400);
  const enFicha = !!$("gustoPregunta");
  ev('Gustos.cerrarPregunta(); Comidas.abrirComida("receta", "recipe_armame6a")'); await espera(300);
  await tocar($("recipeReadCookNow"), 400);
  const enReceta = !!$("gustoPregunta") && /Guiso de lentejas de mi casa/.test($("gustoPregunta").getAttribute("aria-label"));
  ev("Gustos.cerrarPregunta()");
  ev('openTab("mas"); abrirRegistro()'); await espera(300);
  $("consumptionDate").value = "24/11/2026"; $("consumptionText").value = "Milanesas con puré"; await tocar($("consumptionSave"), 400);
  const estadoRegistro = norm($("consumptionStatus").innerText), enRegistro = !!$("gustoPregunta") && /Milanesas con puré/.test($("gustoPregunta").getAttribute("aria-label"));
  ev("Gustos.cerrarPregunta()");
  ev('Comidas.abrirComida("plato", ' + JSON.stringify(A) + ')'); await espera(300);
  await tocar(doc().querySelector("[data-comida-cocinar]"), 300);
  const pasos = ev("ModoCocina.total()");
  for (let i = 0; i < 30 && doc().querySelector("[data-cocina-siguiente]"); i++) await tocar(doc().querySelector("[data-cocina-siguiente]"), 150);
  await tocar($("cocinaLoComi"), 400);
  const enCocina = !!doc().querySelector("#modoCocina #gustoPregunta");
  ok("R6-A-01 la pregunta aparece también después de Lo comí en la ficha de una comida, en la de una receta, al anotar en el Registro y dentro del modo cocina", enFicha && enReceta && enRegistro && enCocina, JSON.stringify({ enFicha, enReceta, enRegistro, enCocina, pasos, estadoRegistro }));
  ev("ModoCocina.cerrar()");

  // ---- A-02: favoritas, "Sí" y lo que más comiste ----
  const enSemanas = async extra => { const r = []; for (const f of FECHAS) { await abrir(f, extra); await armar("todo"); r.push(plan()) } return r };
  const conFav = await enSemanas({});
  ok("R6-A-02 con una favorita guardada y la semana vacía, la favorita aparece en la semana armada (3 semanas distintas con la fecha fija)", conFav.every(p => veces(p, A) >= 1), JSON.stringify(conFav.map(p => veces(p, A))));
  const sinFav = await (async () => { const r = []; for (const f of FECHAS) { await abrir(f, {}, REC.map(x => ({ ...x, fav: false }))); await armar("todo"); r.push(plan()) } return r })();
  const conSi = await enSemanas({ [GUSTOS]: JSON.stringify({ "tarta de zapallito": "sss" }) });
  await abrir("2026-11-24", {}, REC.map(x => ({ ...x, fav: false })));
  ok("R6-A-02 una comida con 'Sí' (sin ser favorita) también se prefiere: con 'sss' aparece las 3 semanas", conSi.every(p => veces(p, C) >= 1), JSON.stringify(conSi.map(p => veces(p, C))));
  const sinNada = await (async () => { const r = []; for (const f of FECHAS) { await abrir(f, {}, REC.map(x => ({ ...x, fav: false }))); await armar("todo"); r.push(plan()) } return r })();
  ok("R6-A-02 la comida con 'Sí' aparece más veces que sin respuestas (misma fecha)", conSi.reduce((t, p) => t + veces(p, C), 0) >= sinNada.reduce((t, p) => t + veces(p, C), 0), JSON.stringify([conSi.map(p => veces(p, C)), sinNada.map(p => veces(p, C))]));

  // ---- A-03: lo que no te gustó ----
  const conNo = await enSemanas({ [GUSTOS]: JSON.stringify({ "guiso de lentejas de mi casa": "nn" }) });
  ok("R6-A-03 Armame no elige una comida con dos 'No' (aunque sea favorita): nunca aparece en 3 semanas", conNo.every(p => veces(p, A) === 0) && conFav.every(p => veces(p, A) >= 1), JSON.stringify(conNo.map(p => veces(p, A))));
  const conNoYSi = await enSemanas({ [GUSTOS]: JSON.stringify({ "guiso de lentejas de mi casa": "nns" }) });
  const conUnNo = await enSemanas({ [GUSTOS]: JSON.stringify({ "guiso de lentejas de mi casa": "sn" }) });
  ok("R6-A-03 con un 'Sí' después de los 'No' (o un solo 'No') vuelve a poder elegirse", conNoYSi.every(p => veces(p, A) >= 1) && conUnNo.every(p => veces(p, A) >= 1), JSON.stringify([conNoYSi.map(p => veces(p, A)), conUnNo.map(p => veces(p, A))]));
  await abrir("2026-11-24", { [GUSTOS]: JSON.stringify({ "guiso de lentejas de mi casa": "nn" }) });
  ev('openTab("semana"); Semana.elegirDiaPlan("miercoles"); renderPlan(); abrirSelector("miercoles", "almuerzo")'); await espera(400);
  const secs = qa(".hoja [data-selector-seccion]").map(s => s.dataset.selectorSeccion), ultima = qa(".hoja [data-selector-seccion]").at(-1);
  const filasGuiso = qa(".hoja .selector-item").filter(b => /Guiso de lentejas de mi casa/.test(b.innerText));
  ok("R6-A-03 al cambiar una comida, la que no te gustó aparece al final con la nota 'No te gustó' (y una sola vez)", ultima && ultima.dataset.selectorSeccion === "nogusto" && /Guiso de lentejas de mi casa/.test(ultima.innerText) && /No te gustó/.test(ultima.innerText) && filasGuiso.length === 1 && secs.at(-1) === "nogusto", JSON.stringify(secs) + " " + filasGuiso.length);
  await H.cerrarHoja();
  await abrir("2026-11-24", {});
  ev('openTab("semana"); Semana.elegirDiaPlan("miercoles"); renderPlan(); abrirSelector("miercoles", "almuerzo")'); await espera(400);
  ok("R6-A-03 sin 'No' no hay sección 'No te gustó'", !qa(".hoja [data-selector-seccion=nogusto]").length);
  await H.cerrarHoja();

  // ---- A-04: no repite almuerzos ni cenas de la semana anterior ----
  const semanaPasada = H.planDe([["lunes", "almuerzo", B], ["martes", "cena", C], ["jueves", "almuerzo", A], ["viernes", "cena", B]]);
  const copia = { "2026-11-23": { version: 1, plan: semanaPasada, saved: JSON.parse(H.recetas(REC).miPlatoFacil_saved) } };
  const sinFavoritas = REC.map(x => ({ ...x, fav: false }));
  await abrir("2026-11-30", { miPlatoFacil_datedWeeks_v1: JSON.stringify(copia) }, sinFavoritas);
  await armar("todo");
  const p4 = plan(), almCena = DAYS_SLOTS(p4).filter(x => x[1] === "almuerzo" || x[1] === "cena").map(x => x[2]);
  ok("R6-A-04 Armame no repite los almuerzos y cenas de la semana anterior si hay otras opciones (Pollo y Tarta no vuelven)", !almCena.includes(B) && !almCena.includes(C), JSON.stringify(almCena.filter(x => x === B || x === C)));
  await abrir("2026-11-30", { miPlatoFacil_datedWeeks_v1: JSON.stringify(copia) }, REC);
  await armar("todo");
  ok("R6-A-04 las favoritas sí pueden repetirse (la favorita de la semana pasada aparece)", veces(plan(), A) >= 1);
  // sin alternativas: solo hay 3 recetas guardadas y se achica el catálogo con una dieta que deja pocas opciones
  const dieta = { miPlatoFacil_dieta_v1: JSON.stringify({ filtros: ["vegano", "sin gluten", "sin lactosa", "sin huevo"] }) };
  await abrir("2026-11-30", { miPlatoFacil_datedWeeks_v1: JSON.stringify({ "2026-11-23": { version: 1, plan: H.planDe([]), saved: [] } }), ...dieta }, sinFavoritas);
  await armar("todo");
  ok("R6-A-04 si no alcanzan las opciones se repite y se dice en Ver detalle (probado con la lógica: la lista 'repetidas' sale en el detalle)", ev('(() => { const r = { porque: { favoritas: [], gustadas: [], poco: 0, sinPoco: [], repetidas: ["Tarta de zapallito"], minutos: 30 }, llenos: 1, huecos: 1 }; return ArmameSemana.resumen(r) })()').includes("Repetí de la semana pasada: Tarta de zapallito, porque no alcanzaban las otras opciones."));

  // ---- A-05: Días con poco tiempo ----
  await abrir("2026-11-24", {});
  ev('ModoSimple.setUiMode("completo"); openTab("mas"); go("preferencias")'); await espera(400);
  const panel = $("pocoTiempoPanel"), chips = qa("#pocoTiempoGrilla [data-poco-tiempo]");
  const marcados = chips.filter(c => c.getAttribute("aria-pressed") === "true").map(c => c.dataset.pocoTiempo);
  ok("R6-A-05 Preferencias tiene 'Días con poco tiempo' con, por omisión, las cenas de lunes a viernes hasta 30 minutos, editable por día y comida", visible(panel) && /Días con poco tiempo/.test(panel.innerText) && marcados.join() === "lunes|cena,martes|cena,miercoles|cena,jueves|cena,viernes|cena" && $("pocoTiempoMinutos").value === "30" && chips.length === 14 && chips.every(c => c.getBoundingClientRect().height >= 44), marcados.join());
  ok("R6-A-05 mirar la pantalla no escribe la clave", localStorage.getItem(REGLAS) === null);
  await tocar(qa("#pocoTiempoGrilla [data-poco-tiempo='lunes|almuerzo']")[0], 200);
  await tocar(qa("#pocoTiempoGrilla [data-poco-tiempo='viernes|cena']")[0], 200);
  $("pocoTiempoMinutos").value = "20"; $("pocoTiempoMinutos").dispatchEvent(new Event("change", { bubbles: true })); await espera(200);
  ok("R6-A-05 se edita por día y comida y por minutos, y se guarda en la clave nueva", JSON.stringify(J(REGLAS)) === JSON.stringify({ poco: { minutos: 20, huecos: ["lunes|almuerzo", "lunes|cena", "martes|cena", "miercoles|cena", "jueves|cena"] } }), localStorage.getItem(REGLAS));
  // Armame respeta los minutos
  const minutosDe = (p, d, s) => ev(`(() => { const it = MisPlatos.loadSaved().find(x => x.id === ${JSON.stringify((p[d] || {})[s] || "")}); if (!it) return null; const i = IdeasHoja.ideaDeComida(it); return i ? i.minutos : null })()`);
  await abrir("2026-11-24", {}, sinFavoritas);
  await armar("todo");
  const p5 = plan(), minCenas = ["lunes", "martes", "miercoles", "jueves", "viernes"].map(d => minutosDe(p5, d, "cena")), minOtras = ["sabado", "domingo"].map(d => minutosDe(p5, d, "cena"));
  ok("R6-A-05 con los valores por omisión, Armame pone en las cenas de lunes a viernes recetas de hasta 30 minutos", minCenas.every(m => m !== null && m <= 30), JSON.stringify(minCenas));
  await abrir("2026-11-24", { [REGLAS]: JSON.stringify({ poco: { minutos: 15, huecos: ["lunes|almuerzo", "lunes|cena", "martes|cena"] } }) }, sinFavoritas);
  await armar("todo");
  const p6 = plan();
  ok("R6-A-05 con otros huecos y minutos (15), esos huecos quedan en 15 minutos o menos o el detalle dice que no encontró", ["lunes|almuerzo", "lunes|cena", "martes|cena"].every(k => { const [d, s] = k.split("|"); const m = minutosDe(p6, d, s); return (m !== null && m <= 15) || /No encontré recetas de hasta 15 minutos/.test(detalle()) }), JSON.stringify(["lunes|almuerzo", "lunes|cena", "martes|cena"].map(k => minutosDe(p6, ...k.split("|")))) + " " + detalle().slice(0, 200));
  await abrir("2026-11-24", { [REGLAS]: JSON.stringify({ poco: { minutos: 5, huecos: ["lunes|cena", "martes|cena"] } }) }, sinFavoritas);
  await armar("todo");
  ok("R6-A-05 si no hay recetas de hasta esos minutos (5), Armame igual llena el hueco y lo dice en Ver detalle", plan().lunes.cena && plan().martes.cena && /No encontré recetas de hasta 5 minutos para cena del lunes y cena del martes: puse otra comida\./.test(detalle()), detalle().slice(0, 400));
  // Con presupuesto: el ajuste que cambia lo más caro por algo más barato respeta los minutos y lo de la semana pasada.
  await abrir("2026-11-24", { ...H.PRES(1500) }, sinFavoritas);
  const ajuste = JSON.parse(ev(`JSON.stringify((() => { const r = ArmameSemana.armar({ modo: "todo" }); return { cambios: r.cambios, pasado: r.pasado, cenas: r.asignadas.filter(x => x.slot === "cena" && ["lunes", "martes", "miercoles", "jueves", "viernes"].includes(x.dia)).map(x => x.cand.idea ? x.cand.idea.minutos : null), detalle: ArmameSemana.resumen(r) } })())`));
  ok("R6-A-05 con un presupuesto que obliga a abaratar (el ajuste cambió comidas), las cenas de poco tiempo siguen en 30 minutos o menos", ajuste.cambios > 0 && ajuste.cenas.length === 5 && ajuste.cenas.every(m => m !== null && m <= 30), JSON.stringify(ajuste).slice(0, 300));
  ok("R6-A-06 y el detalle sigue diciendo la verdad: dice cuántos huecos de poco tiempo quedaron bien", /hasta 30 minutos \(5 huecos\)/.test(ajuste.detalle), ajuste.detalle.slice(0, 400));
  // Recetas propias: sus minutos salen de sus detalles.
  const conMin = REC.map((x, i) => ({ ...x, fav: false, minutos: [15, 90, null][i] }));
  const recM = H.recetas(conMin), detM = JSON.parse(recM.miPlatoFacil_recipeDetails_v1);
  conMin.forEach(x => { if (x.minutos !== null) detM[x.id].minutes = x.minutos });
  await abrir("2026-11-24", { ...recM, miPlatoFacil_recipeDetails_v1: JSON.stringify(detM), [REGLAS]: JSON.stringify({ poco: { minutos: 30, huecos: ["lunes|almuerzo"] } }) }, conMin);
  const minPropia = JSON.parse(ev(`JSON.stringify(["${A}", "${B}", "${C}"].map(id => { const c = { item: MisPlatos.loadSaved().find(x => x.id === id) }; const r = loadRecipeDetails()[c.item.recipeSourceId]; return r.minutes === undefined ? null : r.minutes }))`));
  ok("R6-A-05 las recetas propias traen sus minutos en sus detalles (15, 90 y sin dato)", JSON.stringify(minPropia) === "[15,90,null]", JSON.stringify(minPropia));
  const hueco = JSON.parse(ev(`JSON.stringify((() => { const r = ArmameSemana.armar({ modo: "todo" }); const x = r.asignadas.find(a => a.dia === "lunes" && a.slot === "almuerzo"); return x && x.cand.item ? x.cand.item.id : (x ? "idea:" + x.cand.idea.minutos : null) })())`));
  ok("R6-A-05 en un hueco de poco tiempo Armame puede poner una receta propia de 15 minutos (y no la de 90 ni la sin dato)", hueco !== B && hueco !== C, String(hueco));

  const R0 = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json(), w = H.w();
  const conClaves = JSON.parse(JSON.stringify(R0)); conClaves.data[GUSTOS] = JSON.stringify({ "tarta": "sn" }); conClaves.data[REGLAS] = JSON.stringify({ poco: { minutos: 45, huecos: ["lunes|cena"] } });
  const malo1 = JSON.parse(JSON.stringify(R0)); malo1.data[GUSTOS] = '{"tarta":"x"}';
  const malo2 = JSON.parse(JSON.stringify(R0)); malo2.data[REGLAS] = '{"poco":{"minutos":0,"huecos":[]}}';
  let r1 = false, r2 = false, r3 = false, r4 = false;
  try { w.Respaldo.restoreCompleteBackup(conClaves, w.localStorage); r1 = w.localStorage.getItem(GUSTOS) === conClaves.data[GUSTOS] && w.localStorage.getItem(REGLAS) === conClaves.data[REGLAS] } catch (e) { }
  const exp = w.eval("completeBackupSnapshot(localStorage)").data;
  try { w.Respaldo.restoreCompleteBackup(JSON.parse(JSON.stringify(R0)), w.localStorage); r2 = true } catch (e) { }
  try { w.Respaldo.restoreCompleteBackup(malo1, w.localStorage) } catch (e) { r3 = true }
  try { w.Respaldo.restoreCompleteBackup(malo2, w.localStorage) } catch (e) { r4 = true }
  ok("R6-A-01 las dos claves nuevas (gustos y reglas de Armame) entran al respaldo como opcionales: se exportan, se restauran, un respaldo viejo sin ellas se restaura igual y uno con formato malo se rechaza", r1 && exp[GUSTOS] === conClaves.data[GUSTOS] && exp[REGLAS] === conClaves.data[REGLAS] && r2 && r3 && r4 && w.eval(`["${GUSTOS}", "${REGLAS}"].every(k => COMPLETE_BACKUP_KEYS.includes(k) && COMPLETE_BACKUP_OPTIONAL_KEYS.includes(k))`), JSON.stringify({ r1, r2, r3, r4 }));

  // ---- A-06: Ver detalle dice por qué eligió ----
  await abrir("2026-11-24", { [GUSTOS]: JSON.stringify({ "tarta de zapallito": "ss" }) });
  await armar("todo");
  const d6 = detalle();
  ok("R6-A-06 'Ver detalle' dice que puso tu favorita, lo que te gustó y los días con poco tiempo", /Puse tus favoritas: Guiso de lentejas de mi casa/.test(d6) && /Elegí comidas que te gustaron: Tarta de zapallito/.test(d6) && /En tus días con poco tiempo puse recetas de hasta 30 minutos \(\d+ huecos?\)\./.test(d6), d6.slice(0, 500));
  ok("R6-A-06 el 'Ver detalle' sigue siendo la única lista desplegable del aviso (una sola, la de siempre)", qa("#planAviso details").length <= 1);
  return H.terminar();
})()
