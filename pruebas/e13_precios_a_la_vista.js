// E13: Etapa 13 del rediseño (Precios a la vista). C13-1 a C13-4 son los controles E13-cobertura-y-fuente, E13-costos, E13-conversiones y
// E13-respeta-eleccion de docs/validacion/criterios.json. Usan el datos/precios.json REAL incrustado (como C9-1) y datos inventados.
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
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };
  const semanaDeIdeas = () => ev(`(() => { const dias = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]; let i = 0;
    for (const d of dias) for (const s of ["almuerzo","cena"]) { const it = IdeasHoja.guardarIdea(data.menuCatalog[i++ % data.menuCatalog.length], "Día libre").item; setSlot(d, s, it.id) } })()`);

  // C13-1 Instalación nueva: precios encendidos, 80 % o más de la lista con precio y cada precio muestra fuente, mes y rango al tocarlo.
  cargar(MARCA); await abrir();
  const encendidos = ev("preciosActivos()") === true && ev("regionPrecios()") === "GBA" && localStorage.getItem("miPlatoFacil_mostrarPrecios_v1") === null;
  semanaDeIdeas(); await espera(60);
  ev('openTab("compras")'); await espera(200);
  const p = JSON.parse(ev(`JSON.stringify((() => { const items = shoppingDisplayItems(), pr = preciosDeLaLista(items); const reales = new Set(pr.productos.filter(x => x.tipo === "real").map(x => x.key)); return { n: items.length, con: reales.size, detalles: [...pr.porDetalle].filter(([k]) => reales.has(k)).map(e => e[1]), faltan: pr.faltan } })())`));
  const conFuenteYMes = p.detalles.length > 0 && p.detalles.every(t => /^≈ \$[\d.]+( · entre \$[\d.]+ y \$[\d.]+)? · .*(SEPA|INDEC|Mi precio)/.test(t) && /(20\d\d|\b(ene|feb|mar|abr|may|jun|jul|ago|sept|oct|nov|dic)\.|\d{1,2}\/\d{1,2})/.test(t));
  const rangos = p.detalles.filter(t => / · entre \$/.test(t)).length;
  const tap = doc().querySelector("#comprasList .precio-tap"), cb = tap && tap.closest(".shop-item").querySelector("input"), marcaAntes = cb && cb.checked;
  if (tap) tap.click(); await espera(60);
  const detalleVisible = tap && !tap.closest(".shop-item").querySelector(".precio-detalle").hidden && /≈ \$/.test(tap.closest(".shop-item").querySelector(".precio-detalle").textContent) && tap.getAttribute("aria-expanded") === "true" && cb.checked === marcaAntes;
  ok("C13-1 con precios encendidos por defecto, el 80 % o más de la lista tiene precio y cada uno muestra fuente, mes y rango al tocarlo", encendidos && p.n >= 15 && p.con / p.n >= 0.8 && conFuenteYMes && rangos > 0 && detalleVisible, JSON.stringify({ encendidos, n: p.n, con: p.con, conFuenteYMes, rangos, detalleVisible, ejemplo: p.detalles[0] }));

  // C13-2 Costo por comida, por día y por semana; "faltan N precios" una sola vez; personas lo escalan.
  ev('openTab("semana")'); await espera(200);
  const huecos = [...doc().querySelectorAll("#planDiaLista .hueco__costo, .hueco__costo")].map(e => e.textContent);
  const linea = doc().getElementById("planDiaCosto") ? doc().getElementById("planDiaCosto").textContent : "";
  const semana1 = ev("costosDelPlan().semana");
  ev("CantidadesPlatos.cambiarPersonasHogar(3)"); await espera(60);
  const semana3 = ev("costosDelPlan().semana");
  const armada = ev(`(() => { const it = MisPlatos.loadSaved().find(x => x.state); return it ? etiquetaCostoComida({ origen: "plato", id: it.id }) : "" })()`);
  ok("C13-2 hay ≈ costo por comida, por día y por semana, \"faltan\" aparece una sola vez y las personas escalan el costo",
    huecos.length >= 1 && huecos.every(t => /^≈ \$[\d.]+( · estimado)?$/.test(t)) && /^Semana (al menos )?≈ \$[\d.]+ · hoy/.test(linea) && (linea.match(/faltan/g) || []).length <= 1 && semana1 > 0 && semana3 > semana1 * 1.5 && semana3 <= semana1 * 3.01 && /≈ \$[\d.]+ por porción/.test(armada),
    JSON.stringify({ huecos: huecos.length, linea, semana1, semana3, armada }));

  // C13-3 Conversiones unidad → kg: el precio de una unidad queda en un rango plausible respecto del precio por kg.
  cargar(MARCA); await abrir();
  const TIPICO = { Banana: 120, Manzana: 180, Naranja: 200, Tomate: 150, Cebolla: 150, Papa: 200, Zanahoria: 100, Zapallito: 200, Huevo: 55, Limón: 100, Palta: 200, "Morrón rojo": 200, Pepino: 250, Batata: 250, Pera: 180 };
  const filas = JSON.parse(ev(`JSON.stringify(${JSON.stringify(Object.keys(TIPICO))}.map(n => { const u = precioDe(n, 1, "unidad"), kg = precioDe(n, 1000, "g"); return [n, u && u.costo, kg && kg.costo] }))`));
  const medidos = filas.filter(([, u, kg]) => u && kg), fuera = medidos.filter(([n, u, kg]) => { const esperado = kg * TIPICO[n] / 1000; return u < 0.5 * esperado || u > 2 * esperado });
  ok("C13-3 el precio por unidad de 15 ingredientes comunes queda dentro de un rango plausible respecto del precio por kg", medidos.length >= 12 && !fuera.length, JSON.stringify({ medidos: medidos.length, fuera: fuera.map(([n, u, kg]) => [n, Math.round(u), Math.round(kg)]) }));

  // C13-4 Quien ya tenía la app conserva lo que había elegido.
  const activos = datos => { cargar({ ...MARCA, ...datos }); return abrir().then(() => ev("preciosActivos()")) };
  const simple = await activos({ miPlatoFacil_uiMode_v1: "simple" }), completo = await activos({ miPlatoFacil_uiMode_v1: "completo" });
  const apagado = await activos({ miPlatoFacil_mostrarPrecios_v1: '{"mostrar":false}', miPlatoFacil_uiMode_v1: "completo" }), prendido = await activos({ miPlatoFacil_mostrarPrecios_v1: '{"mostrar":true}', miPlatoFacil_uiMode_v1: "simple" });
  ok("C13-4 quien ya había elegido modo o precios conserva lo que tenía (simple apagado, completo y la elección de precios mandan)", simple === false && completo === true && apagado === false && prendido === true, JSON.stringify({ simple, completo, apagado, prendido }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
