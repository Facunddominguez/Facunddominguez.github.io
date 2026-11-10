// E21: Etapa 21 de la Ronda 3 ("Ficha de ingrediente con precio"). Controles E21-un-toque, E21-mi-precio y E21-aviso de
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
  const tocar = async el => { el.click(); await espera(200) };
  const ficha = () => doc().querySelector(".hoja .ficha-precio");
  const linea = () => ficha() ? ficha().querySelector(".ficha-precio__linea").textContent : "";
  const cerrar = async () => { ev("hoja.cerrar()"); await espera(100) };
  const PRECIOS = "miPlatoFacil_referencePrices_v1";

  cargar({ ...MARCA, ...PRES(70000) }); await abrir();
  ev(`ArmameSemana.aplicar(ArmameSemana.armar({ modo: "todo" }))`); await espera(300);

  // E21-un-toque: desde la lista, desde Completar precios y desde una comida se llega a la ficha en un toque.
  ev('openTab("compras")'); await espera(250);
  // Etapa 26 (Ronda 4): la ficha se abre con el botón ⓘ de la fila (un toque), no con el nombre.
  const nombres = [...doc().querySelectorAll("#comprasList .shop-item__ficha")];
  const nArroz = nombres.find(n => /^Arroz/.test(n.dataset.fichaIngrediente));
  await tocar(nArroz);
  const desdeLista = !!ficha() && doc().querySelector(".hoja__titulo").textContent.startsWith("Arroz") && /^≈ \$[\d.]+\/kg · (SEPA|INDEC) .+ · .*20\d\d/.test(linea()) && /entre \$[\d.]+ y \$[\d.]+/.test(linea()) && !!doc().querySelector(".hoja .nutrition-facts");
  const lineaArroz = linea();
  await cerrar();
  ev('openTab("semana")'); await espera(250);
  await tocar(doc().querySelector("[data-completar-precios]"));
  const fila = doc().querySelector(".completar-precios__fila"), nombreFila = fila.querySelector(".tool-button__label").textContent;
  await tocar(fila);
  const desdeCompletar = !!ficha() && doc().querySelector(".hoja__titulo").textContent === nombreFila && /Sin precio publicado|estimado|^≈/.test(linea());
  await cerrar();
  ev('Comidas.abrirComida("plato", MisPlatos.loadSaved().find(x => x.state && ArmameSemana && Object.values(JSON.parse(localStorage.getItem("miPlatoFacil_plan"))).some(d => Object.values(d).includes(x.id))).id)'); await espera(250);
  const ing = doc().querySelector("#comida .comida-ingrediente");
  let desdeComida = false;
  if (ing) { await tocar(ing); desdeComida = !!ficha() && /\$|Sin precio/.test(linea()) }
  await cerrar();
  ok("E21-un-toque desde una comida, desde la lista y desde Completar precios se llega a la ficha (nutrientes y precio con fuente, región, mes y rango) en un toque",
    desdeLista && desdeCompletar && desdeComida, JSON.stringify({ desdeLista, desdeCompletar, desdeComida, lineaArroz, nombreFila }));

  // E21-mi-precio: guardar cambia al instante todos los costos, sin herramientas avanzadas; se puede deshacer y borrar.
  ev('openTab("compras")'); await espera(250);
  const totalAntes = ev("Math.round(costoSemanaPlan().total)"), uiModo = ev("Interfaz.getUiMode()");
  await tocar([...doc().querySelectorAll("#comprasList .shop-item__ficha")].find(n => /^Arroz/.test(n.dataset.fichaIngrediente)));
  /* v17.6: el formulario de Mi precio ya se ve sin tocar "Agregar mi precio" */
  const set = (id, v) => { const e = doc().getElementById(id); e.value = v; e.dispatchEvent(new w.Event("input", { bubbles: true })); e.dispatchEvent(new w.Event("change", { bubbles: true })) };
  set("fichaPrecioMonto", "20000"); set("fichaPrecioCantidad", "1"); set("fichaPrecioUnidad", "kg");
  await tocar([...doc().querySelectorAll(".hoja .ficha-precio__form button")].find(b => /^Guardar( mi precio)?$/.test(b.textContent)));
  // $20.000 por kg de arroz es más de 3 veces lo típico de cereales: avisa y no guarda hasta "Guardar igual".
  const avisoFuera = !!doc().querySelector("[data-ficha-precio-igual]") && /veces más caro/.test(doc().querySelector(".hoja .ficha-precio__form").textContent) && localStorage.getItem(PRECIOS) === null;
  set("fichaPrecioMonto", "2500");
  await tocar([...doc().querySelectorAll(".hoja .ficha-precio__form button")].find(b => /^Guardar( mi precio)?$/.test(b.textContent)));
  const sinAviso = !doc().querySelector("[data-ficha-precio-igual]");
  const guardado = JSON.parse(localStorage.getItem(PRECIOS) || "{}"), entradas = Object.values(guardado);
  const totalDespues = ev("Math.round(costoSemanaPlan().total)");
  const enLinea = linea();
  const resumenCompras = texto("comprasSummary");
  await tocar(doc().querySelector("[data-ficha-precio-deshacer]"));
  const guardadoTras = localStorage.getItem(PRECIOS), totalTras = ev("Math.round(costoSemanaPlan().total)"), trasDeshacer = guardadoTras === null && totalTras === totalAntes;
  await cerrar();
  ok("E21-mi-precio un precio cargado en la ficha cambia al instante los costos, se guarda en referencePrices_v1 sin activar herramientas avanzadas, gana sobre el automático y se puede deshacer",
    avisoFuera && sinAviso && entradas.length === 1 && entradas[0].price === 2500 && entradas[0].unit === "kg" && entradas[0].currency === "ARS" && totalDespues !== totalAntes && /^Mi precio: \$2\.500 por 1 kg/.test(enLinea) && trasDeshacer && uiModo === "simple",
    JSON.stringify({ avisoFuera, sinAviso, entradas: entradas.length, totalAntes, totalDespues, enLinea, trasDeshacer, guardadoTras, totalTras, uiModo, resumenCompras }));

  // E21-aviso: con un precio normal no aparece el aviso, con uno fuera de rango sí; "Guardar igual" guarda.
  const prueba = async (nombre, monto) => {
    ev(`Comidas.abrirNutrientesDeIngrediente(${JSON.stringify(nombre)})`); await espera(150);
    /* v17.6: el formulario de Mi precio ya se ve sin tocar "Agregar mi precio" */
    set("fichaPrecioMonto", monto); set("fichaPrecioCantidad", "1"); set("fichaPrecioUnidad", "kg");
    await tocar([...doc().querySelectorAll(".hoja .ficha-precio__form button")].find(b => /^Guardar( mi precio)?$/.test(b.textContent)));
    const aviso = !!doc().querySelector("[data-ficha-precio-igual]"), msg = aviso ? doc().querySelector(".hoja .ficha-precio__form").textContent : "";
    return { aviso, msg, guardado: Object.keys(JSON.parse(localStorage.getItem(PRECIOS) || "{}")).length };
  };
  cargar({ ...MARCA }); await abrir();
  const normal = await prueba("Frutillas", "4000"); await cerrar();
  const fuera = await prueba("Frutillas", "40000");
  await tocar(doc().querySelector("[data-ficha-precio-igual]"));
  const trasIgual = Object.keys(JSON.parse(localStorage.getItem(PRECIOS) || "{}")).length;
  ok("E21-aviso el aviso de precio fuera de rango aparece con $40.000/kg de frutillas y no con $4.000/kg, y deja guardar igual",
    !normal.aviso && normal.guardado === 1 && fuera.aviso && /frutillas te queda \d+ veces más caro que el precio típico de frutas/.test(fuera.msg) && trasIgual === 1,
    JSON.stringify({ normal, fuera: { aviso: fuera.aviso, msg: fuera.msg, guardado: fuera.guardado }, trasIgual }));

  // E21-datos: lo que ya había en referencePrices_v1 no se pierde al guardar, borrar ni deshacer; si no se entiende, no se escribe.
  const previo = { p1: { id: "p1", name: "Pollo", pack: "", amount: 1, unit: "kg", price: 9000, currency: "ARS", date: "2026-10-20" } };
  cargar({ ...MARCA, [PRECIOS]: JSON.stringify(previo) }); await abrir();
  const guardarArroz = async (monto) => {
    ev('Comidas.abrirNutrientesDeIngrediente("Arroz")'); await espera(150);
    /* v17.6: el formulario de Mi precio ya se ve sin tocar "Agregar mi precio" */
    set("fichaPrecioMonto", monto); set("fichaPrecioCantidad", "1"); set("fichaPrecioUnidad", "kg");
    await tocar([...doc().querySelectorAll(".hoja .ficha-precio__form button")].find(b => /^Guardar( mi precio)?$/.test(b.textContent)));
  };
  await guardarArroz("2500");
  const trasGuardar = JSON.parse(localStorage.getItem(PRECIOS)), conserva = JSON.stringify(trasGuardar.p1) === JSON.stringify(previo.p1) && Object.keys(trasGuardar).length === 2;
  await tocar(doc().querySelector("[data-ficha-precio-borrar]"));
  const trasBorrar = JSON.parse(localStorage.getItem(PRECIOS)), conservaBorrar = JSON.stringify(trasBorrar) === JSON.stringify(previo);
  await tocar(doc().querySelector("[data-ficha-precio-deshacer]"));
  const trasDeshacerBorrar = Object.keys(JSON.parse(localStorage.getItem(PRECIOS))).length === 2;
  await cerrar();
  const roto = JSON.stringify({ ...previo, p2: { id: "p2", name: "Mal", amount: 1, unit: "kg", price: 0, currency: "ARS", date: "2026-10-20", pack: "" } });
  cargar({ ...MARCA, [PRECIOS]: roto }); await abrir();
  await guardarArroz("2500");
  const sinTocar = localStorage.getItem(PRECIOS) === roto && /No pude guardar sin tocar tus precios anteriores/.test(doc().querySelector(".hoja .ficha-precio").textContent);
  ok("E21-datos guardar, borrar y deshacer conservan los precios que ya había en referencePrices_v1, y si lo guardado no se entiende no se escribe nada",
    conserva && conservaBorrar && trasDeshacerBorrar && sinTocar, JSON.stringify({ conserva, conservaBorrar, trasDeshacerBorrar, sinTocar }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
