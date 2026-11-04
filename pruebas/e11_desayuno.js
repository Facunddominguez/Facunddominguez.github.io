// E11: Etapa 11 del rediseño (Desayuno y comidas completas). C11-1 a C11-4 son los controles E11-dos-frutas, E11-sin-galletas-ni-harina,
// E11-ideas-completas y E11-selector-sin-repetidos de docs/validacion/criterios.json. La app se abre en un marco aparte. Datos inventados.
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
  const q = s => { const e = doc().querySelector(s); if (!e) throw Error("no está en la pantalla: " + s + " (pantalla: " + ev("stack.at(-1)") + ")"); return e };
  const tocar = async el => { el.click(); await espera(120) };
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };

  // C11-1 Dos frutas en un desayuno: el paso no avanza solo, el tope es 3 y el estado queda en un solo objeto.
  cargar(MARCA); await abrir();
  ev('start("desayuno")'); await espera(150);
  await tocar(q('#fruit [data-name="Banana"]'));
  const sigueAhi = ev("stack.at(-1)") === "bf_fruit";
  await tocar(q('#fruit [data-name="Manzana"]'));
  const dos = ev("JSON.stringify(state.fruta)");
  await tocar(q('#fruit [data-name="Pera"]'));
  const cuartaBloqueada = q('#fruit [data-name="Kiwi"]').disabled === true;
  await tocar(q('#fruit [data-name="Pera"]'));
  await tocar(q('#fruitForms [data-fruta-forma="Licuado"]'));
  const texto = ev("frutaTexto(state.fruta)");
  const compra = ev("JSON.stringify(Semana.extractIngredients({state:{fruta:state.fruta}}))");
  await tocar(q("#nextBottom"));
  ok("C11-1 se pueden elegir 2 frutas en un desayuno, no avanza solo, el tope es 3 y se compran las dos",
    sigueAhi && dos === JSON.stringify({ name: "Banana + Manzana", quantity: "1 unidad + 1 unidad", forma: "Entera" }) && cuartaBloqueada && texto === "Licuado de banana y manzana" && compra === JSON.stringify(["Banana", "Manzana"]) && ev("stack.at(-1)") === "bf_prot",
    JSON.stringify({ sigueAhi, dos, cuartaBloqueada, texto, compra, pantalla: ev("stack.at(-1)") }));
  // "En una preparación" muestra las cuatro preparaciones; un desayuno viejo con "Porción de galletas" se sigue mostrando.
  ev('go("bf_fruit")'); await espera(100);
  await tocar(q("#fruitForms [data-fruta-prep]"));
  const preps = [...doc().querySelectorAll("#fruitPreps [data-fruta-forma]")].map(b => b.textContent);
  await tocar(q('#fruitPreps [data-fruta-forma="Waffle"]'));
  const viejo = ev('frutaTexto({name:"Banana",quantity:"1 unidad",forma:"Porción de galletas"})');
  ok("C11-1b las preparaciones salen de \"En una preparación\" y lo guardado con galletas se sigue mostrando", preps.join() === "Budín,Tarta,Waffle,Panqueque" && ev("state.fruta.forma") === "Waffle" && ev("frutaTexto(state.fruta)") === "Waffle de banana y manzana" && viejo === "Galletas con banana", JSON.stringify({ preps, viejo }));

  // C11-2 Ninguna opción del desayuno contiene "galletas" ni "harina".
  const opciones = [];
  for (const id of ["fruit", "fruitForms", "fruitPreps", "bfprot", "bfcarb", "bffat"]) doc().querySelectorAll("#" + id + " button").forEach(b => opciones.push(norm(b.textContent)));
  for (const k of ["frutaFormas", "frutaPreparaciones"]) ev("data." + k).forEach(x => opciones.push(norm(x)));
  for (const k of ["frutas", "bfprot", "bfcarb", "bffat"]) ev("data." + k).forEach(x => opciones.push(norm(x[0] + " " + x[1])));
  const malas = opciones.filter(t => /galleta|harina/.test(t));
  ok("C11-2 ninguna opción del desayuno contiene \"galletas\" ni \"harina\"", opciones.length > 40 && !malas.length, malas.join(" | "));

  // C11-3 El 100 % de las ideas de almuerzo o cena tiene verduras, almidón y proteína vinculados.
  const faltan = ev(`data.menuCatalog.filter(i => { const g = i.ingredientes || {}; const n = (...ks) => ks.reduce((t, k) => t + (Array.isArray(g[k]) ? g[k].length : 0), 0); return !(n("verduras") && n("almidones", "legCarb") && n("proteinas", "legProt")) }).map(i => i.text)`);
  ok("C11-3 el 100 % de las ideas de almuerzo o cena tiene verduras, almidón y proteína", ev("data.menuCatalog.length") >= 40 && !faltan.length, faltan.join(" | "));
  // Y la idea completada se guarda sin "No elegido".
  const filet = ev('(() => { const i = data.menuCatalog.find(x => x.text.startsWith("Filet de pescado")); const r = IdeasHoja.guardarIdea(i, "Día libre").item; return JSON.stringify((r.state.almidones || []).map(o => o.name)) })()');
  ok("C11-3b \"Filet de pescado con verduras salteadas\" se guarda con almidón", filet === '["Papa"]', filet);

  // C11-4 Ningún nombre se repite en el selector (una idea ya guardada aparece solo en Mis comidas).
  cargar(MARCA); await abrir();
  ev('IdeasHoja.guardarIdea(data.menuCatalog[0], "Día libre")'); ev('IdeasHoja.guardarIdea(data.menuCatalog[1], "Día libre")');
  ev('openTab("semana")'); await espera(150);
  ev('abrirSelector("lunes", "almuerzo")'); await espera(200);
  const nombres = [...doc().querySelectorAll(".selector-seccion .selector-item__nombre")].map(e => norm(e.textContent.replace(/^[^\p{L}\p{N}]+/u, "").replace(/\s*·.*$/, "")));
  const repetidos = nombres.filter((n, i) => nombres.indexOf(n) !== i);
  const idea0 = norm(ev("data.menuCatalog[0].text"));
  const secciones = [...doc().querySelectorAll(".selector-seccion")].map(s => ({ c: s.dataset.selectorSeccion, n: [...s.querySelectorAll(".selector-item__nombre")].map(e => norm(e.textContent.replace(/^[^\p{L}\p{N}]+/u, ""))) }));
  const enMias = secciones.find(s => s.c === "mias").n.some(n => n.startsWith(idea0.slice(0, 30)));
  const enIdeas = secciones.find(s => s.c === "ideas").n.some(n => n.startsWith(idea0.slice(0, 30)));
  ok("C11-4 ningún nombre se repite en el selector y una idea guardada aparece solo en Mis comidas", nombres.length > 4 && !repetidos.length && enMias && !enIdeas, JSON.stringify({ repetidos, enMias, enIdeas }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
