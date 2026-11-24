// R5 · Etapa 36 (Completar precios): ítems S-07, S-08, S-09 y S-10 de docs/ronda-5-lista.md.
// Usa el respaldo de ejemplo (hay productos sin precio real) y los precios congelados que sirve probar.mjs.
(async () => {
  const H = R5H(), { ok, espera, tocar } = H;
  const ev = x => H.ev(x), doc = () => H.doc();
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  // Sin "Mis precios" cargados, así hay varios productos que completar.
  await H.abrir({ ...R.data, ...H.MARCA, miPlatoFacil_referencePrices_v1: null });
  ev('openTab("semana")'); await espera(300);
  const link = () => doc().querySelector("#planPreciosEstado [data-completar-precios]");
  const K = Number((/Completar (\d+)/.exec((link() || { textContent: "" }).textContent) || [0, 0])[1]);
  const prods = ev("productosSinPrecioReal().map(x => x.name)");
  const pos = () => (doc().querySelector(".hoja .completar-precios__pos") || { textContent: "" }).textContent;
  const nom = () => (doc().querySelector(".hoja .completar-precios__nombre") || { textContent: "" }).textContent;
  const refs = () => Object.keys(JSON.parse(localStorage.getItem("miPlatoFacil_referencePrices_v1") || "{}")).length;

  // R5-S-07: abre directo el primer producto con su formulario, sin lista intermedia.
  await tocar(link(), 300);
  const monto = doc().getElementById("completarMonto");
  ok("R5-S-07 'Completar N precios' abre directo el primer producto con su formulario de precio (monto, cantidad y unidad), sin lista de productos para tocar",
    K >= 2 && K === prods.length && H.visible(monto) && nom() === prods[0] && !!doc().getElementById("completarCantidad") && !!doc().getElementById("completarUnidad") && !doc().querySelector(".hoja .completar-precios__fila") && !/Tocá un producto/.test(H.textoHoja()), JSON.stringify({ K, prods, nombre: nom() }));

  // R5-S-08: Anterior y Siguiente con "2 de N" a la vista.
  const p1 = pos(), n1 = nom(), antes1 = H.boton(/^Anterior$/, H.hoja()).disabled;
  await tocar(H.boton(/^Siguiente$/, H.hoja()));
  const p2 = pos(), n2 = nom();
  await tocar(H.boton(/^Anterior$/, H.hoja()));
  const p3 = pos(), n3 = nom();
  for (let i = 1; i < K; i++) await tocar(H.boton(/^Siguiente$/, H.hoja()), 80);
  const ultimo = pos(), sigUltimo = H.boton(/^Siguiente$/, H.hoja()).disabled;
  for (let i = 1; i < K; i++) await tocar(H.boton(/^Anterior$/, H.hoja()), 80);
  ok("R5-S-08 hay botones 'Anterior' y 'Siguiente' para pasar de producto y se ve 'N de K' (1 de K, 2 de K, y de vuelta 1 de K; Anterior apagado en el primero y Siguiente en el último)",
    p1 === `1 de ${K}` && p2 === `2 de ${K}` && p3 === `1 de ${K}` && n2 === prods[1] && n3 === n1 && antes1 === true && ultimo === `${K} de ${K}` && sigUltimo === true && pos() === `1 de ${K}`, JSON.stringify({ p1, p2, p3, n1, n2, n3, ultimo }));

  // R5-S-09: Guardar precios guarda de una vez todos los completados y dice cuántos guardó.
  const antesRefs = refs(), w_Event = H.w().Event;
  const tipico = n => ev(`Math.max(1, Math.round((costoDeIngrediente(${JSON.stringify(n)}, 1, unidadSugeridaFicha(${JSON.stringify(n)})) || { costo: 2000 }).costo))`);
  const llenar = async n => { const el = doc().getElementById("completarMonto"); el.value = String(tipico(n)); el.dispatchEvent(new w_Event("input")) };
  // A: se completa solo el primero → guarda 1 y dice que falta 1.
  await llenar(prods[0]);
  const cuentaA = H.textoHoja();
  await tocar(H.boton(/^Guardar precios$/, H.hoja()), 400);
  const msgA = H.textoHoja(), refsA = refs();
  // B: se completa el que queda → guarda y cierra diciendo cuántos guardó.
  await llenar(nom());
  await tocar(H.boton(/^Guardar precios$/, H.hoja()), 400);
  const estadoB = doc().getElementById("planStatus").textContent, cerrada = !H.hoja() || !H.visible(H.hoja());
  // C: dos a la vez.
  await H.abrir({ ...R.data, ...H.MARCA, miPlatoFacil_referencePrices_v1: null });
  ev('openTab("semana")'); await espera(300);
  await tocar(link(), 300);
  await llenar(prods[0]); await tocar(H.boton(/^Siguiente$/, H.hoja())); await llenar(prods[1]);
  const cuentaC = H.textoHoja();
  await tocar(H.boton(/^Guardar precios$/, H.hoja()), 400);
  const estadoC = doc().getElementById("planStatus").textContent, refsC = refs();
  ok("R5-S-09 'Guardar precios' guarda de una vez todos los que se completaron y dice cuántos guardó (1 y 'Faltan 1'; después 1 y cierra; o los 2 juntos)",
    /Completaste 1 de 2/.test(cuentaA) && /Guardé 1 precio\./.test(msgA) && /Faltan 1/.test(msgA) && refsA === antesRefs + 1
    && /Guardé 1 precio\./.test(estadoB) && cerrada && /Completaste 2 de 2/.test(cuentaC) && /Guardé 2 precios\./.test(estadoC) && refsC === 2 && ev("productosSinPrecioReal().length") === 0,
    JSON.stringify({ cuentaA: cuentaA.slice(-60), msgA: msgA.slice(-120), refsA, antesRefs, estadoB, cerrada, estadoC, refsC }));
  await H.cerrarHoja();

  // R5-S-10: cargarle el precio a todos los productos que faltan los saca de "Completar precios" (frutos secos y cualquier otro).
  await H.abrir({ ...R.data, ...H.MARCA, miPlatoFacil_referencePrices_v1: null });
  const nombres = ev("productosSinPrecioReal().map(x => x.name)"), siguen = [];
  for (const n of nombres) {
    ev(`guardarMiPrecio(${JSON.stringify(n)}, 2000, 1, unidadSugeridaFicha(${JSON.stringify(n)}))`);
    ev("refrescarPrecios()");
    if (ev("productosSinPrecioReal().some(x => x.name === " + JSON.stringify(n) + ")")) siguen.push(n);
  }
  // Medidas de cocina (1/4 taza, cucharadas) de los productos de las comidas armadas: un precio por kilo alcanza para costearlas.
  const medidas = JSON.parse(ev(`(() => {
    const nombres = new Set(); for (const v of Object.values(data.comprables)) for (const n of v) nombres.add(n);
    for (const l of [data.menuCatalog, data.desayunoCatalog]) for (const i of l) for (const r of i.cantidades) nombres.add(r[0]);
    const malos = [], previo = localStorage.getItem("miPlatoFacil_referencePrices_v1");
    for (const n of nombres) {
      if (fueraDeLaLista(n)) continue;
      localStorage.removeItem("miPlatoFacil_referencePrices_v1"); guardarMiPrecio(n, 8000, 1, "kg");
      for (const [q, u] of [[0.25, "taza"], [1, "cucharada"], [1, "cucharadita"]]) { const c = costoDeIngrediente(n, q, u); if (!c || c.estimado) malos.push(n + " [" + q + " " + u + "]") }
    }
    if (previo === null) localStorage.removeItem("miPlatoFacil_referencePrices_v1"); else localStorage.setItem("miPlatoFacil_referencePrices_v1", previo);
    return JSON.stringify({ n: nombres.size, malos });
  })()`));
  ev('openTab("semana")'); await espera(300);
  ok("R5-S-10 después de cargarle el precio a cada producto, ninguno (frutos secos incluidos) sigue en 'Completar precios' ni en el aviso 'Completar N precios'",
    nombres.length > 0 && siguen.length === 0 && medidas.malos.length === 0 && medidas.n > 60 && ev("productosSinPrecioReal().length") === 0 && !doc().querySelector("#planPreciosEstado [data-completar-precios]"), JSON.stringify({ medidas, nombres, siguen, resto: ev("productosSinPrecioReal().map(x => x.name)") }));

  return H.terminar();
})()
