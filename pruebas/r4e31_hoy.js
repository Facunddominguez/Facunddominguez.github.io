// R4-31: Etapa 31 de la Ronda 4 ("Hoy con costo y la semana para compartir"). Controles R4-31-hoy, R4-31-texto, R4-31-imagen y
// R4-31-proxima de docs/validacion/criterios.json. Datos inventados y precios congelados.
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
  const tocar = async el => { el.click(); await espera(250) };
  const pesos = t => { const m = /\$([\d.]+)/.exec(t || ""); return m ? Number(m[1].replace(/\./g, "")) : null };
  const hoyTexto = () => (doc().getElementById("todayCosto") || { textContent: "" }).textContent;
  const armar = async () => { ev('openTab("semana")'); await espera(200); ev('ArmameSemana.correr("todo")'); await espera(500) };

  // R4-31-hoy
  await abrir({ ...PRES(90000) }); await armar();
  const semanaHoy = pesos(/hoy ≈ \$[\d.]+/.exec((doc().getElementById("planDiaCosto") || {}).textContent || "") && /hoy ≈ \$[\d.]+/.exec(doc().getElementById("planDiaCosto").textContent)[0]);
  ev('openTab("hoy")'); await espera(300);
  const t1 = hoyTexto(), hoyCosto = pesos(t1);
  // Un día con solo un almuerzo sin fruta: "Te falta: fruta"; con un desayuno con fruta, "Plato completo".
  await abrir({ ...PRES(90000) });
  const casos = JSON.parse(ev(`JSON.stringify((() => { const hoy = todayPlanDay(); const plan = loadPlan(); plan[hoy] = { desayuno: null, merienda: null, almuerzo: null, cena: null };
    const alm = IdeasHoja.guardarIdea(data.menuCatalog.find(i => i.text.startsWith("Milanesa de pollo al horno")), "Día libre").item; plan[hoy].almuerzo = alm.id; Semana.persistPlan(plan); renderToday();
    const sinFruta = document.getElementById("todayCosto").textContent;
    const des = IdeasHoja.guardarIdea(data.desayunoCatalog[0], "Día libre").item; const p2 = loadPlan(); p2[hoy].desayuno = des.id; Semana.persistPlan(p2); renderToday();
    const completo = document.getElementById("todayCosto").textContent;
    const p3 = loadPlan(); p3[hoy] = { desayuno: null, merienda: null, almuerzo: null, cena: null }; Semana.persistPlan(p3); renderToday();
    const vacio = { txt: document.getElementById("todayCosto").textContent, oculto: document.getElementById("todayCosto").hidden };
    return { sinFruta, completo, vacio } })())`));
  await abrir({ ...PRES(90000), miPlatoFacil_mostrarPrecios_v1: JSON.stringify({ mostrar: false }) });
  const apagado = JSON.parse(ev(`JSON.stringify((() => { const hoy = todayPlanDay(), plan = loadPlan(); plan[hoy] = { desayuno: null, merienda: null, almuerzo: null, cena: null };
    plan[hoy].almuerzo = IdeasHoja.guardarIdea(data.menuCatalog[0], "Día libre").item.id; Semana.persistPlan(plan); renderToday(); return document.getElementById("todayCosto").textContent })())`));
  ok("R4-31-hoy con la semana armada, Hoy muestra 'Hoy ≈ $' con el mismo monto que 'hoy ≈' de Semana; sin fruta en el día dice 'Te falta: fruta'; con fruta, 'Plato completo'; sin plan no muestra la línea; con los precios apagados no muestra ningún '$'",
    /^Hoy ≈ \$[\d.]+ · (Plato completo|Te falta)/.test(t1) && hoyCosto > 0 && hoyCosto === semanaHoy && /^Hoy ≈ \$[\d.]+ · Te falta: fruta$/.test(casos.sinFruta) && /^Hoy ≈ \$[\d.]+ · Plato completo: verduras, almidón, proteína y fruta$/.test(casos.completo) && casos.vacio.oculto && casos.vacio.txt === "" && /Te falta/.test(apagado) && !/\$/.test(apagado),
    JSON.stringify({ t1, semanaHoy, casos, apagado }));

  // R4-31-texto: el texto tiene los 7 días, 28 comidas y el mismo total que Semana; se comparte desde el menú ⋯ de Semana.
  await abrir({ ...PRES(90000) }); await armar();
  const totalSemana = pesos(/Semana (?:al menos )?≈ \$[\d.]+/.exec(doc().getElementById("planDiaCosto").textContent)[0]);
  let compartido = null;
  Object.defineProperty(w.navigator, "share", { value: o => { compartido = o; return Promise.resolve() }, configurable: true });
  await tocar(doc().querySelector("#plan [data-plan-menu]"));
  const botonMenu = [...doc().querySelectorAll(".hoja button")].find(b => b.textContent === "Compartir la semana");
  if (botonMenu) await tocar(botonMenu);
  const opciones = [...doc().querySelectorAll(".hoja [data-compartir-semana]")].map(b => b.textContent);
  const optTexto = doc().querySelector('.hoja [data-compartir-semana="texto"]');
  if (optTexto) await tocar(optTexto);
  const texto = (compartido && compartido.text) || "", lineas = texto.split("\n");
  const comidas = lineas.filter(l => /^(🍳 Desayuno|🥗 Almuerzo|☕ Merienda|🌙 Cena): .+/.test(l) && !/: —$/.test(l)).length, dias = lineas.filter(l => /^\*(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo) \d+\*$/.test(l)).length;
  const lunes = ev("Semana.semanaActual()"), totalTexto = pesos((lineas.find(l => /^\*Total /.test(l)) || ""));
  ok("R4-31-texto 'Compartir la semana' (menú ⋯) ofrece texto e imagen; el texto tiene el título con las fechas, los 7 días, las 28 comidas y el mismo total que Semana",
    opciones.join() === "Como texto,Como imagen" && lineas[0] === "🍽️ Mi semana · " + ev(`Compartir.rangoCorto(${JSON.stringify(lunes)})`) && dias === 7 && comidas === 28 && totalTexto > 0 && totalTexto === totalSemana && compartido && compartido.title === "Mi semana",
    JSON.stringify({ opciones, titulo: lineas[0], dias, comidas, totalTexto, totalSemana }));

  // R4-31-imagen: PNG de 1080×1350, de más de 20 KB, que se comparte como archivo image/png; sin navigator.share, se descarga.
  const dim = ev("(() => { const c = Compartir.buildSemanaCanvas(); return [c.width, c.height] })()");
  const blobKb = await new Promise(res => ev("Compartir.buildSemanaCanvas()").toBlob(b => res(b ? b.size : 0), "image/png"));
  let archivo = null;
  Object.defineProperty(w.navigator, "canShare", { value: () => true, configurable: true });
  Object.defineProperty(w.navigator, "share", { value: o => { archivo = o; return Promise.resolve() }, configurable: true });
  ev('Compartir.compartirSemana("imagen")'); await espera(800);
  const f = archivo && archivo.files && archivo.files[0];
  let bajada = null;
  Object.defineProperty(w.navigator, "share", { value: undefined, configurable: true });
  const proto = w.HTMLAnchorElement.prototype, click0 = proto.click; proto.click = function () { bajada = this.download; };
  ev('Compartir.compartirSemana("imagen")'); await espera(800);
  proto.click = click0;
  ok("R4-31-imagen el canvas mide 1080×1350, el PNG pesa más de 20 KB y se comparte como archivo image/png; sin navigator.share, se descarga",
    dim[0] === 1080 && dim[1] === 1350 && blobKb > 20000 && !!f && f.type === "image/png" && /\.png$/.test(f.name) && bajada === "mi-semana.png", JSON.stringify({ dim, blobKb, tipo: f && f.type, nombre: f && f.name, bajada }));

  // R4-31-proxima: desde la semana que viene, el texto y la imagen llevan las fechas y las comidas de esa semana.
  await abrir({ ...PRES(90000) });
  ev('openTab("semana")'); await espera(200); ev("Semana.verSemana(1)"); await espera(300); ev('ArmameSemana.correr("todo")'); await espera(500);
  const prox = JSON.parse(ev(`JSON.stringify((() => { const s = Compartir.semanaParaCompartir(), t = Compartir.semanaTexto(), lunes = Semana.lunesSiguiente(), plan = loadPlan(), saved = new Map(MisPlatos.loadSaved().map(p => [p.id, p]));
    const nombres = []; for (const [k] of DAYS) for (const [sl] of SLOTS) { const it = saved.get((plan[k] || {})[sl]); if (it) nombres.push(nombreCortoDeComida(it)) }
    const c = Compartir.buildSemanaCanvas();
    return { titulo: s.titulo, esperado: "Mi semana · " + Compartir.rangoCorto(lunes), todas: nombres.length, enTexto: nombres.filter(n => t.includes(n)).length, total: s.total, tam: [c.width, c.height] } })())`));
  ok("R4-31-proxima desde la semana que viene, el texto y la imagen llevan las fechas y las comidas de esa semana",
    prox.titulo === prox.esperado && prox.todas === 28 && prox.enTexto === 28 && prox.total > 0 && prox.tam[0] === 1080 && prox.tam[1] === 1350, JSON.stringify(prox));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
