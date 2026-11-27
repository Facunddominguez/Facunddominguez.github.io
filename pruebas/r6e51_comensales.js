// R6 · Etapa 51 (Quién come en cada comida): ítems Q-01 a Q-05 de docs/ronda-6-lista.md.
// Fecha fija: lunes 23/11/2026 (la lista "Esta semana" cuenta de hoy al domingo, así entra el lunes).
(async () => {
  const H = R6H(), { ok, espera } = H;
  const tocar = async (el, ms) => { if (!el) throw new Error("no hay elemento para tocar · tras " + H.T.length + " pruebas"); return H.tocar(el, ms) };
  const ev = x => H.ev(x), doc = () => H.doc();
  const $ = id => doc().getElementById(id);
  const qa = s => [...doc().querySelectorAll(s)];
  const norm = H.norm, J = H.J, visible = H.visible;
  const CLAVE = "miPlatoFacil_comensales_v1", HOGAR = "miPlatoFacil_hogar_v1";
  const REC = [
    { id: "recipe_com51a", titulo: "Arroz con lentejas de la casa", filas: [{ name: "Arroz", quantity: 100, unit: "g" }, { name: "Lentejas", quantity: 60, unit: "g" }] },
    { id: "recipe_com51b", titulo: "Tarta de zapallito casera", filas: [{ name: "Zapallito", quantity: 2, unit: "unidad" }, { name: "Huevo", quantity: 1, unit: "unidad" }] },
  ];
  const A = "rp_recipe_com51a", B = "rp_recipe_com51b";
  const base = (extra = {}, slots) => ({ ...H.MARCA, ...H.recetas(REC), miPlatoFacil_plan: JSON.stringify(H.planDe(slots || [["lunes", "almuerzo", A], ["lunes", "cena", B], ["martes", "almuerzo", A]])), ...extra });
  const abrir = async (extra, slots) => { await H.abrirEn("2026-11-23", base(extra, slots)) };
  const irAPrefs = async () => { ev('ModoSimple.setUiMode("completo"); openTab("mas"); go("preferencias")'); await espera(400) };
  // Preferencias → "Quién come en casa" abre una hoja con los selectores (los de siempre, más chicos y la grilla).
  const prefs = async () => { await irAPrefs(); await tocar($("comensalesAbrir"), 400) };
  const cambiar = async (el, valor) => { el.value = valor; el.dispatchEvent(new Event("change", { bubbles: true })); await espera(200) };
  // Cantidad de arroz (g) en la lista de esta semana, y en las filas del presupuesto.
  const arroz = () => JSON.parse(ev(`JSON.stringify((() => { const e = Compras.shoppingPlanItems("esta").find(x => x.key === ingredientKey("Arroz")); return e ? [...e.units.entries()] : null })())`));
  const arrozPresupuesto = () => ev(`(() => { const r = shoppingMissingRows().find(x => ingredientKey(x.name) === ingredientKey("Arroz")); return r ? r.quantity : null })()`);
  const g = a => a && (a.find(x => x[0] === "g") || [0, null])[1];

  // ---- Q-04 primero: sin configurar nada, todo igual que antes ----
  await abrir({ [HOGAR]: JSON.stringify({ personas: 3 }) });
  ok("R6-Q-04 sin la clave nueva, las porciones son las de hogar_v1 (3) y la lista da 3 veces la receta (lunes y martes: 600 g de arroz)", ev("Comensales.configurado()") === false && ev("personasHogar()") === 3 && g(arroz()) === 600 && arrozPresupuesto() === 100 * 2, JSON.stringify([arroz(), arrozPresupuesto()]));
  await prefs();
  ok("R6-Q-04 mirar Preferencias no escribe ninguna clave nueva y muestra los adultos de hogar_v1 (3) y 0 chicos", localStorage.getItem(CLAVE) === null && $("hogarPersonas").value === "3" && $("comensalesChicos").value === "0" && J(HOGAR).personas === 3);
  await cambiar($("hogarPersonas"), "4");
  ok("R6-Q-04 sin chicos, cambiar los adultos sigue escribiendo hogar_v1 (formato de siempre) y no la clave nueva", JSON.stringify(J(HOGAR)) === '{"personas":4}' && localStorage.getItem(CLAVE) === null && ev("personasHogar()") === 4);
  await abrir({});
  await irAPrefs();
  ok("R6-Q-01 Preferencias muestra una sola línea 'Quién come en casa' con el resumen ('1 persona' sin nada cargado) y abre la hoja con un botón de al menos 44 px", /Quién come en casa/.test(norm($("comensalesAbrir").innerText)) && norm($("comensalesResumen").textContent) === "1 persona" && $("comensalesAbrir").getBoundingClientRect().height >= 43.5 && !$("hogarPersonas"));
  ok("R6-Q-04 sin nada cargado (ni hogar_v1) cada comida cuenta 1 porción y la lista da lo de la receta (200 g)", ev("personasHogar()") === 1 && g(arroz()) === 200 && arrozPresupuesto() === 200);

  // ---- Q-01: adultos y chicos ----
  await abrir({});
  await prefs();
  const etiquetas = qa(".hoja label").map(l => norm(l.textContent));
  ok("R6-Q-01 donde se elegía 'Personas en el hogar' hay 'Adultos' y 'Chicos', y un chico cuenta 0,5 de porción por defecto", etiquetas.includes("Adultos") && etiquetas.includes("Chicos") && etiquetas.includes("Un chico cuenta") && $("comensalesPorcionChico").value === "0.5" && visible($("comensalesChicos")), JSON.stringify(etiquetas));
  await cambiar($("hogarPersonas"), "2");
  await cambiar($("comensalesChicos"), "1");
  ok("R6-Q-01 con 2 adultos y 1 chico dice 'Cada comida cuenta 2,5 porciones.' y guarda la clave nueva", /Cada comida cuenta 2,5 porciones\./.test(norm($("comensalesTotal").textContent)) && JSON.stringify(J(CLAVE)) === '{"adultos":2,"chicos":1,"porcionChico":0.5}' && ev("personasHogar()") === 2.5, localStorage.getItem(CLAVE));
  const opts = [...$("comensalesPorcionChico").options].map(o => o.value);
  await cambiar($("comensalesPorcionChico"), "0.25");
  ok("R6-Q-01 lo que cuenta un chico se edita de 0,25 a 1 (0,25 / 0,5 / 0,75 / 1) y 2 adultos + 1 chico pasan a 2,25", opts.join() === "0.25,0.5,0.75,1" && ev("personasHogar()") === 2.25 && J(CLAVE).porcionChico === 0.25);
  await cambiar($("comensalesPorcionChico"), "1");
  ok("R6-Q-01 con 1 porción por chico son 3", ev("personasHogar()") === 3);
  await cambiar($("comensalesPorcionChico"), "0.5");
  await cambiar($("hogarPersonas"), "3");
  ok("R6-Q-01 con la clave nueva cargada, cambiar los adultos la actualiza y no toca hogar_v1 (que queda como estaba: 2 personas)", J(CLAVE).adultos === 3 && JSON.stringify(J(HOGAR)) === '{"personas":2}' && ev("personasHogar()") === 3.5);
  const alturas = [$("hogarPersonas"), $("comensalesChicos"), $("comensalesPorcionChico")].map(s => s.getBoundingClientRect().height);
  await H.cerrarHoja(); await espera(200);
  ok("R6-Q-01 la línea de Preferencias se actualiza: '3 adultos y 1 chico · 3,5 porciones'", norm($("comensalesResumen").textContent) === "3 adultos y 1 chico · 3,5 porciones", norm($("comensalesResumen").textContent));
  await tocar($("comensalesAbrir"), 400);
  ok("R6-Q-01 los tres selectores miden al menos 44 px de alto", alturas.every(h => h >= 43.5), JSON.stringify(alturas));

  // ---- Q-03: 2 adultos y 1 chico = 2,5 porciones en la lista, ficha, costo y presupuesto; el hueco con 1 suma 1 ----
  await abrir({ [CLAVE]: JSON.stringify({ adultos: 2, chicos: 1, porcionChico: 0.5 }) });
  ok("R6-Q-03 2 adultos y 1 chico dan 2,5 porciones: la lista suma 2,5 × 100 g en el almuerzo del lunes y 2,5 × 100 g en el del martes (500 g)", ev("Comensales.base()") === 2.5 && g(arroz()) === 500 && arrozPresupuesto() === 500, JSON.stringify([arroz(), arrozPresupuesto()]));
  await abrir({ [CLAVE]: JSON.stringify({ adultos: 2, chicos: 1, porcionChico: 0.5, huecos: { "lunes|almuerzo": 1 } }) });
  ok("R6-Q-03 con el almuerzo del lunes en 1, esa comida suma 1 porción a la lista (100 g) y el del martes 2,5 (250 g): 350 g", g(arroz()) === 350 && arrozPresupuesto() === 350, JSON.stringify([arroz(), arrozPresupuesto()]));
  const costo = () => ev(`(() => { const a = cantidadesDeComida("plato", ${JSON.stringify(A)}); return costoDeFilas(a.rows, porcionesEn("lunes", "almuerzo")).costo })()`);
  const costoDia = () => ev('costoDelDiaPlan("lunes")');
  await abrir({ [CLAVE]: JSON.stringify({ adultos: 2, chicos: 1, porcionChico: 0.5 }) });
  const c25 = costoDia();
  await abrir({ [CLAVE]: JSON.stringify({ adultos: 2, chicos: 1, porcionChico: 0.5, huecos: { "lunes|almuerzo": 1, "lunes|cena": 1 } }) });
  const c1 = costoDia();
  ok("R6-Q-03 el costo del día usa las porciones de cada hueco (con los dos huecos del lunes en 1 cuesta 1/2,5 de lo que con 2,5)", c25 > 0 && Math.abs(c1 / c25 - 1 / 2.5) < 0.02, JSON.stringify([c25, c1]));
  await abrir({ [CLAVE]: JSON.stringify({ adultos: 2, chicos: 1, porcionChico: 0.5, huecos: { "lunes|almuerzo": 0 } }) }, [["lunes", "almuerzo", A], ["martes", "almuerzo", A]]);
  ok("R6-Q-03 y con el almuerzo del lunes en 0 esa comida no suma: queda solo el del martes (250 g) y su costo del día es 0", g(arroz()) === 250 && costoDia() === 0, JSON.stringify([arroz(), costoDia()]));
  // Ficha de una comida del catálogo: cantidades de ese hueco
  await abrir({ [CLAVE]: JSON.stringify({ adultos: 2, chicos: 1, porcionChico: 0.5, huecos: { "lunes|almuerzo": 1 } }) }, []);
  ev('IdeasHoja.agregarIdeaALaSemana(data.menuCatalog.find(x => x.corto === "Pollo al horno con papas y batatas"), "lunes", "almuerzo"); IdeasHoja.agregarIdeaALaSemana(data.menuCatalog.find(x => x.corto === "Pollo al horno con papas y batatas"), "martes", "almuerzo")');
  const idPollo = ev('(loadPlan().lunes || {}).almuerzo');
  ev(`openTab("miscomidas"); Comidas.abrirComida("plato", ${JSON.stringify(idPollo)}, { dia: "lunes", slot: "almuerzo" })`); await espera(400);
  const fichaLunes = norm(($("comidaComponentes") || { innerText: "" }).innerText) || norm(doc().body.innerText);
  ev(`Comidas.abrirComida("plato", ${JSON.stringify(idPollo)}, { dia: "martes", slot: "almuerzo" })`); await espera(400);
  const fichaMartes = norm(($("comidaComponentes") || { innerText: "" }).innerText) || norm(doc().body.innerText);
  ok("R6-Q-03 la ficha abierta desde el almuerzo del lunes (1 porción) muestra 180 g de pollo y desde el del martes (2,5) 450 g", /Pollo · 180 g/.test(fichaLunes) && /Pollo · 450 g/.test(fichaMartes), fichaLunes.slice(0, 120) + " | " + fichaMartes.slice(0, 120));

  // ---- Q-02: la grilla ----
  await abrir({});
  await prefs();
  const celdas = qa("#comensalesGrilla [data-comensales-hueco]");
  ok("R6-Q-02 Preferencias tiene una grilla con un selector por cada comida de cada día (7 × 4), de al menos 44 px, con 'Todos' por omisión", celdas.length === 28 && celdas.every(c => c.getBoundingClientRect().height >= 43.5 && c.value === "") && /Todos/.test(celdas[0].options[0].text) && visible($("comensalesGrilla")), String(celdas.length));
  ok("R6-Q-02 mirar la grilla no escribe nada", localStorage.getItem(CLAVE) === null);
  await cambiar(qa("[data-comensales-hueco='sabado|cena']")[0], "0");
  ok("R6-Q-02 un hueco en 0 dice 'Nadie come en casa' (en la grilla, y se guarda en la clave nueva)", /Nadie come en casa: cena del sábado\./.test(norm($("comensalesEstado").textContent)) && J(CLAVE).huecos["sabado|cena"] === 0, localStorage.getItem(CLAVE));
  await cambiar($("comensalesAtajo"), "1");
  const huecos = J(CLAVE).huecos;
  ok("R6-Q-02 el atajo 'Almuerzos de lunes a viernes: 1' llena los cinco almuerzos de lunes a viernes con 1 y no toca los demás", ["lunes", "martes", "miercoles", "jueves", "viernes"].every(d => huecos[d + "|almuerzo"] === 1) && huecos["sabado|cena"] === 0 && !("sabado|almuerzo" in huecos) && qa("[data-comensales-hueco='jueves|almuerzo']")[0].value === "1" && $("comensalesAtajo").value === "1");
  await cambiar($("comensalesAtajo"), "");
  ok("R6-Q-02 y 'Todos' en el atajo los saca (vuelven a las porciones de cada comida)", !("lunes|almuerzo" in J(CLAVE).huecos) && J(CLAVE).huecos["sabado|cena"] === 0);
  // Semana y Hoy
  await abrir({ [CLAVE]: JSON.stringify({ adultos: 2, chicos: 0, porcionChico: 0.5, huecos: { "lunes|almuerzo": 0, "lunes|desayuno": 0 } }) });
  ev('openTab("semana"); Semana.elegirDiaPlan("lunes"); renderPlan()'); await espera(300);
  const hAlm = qa("[data-hueco='lunes|almuerzo']")[0], hDes = qa("[data-hueco='lunes|desayuno']")[0];
  ok("R6-Q-02 en Semana, el almuerzo del lunes (con comida) y el desayuno (vacío) dicen 'Nadie come en casa'", /Nadie come en casa/.test(norm(hAlm.innerText)) && /Nadie come en casa/.test(norm(hDes.innerText)) && !/Sin elegir/.test(norm(hDes.innerText)));
  ev('openTab("hoy")'); await espera(300);
  ok("R6-Q-02 en Hoy el almuerzo y el desayuno también lo dicen", /Nadie come en casa/.test(norm(qa("[data-today-slot='almuerzo']")[0].innerText)) && /Nadie come en casa/.test(norm(qa("[data-today-slot='desayuno']")[0].innerText)));
  ok("R6-Q-02 en Hoy, donde nadie come en casa no hay 'Lo comí' que anotar (el almuerzo y el desayuno sin botón) y las demás comidas sí lo tienen", !qa("[data-today-slot='almuerzo'] [data-today-eaten]").length && !qa("[data-today-slot='desayuno'] [data-today-eaten]").length);
  // Los avisos de Hoy no miran donde nadie come
  await abrir({ [CLAVE]: JSON.stringify({ adultos: 2, chicos: 0, porcionChico: 0.5, huecos: { "martes|cena": 0 } }) }, [["martes", "cena", A]]);
  ev('openTab("hoy")'); await espera(300);
  ok("R6-Q-02 'Para comprar hoy' no cuenta la cena de hoy si nadie come en casa (y sin ese hueco en 0 sí la cuenta)", !qa("[data-hoy-comprar-hoy]").length);
  await abrir({ [CLAVE]: JSON.stringify({ adultos: 2, chicos: 0, porcionChico: 0.5 }) }, [["lunes", "cena", A]]);
  ev('openTab("hoy")'); await espera(300);
  ok("R6-Q-02 (control) con la misma cena y sin el hueco en 0, 'Para comprar hoy' aparece", qa("[data-hoy-comprar-hoy]").length === 1);
  // Armame no llena donde nadie come
  await abrir({ [CLAVE]: JSON.stringify({ adultos: 2, chicos: 0, porcionChico: 0.5, huecos: { "lunes|cena": 0 } }) }, []);
  ev('openTab("semana")'); await espera(200);
  await ev('(async () => { await ArmameSemana.correr("todo") })()'); await espera(600);
  const pl = J("miPlatoFacil_plan");
  ok("R6-Q-02 Armame no llena la cena del lunes (nadie come en casa) y sí las demás", !pl.lunes.cena && !!pl.lunes.almuerzo && !!pl.martes.cena, JSON.stringify(pl.lunes));

  // ---- Q-05: Bienvenida ----
  await abrir({});
  ev("bienvenidaPaso = 3"); 
  const sel = { adultos: $("bienvenidaPersonas"), chicos: $("bienvenidaChicos") };
  ok("R6-Q-05 el paso del hogar de la Bienvenida pregunta adultos y chicos (opcional)", sel.adultos && sel.chicos && qa("#bienvenida label[for=bienvenidaPersonas],#bienvenida label[for=bienvenidaChicos]").map(l => norm(l.textContent)).join() === "Adultos,Chicos" && sel.chicos.value === "0" && /opcional/i.test(norm(qa('#bienvenida [data-bienvenida-paso="3"] .screen__hint')[0].textContent)));
  sel.adultos.value = "2"; sel.chicos.value = "1";
  ev("Bienvenida.guardarHogarDeBienvenida()"); await espera(200);
  ok("R6-Q-05 al guardar con 2 adultos y 1 chico se escribe la clave nueva (2,5 porciones) y hogar_v1 no se toca", JSON.stringify(J(CLAVE)) === '{"adultos":2,"chicos":1,"porcionChico":0.5}' && localStorage.getItem(HOGAR) === null && ev("personasHogar()") === 2.5, localStorage.getItem(CLAVE));
  await abrir({});
  ev("bienvenidaPaso = 3"); $("bienvenidaPersonas").value = "3"; ev("Bienvenida.guardarHogarDeBienvenida()"); await espera(200);
  ok("R6-Q-05 sin chicos se guarda como siempre (hogar_v1 con 3 personas) y la clave nueva no se escribe", JSON.stringify(J(HOGAR)) === '{"personas":3}' && localStorage.getItem(CLAVE) === null);

  // Volver a correr la Bienvenida con la clave ya cargada no pisa los huecos
  await abrir({ [CLAVE]: JSON.stringify({ adultos: 2, chicos: 1, porcionChico: 0.75, huecos: { "lunes|almuerzo": 1 } }) });
  ev("bienvenidaPaso = 3"); $("bienvenidaPersonas").value = "3"; $("bienvenidaChicos").value = "2"; ev("Bienvenida.guardarHogarDeBienvenida()"); await espera(200);
  ok("R6-Q-05 si la clave nueva ya estaba cargada, la Bienvenida cambia solo adultos y chicos y conserva lo que cuenta un chico (0,75) y los huecos", JSON.stringify(J(CLAVE)) === '{"adultos":3,"chicos":2,"porcionChico":0.75,"huecos":{"lunes|almuerzo":1}}', localStorage.getItem(CLAVE));
  // La ficha dice las porciones con coma
  await abrir({ [CLAVE]: JSON.stringify({ adultos: 2, chicos: 1, porcionChico: 0.5, huecos: { "lunes|almuerzo": 0 } }) }, []);
  ev('IdeasHoja.agregarIdeaALaSemana(data.menuCatalog.find(x => x.corto === "Pollo al horno con papas y batatas"), "lunes", "almuerzo"); IdeasHoja.agregarIdeaALaSemana(data.menuCatalog.find(x => x.corto === "Pollo al horno con papas y batatas"), "martes", "almuerzo")');
  const idP = ev('(loadPlan().lunes || {}).almuerzo');
  ev(`openTab("miscomidas"); Comidas.abrirComida("plato", ${JSON.stringify(idP)}, { dia: "martes", slot: "almuerzo" })`); await espera(400);
  const t1 = norm(doc().querySelector("#comidaPlato h4").textContent);
  ev(`Comidas.abrirComida("plato", ${JSON.stringify(idP)}, { dia: "lunes", slot: "almuerzo" })`); await espera(400);
  ok("R6-Q-03 la ficha dice 'Qué lleva · para 2,5 porciones' (con coma) y, abierta desde un hueco sin comensales, 'Qué lleva · nadie come en casa'", t1 === "Qué lleva · para 2,5 porciones" && norm(doc().querySelector("#comidaPlato h4").textContent) === "Qué lleva · nadie come en casa", t1);

  // ---- Respaldo ----
  await abrir({});
  const R0 = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json(), w = H.w();
  const conClave = JSON.parse(JSON.stringify(R0)); conClave.data[CLAVE] = JSON.stringify({ adultos: 2, chicos: 1, porcionChico: 0.5, huecos: { "lunes|almuerzo": 1, "sabado|cena": 0 } });
  const malo1 = JSON.parse(JSON.stringify(R0)); malo1.data[CLAVE] = '{"adultos":0,"chicos":1}';
  const malo2 = JSON.parse(JSON.stringify(R0)); malo2.data[CLAVE] = '{"adultos":2,"chicos":0,"huecos":{"lunes|brunch":1}}';
  let r1 = false, r2 = false, r3 = false, r4 = false;
  try { w.Respaldo.restoreCompleteBackup(conClave, w.localStorage); r1 = w.localStorage.getItem(CLAVE) === conClave.data[CLAVE] } catch (e) { }
  const exp = w.eval("completeBackupSnapshot(localStorage)").data;
  try { w.Respaldo.restoreCompleteBackup(JSON.parse(JSON.stringify(R0)), w.localStorage); r2 = true } catch (e) { }
  try { w.Respaldo.restoreCompleteBackup(malo1, w.localStorage) } catch (e) { r3 = true }
  try { w.Respaldo.restoreCompleteBackup(malo2, w.localStorage) } catch (e) { r4 = true }
  ok("R6-Q-02 la clave miPlatoFacil_comensales_v1 entra al respaldo como opcional: se exporta, se restaura, un respaldo viejo sin ella se restaura igual (con su hogar_v1) y los de mal formato se rechazan", r1 && exp[CLAVE] === conClave.data[CLAVE] && r2 && r3 && r4 && w.eval(`COMPLETE_BACKUP_KEYS.includes("${CLAVE}") && COMPLETE_BACKUP_OPTIONAL_KEYS.includes("${CLAVE}")`), JSON.stringify({ r1, r2, r3, r4 }));
  // Con el respaldo de ejemplo sin la clave nueva, lo de siempre
  await H.abrirEn("2026-11-23", JSON.parse(JSON.stringify(R0)).data);
  ok("R6-Q-04 con el respaldo de ejemplo de la v14.9.94 (sin la clave nueva) nada cambia: personas del hogar = las de su hogar_v1 y Comensales no está configurado", ev("Comensales.configurado()") === false && ev("personasHogar()") === (JSON.parse(R0.data[HOGAR] || '{"personas":1}')).personas, String(R0.data[HOGAR]));
  return H.terminar();
})()
