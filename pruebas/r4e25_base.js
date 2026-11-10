// R4-25: Etapa 25 de la Ronda 4 ("Base en verde"). Controles R4-25-bienvenida y R4-25-costo de docs/validacion/criterios.json.
// (R4-25-verde, R4-25-independiente, R4-25-datos y R4-25-tamano los cubren probar.mjs, pruebas/sepa-lector.mjs y construir.mjs.)
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
  const tocar = async el => { el.click(); await espera(250) };
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };
  const pantallaActiva = () => (doc().querySelector(".screen.is-active") || {}).id;

  // R4-25-verde: la app de las pruebas usa los precios congelados, no el datos/precios.json del día.
  cargar({}); await abrir();
  const congelado = await (await fetch("/datos/precios.json", { cache: "no-store" })).text(), fixture = await (await fetch("/tests/fixtures/precios-congelados.json", { cache: "no-store" })).text();
  ok("R4-25-verde las pruebas corren con los precios congelados: el JSON incrustado en la app y el que se sirve son los de pruebas/fixtures/precios-congelados.json",
    ev("JSON.stringify(PRECIOS_SNAPSHOT)") === JSON.stringify(JSON.parse(fixture)) && JSON.stringify(JSON.parse(congelado)) === JSON.stringify(JSON.parse(fixture)), "revisado " + ev("PRECIOS_SNAPSHOT.revisado"));

  // R4-25-bienvenida: después de "Armar mi semana" y de "Saltar", tocar Hoy muestra la pantalla home (no el paso 4).
  for (const camino of ["armar", "saltar"]) {
    cargar({}); await abrir();
    if (pantallaActiva() !== "bienvenida") ev("Bienvenida.abrirBienvenida()");
    await espera(200);
    if (camino === "armar") {
      ev("bienvenidaPaso = 4");
      ev("Bienvenida.pintarBienvenida()");
      for (const idea of ev("Bienvenida.ideasParaArrancar().slice(0, 3).map(i => i.text)")) await tocar(doc().querySelector(`[data-bienvenida-idea="${idea.replace(/"/g, '\\"')}"]`));
      await tocar(doc().querySelector("#bienvenida [data-bienvenida-armar]"));
      await espera(500);
    } else await tocar(doc().querySelector("#bienvenida [data-bienvenida-saltar]"));
    const enSemana = camino === "armar" ? pantallaActiva() === "plan" : pantallaActiva() === "home";
    await tocar(doc().querySelector('#sectionNav [data-section-tab="hoy"]'));
    ok(`R4-25-bienvenida después de ${camino === "armar" ? "Armar mi semana" : "Saltar"}, tocar Hoy muestra la pantalla home`,
      enSemana && pantallaActiva() === "home", "pantalla: " + pantallaActiva() + " · antes: " + enSemana);
  }

  // R4-25-costo: después de "Rehacer la semana entera", #planDiaCosto y el costo de cada hueco no cambian al ir a otra pestaña y volver.
  cargar({ ...MARCA, miPlatoFacil_shoppingBudget_v1: JSON.stringify({ currency: "ARS", limit: 80000, period: "semana" }) }); await abrir();
  ev('openTab("semana")'); await espera(250);
  ev('ArmameSemana.correr("vacios")'); await espera(400);
  ev('ArmameSemana.correr("todo")'); await espera(400);
  const huecos = () => [...doc().querySelectorAll("#planList .hueco")].map(h => (h.querySelector(".hueco__costo") || { textContent: "" }).textContent);
  const a = { dia: texto("planDiaCosto"), huecos: huecos() };
  ev('openTab("compras")'); await espera(250); ev('openTab("semana")'); await espera(300);
  const b = { dia: texto("planDiaCosto"), huecos: huecos() };
  ok("R4-25-costo después de 'Rehacer la semana entera', el costo del día y el de cada hueco son los mismos antes y después de ir a otra pestaña y volver, y los 4 huecos muestran costo",
    a.dia !== "" && a.dia === b.dia && JSON.stringify(a.huecos) === JSON.stringify(b.huecos) && a.huecos.length === 4 && a.huecos.every(x => /\$/.test(x)), JSON.stringify({ a, b }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
