// v18.8: arreglos después de la Ronda 4. Usan los precios congelados (los sirve probar.mjs) y datos inventados.
// V188-receta: la hoja de un hueco (Semana y Hoy) tiene "Ver receta" y abre los pasos.
// V188-coherentes: lo que la tarjeta dice que lleva y lo que nombran los pasos está en las cantidades (lo que va a la lista).
// V188-leche: la leche de las ideas se compra en sachets, no en gramos.
// V188-ajustar: si la semana armada se pasa del presupuesto, "Ajustar" la abarata (con Deshacer) sin repetir comida en el día.
// V188-tarjetas: la tarjeta de Semana dice "⏱ N min" en las ideas con receta y nunca "Fruta:" ni "(1/3)".
// V188-precio: el detalle de una comida dice la fuente en palabras simples.
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
  const HOGAR = n => ({ miPlatoFacil_hogar_v1: JSON.stringify({ personas: n }) });
  const tocar = async el => { el.click(); await espera(250) };
  const armame = () => doc().querySelector("#plan [data-armame]");

  // Semana armada para 2 personas sin presupuesto; después se carga un presupuesto que no alcanza (así hay qué abaratar).
  cargar({ ...MARCA, ...HOGAR(2) }); await abrir();
  ev('openTab("semana")'); await espera(250);
  await tocar(armame()); await espera(300);
  localStorage.setItem("miPlatoFacil_shoppingBudget_v1", JSON.stringify({ currency: "ARS", limit: 60000, period: "semana" }));
  ev("renderPlan()"); await espera(150);

  // V188-tarjetas
  const detalles = [...doc().querySelectorAll("#planList .hueco__detalle")].map(e => e.textContent);
  ok("V188-tarjetas las tarjetas de Semana muestran los minutos de la receta y no las etiquetas del plato",
    detalles.length > 0 && detalles.some(t => /⏱ \d+ min/.test(t)) && !detalles.some(t => /Fruta:|Proteína:|\(1\/3\)|No elegido/.test(t)), JSON.stringify(detalles));

  // V188-ajustar
  const totalAntes = ev("costoSemanaPlan().total"), planAntes = localStorage.getItem("miPlatoFacil_plan");
  const ajustar = doc().querySelector("#plan [data-armame-ajustar]");
  let ajusteOk = false, detalleAj = "sin botón";
  if (ajustar) {
    await tocar(ajustar); await espera(300);
    const totalDespues = ev("costoSemanaPlan().total"), aviso = doc().getElementById("planAviso").textContent;
    const plan = ev("loadPlan()"), saved = new Map(ev("MisPlatos.loadSaved()").map(x => [x.id, x]));
    const repetidaEnElDia = Object.values(plan).some(d => { const ns = ["almuerzo", "cena"].map(s => d && saved.get(d[s])).filter(Boolean).map(x => ev("mealName")(x)); return ns.length === 2 && ns[0] === ns[1] });
    const cambio = /^Cambié \d+ comida/.test(aviso), planAjustado = localStorage.getItem("miPlatoFacil_plan");
    const deshacer = doc().querySelector("#planAviso [data-plan-deshacer]");
    if (deshacer) await tocar(deshacer);
    const vuelve = localStorage.getItem("miPlatoFacil_plan") === planAntes;
    // Se deja la semana ajustada para lo que sigue.
    localStorage.setItem("miPlatoFacil_plan", planAjustado); ev("renderPlan()");
    ajusteOk = cambio && totalDespues < totalAntes && !repetidaEnElDia && vuelve;
    detalleAj = JSON.stringify({ totalAntes: Math.round(totalAntes), totalDespues: Math.round(totalDespues), aviso: aviso.slice(0, 140), repetidaEnElDia, vuelve });
  }
  ok("V188-ajustar si la semana se pasa del presupuesto, 'Ajustar' la abarata sin repetir comida en el día y Deshacer la vuelve atrás", ajusteOk, detalleAj);

  // V188-leche
  ev('openTab("compras")'); await espera(300);
  const lista = doc().getElementById("comprasList").innerText;
  const lineaLeche = lista.split("\n").find(l => /^Leche/.test(l)) || "";
  ok("V188-leche la leche se compra en sachets, no en gramos", !lineaLeche || (/sachet/.test(lineaLeche) && !/:\s*[\d.]+\s*g\b/.test(lineaLeche)), lineaLeche);

  // V188-receta y V188-precio: desde la hoja de un hueco con idea, "Ver receta" abre los pasos.
  ev('openTab("semana")'); await espera(250);
  let receta = false, detalleRec = "sin hueco con receta", precio = "";
  for (const dia of ["lunes", "martes", "miercoles", "jueves", "viernes"]) {
    ev(`Semana.elegirDiaPlan("${dia}")`); await espera(150);
    for (const h of [...doc().querySelectorAll("#planList .hueco")]) {
      await tocar(h);
      const b = doc().querySelector(".hoja [data-hueco-receta]");
      if (b && /^Ver receta/.test(b.textContent)) {
        await tocar(b);
        const pasos = doc().querySelectorAll("#comidaPasosLista li").length, activa = doc().querySelector(".screen.is-active").id;
        precio = doc().getElementById("comidaCosto").textContent;
        receta = activa === "comida" && pasos >= 2 && pasos <= 5 && !doc().getElementById("comidaPasos").hidden;
        detalleRec = JSON.stringify({ activa, pasos, boton: b.textContent });
        break
      }
      ev("hoja.cerrar()"); await espera(100)
    }
    if (detalleRec !== "sin hueco con receta") break
  }
  ok("V188-receta la hoja de un hueco tiene 'Ver receta' y abre la comida con sus pasos", receta, detalleRec);
  ok("V188-precio el detalle de una comida dice la fuente en palabras simples", /por porción · precios de (verdulería y súper|súper|promedio)/.test(precio) && !/SEPA|mediana|INDEC/.test(precio), precio);

  // V188-coherentes: en todas las ideas con cantidades, lo de la tarjeta y lo que nombran los pasos se compra.
  const malas = ev(`(() => {
    const n = s => normalizeSearchText(String(s)).replace(/\\(.*?\\)/g, " ").trim();
    const base = s => n(s).split(/\\s+/)[0].replace(/(es|s)$/, "");
    const VOC = ["morron", "tomate", "cebolla", "zanahoria", "papa", "batata", "zapallito", "acelga", "espinaca", "lechuga", "repollo", "berenjena", "choclo", "arveja", "atun", "pollo", "lenteja", "garbanzo", "arroz", "fideo", "banana", "manzana", "naranja", "leche", "yogur", "avena", "hongo", "champinon", "puerro", "verdeo", "palta", "brocoli", "remolacha", "pepino", "jamon", "polenta", "poroto", "mandarina", "queso", "mayonesa"];
    const ideas = (data.menuCatalog || []).concat(data.desayunoCatalog || []).filter(i => Array.isArray(i.cantidades));
    const out = [];
    for (const i of ideas) {
      const cant = i.cantidades.map(c => n(c[0])).join(" | "), bases = new Set(i.cantidades.map(c => base(c[0])));
      const tarjeta = Object.values(i.ingredientes || {}).flat().filter(x => !bases.has(base(x)));
      const pasos = " " + n((i.pasos || []).join(" ")).replace(/pan rallado/g, "") + " ";
      const nombrados = VOC.filter(v => new RegExp("[^a-z]" + v).test(pasos) && !cant.includes(v));
      if (tarjeta.length || nombrados.length) out.push(i.text + ": " + tarjeta.concat(nombrados).join(", "))
    }
    return [ideas.length, out]
  })()`);
  ok("V188-coherentes en cada idea, lo que dice la tarjeta y lo que nombran los pasos está en las cantidades (va a la lista)",
    malas[0] >= 90 && malas[1].length === 0, malas[0] + " ideas · " + malas[1].slice(0, 6).join(" | "));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
