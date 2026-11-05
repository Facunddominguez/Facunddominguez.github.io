// E24: Etapa 24 de la Ronda 3 ("Semana más clara"). Controles E24-sin-elegir, E24-boton, E24-aviso, E24-separacion y E24-recorrido de
// docs/validacion/criterios.json. Usan el datos/precios.json REAL y datos inventados.
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
  const pesos = t => { const m = /\$([\d.]+)/.exec(t || ""); return m ? Number(m[1].replace(/\./g, "")) : null };
  const armame = () => doc().querySelector("#plan [data-armame]");
  const set = (id, v) => { const e = doc().getElementById(id); e.value = v; e.dispatchEvent(new w.Event("input", { bubbles: true })) };

  // Semana vacía: "Armame la semana" es la única acción principal y no hay "Elegir el almuerzo de hoy".
  cargar({ ...MARCA, ...PRES(70000) }); await abrir();
  ev('openTab("semana")'); await espera(250);
  const vacioOk = !doc().getElementById("planVacioElegir") && ![...doc().querySelectorAll("#plan button")].some(b => /Elegir el almuerzo de hoy/.test(b.textContent)) && armame().classList.contains("button--primary") && armame().textContent === "Armame la semana";
  const principales = [...doc().querySelectorAll("#plan > button.button--primary, #plan > .semana-cabeza ~ button.button--primary")].filter(b => b.getClientRects().length);
  ok("E24-sin-elegir no hay botón 'Elegir el almuerzo de hoy' y Armame la semana es la única acción principal de arriba", vacioOk && principales.length === 1, JSON.stringify({ vacioOk, principales: principales.map(b => b.textContent) }));

  // Armar con el botón: el aviso queda con Deshacer y el mismo total que Semana y Compras, pasados más de 10 segundos.
  await tocar(armame());
  { const v = doc().querySelector('.hoja [data-armame-modo="vacios"]'); if (v) await tocar(v); } await espera(300); // v17.6: con la semana vacía arma directo
  const avisoYa = texto("planAviso"), totalAviso = pesos(/≈ \$[\d.]+ la semana/.exec(avisoYa) && /≈ \$[\d.]+ la semana/.exec(avisoYa)[0]);
  await espera(10500);
  const avisoDespues = texto("planAviso"), hayDeshacer = !!doc().querySelector("#planAviso [data-plan-deshacer]");
  const linea = texto("planDiaCosto"), totalSemana = pesos(/Semana (?:al menos )?≈ \$[\d.]+/.exec(linea) && /Semana (?:al menos )?≈ \$[\d.]+/.exec(linea)[0]);
  ev('openTab("compras")'); await espera(250);
  const totalCompras = pesos(/≈ \$[\d.]+/.exec(texto("comprasSummary")) && /≈ \$[\d.]+/.exec(texto("comprasSummary"))[0]);
  ev('openTab("semana")'); await espera(250);
  ok("E24-aviso el aviso de semana armada sigue visible después de 10 segundos, con Deshacer y el mismo total que Semana y Compras",
    /^Listo: 28 comidas armadas/.test(avisoDespues) && hayDeshacer && totalAviso > 0 && totalAviso === totalSemana && totalSemana === totalCompras,
    JSON.stringify({ avisoDespues: avisoDespues.slice(0, 90), hayDeshacer, totalAviso, totalSemana, totalCompras }));

  // Con la semana completa, Armame pasa a ser secundaria (Rehacer semana).
  ok("E24-boton con la semana completa (28 de 28) el botón pasa a ser secundario y dice 'Rehacer semana'",
    armame().textContent === "Rehacer semana" && armame().classList.contains("button--soft") && !armame().classList.contains("button--primary"),
    armame().textContent + " " + armame().className);

  // Separación de al menos 16 px entre la cabecera, los chips de los días y el contenido.
  const rect = s => { const e = doc().querySelector(s); return e && !e.hidden && e.getClientRects().length ? e.getBoundingClientRect() : null };
  const cab = rect(".semana-cabeza"), arm = rect("#plan [data-armame]"), dias = rect("#planDias"), panel = rect("#currentPlanPanel");
  const antesDias = [rect("#planObjetivos"), rect("#planSemanaNueva"), rect("#planHint"), arm].filter(Boolean).sort((a, b) => b.bottom - a.bottom)[0];
  const gaps = { cabArm: arm.top - cab.bottom, antesDias: dias.top - antesDias.bottom, diasPanel: panel.top - dias.bottom };
  ok("E24-separacion entre la cabecera, los chips de los días y el contenido hay al menos 16 px", Object.values(gaps).every(g => g >= 16 - 0.5), JSON.stringify(gaps));

  // Recorrido final: completar 2 precios desde la ficha, cambiar una comida por una más barata y compartir la lista.
  const conPrecio = () => { const m = /Con precio: (\d+) de (\d+)/.exec(texto("planPreciosEstado")); return m ? Number(m[1]) : null };
  const antes = conPrecio();
  for (let i = 0; i < 2; i++) {
    await tocar(doc().querySelector("[data-completar-precios]"));
    await tocar(doc().querySelector(".completar-precios__fila"));
    /* v17.6: el formulario de Mi precio ya se ve sin tocar "Agregar mi precio" */
    set("fichaPrecioMonto", "3000"); set("fichaPrecioCantidad", "1"); doc().getElementById("fichaPrecioUnidad").value = "kg";
    await tocar([...doc().querySelectorAll(".hoja .ficha-precio__form button")].find(b => /^Guardar( mi precio)?$/.test(b.textContent)));
    const igual = doc().querySelector("[data-ficha-precio-igual]"); if (igual) await tocar(igual);
    ev("hoja.cerrar()"); await espera(150)
  }
  const despuesPrecios = conPrecio();
  // El aviso de semana armada muestra el total de ahora, no el de antes de completar los precios.
  const totalAvisoAhora = pesos(/≈ \$[\d.]+ la semana/.exec(texto("planAviso")) && /≈ \$[\d.]+ la semana/.exec(texto("planAviso"))[0]), totalSemanaAhora = pesos(/Semana (?:al menos )?≈ \$[\d.]+/.exec(texto("planDiaCosto")) && /Semana (?:al menos )?≈ \$[\d.]+/.exec(texto("planDiaCosto"))[0]);
  // Más barata desde un hueco (hoja del hueco).
  const antesPlan = ev("JSON.stringify(loadPlan())"); let cambiada = false, msg = "";
  for (const hueco of [...doc().querySelectorAll("#planList .hueco")].slice(2, 4)) {
    await tocar(hueco);
    const b = doc().querySelector("[data-hueco-barata]");
    if (b) { await tocar(b); msg = texto("planStatus") + doc().querySelector(".hoja__estado").textContent; if (ev("JSON.stringify(loadPlan())") !== antesPlan) { cambiada = true; break } }
    ev("hoja.cerrar()"); await espera(100)
  }
  ev("hoja.cerrar()"); await espera(100);
  // Compartir.
  ev('openTab("compras")'); await espera(250);
  let compartido = null;
  Object.defineProperty(w.navigator, "share", { value: t => { compartido = t; return Promise.resolve() }, configurable: true });
  await tocar(doc().querySelector("[data-compras-compartir]"));
  ok("E24-recorrido armar la semana, completar 2 precios desde la ficha, cambiar una comida por una más barata y compartir la lista funciona de punta a punta",
    antes !== null && despuesPrecios >= antes + 2 && totalAvisoAhora > 0 && totalAvisoAhora === totalSemanaAhora && !!compartido && /\*Total ≈ \$/.test(compartido.text) && cambiada,
    JSON.stringify({ antes, despuesPrecios, totalAvisoAhora, totalSemanaAhora, cambiada, msg: msg.slice(0, 120), compartido: !!compartido }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
