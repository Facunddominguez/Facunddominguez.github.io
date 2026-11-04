// E14: Etapa 14 del rediseño (Bienvenida con presupuesto). C14-1 y C14-2 son los controles E14-cargar-o-saltar y E14-se-ve-en-semana-y-compras de
// docs/validacion/criterios.json. La app se abre en un marco aparte. Datos inventados.
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
  const $ = id => { const e = doc().getElementById(id); if (!e) throw Error("no está en la pantalla: #" + id); return e };
  const q = s => { const e = doc().querySelector(s); if (!e) throw Error("no está en la pantalla: " + s + " (pantalla: " + ev("stack.at(-1)") + ")"); return e };
  const tocar = async el => { el.click(); await espera(120) };
  const cambiar = async (el, v) => { el.value = v; el.dispatchEvent(new w.Event("input", { bubbles: true })); el.dispatchEvent(new w.Event("change", { bubbles: true })); await espera(60) };
  const HOGAR = "miPlatoFacil_hogar_v1", PRES = "miPlatoFacil_shoppingBudget_v1", REG = "miPlatoFacil_region_v1", MARCA = "miPlatoFacil_bienvenida_v1";

  // Recorre la bienvenida hasta armar la semana con 3 ideas; "cargar" es lo que se completa en el paso de personas y presupuesto.
  const recorrer = async cargar => {
    localStorage.clear(); await abrir();
    const empezo = ev("stack.at(-1)") === "bienvenida";
    await tocar(q('#bienvenida [data-bienvenida-paso="1"] [data-bienvenida-siguiente]'));
    await tocar(q('#bienvenida [data-bienvenida-paso="2"] [data-bienvenida-siguiente]'));
    const paso = $("bienvenidaPaso").textContent;
    let error = "";
    if (cargar) {
      if (cargar.personas) await cambiar($("bienvenidaPersonas"), String(cargar.personas));
      if (cargar.presupuesto) await cambiar($("bienvenidaPresupuesto"), cargar.presupuesto);
      if (cargar.region) await cambiar($("bienvenidaRegion"), cargar.region);
      await tocar(q("#bienvenida [data-bienvenida-hogar]"));
      error = $("bienvenidaHogarEstado").textContent;
    } else await tocar(q('#bienvenida [data-bienvenida-paso="3"] [data-bienvenida-siguiente]'));
    const enIdeas = ev("bienvenidaPaso") === 4 && $("bienvenidaPaso").textContent === "Paso 4 de 4";
    if (enIdeas) {
      for (let i = 1; i <= 3; i++) await tocar(q("#bienvenidaIdeas [data-bienvenida-idea]:nth-child(" + i + ")"));
      await tocar(q("#bienvenida [data-bienvenida-armar]"));
    }
    return { empezo, paso, enIdeas, error, enSemana: ev("stack.at(-1)") === "plan" };
  };

  // C14-1 Completar o saltar la bienvenida funciona con 0, 1 o 3 datos cargados, y solo se guarda lo cargado.
  const r0 = await recorrer(null);
  const claves0 = [HOGAR, PRES, REG].map(k => localStorage.getItem(k));
  const r1 = await recorrer({ personas: 3 });
  const claves1 = [HOGAR, PRES, REG].map(k => localStorage.getItem(k));
  const r3 = await recorrer({ personas: 2, presupuesto: "45.000", region: "Pampeana" });
  const claves3 = [HOGAR, PRES, REG].map(k => localStorage.getItem(k));
  const rMalo = await recorrer({ presupuesto: "abc" });
  const clavesMalo = [HOGAR, PRES, REG, MARCA].map(k => localStorage.getItem(k));
  ok("C14-1 completar o saltar la bienvenida funciona con 0, 1 o 3 datos y solo guarda lo cargado",
    r0.empezo && r0.paso === "Paso 3 de 4" && r0.enIdeas && r0.enSemana && claves0.every(x => x === null) &&
    r1.enIdeas && r1.enSemana && claves1[0] === '{"personas":3}' && claves1[1] === null && claves1[2] === null &&
    r3.enIdeas && r3.enSemana && claves3[0] === '{"personas":2}' && JSON.parse(claves3[1]).limit === 45000 && JSON.parse(claves3[1]).period === "semana" && claves3[2] === '{"region":"Pampeana"}' &&
    !rMalo.enIdeas && /mayor que 0/.test(rMalo.error) && clavesMalo.every(x => x === null),
    JSON.stringify({ r0, claves0, r1, claves1, r3, claves3, rMalo, clavesMalo }));

  // C14-2 Lo cargado se ve en Semana y Compras (la barra de presupuesto, el costo de la semana y Preferencias).
  await recorrer({ personas: 2, presupuesto: "45.000", region: "Pampeana" });
  ev('openTab("compras")'); await espera(200);
  const barra = $("comprasPresupuesto").textContent;
  ev('openTab("semana")'); await espera(200);
  const t = $("planSemanaTitulo") && true;
  const costos = ev("costosDelPlan()"), conHogar = ev("personasHogar()"), region = ev("regionPrecios()");
  ev('go("preferencias")'); await espera(150);
  const prefs = { personas: $("hogarPersonas").value, region: $("preciosRegion").value };
  ok("C14-2 lo cargado en la bienvenida se ve en Compras (barra de presupuesto), Semana (costo para el hogar) y Preferencias",
    /45\.000/.test(barra) && conHogar === 2 && region === "Pampeana" && t && prefs.personas === "2" && prefs.region === "Pampeana", JSON.stringify({ barra, conHogar, region, prefs, costos }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
