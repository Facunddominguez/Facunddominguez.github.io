// E25: arreglos de la v17.6 (pedidos después de la Ronda 3). Usan el datos/precios.json REAL y datos inventados.
// E25-semana-que-viene: se puede ir a la semana que viene, armarla y volver, sin tocar el plan de esta semana; entra al respaldo.
// E25-ficha: la ficha de un ingrediente tiene el formulario de Mi precio abierto (sin botón "Agregar mi precio") y, desde
//            "Completar precios", muestra el precio antes que los nutrientes.
// E25-texto: el detalle de una comida dice que al tocar un ingrediente se ven nutrientes y precio.
// E25-desayunos: Armame la semana no arma desayunos ni meriendas sin proteína.
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
  const tocar = async el => { el.click(); await espera(250) };
  const llenos = () => Object.values(ev("loadPlan()")).reduce((n, d) => n + Object.values(d || {}).filter(Boolean).length, 0);
  const armame = () => doc().querySelector("#plan [data-armame]");

  // E25-semana-que-viene
  cargar({ ...MARCA }); await abrir();
  ev('openTab("semana")'); await espera(250);
  await tocar(armame()); await espera(300);
  const estaAntes = localStorage.getItem("miPlatoFacil_plan"), llenosEsta = llenos();
  const ir = doc().querySelector('#plan [data-semana-vista="1"]');
  if (ir) await tocar(ir);
  const titulo = doc().getElementById("planSemanaTitulo").textContent, vaciaProx = llenos() === 0;
  if (armame()) await tocar(armame()); await espera(300);
  const llenosProx = llenos(), estaDespues = localStorage.getItem("miPlatoFacil_plan");
  const prox = JSON.parse(localStorage.getItem("miPlatoFacil_planProxima_v1") || "null");
  const volver = doc().querySelector('#plan [data-semana-vista="0"]');
  if (volver) await tocar(volver);
  const tituloVuelta = doc().getElementById("planSemanaTitulo").textContent, llenosVuelta = llenos();
  const respaldo = JSON.parse(JSON.stringify(ev("completeBackupSnapshot(localStorage)")));
  ok("E25-semana-que-viene se arma la semana que viene sin tocar esta semana, se vuelve y entra al respaldo",
    llenosEsta === 28 && !!ir && /^Semana que viene/.test(titulo) && vaciaProx && llenosProx === 28 && estaDespues === estaAntes && !!prox && /^\d{4}-\d{2}-\d{2}$/.test(prox.lunes) && !!volver && /^Esta semana/.test(tituloVuelta) && llenosVuelta === 28 && !!respaldo.data.miPlatoFacil_planProxima_v1,
    JSON.stringify({ llenosEsta, titulo, vaciaProx, llenosProx, mismoPlan: estaDespues === estaAntes, prox: prox && prox.lunes, tituloVuelta, llenosVuelta }));

  // E25-proxima-aislada: mirando la semana que viene, nada de esta semana cambia (plan, porciones, historial, copias fechadas).
  const claves = ["miPlatoFacil_plan", "miPlatoFacil_planPortions_v1", "miPlatoFacil_planHistory_v1", "miPlatoFacil_datedWeeks_v1", "miPlatoFacil_planVars"];
  const foto = () => JSON.stringify(claves.map(k => localStorage.getItem(k)));
  const antesFoto = foto();
  ev("Semana.verSemana(1)"); await espera(200);
  if (armame()) await tocar(armame()); await espera(300);
  ev("Selector.repetirSemanaAnterior()"); await espera(200);
  const deshacerProx = doc().querySelector("#planAviso button");
  if (deshacerProx) await tocar(deshacerProx);
  ev('openTab("semana")'); await espera(200); // volver a esta semana tocando la pestaña: no queda un Deshacer de la otra semana
  const avisoVuelta = doc().getElementById("planAviso").textContent;
  ok("E25-proxima-aislada mirando la semana que viene no cambia nada de esta semana, y al volver no queda un Deshacer de la otra",
    foto() === antesFoto && !/Deshacer/.test(avisoVuelta) && /^Esta semana/.test(doc().getElementById("planSemanaTitulo").textContent), avisoVuelta);

  // E25-adopcion: cuando llega su lunes, lo armado pasa a ser el plan y la semana que termina queda en Semanas anteriores.
  const actual = ev("Semana.semanaActual()"), anterior = ev("Semana.lunesAnterior()");
  const planEsta = localStorage.getItem("miPlatoFacil_plan");
  const proxGuardada = JSON.parse(localStorage.getItem("miPlatoFacil_planProxima_v1"));
  localStorage.setItem("miPlatoFacil_planPortions_v1", JSON.stringify({ "lunes|cena": 4 }));
  localStorage.setItem("miPlatoFacil_planProxima_v1", JSON.stringify({ lunes: actual, plan: proxGuardada.plan }));
  await abrir(); ev("loadPlan()");
  const adoptado = JSON.stringify(ev("loadPlan()")) === JSON.stringify(ev("Semana.migratePlan(" + JSON.stringify(proxGuardada.plan) + ")"));
  const copias = ev("loadDatedWeeks()"), copiaAnterior = !!copias[anterior];
  const sinClave = localStorage.getItem("miPlatoFacil_planProxima_v1") === null;
  const porciones = JSON.parse(localStorage.getItem("miPlatoFacil_planPortions_v1") || "{}");
  const planTrasUna = localStorage.getItem("miPlatoFacil_plan"), copiasTrasUna = localStorage.getItem("miPlatoFacil_datedWeeks_v1");
  await abrir(); ev("loadPlan()");
  const dosVeces = localStorage.getItem("miPlatoFacil_plan") === planTrasUna && localStorage.getItem("miPlatoFacil_datedWeeks_v1") === copiasTrasUna;
  ok("E25-adopcion la semana que viene pasa a ser el plan en su lunes, la que termina queda copiada, las porciones viejas no se aplican y correrlo dos veces no cambia nada",
    adoptado && planTrasUna !== planEsta && copiaAnterior && sinClave && porciones["lunes|cena"] === undefined && dosVeces,
    JSON.stringify({ adoptado, copiaAnterior, sinClave, porciones, dosVeces }));

  // E25-pasada: una semana que viene que ya pasó sin abrir la app va a Semanas anteriores y no toca el plan.
  const haceDos = ev(`(() => { const d = new Date(Semana.semanaActual() + "T12:00:00"); d.setDate(d.getDate() - 14); return Rutina.localTrainingDate(d) })()`);
  const planAntes = localStorage.getItem("miPlatoFacil_plan");
  localStorage.setItem("miPlatoFacil_planProxima_v1", JSON.stringify({ lunes: haceDos, plan: proxGuardada.plan }));
  await abrir(); ev("loadPlan()");
  ok("E25-pasada una semana que viene que ya pasó va a Semanas anteriores sin tocar el plan",
    !!ev("loadDatedWeeks()")[haceDos] && localStorage.getItem("miPlatoFacil_plan") === planAntes && localStorage.getItem("miPlatoFacil_planProxima_v1") === null);

  // E25-desayunos: con la semana armada, ningún desayuno o merienda sin proteína.
  const sinProteina = ev(`(() => { const plan = loadPlan(), by = new Map(MisPlatos.loadSaved().map(x => [x.id, x])); let n = 0, total = 0;
    for (const d of Object.values(plan)) for (const s of ["desayuno", "merienda"]) { const it = by.get((d || {})[s]); if (!it) continue; total++;
      if (savedItemLines(it).some(l => /^Proteína: No elegido/.test(l))) n++ } return [n, total] })()`);
  ok("E25-desayunos ningún desayuno ni merienda armado queda sin proteína", sinProteina[1] > 0 && sinProteina[0] === 0, JSON.stringify(sinProteina));

  // E25-ficha: desde Completar precios, precio primero y formulario abierto, sin botón para abrirlo.
  ev('openTab("semana")'); await espera(250);
  const completar = doc().querySelector("[data-completar-precios]");
  let fichaOk = false, detalle = "sin Completar precios";
  if (completar) {
    await tocar(completar);
    const fila = doc().querySelector(".completar-precios__fila");
    if (fila) {
      await tocar(fila);
      const hoja = [...doc().querySelectorAll(".hoja")].find(h => h.getClientRects().length && h.querySelector(".ficha-precio"));
      const html = hoja ? hoja.innerHTML : "", form = hoja && hoja.querySelector(".ficha-precio__form");
      const abrirBoton = !!(hoja && hoja.querySelector("[data-ficha-precio-abrir]"));
      const precioAntes = html.indexOf("ficha-precio") >= 0 && html.indexOf("ficha-precio") < html.search(/Energía|kcal/);
      fichaOk = !!form && !form.hidden && form.getClientRects().length > 0 && !abrirBoton && precioAntes;
      detalle = JSON.stringify({ form: !!form, visible: !!form && !form.hidden, abrirBoton, precioAntes });
    } else detalle = "sin filas";
  } else {
    // Si no falta ningún precio, se prueba la ficha desde una comida: formulario abierto y sin botón para abrirlo.
    ev("hoja.cerrar()");
    ev('Comidas.abrirNutrientesDeIngrediente("Arroz")'); await espera(250);
    const hoja = [...doc().querySelectorAll(".hoja")].find(h => h.getClientRects().length && h.querySelector(".ficha-precio"));
    const form = hoja && hoja.querySelector(".ficha-precio__form");
    fichaOk = !!form && !form.hidden && !hoja.querySelector("[data-ficha-precio-abrir]");
    detalle = "desde una comida";
  }
  ok("E25-ficha la ficha de un ingrediente muestra el formulario de Mi precio sin botón para abrirlo y, desde Completar precios, el precio primero", fichaOk, detalle);
  ev("hoja.cerrar()");

  // E25-texto
  const pista = [...doc().querySelectorAll("#comidaPlato .screen__hint")].map(p => p.textContent).join(" ");
  ok("E25-texto el detalle de una comida dice que tocando un ingrediente se ven nutrientes y precio", /Tocá un ingrediente para ver sus nutrientes y su precio/.test(pista), pista);

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
