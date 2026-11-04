// E22: Etapa 22 de la Ronda 3 ("Lo que arma la app tiene sentido"). Controles E22-variedad, E22-barata, E22-no-crece,
// E22-migracion y E22-bienvenida de docs/validacion/criterios.json. Usan el datos/precios.json REAL y datos inventados.
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
  const PRES = l => ({ miPlatoFacil_shoppingBudget_v1: JSON.stringify({ currency: "ARS", limit: l, period: "semana" }) });

  // E22-variedad: 20 semanas con semillas distintas.
  cargar({ ...MARCA, ...PRES(70000) }); await abrir();
  const BASES = [["lentejas", /lentej/], ["pollo", /pollo|pechuga|muslo/], ["carne", /carne|vacio|asado|nalga|cuadril|bife|lomo|picada/], ["pescado", /merluza|atun|salmon|pescado|caballa|sardina|lenguado/], ["huevo", /huevo/]];
  const malas = [], resumen = { semanas: 0, maxRep: 0, maxProt: 0, maxArroz: 0, desayunos: new Set() };
  for (let i = 0; i < 20; i++) {
    const r = JSON.parse(ev(`(() => { Semana.semanaActual = () => "2026-S${i}"; const r = ArmameSemana.armar({ modo: "todo" }); return JSON.stringify({ n: r.asignadas.length, a: r.asignadas.map(x => ({ dia: x.dia, slot: x.slot, k: x.cand.k, n: x.cand.nombre, ings: x.cand.ings })) }) })()`));
    resumen.semanas++;
    if (r.n !== 28) malas.push(i + ": " + r.n + " comidas");
    const principales = r.a.filter(x => x.slot === "almuerzo" || x.slot === "cena"), cuentas = {}, bases = {};
    for (const x of principales) { cuentas[x.k] = (cuentas[x.k] || 0) + 1; for (const [b, re] of BASES) if (x.ings.some(g => re.test(g))) bases[b] = (bases[b] || 0) + 1 }
    const arroz = principales.filter(x => x.ings.some(g => /^arroz/.test(g))).length;
    resumen.maxRep = Math.max(resumen.maxRep, ...Object.values(cuentas)); resumen.maxProt = Math.max(resumen.maxProt, ...Object.values(bases), 0); resumen.maxArroz = Math.max(resumen.maxArroz, arroz);
    if (Math.max(...Object.values(cuentas)) > 2) malas.push(i + ": comida repetida " + JSON.stringify(cuentas));
    if (Math.max(...Object.values(bases), 0) > 3) malas.push(i + ": proteína repetida " + JSON.stringify(bases));
    if (arroz > 3) malas.push(i + ": arroz " + arroz);
    for (const x of r.a.filter(x => x.slot === "desayuno" || x.slot === "merienda")) {
      resumen.desayunos.add(x.n);
      const t = x.ings.join(" ");
      if (/granola/.test(t) && /huevo|queso/.test(t)) malas.push(i + ": combinación prohibida " + x.n);
      if (/(huevo|queso)/i.test(x.n) && /granola/i.test(x.n)) malas.push(i + ": nombre prohibido " + x.n)
    }
  }
  ok("E22-variedad en 20 semanas con semillas distintas no hay combinaciones prohibidas (huevo o queso con granola) ni se superan los topes (misma comida 2, misma proteína base 3, arroz 3)",
    !malas.length && resumen.semanas === 20, JSON.stringify({ malas: malas.slice(0, 5), maxRep: resumen.maxRep, maxProt: resumen.maxProt, maxArroz: resumen.maxArroz, desayunosDistintos: resumen.desayunos.size, ejemplo: [...resumen.desayunos].slice(0, 6) }));

  // E22-barata: nunca elige una comida con faltantes ni más cara.
  const resBarata = JSON.parse(ev(`(() => { const out = { cambios: 0, intentos: 0, malos: [], sinOpcion: 0 };
    for (let i = 0; i < 3; i++) {
      Semana.semanaActual = () => "2026-B" + i; ArmameSemana.aplicar(ArmameSemana.armar({ modo: "todo" }));
      for (const d of ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]) for (const s of ["almuerzo","cena"]) {
        const antes = loadPlan()[d][s], a0 = cantidadesDeComida("plato", antes), c0 = a0 ? costoDeFilas(a0.rows, 1) : null, r = ArmameSemana.cambiarHueco(d, s, "barata"); out.intentos++;
        if (!r.ok) { out.sinOpcion++; continue }
        PRECIOS_CAZUELA = null; const a1 = cantidadesDeComida("plato", r.id); out.cambios++;
        if (!c0 || !a1) { out.malos.push({ d, s, sinCantidades: true }); continue }
        const c1 = costoDeFilas(a1.rows, 1);
        if (c1.sinPrecio > 0 || !(c1.costo < c0.costo)) out.malos.push({ d, s, antes: c0, despues: c1 })
      }
    }
    return JSON.stringify(out) })()`));
  ok("E22-barata Cambiar por una más barata nunca elige una comida con faltantes que cuenten $0 ni una más cara, y dice cuando no hay una más barata",
    resBarata.intentos === 42 && !resBarata.malos.length && resBarata.cambios + resBarata.sinOpcion === 42, JSON.stringify({ cambios: resBarata.cambios, sinOpcion: resBarata.sinOpcion, malos: resBarata.malos.slice(0, 2) }));

  // E22-no-crece: después de armar, Mis comidas no crece; lo armado se puede ver en "De la semana" y guardar.
  cargar({ ...MARCA, ...PRES(70000) }); await abrir();
  const visibles = () => { ev('openTab("misplatos")'); return doc().querySelectorAll("#savedList .comida-card").length };
  ev('Semana.semanaActual = () => "2026-N"; ArmameSemana.aplicar(ArmameSemana.armar({ modo: "todo" }))'); await espera(200);
  const guardadas = ev("MisPlatos.loadSaved().length"), marcadas = ev("MisPlatos.loadSaved().filter(x => x.deLaSemana).length");
  const despues = visibles();
  ev('document.querySelector("[data-saved-kind=semana]").click()'); await espera(150);
  const enSemana = doc().querySelectorAll("#savedList .comida-card").length;
  const idUna = ev("MisPlatos.loadSaved().find(x => x.deLaSemana).id");
  ev(`ArmameSemana.guardarEnMisComidas(${JSON.stringify(idUna)}); document.querySelector("[data-saved-kind=todo]").click()`); await espera(150);
  const trasGuardar = doc().querySelectorAll("#savedList .comida-card").length, sigueEnPlan = ev(`Object.values(loadPlan()).some(d => Object.values(d).includes(${JSON.stringify(idUna)}))`);
  ok("E22-no-crece después de Armame la semana Mis comidas no crece (lo armado queda 'de la semana'); 'Guardar en mis comidas' la hace aparecer y sigue en el plan",
    guardadas >= 10 && marcadas === guardadas && despues === 0 && enSemana === guardadas && trasGuardar === 1 && sigueEnPlan, JSON.stringify({ guardadas, marcadas, despues, enSemana, trasGuardar, sigueEnPlan }));

  // E22-migracion: las comidas de versiones anteriores se marcan 'de la semana' sin borrar nada, y se puede correr dos veces.
  const t0 = Date.now();
  const mk = (id, ms, extra) => ({ id, savedAt: new Date(t0 - ms).toISOString(), type: "plato", title: id, lines: [], sig: "plato|" + id, text: id, cooked: 0, state: { type: "plato" }, ...(extra || {}) });
  const saved = [mk("a1", 3000), mk("a2", 2000), mk("fav", 2500, { fav: true }), mk("vieja", 86400000), mk("cocinada", 2800, { cooked: 2 })];
  cargar({ ...MARCA, miPlatoFacil_saved: JSON.stringify(saved), miPlatoFacil_planHistory_v1: JSON.stringify([{ at: new Date(t0).toISOString(), text: "Armame la semana: 28 comidas (≈ $30.000)" }]) }); await abrir();
  const m1 = ev("MisPlatos.loadSaved().filter(x => x.deLaSemana).map(x => x.id).sort().join()"), n1 = ev("MisPlatos.loadSaved().length");
  ev("ArmameSemana.marcarDeLaSemana()");
  const m2 = ev("MisPlatos.loadSaved().filter(x => x.deLaSemana).map(x => x.id).sort().join()");
  ok("E22-migracion las comidas que Armame creó en versiones anteriores se marcan 'de la semana' (no las favoritas, cocinadas ni anteriores), no se borra nada y se puede correr dos veces",
    m1 === "a1,a2" && m2 === m1 && n1 === 5, JSON.stringify({ m1, m2, n1 }));

  // E22-bienvenida: las ideas elegidas en la bienvenida entran primero.
  cargar({}); await abrir();
  ev(`(() => { for (const i of [2, 7, 11]) IdeasHoja.guardarIdea(data.menuCatalog[i]) })()`); await espera(100);
  const elegidas = ev("MisPlatos.loadSaved().map(x => x.id)");
  let entran = [];
  for (let i = 0; i < 5; i++) { ev(`Semana.semanaActual = () => "2026-W${i}"; ArmameSemana.aplicar(ArmameSemana.armar({ modo: "todo" }))`); await espera(80); const usadas = ev(`(() => { const ids = new Set(Object.values(loadPlan()).flatMap(d => Object.values(d))); return ${JSON.stringify(elegidas)}.filter(id => ids.has(id)).length })()`); entran.push(usadas) }
  ok("E22-bienvenida las 3 ideas elegidas en la bienvenida entran a la semana armada", elegidas.length === 3 && entran.every(n => n === 3), JSON.stringify({ entran }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
