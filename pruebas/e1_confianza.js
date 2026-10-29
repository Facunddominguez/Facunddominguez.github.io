// E1: Etapa 1 del rediseño (Confianza). Lista con comida real, tachados que sobreviven a recargar, armado sin
// "¿Entrenás hoy?" cuando la rutina lo sabe, sugerencias reales, nombres sin repetir, ideas que se pueden tocar y la
// clave nueva en el respaldo. Los códigos C1-1 a C1-4 son los controles de docs/validacion/criterios.json.
// La app se abre en un marco aparte (mismo origen y mismo localStorage) para poder recargarla. Solo datos inventados.
(async () => {
  const T = []; const ok = (n, c, d) => T.push((c ? "PASA " : "FALLA ") + n + (d !== undefined && d !== "" ? " · " + d : ""));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  let marco = null, w = null;
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
  const tocar = async el => { el.click(); await espera(120) };
  const irA = async pestana => { await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')); if (ev("stack.at(-1) !== activeTabRoot()")) await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')) };
  const pantalla = () => ev("stack.at(-1)");
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const FORMAS = ["budin", "en trozos", "enteras con cascara o peladas", "entera", "licuado", "panqueque", "porcion de galletas", "tarta", "waffle"];
  const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  const CHECKS = "miPlatoFacil_shoppingChecks_v1";
  const semana = () => ev("mondayOf(localTrainingDate(new Date()))");
  const plan = (asig) => { const p = {}; for (const d of ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]) p[d] = { desayuno: null, merienda: null, almuerzo: null, cena: null }; for (const [d, s, id] of asig) p[d][s] = id; return JSON.stringify(p) };

  // C1-1 Con el respaldo de ejemplo (que guarda "En trozos", "Licuado" y "Huevo | Clara de huevo" como en la v14.9.94)
  // y un plato guardado solo como texto (sin "state"), ningún ítem de la lista es una forma ni una opción doble.
  const datos = { ...R.data };
  const soloTexto = { id: "viejo_texto", savedAt: "2026-10-01T10:00:00.000Z", type: "desayuno", title: "Desayuno / Merienda", lines: ["Fruta: En trozos (2 unidades grandes o 4 unidades pequeñas)", "Proteína: Huevo | Clara de huevo (1 unidad | 2 unidades)", "Cereal: Avena arrollada o instantánea (2 cdas soperas)", "Grasa opcional: Frutos secos: almendras / nueces / cajú (1/4 taza o 1 puñado)"], sig: "viejo", text: "viejo", cooked: 0 };
  datos.miPlatoFacil_saved = JSON.stringify(JSON.parse(R.data.miPlatoFacil_saved).concat([soloTexto]));
  const p0 = JSON.parse(R.data.miPlatoFacil_plan); p0.domingo.merienda = "viejo_texto"; datos.miPlatoFacil_plan = JSON.stringify(p0);
  cargar(datos); await abrir();
  const items = w.shoppingPlanItems().map(e => e.name);
  const malos = items.filter(n => FORMAS.includes(norm(n).replace(/\s*\(.*$/, "")) || n.includes("|") || /^opcion ocasional|almidones faciles|:/.test(norm(n)));
  ok("C1-1 ningún ítem de la lista es una forma (\"En trozos\", \"Licuado\") ni una opción doble", items.length > 10 && !malos.length && items.includes("Fruta de estación") && items.includes("Frutos secos") && items.some(n => norm(n) === "huevos" || norm(n) === "huevo") && items.includes("Avena arrollada o instantánea"), malos.join(", ") || items.join(", "));
  ok("C1-1b los platos viejos se corrigen al mostrarlos, sin reescribir lo guardado", localStorage.getItem("miPlatoFacil_saved") === datos.miPlatoFacil_saved && w.mealName(w.loadSaved().find(x => x.id === "plato_b1")) === "Fruta en trozos con huevo y pan de molde");
  // La fruta elegida va a la lista (no la forma).
  cargar({}); await abrir(); await irA("hoy");
  await tocar(q('#home [data-start="desayuno"]'));
  await tocar(q('#fruitForms [data-fruta-forma="En trozos"]')); await tocar(q('#fruit [data-name="Banana"]')); await espera(100);
  await tocar(q('#bfprot [data-name="Huevo | Clara de huevo"]')); await espera(100);
  await tocar(q('#bfcarb [data-name="Avena arrollada o instantánea"]')); await espera(100);
  await tocar(q('#bffat [data-name="Palta"]')); await espera(100);
  const fruta = ev("JSON.stringify(state.fruta)");
  await tocar(q("#resumen [data-save-plate]"));
  const sugerido = $("hojaNombre").value;
  $("hojaNombre").value = "Desayuno de prueba"; await tocar(q(".hoja .button--primary"));
  const g1 = w.loadSaved()[0];
  localStorage.setItem("miPlatoFacil_plan", plan([["lunes", "desayuno", g1.id]]));
  const lista1 = w.shoppingPlanItems().map(e => e.name);
  ok("C1-1c la fruta elegida (y no su forma) va a la lista; los huevos, como Huevos", fruta === JSON.stringify({ name: "Banana", quantity: "1 unidad", forma: "En trozos" }) && lista1.includes("Banana") && lista1.includes("Huevos") && !lista1.some(n => /trozos|\|/.test(n)), lista1.join(", "));
  ok("E1-1 al guardar, una hoja sugiere un nombre editable que queda en la nota", sugerido === "Banana en trozos con huevo y avena" && g1.note === "Desayuno de prueba" && w.mealName(g1) === "Desayuno de prueba" && /Banana en trozos/.test(g1.lines[0]), sugerido);

  // C1-2 Los tachados sobreviven a recargar (por semana, en la clave nueva)
  cargar(R.data); await abrir(); await irA("compras");
  const primera = q("#comprasList [data-shop-key]"), clave = primera.dataset.shopKey;
  primera.click(); await espera(150);
  const guardados = JSON.parse(localStorage.getItem(CHECKS) || "{}");
  await abrir(); await irA("compras"); await tocar($("comprasShowAll"));
  const despues = doc().querySelector('#comprasList [data-shop-key="' + clave + '"]');
  ok("C1-2 los tachados sobreviven a recargar", !!guardados[semana()] && guardados[semana()].t.includes(clave) && !!despues && despues.checked && ev("comprasDone")[clave] === true, clave);
  // Una semana nueva empieza sin tachados; lo de semanas anteriores queda guardado.
  const viejo = { "2020-01-06": { t: ["papa"], c: [] } };
  localStorage.setItem(CHECKS, JSON.stringify(viejo)); await abrir();
  ok("C1-2b cada semana empieza sin tachados y no se escribe al mostrar", Object.keys(ev("comprasDone")).length === 0 && localStorage.getItem(CHECKS) === JSON.stringify(viejo));

  // C1-3 Con rutina, el armado de almuerzo o cena no pregunta "¿Entrenás hoy?" y arranca en Verduras
  cargar({ miPlatoFacil_trainingWeek: JSON.stringify({ version: 1, days: [1, 2, 3, 4, 5] }) }); await abrir();
  await irA("hoy"); await tocar(q('#home [data-start="plato"]'));
  const p3 = pantalla(), chip = doc().querySelector("#lunch_veg [data-day-chip]"), hoyEntrena = w.trainingDayForDate(new Date());
  ok("C1-3 con rutina, el armado no pregunta \"¿Entrenás hoy?\" y arranca en Verduras", p3 === "lunch_veg" && !!chip && !chip.hidden && chip.textContent.includes(hoyEntrena ? "entrenamiento" : "libre") && ev("state.day") === (hoyEntrena ? "Día de entrenamiento" : "Día libre") && $("bottom").classList.contains("is-visible"), p3);
  await tocar(chip);
  ok("C1-3b el chip cambia el día sin salir del paso", pantalla() === "lunch_veg" && ev("state.day") === (hoyEntrena ? "Día libre" : "Día de entrenamiento") && $("vegHint").textContent.startsWith(hoyEntrena ? "1/2" : "1/3"));
  cargar({}); await abrir(); await irA("hoy"); await tocar(q('#home [data-start="plato"]'));
  ok("C1-3c sin rutina, pregunta como antes", pantalla() === "day");
  // Desde un hueco de la Semana se usa la rutina de ese día (solo los lunes se entrena)
  cargar({ miPlatoFacil_trainingWeek: JSON.stringify({ version: 1, days: [1] }) }); await abrir(); await irA("semana");
  // v15.1: se arma desde "Armar nueva" del Selector de la comida (día → comida → Armar nueva).
  await tocar(q('#planDias [data-plan-dia="lunes"]')); await tocar(q('[data-hueco="lunes|almuerzo"]'));
  await tocar(q('.hoja [data-start="plato"][data-start-day="lunes"]'));
  const diaLunes = ev("state.day"); await irA("semana"); await irA("semana");
  await tocar(q('#planDias [data-plan-dia="martes"]')); await tocar(q('[data-hueco="martes|almuerzo"]'));
  await tocar(q('.hoja [data-start="plato"][data-start-day="martes"]'));
  ok("C1-3d el armado desde un hueco de la Semana usa la rutina de ese día", diaLunes === "Día de entrenamiento" && ev("state.day") === "Día libre" && pantalla() === "lunch_veg", diaLunes + " / " + ev("state.day"));

  // C1-4 50 sugerencias seguidas de almuerzo o cena salen del catálogo o de tus comidas
  cargar(R.data); await abrir();
  const catalogo = new Set(ev("data.menuCatalog.map(x=>x.text)")), mias = new Set(w.loadSaved().filter(x => x.type === "plato").map(x => x.id));
  const fuera = []; let deMias = 0;
  for (let i = 0; i < 50; i++) { const s = w.elegirSugerencia(i % 2 ? "almuerzo" : "cena"); if (s && s.tipo === "mia") deMias++; if (!s || !(s.tipo === "idea" ? catalogo.has(s.idea.text) : mias.has(s.item.id))) fuera.push(s ? JSON.stringify(s).slice(0, 80) : "nada") }
  ok("C1-4 50 sugerencias seguidas de almuerzo o cena salen del catálogo o de tus comidas", !fuera.length, fuera.slice(0, 3).join(" | ") || deMias + " de tus comidas");
  const libres = w.sugerenciasPara("almuerzo", "Día libre").filter(x => x.tipo === "mia"), entreno = w.sugerenciasPara("almuerzo", "Día de entrenamiento").filter(x => x.tipo === "mia");
  ok("C1-4b con rutina, tus comidas de otro tipo de día no salen", libres.length > 0 && entreno.length > 0 && libres.every(x => x.item.state.day === "Día libre") && entreno.every(x => x.item.state.day === "Día de entrenamiento") && ![...libres, ...entreno].some(x => x.item.recipeSourceId));
  await irA("hoy"); await tocar(q('#home [data-open-azar]'));
  await tocar(q('#azar [data-random-type="plato"]'));
  const nombre = ev("state.nombreSugerido");
  ok("C1-4c \"Sugerir al azar\" muestra una idea del catálogo o una comida tuya, con su nombre", pantalla() === "resumen" && (catalogo.has(nombre) || w.loadSaved().some(x => w.mealName(x) === nombre)) && ev("state.verduras.length + state.almidones.length + state.proteinas.length + state.legCarb.length + state.legProt.length") > 0, nombre);
  await tocar(q('#azar [data-random-type="desayuno"]'));
  ok("C1-4d \"Sugerir al azar\" de desayuno elige una fruta real", ev("data.frutas.some(f => f[0] === state.fruta.name) && data.frutaFormas.includes(state.fruta.forma)"), ev("JSON.stringify(state.fruta)"));
  localStorage.setItem("miPlatoFacil_recipePreferences_v1", JSON.stringify({ enabled: true, words: "a, e, ra, la, ta, na, ca, de, es, on, an, en, or, er, ar, pa, po, ll, ro, to, ma, co, ri, ce, li, ga, za, ne, bo, ho" }));
  await irA("hoy"); await tocar(q('#home [data-open-azar]'));
  const antes = ev("JSON.stringify(state)");
  await tocar(q('#azar [data-random-type="plato"]'));
  ok("C1-4e si las preferencias dejan sin ideas, se avisa y nunca se combinan ingredientes sueltos", w.sugerenciasPara("almuerzo", "").length === 0 && pantalla() === "azar" && /No hay ideas que no tengan lo que evitás/.test($("azarStatus").textContent) && ev("JSON.stringify(state)") === antes, $("azarStatus").textContent);

  // E1-2 Nombres sin repetir en los selectores
  cargar(R.data); await abrir();
  const etiquetas = [...w.mealLabels(w.loadSaved()).values()];
  const dobles = [{ id: "d1", type: "plato", title: "Almuerzo / Cena · Día libre", lines: [], state: { type: "plato", day: "Día libre", verduras: [{ name: "Tomate" }], almidones: [{ name: "Papa" }], proteinas: [{ name: "Merluza" }], legCarb: [], legProt: [] } }, { id: "d2", type: "plato", title: "Almuerzo / Cena · Día de entrenamiento", lines: [], state: { type: "plato", day: "Día de entrenamiento", verduras: [{ name: "Tomate" }], almidones: [{ name: "Papa" }], proteinas: [{ name: "Merluza" }], legCarb: [], legProt: [] } }, { id: "d3", type: "plato", title: "x", note: "Merluza con papa y tomate", lines: [] }];
  const e2 = [...w.mealLabels(dobles).values()];
  // v15.1: los nombres de "Mis comidas" en el Selector de la cena del lunes (antes, las opciones del select).
  await irA("semana"); await tocar(q('#planDias [data-plan-dia="lunes"]')); await tocar(q('[data-hueco="lunes|cena"]'));
  if (!doc().querySelector(".hoja [data-selector-id]")) await tocar(q(".hoja [data-hueco-cambiar]"));
  const opciones = [...doc().querySelectorAll('.hoja [data-selector-seccion="mias"] .selector-item__nombre')].map(o => o.textContent);
  ok("E1-2 ningún selector repite nombres de comidas", new Set(etiquetas.map(norm)).size === etiquetas.length && !etiquetas.some(e => /^(desayuno \/ merienda|almuerzo \/ cena)/.test(norm(e))) && new Set(e2.map(norm)).size === 3 && e2[0] === "Merluza con papa y tomate · día libre" && opciones.length > 3 && new Set(opciones).size === opciones.length, e2.join(" | ") + " || " + opciones.slice(0, 4).join(" | "));

  // E1-3 Respaldo: la clave nueva entra como opcional; uno viejo sin ella no la toca; una inválida se rechaza
  localStorage.setItem(CHECKS, JSON.stringify({ [semana()]: { t: ["tomate"], c: ["papa"] } }));
  const snap = w.completeBackupSnapshot(localStorage);
  let err = null; try { w.validateCompleteBackup(JSON.parse(JSON.stringify(snap))) } catch (e) { err = e.message }
  localStorage.removeItem(CHECKS);
  const sinChecks = w.completeBackupSnapshot(localStorage);
  ok("E1-3 el respaldo lleva los tachados y es válido; sin tachados no agrega la clave", err === null && snap.data[CHECKS] === JSON.stringify({ [semana()]: { t: ["tomate"], c: ["papa"] } }) && !(CHECKS in sinChecks.data), err);
  const propios = JSON.stringify({ [semana()]: { t: ["tomate"], c: [] } });
  localStorage.setItem(CHECKS, propios);
  w.restoreCompleteBackup(JSON.parse(JSON.stringify(R)), localStorage);
  ok("E1-4 restaurar un respaldo viejo (sin tachados) no los toca", localStorage.getItem(CHECKS) === propios);
  const malos2 = [{ "no-es-fecha": { t: [], c: [] } }, { "2026-10-26": ["tomate"] }, { "2026-10-26": { t: [1], c: [] } }, JSON.parse('{"__proto__":{"t":[],"c":[]}}')].map(v => { const m = JSON.parse(JSON.stringify(R)); m.data[CHECKS] = JSON.stringify(v); try { w.validateCompleteBackup(m); return "aceptado" } catch (e) { return "rechazado" } });
  ok("E1-5 un respaldo con tachados inválidos se rechaza", malos2.every(x => x === "rechazado"), malos2.join(","));

  // E1-6 "Lo compré" pasa a "Ya en tu despensa" y ahí queda toda la semana; destachar lo devuelve sin tocar la despensa
  cargar({}); await abrir();
  const tp = { id: "t1", savedAt: "2026-10-26T10:00:00.000Z", type: "plato", title: "Almuerzo / Cena · Día libre", lines: [], sig: "t1", text: "t1", cooked: 0, state: { type: "plato", day: "Día libre", verduras: [{ name: "Tomate" }], almidones: [{ name: "Papa" }], proteinas: [{ name: "Merluza" }], legCarb: [], legProt: [] } };
  localStorage.setItem("miPlatoFacil_saved", JSON.stringify([tp])); localStorage.setItem("miPlatoFacil_plan", plan([["lunes", "almuerzo", "t1"]]));
  await irA("compras");
  await tocar(q('#comprasList [data-shop-key="tomate"]')); await tocar($("comprasBought"));
  const grupo = n => w.shoppingDisplayItems().find(x => x.name === n).group;
  const enDespensa = JSON.parse(localStorage.getItem("miPlatoFacil_pantry") || "[]").includes("tomate");
  localStorage.setItem("miPlatoFacil_pantry", "[]"); ev("pantrySel = loadPantry()"); ev("renderCompras()");
  const sigue = grupo("Tomate") === "comprado" && /Ya en tu despensa \(1\)/.test($("comprasList").textContent);
  const pantryAntes = localStorage.getItem("miPlatoFacil_pantry");
  await tocar(q('#comprasList details.shop-group [data-shop-key="tomate"]'));
  ok("E1-6 'Lo compré' pasa a Ya en tu despensa y ahí queda; destachar lo devuelve sin tocar la despensa", enDespensa && sigue && grupo("Tomate") === "pendiente" && localStorage.getItem("miPlatoFacil_pantry") === pantryAntes && JSON.parse(localStorage.getItem(CHECKS) || "{}")[semana()] === undefined);
  // E1-6b Si la despensa ya alcanzaba ("Ya tenés"), "Lo compré" no suma nada: no infla las existencias
  cargar({}); await abrir();
  const IDEA = "Arroz de prueba";
  localStorage.setItem("miPlatoFacil_recipeAmounts_v1", JSON.stringify({ [IDEA]: { yield: 1, rows: [{ name: "Arroz", quantity: 300, unit: "g" }] } }));
  localStorage.setItem("miPlatoFacil_recipeDetails_v1", JSON.stringify({ recipe_prueba01: { id: "recipe_prueba01", title: IDEA, sourceTitle: null, amountsTitle: IDEA, steps: ["Cocinar"], notes: "" } }));
  localStorage.setItem("miPlatoFacil_saved", JSON.stringify([{ id: "r1", savedAt: "2026-10-26T10:00:00.000Z", type: "plato", title: IDEA, lines: [], sig: "recipe-ref:recipe_prueba01:plato", text: IDEA, cooked: 0, state: null, recipeSourceId: "recipe_prueba01", recipeIngredients: ["Arroz"] }]));
  localStorage.setItem("miPlatoFacil_plan", plan([["lunes", "almuerzo", "r1"]]));
  localStorage.setItem("miPlatoFacil_pantryQuantities_v1", JSON.stringify({ [w.stockKey("Arroz", "g")]: { name: "Arroz", unit: "g", quantity: 500 } }));
  await irA("compras");
  const stockAntes = localStorage.getItem("miPlatoFacil_pantryQuantities_v1"), grupoArroz = w.shoppingDisplayItems().find(x => x.name === "Arroz").group;
  ev("comprasDone['arroz'] = true"); await tocar($("comprasBought"));
  ok("E1-6b si la despensa ya alcanzaba, Lo compré no suma nada a las existencias", grupoArroz === "tenes" && localStorage.getItem("miPlatoFacil_pantryQuantities_v1") === stockAntes && w.shoppingDisplayItems().find(x => x.name === "Arroz").group === "comprado", grupoArroz + " · " + localStorage.getItem("miPlatoFacil_pantryQuantities_v1"));

  // E1-7 Las ideas se pueden tocar: detalle con Guardar y Agregar a la semana (con Deshacer si reemplaza)
  cargar({}); await abrir(); await irA("hoy");
  await tocar(q('#home [data-open-ideas]'));
  const idea = ev("data.menuCatalog[0]"), sinBarra = pantalla() === "ideas" && !$("bottom").classList.contains("is-visible") && !doc().getElementById("adviceFab");
  await tocar(q('#menuIdeas [data-idea-open]'));
  const hojaOk = ev("hoja.abierta()") && $("hojaTitulo").textContent === idea.text && /Lleva:/.test(ev("hoja.elemento").textContent);
  $("hojaIdeaDia").value = "martes"; $("hojaIdeaComida").value = "cena";
  await tocar([...ev("hoja.elemento").querySelectorAll("button")].find(b => b.textContent === "Agregar a la semana"));
  const asignada = w.loadPlan().martes.cena, guardada = w.loadSaved().find(x => x.id === asignada);
  ok("E1-7 una idea abre su detalle y se agrega a la semana como una comida armada", sinBarra && hojaOk && !!guardada && guardada.note === idea.text && guardada.type === "plato" && guardada.state.verduras.length > 0 && guardada.lines.length === 3 && w.shoppingPlanItems().length > 0 && /Agregada/.test(ev("hoja.estado").textContent));
  ev("hoja.cerrar()");
  await tocar(q('#menuIdeas li:nth-child(2) [data-idea-open]'));
  $("hojaIdeaDia").value = "martes"; $("hojaIdeaComida").value = "cena";
  await tocar([...ev("hoja.elemento").querySelectorAll("button")].find(b => b.textContent === "Agregar a la semana"));
  const reemplazo = w.loadPlan().martes.cena !== asignada, deshacer = ev("hoja.estado").querySelector("button");
  if (deshacer) await tocar(deshacer);
  ok("E1-8 si reemplaza algo, se puede deshacer", reemplazo && !!deshacer && w.loadPlan().martes.cena === asignada && w.loadPlanHistory().length >= 3);
  ev("hoja.cerrar()");
  await irA("mas"); await tocar(q('#home [data-open-pantry]'));
  await tocar(q('#pantryChips [data-pantry-toggle="pollo"]'));
  await tocar(q('#pantryResults [data-idea-open]'));
  ok("E1-9 las ideas de \"Con lo que tengo\" también se pueden tocar", ev("hoja.abierta()") && ev("data.menuCatalog").some(x => x.text === $("hojaTitulo").textContent));
  ev("hoja.cerrar()");

  // E1-10 Asistente de IA en pantalla propia, campos con el estilo del sistema (claro y oscuro), barra de pasos solo en el armado
  const estilos = [];
  for (const tema of ["light", "dark"]) {
    localStorage.setItem("miPlatoFacil_theme", tema); ev("applyTheme()");
    for (const [ir, id] of [["asistente", "aiKeyInput"], ["backupScreen", "backupFile"], ["ideas", "menuSearchInput"]]) {
      ev('go("' + ir + '")'); await espera(60);
      const e = $(id), cs = w.getComputedStyle(e), sup = w.getComputedStyle(doc().documentElement).getPropertyValue("--surface").trim();
      estilos.push([tema, id, Math.round(e.getBoundingClientRect().height) >= 44 && cs.borderTopStyle !== "none" && cs.backgroundColor !== "rgba(0, 0, 0, 0)" && (tema === "light" || cs.backgroundColor !== "rgb(255, 255, 255)"), $("bottom").classList.contains("is-visible")]);
    }
  }
  localStorage.removeItem("miPlatoFacil_theme"); ev("applyTheme()");
  ok("E1-10 campos con el estilo del sistema en claro y oscuro, y sin barra de pasos fuera del armado", estilos.every(x => x[2] && !x[3]) && !$("backupScreen").contains($("aiKeyInput")), JSON.stringify(estilos.filter(x => !x[2] || x[3])));

  // E1-11 En Almidones, harinas, féculas y pan rallado están en "Más opciones" (plegado)
  const mas = q("#boxa details.almidones-mas"), enMas = [...mas.querySelectorAll("[data-multi]")].map(b => b.dataset.name), afuera = [...doc().querySelectorAll("#boxa > [data-multi]")].map(b => b.dataset.name);
  ok("E1-11 en Almidones, harinas, féculas y pan rallado pasan a Más opciones", !mas.open && enMas.length === 7 && enMas.every(n => /^(Harina|Fécula|Pan rallado)/.test(n)) && !afuera.some(n => /^(Harina|Fécula|Pan rallado)/.test(n)) && afuera.includes("Papa"));

  marco.remove();
  localStorage.clear();
  return T;
})()
