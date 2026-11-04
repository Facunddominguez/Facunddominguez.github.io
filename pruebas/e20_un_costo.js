// E20: Etapa 20 de la Ronda 3 ("Un solo costo, completo y claro"). Controles E20-mismo-total, E20-sin-cero y E20-frase de
// docs/validacion/criterios.json. Usan el datos/precios.json REAL incrustado y datos inventados.
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
  const texto = id => (doc().getElementById(id) || { textContent: "" }).textContent;
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };
  const PRES = l => ({ miPlatoFacil_shoppingBudget_v1: JSON.stringify({ currency: "ARS", limit: l, period: "semana" }) });
  const pesos = t => { const m = /\$([\d.]+)/.exec(t || ""); return m ? Number(m[1].replace(/\./g, "")) : null };

  // E20-mismo-total: el total de la semana es el mismo en el aviso, Semana, Compras y la barra de presupuesto.
  cargar({ ...MARCA, ...PRES(70000) }); await abrir();
  const res = ev(`(() => { const r = ArmameSemana.aplicar(ArmameSemana.armar({ modo: "todo" })); return JSON.stringify({ costo: r.costo, txt: ArmameSemana.resumen(r), faltan: r.faltan }) })()`);
  const r = JSON.parse(res); await espera(200);
  const delAviso = pesos(/≈ \$[\d.]+ la semana/.exec(r.txt) && /≈ \$[\d.]+ la semana/.exec(r.txt)[0]);
  ev('openTab("semana")'); await espera(250);
  const linea = texto("planDiaCosto"), delasemana = pesos(/Semana (?:al menos )?≈ \$[\d.]+/.exec(linea) && /Semana (?:al menos )?≈ \$[\d.]+/.exec(linea)[0]);
  ev('openTab("compras")'); await espera(250);
  const resumen = texto("comprasSummary"), barra = texto("comprasPresupuesto");
  const deCompras = pesos(/≈ \$[\d.]+/.exec(resumen) && /≈ \$[\d.]+/.exec(resumen)[0]), deLaBarra = pesos(/≈ \$[\d.]+/.exec(barra) && /≈ \$[\d.]+/.exec(barra)[0]);
  const total = Math.round(ev("costoSemanaPlan().total"));
  ok("E20-mismo-total el total de la semana es el mismo en el aviso de Armame la semana, Semana, Compras y la barra de presupuesto",
    r.costo > 0 && [delAviso, delasemana, deCompras, deLaBarra].every(x => x === delAviso) && Math.abs(delAviso - total) <= 1 && r.costo === total,
    JSON.stringify({ costo: r.costo, delAviso, delasemana, deCompras, deLaBarra, total }));

  // E20-sin-cero: nada sin precio cuenta $0 en silencio.
  const prods = JSON.parse(ev(`JSON.stringify(costoSemanaPlan().productos)`));
  const estimados = prods.filter(p => p.tipo === "estimado"), sinNada = prods.filter(p => p.tipo === "sin");
  const lista = JSON.parse(ev(`JSON.stringify((() => { const pr = costoSemanaPlan(); return [...pr.porClave.entries()] })())`));
  const textosEst = lista.filter(([k]) => estimados.some(p => p.key === k)).map(x => x[1]), textosSin = lista.filter(([k]) => sinNada.some(p => p.key === k)).map(x => x[1]);
  // Una comida con un ingrediente sin precio real: el costo suma el estimado y lo dice.
  const comida = ev(`(() => { const filas = [{ name: "Frutillas", quantity: 1, unit: "taza" }, { name: "Arroz", quantity: 200, unit: "g" }]; const c = costoDeFilas(filas, 1); const solo = costoDeFilas([filas[1]], 1); return JSON.stringify({ costo: c.costo, solo: solo.costo, estimados: c.estimados, faltan: c.faltan }) })()`);
  const cm = JSON.parse(comida);
  // Sin categoría ni precio (nada que estimar): el total dice "al menos" y el producto figura como faltante.
  const raro = JSON.parse(ev(`(() => { const x = { key: "zz", name: "Producto inventado sin dato", units: new Map([["g", 100]]), group: "pendiente" }; const pr = preciosDeLaLista([x], "semana"); return JSON.stringify({ t: pr.total, faltan: pr.faltan, sin: pr.sinEstimar, txt: [...pr.porClave.values()][0], resumen: resumenPrecios(pr) }) })()`));
  ok("E20-sin-cero ningún costo trata un faltante como $0: se estima con la mediana de la categoría y se marca, y lo que no se puede estimar dice 'al menos'",
    estimados.every(p => p.costo > 0) && textosEst.every(t => /^sin precio · estimado ≈ \$[\d.]+$/.test(t)) && textosSin.every(t => t === "sin precio") &&
    cm.costo > cm.solo && cm.estimados === 1 && cm.faltan === 1 && raro.t === 0 && raro.sin === 1 && raro.faltan === 1 && raro.txt === "sin precio" && /al menos/.test(raro.resumen),
    JSON.stringify({ estimados: estimados.length, sinNada: sinNada.length, textosEst: textosEst.slice(0, 3), cm, raro }));

  // E20-frase: "Semana ≈ $X · hoy ≈ $Y" y "Con precio: N de M productos · Completar K precios"; faltan cuenta productos distintos.
  ev('openTab("semana")'); await espera(250);
  const estado = texto("planPreciosEstado"), boton = doc().querySelector("#planPreciosEstado [data-completar-precios]");
  const m = /Con precio: (\d+) de (\d+) productos/.exec(estado);
  const distintos = ev(`new Set(shoppingDisplayItems().map(x => x.key)).size`), apariciones = ev(`Semana.planEntriesFlat().reduce((n, e) => n + 1, 0)`);
  const faltanDistintos = prods.filter(p => p.tipo !== "real").length;
  const K = boton ? Number(/Completar (\d+)/.exec(boton.textContent)[1]) : -1;
  const botonVisible = !!boton && boton.getClientRects().length > 0 && boton.getBoundingClientRect().height >= 44;
  if (boton) boton.click(); await espera(250);
  const filas = [...doc().querySelectorAll(".completar-precios__fila")].map(b => b.textContent);
  const hojaAbierta = filas.length;
  ev("hoja.cerrar()"); await espera(100);
  ok("E20-frase Semana muestra 'Semana ≈ $X · hoy ≈ $Y' y 'Con precio: N de M productos · Completar K precios'; faltan cuenta productos distintos y el botón abre la lista de lo que no tiene precio real",
    /^Semana (al menos )?≈ \$[\d.]+ · hoy ≈ \$[\d.]+$/.test(linea) && m && Number(m[2]) === distintos && Number(m[2]) === prods.length && Number(m[1]) + K === Number(m[2]) && K === faltanDistintos && K > 0 && botonVisible && hojaAbierta === K && K < apariciones,
    JSON.stringify({ linea, estado, distintos, apariciones, faltanDistintos, K, hojaAbierta, botonVisible }));

  // Con todos los precios reales no hay botón.
  cargar({ ...MARCA }); await abrir();
  ev(`preciosDataset.data = null; costoSemanaPlan = () => ({ total: 1000, faltan: 0, pendientes: 4, conPrecio: 4, sinEstimar: 0, productos: [] }); costosDelPlan = () => ({ semana: 1000, dia: 100, faltan: 0, pendientes: 4, conPrecio: 4, sinEstimar: 0 }); preciosActivos = () => true; preciosDataset = () => ({}); pintarCostoDia()`);
  ok("E20-frase-completa con todos los precios reales no aparece 'Completar precios'", /Con precio: 4 de 4 productos$/.test(texto("planPreciosEstado")) && !doc().querySelector("[data-completar-precios]"), texto("planPreciosEstado"));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
