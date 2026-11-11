// R4-29: Etapa 29 de la Ronda 4 ("Cien ideas y una semana que alcanza"). Controles R4-29-cien, R4-29-validas, R4-29-energia,
// R4-29-semana, R4-29-dieta, R4-29-baratas, R4-29-piso, R4-29-bienvenida (más R4-29-armado, R4-29-selector y R4-29-economica) de
// docs/validacion/criterios.json. Datos inventados y precios congelados.
(async () => {
  const T = []; const ok = (n, c, d) => T.push((c ? "PASA " : "FALLA ") + n + (d !== undefined && d !== "" ? " · " + d : ""));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  let marco = null, w = null;
  const abrir = async extra => {
    localStorage.clear(); localStorage.setItem("miPlatoFacil_bienvenida_v1", '{"vista":true}');
    for (const [k, v] of Object.entries(extra || {})) localStorage.setItem(k, v);
    if (marco) marco.remove();
    marco = document.createElement("iframe"); marco.id = "marcoPrueba";
    marco.style.cssText = "position:fixed;left:0;top:0;width:390px;height:844px;border:0;opacity:0;pointer-events:none;z-index:-1";
    document.body.append(marco);
    await new Promise((res, rej) => { marco.onload = res; marco.onerror = rej; marco.src = "/index.html?marco=" + Date.now() });
    await espera(500);
    w = marco.contentWindow; w.confirm = () => true; w.prompt = () => "";
  };
  const ev = x => w.eval(x), doc = () => w.document;
  const PRES = l => ({ miPlatoFacil_shoppingBudget_v1: JSON.stringify({ currency: "ARS", limit: l, period: "semana" }) });
  const HOGAR = n => ({ miPlatoFacil_hogar_v1: JSON.stringify({ personas: n }) });
  const tocar = async el => { el.click(); await espera(220) };

  await abrir();
  const archivo = await (await fetch("/datos/ideas.json", { cache: "no-store" })).json();
  const textos = archivo.ideas.map(i => i.text), cortos = archivo.ideas.map(i => i.corto);
  ok("R4-29-cien datos/ideas.json tiene 100 ideas, 70 de plato y 30 de desayuno, sin text ni corto repetidos",
    archivo.ideas.length === 100 && archivo.ideas.filter(i => i.tipo === "plato").length === 70 && archivo.ideas.filter(i => i.tipo === "desayuno").length === 30 && new Set(textos).size === 100 && new Set(cortos).size === 100,
    archivo.ideas.length + " ideas");

  const an = JSON.parse(ev(`(() => {
    const todas = data.menuCatalog.concat(data.desayunoCatalog), malas = [], fuera = [], BAS = esBasicoDeAlacena;
    for (const i of todas) {
      const d = !!i.desayuno, c = i.cantidades, p = i.pasos, e = d ? [2, 4] : [3, 5];
      if (!i.corto || i.corto.length > 40 || i.corto.includes("+")) malas.push(i.text.slice(0, 30) + ": corto");
      if (!Array.isArray(p) || p.length < e[0] || p.length > e[1] || p.some(s => typeof s !== "string" || !s || s.length > 140)) malas.push(i.text.slice(0, 30) + ": pasos");
      if (!(i.minutos >= 5 && i.minutos <= 90)) malas.push(i.text.slice(0, 30) + ": minutos");
      if (!Array.isArray(c) || c.length < 3 || c.some(f => !Array.isArray(f) || f.length !== 3 || !(f[1] > 0) || !(nutritionFor(f[0]) || Precios.itemDe(f[0])) || BAS(f[0]))) malas.push(i.text.slice(0, 30) + ": cantidades");
      if (d && !(i.desayuno && i.desayuno.fruta && i.desayuno.prot && i.desayuno.cereal)) malas.push(i.text.slice(0, 30) + ": desayuno");
      if (!d && (!i.ingredientes || !Object.values(i.ingredientes).flat().length || !Array.isArray(i.tags))) malas.push(i.text.slice(0, 30) + ": ingredientes");
      if (!d && data.menuCatalog.indexOf(i) >= 41 && i.text.length > 40) malas.push(i.text.slice(0, 30) + ": text de más de 40");
      let kcal = 0, prot = 0;
      for (const [n, q, u] of (c || [])) { const nut = nutritionFor(n), g = gramosDe(n, q, u); if (nut && g !== null) { kcal += nut.v[0] * g / 100; prot += nut.v[1] * g / 100 } }
      const [a, b, pm] = d ? [250, 450, 8] : [450, 850, 18];
      if (kcal < a || kcal > b || prot < pm) fuera.push(i.text.slice(0, 34) + ": " + Math.round(kcal) + " kcal, " + Math.round(prot) + " g");
    }
    return JSON.stringify({ platos: data.menuCatalog.length, desayunos: data.desayunoCatalog.length, malas, fuera }) })()`));
  ok("R4-29-validas las 100 ideas cumplen el formato (los desayunos, de 2 a 4 pasos y con fruta, proteína y cereal; las 29 nuevas, con text de hasta 40 caracteres)",
    an.platos === 70 && an.desayunos === 30 && !an.malas.length, JSON.stringify({ platos: an.platos, desayunos: an.desayunos, malas: an.malas.slice(0, 5) }));
  ok("R4-29-energia cada almuerzo o cena aporta de 450 a 850 kcal y 18 g de proteína o más; cada desayuno o merienda, de 250 a 450 kcal y 8 g o más", !an.fuera.length, JSON.stringify(an.fuera.slice(0, 6)));

  // R4-29-baratas
  const bar = JSON.parse(ev(`(() => JSON.stringify({ platos: data.menuCatalog.filter(i => (Bienvenida.costoPorPorcionDeIdea(i) || 1e9) <= 2500).length, desayunos: data.desayunoCatalog.filter(i => (Bienvenida.costoPorPorcionDeIdea(i) || 1e9) <= 1300).length }))()`));
  ok("R4-29-baratas con los precios congelados, 20 o más almuerzos o cenas cuestan $2.500 o menos por porción y 10 o más desayunos, $1.300 o menos", bar.platos >= 20 && bar.desayunos >= 10, JSON.stringify(bar));

  // R4-29-dieta: con cada filtro, ninguna idea permitida contiene un ingrediente excluido (en sus ingredientes ni en sus cantidades).
  const dieta = JSON.parse(ev(`(() => { const malas = [], res = {};
    for (const f of dietaTabla()) {
      localStorage.setItem(DIETA_KEY, JSON.stringify({ filtros: [f.id] }));
      const permitidas = data.menuCatalog.concat(data.desayunoCatalog).filter(i => dietaPermiteIdea(i));
      res[f.id] = permitidas.length;
      for (const i of permitidas) {
        const nombres = (i.cantidades || []).map(c => c[0]).concat(Object.values(i.ingredientes || {}).flat(), i.desayuno ? [i.desayuno.fruta, i.desayuno.prot, i.desayuno.cereal] : []);
        for (const n of nombres) { const t = " " + normalizeSearchText(n).replace(/[^a-z0-9ñ]+/g, " ").trim() + " "; if (f.palabras.some(p => new RegExp("(?: )(?:" + p + ")(?:s|es)?(?: )").test(t))) malas.push(f.id + ": " + i.text.slice(0, 30) + " → " + n) }
      }
    }
    localStorage.removeItem(DIETA_KEY);
    return JSON.stringify({ malas, res }) })()`));
  ok("R4-29-dieta con cada filtro de dieta activo, ninguna idea permitida contiene un ingrediente excluido (mirando ingredientes y cantidades)", !dieta.malas.length && Object.values(dieta.res).every(n => n >= 10), JSON.stringify({ malas: dieta.malas.slice(0, 4), permitidas: dieta.res }));

  // R4-29-bienvenida
  const bien = JSON.parse(ev(`(() => { const x = Bienvenida.ideasParaArrancar(); return JSON.stringify({ n: x.length, bases: [...new Set(x.map(i => Bienvenida.proteinaBaseDeIdea(i)).filter(Boolean))], largos: x.filter(i => (i.corto || i.text).length > 40).length, costos: x.map(i => Math.round(Bienvenida.costoPorPorcionDeIdea(i))) }) })()`));
  ok("R4-29-bienvenida las 8 ideas de la bienvenida son las más baratas por porción, con 4 proteínas base distintas o más, y ninguna pasa de 40 caracteres", bien.n === 8 && bien.bases.length >= 4 && !bien.largos && Math.max(...bien.costos) <= 2700, JSON.stringify(bien));

  // R4-29-economica: la etiqueta "Económica" aparece en el tercio más barato.
  ev('openTab("miscomidas"); go("ideas")'); await espera(300);
  ev("Ideas.renderMenuIdeas()");
  const eco = JSON.parse(ev(`JSON.stringify({ total: data.menuCatalog.length, eco: data.menuCatalog.filter(i => IdeasHoja.esEconomica(i)).length, ecoD: data.desayunoCatalog.filter(i => IdeasHoja.esEconomica(i)).length })`));
  ok("R4-29-economica 'Económica' marca el tercio más barato de las ideas de cada tipo (de 70 platos, entre 20 y 27; de 30 desayunos, entre 8 y 12)", eco.eco >= 20 && eco.eco <= 27 && eco.ecoD >= 8 && eco.ecoD <= 12, JSON.stringify(eco));

  // R4-29-semana: 1 persona, 10 semillas distintas: de media entre 1.600 y 2.300 kcal por día y ningún día baja de 1.400.
  const dias = [];
  for (let i = 0; i < 10; i++) {
    await abrir();
    dias.push(JSON.parse(ev(`(() => { Semana.semanaActual = () => "2026-0${i < 9 ? 1 : 2}-${String(5 + i).padStart(2, "0")}"; const r = ArmameSemana.armar({ modo: "todo" }), porDia = {}, desayunosDeIdea = r.asignadas.filter(a => (a.slot === "desayuno" || a.slot === "merienda") && a.cand.idea).length;
      for (const a of r.asignadas) { const f = ArmameSemana.filasDe(a.cand, a.dia); let k = 0; if (f) for (const x of f.rows) { const n = nutritionFor(x.name), g = gramosDe(x.name, x.quantity, x.unit); if (n && g !== null) k += n.v[0] * g / 100 } porDia[a.dia] = (porDia[a.dia] || 0) + k }
      return JSON.stringify({ dias: Object.values(porDia).map(Math.round), desayunosDeIdea, llenos: r.llenos }) })()`)));
  }
  const todos = dias.flatMap(s => s.dias), media = todos.reduce((a, b) => a + b, 0) / todos.length, minimo = Math.min(...todos);
  ok("R4-29-semana una semana armada para 1 persona da de media entre 1.600 y 2.300 kcal por día y ningún día baja de 1.400 kcal, en 10 semillas distintas",
    dias.every(s => s.llenos === 28 && s.dias.length === 7) && media >= 1600 && media <= 2300 && minimo >= 1400, JSON.stringify({ media: Math.round(media), minimo, maximo: Math.max(...todos) }));
  ok("R4-29-armado los desayunos y meriendas armados salen de las ideas de desayuno (14 de 14 en cada semana)", dias.every(s => s.desayunosDeIdea === 14), JSON.stringify(dias.map(s => s.desayunosDeIdea)));

  // R4-29-piso: la semana más barata, con los precios congelados y porciones de adulto.
  const piso = {};
  for (const hog of [1, 2]) { await abrir({ ...PRES(1000), ...HOGAR(hog) }); piso[hog] = ev(`ArmameSemana.armar({ modo: "todo" }).costo`) }
  ok("R4-29-piso con los precios congelados y porciones de adulto, la semana más barata cuesta $68.000 o menos para 1 persona y $110.000 o menos para 2", piso[1] <= 68000 && piso[2] <= 110000, JSON.stringify(piso));

  // R4-29-selector: al elegir desayuno, las ideas de desayuno aparecen con el mismo detalle (cantidades y pasos).
  await abrir({ ...PRES(90000) });
  ev('openTab("semana")'); await espera(200);
  ev('abrirSelector(todayPlanDay(), "desayuno")'); await espera(300);
  const botones = [...doc().querySelectorAll(".hoja [data-selector-idea]")], textoIdea = botones[0] && botones[0].dataset.selectorIdea;
  if (botones[0]) await tocar(botones[0]);
  const item = JSON.parse(ev(`JSON.stringify((() => { const plan = loadPlan(), id = (plan[todayPlanDay()] || {}).desayuno, it = MisPlatos.loadSaved().find(x => x.id === id); const idea = it && IdeasHoja.ideaDeComida(it); return { hay: !!it, esIdea: !!idea, texto: idea && idea.text, pasos: idea && idea.pasos.length, nombre: it && IdeasHoja.nombreCorto(it) } })())`));
  ev('openTab("miscomidas")'); await espera(150);
  const idItem = ev(`(plan => (plan[todayPlanDay()] || {}).desayuno)(loadPlan())`);
  ev(`Comidas.abrirComida("plato", ${JSON.stringify(idItem)})`); await espera(300);
  const pasosVisibles = doc().querySelectorAll("#comidaPasosLista li").length, ingredientes = doc().querySelectorAll("#comidaComponentes .comida-ingrediente").length;
  ok("R4-29-selector al elegir desayuno aparecen las ideas de desayuno; al elegir una queda en el plan como idea y su detalle muestra cantidades y de 2 a 4 pasos",
    botones.length >= 1 && item.hay && item.esIdea && item.texto === textoIdea && pasosVisibles >= 2 && pasosVisibles <= 4 && ingredientes >= 3, JSON.stringify({ botones: botones.length, item, pasosVisibles, ingredientes }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
