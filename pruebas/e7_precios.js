// E7: Etapa 7 del rediseño (precios automáticos de INDEC). Se usa SIEMPRE el archivo de ejemplo datos/precios-ejemplo.json
// (valores redondos, no son precios reales) y nunca una descarga. Los precios se ven con "Mostrar precios y presupuesto"
// (el mismo interruptor del modo simple, uiMode_v1). La app se abre en un marco aparte para poder recargarla.
// C7-1 a C7-4 son los controles E7-precio-item-total, E7-costo-porcion, E7-region y E7-mi-precio de criterios.json.
(async () => {
  const T = []; const ok = (n, c, d) => T.push((c ? "PASA " : "FALLA ") + n + (d !== undefined && d !== "" ? " · " + d : ""));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  let marco = null, w = null, toques = 0;
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
  const q = s => { const e = doc().querySelector(s); if (!e) throw Error("no está en la pantalla: " + s + " (pantalla: " + ev("stack.at(-1)") + ")"); return e };
  const qa = s => [...doc().querySelectorAll(s)];
  const $ = id => q("#" + id);
  const tocar = async el => { el.click(); toques++; await espera(120) };
  const irA = async pestana => { await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')); if (ev("stack.at(-1) !== activeTabRoot()")) await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')) };
  const pantalla = () => ev("stack.at(-1)");
  const visible = e => !!e && e.getClientRects().length > 0;
  const seVe = (e, texto) => visible(e) && e.innerText.includes(texto);
  const menuCompras = async herr => { await tocar(q("#compras [data-compras-menu]")); await tocar(q('.hoja [data-compras-herr="' + herr + '"]')) };
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const todo = () => JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith("miPlatoFacil_") && k !== "miPlatoFacil_uiMode_v1").sort().map(k => [k, localStorage.getItem(k)]));
  const J = k => JSON.parse(R.data[k]);
  const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const planDe = slots => { const p = {}; for (const d of DIAS) p[d] = { desayuno: null, merienda: null, almuerzo: null, cena: null }; for (const [d, c, id] of slots) p[d][c] = id; return JSON.stringify(p) };
  const conReceta = (id, titulo, filas, rinde) => ({
    miPlatoFacil_recipeDetails_v1: JSON.stringify({ [id]: { id, title: titulo, sourceTitle: null, amountsTitle: "receta:" + id, steps: ["Cocinar"], notes: "" } }),
    miPlatoFacil_recipeAmounts_v1: JSON.stringify({ ["receta:" + id]: { yield: rinde || 1, rows: filas } }),
    miPlatoFacil_saved: JSON.stringify([{ id: "rp_" + id, savedAt: "2026-10-26T10:00:00.000Z", type: "plato", title: titulo, lines: [], sig: "recipe-ref:" + id + ":plato", text: titulo, cooked: 0, state: null, recipeSourceId: id, recipeIngredients: filas.map(x => x.name) }]),
    miPlatoFacil_plan: planDe([["lunes", "almuerzo", "rp_" + id]])
  });
  const EJEMPLO = await (await fetch("/datos/precios-ejemplo.json", { cache: "no-store" })).json();
  const UI = "miPlatoFacil_uiMode_v1", REGION = "miPlatoFacil_region_v1", PRECIOS = "miPlatoFacil_referencePrices_v1";
  const abrirConEjemplo = async () => { await abrir(); w.preciosDataset.data = EJEMPLO; w.preciosDataset.cache = null; w.refrescarPrecios(); await espera(50) };
  const RECETA = [{ name: "Arroz", quantity: 300, unit: "g" }, { name: "Pollo", quantity: 500, unit: "g" }, { name: "Zapallito", quantity: 3, unidad: 1, unit: "unidad" }];
  const base = (extra = {}) => ({ ...conReceta("recipe_e7prue01", "Arroz con pollo", RECETA, 2), ...extra });
  const texto = id => doc().getElementById(id).textContent;
  const listaTxt = () => texto("comprasList") + " " + texto("comprasSummary");
  const fila = nombre => qa("#comprasList .shop-item label").find(l => l.textContent.startsWith(nombre));
  const tarjeta = () => qa(".comida-card").map(c => c.textContent).join(" | ");

  // C7-1 La lista muestra ≈ precio por ítem y el total; con "faltan N precios"; apagado no muestra nada y avisa cómo activarlo
  cargar(base()); await abrirConEjemplo();
  await irA("compras");
  const apagadoSin = !listaTxt().includes("≈") && visible($("comprasPreciosAviso")) && $("comprasPreciosAviso").textContent === "Precios estimados: activalos en Preferencias" && !visible($("comprasPrecioFuente"));
  await tocar($("comprasPreciosAviso"));
  const alAviso = pantalla() === "preferencias";
  await tocar($("uiModeToggle"));
  await irA("compras");
  const arroz = fila("Arroz"), pollo = fila("Pollo");
  ok("C7-1 la lista muestra ≈ precio por ítem y el total, con 'faltan N precios'; sin activar los precios no muestra nada y avisa cómo activarlos",
    apagadoSin && alAviso && ev("getUiMode()") === "completo" && !!arroz && arroz.textContent.includes("≈ $600") && !!pollo && pollo.textContent.includes("≈ $2.500") && !fila("Zapallito").textContent.includes("≈") && texto("comprasSummary").includes("≈ $3.100 (faltan 1 precio)") && seVe($("comprasPrecioFuente"), "Promedio INDEC · GBA · sept. 2026") && !visible($("comprasPreciosAviso")),
    listaTxt());

  // C7-2 Cada comida muestra ≈ costo por porción (detalle, tarjeta) y Semana el costo del día
  cargar(base({ [UI]: "completo" })); await abrirConEjemplo();
  ev('abrirComida("receta","recipe_e7prue01")'); await espera(150);
  const detalleReceta = texto("comidaCosto");
  ev('abrirComida("plato","rp_recipe_e7prue01")'); await espera(150);
  const detallePlato = texto("comidaCosto");
  ev('go("misplatos");renderSaved()'); await espera(100);
  const tarj = tarjeta();
  ev('planDiaElegido="lunes";renderPlan()'); await espera(50);
  const dia = texto("planDiaCosto");
  ok("C7-2 cada comida muestra ≈ costo por porción (detalle y tarjeta) y Semana, el costo del día",
    detalleReceta.startsWith("≈ $1.550 por porción (faltan 1 precio)") && detallePlato.startsWith("≈ $1.550 por porción") && tarj.includes("≈ $1.550 por porción") && dia === "≈ $3.100 por día (faltan 1 precio)",
    [detalleReceta, detallePlato, dia].join(" | "));

  // C7-3 Cambiar la región cambia los valores; GBA por defecto; un valor guardado inválido se ignora
  cargar(base({ [UI]: "completo" })); await abrirConEjemplo();
  const porDefecto = ev("regionPrecios()") === "GBA" && localStorage.getItem(REGION) === null;
  await irA("compras");
  const gba = texto("comprasSummary");
  const sel = $("preciosRegion"); sel.value = "Pampeana"; sel.dispatchEvent(new w.Event("change", { bubbles: true })); await espera(150);
  const pamp = texto("comprasSummary"), fuentePamp = texto("comprasPrecioFuente");
  ev('abrirComida("receta","recipe_e7prue01")'); await espera(100);
  const porcionPamp = texto("comidaCosto");
  localStorage.setItem(REGION, '{"region":"Marte"}'); w.refrescarPrecios();
  const invalida = ev("regionPrecios()") === "GBA";
  ok("C7-3 cambiar la región cambia los valores (GBA por defecto; una región inválida guardada se ignora)",
    porDefecto && gba.includes("≈ $3.100") && pamp.includes("≈ $3.750") && fuentePamp.includes("Pampeana") && porcionPamp.startsWith("≈ $1.875 por porción") && localStorage.getItem(REGION) !== null && invalida && doc().getElementById("preciosRegion").value === "GBA",
    [gba, pamp, porcionPamp].join(" | "));

  // C7-4 Mi precio gana sobre el promedio de INDEC (solo en pesos); quitarlo vuelve al automático
  const mio = (id, name, price, currency) => ({ id, name, pack: "", amount: 1, unit: "kg", price, currency, date: "2026-10-20" });
  cargar(base({ [UI]: "completo", [PRECIOS]: JSON.stringify({ p1: mio("p1", "Arroz", 2800, "ARS"), p2: mio("p2", "Pollo", 9000, "USD") }) })); await abrirConEjemplo();
  await irA("compras");
  const conMio = texto("comprasSummary"), arrozMio = fila("Arroz").textContent;
  localStorage.setItem(PRECIOS, "{}"); w.refrescarPrecios();
  const sinMio = texto("comprasSummary");
  ok("C7-4 Mi precio gana sobre el precio automático (en pesos) y al quitarlo vuelve al promedio de INDEC",
    arrozMio.includes("≈ $840") && conMio.includes("≈ $3.340") && sinMio.includes("≈ $3.100") && ev('precioDe("Arroz",1000,"g").propio') === false, [arrozMio, conMio, sinMio].join(" | "));

  // C7-5 Los datos: el de ejemplo y el incrustado en la app cumplen las mismas comprobaciones y convierten bien las unidades
  const valido = ev("validPreciosData(PRECIOS_SNAPSHOT)") && w.validPreciosData(EJEMPLO);
  const nombresOk = ev("PRECIOS_SNAPSHOT.items.every(i=>nutritionFor(i.n)!==null&&['kg','l','unidad'].includes(i.b)&&i.p.GBA>0)") && EJEMPLO.items.every(i => w.nutritionFor(i.n));
  const sinRed = !/https?:\/\/[^"]*indec/i.test(ev("preciosDataset.toString()+precioDe.toString()+atribucionPrecios.toString()"));
  cargar({}); await abrir();
  const huevos = ev('precioDe("Huevo",6,"unidad").costo'), leche = ev('precioDe("Leche",1030,"g").costo'), arrozKg = ev('precioDe("Arroz",1,"kg").costo');
  const real = ev("PRECIOS_SNAPSHOT.items");
  const px = n => real.find(i => i.n === n).p.GBA;
  ok("C7-5 los datos de ejemplo y los incrustados pasan las mismas comprobaciones y las unidades se convierten (huevo por unidad, leche en litros)",
    valido && nombresOk && sinRed && Math.abs(huevos - 6 * px("Huevo")) < 0.01 && Math.abs(px("Huevo") * 12 - 3940.5) < 0.1 && Math.abs(leche - px("Leche")) < 0.01 && Math.abs(arrozKg - px("Arroz")) < 0.01 && ev('precioDe("Sal",1,"taza")') !== undefined && ev('precioDe("Zapallito",1,"kg")') === null,
    [huevos, leche, arrozKg].join(" · "));

  // C7-6 La región va al respaldo como opcional: un respaldo viejo (sin ella) se restaura y la deja como está; uno inválido se rechaza
  cargar({ [REGION]: '{"region":"Cuyo"}' }); await abrir();
  const conRegion = JSON.parse(JSON.stringify(w.completeBackupSnapshot(w.localStorage)));
  const incluida = conRegion.data[REGION] === '{"region":"Cuyo"}';
  cargar({}); await abrir();
  const vacio = w.completeBackupSnapshot(w.localStorage);
  const omitida = !(REGION in vacio.data);
  cargar({ [REGION]: '{"region":"Noroeste"}' });
  w.restoreCompleteBackup(JSON.parse(JSON.stringify(R)), w.localStorage);
  const viejoLaDeja = !(REGION in R.data) && localStorage.getItem(REGION) === '{"region":"Noroeste"}';
  const malo = JSON.parse(JSON.stringify(conRegion)); malo.data[REGION] = '{"region":"Marte"}';
  let rechazado = false; try { w.validateCompleteBackup(malo) } catch (e) { rechazado = true }
  w.restoreCompleteBackup(JSON.parse(JSON.stringify(conRegion)), w.localStorage);
  ok("C7-6 la región de los precios va al respaldo como opcional, un respaldo viejo la deja como está y uno inválido se rechaza",
    incluida && omitida && viejoLaDeja && rechazado && localStorage.getItem(REGION) === '{"region":"Cuyo"}');

  // C7-7 Apagado, no se ve ningún ≈ $ ni la fuente; el interruptor es el del modo simple y no cambia datos
  cargar(base({ [UI]: "completo" })); await abrirConEjemplo();
  const datosAntes = todo();
  const etiquetaOn = $("uiModeToggle").querySelector(".tool-button__label").textContent;
  await tocar($("uiModeToggle"));
  const etiquetaOff = $("uiModeToggle").querySelector(".tool-button__label").textContent;
  await irA("compras");
  const lista = listaTxt() + " " + texto("comprasPrecioFuente");
  ev('abrirComida("receta","recipe_e7prue01")'); await espera(100);
  const det = texto("comidaCosto");
  ev('go("misplatos");renderSaved();planDiaElegido="lunes";renderPlan()'); await espera(80);
  ok("C7-7 con 'Mostrar precios y presupuesto' apagado no se ve ningún ≈ $ ni la fuente y los datos no cambian",
    etiquetaOn === "Mostrar precios y presupuesto: activado" && etiquetaOff === "Mostrar precios y presupuesto: desactivado" && ev("getUiMode()") === "simple" && !lista.includes("≈") && det === "" && !tarjeta().includes("≈") && texto("planDiaCosto") === "" && todo() === datosAntes,
    lista);

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
