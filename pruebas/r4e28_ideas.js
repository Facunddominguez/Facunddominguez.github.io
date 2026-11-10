// R4-28: Etapa 28 de la Ronda 4 ("Ideas con cantidades y preparación"). Controles R4-28-41, R4-28-nombres, R4-28-energia, R4-28-titulo,
// R4-28-lista, R4-28-editada, R4-28-detalle y R4-28-corto de docs/validacion/criterios.json. Datos inventados y precios congelados.
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
  const ev = x => w.eval(x), doc = () => w.document;
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };
  const HOGAR = n => ({ miPlatoFacil_hogar_v1: JSON.stringify({ personas: n }) });
  const PRES = l => ({ miPlatoFacil_shoppingBudget_v1: JSON.stringify({ currency: "ARS", limit: l, period: "semana" }) });
  const tocar = async el => { el.click(); await espera(220) };

  cargar({ ...MARCA }); await abrir();
  const archivo = await (await fetch("/datos/ideas.json", { cache: "no-store" })).json();
  const analisis = JSON.parse(ev(`(() => {
    const ideas = data.menuCatalog.filter(i => Array.isArray(i.cantidades)), BASICOS = typeof esBasicoDeAlacena === "function" ? esBasicoDeAlacena : () => false;
    const malas = [], sinNombre = [], fuera = [];
    for (const i of ideas) {
      const c = i.cantidades;
      if (!i.corto || i.corto.length > 40 || i.corto.includes("+")) malas.push(i.text.slice(0, 40) + ": corto");
      if (!Array.isArray(i.pasos) || i.pasos.length < 3 || i.pasos.length > 5 || i.pasos.some(p => typeof p !== "string" || p.length > 140 || !p)) malas.push(i.text.slice(0, 40) + ": pasos");
      if (!Number.isFinite(i.minutos) || i.minutos < 5 || i.minutos > 90) malas.push(i.text.slice(0, 40) + ": minutos");
      if (!Array.isArray(c) || c.length < 3 || c.some(f => !Array.isArray(f) || f.length !== 3 || typeof f[0] !== "string" || !(f[1] > 0) || !["g", "unidad", "ml"].includes(f[2]))) { malas.push(i.text.slice(0, 40) + ": cantidades"); continue }
      let kcal = 0, prot = 0;
      for (const [n, q, u] of c) {
        const nut = nutritionFor(n), item = Precios.itemDe(n);
        if (!nut && !item) sinNombre.push(i.text.slice(0, 30) + " → " + n);
        if (BASICOS(n)) sinNombre.push(i.text.slice(0, 30) + " → " + n + " (básico de alacena)");
        const g = gramosDe(n, q, u);
        if (nut && g !== null) { kcal += nut.v[0] * g / 100; prot += nut.v[1] * g / 100 } else sinNombre.push(i.text.slice(0, 30) + " → " + n + " (sin gramos)");
      }
      if (kcal < 450 || kcal > 850 || prot < 18) fuera.push(i.text.slice(0, 40) + ": " + Math.round(kcal) + " kcal, " + Math.round(prot) + " g");
    }
    return JSON.stringify({ n: ideas.length, total: data.menuCatalog.length, malas, sinNombre, fuera, textos: ideas.map(i => i.text) })
  })()`));
  ok("R4-28-41 las 41 ideas actuales tienen corto (40 caracteres o menos, sin '+'), cantidades, 3 a 5 pasos de 140 caracteres o menos y minutos entre 5 y 90, y cada texto coincide con el del catálogo",
    analisis.n === 41 && analisis.total === 41 && !analisis.malas.length && archivo.ideas.length === 41 && JSON.stringify(archivo.ideas.map(x => x.text)) === JSON.stringify(analisis.textos), JSON.stringify({ n: analisis.n, malas: analisis.malas.slice(0, 5) }));
  ok("R4-28-nombres cada nombre de cantidades resuelve a un ítem de precios o de nutrición y ninguno es un básico de alacena", !analisis.sinNombre.length, JSON.stringify(analisis.sinNombre.slice(0, 6)));
  ok("R4-28-energia cada idea de almuerzo o cena aporta entre 450 y 850 kcal y 18 g de proteína o más por persona (con gramosDe() y nutritionFor(); el aceite no se cuenta)", !analisis.fuera.length, JSON.stringify(analisis.fuera.slice(0, 6)));

  // R4-28-titulo: lo que nombra el título de cada idea está en sus cantidades (la prueba E23-titulo mira los ingredientes vinculados).
  // La misma lista que E23-titulo, más "maíz": los tacos y las tortillas "de maíz" llevan "Tortillas de trigo" en cantidades (la de maíz no tiene precio ni estimado; ver el Registro).
  const NO_INGREDIENTE = ["tarta", "wrap", "tacos", "taco", "risotto", "guiso", "ensalada", "sopa", "milanesa", "milanesas", "hamburguesa", "bowl", "pastel", "cazuela", "omelette", "sandwich", "sándwich", "pizza", "ñoquis", "noquis", "filet", "bife", "pesto", "salsa", "aderezo", "puré", "pure", "revuelto", "tortilla", "crema", "verduras", "vegetales", "hojas", "verdes", "mixta", "completa", "tibia", "casera", "integral", "integrales", "magra", "caliente", "especiados", "crudas", "salteadas", "grillado", "grillada", "horno", "plancha", "vapor", "curry", "pescado", "rellena", "cherry", "oliva", "gallina", "basmati", "morado", "albóndigas", "albondigas", "maíz", "maiz"];
  const tit = JSON.parse(ev(`(() => { const NO = ${JSON.stringify(NO_INGREDIENTE)}.map(normalizeSearchText), faltan = [];
    const STOP = new Set(["con","de","del","la","el","los","las","y","e","o","al","en","un","una","por","a"]);
    for (const idea of data.menuCatalog.filter(i => i.cantidades)) {
      const nombres = idea.cantidades.map(c => normalizeSearchText(c[0])), claves = new Set(idea.cantidades.map(c => ingredientKey(c[0])));
      const palabras = normalizeSearchText(idea.text).replace(/cebolla de verdeo/g, "verdeo").replace(/[^a-zñ ]+/g, " ").split(/\\s+/).filter(p => p.length >= 3 && !STOP.has(p) && !NO.includes(p));
      for (const p of palabras) {
        const nut = nutritionFor(p);
        if (!nut) continue;
        const EQUIV = { calabaza: "zapallo", hummus: "garbanzo" }, base = EQUIV[p] || p;
        if (!(claves.has(ingredientKey(p)) || nombres.some(n => n.startsWith(base.slice(0, 5)) || n.includes(base)) || idea.cantidades.some(c => (nutritionFor(c[0]) || {}).n === nut.n))) faltan.push(idea.text.slice(0, 50) + " → " + p);
      }
    }
    return JSON.stringify(faltan) })()`));
  ok("R4-28-titulo todo lo que nombra el título de cada idea está en sus cantidades", tit.length === 0, JSON.stringify(tit.slice(0, 8)));

  // R4-28-lista: con 14 ideas y 2 personas, la lista suma exactamente el doble de las cantidades de cada idea (antes de pasar a envases).
  cargar({ ...MARCA, ...HOGAR(2) }); await abrir();
  const lista = JSON.parse(ev(`(() => {
    const ideas = data.menuCatalog.filter(i => i.cantidades).slice(0, 14), plan = {}, esperado = new Map();
    const dias = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"];
    ideas.forEach((idea, k) => { const r = IdeasHoja.guardarIdea(idea, "Día libre"); const d = dias[k >> 1]; plan[d] = plan[d] || { desayuno: null, merienda: null, almuerzo: null, cena: null }; plan[d][k % 2 ? "cena" : "almuerzo"] = r.item.id;
      for (const [n, q, u] of idea.cantidades) { const key = ingredientKey(n) + "|" + u; esperado.set(key, (esperado.get(key) || 0) + q * 2) } });
    Semana.persistPlan(plan);
    const real = new Map();
    for (const e of Compras.shoppingPlanItems()) for (const [u, q] of e.units) real.set(e.key + "|" + u, q);
    const difs = [];
    for (const [k, v] of esperado) if (!real.has(k) || Math.abs(real.get(k) - v) > 1e-6) difs.push(k + " esperado " + v + " real " + real.get(k));
    for (const k of real.keys()) if (!esperado.has(k)) difs.push(k + " sobra");
    return JSON.stringify({ ideas: ideas.length, claves: esperado.size, difs }) })()`));
  ok("R4-28-lista con una semana de 14 ideas para 2 personas, la lista suma exactamente el doble de las cantidades de cada idea antes de pasar a envases", lista.ideas === 14 && lista.claves > 20 && !lista.difs.length, JSON.stringify(lista.difs.slice(0, 5)));

  // R4-28-editada: una idea guardada a la que se le cambia un ingrediente vuelve al cálculo general; si solo se renombra, conserva las cantidades.
  cargar({ ...MARCA }); await abrir();
  const ed = JSON.parse(ev(`(() => {
    const idea = data.menuCatalog.find(i => i.text.startsWith("Milanesa de pollo al horno")), r = IdeasHoja.guardarIdea(idea, "Día libre"), item = r.item;
    const igual = IdeasHoja.ideaDeComida(item) === idea, cant = cantidadesDePlatoArmado(item).map(x => x.name + x.q + x.unit).join("|");
    const renombrada = { ...item, title: "Mi milanesa", note: "otra cosa" }, sigue = IdeasHoja.ideaDeComida(renombrada) === idea;
    const editada = JSON.parse(JSON.stringify(item)); editada.state.verduras = [{ name: "Zapallito" }];
    const ideaEd = IdeasHoja.ideaDeComida(editada), cantEd = cantidadesDePlatoArmado(editada).map(x => x.name + x.q + x.unit).join("|");
    return JSON.stringify({ igual, cant: cant === idea.cantidades.map(c => c[0] + c[1] + c[2]).join("|"), sigue, ideaEd: ideaEd === null, distinto: cantEd !== cant && cantEd.length > 0 }) })()`));
  ok("R4-28-editada una idea guardada usa las cantidades de la idea; renombrada, también; con un ingrediente cambiado vuelve al cálculo general", ed.igual && ed.cant && ed.sigue && ed.ideaEd && ed.distinto, JSON.stringify(ed));

  // R4-28-detalle: el detalle muestra cada ingrediente con su cantidad (el doble con 2 personas) y de 3 a 5 pasos.
  const detalle = async personas => {
    cargar({ ...MARCA, ...HOGAR(personas) }); await abrir();
    const id = ev(`IdeasHoja.guardarIdea(data.menuCatalog.find(i => i.text.startsWith("Milanesa de pollo al horno")), "Día libre").item.id`);
    ev('openTab("miscomidas")'); await espera(200); ev(`Comidas.abrirComida("plato", ${JSON.stringify(id)})`); await espera(300);
    return { ing: [...doc().querySelectorAll("#comidaComponentes .comida-ingrediente")].map(b => b.textContent), pasos: [...doc().querySelectorAll("#comidaPasosLista li")].map(l => l.textContent), titulo: doc().getElementById("comidaPasosTitulo").textContent, visible: !doc().getElementById("comidaPasos").hidden };
  };
  const d1 = await detalle(1), d2 = await detalle(2);
  ok("R4-28-detalle el detalle de una idea muestra cada ingrediente con cantidad y de 3 a 5 pasos; con 2 personas las cantidades son el doble",
    d1.ing.includes("Pollo · 150 g") && d2.ing.includes("Pollo · 300 g") && d2.ing.includes("Pan rallado · 60 g") && d2.ing.length === d1.ing.length && d1.visible && d1.pasos.length >= 3 && d1.pasos.length <= 5 && /^Cómo se hace · 40 min$/.test(d1.titulo),
    JSON.stringify({ d1: d1.ing, d2: d2.ing, pasos: d1.pasos.length, titulo: d1.titulo }));

  // R4-28-corto: en Semana, ninguna comida que viene de una idea muestra más de 40 caracteres; la bienvenida, tampoco.
  cargar({ ...MARCA, ...PRES(200000) }); await abrir();
  ev('openTab("semana")'); await espera(200); ev('ArmameSemana.correr("todo")'); await espera(500);
  const nombres = [];
  for (const chip of [...doc().querySelectorAll("#planDias .semana-dia-chip")]) { await tocar(chip); nombres.push(...[...doc().querySelectorAll("#planList .hueco__plato")].map(e => e.textContent.replace(/ [⭐📖]+$/u, ""))) }
  const largos = nombres.filter(n => n.length > 40), ideasEnSemana = nombres.length;
  const bienvenida = JSON.parse(ev(`JSON.stringify(Bienvenida.ideasParaArrancar().map(i => (i.corto || i.text).length))`));
  ok("R4-28-corto en Semana ninguna comida que viene de una idea muestra más de 40 caracteres, y la bienvenida ofrece los nombres cortos",
    ideasEnSemana === 28 && !largos.length && bienvenida.length > 0 && bienvenida.every(n => n <= 40), JSON.stringify({ ideasEnSemana, largos: largos.slice(0, 4), bienvenida }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
